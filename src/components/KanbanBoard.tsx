import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketClassification } from '../types';
import { classificationService } from '../services/classificationService';
import { ICONS } from '../constants';

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (id: number, status: TicketStatus) => void;
  onSelectTicket: (ticket: Ticket) => void;
  onClassificationChange?: (id: number, classificationId: string) => void;
}

const statusConfig = {
  [TicketStatus.PENDING]: { title: 'Pendiente', color: 'border-red-500', bg: 'bg-red-50' },
  [TicketStatus.IN_PROGRESS]: { title: 'En Progreso', color: 'border-yellow-500', bg: 'bg-yellow-50' },
  [TicketStatus.RESOLVED]: { title: 'Resuelto', color: 'border-green-500', bg: 'bg-green-50' },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tickets, onStatusChange, onSelectTicket, onClassificationChange }) => {
  const [draggedTicketId, setDraggedTicketId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TicketStatus | null>(null);
  const [dragOverClassification, setDragOverClassification] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'status' | 'classification'>('status');
  const [classifications, setClassifications] = useState<TicketClassification[]>([]);

  useEffect(() => {
    const loadClassifications = async () => {
      const data = await classificationService.getClassifications();
      setClassifications(data);
    };
    loadClassifications();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTicketId(id);
    e.dataTransfer.setData('ticketId', id.toString());
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a ghost image or just let the browser handle it
    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedTicketId(null);
    setDragOverStatus(null);
    setDragOverClassification(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnterStatus = (status: TicketStatus) => {
    setDragOverStatus(status);
  };

  const handleDragLeaveStatus = () => {
    setDragOverStatus(null);
  };

  const handleDragEnterClassification = (id: string) => {
    setDragOverClassification(id);
  };

  const handleDragLeaveClassification = () => {
    setDragOverClassification(null);
  };

  const handleDropStatus = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    
    const id = Number(e.dataTransfer.getData('ticketId'));
    if (!id) return;

    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    // Enforce classification for resolved status
    if (status === TicketStatus.RESOLVED && !ticket.classificationId) {
      alert('Por favor, clasifica el ticket antes de resolverlo. Esto es necesario para las estadísticas de salud IT.');
      return;
    }

    if (ticket.estado !== status) {
      onStatusChange(id, status);
    }
  };

  const handleDropClassification = (e: React.DragEvent, classificationId: string) => {
    e.preventDefault();
    setDragOverClassification(null);
    
    const id = Number(e.dataTransfer.getData('ticketId'));
    if (!id) return;

    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    if (ticket.classificationId !== (classificationId || undefined)) {
      if (onClassificationChange) {
        onClassificationChange(id, classificationId);
      }
    }
  };

  const renderTicketCard = (ticket: Ticket) => {
    const hasUnread = (ticket.unreadCount || 0) > 0;
    const messageCount = ticket.messageCount || 0;

    return (
      <div
        key={ticket.id}
        draggable
        onDragStart={(e) => handleDragStart(e, ticket.id)}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectTicket(ticket)}
        className={`bg-white p-3 rounded shadow-sm border cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
          hasUnread ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
        } ${draggedTicketId === ticket.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {ticket.tipo}
          </span>
        </div>
        
        <h4 className={`text-sm text-gray-800 line-clamp-2 mb-2 ${hasUnread ? 'font-bold' : ''}`}>
          {ticket.descripcion}
        </h4>
        
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
          <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
             {ticket.userName}
          </div>
          
          <div className="flex items-center space-x-2">
            {ticket.classificationId && (
              <span className="text-[9px] bg-teams-purple/10 text-teams-purple px-1 rounded">
                {classifications.find(c => c.id === ticket.classificationId)?.name.split(' ')[0]}
              </span>
            )}
            {messageCount > 0 && (
              <div className={`flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded ${hasUnread ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-400'}`}>
                <ICONS.MessageCircle />
                <span>{messageCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStatusColumn = (status: TicketStatus) => {
    const columnTickets = tickets.filter(t => t.estado === status);
    const config = statusConfig[status];
    const isOver = dragOverStatus === status;

    return (
      <div 
        key={status}
        className={`flex-1 min-w-[280px] bg-gray-50 rounded-lg p-3 border-2 transition-all flex flex-col h-full ${
          isOver ? 'border-teams-purple bg-teams-purple/5 scale-[1.02]' : 'border-transparent'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={() => handleDragEnterStatus(status)}
        onDragLeave={handleDragLeaveStatus}
        onDrop={(e) => handleDropStatus(e, status)}
      >
        <div className={`font-semibold mb-3 pb-2 border-b-2 ${config.color} text-gray-700 flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            <span>{config.title}</span>
            {status === TicketStatus.RESOLVED && (
              <span className="text-[10px] font-normal text-gray-400">(Requiere clasificación)</span>
            )}
          </div>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{columnTickets.length}</span>
        </div>
        
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {columnTickets.length === 0 ? (
            <div className={`text-center text-gray-400 text-xs py-12 border-2 border-dashed rounded transition-colors ${
              isOver ? 'border-teams-purple text-teams-purple' : 'border-gray-200'
            }`}>
              Arrastra tickets aquí
            </div>
          ) : (
            columnTickets.map(renderTicketCard)
          )}
        </div>
      </div>
    );
  };

  const renderClassificationColumn = (classification: TicketClassification | null) => {
    const columnTickets = tickets.filter(t => 
      classification ? t.classificationId === classification.id : !t.classificationId
    );
    const title = classification ? classification.name : 'Sin clasificar';
    const id = classification ? classification.id : '';
    const isOver = dragOverClassification === id;

    return (
      <div 
        key={id || 'unclassified'}
        className={`flex-1 min-w-[280px] bg-gray-50 rounded-lg p-3 border-2 transition-all flex flex-col h-full ${
          isOver ? 'border-teams-purple bg-teams-purple/5 scale-[1.02]' : 'border-transparent'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={() => handleDragEnterClassification(id)}
        onDragLeave={handleDragLeaveClassification}
        onDrop={(e) => handleDropClassification(e, id)}
      >
        <div className={`font-semibold mb-3 pb-2 border-b-2 border-teams-purple text-gray-700 flex justify-between items-center`}>
          <span>{title}</span>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{columnTickets.length}</span>
        </div>
        
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {columnTickets.length === 0 ? (
            <div className={`text-center text-gray-400 text-xs py-12 border-2 border-dashed rounded transition-colors ${
              isOver ? 'border-teams-purple text-teams-purple' : 'border-gray-200'
            }`}>
              Arrastra tickets aquí
            </div>
          ) : (
            columnTickets.map(renderTicketCard)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex justify-end mb-4">
        <div className="bg-white border border-gray-200 rounded-md inline-flex text-sm">
          <button
            onClick={() => setGroupBy('status')}
            className={`px-3 py-1.5 rounded-l-md transition-colors ${groupBy === 'status' ? 'bg-teams-purple text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Por Estado
          </button>
          <button
            onClick={() => setGroupBy('classification')}
            className={`px-3 py-1.5 rounded-r-md transition-colors ${groupBy === 'classification' ? 'bg-teams-purple text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Por Clasificación
          </button>
        </div>
      </div>
      
      <div className="flex gap-4 w-full flex-1 items-stretch overflow-x-auto pb-2">
        {groupBy === 'status' ? (
          <>
            {renderStatusColumn(TicketStatus.PENDING)}
            {renderStatusColumn(TicketStatus.IN_PROGRESS)}
            {renderStatusColumn(TicketStatus.RESOLVED)}
          </>
        ) : (
          <>
            {renderClassificationColumn(null)}
            {classifications.map(c => renderClassificationColumn(c))}
          </>
        )}
      </div>
    </div>
  );
};