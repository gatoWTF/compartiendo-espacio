// Archivo: apps/web/app/profile/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // FIX: La key correcta es 'user', guardada en auth/page.js tras el login
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
    <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
    </div>
  );

  return (
    <div style={{ padding: '60px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(59,130,246,0.1)', border: '2px solid #3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px', fontSize: '2rem', color: '#3b82f6' }}>
          <i className="fa-solid fa-user"></i>
        </div>
        <h1 style={{ color: 'white', marginBottom: '8px', fontWeight: '800' }}>{user?.nombre || 'Usuario'}</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>{user?.email}</p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-cyber-primary"
            style={{ padding: '12px 24px' }}
          >
            <i className="fa-solid fa-gauge" style={{ marginRight: '8px' }}></i>
            Panel de Control
          </button>
          <button
            onClick={handleLogout}
            className="btn-cyber-secondary"
            style={{ padding: '12px 24px' }}
          >
            <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '8px' }}></i>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}