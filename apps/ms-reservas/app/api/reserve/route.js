import { supabase } from '@parkings/supabase-db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { parkingId, userId } = await request.json();

  // Lógica de bloqueo con TTL (bloquea la plaza por 5 min)
  const { data, error } = await supabase
    .from('reservas')
    .insert([{ parking_id: parkingId, user_id: userId, status: 'pending' }]);

  if (error) return NextResponse.json({ error: "Plaza ocupada o error" }, { status: 400 });
  
  return NextResponse.json({ message: "Reserva iniciada (Saga Step 1)", data });
}