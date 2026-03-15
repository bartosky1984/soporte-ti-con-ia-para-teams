import { Notification } from '../types';
import { supabase } from './supabaseClient';

const isDbEnabled = (import.meta.env?.VITE_DB_ENABLED === 'true' || (typeof process !== 'undefined' && process.env.DB_ENABLED === 'true'));

export const notificationService = {
  getNotifications: async (userId: string): Promise<Notification[]> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('userId', userId)
          .order('timestamp', { ascending: false });
        
        if (error) throw error;
        return (data || []).map(n => ({
          ...n,
          timestamp: new Date(n.timestamp).getTime()
        })) as Notification[];
      } catch (e) {
        console.error("Supabase getNotifications failed", e);
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem('teams_tickets_notifications');
    if (!stored) return [];
    try {
      const all: Notification[] = JSON.parse(stored);
      return all.filter(n => n.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) { return []; }
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const notifs = await notificationService.getNotifications(userId);
    return notifs.filter(n => !n.read).length;
  },

  addNotification: async (userId: string, ticketId: number, message: string): Promise<void> => {
    if (isDbEnabled) {
      try {
        const { error } = await supabase
          .from('notifications')
          .insert([{ userId, ticketId, message, read: false }]);
        if (!error) return;
      } catch (e) {
        console.error("Supabase addNotification failed", e);
      }
    }

    const stored = localStorage.getItem('teams_tickets_notifications');
    const all: Notification[] = stored ? JSON.parse(stored) : [];
    all.push({
      id: Date.now().toString() + Math.random().toString(),
      userId,
      ticketId,
      message,
      read: false,
      timestamp: Date.now()
    });
    localStorage.setItem('teams_tickets_notifications', JSON.stringify(all));
  },

  markAsRead: async (notificationId: string): Promise<Notification[]> => {
    if (isDbEnabled) {
      try {
        const { data: current } = await supabase.from('notifications').select('userId').eq('id', notificationId).single();
        if (current) {
          const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
          if (!error) return notificationService.getNotifications(current.userId);
        }
      } catch (e) {
        console.error("Supabase markAsRead failed", e);
      }
    }

    // Fallback
    const stored = localStorage.getItem('teams_tickets_notifications');
    if (!stored) return [];
    let all: Notification[] = JSON.parse(stored);
    const target = all.find(n => n.id === notificationId);
    if (!target) return [];
    all = all.map(n => n.id === notificationId ? { ...n, read: true } : n);
    localStorage.setItem('teams_tickets_notifications', JSON.stringify(all));
    return all.filter(n => n.userId === target.userId).sort((a, b) => b.timestamp - a.timestamp);
  },
  
  markAllAsRead: async (userId: string): Promise<Notification[]> => {
    if (isDbEnabled) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('userId', userId);
        return notificationService.getNotifications(userId);
      } catch (e) {
        console.error("Supabase markAllAsRead failed", e);
      }
    }

    // Fallback
    const stored = localStorage.getItem('teams_tickets_notifications');
    if (!stored) return [];
    let all: Notification[] = JSON.parse(stored);
    all = all.map(n => n.userId === userId ? { ...n, read: true } : n);
    localStorage.setItem('teams_tickets_notifications', JSON.stringify(all));
    return all.filter(n => n.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  },

  subscribeToNotifications: (userId: string, callback: () => void) => {
    if (!isDbEnabled) return () => {};

    const channel = supabase
      .channel(`notifications:userId=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `userId=eq.${userId}`
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};