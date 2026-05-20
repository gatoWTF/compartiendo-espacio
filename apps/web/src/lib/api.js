const MAPAS_URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
const RESERVAS_URL = process.env.NEXT_PUBLIC_MS_RESERVAS_URL || 'http://localhost:3003/api/v1';

/**
 * Envoltorio Resiliente con AbortController y Timeout
 * Limite estricto de 4 segundos. Si falla, retorna Fallback seguro.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    
    console.error(`[BFF Timeout/Error] Falló la petición a ${url}`, error.message);
    
    // Objeto Fallback para evitar el colapso del UI
    return {
      error: true,
      message: 'El servicio está experimentando latencia o no está disponible.',
      data: [],
      fallback: true
    };
  }
}

// --- API ORCHESTRATOR (BFF) ---
export const api = {
  mapas: {
    getMisEstacionamientos: (userId) => 
      fetchWithTimeout(`${MAPAS_URL}/search?userId=${userId}`),
    
    crearEstacionamiento: (data) => 
      fetchWithTimeout(`${MAPAS_URL}/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    
    eliminarEstacionamientos: (ids) => 
      fetchWithTimeout(`${MAPAS_URL}/search`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
    
    actualizarOcupacion: (id, occupied_spots) => 
      fetchWithTimeout(`${MAPAS_URL}/search`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, occupied_spots }) })
  },
  reservas: {
    verificarDisponibilidad: (parkingId) => 
      fetchWithTimeout(`${RESERVAS_URL}/reserve?parkingId=${parkingId}`),
    
    crearReserva: (data) => 
      fetchWithTimeout(`${RESERVAS_URL}/reserve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  }
};
