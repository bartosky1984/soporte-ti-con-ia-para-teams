import { Ticket, TicketStatus, TicketType, User, TicketComment, UserRole } from '../types';
import { notificationService } from './notificationService';
import { supabase } from './supabaseClient';

// Mock storage keys
const STORAGE_KEY = 'teams_tickets_db';
const STORAGE_KEY_COMMENTS = 'teams_tickets_comments';
const STORAGE_KEY_READS = 'teams_tickets_reads'; // Format: { "userId_ticketId": timestamp }

const isDbEnabled = (import.meta.env?.VITE_DB_ENABLED === 'true' || (typeof process !== 'undefined' && process.env.DB_ENABLED === 'true'));

// Ensure mock tickets have owner IDs for the demo to work
const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 101,
    userId: '999',
    userName: 'Employee User',
    tipo: TicketType.IT,
    descripcion: "La impresora del segundo piso no conecta a la red wifi.",
    estado: TicketStatus.PENDING,
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  },
  {
    id: 102,
    userId: '999',
    userName: 'Employee User',
    tipo: TicketType.GENERAL,
    descripcion: "Solicitud de reemplazo de silla ergonómica en puesto 4B.",
    estado: TicketStatus.IN_PROGRESS,
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  }
];

export const ticketService = {
  getTickets: async (currentUserId?: string): Promise<Ticket[]> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .order('fecha', { ascending: false });

        if (error) throw error;
        let tickets = data as Ticket[];

        if (currentUserId) {
          tickets = tickets.map(t => ({ ...t, unreadCount: 0, hasMessages: false, messageCount: 0 }));
        }
        return tickets;
      } catch (e) {
        console.error("Supabase getTickets failed, falling back to localStorage", e);
      }
    }

    // Fallback to localStorage (MVP Phase 1 logic)
    await new Promise(resolve => setTimeout(resolve, 500));
    const stored = localStorage.getItem(STORAGE_KEY);
    let tickets: Ticket[] = stored ? JSON.parse(stored) : DEFAULT_TICKETS;

    if (currentUserId) {
      const storedComments = localStorage.getItem(STORAGE_KEY_COMMENTS);
      const allComments: TicketComment[] = storedComments ? JSON.parse(storedComments) : [];
      const storedReads = localStorage.getItem(STORAGE_KEY_READS);
      const readReceipts: Record<string, number> = storedReads ? JSON.parse(storedReads) : {};

      tickets = tickets.map(ticket => {
        const ticketComments = allComments.filter(c => c.ticketId === ticket.id);
        const readKey = `${currentUserId}_${ticket.id}`;
        const lastReadTime = readReceipts[readKey] || 0;
        const unreadCount = ticketComments.filter(c =>
          c.userId !== currentUserId && new Date(c.timestamp).getTime() > lastReadTime
        ).length;
        return { ...ticket, unreadCount, hasMessages: ticketComments.length > 0, messageCount: ticketComments.length };
      });
    }
    return tickets.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  createTicket: async (data: { tipo: TicketType; descripcion: string }, user: User): Promise<Ticket> => {
    if (isDbEnabled) {
      try {
        // Detect priority
        let priority: 'Baja' | 'Media' | 'Alta' | 'Crítica' = 'Media';
        const lowerDesc = data.descripcion.toLowerCase();
        if (lowerDesc.includes('urgente') || lowerDesc.includes('crítico') || lowerDesc.includes('bloqueante')) {
          priority = 'Crítica';
        } else if (lowerDesc.includes('error') || lowerDesc.includes('bug') || lowerDesc.includes('falla')) {
          priority = 'Alta';
        }

        const insertData = {
          userId: user.id,
          userName: user.name,
          tipo: data.tipo,
          descripcion: data.descripcion,
          estado: TicketStatus.PENDING,
          prioridad: priority,
          fecha: new Date().toISOString()
        };

        const { data: saved, error } = await supabase
          .from('tickets')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }
        return saved as Ticket;
      } catch (e) {
        console.error("Supabase createTicket failed, falling back to localStorage", e);
      }
    }

    // LocalStorage Fallback
    const newTicket: Ticket = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      tipo: data.tipo,
      descripcion: data.descripcion,
      estado: TicketStatus.PENDING,
      prioridad: 'Media',
      fecha: new Date().toISOString()
    };

    await new Promise(resolve => setTimeout(resolve, 600));
    const stored = localStorage.getItem(STORAGE_KEY);
    const tickets: Ticket[] = stored ? JSON.parse(stored) : [];
    tickets.push(newTicket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    ticketService.markAsRead(newTicket.id, user.id);
    return newTicket;
  },

  updateTicketStatus: async (id: number, status: TicketStatus, user: User, oldStatus?: string): Promise<Ticket | null> => {
    if (isDbEnabled) {
      try {
        const updateData: any = { estado: status };
        if (status === TicketStatus.RESOLVED) {
          updateData.resolvedAt = new Date().toISOString();
        }
        
        // Auto-assign technician when they start working on it
        if (status === TicketStatus.IN_PROGRESS && user.role !== UserRole.USER) {
          updateData.technicianId = user.id;
          updateData.technicianName = user.name;
        }

        const { data, error } = await supabase
          .from('tickets')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        // Audit log
        if (user) {
          await ticketService.addAuditLog(id, user, 'STATUS_CHANGE', oldStatus || 'UNKNOWN', status);
        }
        
        return data as Ticket;
      } catch (e) {
        console.error("Supabase updateTicketStatus failed", e);
      }
    }

    // Fallback logic
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const tickets: Ticket[] = JSON.parse(stored);
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return null;

    const currentOldStatus = tickets[index].estado;
    tickets[index].estado = status;
    if (status === TicketStatus.RESOLVED) tickets[index].resolvedAt = new Date().toISOString();
    
    // Auto-assign for localStorage fallback too
    if (status === TicketStatus.IN_PROGRESS && user.role !== UserRole.USER) {
      tickets[index].technicianId = user.id;
      tickets[index].technicianName = user.name;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));

    if (user) {
      await ticketService.addAuditLog(id, user, 'STATUS_CHANGE', currentOldStatus, status);
    }

    return tickets[index];
  },

  addComment: async (ticketId: number, text: string, user: User): Promise<TicketComment> => {
    const newCommentData = {
      ticketId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      text,
      timestamp: new Date().toISOString()
    };

    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .insert([newCommentData])
          .select()
          .single();

        if (error) throw error;
        return data as TicketComment;
      } catch (e) {
        console.error("Supabase addComment failed", e);
      }
    }

    // LocalStorage Fallback (needs ID)
    const newComment: TicketComment = {
      id: Date.now().toString(),
      ...newCommentData
    };
    const stored = localStorage.getItem(STORAGE_KEY_COMMENTS);
    const comments: TicketComment[] = stored ? JSON.parse(stored) : [];
    comments.push(newComment);
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comments));
    return newComment;
  },

  getComments: async (ticketId: number): Promise<TicketComment[]> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('ticketId', ticketId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        return data as TicketComment[];
      } catch (e) {
        console.error("Supabase getComments failed", e);
      }
    }

    // Fallback
    const stored = localStorage.getItem(STORAGE_KEY_COMMENTS);
    if (!stored) return [];
    const allComments: TicketComment[] = JSON.parse(stored);
    return allComments.filter(c => c.ticketId === ticketId).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  markAsRead: (ticketId: number, userId: string): void => {
    const storedReads = localStorage.getItem(STORAGE_KEY_READS);
    const readReceipts: Record<string, number> = storedReads ? JSON.parse(storedReads) : {};
    readReceipts[`${userId}_${ticketId}`] = Date.now();
    localStorage.setItem(STORAGE_KEY_READS, JSON.stringify(readReceipts));
  },

  updateTicketClassification: async (id: number, classificationId: string): Promise<Ticket | null> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .update({ classificationId })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return data as Ticket;
      } catch (e) {
        console.error("Supabase updateTicketClassification failed", e);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const tickets: Ticket[] = JSON.parse(stored);
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return null;

    tickets[index].classificationId = classificationId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    return tickets[index];
  },

  addAuditLog: async (ticketId: number, user: User, action: string, oldValue: string, newValue: string): Promise<void> => {
    if (!isDbEnabled) return;
    
    try {
      await supabase
        .from('ticket_audits')
        .insert([{
          ticket_id: ticketId,
          user_id: user.id,
          user_name: user.name,
          action,
          old_value: oldValue,
          new_value: newValue
        }]);
    } catch (e) {
      console.error("Audit logging failed", e);
    }
  },

  getAuditLogs: async (ticketId: number): Promise<any[]> => {
    if (!isDbEnabled) return [];
    try {
      const { data, error } = await supabase
        .from('ticket_audits')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Failed to fetch audits", e);
      return [];
    }
  },

  getITHealthStats: async (technicianId?: string): Promise<any> => {
    let tickets = await ticketService.getTickets();
    
    // Filter by technician if ID is provided (Technician view)
    if (technicianId) {
      tickets = tickets.filter(t => t.technicianId === technicianId);
    }

    const resolved = tickets.filter(t => t.estado === TicketStatus.RESOLVED);
    const categories = ['Software', 'Hardware', 'Redes', 'General'];
    const types = categories.map(name => ({
      name,
      count: tickets.filter(t => t.tipo === (name === 'General' ? TicketType.GENERAL : TicketType.IT)).length
    }));

    const byClassification = [
      { name: 'Problema técnico', count: tickets.filter(t => t.classificationId === '1').length },
      { name: 'Falta de formación', count: tickets.filter(t => t.classificationId === '2').length }
    ];

    const trainingNeeded = tickets.filter(t => t.classificationId === '2').reduce((acc: any, t) => {
      acc[t.userName] = (acc[t.userName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTickets: tickets.length,
      resolvedTickets: resolved.length,
      pendingTickets: tickets.length - resolved.length,
      avgResolutionTimeHours: 2.5,
      byClassification,
      byType: types,
      topUsersByLackOfTraining: Object.entries(trainingNeeded).map(([name, count]: any) => ({ name, count }))
    };
  }
};