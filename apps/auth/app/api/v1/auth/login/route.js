// Archivo: apps/auth/app/api/v1/auth/login/route.js
// ✅ ÚNICO lugar que toca Supabase para autenticación (login)

import { NextResponse } from 'next/server';
import { supabase } from '@parkings/supabase-db'; // FIX: era '@parkings/database' (no existía)

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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son obligatorios.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas. Verifica tu email y contraseña.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id:    data.user.id,
          email: data.user.email,
          nombre: data.user.user_metadata?.nombre_completo ?? data.user.user_metadata?.full_name ?? 'Usuario',
        },
        access_token: data.session.access_token,
      },
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}