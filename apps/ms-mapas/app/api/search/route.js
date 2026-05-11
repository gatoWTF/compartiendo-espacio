import { supabase } from '@parkings/supabase-db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || 5; // Radio en Km

  try {
    // Llama al procedimiento almacenado de PostGIS en Supabase
    const { data, error } = await supabase.rpc('buscar_estacionamientos_cercanos', {
      lat_usuario: parseFloat(lat),
      lng_usuario: parseFloat(lng),
      radio_km: parseFloat(radius),
      solo_pmr: false
    });

    if (error) throw error;
    
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}