import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const estacionamiento_id = searchParams.get('estacionamiento_id');

  if (!estacionamiento_id) {
    return NextResponse.json({ error: 'estacionamiento_id requerido' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data, error } = await supabaseAdmin
    .from('reservas')
    .select(`
      calificacion,
      comentario,
      review_photo_url,
      created_at,
      perfiles:conductor_id ( nombre, apellido )
    `)
    .eq('estacionamiento_id', estacionamiento_id)
    .not('calificacion', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}
