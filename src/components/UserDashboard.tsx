import React from 'react';
import { Ticket, TicketStatus } from '../types';
import { ICONS } from '../constants';

interface UserDashboardProps {
  tickets: Ticket[];
  onCreateTicket: () => void;
  onViewTickets: (view: 'list' | 'kanban') => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ tickets, onCreateTicket, onViewTickets }) => {
  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.estado === TicketStatus.PENDING).length,
    inProgress: tickets.filter(t => t.estado === TicketStatus.IN_PROGRESS).length,
    resolved: tickets.filter(t => t.estado === TicketStatus.RESOLVED).length,
  };

  const pendingPercentage = stats.total > 0 ? (stats.pending / stats.total) * 100 : 0;
  const inProgressPercentage = stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0;
  const resolvedPercentage = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-gray-500">Resumen del estado de tus solicitudes de soporte</p>
        </div>
        <button
          onClick={onCreateTicket}
          className="bg-teams-purple text-white px-4 py-2 rounded-md font-medium hover:bg-[#4b4e91] transition-all flex items-center gap-2 shadow-sm"
        >
          <ICONS.Plus size={18} />
          Nuevo Ticket
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <span className="text-gray-500 text-sm font-medium">Tickets Totales</span>
          <span className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</span>
          <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-400" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-sm font-medium">Pendientes</span>
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Atención</span>
          </div>
          <span className="text-3xl font-bold text-gray-800 mt-1">{stats.pending}</span>
          <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${pendingPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col border-l-4 border-l-yellow-500">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-sm font-medium">En Proceso</span>
            <span className="bg-yellow-50 text-yellow-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Activo</span>
          </div>
          <span className="text-3xl font-bold text-gray-800 mt-1">{stats.inProgress}</span>
          <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${inProgressPercentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-sm font-medium">Resueltos</span>
            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Listo</span>
          </div>
          <span className="text-3xl font-bold text-gray-800 mt-1">{stats.resolved}</span>
          <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${resolvedPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <ICONS.LayoutGrid size={120} className="text-teams-purple" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ICONS.LayoutGrid className="text-teams-purple" />
            Explora tus Tickets
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            Visualiza tus solicitudes en formato de lista tradicional o usa el tablero Kanban para un seguimiento visual.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
               onClick={() => onViewTickets('kanban')}
               className="flex-1 bg-white border border-teams-purple text-teams-purple px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <ICONS.LayoutGrid size={18} />
              Ver Tablero Kanban
            </button>
            <button 
              onClick={() => onViewTickets('list')}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <ICONS.List size={18} />
              Ver Lista
            </button>
          </div>
        </div>

        {/* AI Helper Card */}
        <div className="bg-gradient-to-br from-teams-purple to-[#4b4e91] p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-20">
             <ICONS.Sparkles size={80} />
          </div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ICONS.NetworkIntelligence />
            ¿Necesitas ayuda?
          </h2>
          <p className="text-purple-100 mb-6">
            Nuestro sistema de IA analiza tus tickets automáticamente para acelerar la resolución. Recuerda adjuntar capturas para un mejor diagnóstico.
          </p>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-30">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
               Estado del Soporte: Óptimo
            </div>
            <p className="text-xs text-purple-100">Cualquier cambio de estado por parte de los técnicos será visible aquí en tiempo real.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
