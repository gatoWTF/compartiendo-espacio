import { supabase } from '@parkings/supabase-db';

export const MapRepository = {
  async getEstacionamientos(userId) {
    let query = supabase.from('estacionamientos').select('*');
    if (userId) query = query.eq('user_id', userId);
    
    const { data, error } = await query;
    if (error) throw new Error(`Error BD: ${error.message}`);
    return data;
  },

  async createEstacionamiento(parkingData) {
    const { data, error } = await supabase
      .from('estacionamientos')
      .insert([parkingData])
      .select()
      .single();
    
    if (error) throw new Error(`Error BD al crear estacionamiento: ${error.message}`);
    return data;
  },

  async deleteEstacionamientos(ids) {
    const { error } = await supabase
      .from('estacionamientos')
      .delete()
      .in('id', ids);
    
    if (error) throw new Error(`Error BD al borrar: ${error.message}`);
  },

  async updateOcupacion(id, occupied_spots) {
    const { data, error } = await supabase
      .from('estacionamientos')
      .update({ occupied_spots })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Error BD al actualizar ocupación: ${error.message}`);
    return data;
  }
};
