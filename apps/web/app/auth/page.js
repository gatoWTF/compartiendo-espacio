'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successAnim, setSuccessAnim] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Simula comprobación de conexión a Vercel/Nube
    const url = process.env.NEXT_PUBLIC_MS_AUTH_URL || 'localhost';
    if (url.includes('vercel.app') || window.location.hostname.includes('vercel.app')) {
      setIsCloudConnected(true);
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación simplificada de contraseña (solo letras y números, mín 6)
    const passRegex = /^[a-zA-Z0-9]{6,}$/;
    if (!passRegex.test(formData.password)) {
      setError("Contraseña inválida: Solo se permiten letras y números (mínimo 6 caracteres).");
      setLoading(false);
      return;
    }

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

      setSuccessAnim(true); // Activa la animación de éxito

      setTimeout(() => {
        if (isLogin) {
          localStorage.setItem('access_token', result.access_token);
          localStorage.setItem('user', JSON.stringify(result.user));
          router.push('/mapa');
        } else {
          setIsLogin(true);
          setSuccessAnim(false);
          setFormData({ email: '', password: '', nombre: '' });
          setError("¡Cuenta creada con éxito! Sincronizado con Supabase Cloud.");
        }
      }, 1500);

    } catch (err) { 
      setError(err.message); 
      setLoading(false);
    }
  };

  return (
    <div className="auth-fullscreen">
      {/* Banner de Infraestructura Superior */}
      <div className="infra-banner">
        <div className="infra-badge ms">
          <span className="dot pulse-blue"></span>
          MS-Auth Activo
        </div>
        <div className="infra-badge db">
          <span className="dot pulse-green"></span>
          Supabase DB Conectado
        </div>
        {isCloudConnected && (
          <div className="infra-badge cloud">
            <i className="fa-solid fa-cloud"></i> Vercel Cloud Edge
          </div>
        )}
      </div>

      <div className={`auth-glass-box ${successAnim ? 'success-mode' : ''}`}>
        {!successAnim ? (
          <>
            <div className="brand-logo">
               <i className={isLogin ? "fa-solid fa-fingerprint" : "fa-solid fa-satellite-dish"}></i>
            </div>
            <h2>{isLogin ? 'Acceso Seguro' : 'Registro en la Red'}</h2>
            <p className="auth-subtitle">P2P DISTRIBUIDO - COMPARTIENDO ESPACIO</p>

            {error && (
              <div className={`error-alert ${error.includes('éxito') ? 'success-text' : ''}`}>
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="auth-form">
              <div className={`form-step ${!isLogin ? 'expanded' : 'collapsed'}`}>
                <div className="input-wrap">
                  <i className="fa-solid fa-user icon"></i>
                  <input type="text" placeholder="Tu nombre completo" required={!isLogin} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
              </div>

              <div className="input-wrap">
                <i className="fa-solid fa-envelope icon"></i>
                <input type="email" placeholder="Correo electrónico" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="input-wrap tooltip-container">
                <i className="fa-solid fa-lock icon"></i>
                <input type="password" placeholder="Contraseña (letras y números)" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <span className="tooltip-text">Solo letras y números, mín 6 caracteres.</span>
              </div>
              
              <button type="submit" className="auth-btn-main" disabled={loading}>
                {loading ? (
                  <span className="btn-content"><i className="fa-solid fa-spinner fa-spin"></i> SINCRONIZANDO...</span>
                ) : (
                  <span className="btn-content">
                    {isLogin ? <><i className="fa-solid fa-right-to-bracket"></i> CONECTAR</> : <><i className="fa-solid fa-bolt"></i> CREAR NODO</>}
                  </span>
                )}
              </button>
            </form>

            <div className="auth-footer-text">
              {isLogin ? '¿Primera vez en la red?' : '¿Ya tienes acceso?'}{' '}
              <span onClick={() => { setIsLogin(!isLogin); setError(null); }} className="toggle-link">
                {isLogin ? 'ÚNETE AQUÍ' : 'INICIAR SESIÓN'}
              </span>
            </div>
          </>
        ) : (
          <div className="success-screen">
            <div className="success-circle">
              <i className="fa-solid fa-check"></i>
            </div>
            <h3>{isLogin ? 'Autenticación Verificada' : 'Nodo Creado'}</h3>
            <p>Descargando credenciales de Supabase...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-fullscreen { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); position: relative; overflow: hidden; padding: 20px; }
        
        .infra-banner { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; z-index: 10; flex-wrap: wrap; justify-content: center; width: 100%; padding: 0 10px; }
        .infra-badge { padding: 6px 12px; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 8px; font-weight: 700; letter-spacing: 0.5px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .pulse-blue { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; animation: pulse 2s infinite; }
        .pulse-green { background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
        
        .auth-glass-box { width: 100%; max-width: 440px; padding: 50px 40px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(40px); border-radius: 35px; border: 1px solid rgba(255,255,255,0.05); text-align: center; box-shadow: 0 30px 60px -20px rgba(0,0,0,1); transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); position: relative; z-index: 2; }
        .auth-glass-box::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent); transform: skewX(-20deg); animation: shine 6s infinite; }
        
        .success-mode { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); transform: scale(1.02); }
        
        .brand-logo { width: 80px; height: 80px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1)); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 24px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 2.2rem; box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.2), 0 0 30px rgba(59, 130, 246, 0.1); }
        h2 { color: white; font-size: 2.2rem; font-weight: 900; margin: 0; letter-spacing: -1px; }
        .auth-subtitle { font-size: 0.7rem; color: #3b82f6; letter-spacing: 4px; margin: 15px 0 35px 0; font-weight: 900; }
        
        .input-wrap { position: relative; margin-bottom: 20px; transition: all 0.3s; }
        .input-wrap .icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #64748b; font-size: 1.1rem; transition: 0.3s; }
        .input-wrap input { width: 100%; box-sizing: border-box; padding: 18px 20px 18px 55px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; color: white; outline: none; transition: 0.3s; font-size: 1rem; }
        .input-wrap input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); background: rgba(0,0,0,0.6); }
        .input-wrap input:focus + .icon, .input-wrap input:not(:placeholder-shown) + .icon { color: #3b82f6; }
        
        .form-step { overflow: hidden; transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out; }
        .form-step.collapsed { max-height: 0; opacity: 0; margin-bottom: 0; }
        .form-step.expanded { max-height: 100px; opacity: 1; }
        
        .tooltip-container:hover .tooltip-text { opacity: 1; visibility: visible; bottom: 110%; }
        .tooltip-text { position: absolute; bottom: 90%; left: 50%; transform: translateX(-50%); background: #1e293b; color: #cbd5e1; padding: 8px 12px; border-radius: 8px; font-size: 0.75rem; opacity: 0; visibility: hidden; transition: 0.3s; white-space: nowrap; border: 1px solid rgba(255,255,255,0.1); z-index: 10; pointer-events: none; }
        
        .auth-btn-main { width: 100%; padding: 20px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 16px; color: white; font-weight: 900; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; margin-top: 15px; letter-spacing: 1px; position: relative; overflow: hidden; }
        .auth-btn-main:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.4); }
        .auth-btn-main:active { transform: translateY(0); }
        .btn-content { display: flex; align-items: center; justify-content: center; gap: 10px; }
        
        .error-alert { padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 12px; margin-bottom: 25px; font-size: 0.85rem; line-height: 1.5; font-weight: 600; }
        .error-alert.success-text { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.4); color: #6ee7b7; }
        
        .auth-footer-text { margin-top: 35px; font-size: 0.9rem; color: #94a3b8; }
        .toggle-link { color: #3b82f6; cursor: pointer; font-weight: 900; margin-left: 8px; text-decoration: underline; text-decoration-color: transparent; transition: 0.3s; }
        .toggle-link:hover { text-decoration-color: #3b82f6; }
        
        .success-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 350px; animation: fadeIn 0.5s ease; }
        .success-circle { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; margin-bottom: 20px; box-shadow: 0 0 40px rgba(16, 185, 129, 0.4); animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .success-screen h3 { color: white; font-size: 1.8rem; margin-bottom: 10px; }
        .success-screen p { color: #10b981; font-weight: 600; font-size: 0.9rem; }
        
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes shine { 100% { left: 200%; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
        
        @media (max-width: 500px) {
          .auth-glass-box { padding: 40px 25px; border-radius: 25px; border-left: none; border-right: none; }
          .infra-banner { top: 10px; flex-direction: column; align-items: center; gap: 5px; }
          .auth-fullscreen { padding: 10px; align-items: flex-start; padding-top: 100px; }
          h2 { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
}