import { supabase } from '@parkings/supabase-db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { estacionamiento_id, conductor_id, patente } = await request.json();

    // 1. Iniciar Transacción / Patrón Saga (Estado Pendiente)
    const { data, error } = await supabase
      .from('reservas')
      .insert([{ 
        estacionamiento_id, 
        conductor_id, 
        patente_registrada: patente, 
        estado: 'pendiente' 
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: "Pre-reserva generada con éxito (TTL iniciado)",
      reserva: data[0]
    }, { status: 201 });

  } catch (error) {
    // Compensación en caso de fallo (Saga)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}