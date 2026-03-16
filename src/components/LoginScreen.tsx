import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { UserRole, User } from '../types';
import { userService } from '../services/userService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [showTechSelector, setShowTechSelector] = useState(false);
  const [isLoadingTechs, setIsLoadingTechs] = useState(false);
  
  const handleLogin = async (role: UserRole) => {
    const user = await userService.login(role);
    onLogin(user);
  };

  const handleTechClick = async () => {
    if (technicians.length === 0) {
      setIsLoadingTechs(true);
      try {
        const techs = await userService.getTechnicians();
        setTechnicians(techs);
      } catch (error) {
        console.error("Error fetching technicians", error);
      } finally {
        setIsLoadingTechs(false);
      }
    }
    setShowTechSelector(!showTechSelector);
  };

  const selectTechnician = (tech: User) => {
    onLogin(tech);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-teams-purple rounded-lg text-white mb-4" aria-hidden="true">
            <ICONS.Ticket />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Portal de Soporte</h1>
          <p className="text-gray-500 text-sm mt-2">Selecciona tu rol para entrar a la demo</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handleLogin(UserRole.USER)}
            disabled={showTechSelector}
            aria-label="Entrar como Empleado - Crear y ver tickets"
            className={`w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-gray-50 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-teams-purple ${showTechSelector ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-4 group-hover:bg-blue-200" aria-hidden="true">
                <ICONS.User />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Empleado</div>
                <div className="text-xs text-gray-500">Crear y ver tickets</div>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-teams-purple" aria-hidden="true">→</div>
          </button>

          <div className="relative">
            <button 
              onClick={handleTechClick}
              aria-label="Rol Técnico - Ver lista de técnicos registrados"
              aria-expanded={showTechSelector}
              aria-haspopup="listbox"
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-teams-purple ${showTechSelector ? 'border-teams-purple bg-teams-purple/5 shadow-sm' : 'border-gray-200 hover:border-teams-purple hover:bg-gray-50'}`}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-md mr-4 transition-colors ${showTechSelector ? 'bg-orange-200 text-orange-700' : 'bg-orange-100 text-orange-600 group-hover:bg-orange-200'}`} aria-hidden="true">
                  <ICONS.Ticket />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">Técnico</div>
                  <div className="text-xs text-gray-500">
                    {showTechSelector ? 'Selecciona una cuenta' : 'Resolver tickets'}
                  </div>
                </div>
              </div>
              <div className={`transition-transform duration-200 ${showTechSelector ? 'rotate-90 text-teams-purple' : 'text-gray-300 group-hover:text-teams-purple'}`} aria-hidden="true">
                {showTechSelector ? '▼' : '→'}
              </div>
            </button>

            {showTechSelector && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
                {isLoadingTechs ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Cargando técnicos...
                  </div>
                ) : technicians.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {technicians.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => selectTechnician(tech)}
                        className="w-full flex items-center p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 group text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-teams-purple/10 text-teams-purple flex items-center justify-center font-bold text-xs mr-3 group-hover:bg-teams-purple group-hover:text-white transition-colors">
                          {tech.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-800">{tech.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">{tech.email}</div>
                        </div>
                        <div className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 capitalize">
                          {tech.role === UserRole.ADMIN ? 'Lead' : 'Técnico'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No se encontraron técnicos
                  </div>
                )}
                
                <button 
                  onClick={() => handleLogin(UserRole.TECHNICIAN)}
                  className="w-full p-2 bg-gray-50 text-xs font-semibold text-teams-purple hover:bg-gray-100 transition-colors"
                >
                  Usar Cuenta Demo Predeterminada
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => handleLogin(UserRole.ADMIN)}
            disabled={showTechSelector}
            aria-label="Entrar como Administrador - Gestionar personal y acceso"
            className={`w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-gray-50 transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-teams-purple ${showTechSelector ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center">
              <div className="bg-purple-100 text-purple-600 p-2 rounded-md mr-4 group-hover:bg-purple-200" aria-hidden="true">
                <ICONS.Shield />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Administrador</div>
                <div className="text-xs text-gray-500">Gestionar personal y acceso</div>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-teams-purple" aria-hidden="true">→</div>
          </button>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>Demo de App Integrada de Microsoft Teams</p>
          <p className="mt-1">Desarrollador Jorge Luis Iglesias Céspedes. Versión 1.0</p>
        </div>
      </div>
    </div>
  );
};