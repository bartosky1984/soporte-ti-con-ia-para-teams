import React, { useState, useEffect } from 'react';
import { User, UserRole, TicketClassification } from '../types';
import { userService } from '../services/userService';
import { classificationService } from '../services/classificationService';
import { ICONS, ROLE_LABELS } from '../constants';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [classifications, setClassifications] = useState<TicketClassification[]>([]);
  const [newClassificationName, setNewClassificationName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadClassifications();
  }, []);

  const loadUsers = async () => {
    const data = await userService.getAllUsers();
    setUsers(data);
  };

  const loadClassifications = () => {
    const data = classificationService.getClassifications();
    setClassifications(data);
  };

  const handleRoleToggle = async (userId: string, currentRole: UserRole) => {
    setLoading(true);
    const newRole = currentRole === UserRole.TECHNICIAN ? UserRole.USER : UserRole.TECHNICIAN;
    try {
      await userService.updateUserRole(userId, newRole);
      await loadUsers();
    } catch (e) {
      alert("Error al actualizar rol");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClassification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassificationName) return;
    classificationService.addClassification(newClassificationName);
    setNewClassificationName('');
    loadClassifications();
  };

  const handleRemoveClassification = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta clasificación?')) {
      classificationService.deleteClassification(id);
      loadClassifications();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-teams-dark flex items-center">
              <span className="mr-2 text-teams-purple"><ICONS.Shield /></span>
              Panel de Control Admin
            </h2>
            <p className="text-sm text-gray-500">
              Gestiona el equipo técnico autorizado y las clasificaciones de tickets.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Technicians Section */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 flex items-center">
              <span className="mr-2"><ICONS.User /></span>
              Gestión de Usuarios y Roles
            </h3>
            
            <div className="border rounded-lg overflow-hidden border-gray-100 shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Usuario</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol Actual</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(userItem => (
                    <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${userItem.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'}`}>
                          {userItem.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{userItem.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{userItem.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          userItem.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 
                          userItem.role === UserRole.TECHNICIAN ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ROLE_LABELS[userItem.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {userItem.role !== UserRole.ADMIN && (
                          <button
                            onClick={() => handleRoleToggle(userItem.id, userItem.role)}
                            disabled={loading}
                            className={`text-xs px-3 py-1.5 rounded transition-all ${
                              userItem.role === UserRole.TECHNICIAN 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'bg-teams-purple text-white hover:bg-opacity-90'
                            }`}
                          >
                            {userItem.role === UserRole.TECHNICIAN ? 'Revocar Técnico' : 'Promover a Técnico'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-gray-400">No hay usuarios registrados</div>
              )}
            </div>
          </div>

          {/* Classifications Section */}
          <div className="lg:col-span-1 border-l border-gray-100 pl-8 hidden lg:block">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 flex items-center">
              <span className="mr-2"><ICONS.LayoutGrid /></span>
              Clasificaciones
            </h3>
            
            <form onSubmit={handleAddClassification} className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <h3 className="text-xs font-medium mb-3 text-gray-500 uppercase">Agregar Criterio</h3>
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Ej: Fallo Hardware"
                  value={newClassificationName}
                  onChange={(e) => setNewClassificationName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  required
                />
                <button 
                  type="submit" 
                  className="bg-teams-purple text-white px-4 py-2 rounded text-sm hover:bg-opacity-90 flex items-center"
                >
                  <span className="mr-1"><ICONS.Plus /></span>
                  Agregar
                </button>
              </div>
            </form>

            <div>
              <h3 className="text-sm font-medium mb-3">Criterios de Clasificación ({classifications.length})</h3>
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {classifications.map(classification => (
                  <div key={classification.id} className="p-3 flex justify-between items-center bg-white">
                    <div className="text-sm font-medium text-gray-800">{classification.name}</div>
                    <button 
                      onClick={() => handleRemoveClassification(classification.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Eliminar Clasificación"
                    >
                      <ICONS.Trash />
                    </button>
                  </div>
                ))}
                {classifications.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No hay clasificaciones definidas
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};