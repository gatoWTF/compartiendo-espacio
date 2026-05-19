import { NextResponse } from 'next/server';
import { ReserveService } from '../services/reserve.service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const ReserveController = {
  async createReserve(request) {
    try {
      const body = await request.json();
      
      if (!body.parking_id || !body.user_id) {
        return NextResponse.json(
          { success: false, error: 'Faltan datos obligatorios: parking_id, user_id.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const reserva = await ReserveService.processSaga(body);
      return NextResponse.json({ success: true, data: reserva, message: 'Saga completada con éxito.' }, { status: 201, headers: CORS_HEADERS });

    } catch (error) {
      const status = error.message.includes('lleno') ? 409 : 500;
      return NextResponse.json({ success: false, error: error.message }, { status, headers: CORS_HEADERS });
    }
  },

  async checkAvailability(request) {
    const { searchParams } = new URL(request.url);
    const parkingId = searchParams.get('parkingId');

    if (!parkingId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere parkingId.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    try {
      const result = await ReserveService.checkAvailability(parkingId);
      return NextResponse.json({ success: true, ...result }, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
    }
  }
};
