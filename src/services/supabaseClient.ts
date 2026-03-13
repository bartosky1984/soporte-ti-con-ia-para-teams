import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppbrdcqbmtgqrwvzakov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYnJkY3FibXRncXJ3dnpha292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjE4MTAsImV4cCI6MjA4ODk5NzgxMH0.BJibRjM5tpKGGR3SCB-Shf4nIbRH4JMxmzPTdlW1kjw';

export const supabase = createClient(supabaseUrl, supabaseKey);
