'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
        alert("¡Cuenta creada exitosamente!");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-fullscreen">
      <div className="auth-glass-box">
        <div className="brand-logo">
           <i className={isLogin ? "fa-solid fa-shield-halved" : "fa-solid fa-user-plus"}></i>
        </div>
        <h2>{isLogin ? 'Iniciar Sesión' : 'Únete a la Red'}</h2>
        <p className="auth-subtitle">SISTEMA P2P - COMPARTIENDO ESPACIO</p>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleAuth} className="auth-form">
          {!isLogin && (
            <div className="input-wrap">
              <input type="text" placeholder="Nombre completo" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
            </div>
          )}
          <div className="input-wrap">
            <input type="email" placeholder="Correo electrónico" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="input-wrap">
            <input type="password" placeholder="Contraseña" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          
          <button type="submit" className="auth-btn-main" disabled={loading}>
            {loading ? 'AUTENTICANDO...' : (isLogin ? 'ACCEDER AHORA' : 'REGISTRARME')}
          </button>
        </form>

        <div className="auth-footer-text">
          {isLogin ? '¿No tienes cuenta activa?' : '¿Ya eres miembro?'}{' '}
          <span onClick={() => setIsLogin(!isLogin)} className="toggle-link">
            {isLogin ? 'CREAR CUENTA' : 'VOLVER AL LOGIN'}
          </span>
        </div>
      </div>

      <style jsx>{`
        .auth-fullscreen { height: 100vh; display: flex; justify-content: center; align-items: center; background: #020617; }
        .auth-glass-box { width: 100%; max-width: 440px; padding: 60px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(25px); border-radius: 35px; border: 1px solid rgba(255,255,255,0.1); text-align: center; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8); }
        .brand-logo { width: 70px; height: 70px; background: rgba(59, 130, 246, 0.1); border: 1.5px solid #3b82f6; border-radius: 20px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 1.8rem; }
        h2 { color: white; font-size: 2rem; font-weight: 900; margin: 0; }
        .auth-subtitle { font-size: 0.75rem; color: #64748b; letter-spacing: 3px; margin: 15px 0 40px 0; font-weight: 800; }
        .input-wrap input { width: 100%; padding: 18px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: white; margin-bottom: 20px; outline: none; transition: 0.3s; }
        .input-wrap input:focus { border-color: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
        .auth-btn-main { width: 100%; padding: 18px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 16px; color: white; font-weight: 900; cursor: pointer; transition: 0.3s; margin-top: 10px; }
        .auth-btn-main:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4); }
        .error-alert { padding: 15px; background: rgba(239, 68, 68, 0.15); border: 1px solid #f87171; color: #f87171; border-radius: 12px; margin-bottom: 25px; font-size: 0.85rem; }
        .auth-footer-text { margin-top: 35px; font-size: 0.85rem; color: #94a3b8; }
        .toggle-link { color: #3b82f6; cursor: pointer; font-weight: 900; margin-left: 10px; }
      `}</style>
    </div>
  );
}