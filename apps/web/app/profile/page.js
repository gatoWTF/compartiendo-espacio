// Archivo: apps/web/app/profile/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = window.localStorage.getItem('user');
    const token   = window.localStorage.getItem('access_token');

    if (!userStr || !token) {
      router.push('/auth');
      return;
    }

    setUser(JSON.parse(userStr));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    router.push('/');
  };

  if (loading) return (
    <div className="loader-screen">
      <i className="fa-solid fa-satellite fa-spin"></i>
      <p>Autenticando Nodo...</p>
      <style jsx>{`
        .loader-screen { height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #3b82f6; font-size: 2rem; gap: 15px; }
        .loader-screen p { font-size: 1rem; font-weight: 800; letter-spacing: 2px; }
      `}</style>
    </div>
  );

  return (
    <div className="profile-wrapper">
      <div className="cyber-grid-bg"></div>

      <div className="profile-glass-card">
        <div className="profile-header">
          <div className="avatar-ring">
            <i className="fa-solid fa-user-astronaut"></i>
          </div>
          <h1>{user?.nombre || 'Operador de Red'}</h1>
          <p className="email-tag">{user?.email}</p>
          <div className="status-badge">
             <span className="dot pulse-green"></span> NODO AUTENTICADO
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
             <i className="fa-solid fa-clock-rotate-left"></i>
             <span>Historial Activo</span>
          </div>
          <div className="stat-box">
             <i className="fa-solid fa-shield-check"></i>
             <span>Identidad P2P</span>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => router.push('/dashboard')} className="btn-action primary">
            <i className="fa-solid fa-network-wired"></i>
            Gestionar Nodos (Dashboard)
          </button>
          <button onClick={handleLogout} className="btn-action danger">
            <i className="fa-solid fa-power-off"></i>
            Desconectar
          </button>
        </div>
      </div>

      <style jsx>{`
        .profile-wrapper { min-height: calc(100vh - 70px); padding: 60px 20px; display: flex; justify-content: center; align-items: center; position: relative; }
        .cyber-grid-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px); background-size: 40px 40px; z-index: -1; }
        
        .profile-glass-card { width: 100%; max-width: 500px; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 30px; padding: 50px 40px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        
        .profile-header { margin-bottom: 40px; }
        .avatar-ring { width: 100px; height: 100px; margin: 0 auto 20px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.1)); border: 2px solid #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #60a5fa; box-shadow: 0 0 30px rgba(59, 130, 246, 0.3); }
        h1 { color: white; font-size: 1.8rem; font-weight: 900; margin-bottom: 5px; }
        .email-tag { color: #94a3b8; font-size: 0.95rem; margin-bottom: 20px; }
        
        .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; border-radius: 20px; font-size: 0.75rem; font-weight: 900; letter-spacing: 1px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .pulse-green { background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }

        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 40px; }
        .stat-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; color: #cbd5e1; font-size: 0.85rem; font-weight: 800; transition: 0.3s; }
        .stat-box:hover { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); transform: translateY(-5px); }
        .stat-box i { font-size: 1.5rem; color: #3b82f6; }

        .action-buttons { display: flex; flex-direction: column; gap: 15px; }
        .btn-action { padding: 18px; border-radius: 16px; font-size: 1rem; font-weight: 900; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; }
        .btn-action.primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3); }
        .btn-action.primary:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(37, 99, 235, 0.5); }
        .btn-action.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .btn-action.danger:hover { background: #ef4444; color: white; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4); }

        @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        @media (max-width: 500px) {
          .profile-wrapper { padding: 20px; }
          .profile-glass-card { padding: 40px 20px; }
        }
      `}</style>
    </div>
  );
}