import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log("Checking profiles table...");
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log(`Found ${data.length} profiles:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

checkProfiles();
