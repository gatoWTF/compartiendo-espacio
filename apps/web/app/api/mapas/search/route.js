// Archivo: apps/web/app/api/mapas/search/route.js
//
// Route Handler de MISMO ORIGEN para estacionamientos.
// Sustituye la dependencia en runtime del microservicio externo `ms-mapas`.
// Al correr dentro de apps/web (lado servidor en Vercel), no requiere CORS ni
// que exista localhost:3002 en producción: este fue el origen del bug de
// "estacionamientos no se muestran en Vercel".
//
// - Lecturas (GET): cliente anónimo. La política RLS `estacionamientos_select_all
//   USING (true)` permite lectura pública.
// - Escrituras (POST/PATCH/DELETE): cliente con el JWT del usuario reenviado en
//   la cabecera Authorization, de modo que RLS evalúa auth.uid() = usuario real.

import { NextResponse } from 'next/server';
import { supabase, getSupabaseWithToken } from '@parkings/supabase-db';

// Forzamos runtime Node (no Edge) para máxima compatibilidad con supabase-js.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getToken(request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Distancia Haversine en km (filtro geográfico en memoria mientras no haya RPC PostGIS).
function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radius = parseFloat(searchParams.get('radius'));

    // Filtros de BÚSQUEDA AVANZADA (todos opcionales y combinables).
    const q = searchParams.get('q');                    // texto libre sobre nombre
    const comuna = searchParams.get('comuna');           // comuna (case-insensitive)
    const pmr = searchParams.get('pmr');                 // 'true' → solo plazas PMR
    const disponible = searchParams.get('disponible');   // 'true' → con cupo libre
    const precioMax = parseFloat(searchParams.get('precioMax'));

    let query = supabase.from('estacionamientos').select('*');
    if (userId) query = query.eq('user_id', userId);
    if (q) {
      const escaped = q.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.ilike('nombre', `%${escaped}%`);
    }
    if (comuna) query = query.ilike('comuna', comuna);
    if (pmr === 'true') query = query.eq('es_pmr', true);
    if (!Number.isNaN(precioMax)) query = query.lte('precio_hora', precioMax);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message, data: [] }, { status: 500 });
    }

    let result = data || [];

    // Disponibilidad: requiere columnas total_spots/occupied_spots (migración 005).
    if (disponible === 'true') {
      result = result.filter(
        (p) => p.total_spots == null || Number(p.occupied_spots ?? 0) < Number(p.total_spots)
      );
    }

    // Filtro geográfico opcional (solo si se entregan lat/lng/radius válidos y radius < 9999).
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && !Number.isNaN(radius) && radius > 0 && radius < 9999) {
      result = result.filter(
        (p) => distanciaKm(lat, lng, Number(p.lat), Number(p.lng)) <= radius
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.nombre || body.lat === undefined || body.lng === undefined) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: nombre, lat, lng.' },
        { status: 400 }
      );
    }

    const latVal = parseFloat(body.lat);
    const lngVal = parseFloat(body.lng);
    if (!Number.isFinite(latVal) || !Number.isFinite(lngVal)) {
      return NextResponse.json({ success: false, error: 'lat/lng inválidos.' }, { status: 400 });
    }

    const db = getSupabaseWithToken(token);
    const { data: { user } } = await db.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Sesión inválida.' }, { status: 401 });

    const parkingData = {
      nombre: body.nombre,
      arrendador: body.arrendador,
      lat: latVal,
      lng: lngVal,
      coordenadas: `SRID=4326;POINT(${lngVal} ${latVal})`,
      total_spots: parseInt(body.totalSpots) || 1,
      occupied_spots: 0,
      es_pmr: body.esPmr || false,
      user_id: user.id,
      precio_hora: parseInt(body.precioHora) || 1500,
      comuna: body.comuna || null,
    };

    const { data, error } = await db
      .from('estacionamientos')
      .insert([parkingData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const spots = parseInt(body.occupied_spots);
    if (!body.id || !Number.isFinite(spots) || spots < 0) {
      return NextResponse.json({ success: false, error: 'Se requiere id y occupied_spots (>= 0).' }, { status: 400 });
    }

    const db = getSupabaseWithToken(token);
    const { data, error } = await db
      .from('estacionamientos')
      .update({ occupied_spots: spots })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Se requiere un array de IDs.' }, { status: 400 });
    }

    const db = getSupabaseWithToken(token);
    const { error } = await db.from('estacionamientos').delete().in('id', body.ids);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: true, deleted: body.ids.length }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
