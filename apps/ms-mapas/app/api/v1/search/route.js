// Archivo: apps/ms-mapas/app/api/v1/search/route.js
import { NextResponse } from 'next/server';
import { MapController } from '../../../../../src/controllers/map.controller';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request) {
  return await MapController.get(request);
}

export async function POST(request) {
  return await MapController.create(request);
}

export async function DELETE(request) {
  return await MapController.remove(request);
}

export async function PATCH(request) {
  return await MapController.update(request);
}