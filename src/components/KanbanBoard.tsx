import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Ticket, TicketStatus, TicketClassification, User, UserRole } from '../types';
import { classificationService } from '../services/classificationService';
import { ICONS, PRIORITY_COLORS } from '../constants';

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (id: number, status: TicketStatus) => void;
  onSelectTicket: (ticket: Ticket) => void;
  onClassificationChange?: (id: number, classificationId: string) => void;
  currentUser?: User | null;
}

const statusConfig = {
  [TicketStatus.PENDING]: { title: 'Pendiente', color: 'border-red-500', bg: 'bg-red-50' },
  [TicketStatus.IN_PROGRESS]: { title: 'En Progreso', color: 'border-yellow-500', bg: 'bg-yellow-50' },
  [TicketStatus.RESOLVED]: { title: 'Resuelto', color: 'border-green-500', bg: 'bg-green-50' },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tickets, 
  onStatusChange, 
  onSelectTicket, 
  onClassificationChange,
  currentUser
}) => {
  const [groupBy, setGroupBy] = useState<'status' | 'classification'>('status');
  const [classifications, setClassifications] = useState<TicketClassification[]>([]);

  useEffect(() => {
    const loadClassifications = async () => {
      const data = await classificationService.getClassifications();
      setClassifications(data);
    };
    loadClassifications();
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const id = Number(draggableId);
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    // Normalize role check (handle potential DB case differences)
    const userRole = currentUser?.role?.toString().toUpperCase();
    const isUser = userRole === 'USER';

    console.log(`[KanbanBoard] User: ${currentUser?.name}, Role: ${userRole}, isUser: ${isUser}`);

    if (groupBy === 'status') {
      const newStatus = destination.droppableId as TicketStatus;
      
      // SECURITY: Regular users can ONLY drag to RE-OPEN (from Resolved to other status)
      if (isUser && ticket.estado !== TicketStatus.RESOLVED) {
        console.warn(`[Security] User ${currentUser?.name} tried to move a non-resolved ticket.`);
        return;
      }

      // Enforce classification for resolved status
      if (newStatus === TicketStatus.RESOLVED && !ticket.classificationId) {
        alert('Por favor, clasifica el ticket antes de resolverlo. Esto es necesario para las estadísticas de salud IT.');
        return;
      }

      onStatusChange(id, newStatus);
    } else {
      // Regular users cannot reclassify
      if (isUser) {
        console.warn(`[Security] User ${currentUser?.name} tried to reclassify a ticket via drag.`);
        return;
      }

      const newClassificationId = destination.droppableId === 'unclassified' ? '' : destination.droppableId;
      if (onClassificationChange) {
        onClassificationChange(id, newClassificationId);
      }
    }
  };

  const renderTicketCard = (ticket: Ticket, index: number) => {
    const hasUnread = (ticket.unreadCount || 0) > 0;
    const messageCount = ticket.messageCount || 0;
    
    // Normalize role check
    const userRole = currentUser?.role?.toString().toUpperCase();
    const isUser = userRole === 'USER';
    const isAdminOrTech = userRole === 'ADMIN' || userRole === 'TECHNICIAN' || userRole === 'LEAD_TECHNICIAN';

    // Regular users can only drag tickets that are RESOLVED (to re-open them)
    // Technicians and Admins can always drag
    const canDrag = isAdminOrTech || (isUser && groupBy === 'status' && ticket.estado === TicketStatus.RESOLVED);

    return (
      <Draggable key={ticket.id.toString()} draggableId={ticket.id.toString()} index={index} isDragDisabled={!canDrag}>
        {(provided: { innerRef: any; draggableProps: any; dragHandleProps: any }, snapshot: { isDragging: boolean }) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => onSelectTicket(ticket)}
            className={`bg-white p-3 rounded-xl shadow-sm border mb-3 transition-all ${
              snapshot.isDragging ? 'shadow-lg rotate-1 scale-[1.02] z-50' : 'hover:shadow-md'
            } ${
              ticket.prioridad === 'Crítica' ? 'border-l-4 border-l-purple-500' : 
              hasUnread ? 'border-l-4 border-l-teams-purple ring-1 ring-teams-purple/5' : 
              'border-gray-200'
            } ${
              !canDrag ? 'cursor-default opacity-85 hover:bg-gray-50' : 'cursor-grab bg-white'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1">
                {!canDrag && isUser && <div title="Solo visualización"><ICONS.Shield size={10} className="text-gray-300" /></div>}
                <span className="text-[10px] font-bold text-gray-400">#{ticket.id}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {ticket.prioridad && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${PRIORITY_COLORS[ticket.prioridad as keyof typeof PRIORITY_COLORS] || 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                    {ticket.prioridad}
                  </span>
                )}
                {ticket.estado === TicketStatus.PENDING && ticket.queuePosition !== undefined && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase flex items-center gap-[2px] ${
                    ticket.queuePosition <= 2 
                      ? 'bg-green-100 text-green-700 border-green-200 animate-pulse drop-shadow-[0_0_2px_rgba(34,197,94,0.3)]' 
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`} aria-label={`Posición en cola: ${ticket.queuePosition} tickets delante`}>
                    <ICONS.List size={8} />
                    {ticket.queuePosition === 0 ? 'Siguiente' : `${ticket.queuePosition} delante`}
                  </span>
                )}
                <span className="text-[9px] font-bold text-teams-purple bg-teams-purple/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {ticket.tipo}
                </span>
              </div>
            </div>
            
            <h4 className={`text-sm text-gray-800 line-clamp-2 leading-snug mb-3 ${hasUnread ? 'font-bold' : 'font-medium'}`}>
              {ticket.titulo || ticket.descripcion}
            </h4>

            <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-full bg-teams-purple/10 flex items-center justify-center text-[10px] font-bold text-teams-purple">
                  {ticket.userName.charAt(0)}
                </div>
                <div className="text-[10px] text-gray-500 truncate font-medium">
                  {ticket.userName}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 shrink-0">
                {ticket.classificationId && (
                  <span className="text-[8px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                    {classifications.find(c => c.id === ticket.classificationId)?.name.split(' ')[0]}
                  </span>
                )}
                {ticket.hasAttachments && (
                  <ICONS.Paperclip size={10} className="text-gray-400" />
                )}
                {ticket.hasMessages && (
                  <div className="relative">
                    <div className={`flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${hasUnread ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-white' : 'bg-gray-100 text-gray-500'}`}>
                      <div className="relative flex items-center gap-1">
                        <ICONS.MessageCircle 
                          size={14} 
                          className={hasUnread ? "text-white" : "text-gray-500"}
                          fill={hasUnread ? "white" : "none"} 
                        />
                        {hasUnread && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white font-bold ring-1 ring-white animate-bounce-slow">
                            {(ticket.unreadCount || 1)}
                          </span>
                        )}
                        <span>{messageCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const renderColumn = (id: string, title: string, columnTickets: Ticket[], statusColor?: string) => {
    return (
      <div key={id} className="flex-1 min-w-[300px] flex flex-col h-full bg-[#F5F5F7] rounded-xl border border-gray-200/50">
        <div className={`p-3 font-bold text-gray-700 flex justify-between items-center border-b ${statusColor || 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor?.replace('border', 'bg') || 'bg-teams-purple'}`} />
            <span className="text-xs uppercase tracking-widest">{title}</span>
          </div>
          <span className="bg-white/80 border border-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {columnTickets.length}
          </span>
        </div>
        
        <Droppable droppableId={id}>
          {(provided: { innerRef: any; droppableProps: any; placeholder: any }, snapshot: { isDraggingOver: boolean }) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors duration-200 ${
                snapshot.isDraggingOver ? 'bg-teams-purple/5' : ''
              }`}
            >
              {columnTickets.map((t, index) => renderTicketCard(t, index))}
              {provided.placeholder}
              
              {columnTickets.length === 0 && !snapshot.isDraggingOver && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10 opacity-50">
                  <ICONS.LayoutGrid size={24} className="mb-2" />
                  <p className="text-[10px] font-medium uppercase tracking-tighter">Sin tickets</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <ICONS.LayoutGrid size={14} className="text-teams-purple" />
          Tablero Kanban {groupBy === 'status' ? '(Estado)' : '(Clasificación)'}
        </h3>
        <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-inner">
          <button
            onClick={() => setGroupBy('status')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${groupBy === 'status' ? 'bg-white shadow-sm text-teams-purple' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Estado
          </button>
          <button
            onClick={() => setGroupBy('classification')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${groupBy === 'classification' ? 'bg-white shadow-sm text-teams-purple' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Clasificación
          </button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-5 w-full flex-1 items-stretch overflow-x-auto pb-4 custom-scrollbar">
          {groupBy === 'status' ? (
            <>
              {renderColumn(TicketStatus.PENDING, 'Pendiente', tickets.filter(t => t.estado === TicketStatus.PENDING), 'border-red-400')}
              {renderColumn(TicketStatus.IN_PROGRESS, 'En Progreso', tickets.filter(t => t.estado === TicketStatus.IN_PROGRESS), 'border-amber-400')}
              {renderColumn(TicketStatus.RESOLVED, 'Resuelto', tickets.filter(t => t.estado === TicketStatus.RESOLVED), 'border-emerald-400')}
            </>
          ) : (
            <>
              {renderColumn('unclassified', 'Sin Clasificar', tickets.filter(t => !t.classificationId), 'border-gray-400')}
              {classifications.map(c => 
                renderColumn(c.id, c.name, tickets.filter(t => t.classificationId === c.id), 'border-indigo-400')
              )}
            </>
          )}
        </div>
      </DragDropContext>
    </div>
  );
};
