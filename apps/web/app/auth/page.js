'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    
    try {
      const URL_AUTH = process.env.NEXT_PUBLIC_MS_AUTH_URL || 'http://localhost:3001/api/v1';
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      
      const res = await fetch(`${URL_AUTH}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      if (isLogin) {
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('user', JSON.stringify(result.user));
        router.push('/mapa');
      } else {
        setIsLogin(true);
        setMsg({ text: '¡Cuenta creada! Inicia sesión.', type: 'success' });
      }
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="glass-panel auth-box">
        <div className="auth-icon-wrapper">
           <i className={isLogin ? "fa-solid fa-shield-halved" : "fa-solid fa-user-plus"}></i>
        </div>
        <h2 className="auth-title">{isLogin ? 'Iniciar Sesión' : 'Únete a la Red'}</h2>
        <p className="auth-subtitle">SISTEMA P2P - COMPARTIENDO ESPACIO</p>

        {msg.text && (
          <div className={`alert-msg ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="auth-form">
          {!isLogin && (
            <input type="text" placeholder="Nombre completo" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="glass-input" />
          )}
          <input type="email" placeholder="Correo electrónico" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="glass-input" />
          <input type="password" placeholder="Contraseña" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="glass-input" />
          
          <button type="submit" className="btn-cyber-primary" disabled={loading} style={{marginTop: '10px'}}>
            {loading ? 'AUTENTICANDO...' : (isLogin ? 'ACCEDER AHORA' : 'REGISTRARME')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? '¿No tienes cuenta activa?' : '¿Ya eres miembro?'}{' '}
          <span onClick={() => { setIsLogin(!isLogin); setMsg({text:'', type:''}); }} className="auth-toggle-link">
            {isLogin ? 'CREAR CUENTA' : 'VOLVER AL LOGIN'}
          </span>
        </div>
      </div>
    </div>
  );
}