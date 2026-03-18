'use client';
import "./globals.css";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function RootLayout({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const { data } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
        setUserProfile(data);
      }
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
        setUserProfile(data);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <html lang="es">
      <head>
        <title>Compartiendo Espacio</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="logo-container">
              <i className="fa-solid fa-square-parking logo-icon"></i>
              <h2>Compartiendo<span>Espacio</span></h2>
            </div>

            <nav className="nav-menu">
              <Link href="/" style={{ textDecoration: 'none' }}>
                <button className="nav-btn"><i className="fa-solid fa-map-location-dot"></i> Búsqueda y Mapa</button>
              </Link>
              
              {session && userProfile?.rol === 'arrendador' && (
                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <button className="nav-btn"><i className="fa-solid fa-chart-line"></i> Mi Panel de Anfitrión</button>
                </Link>
              )}
            </nav>

            <div className="user-menu" style={{ marginTop: 'auto' }}>
              {session ? (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="user-profile-mini" style={{ marginBottom: '15px' }}>
                    <i className="fa-solid fa-circle-user" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                    <div>
                      <p style={{ margin: 0 }}>{userProfile?.nombre_completo || 'Usuario'}</p>
                      <span style={{ textTransform: 'capitalize', color: 'var(--status-green)' }}>
                        {userProfile?.rol || 'Conductor'}
                      </span>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="btn-outline" style={{ width: '100%', borderColor: 'var(--status-red)', color: 'var(--status-red)', fontSize: '0.85rem' }}>
                    <i className="fa-solid fa-power-off"></i> Desconectar
                  </button>
                </div>
              ) : (
                <Link href="/auth" style={{ textDecoration: 'none' }}>
                  <button className="btn-outline"><i className="fa-solid fa-user-astronaut"></i> Entrar a la red</button>
                </Link>
              )}
            </div>
            
            <div className="footer-mini" style={{ marginTop: '15px' }}>
              <p>Compartiendo Espacio © 2026</p>
            </div>
          </aside>

          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}