import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('[supabase-db] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Entorno backend mal configurado.');
}

// Instancia óptima para Backend Serverless con permisos de administrador
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});