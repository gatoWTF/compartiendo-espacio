// Archivo: apps/web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // REGLA 1: El frontend NO transpila supabase-db. Solo los microservicios lo hacen.
  async rewrites() {
    const authUrl    = process.env.NEXT_PUBLIC_MS_AUTH_URL;
    const mapasUrl   = process.env.NEXT_PUBLIC_MS_MAPAS_URL;
    const reservasUrl = process.env.NEXT_PUBLIC_MS_RESERVAS_URL;

    // En desarrollo, los rewrites no se usan porque api.js apunta a localhost directamente
    if (process.env.NODE_ENV === 'development') return [];

    // En producción, los rewrites son un fallback — api.js ya usa las URLs completas via env vars
    if (!authUrl || !mapasUrl || !reservasUrl) return [];

    return [
      {
        source: '/api/auth/:path*',
        destination: `${authUrl}/auth/:path*`,
      },
      {
        source: '/api/mapas/:path*',
        destination: `${mapasUrl}/search/:path*`,
      },
      {
        source: '/api/reservas/:path*',
        destination: `${reservasUrl}/reserve/:path*`,
      },
    ];
  },
};

export default nextConfig;
