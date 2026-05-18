const MAPAS_URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';

export const api = {
  mapas: {
    getMisEstacionamientos: async (userId) => {
      const res = await fetch(`${MAPAS_URL}/search?userId=${userId}`);
      return res.json();
    },
    crearEstacionamiento: async (data) => {
      const res = await fetch(`${MAPAS_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    eliminarEstacionamientos: async (ids) => {
      const res = await fetch(`${MAPAS_URL}/search`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.json();
    }
  }
};
