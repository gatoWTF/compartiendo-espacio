// Archivo: apps/web/app/api/reservas/reserve/route.js
//
// Route Handler de MISMO ORIGEN para reservas (sustituye a `ms-reservas` en runtime).
// Implementa el patrón Saga: crear reserva -> incrementar ocupación -> compensar si falla.
//
// - GET (disponibilidad): cliente anónimo (lectura pública de estacionamientos).
// - POST (crear reserva): cliente con el JWT del usuario, para que RLS exija
//   auth.uid() = conductor_id.

import { NextResponse } from 'next/server';
import { supabase, getSupabaseWithToken } from '@parkings/supabase-db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getToken(request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parkingId = searchParams.get('parkingId');
    if (!parkingId) {
      return NextResponse.json({ success: false, error: 'Falta parkingId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('estacionamientos')
      .select('occupied_spots, total_spots, nombre, id')
      .eq('id', parkingId)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        available: data.occupied_spots < data.total_spots,
        spots_left: data.total_spots - data.occupied_spots,
        data,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const { parking_id, user_id, start_time } = body;
    if (!parking_id || !user_id) {
      return NextResponse.json({ success: false, error: 'Faltan parking_id o user_id.' }, { status: 400 });
    }

    const db = getSupabaseWithToken(token);

    // Transacción atómica vía RPC SECURITY DEFINER: verifica disponibilidad con
    // bloqueo de fila (anti doble-reserva), inserta la reserva del auth.uid() y
    // incrementa la ocupación, todo en una sola transacción del lado de Postgres.
    // Sustituye a la Saga manual, que RLS bloqueaba (un conductor no es dueño del
    // estacionamiento y no podía actualizar occupied_spots).
    const { data: reserva, error } = await db.rpc('reservar_estacionamiento', {
      p_estacionamiento_id: parking_id,
    });

    if (error) {
      const lleno = /lleno/i.test(error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: lleno ? 409 : 400 });
    }

    return NextResponse.json({ success: true, reserva }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
