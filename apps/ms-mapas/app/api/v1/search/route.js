import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. BUSCAR ESTACIONAMIENTOS (Para el Mapa y el Dashboard)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const radius = searchParams.get('radius');
  const userId = searchParams.get('userId');

  try {
    let query = supabase.from('estacionamientos').select('*').order('created_at', { ascending: false });

    // Si pasamos un userId, filtramos solo los de ese usuario (Para el Dashboard)
    if (userId) {
      query = query.eq('user_id', userId);
    } 

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. CREAR UN ESTACIONAMIENTO NUEVO
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, arrendador, lat, lng, totalSpots, userId, esPmr } = body;

    const { data, error } = await supabase.from('estacionamientos').insert([{
      nombre, 
      arrendador, 
      lat: parseFloat(lat), 
      lng: parseFloat(lng), 
      total_spots: parseInt(totalSpots), 
      occupied_spots: 0, 
      user_id: userId, 
      es_pmr: esPmr, 
      ubicacion: `SRID=4326;POINT(${parseFloat(lng)} ${parseFloat(lat)})`
    }]).select();

    if (error) throw error;
    return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. ELIMINAR ESTACIONAMIENTOS
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { ids } = body;

    const { error } = await supabase.from('estacionamientos').delete().in('id', ids);
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}