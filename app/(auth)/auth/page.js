'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase'; // Ruta re-ajustada (retrocede 3 niveles)
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  // Estados del formulario avanzado
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [rol, setRol] = useState('cliente');
  const [patente, setPatente] = useState('');
  const [telefono, setTelefono] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isLogin) {
      // PROCESO DE LOGIN IDÉNTICO
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
        setLoading(false);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        router.push(user.user_metadata?.rol === 'arrendador' ? '/dashboard' : '/'); 
      }
    } else {
      // PROCESO DE REGISTRO INYECTADO EN EL DISEÑO NUEVO
      const rutLimpio = rut.replace(/\./g, ''); 
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: nombre,
            rut: rutLimpio,
            rol: rol,
            patente: patente || "No registrada",
            telefono: telefono
          }
        }
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
      } else {
        setMessage({ type: 'success', text: '¡Cuenta creada! Entrando a la red...' });
        if (data.session) {
           router.push(rol === 'arrendador' ? '/dashboard' : '/');
        } else {
           const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
           if (!loginErr) {
             router.push(rol === 'arrendador' ? '/dashboard' : '/');
           } else {
             setIsLogin(true);
             setMessage({ type: 'success', text: 'Cuenta creada. Inicia sesión.' });
             setLoading(false);
           }
        }
      }
    }
  };

  return (
    <div className="auth-split-layout">
      {/* CÓDIGO CSS INNOVADO PARA EL DISEÑO SPLIT-SCREEN IDÉNTICO */}
      <style dangerouslySetInnerHTML={{__html: `
        .auth-split-layout { display: flex; height: 100vh; width: 100%; margin: 0; padding: 0; overflow: hidden; }
        
        /* Panel Izquierdo Innovado: Azul profundo con degradado y acento blue-700 */
        .auth-left { flex: 1.1; background: linear-gradient(135deg, #020617 0%, #0f172a 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; color: #f1f5f9; text-align: center; border-right: 1px solid rgba(59,130,246,0.1); }
        .auth-logo-dot { font-size: 120px; color: #3b82f6; margin-bottom: 30px; filter: drop-shadow(0 0 20px rgba(59,130,246,0.5)); }
        .auth-left-innov-badge { padding: 8px 20px; background: rgba(59,130,246,0.1); border-radius: 20px; border: 1px solid #3b82f6; color: #3b82f6; font-weight: 600; font-size: 0.9rem; margin-top: 30px; }

        /* Panel Derecho Innovado: Formulario oscuro súper limpio con labels arriba */
        .auth-right { flex: 1; display: flex; justify-content: center; align-items: center; padding: 20px; background: #1e293b; color: #f1f5f9; }
        .auth-form-container { width: 100%; max-width: 400px; }
        
        /* Inputs Idénticos: Labels muted arriba, dark input box con ícono a la izquierda */
        .modern-input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .modern-input-group label { font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
        .modern-input-labeled { position: relative; }
        .modern-input-labeled i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.1rem; }
        .modern-input-labeled input { width: 100%; padding: 12px 12px 12px 48px; border: 1px solid #334155; border-radius: 8px; background: rgba(0,0,0,0.2); color: #f1f5f9; font-size: 1rem; outline: none; transition: 0.2s; box-sizing: border-box; }
        .modern-input-labeled input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); background: rgba(0,0,0,0.3); }

        /* Acento Social Idéntico: Botones Google/Apple limpios abajo */
        .auth-social-btns { display: flex; gap: 15px; margin-top: 25px; }
        .social-btn { flex: 1; display: flex; justify-content: center; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid #334155; border-radius: 8px; color: #f1f5f9; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .social-btn:hover { background: rgba(255,255,255,0.1); border-color: #475569; }

        /* Responsividad Innovada */
        @media (max-width: 900px) { .auth-left { display: none; } }
      `}} />

      {/* PANEL IZQUIERDO: Estética Idéntica a tu imagen */}
      <div className="auth-left">
        <i className="fa-solid fa-map-location-dot auth-logo-dot"></i>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '10px', color: 'white' }}>Compartiendo Espacio</h1>
        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '80%', margin: '0 0 30px 0' }}>Optimización de Movilidad Urbana. Encuentra el estacionamiento perfecto o genera ingresos con tu espacio.</p>
        <div className="auth-left-innov-badge">
          Tecnología P2P y Comercial en Vivo
        </div>
      </div>

      {/* PANEL DERECHO: Formulario Idéntico a tu imagen (cony lógica avanzada integrada) */}
      <div className="auth-right">
        <div className="auth-form-container">
          
          {/* Cabecera del formulario */}
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
            {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '25px', fontSize: '0.95rem' }}>
            {isLogin ? 'Ingresa tus credenciales para acceder a la red.' : 'Únete a la red de movilidad más grande.'}
          </p>

          {/* Pestañas de Autenticación Idénticas */}
          <div style={{ display: 'flex', borderBottom: '2px solid #334155', marginBottom: '25px' }}>
            <button onClick={() => { setIsLogin(true); setMessage(null); }} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: isLogin ? '#3b82f6' : '#64748b', borderBottom: isLogin ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '-2px', transition: '0.2s', fontSize: '1rem' }}>
              Iniciar Sesión
            </button>
            <button onClick={() => { setIsLogin(false); setMessage(null); }} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: !isLogin ? '#3b82f6' : '#64748b', borderBottom: !isLogin ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '-2px', transition: '0.2s', fontSize: '1rem' }}>
              Registrarse
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* FLUJO DE REGISTRO INYECTADO (Aparece solo en Crear Cuenta) */}
            {!isLogin && (
              <div style={{animation: 'fadeIn 0.3s'}}>
                {/* Selector de Rol Innovado e Integrado */}
                <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '16px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontWeight: '600' }}>
                    <input type="radio" name="rol" value="cliente" checked={rol === 'cliente'} onChange={(e) => setRol(e.target.value)} style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }} /> Conductor
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontWeight: '600' }}>
                    <input type="radio" name="rol" value="arrendador" checked={rol === 'arrendador'} onChange={(e) => setRol(e.target.value)} style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }} /> Anfitrión
                  </label>
                </div>
                
                {/* Inputs Avanzados con el Diseño Nuevo (Labels arriba) */}
                <div className="modern-input-group">
                  <label>Nombre Completo</label>
                  <div className="modern-input-labeled"><i className="fa-solid fa-user"></i><input type="text" placeholder="Ej: Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
                </div>
                <div className="modern-input-group">
                  <label>RUT</label>
                  <div className="modern-input-labeled"><i className="fa-solid fa-id-card"></i><input type="text" placeholder="Ej: 12.345.678-9" value={rut} onChange={e => setRut(e.target.value)} required /></div>
                </div>
                <div className="modern-input-group">
                  <label>Teléfono</label>
                  <div className="modern-input-labeled"><i className="fa-solid fa-phone"></i><input type="tel" placeholder="Ej: +569 1234 5678" value={telefono} onChange={e => setTelefono(e.target.value)} required /></div>
                </div>
                {rol === 'cliente' && (
                  <div className="modern-input-group">
                    <label>Patente (Opcional)</label>
                    <div className="modern-input-labeled"><i className="fa-solid fa-car-side"></i><input type="text" placeholder="Ej: AB1234" value={patente} onChange={e => setPatente(e.target.value)} /></div>
                  </div>
                )}
              </div>
            )}

            {/* Campos Comunes (Idénticos al diseño de la imagen) */}
            <div className="modern-input-group">
              <label>Correo Electrónico</label>
              <div className="modern-input-labeled"><i className="fa-solid fa-envelope"></i><input type="email" placeholder="Ingresa tu correo" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            </div>
            
            <div className="modern-input-group" style={{ marginBottom: '8px' }}>
              <label>Contraseña</label>
              <div className="modern-input-labeled"><i className="fa-solid fa-lock"></i><input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" /></div>
            </div>

            {/* Enlace "¿Olvidé mi contraseña?" Idéntico */}
            {isLogin && (
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <a href="#" style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}>¿Olvidé mi contraseña?</a>
              </div>
            )}
            
            {/* Mensajes de Estado Innovados */}
            {message && (
              <div style={{ background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', borderLeft: `4px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`, padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
                <p style={{ color: message.type === 'error' ? '#fca5a5' : '#a7f3d0', fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>
                  {message.text}
                </p>
              </div>
            )}

            {/* Botón Principal Idéntico (Azul Sólido) */}
            <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', width: '100%', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: '0.2s', marginTop: isLogin ? '10px' : '15px' }} disabled={loading}>
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Ingresar a la Red' : 'Registrarme')}
            </button>
          </form>

          {/* Divisor "O ingresa con" Idéntico */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
            <span style={{ padding: '0 15px', color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>O ingresa con</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }}></div>
          </div>

          {/* Botones Sociales Idénticos (Limpios) */}
          <div className="auth-social-btns">
            <button className="social-btn" type="button">
              <i className="fa-brands fa-google" style={{ color: '#fca5a5', fontSize: '1.2rem' }}></i> Google
            </button>
            <button className="social-btn" type="button">
              <i className="fa-brands fa-apple" style={{ fontSize: '1.3rem', color: 'white' }}></i> Apple
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}