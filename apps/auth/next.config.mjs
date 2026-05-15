// Archivo: apps/auth/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@parkings/supabase-db"],
};

export default nextConfig;
