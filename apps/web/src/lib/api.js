const MAPAS_URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
const RESERVAS_URL = process.env.NEXT_PUBLIC_MS_RESERVAS_URL || 'http://localhost:3003/api/v1';

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
    },
    actualizarOcupacion: async (id, occupied_spots) => {
      const res = await fetch(`${MAPAS_URL}/search`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, occupied_spots }),
      });
      return res.json();
    }
  },
  reservas: {
    verificarDisponibilidad: async (parkingId) => {
      const res = await fetch(`${RESERVAS_URL}/reserve?parkingId=${parkingId}`);
      return res.json();
    },
    crearReserva: async (data) => {
      const res = await fetch(`${RESERVAS_URL}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    }
  }
};
