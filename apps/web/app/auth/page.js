'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from '@parkings/supabase-db';

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
});

const registerSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,}$/, {
    message: "Contraseña insegura: Mínimo 8 caracteres, incluye mayúscula, minúscula, número y símbolo."
  }),
  rol: z.enum(['cliente', 'arrendador'], { required_error: "Debes seleccionar un rol" })
});

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) toast.error(decodeURIComponent(errorMsg));
  }, [searchParams]);

  const currentSchema = isLogin ? loginSchema : registerSchema;

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onBlur',
    defaultValues: { rol: 'cliente' }
  });

  const selectedRol = watch("rol");

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      if (isLogin) {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });
        if (error) throw error;

        // Recuperar el rol del perfil
        if (authData?.user) {
          let profile = null;
          try {
            const { data: profileData } = await supabase.from('perfiles').select('rol').eq('id', authData.user.id).single();
            profile = profileData;
          } catch (e) { /* tabla puede no existir aún */ }
          const userObj = {
            id: authData.user.id,
            email: authData.user.email,
            nombre: authData.user.user_metadata?.nombre || authData.user.email?.split('@')[0],
            rol: profile?.rol || authData.user.user_metadata?.rol || 'cliente'
          };
          window.localStorage.setItem('user', JSON.stringify(userObj));
        }

        setSuccessAnim(true);
        toast.success("¡Autenticación exitosa!");
        setTimeout(() => {
          router.push('/mapa');
        }, 1500);

      } else {
        // Signup via server-side route (evita rate limit de email y unexpected_failure)
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password, nombre: data.nombre, rol: data.rol }),
        });
        const result = await res.json();

        if (!res.ok) throw new Error(result.error || 'Error al crear cuenta.');

        if (result.autoLogin && result.session) {
          // Restaurar sesión en el cliente con el token devuelto por el servidor
          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          });
        }

        setSuccessAnim(true);
        toast.success("¡Cuenta creada exitosamente!");
        setTimeout(() => router.push('/mapa'), 1500);
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || "Ocurrió un error en la autenticación";
      if (err.status === 500 || msg.includes('unexpected_failure')) {
        msg = "Error interno del servidor. Verifica que el correo no esté ya registrado o intenta más tarde.";
      } else if (msg.includes('User already registered')) {
        msg = "Este correo ya tiene una cuenta. Prueba a iniciar sesión.";
      } else if (msg.includes('Email rate limit')) {
        msg = "Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.";
      }
      toast.error(msg);
    } finally {
      if (!successAnim && !pendingConfirm) {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="auth-fullscreen">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #3b82f6' } }} />
      <div className={`auth-glass-box ${successAnim ? 'success-mode' : ''}`}>
        {!successAnim ? (
          <>
            <div className="brand-logo">
              <i className={isLogin ? "fa-solid fa-fingerprint" : "fa-solid fa-satellite-dish"}></i>
            </div>
            <h2>{isLogin ? 'Acceso Seguro' : 'Registro en la Red'}</h2>
            <p className="auth-subtitle">P2P DISTRIBUIDO - COMPARTIENDO ESPACIO</p>

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              {!isLogin && (
                <>
                  <div className="role-selector">
                    <label className={`role-option ${selectedRol === 'cliente' ? 'active' : ''}`}>
                      <input type="radio" value="cliente" {...register("rol")} />
                      <i className="fa-solid fa-car"></i> Conductor
                    </label>
                    <label className={`role-option ${selectedRol === 'arrendador' ? 'active' : ''}`}>
                      <input type="radio" value="arrendador" {...register("rol")} />
                      <i className="fa-solid fa-square-parking"></i> Arrendador
                    </label>
                  </div>
                  {errors.rol && <p className="error-msg">{errors.rol.message}</p>}
                  
                  <div className="input-wrap">
                    <i className="fa-solid fa-user icon"></i>
                    <input type="text" placeholder="Tu nombre completo" {...register("nombre")} />
                    {errors.nombre && <p className="error-msg">{errors.nombre.message}</p>}
                  </div>
                </>
              )}

              <div className="input-wrap">
                <i className="fa-solid fa-envelope icon"></i>
                <input type="email" placeholder="Correo electrónico" {...register("email")} />
                {errors.email && <p className="error-msg">{errors.email.message}</p>}
              </div>

              <div className="input-wrap">
                <i className="fa-solid fa-lock icon"></i>
                <input type="password" placeholder="Contraseña" {...register("password")} />
                {errors.password && <p className="error-msg">{errors.password.message}</p>}
              </div>

              <button type="submit" className="auth-btn-main" disabled={loading}>
                {loading ? (
                  <span className="btn-content"><i className="fa-solid fa-spinner fa-spin"></i> PROCESANDO...</span>
                ) : (
                  <span className="btn-content">
                    {isLogin ? <><i className="fa-solid fa-right-to-bracket"></i> CONECTAR</> : <><i className="fa-solid fa-bolt"></i> CREAR NODO</>}
                  </span>
                )}
              </button>
            </form>

            <div className="auth-footer-text">
              {isLogin ? '¿Primera vez en la red?' : '¿Ya tienes acceso?'}{' '}
              <span onClick={toggleMode} className="toggle-link">
                {isLogin ? 'ÚNETE AQUÍ' : 'INICIAR SESIÓN'}
              </span>
            </div>
          </>
        ) : pendingConfirm ? (
          <div className="success-screen">
            <div className="success-circle" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <i className="fa-solid fa-envelope"></i>
            </div>
            <h3>Confirma tu correo</h3>
            <p style={{ color: '#f59e0b' }}>Te enviamos un enlace de verificación.<br/>Revisa tu bandeja de entrada.</p>
            <button onClick={() => { setPendingConfirm(false); setIsLogin(true); }} className="auth-btn-main" style={{ marginTop: '20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : (
          <div className="success-screen">
            <div className="success-circle">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3>{isLogin ? 'Autenticación Verificada' : 'Nodo Creado'}</h3>
            <p>Conectando con Supabase Auth...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-fullscreen { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); position: relative; overflow: hidden; padding: 20px; }
        .auth-glass-box { width: 100%; max-width: 440px; padding: 50px 40px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(40px); border-radius: 35px; border: 1px solid rgba(255,255,255,0.05); text-align: center; box-shadow: 0 30px 60px -20px rgba(0,0,0,1); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); position: relative; z-index: 2; }
        .success-mode { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); transform: scale(1.02); }
        .brand-logo { width: 80px; height: 80px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1)); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 24px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 2.2rem; box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.1); }
        h2 { color: white; font-size: 2.2rem; font-weight: 900; margin: 0; letter-spacing: -1px; }
        .auth-subtitle { font-size: 0.7rem; color: #3b82f6; letter-spacing: 4px; margin: 15px 0 35px 0; font-weight: 900; }
        
        .input-wrap { position: relative; margin-bottom: 20px; transition: all 0.3s; text-align: left; }
        .input-wrap .icon { position: absolute; left: 20px; top: 18px; color: #64748b; font-size: 1.1rem; transition: 0.3s; }
        .input-wrap input { width: 100%; box-sizing: border-box; padding: 18px 20px 18px 55px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; color: white; outline: none; transition: 0.3s; font-size: 1rem; }
        .input-wrap input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); background: rgba(0,0,0,0.6); }
        .input-wrap input:focus + .icon, .input-wrap input:not(:placeholder-shown) + .icon { color: #3b82f6; }
        
        .role-selector { display: flex; gap: 10px; margin-bottom: 20px; }
        .role-option { flex: 1; padding: 15px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; color: #94a3b8; cursor: pointer; transition: 0.3s; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .role-option input { display: none; }
        .role-option:hover { background: rgba(255,255,255,0.05); }
        .role-option.active { background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; color: white; box-shadow: 0 0 15px rgba(59,130,246,0.3); }
        
        .error-msg { color: #fca5a5; font-size: 0.8rem; margin-top: 8px; margin-left: 10px; }
        
        .auth-btn-main { width: 100%; padding: 20px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 16px; color: white; font-weight: 900; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; margin-top: 15px; letter-spacing: 1px; }
        .auth-btn-main:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.4); }
        .auth-btn-main:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-content { display: flex; align-items: center; justify-content: center; gap: 10px; }
        
        .auth-footer-text { margin-top: 35px; font-size: 0.9rem; color: #94a3b8; }
        .toggle-link { color: #3b82f6; cursor: pointer; font-weight: 900; margin-left: 8px; transition: 0.3s; }
        .toggle-link:hover { text-decoration: underline; }
        
        .success-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; animation: fadeIn 0.5s ease; }
        .success-circle { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; margin-bottom: 20px; box-shadow: 0 0 40px rgba(16, 185, 129, 0.4); animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .success-screen h3 { color: white; font-size: 1.8rem; margin-bottom: 10px; }
        .success-screen p { color: #10b981; font-weight: 600; font-size: 0.9rem; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
        
        @media (max-width: 500px) {
          .auth-glass-box { padding: 40px 25px; border-radius: 25px; border-left: none; border-right: none; }
          .auth-fullscreen { padding: 10px; align-items: flex-start; padding-top: 100px; }
          h2 { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
}