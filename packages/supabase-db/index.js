import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Aceptar tanto la anon key convencional, como la Publishable Key o Service Role Key
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase-db] ADVERTENCIA: Faltan llaves de Supabase (URL o KEY). Esto fallará si hay interacciones reales.');
}

// Instancia de Supabase
export const supabase = createClient(supabaseUrl || 'http://mock-supabase.local', supabaseKey || 'mock-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});