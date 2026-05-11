import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // El BFF orquesta la petición hacia el microservicio de mapas
  // En producción, process.env.MS_MAPAS_URL apuntará a la URL de Vercel del microservicio
  const mapasUrl = process.env.MS_MAPAS_URL || 'http://localhost:3002';

  try {
    const res = await fetch(`${mapasUrl}/api/search?lat=${lat}&lng=${lng}`);
    const data = await res.json();

    // El BFF procesa y limpia la data antes de enviarla al frontend
    return NextResponse.json({
      service: "BFF Parking's Together",
      status: "Orquestación exitosa",
      results: data.data || []
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Fallo en la comunicación entre microservicios" }, { status: 502 });
  }
}