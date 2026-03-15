import React from 'react';
import { Notification } from '../types';
import { ICONS } from '../constants';
import { notificationService } from '../services/notificationService';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onUpdateNotifications: (notifs: Notification[]) => void;
  userId: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  notifications, 
  onClose, 
  onUpdateNotifications,
  userId
}) => {

  const handleMarkAsRead = async (id: string) => {
    const updated = await notificationService.markAsRead(id);
    onUpdateNotifications(updated);
  };

  const handleMarkAllRead = async () => {
    const updated = await notificationService.markAllAsRead(userId);
    onUpdateNotifications(updated);
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white shadow-xl rounded-lg border border-gray-200 z-50 overflow-hidden">
      <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700 text-sm">Notificaciones</h3>
        <div className="flex items-center space-x-2">
            {notifications.some(n => !n.read) && (
                <button 
                onClick={handleMarkAllRead}
                className="text-xs text-teams-purple hover:underline"
                >
                Marcar leídas
                </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <ICONS.Close />
            </button>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No tienes notificaciones
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleMarkAsRead(notif.id)}
                className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50' : 'bg-white'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-teams-purple' : 'bg-gray-200'}`} />
                  <div>
                    <p className={`text-sm ${!notif.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleTimeString()} · Ticket #{notif.ticketId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};