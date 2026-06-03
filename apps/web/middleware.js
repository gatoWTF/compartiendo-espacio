import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rutas que requieren sesión activa
const PROTECTED = ['/dashboard', '/profile', '/reservas'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(route => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // Leer el access_token del cookie de sesión de Supabase
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
    const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;

    if (!accessToken) throw new Error('No token');

    // Verificar que el token no esté expirado (check rápido sin llamada de red)
    const [, payload] = accessToken.split('.');
    // JWT uses base64url (RFC 4648 §5): replace - → + and _ → /, then pad to multiple of 4
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=');
    const { exp } = JSON.parse(Buffer.from(padded, 'base64').toString());
    if (Date.now() / 1000 > exp) throw new Error('Token expired');

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
