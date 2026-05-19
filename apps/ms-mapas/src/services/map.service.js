import { MapRepository } from '../repositories/map.repository';

export const MapService = {
  async getMisEstacionamientos(userId) {
    return await MapRepository.getEstacionamientos(userId);
  },

  async createEstacionamiento(payload) {
    const { nombre, arrendador, lat, lng, totalSpots, esPmr, userId } = payload;
    
    const parkingData = {
      nombre,
      arrendador,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      total_spots: parseInt(totalSpots) || 1,
      occupied_spots: 0,
      es_pmr: esPmr || false,
      user_id: userId,
      precio_hora: 1500, // Regla de negocio: Precio base en CLP
      rating: 5.0,
    };

    return await MapRepository.createEstacionamiento(parkingData);
  },

  async deleteEstacionamientos(ids) {
    await MapRepository.deleteEstacionamientos(ids);
    return ids.length;
  },

  async updateOcupacion(id, occupied_spots) {
    return await MapRepository.updateOcupacion(id, occupied_spots);
  }
};
