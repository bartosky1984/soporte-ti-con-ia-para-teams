import { createClient } from '@supabase/supabase-js';

// Usar variables de entorno inyectadas vía Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found in environment variables. Database features might be disabled.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
