import { NextResponse } from 'next/server';
import { ReserveService } from './services/reserva.service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const parkingId = searchParams.get('parkingId');
    if (!parkingId) {
      return NextResponse.json({ error: 'Falta parkingId' }, { status: 400, headers: CORS_HEADERS });
    }
    
    const result = await ReserveService.checkAvailability(parkingId);
    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const result = await ReserveService.processSaga(body);
    return NextResponse.json({ success: true, reserva: result }, { status: 201, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}