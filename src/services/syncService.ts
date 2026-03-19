
import { TicketType, User } from '../types';

export enum SyncAction {
  CREATE_TICKET = 'CREATE_TICKET',
  ADD_COMMENT = 'ADD_COMMENT'
}

export interface SyncItem {
  id: string;
  action: SyncAction;
  data: any;
  timestamp: string;
}

const STORAGE_KEY = 'teams_sync_queue';

export const syncService = {
  getQueue: (): SyncItem[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  enqueue: (action: SyncAction, data: any): void => {
    const queue = syncService.getQueue();
    const newItem: SyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: new Date().toISOString()
    };
    queue.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    console.log(`[SyncService] Enqueued action: ${action}`, newItem);
  },

  removeFromQueue: (id: string): void => {
    const queue = syncService.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  processQueue: async (
    callbacks: {
      onSyncTicket: (data: { tipo: TicketType; descripcion: string; attachmentUrl?: string }, user: User) => Promise<any>;
      onSyncComment: (ticketId: number, text: string, user: User, attachmentUrl?: string) => Promise<any>;
    }
  ): Promise<void> => {
    const queue = syncService.getQueue();
    if (queue.length === 0) return;

    console.log(`[SyncService] Starting synchronization of ${queue.length} items...`);

    // Process in order (FIFO)
    for (const item of queue) {
      try {
        if (item.action === SyncAction.CREATE_TICKET) {
          await callbacks.onSyncTicket(item.data.ticketData, item.data.user);
        } else if (item.action === SyncAction.ADD_COMMENT) {
          await callbacks.onSyncComment(
            item.data.ticketId, 
            item.data.text, 
            item.data.user, 
            item.data.attachmentUrl
          );
        }
        
        // Remove from queue if successful
        syncService.removeFromQueue(item.id);
        console.log(`[SyncService] Successfully synced item: ${item.id}`);
      } catch (error) {
        console.error(`[SyncService] Failed to sync item: ${item.id}`, error);
        // Continue with the next items even if one fails
        continue;
      }
    }
  },

  getQueueCount: (): number => {
    return syncService.getQueue().length;
  }
};
