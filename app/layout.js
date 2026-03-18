import "./globals.css";
import Link from 'next/link'; 

export const metadata = {
  title: "Compartiendo Espacio",
  description: "Optimización de Movilidad Urbana",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
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
              {/* INNOVACIÓN: Nuevo enlace al Panel Administrativo */}
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <button className="nav-btn"><i className="fa-solid fa-chart-line"></i> Mi Panel de Anfitrión</button>
              </Link>
            </nav>

            <div className="user-menu">
              <div id="auth-menu">
                <Link href="/auth" style={{ textDecoration: 'none' }}>
                  <button className="btn-outline"><i className="fa-solid fa-user"></i> Ingresar / Registro</button>
                </Link>
              </div>
            </div>
            
            <div className="footer-mini">
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