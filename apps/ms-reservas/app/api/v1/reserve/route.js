// Archivo: apps/ms-reservas/app/api/v1/reserve/route.js
// ✅ ÚNICO lugar que toca Supabase para reservas

import { NextResponse } from 'next/server';
import { supabase } from '@parkings/supabase-db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST: Crear una reserva
export async function POST(request) {
  try {
    const body = await request.json();
    const { parking_id, user_id, start_time, duration_hours } = body;

    if (!parking_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos obligatorios: parking_id, user_id.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { data, error } = await supabase
      .from('reservas')
      .insert([{
        estacionamiento_id: parking_id,
        usuario_id: user_id,
        fecha_inicio: start_time || new Date().toISOString(),
        duracion: duration_hours || 1,
        estado: 'activa',
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// GET: Verificar disponibilidad de un estacionamiento
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parkingId = searchParams.get('parkingId');

  if (!parkingId) {
    return NextResponse.json(
      { success: false, error: 'Se requiere parkingId.' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const { data, error } = await supabase
      .from('estacionamientos')
      .select('id, nombre, total_spots, occupied_spots')
      .eq('id', parkingId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      available: data.occupied_spots < data.total_spots,
      spots_left: data.total_spots - data.occupied_spots,
      data,
    }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}