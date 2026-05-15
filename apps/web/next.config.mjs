// Archivo: apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@parkings/supabase-db"],
  // REGLA 1 & VERCEL DEPLOYMENT: Enrutamiento dinámico a los microservicios
  // Evita problemas de puertos en producción y permite despliegue multi-zona
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:3001/api/v1/auth/:path*'
          : `${process.env.NEXT_PUBLIC_AUTH_MS_URL}/api/v1/auth/:path*`,
      },
      {
        source: '/api/mapas/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:3002/api/v1/search/:path*'
          : `${process.env.NEXT_PUBLIC_MAPAS_MS_URL}/api/v1/search/:path*`,
      },
      {
        source: '/api/reservas/:path*',
        destination: process.env.NODE_ENV === 'development'
          ? 'http://localhost:3003/api/v1/reserve/:path*'
          : `${process.env.NEXT_PUBLIC_RESERVAS_MS_URL}/api/v1/reserve/:path*`,
      },
    ];
  },
};

export default nextConfig;