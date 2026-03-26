import React from 'react';
import { Ticket, TicketStatus, User, UserRole } from '../types';
import { ICONS, PRIORITY_COLORS } from '../constants';

interface TicketListProps {
  tickets: Ticket[];
  onStatusChange: (id: number, status: TicketStatus) => void;
  onSelectTicket: (ticket: Ticket) => void;
  isLoading: boolean;
  currentUser: User;
}

const statusColors = {
  [TicketStatus.PENDING]: 'bg-red-100 text-red-800 border-red-200',
  [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800 border-green-200',
};

export const TicketList: React.FC<TicketListProps> = ({ 
  tickets, 
  onStatusChange, 
  onSelectTicket, 
  isLoading, 
  currentUser 
}) => {
  const canManage = currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.LEAD_TECHNICIAN || currentUser.role === UserRole.ADMIN;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12" aria-live="polite">
        <div className="text-teams-purple animate-spin">
           <ICONS.Spinner aria-hidden="true" />
        </div>
        <span className="ml-2 text-gray-500">Cargando tickets...</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200" aria-live="polite">
        <p className="text-gray-500">No se encontraron tickets activos.</p>
        <p className="text-sm text-gray-400 mt-1">Crea un nuevo ticket para comenzar.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4" role="list" aria-label="Lista de tickets de soporte">
      {tickets.map((ticket) => {
        const hasUnread = (ticket.unreadCount || 0) > 0;
        const messageCount = ticket.messageCount || 0;
        
        return (
          <li 
            key={ticket.id} 
            className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 ${
              ticket.prioridad === 'Crítica' ? 'border-l-4 border-l-purple-500' :
              hasUnread ? 'border-l-4 border-l-blue-500' : 
              'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-gray-400" aria-label={`ID del ticket ${ticket.id}`}>#{ticket.id}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${statusColors[ticket.estado]}`} aria-label={`Estado: ${ticket.estado}`}>
                    {ticket.estado}
                  </span>

                  {/* SLA Alert Indicator - Only for staff and only for PENDING tickets */}
                  {canManage && ticket.estado === TicketStatus.PENDING && (
                    (() => {
                      const createdDate = new Date(ticket.fecha).getTime();
                      const now = Date.now();
                      const diffHours = (now - createdDate) / (1000 * 60 * 60);
                      if (diffHours > 48) {
                        return (
                          <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold" title="Excede el SLA de 48h - Pendiente de atender">
                            <ICONS.AlertTriangle size={10} className="shrink-0" />
                            <span className="whitespace-nowrap">SLA<span className="hidden sm:inline"> ALERT</span></span>
                          </span>
                        );
                      }
                      return null;
                    })()
                  )}
                  
                  {ticket.prioridad && (
                    <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase border ${
                      PRIORITY_COLORS[ticket.prioridad as keyof typeof PRIORITY_COLORS] || 'bg-blue-100 text-blue-700 border-blue-200'
                    }`} aria-label={`Prioridad: ${ticket.prioridad}`}>
                      {ticket.prioridad}
                    </span>
                  )}
                  
                  {ticket.estado === TicketStatus.PENDING && ticket.queuePosition !== undefined && (
                    <span className={`px-2 py-0.5 text-[10px] rounded font-bold border flex items-center gap-1 shadow-sm ${
                      ticket.queuePosition <= 2 
                        ? 'bg-green-100 text-green-700 border-green-200 animate-pulse' 
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`} aria-label={`Posición en cola: ${ticket.queuePosition} tickets delante`}>
                      <ICONS.List size={10} />
                      {ticket.queuePosition === 0 
                        ? 'Siguiente en ser atendido' 
                        : `${ticket.queuePosition} ticket${ticket.queuePosition > 1 ? 's' : ''} delante`}
                    </span>
                  )}
                  
                  {ticket.hasAttachments && (
                    <span className="text-gray-400" title="Contiene archivos adjuntos">
                      <ICONS.Paperclip size={14} aria-hidden="true" />
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => onSelectTicket(ticket)}
                  className={`text-left w-full focus:outline-none focus:ring-2 focus:ring-teams-purple rounded-md p-1 -ml-1 transition-all group`}
                  aria-label={`Ver detalles del ticket #${ticket.id}: ${ticket.titulo || ticket.descripcion}`}
                >
                  <h3 className={`text-gray-800 font-medium hover:text-teams-purple transition-colors ${hasUnread ? 'font-bold' : ''}`}>
                    {ticket.titulo || ticket.descripcion}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>{ticket.userName} · {new Date(ticket.fecha).toLocaleString()}</span>
                    {ticket.technicianName && (
                      <span className="flex items-center gap-1 text-teams-purple bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 whitespace-nowrap">
                        <ICONS.User size={10} aria-hidden="true" /> {ticket.technicianName}
                      </span>
                    )}
                    {ticket.estado !== TicketStatus.RESOLVED && ticket.estimatedResolutionDate && (
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap" title={`Fecha estimada de resolución: ${new Date(ticket.estimatedResolutionDate).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`}>
                        <ICONS.Clock size={10} aria-hidden="true" />
                        Est. {new Date(ticket.estimatedResolutionDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </p>
                </button>
              </div>
              
              <div className="flex flex-col space-y-2 ml-2 sm:ml-4 items-end shrink-0">
                 <button 
                    onClick={() => onSelectTicket(ticket)}
                    className={`p-1 flex items-center text-xs mb-1 focus:outline-none focus:ring-1 focus:ring-teams-purple rounded transition-all transform hover:scale-110 ${
                      hasUnread 
                        ? 'text-blue-600 font-bold' 
                        : 'text-gray-400 hover:text-teams-purple'
                    }`}
                    aria-label={`Ver conversación del ticket #${ticket.id}: ${messageCount} mensajes, ${ticket.unreadCount || 0} nuevos`}
                 >
                    <div className="relative flex items-center">
                       <svg 
                         xmlns="http://www.w3.org/2000/svg" 
                         width="22" 
                         height="22" 
                         viewBox="0 0 24 24" 
                         fill={hasUnread ? "#EF4444" : (ticket.hasMessages ? "#9CA3AF" : "none")} 
                         stroke={hasUnread ? "#EF4444" : (ticket.hasMessages ? "#6B7280" : "currentColor")} 
                         strokeWidth={hasUnread ? "2.5" : "2"} 
                         strokeLinecap="round" 
                         strokeLinejoin="round"
                         aria-hidden="true"
                         className={`shrink-0 transition-all duration-300 ${hasUnread ? "drop-shadow-md animate-pulse" : (ticket.hasMessages ? "opacity-100" : "opacity-30")}`}
                       >
                         <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                       </svg>
                       {hasUnread && (
                         <div className="absolute -top-2 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] text-white font-black ring-2 ring-white shadow-lg animate-bounce-slow">
                           {ticket.unreadCount}
                         </div>
                       )}
                    </div>
                    {hasUnread && <span className="ml-2 text-[10px] font-black text-red-600 tracking-tighter animate-pulse">NUEVO</span>}
                    <span className={`ml-1.5 hidden sm:inline ${hasUnread ? "text-red-600 font-black" : ""}`}>Chat</span>
                 </button>

                 {canManage && (
                  <div className="flex flex-col space-y-1">
                     {ticket.estado === TicketStatus.PENDING && (
                       <button
                         onClick={() => onStatusChange(ticket.id, TicketStatus.IN_PROGRESS)}
                         className="text-[10px] sm:text-xs bg-teams-purple text-white px-2 sm:px-3 py-1 rounded hover:bg-opacity-90 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-purple-400"
                       >
                         Comenzar
                       </button>
                     )}
                     
                     {ticket.estado === TicketStatus.IN_PROGRESS && (
                       <button
                         onClick={() => onStatusChange(ticket.id, TicketStatus.RESOLVED)}
                         className="text-[10px] sm:text-xs bg-green-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-green-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-green-400"
                       >
                         Resolver
                       </button>
                     )}
                     
                     {ticket.estado === TicketStatus.RESOLVED && (
                       <button
                         onClick={() => onStatusChange(ticket.id, TicketStatus.PENDING)}
                         className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
                       >
                         Reabrir
                       </button>
                     )}
                  </div>
                 )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};