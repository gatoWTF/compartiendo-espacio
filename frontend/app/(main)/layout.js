'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Ruta re-ajustada (retrocede 2 niveles)
import { useRouter } from 'next/navigation';

export default function MainLayout({ children }) {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Obtener sesión actual al cargar
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        // Traer perfil de la base de datos pública
        const { data } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
        setUserProfile(data);
      }
    };
    fetchSession();

    // 2. Escuchar cambios de autenticación en vivo
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

  // SOLUCIÓN: Botón de Desconexión Innovado
  const handleLogout = async () => {
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();
    // Redirigir a la nueva pantalla de autenticación dividida
    router.push('/auth'); 
  };

  return (
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
          
          {/* Menú inteligente: Solo anfitriones ven el dashboard */}
          {session && userProfile?.rol === 'arrendador' && (
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <button className="nav-btn"><i className="fa-solid fa-chart-line"></i> Mi Panel de Anfitrión</button>
            </Link>
          )}
        </nav>

        {/* Sección de Usuario Innovada */}
        <div className="user-menu" style={{ marginTop: 'auto' }}>
          {session ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="user-profile-mini" style={{ marginBottom: '15px' }}>
                {/* Ícono de usuario con color de acento principal */}
                <i className="fa-solid fa-circle-user" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <div>
                  <p style={{ margin: 0, color: 'white' }}>{userProfile?.nombre_completo || 'Usuario'}</p>
                  <span style={{ textTransform: 'capitalize', color: 'var(--status-green)' }}>
                    {userProfile?.rol || 'Conductor'}
                  </span>
                </div>
              </div>
              {/* SOLUCIÓN: Botón de desconexión ahora activo */}
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
  );
}