'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@parkings/supabase-db';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <nav className="glass" style={{ margin: '20px', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '20px', zIndex: 1000 }}>
      <Link href="/" style={{ fontSize: '1.2rem', fontWeight: '800', textDecoration: 'none', color: 'white' }}>
        <span style={{ color: 'var(--primary)' }}>P</span>arking's Together
      </Link>
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Link href="/" className="nav-link">Inicio</Link>
        <Link href="/mapa" className="nav-link">Buscar Plaza</Link>
        
        {user ? (
          <button onClick={handleLogout} className="glass" style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
            <i className="fa-solid fa-power-off"></i> Salir
          </button>
        ) : (
          <Link href="/auth" className="btn-main" style={{ fontSize: '0.9rem', padding: '8px 20px' }}>Ingresar</Link>
        )}
      </div>
    </nav>
  );
}