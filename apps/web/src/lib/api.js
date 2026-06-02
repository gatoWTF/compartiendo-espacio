import { supabase } from '@parkings/supabase-db';

// El web usa SIEMPRE route handlers de MISMO ORIGEN (/api/mapas, /api/reservas),
// que viven dentro de apps/web y consultan Supabase en el servidor.
// Esto elimina por completo la dependencia en runtime de microservicios externos
// (cuya URL inlineada caía a localhost en Vercel), que era la causa de que los
// estacionamientos no se mostraran en producción. Es determinista: no depende de
// ninguna variable NEXT_PUBLIC_MS_*_URL que pudiera quedar mal configurada.
const MAPAS_URL = '/api/mapas';
const RESERVAS_URL = '/api/reservas';

/**
 * Cabeceras con el JWT del usuario (si hay sesión), para que RLS evalúe
 * auth.uid() en operaciones de escritura.
 */
async function authHeaders() {
  const base = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) base.Authorization = `Bearer ${session.access_token}`;
  } catch {
    // sin sesión → se envían solo las cabeceras base
  }
  return base;
}

/**
 * Envoltorio Resiliente con AbortController y Timeout.
 * Límite estricto de 8 segundos. Si falla, retorna Fallback seguro
 * pero preservando el mensaje real del backend para no ocultar el error.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);

    let payload = null;
    try { payload = await response.json(); } catch { /* respuesta sin cuerpo JSON */ }

    if (!response.ok) {
      return {
        success: false,
        error: payload?.error || `HTTP Error: ${response.status}`,
        data: [],
      };
    }
    return payload ?? { success: true, data: [] };
  } catch (error) {
    clearTimeout(id);
    console.error(`[BFF Timeout/Error] Falló la petición a ${url}`, error.message);
    return {
      success: false,
      error: true,
      message: 'El servicio está experimentando latencia o no está disponible.',
      data: [],
      fallback: true,
    };
  }
}

// --- API ORCHESTRATOR (BFF) ---
export const api = {
  mapas: {
    getMisEstacionamientos: (userId) =>
      fetchWithTimeout(`${MAPAS_URL}/search?userId=${userId}`),

    crearEstacionamiento: async (data) =>
      fetchWithTimeout(`${MAPAS_URL}/search`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(data),
      }),

    eliminarEstacionamientos: async (ids) =>
      fetchWithTimeout(`${MAPAS_URL}/search`, {
        method: 'DELETE',
        headers: await authHeaders(),
        body: JSON.stringify({ ids }),
      }),

    actualizarOcupacion: async (id, occupied_spots) =>
      fetchWithTimeout(`${MAPAS_URL}/search`, {
        method: 'PATCH',
        headers: await authHeaders(),
        body: JSON.stringify({ id, occupied_spots }),
      }),
  },
  reservas: {
    verificarDisponibilidad: (parkingId) =>
      fetchWithTimeout(`${RESERVAS_URL}/reserve?parkingId=${parkingId}`),

    crearReserva: async (data) =>
      fetchWithTimeout(`${RESERVAS_URL}/reserve`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(data),
      }),
  },
};
