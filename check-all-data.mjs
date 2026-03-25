import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: tickets } = await supabase.from('tickets').select('*');

  console.log(`Profiles: ${profiles?.length || 0}`);
  console.log(JSON.stringify(profiles, null, 2));
  
  console.log(`\nTickets: ${tickets?.length || 0}`);
  console.log(JSON.stringify(tickets, null, 2));
}

checkData();
