import { supabase } from '@parkings/supabase-db';

export const ReserveRepository = {
  async getParkingAvailability(parkingId) {
    const { data, error } = await supabase
      .from('estacionamientos')
      .select('occupied_spots, total_spots, nombre, id')
      .eq('id', parkingId)
      .single();
    
    if (error) throw new Error(`Error BD: ${error.message}`);
    return data;
  },

  async createReserve(data) {
    const { data: reserva, error } = await supabase
      .from('reservas')
      .insert([data])
      .select()
      .single();
    
    if (error) throw new Error(`Error BD creando reserva: ${error.message}`);
    return reserva;
  },

  async updateParkingOccupancy(parkingId, newOccupancy) {
    const { error } = await supabase
      .from('estacionamientos')
      .update({ occupied_spots: newOccupancy })
      .eq('id', parkingId);
    
    if (error) throw new Error(`Error BD actualizando ocupación: ${error.message}`);
  },

  async deleteReserve(reserveId) {
    const { error } = await supabase
      .from('reservas')
      .delete()
      .eq('id', reserveId);
    
    if (error) throw new Error(`Error BD borrando reserva de compensación: ${error.message}`);
  }
};
