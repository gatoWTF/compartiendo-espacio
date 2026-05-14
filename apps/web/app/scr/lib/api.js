// apps/web/src/lib/api.js

const API_MAPAS = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';

export const api = {
  mapas: {
    // Busca los estacionamientos cercanos (usado en el Mapa)
    getParkings: async (radius = 5) => {
      const res = await fetch(`${API_MAPAS}/search?radius=${radius}`);
      return await res.json();
    },
    
    // NUEVO: Busca solo los del usuario logueado (usado en Dashboard)
    getMisEstacionamientos: async (userId) => {
      const res = await fetch(`${API_MAPAS}/search?userId=${userId}`);
      return await res.json();
    },

    // NUEVO: Crea un estacionamiento en la BD
    crearEstacionamiento: async (datos) => {
      const res = await fetch(`${API_MAPAS}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      return await res.json();
    },

    // NUEVO: Borra estacionamientos
    eliminarEstacionamientos: async (ids) => {
      const res = await fetch(`${API_MAPAS}/search`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      return await res.json();
    }
  }
};