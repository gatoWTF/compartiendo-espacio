'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, [pathname]);

  return (
    <nav className="glass-panel" style={{ margin: '20px 5%', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '20px', zIndex: 2000 }}>
      
      <Link href="/" style={{ fontSize: '1.3rem', fontWeight: '900', textDecoration: 'none', color: 'white' }}>
        <span style={{ color: '#3b82f6' }}>P</span>arking's Together
      </Link>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link href="/" className="nav-link-cyber">Inicio</Link>
        <Link href="/mapa" className="nav-link-cyber">Buscar Plaza</Link>
        <Link href="/sobre-mi" className="nav-link-cyber">Sobre mí</Link>
        
        {!user ? (
          <Link href="/auth" className="btn-cyber-primary" style={{ marginLeft: '10px', padding: '10px 20px' }}>
            Ingresar
          </Link>
        ) : (
          <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.9rem' }}>Hola, {user.nombre}</span>
        )}
      </div>
    </nav>
  );
}