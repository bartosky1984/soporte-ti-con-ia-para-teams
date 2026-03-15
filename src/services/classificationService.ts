import { TicketClassification } from '../types';
import { supabase } from './supabaseClient';

const isDbEnabled = (import.meta.env?.VITE_DB_ENABLED === 'true' || (typeof process !== 'undefined' && process.env.DB_ENABLED === 'true'));

const DEFAULT_CLASSIFICATIONS: TicketClassification[] = [
  { id: '1', name: 'Problema técnico' },
  { id: '2', name: 'Falta de formación' }
];

export const classificationService = {
  getClassifications: async (): Promise<TicketClassification[]> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('classifications')
          .select('*')
          .order('id');
        
        if (error) throw error;
        if (data && data.length > 0) return data as TicketClassification[];
      } catch (e) {
        console.error("Supabase getClassifications failed", e);
      }
    }

    // Static fallback
    return DEFAULT_CLASSIFICATIONS;
  },

  addClassification: async (name: string): Promise<TicketClassification> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('classifications')
          .insert([{ id: Date.now().toString(), name }] )
          .select()
          .single();
        if (!error) return data as TicketClassification;
      } catch (e) {
        console.error("Supabase addClassification failed", e);
      }
    }

    return { id: Date.now().toString(), name };
  },

  updateClassification: async (id: string, name: string): Promise<TicketClassification | null> => {
    if (isDbEnabled) {
      try {
        const { data, error } = await supabase
          .from('classifications')
          .update({ name })
          .eq('id', id)
          .select()
          .single();
        if (!error) return data as TicketClassification;
      } catch (e) {
        console.error("Supabase updateClassification failed", e);
      }
    }
    return null;
  },

  deleteClassification: async (id: string): Promise<void> => {
    if (isDbEnabled) {
      try {
        await supabase.from('classifications').delete().eq('id', id);
        return;
      } catch (e) {
        console.error("Supabase deleteClassification failed", e);
      }
    }
  }
};
