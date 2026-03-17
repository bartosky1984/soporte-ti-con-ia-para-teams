import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const profilesToSeed = [
  { id: '1', name: 'Administrador Principal', email: 'admin@it.com', role: 'ADMIN' },
  { id: '2', name: 'Soporte Técnico Alpha', email: 'tech1@it.com', role: 'LEAD_TECHNICIAN' },
  { id: '3', name: 'Soporte Técnico Beta', email: 'tech2@it.com', role: 'TECHNICIAN' },
  { id: '999', name: 'Empleado Demo', email: 'empleado@empresa.com', role: 'USER' },
  { id: '100', name: 'Juan Pérez', email: 'juan.perez@empresa.com', role: 'USER' },
  { id: '101', name: 'María García', email: 'maria.garcia@empresa.com', role: 'USER' },
  { id: '102', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@empresa.com', role: 'USER' },
  { id: '103', name: 'Ana Martínez', email: 'ana.martinez@empresa.com', role: 'USER' }
];

async function seedProfiles() {
  console.log("Upserting profiles...");
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profilesToSeed, { onConflict: 'id' });

  if (error) {
    console.error("Error seeding profiles:", error);
  } else {
    console.log("Profiles seeded successfully!");
  }
}

seedProfiles();
