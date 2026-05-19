// Archivo: apps/ms-reservas/app/api/v1/reserve/route.js
import { NextResponse } from 'next/server';
import { ReserveController } from '../../../../../src/controllers/reserve.controller';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  return await ReserveController.createReserve(request);
}

export async function GET(request) {
  return await ReserveController.checkAvailability(request);
}