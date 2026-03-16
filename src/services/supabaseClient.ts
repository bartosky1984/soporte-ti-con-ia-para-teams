import { createClient } from '@supabase/supabase-js';

// Usar variables de entorno inyectadas vía Vite (definidas en vite.config.ts)
const supabaseUrl = (typeof process !== 'undefined' && process.env.SUPABASE_URL) || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = (typeof process !== 'undefined' && process.env.SUPABASE_KEY) || import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found in environment variables. Database features might be disabled.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
