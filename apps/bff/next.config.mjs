/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esto permite que la app vea el código de tus paquetes compartidos
  transpilePackages: ["@parkings/supabase-db"],
};

export default nextConfig;