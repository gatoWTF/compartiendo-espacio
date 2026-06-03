import { NextResponse } from 'next/server';

// Rutas que requieren sesión activa
const PROTECTED = ['/dashboard', '/profile', '/reservas'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(route => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // Leer la cookie de sesión de Supabase
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/sb-[^-]+-auth-token=([^;]+)/);

  if (!tokenMatch) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const raw = decodeURIComponent(tokenMatch[1]);
    const parsed = JSON.parse(raw);
    const accessToken  = Array.isArray(parsed) ? parsed[0]  : parsed?.access_token;
    const refreshToken = Array.isArray(parsed) ? parsed[1]  : parsed?.refresh_token;

    if (!accessToken) throw new Error('No token');

    // Verificar expiración del access token (check rápido sin llamada de red)
    const [, payload] = accessToken.split('.');
    // JWT usa base64url: normalizar antes de decodificar
    const b64    = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=');
    const { exp } = JSON.parse(Buffer.from(padded, 'base64').toString());

    // Si el access token está expirado PERO existe un refresh token, dejamos pasar:
    // supabase-js en el cliente renovará la sesión automáticamente al cargar la página.
    // Solo bloqueamos si no hay ningún refresh token (sesión completamente cerrada).
    if (Date.now() / 1000 > exp && !refreshToken) {
      throw new Error('Token expired and no refresh token');
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/reservas/:path*'],
};
