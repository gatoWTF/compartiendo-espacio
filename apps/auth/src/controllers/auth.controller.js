import { NextResponse } from 'next/server';
import { AuthService } from '../services/auth.service';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_WEB_URL || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const AuthController = {
  async login(request) {
    try {
      const body = await request.json();
      if (!body.email || !body.password) {
        return NextResponse.json(
          { success: false, error: 'Email y contraseña son obligatorios.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const result = await AuthService.login(body);
      return NextResponse.json({ success: true, ...result }, { status: 200, headers: CORS_HEADERS });
    } catch (error) {
      const status = error.message.includes('Credenciales') ? 401 : 500;
      return NextResponse.json({ success: false, error: error.message }, { status, headers: CORS_HEADERS });
    }
  },

  async register(request) {
    try {
      const body = await request.json();
      if (!body.email || !body.password || !body.nombre) {
        return NextResponse.json(
          { success: false, error: 'Nombre, email y contraseña son obligatorios.' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const result = await AuthService.register(body);
      return NextResponse.json({ success: true, ...result }, { status: 201, headers: CORS_HEADERS });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: CORS_HEADERS });
    }
  }
};
