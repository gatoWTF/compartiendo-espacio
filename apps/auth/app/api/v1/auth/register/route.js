// Archivo: apps/auth/app/api/v1/auth/register/route.js
import { NextResponse } from 'next/server';
import { AuthController } from '../../../../../../src/controllers/auth.controller';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  return await AuthController.register(request);
}