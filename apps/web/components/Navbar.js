'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkSession();
    window.addEventListener('storage', checkSession);
    return () => window.removeEventListener('storage', checkSession);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <nav style={{ 
      margin: '20px 5%', 
      padding: '15px 30px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      position: 'sticky', 
      top: '20px', 
      zIndex: 2000,
      background: 'rgba(15, 23, 42, 0.6)', 
      backdropFilter: 'blur(20px)', 
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      
      {/* ─── LOGO ─── */}
      <Link href="/" style={{ fontSize: '1.4rem', fontWeight: '900', textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#3b82f6' }}>P</span>arking's Together
      </Link>

      {/* ─── ENLACES CON LAS CLASES CORRECTAS DEL CSS ─── */}
      <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
        <Link href="/" className="nav-link-cyber">Inicio</Link>
        <Link href="/mapa" className="nav-link-cyber">Buscar Plaza</Link>
        <Link href="/sobre-mi" className="nav-link-cyber">Sobre mí</Link>
        
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px', paddingLeft: '15px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>
              Hola, <span style={{ color: 'white' }}>{user.nombre || user.email?.split('@')[0]}</span>
            </span>
            <button onClick={handleLogout} className="btn-cyber-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              Salir
            </button>
          </div>
        ) : (
          <Link href="/auth" className="btn-cyber-primary" style={{ fontSize: '0.9rem', padding: '10px 24px', marginLeft: '10px' }}>
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
}