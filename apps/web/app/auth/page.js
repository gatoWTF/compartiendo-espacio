'use client';
import { useState } from 'react';
import { supabase } from '@parkings/supabase-db'; // RUTA CORREGIDA
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
        setMessage({ type: 'error', text: 'Credenciales incorrectas.' });
        setLoading(false);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        router.push(user.user_metadata?.rol === 'arrendador' ? '/dashboard' : '/'); 
      }
    } else {
      const rutLimpio = rut.replace(/\./g, ''); 
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nombre_completo: nombre, rut: rutLimpio, rol: rol, patente: patente || "No registrada", telefono: telefono } }
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
      } else {
        setMessage({ type: 'success', text: '¡Cuenta creada!' });
        if (data.session) { router.push(rol === 'arrendador' ? '/dashboard' : '/'); } 
        else {
           const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
           if (!loginErr) router.push(rol === 'arrendador' ? '/dashboard' : '/');
           else { setIsLogin(true); setLoading(false); }
        }
      }
    }
  };

  return (
    <div className="auth-split-layout">
      <style dangerouslySetInnerHTML={{__html: `
        .auth-split-layout { display: flex; height: 100vh; width: 100%; margin: 0; padding: 0; overflow: hidden; }
        .auth-left { flex: 1.1; background: linear-gradient(135deg, #020617 0%, #0f172a 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; color: #f1f5f9; text-align: center; border-right: 1px solid rgba(59,130,246,0.1); }
        .auth-logo-dot { font-size: 120px; color: #3b82f6; margin-bottom: 30px; filter: drop-shadow(0 0 20px rgba(59,130,246,0.5)); }
        .auth-left-innov-badge { padding: 8px 20px; background: rgba(59,130,246,0.1); border-radius: 20px; border: 1px solid #3b82f6; color: #3b82f6; font-weight: 600; margin-top: 30px; }
        .auth-right { flex: 1; display: flex; justify-content: center; align-items: center; padding: 20px; background: #1e293b; color: #f1f5f9; }
        .auth-form-container { width: 100%; max-width: 400px; }
        .modern-input-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .modern-input-group label { font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
        .modern-input-labeled { position: relative; }
        .modern-input-labeled i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.1rem; }
        .modern-input-labeled input { width: 100%; padding: 12px 12px 12px 48px; border: 1px solid #334155; border-radius: 8px; background: rgba(0,0,0,0.2); color: #f1f5f9; outline: none; transition: 0.2s; box-sizing: border-box; }
        @media (max-width: 900px) { .auth-left { display: none; } }
      `}} />

      <div className="auth-left">
        <i className="fa-solid fa-map-location-dot auth-logo-dot"></i>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '10px', color: 'white' }}>Compartiendo Espacio</h1>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px' }}>{isLogin ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h2>

          <div style={{ display: 'flex', borderBottom: '2px solid #334155', marginBottom: '25px' }}>
            <button onClick={() => { setIsLogin(true); setMessage(null); }} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: isLogin ? '#3b82f6' : '#64748b', borderBottom: isLogin ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold' }}>Iniciar Sesión</button>
            <button onClick={() => { setIsLogin(false); setMessage(null); }} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: !isLogin ? '#3b82f6' : '#64748b', borderBottom: !isLogin ? '2px solid #3b82f6' : 'none', cursor: 'pointer', fontWeight: 'bold' }}>Registrarse</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '16px' }}>
                  <label style={{ cursor: 'pointer', color: '#f1f5f9', fontWeight: '600' }}><input type="radio" name="rol" value="cliente" checked={rol === 'cliente'} onChange={(e) => setRol(e.target.value)} /> Conductor</label>
                  <label style={{ cursor: 'pointer', color: '#f1f5f9', fontWeight: '600' }}><input type="radio" name="rol" value="arrendador" checked={rol === 'arrendador'} onChange={(e) => setRol(e.target.value)} /> Anfitrión</label>
                </div>
                <div className="modern-input-group"><label>Nombre</label><div className="modern-input-labeled"><input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required /></div></div>
                <div className="modern-input-group"><label>RUT</label><div className="modern-input-labeled"><input type="text" value={rut} onChange={e => setRut(e.target.value)} required /></div></div>
                <div className="modern-input-group"><label>Teléfono</label><div className="modern-input-labeled"><input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} required /></div></div>
              </div>
            )}
            <div className="modern-input-group"><label>Correo</label><div className="modern-input-labeled"><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div></div>
            <div className="modern-input-group"><label>Contraseña</label><div className="modern-input-labeled"><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" /></div></div>

            {message && <div style={{ background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '4px', marginBottom: '20px' }}><p style={{ color: message.type === 'error' ? '#fca5a5' : '#a7f3d0' }}>{message.text}</p></div>}
            
            <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', width: '100%', fontWeight: 'bold' }} disabled={loading}>{loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Registrarme')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}