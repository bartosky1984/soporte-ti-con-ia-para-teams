import React, { useState, useEffect } from 'react';
import { TicketStatus, User, UserRole, TicketType } from '../types';
import { ICONS } from '../constants';
import { userService } from '../services/userService';

export interface FilterState {
  searchText: string;
  creatorId: string;
  technicianId: string;
  type: TicketType | 'all';
  startDate: string;
  endDate: string;
  status: string;
}

interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  currentUser: User;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange, currentUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    creatorId: 'all',
    technicianId: 'all',
    type: 'all',
    startDate: '',
    endDate: '',
    status: 'all'
  });

  useEffect(() => {
    const loadFilterData = async () => {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
      setTechnicians(allUsers.filter(u => 
        u.role === UserRole.TECHNICIAN || 
        u.role === UserRole.LEAD_TECHNICIAN || 
        u.role === UserRole.ADMIN
      ));
    };
    loadFilterData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const reset: FilterState = {
      searchText: '',
      creatorId: 'all',
      technicianId: 'all',
      type: 'all',
      startDate: '',
      endDate: '',
      status: 'all'
    };
    setFilters(reset);
    onFilterChange(reset);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      <div className="p-3 flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <ICONS.Search size={18} aria-hidden="true" />
          </div>
          <input
            type="text"
            name="searchText"
            value={filters.searchText}
            onChange={handleChange}
            placeholder="Buscar tickets..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teams-purple focus:border-teams-purple text-sm transition-all"
            aria-label="Buscar tickets"
          />
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            isExpanded ? 'bg-teams-purple text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
          }`}
          aria-expanded={isExpanded}
          aria-label="Filtros avanzados"
        >
          <ICONS.Filter size={18} aria-hidden="true" />
          <span>Filtros</span>
          {isExpanded ? <ICONS.ChevronUp size={16} /> : <ICONS.ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Estado</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teams-purple focus:border-teams-purple sm:text-sm"
              >
                <option value="all">Todos los estados</option>
                {Object.values(TicketStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Creator Filter - Only for staff */}
            {currentUser.role !== UserRole.USER && (
              <div>
                <label htmlFor="creatorId" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Creado por</label>
                <select
                  id="creatorId"
                  name="creatorId"
                  value={filters.creatorId}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teams-purple focus:border-teams-purple sm:text-sm"
                >
                  <option value="all">Cualquier usuario</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Technician Filter */}
            <div>
              <label htmlFor="technicianId" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Técnico Asignado</label>
              <select
                id="technicianId"
                name="technicianId"
                value={filters.technicianId}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teams-purple focus:border-teams-purple sm:text-sm"
              >
                <option value="all">Cualquier técnico</option>
                <option value="unassigned">Sin asignar</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div>
              <label htmlFor="startDate" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Desde</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teams-purple focus:border-teams-purple sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hasta</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-teams-purple focus:border-teams-purple sm:text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-xs text-teams-purple hover:text-purple-800 font-medium py-2 px-1 flex items-center gap-1 transition-all"
              >
                <ICONS.Trash size={14} /> Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
