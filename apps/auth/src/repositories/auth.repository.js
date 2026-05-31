import { supabase } from '@parkings/supabase-db';

export const AuthRepository = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
    return data;
  },

  async signUp(email, password, nombre, rol) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, rol },
      },
    });
    if (error) throw new Error(error.message);
    
    // Si la DB no crea el perfil automáticamente vía trigger, lo creamos aquí:
    if (data?.user) {
      const { getServiceSupabase } = await import('@parkings/supabase-db');
      try {
        const adminDb = getServiceSupabase();
        await adminDb.from('perfiles').insert({
          id: data.user.id,
          nombre,
          rol
        });
      } catch (e) {
        console.error('Error al insertar perfil en Service Role (auth microservice)', e);
      }
    }

    return data;
  }
};
