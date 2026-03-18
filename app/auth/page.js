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
  const [telefono, setTelefono] = useState('');

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
        const { data: { user } } = await supabase.auth.getUser();
        router.push(user.user_metadata?.rol === 'arrendador' ? '/dashboard' : '/'); 
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
    <section className="auth-wrapper">
      {/* ESTILOS DE MEZCLA PERFECTA Y GLASSMORPHISM */}
      <style dangerouslySetInnerHTML={{__html: `
        .auth-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          /* Fondo oscuro elegante con un ligero degradado índigo/azulado */
          background: radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 40%, #020617 100%);
        }

        .auth-glass-panel {
          width: 100%;
          max-width: 460px;
          padding: 45px 40px;
          border-radius: 24px;
          /* Efecto cristal esmerilado premium */
          background: rgba(30, 41, 59, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1) inset;
        }

        .auth-header-icon {
          font-size: 3.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 15px;
          filter: drop-shadow(0 0 15px rgba(99,102,241,0.4));
        }

        .auth-tabs {
          display: flex;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          padding: 5px;
          margin-bottom: 30px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .auth-tab-btn {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .auth-tab-btn.active {
          background: rgba(99, 102, 241, 0.15);
          color: #c7d2fe;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .modern-input-group {
          position: relative;
          margin-bottom: 18px;
        }

        .modern-input-group i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-size: 1.1rem;
          transition: 0.3s;
        }

        .modern-input-group input {
          width: 100%;
          padding: 15px 15px 15px 45px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #f8fafc;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .modern-input-group input:focus {
          border-color: #6366f1;
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }

        .modern-input-group input:focus + i,
        .modern-input-group input:not(:placeholder-shown) ~ i {
          color: #818cf8;
        }

        .role-selector {
          display: flex;
          justify-content: space-around;
          background: rgba(15, 23, 42, 0.6);
          padding: 15px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 20px;
        }

        .btn-gradient {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%);
          color: white;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.6);
        }

        .btn-gradient:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -10px rgba(99, 102, 241, 0.8);
        }
        
        .btn-gradient:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}} />

      <div className="auth-glass-panel">
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <i className="fa-solid fa-map-location-dot auth-header-icon"></i>
          <h2 style={{ color: '#f8fafc', fontSize: '2.2rem', fontWeight: '800', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>
            {isLogin ? 'Bienvenido' : 'Únete a la Red'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
            {isLogin ? 'Ingresa para gestionar tu movilidad.' : 'Tu espacio, tus reglas, tu ciudad.'}
          </p>
        </div>
        
        <div className="auth-tabs">
          <button className={`auth-tab-btn ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setMessage(null); }}>
            Iniciar Sesión
          </button>
          <button className={`auth-tab-btn ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setMessage(null); }}>
            Crear Cuenta
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          
          {!isLogin && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="role-selector">
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontWeight: '600' }}>
                  <input type="radio" name="rol" value="cliente" checked={rol === 'cliente'} onChange={(e) => setRol(e.target.value)} style={{ accentColor: '#818cf8', width: '18px', height: '18px' }} /> 
                  <i className="fa-solid fa-car" style={{color: '#94a3b8'}}></i> Conductor
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontWeight: '600' }}>
                  <input type="radio" name="rol" value="arrendador" checked={rol === 'arrendador'} onChange={(e) => setRol(e.target.value)} style={{ accentColor: '#818cf8', width: '18px', height: '18px' }} /> 
                  <i className="fa-solid fa-parking" style={{color: '#94a3b8'}}></i> Anfitrión
                </label>
              </div>

              <div className="modern-input-group">
                <input type="text" placeholder="Nombre Completo" value={nombre} onChange={e => setNombre(e.target.value)} required />
                <i className="fa-solid fa-user"></i>
              </div>
              <div className="modern-input-group">
                <input type="text" placeholder="RUT (ej: 12345678-9)" value={rut} onChange={e => setRut(e.target.value)} required />
                <i className="fa-solid fa-id-card"></i>
              </div>
              <div className="modern-input-group">
                <input type="tel" placeholder="Teléfono (ej: +56912345678)" value={telefono} onChange={e => setTelefono(e.target.value)} required />
                <i className="fa-solid fa-phone"></i>
              </div>
              
              {rol === 'cliente' && (
                <div className="modern-input-group">
                  <input type="text" placeholder="Patente (Opcional)" value={patente} onChange={e => setPatente(e.target.value)} />
                  <i className="fa-solid fa-car-side"></i>
                </div>
              )}
            </div>
          )}

          <div className="modern-input-group">
            <input type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required />
            <i className="fa-solid fa-envelope"></i>
          </div>
          
          <div className="modern-input-group" style={{ marginBottom: '10px' }}>
            <input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" />
            <i className="fa-solid fa-lock"></i>
          </div>

          {isLogin && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <a href="#" style={{ color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600', transition: '0.2s' }}>¿Olvidaste tu contraseña?</a>
            </div>
          )}
          
          {message && (
            <div style={{ background: message.type === 'error' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(5, 150, 105, 0.15)', borderLeft: `4px solid ${message.type === 'error' ? '#ef4444' : '#10b981'}`, padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ color: message.type === 'error' ? '#fca5a5' : '#a7f3d0', fontSize: '0.9rem', margin: 0, fontWeight: '500' }}>
                <i className={`fa-solid ${message.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`} style={{ marginRight: '8px' }}></i>
                {message.text}
              </p>
            </div>
          )}

          <button type="submit" className="btn-gradient" disabled={loading}>
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Ingresar a mi panel' : 'Comenzar ahora')}
          </button>
        </form>
      </div>
    </section>
  );
}