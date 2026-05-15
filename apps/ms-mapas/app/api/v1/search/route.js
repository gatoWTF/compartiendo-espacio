import { NextResponse } from 'next/server';
import { supabase } from '@parkings/supabase-db'; // 🔑 EL FIX: El paquete real

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const radius = parseFloat(searchParams.get('radius')) || 5;

  try {
    // Solo este microservicio toca la BD. Regla de oro respetada.
    const { data, error } = await supabase.from('estacionamientos').select('*');
    if (error) throw error;
    
    return NextResponse.json({ success: true, data }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}