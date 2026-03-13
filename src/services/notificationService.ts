import { Notification } from '../types';

const STORAGE_KEY_NOTIFICATIONS = 'teams_tickets_notifications';

export const notificationService = {
  getNotifications: (userId: string): Notification[] => {
    const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!stored) return [];
    
    try {
      const allNotifications: Notification[] = JSON.parse(stored);
      // Return notifications for this user, sorted by newest
      return allNotifications
        .filter(n => n.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      return [];
    }
  },

  getUnreadCount: (userId: string): number => {
    const notifs = notificationService.getNotifications(userId);
    return notifs.filter(n => !n.read).length;
  },

  addNotification: (userId: string, ticketId: number, message: string): void => {
    const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    const allNotifications: Notification[] = stored ? JSON.parse(stored) : [];

    const newNotification: Notification = {
      id: Date.now().toString() + Math.random().toString(),
      userId,
      ticketId,
      message,
      read: false,
      timestamp: Date.now()
    };

    allNotifications.push(newNotification);
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(allNotifications));
  },

  markAsRead: (notificationId: string): Notification[] => {
    const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!stored) return [];

    let allNotifications: Notification[] = JSON.parse(stored);
    
    // Find notification to determine userId (to return correct list)
    const target = allNotifications.find(n => n.id === notificationId);
    if (!target) return [];

    // Update read status
    allNotifications = allNotifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );

    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(allNotifications));
    
    // Return updated list for that user
    return allNotifications
        .filter(n => n.userId === target.userId)
        .sort((a, b) => b.timestamp - a.timestamp);
  },
  
  markAllAsRead: (userId: string): Notification[] => {
     const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
     if (!stored) return [];
     
     let allNotifications: Notification[] = JSON.parse(stored);
     
     allNotifications = allNotifications.map(n => 
        n.userId === userId ? { ...n, read: true } : n
     );
     
     localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(allNotifications));
     
     return allNotifications
        .filter(n => n.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp);
  }
};