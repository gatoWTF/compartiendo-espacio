import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Conexión segura usando Service Role (oculta para el frontend)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Método POST para crear una reserva
export async function POST(request) {
  try {
    const body = await request.json();
    const { parking_id, user_id, start_time, duration_hours } = body;

    // Validación básica
    if (!parking_id || !user_id) {
      return NextResponse.json({ success: false, error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Insertar en la base de datos a través del microservicio
    const { data, error } = await supabase
      .from('reservas')
      .insert([
        { 
          estacionamiento_id: parking_id, 
          usuario_id: user_id, 
          fecha_inicio: start_time,
          duracion: duration_hours,
          estado: 'activa'
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}