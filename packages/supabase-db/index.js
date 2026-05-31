import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !anonKey) {
  console.warn('[supabase-db] ADVERTENCIA: Faltan llaves de Supabase (URL o ANON KEY).');
}

// Instancia de Supabase para Cliente / Uso General (Sólo RLS permitido)
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl || 'http://mock-supabase.local', anonKey || 'mock-key', {
  auth: {
    autoRefreshToken: isBrowser,
    persistSession: isBrowser,
    detectSessionInUrl: isBrowser
  }
});

// Instancia de Supabase con Privilegios Elevados (Service Role)
// IMPORTANTE: NUNCA usar esto en componentes de Next.js (Frontend) que corran en el cliente.
export const getServiceSupabase = () => {
  if (typeof window !== 'undefined') {
    throw new Error('CUIDADO: Se intentó inicializar el Service Role Client en el navegador. Operación bloqueada por seguridad.');
  }
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('[supabase-db] Faltan variables de entorno: SUPABASE_SERVICE_ROLE_KEY no está definida.');
  }

  return createClient(supabaseUrl || 'http://mock-supabase.local', serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
};