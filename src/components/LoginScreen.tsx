import React from 'react';
import { ICONS } from '../constants';
import { UserRole, User } from '../types';
import { userService } from '../services/userService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  
  const handleLogin = async (role: UserRole) => {
    const user = await userService.login(role);
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-teams-purple rounded-lg text-white mb-4">
            <ICONS.Ticket />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Portal de Soporte</h1>
          <p className="text-gray-500 text-sm mt-2">Selecciona tu rol para entrar a la demo</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handleLogin(UserRole.USER)}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-4 group-hover:bg-blue-200">
                <ICONS.User />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Empleado</div>
                <div className="text-xs text-gray-500">Crear y ver tickets</div>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-teams-purple">→</div>
          </button>

          <button 
            onClick={() => handleLogin(UserRole.TECHNICIAN)}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center">
              <div className="bg-orange-100 text-orange-600 p-2 rounded-md mr-4 group-hover:bg-orange-200">
                <ICONS.Ticket />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Técnico</div>
                <div className="text-xs text-gray-500">Resolver tickets</div>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-teams-purple">→</div>
          </button>

          <button 
            onClick={() => handleLogin(UserRole.ADMIN)}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teams-purple hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 text-purple-600 p-2 rounded-md mr-4 group-hover:bg-purple-200">
                <ICONS.Shield />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Administrador</div>
                <div className="text-xs text-gray-500">Gestionar personal y acceso</div>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-teams-purple">→</div>
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