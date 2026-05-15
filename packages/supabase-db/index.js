// Archivo: packages/supabase-db/index.js
// ✅ Sin credenciales hardcodeadas — solo variables de entorno

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase-db] Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Configúralas en Vercel o en tu archivo .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);