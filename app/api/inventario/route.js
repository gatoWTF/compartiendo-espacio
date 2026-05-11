import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radio = searchParams.get('radio_km') || 5;

  try {
    if (lat && lng) {
      const { data, error } = await supabase.rpc('buscar_estacionamientos_cercanos', {
        lat_usuario: parseFloat(lat), lng_usuario: parseFloat(lng), radio_km: parseFloat(radio), solo_pmr: false
      });
      if (error) throw error;
      return NextResponse.json(data);
    } else {
      const { data, error } = await supabase.from('estacionamientos').select('*');
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}