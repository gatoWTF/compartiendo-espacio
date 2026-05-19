const MAPAS_URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
const RESERVAS_URL = process.env.NEXT_PUBLIC_MS_RESERVAS_URL || 'http://localhost:3003/api/v1';

// --- CIRCUIT BREAKER Y RETRY ---
class CircuitBreaker {
  constructor(failureThreshold = 3, resetTimeout = 10000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = null;
  }

  async fire(requestFn) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit Breaker is OPEN. Fail-fast mode activated to protect microservice.');
      }
    }

    try {
      const response = await requestFn();
      // Si pasa por HALF_OPEN y funciona, resetea
      if (this.state === 'HALF_OPEN') this.reset();
      return response;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.resetTimeout;
        console.error(`[CircuitBreaker] Estado cambiado a OPEN. Esperando ${this.resetTimeout}ms`);
      }
      throw err;
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = null;
  }
}

// Instanciamos breakers para cada microservicio por separado
const mapasBreaker = new CircuitBreaker();
const reservasBreaker = new CircuitBreaker();

// Lógica de Retry con Retroceso Exponencial
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`); // Forzar retry en errores 500+
      return await res.json();
    } catch (error) {
      if (i === retries - 1) throw error; // Si falla la última vez, lanzar
      await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i))); // Retroceso Exponencial
    }
  }
}

// Envoltorio Resiliente
async function callBFF(service, url, options = {}) {
  const breaker = service === 'mapas' ? mapasBreaker : reservasBreaker;
  return breaker.fire(() => fetchWithRetry(url, options));
}

// --- API ORCHESTRATOR (BFF) ---
export const api = {
  mapas: {
    getMisEstacionamientos: (userId) => 
      callBFF('mapas', `${MAPAS_URL}/search?userId=${userId}`),
    
    crearEstacionamiento: (data) => 
      callBFF('mapas', `${MAPAS_URL}/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    
    eliminarEstacionamientos: (ids) => 
      callBFF('mapas', `${MAPAS_URL}/search`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) }),
    
    actualizarOcupacion: (id, occupied_spots) => 
      callBFF('mapas', `${MAPAS_URL}/search`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, occupied_spots }) })
  },
  reservas: {
    verificarDisponibilidad: (parkingId) => 
      callBFF('reservas', `${RESERVAS_URL}/reserve?parkingId=${parkingId}`),
    
    crearReserva: (data) => 
      callBFF('reservas', `${RESERVAS_URL}/reserve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  }
};
