import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const estacionamiento_id = searchParams.get('estacionamiento_id');

  if (!estacionamiento_id) {
    return NextResponse.json({ success: false, error: 'estacionamiento_id requerido' }, { status: 400 });
  }

  const idNum = parseInt(estacionamiento_id, 10);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ success: false, error: 'estacionamiento_id inválido' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // 1) Reseñas (reservas calificadas) del estacionamiento.
  const { data: reviews, error } = await supabaseAdmin
    .from('reservas')
    .select('id, calificacion, comentario, review_photo_url, created_at, conductor_id')
    .eq('estacionamiento_id', idNum)
    .not('calificacion', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // 2) Perfiles de los autores (no hay FK declarada, así que consultamos aparte).
  const ids = [...new Set((reviews || []).map(r => r.conductor_id).filter(Boolean))];
  let perfiles = {};
  if (ids.length) {
    const { data: pf } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre, apellido, avatar_url')
      .in('id', ids);
    perfiles = Object.fromEntries((pf || []).map(p => [p.id, p]));
  }

  const data = (reviews || []).map(r => ({
    id: r.id,
    calificacion: r.calificacion,
    comentario: r.comentario,
    review_photo_url: r.review_photo_url,
    created_at: r.created_at,
    perfil: perfiles[r.conductor_id] || null,
  }));

  // Resumen: promedio y distribución de estrellas.
  const total = data.length;
  const promedio = total ? data.reduce((a, r) => a + r.calificacion, 0) / total : 0;
  const distribucion = [1, 2, 3, 4, 5].reduce((acc, n) => {
    acc[n] = data.filter(r => r.calificacion === n).length;
    return acc;
  }, {});

  return NextResponse.json({ success: true, data, resumen: { total, promedio, distribucion } });
}
