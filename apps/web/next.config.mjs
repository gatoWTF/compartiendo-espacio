/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El web consume @parkings/supabase-db desde sus route handlers de mismo origen
  // (app/api), por lo que debe transpilar el paquete del workspace.
  transpilePackages: ["@parkings/supabase-db"],
  async rewrites() {
    const authUrl = process.env.NEXT_PUBLIC_MS_AUTH_URL;
    const mapasUrl = process.env.NEXT_PUBLIC_MS_MAPAS_URL;
    const reservasUrl = process.env.NEXT_PUBLIC_MS_RESERVAS_URL;
    if (process.env.NODE_ENV === "development") return [];
    if (!authUrl || !mapasUrl || !reservasUrl) return [];
    return [
      { source: "/api/auth/:path*", destination: authUrl + "/auth/:path*" },
      { source: "/api/mapas/:path*", destination: mapasUrl + "/search/:path*" },
      { source: "/api/reservas/:path*", destination: reservasUrl + "/reserve/:path*" },
    ];
  },
};

export default nextConfig;
