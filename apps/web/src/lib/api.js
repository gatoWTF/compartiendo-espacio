// Archivo: apps/web/src/lib/api.js

/**
 * PATRÓN DE DISEÑO: Facade & Singleton (BFF Simulado para Vercel)
 * CUMPLE REGLA 1: Cero interacción directa con Supabase. Todo es HTTP REST.
 * OPTIMIZACIÓN: Interceptores integrados para auth de freakymustchar ecosystem.
 */

class ApiService {
  /**
   * Core Request Handler con interceptor de tokens
   */
  static async request(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('parkings_token') : null;
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'web-p2p',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      // Las rutas relativas /api/* son procesadas por los rewrites de next.config.mjs
      const response = await fetch(endpoint, { ...options, headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error crítico en nodo P2P: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`[SYS_FAILURE] Fallo en conexión al endpoint ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // MICROSERVICIO 1: AUTENTICACIÓN (Puerto 3001)
  // ==========================================
  static auth = {
    login: (credentials) => 
      this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data) => 
      this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) })
  };

  // ==========================================
  // MICROSERVICIO 2: RADAR & GEOLOCALIZACIÓN (Puerto 3002)
  // ==========================================
  static radar = {
    // Injecta zona fallback (Huechuraba) si el dispositivo no soporta GPS
    scanArea: (lat = -33.3670, lng = -70.6385, radius = 5) => 
      this.request(`/api/mapas?lat=${lat}&lng=${lng}&radius=${radius}`, { method: 'GET' })
  };

  // ==========================================
  // MICROSERVICIO 3: TRANSACCIONES P2P (Puerto 3003)
  // ==========================================
  static reserva = {
    crear: (reservaData) => 
      this.request('/api/reservas', { method: 'POST', body: JSON.stringify(reservaData) }),
    verificarDisponibilidad: (parkingId) =>
      this.request(`/api/reservas/check/${parkingId}`, { method: 'GET' })
  };
}

export default ApiService;