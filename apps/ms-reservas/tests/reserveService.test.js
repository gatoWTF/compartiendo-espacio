import { ReserveService } from '../app/api/v1/reserve/services/reserva.service';
import { ReserveRepository } from '../app/api/v1/reserve/repositories/reserva.repository';

// Mockear el repositorio con factory function para evitar que Jest cargue Supabase y arroje error de WebSockets
jest.mock('../app/api/v1/reserve/repositories/reserva.repository', () => ({
  ReserveRepository: {
    getParkingAvailability: jest.fn(),
    createReserve: jest.fn(),
    updateParkingOccupancy: jest.fn(),
    deleteReserve: jest.fn()
  }
}));

describe('Domain-Driven Design: Saga de Reservas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Debe rechazar la reserva si el estacionamiento está lleno (CQRS)', async () => {
    ReserveRepository.getParkingAvailability.mockResolvedValue({
      occupied_spots: 10,
      total_spots: 10,
      id: 'p-123'
    });

    await expect(ReserveService.processSaga({
      parking_id: 'p-123', user_id: 'u-123'
    })).rejects.toThrow('El estacionamiento ya está lleno');

    expect(ReserveRepository.createReserve).not.toHaveBeenCalled();
  });

  test('Debe realizar rollback (compensación) si la actualización de plazas falla', async () => {
    // 1. Hay cupo
    ReserveRepository.getParkingAvailability.mockResolvedValue({
      occupied_spots: 5,
      total_spots: 10,
      id: 'p-123'
    });

    // 2. Reserva exitosa
    ReserveRepository.createReserve.mockResolvedValue({ id: 'res-999' });

    // 3. Falla al aumentar la ocupación (simulando error de concurrencia)
    ReserveRepository.updateParkingOccupancy.mockRejectedValue(new Error('Concurrency error'));

    // Ejecutar saga
    await expect(ReserveService.processSaga({
      parking_id: 'p-123', user_id: 'u-123'
    })).rejects.toThrow('Saga Compensada');

    // VERIFICAR QUE SE BORRÓ LA RESERVA PARA MANTENER INTEGRIDAD (ROLLBACK)
    expect(ReserveRepository.deleteReserve).toHaveBeenCalledWith('res-999');
  });
});
