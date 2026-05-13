// apps/web/src/lib/api.js

// Estas variables buscarán la URL de Vercel en producción o el localhost en tu PC
const API_MAPAS = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
const API_RESERVAS = process.env.NEXT_PUBLIC_MS_RESERVAS_URL || 'http://localhost:3003/api/v1';

export const api = {
  mapas: {
    getParkings: async (radius = 5) => {
      const res = await fetch(`${API_MAPAS}/search?radius=${radius}`);
      return await res.json();
    }
  },
  reservas: {
    crear: async (data) => {
      const res = await fetch(`${API_RESERVAS}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    }
  }
};