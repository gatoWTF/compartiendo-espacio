// apps/auth/src/app/api/v1/auth/login/route.js
// ✅ ÚNICO lugar que toca Supabase para autenticación

import { NextResponse } from 'next/server';
import { supabase } from '@parkings/database';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // En Vercel: reemplazar por URL de apps/web
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

    // Validación básica de entrada
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y contraseña son obligatorios.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Supabase Auth — signInWithPassword vive SOLO en el microservicio
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas. Verifica tu email y contraseña.' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Devolvemos solo lo que el frontend necesita — nunca la sesión completa
    return NextResponse.json(
      {
        success: true,
        user: {
          id:    data.user.id,
          email: data.user.email,
          name:  data.user.user_metadata?.full_name ?? 'Usuario',
        },
        access_token: data.session.access_token,
      },
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (err) {
    // Captura errores de parseo JSON o fallos inesperados
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}