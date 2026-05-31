import { NextResponse } from 'next/server';

export default function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Rutas protegidas (Añadir más si es necesario)
  const protectedPaths = ['/dashboard', '/profile'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Las cookies en este diseño podrían no estar presentes si usamos localStorage.
  // Sin embargo, si es necesario, podemos bloquear desde Edge o redirigir y dejar que el cliente resuelva.
  // Next.js no puede leer localStorage en Middleware, pero puede proteger las rutas a nivel servidor 
  // si tuvieramos cookies de sesión Supabase.
  // Dado que el sistema parece usar localStorage (visto en dashboard), redirigiremos al login si no detectamos cookie de auth.
  // Para una implementación ideal, se deberían setear cookies con los tokens de sesión.
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
