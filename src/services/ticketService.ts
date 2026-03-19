import { Ticket, TicketStatus, TicketType, User, TicketComment, UserRole } from '../types';
import { notificationService } from './notificationService';
import { supabase } from './supabaseClient';
import { syncService, SyncAction } from './syncService';

// Mock storage keys
const STORAGE_KEY = 'teams_tickets_db';
const STORAGE_KEY_COMMENTS = 'teams_tickets_comments';
const STORAGE_KEY_READS = 'teams_tickets_reads'; // Format: { "userId_ticketId": timestamp }

const isDbEnabled = (typeof process !== 'undefined' && process.env.DB_ENABLED === 'true') || import.meta.env.VITE_DB_ENABLED === 'true';

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
        // Map snake_case to camelCase if necessary for all tickets
        let tickets = (data as any[]).map(t => ({
          ...t,
          attachmentUrl: t.attachmentUrl || t.attachment_url
        })) as Ticket[];

        if (currentUserId) {
          // Fetch counts and read status from Supabase
          const [{ data: readStatuses }] = await Promise.all([
            supabase.from('ticket_reads').select('*').eq('userId', currentUserId)
          ]);

          // Use only Supabase comments when DB is enabled for strict sync
          const { data: allCommentsRaw } = await supabase.from('comments').select('*');
          let allComments = (allCommentsRaw || []) as any[];
          
          const readReceipts = (readStatuses || []).reduce((acc: any, curr: any) => {
            acc[curr.ticketId] = new Date(curr.lastReadTime).getTime();
            return acc;
          }, {});

              tickets = tickets.map(t => {
                const ticketComments = (allComments || []).filter(c => c.ticketId === t.id);
                const lastReadTime = readReceipts[t.id] || 0;
                const unreadCount = ticketComments.filter(c => 
                  c.userId !== currentUserId && new Date(c.timestamp).getTime() > lastReadTime
                ).length;
                
                if (unreadCount > 0) {
                  console.log(`🎯 [TicketService] Ticket #${t.id} has ${unreadCount} unread. Last read: ${new Date(lastReadTime).toISOString()}`);
                }
                
                const hasAttachments = !!t.attachmentUrl || (ticketComments || []).some((c: any) => c.attachmentUrl || c.attachment_url);
                
                return { 
                  ...t, 
                  unreadCount, 
                  hasMessages: ticketComments.length > 0, 
                  messageCount: ticketComments.length,
                  hasAttachments
                };
              });
        }
        
        return tickets.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
        const hasAttachments = !!ticket.attachmentUrl || !!ticket.attachment_url || ticketComments.some((c: any) => !!c.attachmentUrl || !!c.attachment_url);

        return { ...ticket, unreadCount, hasMessages: ticketComments.length > 0, messageCount: ticketComments.length, hasAttachments };
      });
    }
    return tickets.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  createTicket: async (data: { tipo: TicketType; descripcion: string; attachmentUrl?: string }, user: User): Promise<Ticket> => {
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

        // If we are offline, enqueue for sync
        if (!window.navigator.onLine) {
          console.log("[TicketService] Offline, enqueuing CREATE_TICKET");
          syncService.enqueue(SyncAction.CREATE_TICKET, { ticketData: data, user });
          // We fall through to the local storage fallback below so the user sees it immediately
        } else {
          try {
            const insertData = {
              userId: user.id,
              userName: user.name,
              tipo: data.tipo,
              descripcion: data.descripcion,
              estado: TicketStatus.PENDING,
              prioridad: priority,
              fecha: new Date().toISOString(),
              attachmentUrl: data.attachmentUrl,
              attachment_url: data.attachmentUrl
            };

            const { data: saved, error } = await supabase
              .from('tickets')
              .insert([insertData])
              .select()
              .single();

            if (error) throw error;
            
            const savedRaw = saved as any;
            return {
              ...savedRaw,
              attachmentUrl: savedRaw.attachmentUrl || savedRaw.attachment_url
            } as Ticket;
          } catch (supabaseError) {
             console.error("Supabase createTicket failed, enqueuing for later sync", supabaseError);
             syncService.enqueue(SyncAction.CREATE_TICKET, { ticketData: data, user });
          }
        }
      } catch (e) {
        console.error("General createTicket failure, enqueuing", e);
        syncService.enqueue(SyncAction.CREATE_TICKET, { ticketData: data, user });
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
      fecha: new Date().toISOString(),
      attachmentUrl: data.attachmentUrl
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
        
        // Auto-assign technician and set department when they start working on it
        if (status === TicketStatus.IN_PROGRESS && user.role !== UserRole.USER) {
          updateData.technicianId = user.id;
          updateData.technicianName = user.name;
          
          // Record first response time if not already set
          const { data: currentTicket } = await supabase.from('tickets').select('firstResponseAt').eq('id', id).single();
          if (currentTicket && !currentTicket.firstResponseAt) {
            updateData.firstResponseAt = new Date().toISOString();
          }
        }

        const { data, error } = await supabase
          .from('tickets')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        const updatedRaw = data as any;
        const updatedTicket = {
          ...updatedRaw,
          attachmentUrl: updatedRaw.attachmentUrl || updatedRaw.attachment_url
        } as Ticket;
        
        // Notify owner if the person changing the status is not the owner
        if (user && user.id !== updatedTicket.userId) {
          try {
            await notificationService.addNotification(
              updatedTicket.userId,
              id,
              `El estado de tu ticket #${id} ha cambiado a: ${status}`
            );
          } catch (notifErr) {
            console.error("Failed to send notification", notifErr);
          }
        }

        // Audit log
        if (user) {
          await ticketService.addAuditLog(id, user, 'STATUS_CHANGE', oldStatus || 'UNKNOWN', status);
        }
        
        return updatedTicket;
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

  updateTicketPriority: async (id: number, priority: string, user: User, oldPriority: string): Promise<Ticket | null> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .update({ prioridad: priority })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        await ticketService.addAuditLog(id, user, 'PRIORITY_CHANGE', oldPriority, priority);
        
        return data as Ticket;
      } catch (e) {
        console.error("Supabase updateTicketPriority failed", e);
      }
    }
    return null;
  },

  addAuditLog: async (ticketId: number, user: User, action: string, oldValue: string, newValue: string): Promise<void> => {
    if (isDbEnabled) {
      try {
        await supabase
          .from('ticket_audit_logs')
          .insert([{
            ticket_id: ticketId,
            user_name: user.name,
            action: action,
            old_value: oldValue,
            new_value: newValue
          }]);
      } catch (e) {
        console.error("Failed to add audit log", e);
      }
    }
  },

  getAuditLogs: async (ticketId: number): Promise<any[]> => {
    if (!isDbEnabled) return [];
    try {
      const { data, error } = await supabase
        .from('ticket_audit_logs')
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

  addComment: async (ticketId: number, text: string, user: User, attachmentUrl?: string): Promise<TicketComment> => {
    const newCommentData = {
      ticketId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      text,
      timestamp: new Date().toISOString(),
      attachmentUrl
    };

    if (isDbEnabled) {
      if (!window.navigator.onLine) {
        console.log("[TicketService] Offline, enqueuing ADD_COMMENT");
        syncService.enqueue(SyncAction.ADD_COMMENT, { ticketId, text, user, attachmentUrl });
      } else {
        try {
          const { data, error } = await supabase
            .from('comments')
            .insert([{ ...newCommentData, attachment_url: newCommentData.attachmentUrl }])
            .select()
            .single();

          if (error) throw error;
          const savedCommentRaw = data as any;
          const savedComment = {
            ...savedCommentRaw,
            attachmentUrl: savedCommentRaw.attachmentUrl || savedCommentRaw.attachment_url
          } as TicketComment;

          // Notify the other party
          try {
            const { data: ticket } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
            if (ticket) {
              const recipientId = user.id === ticket.userId ? ticket.technicianId : ticket.userId;
              if (recipientId) {
                await notificationService.addNotification(
                  recipientId,
                  ticketId,
                  `${user.name} comentó en el ticket #${ticketId}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
                );
              }
            }
          } catch (notifErr) {
            console.error("Failed to send notification", notifErr);
          }

          return savedComment;
        } catch (e) {
          console.error("Supabase addComment failed, enqueuing", e);
          syncService.enqueue(SyncAction.ADD_COMMENT, { ticketId, text, user, attachmentUrl });
        }
      }
    }

    // LocalStorage Fallback
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
    let allComments: TicketComment[] = [];

    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('ticketId', ticketId)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        if (data) {
          allComments = (data as any[]).map(c => ({
            ...c,
            attachmentUrl: c.attachmentUrl || c.attachment_url
          })) as TicketComment[];
        }
      } catch (e) {
        console.error("Supabase getComments failed", e);
      }
    }

    // Multi-layer fallback
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMMENTS);
      if (stored) {
        const localComments: TicketComment[] = JSON.parse(stored);
        const filteredLocal = localComments.filter(c => c.ticketId === ticketId);
        
        filteredLocal.forEach(lc => {
          const exists = allComments.some(sc => 
            String(sc.id) === String(lc.id) || 
            (sc.timestamp === lc.timestamp && sc.text === lc.text)
          );
          if (!exists) {
            allComments.push(lc);
          }
        });
      }
    } catch (localErr) {
      console.error("Local storage merge failed", localErr);
    }

    return allComments.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  },

  markAsRead: async (ticketId: number, userId: string): Promise<void> => {
    if (isDbEnabled) {
      try {
        await supabase
          .from('ticket_reads')
          .upsert({ 
            userId, 
            ticketId, 
            lastReadTime: new Date().toISOString() 
          }, { 
            onConflict: 'userId,ticketId' 
          });
        return;
      } catch (e) {
        console.error("Supabase markAsRead failed", e);
      }
    }

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
        const ticket = data as any;
        return {
          ...ticket,
          attachmentUrl: ticket.attachmentUrl || ticket.attachment_url
        } as Ticket;
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

  updateTicketType: async (id: number, tipo: TicketType, user: User, oldType: string): Promise<Ticket | null> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .update({ tipo })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        await ticketService.addAuditLog(id, user, 'TYPE_CHANGE', oldType, tipo);
        
        const ticket = data as any;
        return {
          ...ticket,
          attachmentUrl: ticket.attachmentUrl || ticket.attachment_url
        } as Ticket;
      } catch (e) {
        console.error("Supabase updateTicketType failed", e);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const tickets: Ticket[] = JSON.parse(stored);
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) return null;

    tickets[index].tipo = tipo;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    await ticketService.addAuditLog(id, user, 'TYPE_CHANGE', oldType, tipo);
    return tickets[index];
  },

  assignTechnician: async (ticketId: number, technician: User): Promise<Ticket | null> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .update({ 
            technicianId: technician.id, 
            technicianName: technician.name,
            estado: TicketStatus.IN_PROGRESS 
          })
          .eq('id', ticketId)
          .select()
          .single();

        if (error) throw error;
        const assignedTicket = data as Ticket;

        try {
          await Promise.all([
            notificationService.addNotification(
              technician.id,
              ticketId,
              `Se te ha asignado el ticket #${ticketId}`
            ),
            notificationService.addNotification(
              assignedTicket.userId,
              ticketId,
              `El técnico ${technician.name} ha sido asignado`
            )
          ]);
        } catch (notifErr) {
          console.error("Failed to send assignment notifications", notifErr);
        }

        return assignedTicket;
      } catch (e) {
        console.error("Supabase assignTechnician failed", e);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const tickets_fallback: Ticket[] = JSON.parse(stored);
    const index = tickets_fallback.findIndex(t => t.id === ticketId);
    if (index === -1) return null;

    tickets_fallback[index].technicianId = technician.id;
    tickets_fallback[index].technicianName = technician.name;
    tickets_fallback[index].estado = TicketStatus.IN_PROGRESS;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets_fallback));
    return tickets_fallback[index];
  },

  getITHealthStats: async (technicianId?: string): Promise<any> => {
    const { classificationService } = await import('./classificationService');
    const [tickets, classifications] = await Promise.all([
      ticketService.getTickets(),
      classificationService.getClassifications()
    ]);
    
    const relevantTickets = technicianId 
      ? tickets.filter(t => t.technicianId === technicianId)
      : tickets;

    const resolved = relevantTickets.filter(t => t.estado === TicketStatus.RESOLVED);
    
    let totalResolutionTime = 0;
    let resolvedWithTime = 0;
    
    resolved.forEach(t => {
      if (t.fecha && t.resolvedAt) {
        const diff = new Date(t.resolvedAt).getTime() - new Date(t.fecha).getTime();
        totalResolutionTime += diff;
        resolvedWithTime++;
      }
    });

    const categories = ['Software', 'Hardware', 'Redes', 'General'];
    const types = categories.map(name => ({
      name,
      count: relevantTickets.filter(t => t.tipo === (name === 'General' ? TicketType.GENERAL : TicketType.IT)).length
    }));

    const byClassification = classifications.map(c => ({
      name: c.name,
      count: relevantTickets.filter(t => t.classificationId === c.id).length
    }));

    const unclassifiedCount = relevantTickets.filter(t => !t.classificationId).length;
    if (unclassifiedCount > 0) {
      byClassification.push({ name: 'Sin clasificar', count: unclassifiedCount });
    }

    const trainingNeeded = relevantTickets.filter(t => t.classificationId === '2').reduce((acc: any, t) => {
      acc[t.userName] = (acc[t.userName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTickets: relevantTickets.length,
      resolvedTickets: resolved.length,
      pendingTickets: relevantTickets.length - resolved.length,
      avgResolutionTimeHours: resolvedWithTime > 0 ? (totalResolutionTime / resolvedWithTime / (1000 * 60 * 60)) : 0,
      byClassification,
      byType: types,
      topUsersByLackOfTraining: Object.entries(trainingNeeded).map(([name, count]: any) => ({ name, count }))
    };
  },

  subscribeToTickets: (callback: () => void) => {
    if (!isDbEnabled) return () => {};

    const channel = supabase
      .channel('public:tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToComments: (ticketId: number, callback: () => void) => {
    if (!isDbEnabled) return () => {};

    const channel = supabase
      .channel(`comments-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `ticketId=eq.${ticketId}`
        },
        () => callback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToAllComments: (callback: (payload: any) => void) => {
    if (!isDbEnabled) return () => {};

    const channel = supabase
      .channel('global-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        (payload) => callback(payload)
      )
      .subscribe((status) => {
        console.log(`🔌 [TicketService] Realtime channel 'global-comments' status:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
};