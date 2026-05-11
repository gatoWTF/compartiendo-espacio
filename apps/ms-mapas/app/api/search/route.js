import { supabase } from '@parkings/supabase-db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // Consulta usando PostGIS para buscar parkings en un radio de 2km
  const { data, error } = await supabase.rpc('nearby_parkings', {
    lat: parseFloat(lat),
    long: parseFloat(lng),
    radius_meters: 2000
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}