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
      // PROCESO DE LOGIN NORMAL
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: 'Credenciales incorrectas. Verifica tu correo y contraseña.' });
        setLoading(false);
      } else {
        router.push(rol === 'arrendador' ? '/dashboard' : '/'); 
      }
    } else {
      // PROCESO DE REGISTRO INNOVADO (AUTO-LOGIN)
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
        
        // INNOVACIÓN: Redirección automática inteligente
        // Si Supabase devuelve la sesión de inmediato, lo mandamos al panel
        if (data.session) {
           router.push(rol === 'arrendador' ? '/dashboard' : '/');
        } else {
           // Si no devuelve sesión (por latencia), forzamos el inicio de sesión por detrás
           const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
           if (!loginErr) {
             router.push(rol === 'arrendador' ? '/dashboard' : '/');
           } else {
             // Fallback: Si algo falla, lo dejamos en la pantalla de login listo para entrar
             setIsLogin(true);
             setMessage({ type: 'success', text: 'Cuenta creada. Por favor, inicia sesión.' });
             setLoading(false);
           }
        }
      }
    }
  };

  return (
    <section className="view-content auth-view" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel form-container" style={{ width: '100%', maxWidth: '420px', padding: '30px' }}>
        
        <div className="tab-headers" style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '25px' }}>
          <button 
            className={`tab-btn ${isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(true); setMessage(null); }}
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: isLogin ? 'var(--primary)' : 'var(--text-muted)', borderBottom: isLogin ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: isLogin ? 'bold' : 'normal', transition: '0.3s' }}
          >
            Iniciar Sesión
          </button>
          <button 
            className={`tab-btn ${!isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(false); setMessage(null); }}
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: !isLogin ? 'var(--primary)' : 'var(--text-muted)', borderBottom: !isLogin ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: !isLogin ? 'bold' : 'normal', transition: '0.3s' }}
          >
            Crear Cuenta
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {isLogin ? (
            <div className="avatar-placeholder" style={{ textAlign: 'center', fontSize: '4rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              <i className="fa-solid fa-circle-user"></i>
            </div>
          ) : (
            <>
              <div className="role-selector" style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="rol" value="cliente" checked={rol === 'cliente'} onChange={(e) => setRol(e.target.value)} /> Conductor
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="rol" value="arrendador" checked={rol === 'arrendador'} onChange={(e) => setRol(e.target.value)} /> Anfitrión
                </label>
              </div>
              <div className="input-group"><i className="fa-solid fa-user"></i><input type="text" placeholder="Nombre Completo" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
              <div className="input-group"><i className="fa-solid fa-id-card"></i><input type="text" placeholder="RUT (ej: 12345678-9)" value={rut} onChange={e => setRut(e.target.value)} required /></div>
              {rol === 'cliente' && (
                <div className="input-group"><i className="fa-solid fa-car-side"></i><input type="text" placeholder="Patente (Opcional)" value={patente} onChange={e => setPatente(e.target.value)} /></div>
              )}
            </>
          )}

          <div className="input-group"><i className="fa-solid fa-envelope"></i><input type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="input-group"><i className="fa-solid fa-lock"></i><input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" /></div>
          
          {message && (
            <div style={{ background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderLeft: `3px solid ${message.type === 'error' ? 'var(--status-red)' : 'var(--status-green)'}`, padding: '10px', borderRadius: '4px' }}>
              <p style={{ color: message.type === 'error' ? 'var(--status-red)' : 'var(--status-green)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
                {message.text}
              </p>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Entrar a la red' : 'Completar Registro')}
          </button>
        </form>

      </div>
    </section>
  );
}