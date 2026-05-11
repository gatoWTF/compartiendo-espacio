import { NextResponse } from 'next/server';

export async function GET() {
  // El BFF llama a los microservicios internos
  const resMapas = await fetch(`${process.env.MS_MAPAS_URL}/api/search?lat=-33.4&lng=-70.6`);
  const parkings = await resMapas.json();

  return NextResponse.json({
    summary: "Parkings cercanos encontrados",
    count: parkings.length,
    results: parkings
  });
}