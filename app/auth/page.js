'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase'; 
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [rol, setRol] = useState('cliente');
  const [patente, setPatente] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
        setLoading(false);
      } else {
        router.push(rol === 'arrendador' ? '/dashboard' : '/'); 
      }
    } else {
      const rutLimpio = rut.replace(/\./g, ''); 
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: nombre,
            rut: rutLimpio,
            rol: rol,
            patente: patente || "No registrada"
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
             setMessage({ type: 'success', text: 'Cuenta creada. Por favor, inicia sesión.' });
             setLoading(false);
           }
        }
      }
    }
  };

  return (
    <div className="auth-split-layout">
      {/* ESTILOS ESPECÍFICOS PARA ESTA VISTA */}
      <style dangerouslySetInnerHTML={{__html: `
        .auth-split-layout { display: flex; height: 100vh; width: 100%; background: #ffffff; overflow: hidden; }
        .auth-left { flex: 1; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; color: white; text-align: center; }
        .auth-right { flex: 1; display: flex; justify-content: center; align-items: center; padding: 20px; background: #ffffff; }
        .auth-form-container { width: 100%; max-width: 400px; }
        .modern-input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .modern-input-group label { font-size: 0.9rem; font-weight: 600; color: #475569; }
        .modern-input-group input { padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #0f172a; font-size: 1rem; outline: none; transition: 0.2s; }
        .modern-input-group input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); background: #ffffff; }
        .social-btn { flex: 1; display: flex; justify-content: center; align-items: center; gap: 10px; padding: 10px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; color: #0f172a; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .social-btn:hover { background: #f8fafc; }
        @media (max-width: 768px) { .auth-left { display: none; } }
      `}} />

      {/* PANEL IZQUIERDO (Branding) */}
      <div className="auth-left">
        <i className="fa-solid fa-map-location-dot" style={{ fontSize: '120px', color: '#3b82f6', marginBottom: '30px', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.5))' }}></i>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>Compartiendo Espacio</h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '80%' }}>Optimización de Movilidad Urbana. Encuentra el estacionamiento perfecto o genera ingresos con tu espacio.</p>
      </div>

      {/* PANEL DERECHO (Formulario Claro) */}
      <div className="auth-right">
        <div className="auth-form-container">
          
          <h2 style={{ color: '#0f172a', fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '5px' }}>
            {isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </h2>
          <p style={{ color: '#64748b', marginBottom: '25px', fontSize: '0.95rem' }}>
            {isLogin ? 'Ingresa tus datos para acceder.' : 'Únete a la red de movilidad más grande.'}
          </p>

          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '25px' }}>
            <button onClick={() => { setIsLogin(true); setMessage(null); }} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: isLogin ? '#3b82f6' : '#94a3b8', borderBottom: isLogin ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '-2px', transition: '0.2s' }}>
              Iniciar Sesión
            </button>
            <button onClick={() => { setIsLogin(false); setMessage(null); }} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: !isLogin ? '#3b82f6' : '#94a3b8', borderBottom: !isLogin ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold', marginBottom: '-2px', transition: '0.2s' }}>
              Registrarse
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            
            {!isLogin && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '600' }}>
                    <input type="radio" name="rol" value="cliente" checked={rol === 'cliente'} onChange={(e) => setRol(e.target.value)} style={{ accentColor: '#3b82f6' }} /> Conductor
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '600' }}>
                    <input type="radio" name="rol" value="arrendador" checked={rol === 'arrendador'} onChange={(e) => setRol(e.target.value)} style={{ accentColor: '#3b82f6' }} /> Anfitrión
                  </label>
                </div>
                <div className="modern-input-group">
                  <label>Nombre Completo</label>
                  <input type="text" placeholder="Ej: Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)} required />
                </div>
                <div className="modern-input-group">
                  <label>RUT</label>
                  <input type="text" placeholder="Ej: 12345678-9" value={rut} onChange={e => setRut(e.target.value)} required />
                </div>
                {rol === 'cliente' && (
                  <div className="modern-input-group">
                    <label>Patente (Opcional)</label>
                    <input type="text" placeholder="Ej: AB1234" value={patente} onChange={e => setPatente(e.target.value)} />
                  </div>
                )}
              </>
            )}

            <div className="modern-input-group">
              <label>Correo Electrónico</label>
              <input type="email" placeholder="ejemplo@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            
            <div className="modern-input-group" style={{ marginBottom: '8px' }}>
              <label>Contraseña</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" />
            </div>

            {isLogin && (
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <a href="#" style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}>¿Olvidé mi contraseña?</a>
              </div>
            )}
            
            {message && (
              <div style={{ background: message.type === 'error' ? '#fee2e2' : '#d1fae5', borderLeft: `4px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`, padding: '12px', borderRadius: '4px', marginBottom: '20px' }}>
                <p style={{ color: message.type === 'error' ? '#b91c1c' : '#047857', fontSize: '0.85rem', margin: 0, fontWeight: '600' }}>
                  {message.text}
                </p>
              </div>
            )}

            <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', width: '100%', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: '0.2s', marginTop: isLogin ? '0' : '15px' }} disabled={loading}>
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Ingresar' : 'Registrarme')}
            </button>
          </form>

          {/* SEPARADOR Y BOTONES SOCIALES (Estéticos para igualar la foto) */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '25px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
            <span style={{ padding: '0 15px', color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>O ingresa con</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="social-btn" type="button">
              <i className="fa-brands fa-google" style={{ color: '#ea4335', fontSize: '1.2rem' }}></i> Google
            </button>
            <button className="social-btn" type="button">
              <i className="fa-brands fa-apple" style={{ fontSize: '1.3rem' }}></i> Apple
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}