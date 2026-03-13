import React from 'react';
import { Ticket, TicketStatus, User, UserRole } from '../types';
import { ICONS } from '../constants';

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
  const canManage = currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.ADMIN;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-teams-purple animate-spin">
           <ICONS.Spinner />
        </div>
        <span className="ml-2 text-gray-500">Cargando tickets...</span>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">No se encontraron tickets activos.</p>
        <p className="text-sm text-gray-400 mt-1">Crea un nuevo ticket para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const hasUnread = (ticket.unreadCount || 0) > 0;
        const messageCount = ticket.messageCount || 0;
        
        return (
          <div 
            key={ticket.id} 
            className={`bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 ${hasUnread ? 'border-l-4 border-l-blue-500' : 'border-gray-200'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 cursor-pointer" onClick={() => onSelectTicket(ticket)}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${statusColors[ticket.estado]}`}>
                    {ticket.estado}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {ticket.tipo}
                  </span>
                  
                  {ticket.prioridad && (
                    <span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${
                      ticket.prioridad === 'Crítica' ? 'bg-purple-100 text-purple-700' :
                      ticket.prioridad === 'Alta' ? 'bg-orange-100 text-orange-700' :
                      ticket.prioridad === 'Baja' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {ticket.prioridad}
                    </span>
                  )}
                  
                  {/* Message Indicators */}
                  {messageCount > 0 && (
                    <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      hasUnread 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {/* We use inline SVG here to control the fill property dynamically */}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill={hasUnread ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                      </svg>
                      <span>{messageCount}</span>
                      {hasUnread && <span className="text-[10px] font-bold ml-1">({ticket.unreadCount} nuevos)</span>}
                    </span>
                  )}
                </div>
                <h3 className={`text-gray-800 font-medium mt-1 hover:text-teams-purple transition-colors ${hasUnread ? 'font-bold' : ''}`}>
                  {ticket.descripcion}
                </h3>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                  <span>{ticket.userName} · {new Date(ticket.fecha).toLocaleString()}</span>
                  {ticket.technicianName && (
                    <span className="flex items-center gap-1 text-teams-purple bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                      <ICONS.User size={10} /> {ticket.technicianName}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex flex-col space-y-2 ml-4 items-end">
                 <button 
                    onClick={() => onSelectTicket(ticket)}
                    className={`p-1 flex items-center text-xs mb-1 ${hasUnread ? 'text-blue-600 font-semibold' : 'text-gray-400 hover:text-teams-purple'}`}
                    title="Ver conversación"
                 >
                   <ICONS.MessageCircle />
                   <span className="ml-1">Ver</span>
                 </button>

                 {/* Only show status action buttons if user is Admin or Technician */}
                 {canManage && (
                  <>
                     {ticket.estado === TicketStatus.PENDING && (
                       <button
                         onClick={() => onStatusChange(ticket.id, TicketStatus.IN_PROGRESS)}
                         className="text-xs bg-teams-purple text-white px-3 py-1 rounded hover:bg-opacity-90 transition-colors whitespace-nowrap"
                       >
                         Comenzar
                       </button>
                     )}
                     
                     {ticket.estado === TicketStatus.IN_PROGRESS && (
                       <button
                         onClick={() => onStatusChange(ticket.id, TicketStatus.RESOLVED)}
                         className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                       >
                         Resolver
                       </button>
                     )}
                     
                     {ticket.estado === TicketStatus.RESOLVED && (
                       <button
                         onClick={() => onStatusChange(ticket.id, TicketStatus.PENDING)}
                         className="text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
                       >
                         Reabrir
                       </button>
                     )}
                  </>
                 )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};