import { api } from '../src/lib/api';

describe('Circuit Breaker y API Resiliente', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Debe reintentar llamadas HTTP 500 y lanzar error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' })
    });

    await expect(api.mapas.getMisEstacionamientos('user-123')).rejects.toThrow('HTTP 500');
    
    // Al fallar 3 veces (por defecto en el backoff), fetch debió ser llamado 3 veces
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('Debe abrir el circuito después del límite de fallos', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
    });

    // Simular multiples llamadas que fallan para forzar estado OPEN
    try { await api.reservas.verificarDisponibilidad('p1'); } catch (e) {}
    try { await api.reservas.verificarDisponibilidad('p1'); } catch (e) {}
    try { await api.reservas.verificarDisponibilidad('p1'); } catch (e) {}

    // La 4ta llamada debe fallar rápido (Fail-Fast) sin intentar hacer fetch
    global.fetch.mockClear();
    
    await expect(api.reservas.verificarDisponibilidad('p1')).rejects.toThrow('Circuit Breaker is OPEN. Fail-fast mode activated');
    
    // Fetch NO debió ser llamado porque el circuito cortó la red
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
