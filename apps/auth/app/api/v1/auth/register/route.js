// Archivo: apps/auth/app/api/v1/auth/register/route.js
// ✅ ÚNICO lugar que toca Supabase para registro

import { NextResponse } from 'next/server';
import { supabase } from '@parkings/supabase-db';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, nombre } = body;

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { success: false, error: 'Nombre, email y contraseña son obligatorios.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre_completo: nombre },
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Cuenta creada. Revisa tu correo para confirmar.',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 201, headers: CORS_HEADERS }
    );

  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}