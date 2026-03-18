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
        setMessage({ type: 'error', text: 'Credenciales incorrectas o el usuario no existe.' });
      } else {
        router.push('/'); // Redirige al mapa
      }
    } else {
      const rutLimpio = rut.replace(/\./g, ''); 
      
      const { error } = await supabase.auth.signUp({
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
      } else {
        setMessage({ type: 'success', text: '¡Cuenta creada! Ya puedes iniciar sesión.' });
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <section className="view-content auth-view" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel form-container" style={{ width: '100%', maxWidth: '420px', padding: '30px' }}>
        
        <div className="tab-headers" style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '25px' }}>
          <button 
            className={`tab-btn ${isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(true); setMessage(null); }}
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: isLogin ? 'var(--primary)' : 'var(--text-muted)', borderBottom: isLogin ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: isLogin ? 'bold' : 'normal' }}
          >
            Iniciar Sesión
          </button>
          <button 
            className={`tab-btn ${!isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(false); setMessage(null); }}
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', color: !isLogin ? 'var(--primary)' : 'var(--text-muted)', borderBottom: !isLogin ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: !isLogin ? 'bold' : 'normal' }}
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
              <div className="role-selector" style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--border-glass)' }}>
                <label style={{ cursor: 'pointer' }}><input type="radio" name="rol" value="cliente" checked={rol === 'cliente'} onChange={(e) => setRol(e.target.value)} style={{ marginRight: '5px' }} /> Conductor</label>
                <label style={{ cursor: 'pointer' }}><input type="radio" name="rol" value="arrendador" checked={rol === 'arrendador'} onChange={(e) => setRol(e.target.value)} style={{ marginRight: '5px' }}/> Anfitrión</label>
              </div>
              <div className="input-group"><i className="fa-solid fa-user"></i><input type="text" placeholder="Nombre Completo" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
              <div className="input-group"><i className="fa-solid fa-id-card"></i><input type="text" placeholder="RUT (ej: 12345678-9)" value={rut} onChange={e => setRut(e.target.value)} required /></div>
              {rol === 'cliente' && (
                <div className="input-group"><i className="fa-solid fa-car-side"></i><input type="text" placeholder="Patente (Opcional)" value={patente} onChange={e => setPatente(e.target.value)} /></div>
              )}
            </>
          )}

          <div className="input-group"><i className="fa-solid fa-envelope"></i><input type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="input-group"><i className="fa-solid fa-lock"></i><input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength="6" /></div>
          
          {message && (
            <p style={{ color: message.type === 'error' ? 'var(--status-red)' : 'var(--status-green)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px' }}>
              {message.text}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Entrar a la red' : 'Completar Registro')}
          </button>
        </form>

      </div>
    </section>
  );
}