import test from 'node:test';
import assert from 'node:assert';
import { api } from '../src/lib/api.js';

// Mock global fetch para simular las respuestas de los microservicios sin llamar a la red real
global.fetch = async (url, options) => {
  const method = options?.method || 'GET';
  
  // Mock MS Mapas
  if (url.includes('3002/api/v1/search')) {
    if (method === 'PATCH') {
      const body = JSON.parse(options.body);
      if (body.occupied_spots > 10) {
        return { json: async () => ({ success: false, error: 'Excede capacidad' }) };
      }
      return { json: async () => ({ success: true, data: { id: body.id, occupied_spots: body.occupied_spots } }) };
    }
  }

  // Mock MS Reservas (Saga Flow)
  if (url.includes('3003/api/v1/reserve')) {
    if (method === 'GET') {
      // Simular verificación de disponibilidad
      const isAvailable = !url.includes('full-parking-id');
      return { json: async () => ({ success: true, available: isAvailable }) };
    }
    
    if (method === 'POST') {
      const body = JSON.parse(options.body);
      if (body.parking_id === 'error-saga') {
        return { json: async () => ({ success: false, error: 'Fallo simulado en Saga de Reservas' }) };
      }
      return { json: async () => ({ success: true, data: { id: 'res-123', estado: 'activa' } }) };
    }
  }

  return { json: async () => ({ success: false, error: 'Not Found' }) };
};

test('BFF - Mapas: Debería actualizar ocupación correctamente', async (t) => {
  const res = await api.mapas.actualizarOcupacion('park-1', 5);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.occupied_spots, 5);
});

test('BFF - Mapas: Debería fallar al exceder capacidad en PATCH', async (t) => {
  const res = await api.mapas.actualizarOcupacion('park-1', 15);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Excede capacidad');
});

test('BFF - Reservas (Saga): Debería verificar disponibilidad', async (t) => {
  const res = await api.reservas.verificarDisponibilidad('park-valid');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.available, true);
});

test('BFF - Reservas (Saga): Debería rechazar si está lleno', async (t) => {
  const res = await api.reservas.verificarDisponibilidad('full-parking-id');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.available, false);
});

test('BFF - Reservas (Saga): Debería crear reserva con éxito', async (t) => {
  const res = await api.reservas.crearReserva({ parking_id: 'park-1', user_id: 'user-1' });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.data.estado, 'activa');
});

test('BFF - Reservas (Saga): Debería manejar el error si la Saga falla', async (t) => {
  const res = await api.reservas.crearReserva({ parking_id: 'error-saga', user_id: 'user-1' });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, 'Fallo simulado en Saga de Reservas');
});
