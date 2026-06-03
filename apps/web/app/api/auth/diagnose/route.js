import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@parkings/supabase-db';

// GET /api/auth/diagnose — server-side auth diagnostics (use in dev only)
export async function GET() {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_AUTH_DIAGNOSE) {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }

  const db = getServiceSupabase();
  const results = {};

  // 1. Check perfiles table is accessible
  try {
    const { data, error } = await db.from('perfiles').select('count').limit(1);
    results.perfiles_access = error ? { error: error.message, code: error.code } : { ok: true };
  } catch (e) {
    results.perfiles_access = { error: e.message };
  }

  // 2. Check the trigger function exists
  try {
    const { data, error } = await db.rpc('pg_catalog.pg_proc', {}).limit(0);
    // Use raw SQL instead
    const { data: triggerData, error: triggerError } = await db
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, action_timing')
      .eq('trigger_name', 'on_auth_user_created');
    results.trigger_exists = triggerError
      ? { error: triggerError.message }
      : { found: triggerData?.length > 0, data: triggerData };
  } catch (e) {
    results.trigger_exists = { error: e.message };
  }

  // 3. Test the handle_new_user function logic via direct SQL
  try {
    const { data, error } = await db.rpc('pg_temp_check_perfiles_constraint', {});
    results.constraint_check = error ? { error: error.message } : { ok: true };
  } catch (e) {
    results.constraint_check = { skipped: 'rpc not available' };
  }

  // 4. Check auth settings (via management API isn't possible with anon key — just show status)
  results.env_check = {
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
    service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
  };

  return NextResponse.json(results);
}
