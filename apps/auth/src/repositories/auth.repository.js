import { supabase } from '@parkings/supabase-db';

export const AuthRepository = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
    return data;
  },

  async signUp(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre_completo: nombre },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  }
};
