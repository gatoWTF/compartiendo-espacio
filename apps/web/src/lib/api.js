const URL_MAPAS = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
const URL_AUTH  = process.env.NEXT_PUBLIC_MS_AUTH_URL  || 'http://localhost:3001/api/v1';

export const api = {
  buscarPlazas: async (radio = 5, lat = -33.3601, lng = -70.6925) => {
    try {
      const res = await fetch(`${URL_MAPAS}/search?radius=${radio}&lat=${lat}&lng=${lng}`, { 
        cache: 'no-store',
        mode: 'cors'
      });
      if (!res.ok) throw new Error('Error en respuesta del servidor');
      return await res.json();
    } catch (err) {
      console.error("📡 Error Radar:", err.message);
      return { success: false, data: [] };
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch(`${URL_AUTH}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) { return { success: false, error: 'Servidor Auth desconectado' }; }
  },

  register: async (email, password, nombre) => {
    try {
      const res = await fetch(`${URL_AUTH}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nombre })
      });
      return await res.json();
    } catch (err) { return { success: false, error: 'Error de red en registro' }; }
  }
};