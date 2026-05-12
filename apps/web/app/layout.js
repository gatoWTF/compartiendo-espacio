import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="hero-gradient">
        <nav className="glass" style={{ margin: '20px', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '20px', zIndex: 1000 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>
            <span style={{ color: 'var(--primary)' }}>P</span>arking's Together
          </div>
          <div style={{ display: 'flex', gap: '30px' }}>
            <Link href="/" className="nav-link">Inicio</Link>
            <Link href="/mapa" className="nav-link">Buscar Plaza</Link>
            <Link href="/sobre-mi" className="nav-link">Sobre mí</Link>
          </div>
          <Link href="/auth" className="btn-main" style={{ fontSize: '0.9rem', padding: '8px 20px' }}>Ingresar</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}