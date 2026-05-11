import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://obthriistwvcutjfrksh.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_9oZBfbo30bfpZVEMlw9-kg_vK-zlkA-";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);