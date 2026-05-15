// Archivo: apps/ms-mapas/app/api/v1/search/route.js
// ✅ ÚNICO lugar que toca Supabase para estacionamientos

import { NextResponse } from 'next/server';
import { supabase } from '@parkings/supabase-db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// GET: Buscar estacionamientos (todos, o filtrados por userId)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    let query = supabase.from('estacionamientos').select('*');
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// POST: Crear un nuevo estacionamiento
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, arrendador, lat, lng, totalSpots, esPmr, userId } = body;

    if (!nombre || !lat || !lng || !userId) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: nombre, lat, lng, userId.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { data, error } = await supabase
      .from('estacionamientos')
      .insert([{
        nombre,
        arrendador,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        total_spots: parseInt(totalSpots) || 1,
        occupied_spots: 0,
        es_pmr: esPmr || false,
        user_id: userId,
        precio_hora: 1500, // Precio base en CLP
        rating: 5.0,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// DELETE: Eliminar estacionamientos por array de IDs
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de IDs.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { error } = await supabase
      .from('estacionamientos')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true, deleted: ids.length }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}