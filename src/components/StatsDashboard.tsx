import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ticketService } from '../services/ticketService';
import { ITHealthStats, User, UserRole } from '../types';
import { ICONS } from '../constants';

const COLORS = ['#6264A7', '#00B7C3', '#FFB900', '#D83B01', '#E3008C', '#5C2D91'];

interface StatsDashboardProps {
  user: User;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<ITHealthStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    // Admins and Leads see global stats, Technicians see only their assigned tickets
    const technicianId = (user.role === UserRole.TECHNICIAN) ? user.id : undefined;
    const data = await ticketService.getITHealthStats(technicianId);
    setStats(data);
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin text-teams-purple"><ICONS.Spinner /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-teams-dark">IT Health Dashboard</h2>
          <p className="text-sm text-gray-500">
            {user.role === UserRole.USER ? '' : 
             (user.role === UserRole.ADMIN || user.role === UserRole.LEAD_TECHNICIAN) ? 'Vista Global de Rendimiento' : `Resumen de Rendimiento: ${user.name}`}
          </p>
        </div>
        <button 
          onClick={loadStats}
          className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-teams-purple"
          aria-label="Actualizar datos de las estadísticas"
        >
          <ICONS.Sparkles aria-hidden="true" /> Actualizar Datos
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Tickets" 
          value={stats.totalTickets} 
          icon={<ICONS.Ticket />} 
          color="text-teams-purple"
        />
        <MetricCard 
          title="Resueltos" 
          value={stats.resolvedTickets} 
          icon={<ICONS.Check />} 
          color="text-green-600"
        />
        <MetricCard 
          title="Pendientes" 
          value={stats.pendingTickets} 
          icon={<ICONS.Clock />} 
          color="text-orange-600"
        />
        <MetricCard 
          title="Tiempo Medio Resolución" 
          value={`${stats.avgResolutionTimeHours.toFixed(1)}h`} 
          icon={<ICONS.Sparkles />} 
          color="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classification Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-teams-purple" aria-hidden="true"><ICONS.LayoutGrid /></span>
            Problemas Técnicos vs Falta de Formación
          </h3>
          <div className="h-64" role="img" aria-label="Gráfico circular mostrando la distribución entre problemas técnicos y falta de formación">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byClassification}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {stats.byClassification.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            * Este gráfico permite identificar si el problema es la infraestructura o la capacitación del personal.
          </p>
        </div>

        {/* Tickets by Type */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-teams-purple"><ICONS.Ticket /></span>
            Distribución por Departamento
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byType}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6264A7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Users - Lack of Training */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-red-600" aria-hidden="true"><ICONS.User /></span>
            Usuarios con Mayor Necesidad de Formación
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" aria-label="Usuarios que requieren capacitación">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nombre del Usuario</th>
                  <th scope="col" className="px-6 py-3">Tickets por "Falta de Formación"</th>
                  <th scope="col" className="px-6 py-3">Acción Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsersByLackOfTraining.map((user, idx) => (
                  <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {user.count} incidencias
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      Asignar curso de capacitación IT básico
                    </td>
                  </tr>
                ))}
                {stats.topUsersByLackOfTraining.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      No se han detectado patrones críticos de falta de formación aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4" role="status" aria-label={`${title}: ${value}`}>
    <div className={`p-3 rounded-lg bg-gray-50 ${color}`} aria-hidden="true">
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);
