import { AuthRepository } from '../repositories/auth.repository';

export const AuthService = {
  async login(payload) {
    const { email, password } = payload;
    const data = await AuthRepository.signIn(email, password);
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.user_metadata?.nombre_completo ?? data.user.user_metadata?.full_name ?? 'Usuario',
      },
      access_token: data.session.access_token,
    };
  },

  async register(payload) {
    const { email, password, nombre } = payload;
    const data = await AuthRepository.signUp(email, password, nombre);
    
    return {
      message: 'Cuenta creada. Revisa tu correo para confirmar.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  }
};
