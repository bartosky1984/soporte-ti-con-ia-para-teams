import { createClient } from '@supabase/supabase-js';

// Multi-layered variable detection for maximum compatibility (Vercel + Vite)
// Canonical Vite environment variable detection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

console.log("🛠️ [Supabase] Initializing with URL:", supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ [Supabase] Credentials not found in VITE_ environment variables!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
