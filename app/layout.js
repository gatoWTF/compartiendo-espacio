import "./globals.css";

export const metadata = {
  title: "Compartiendo Espacio",
  description: "Optimización de Movilidad Urbana",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body>
        <div className="app-container">
          <aside className="sidebar">
            <div className="logo-container">
              <i className="fa-solid fa-square-parking logo-icon"></i>
              <h2>Compartiendo<span>Espacio</span></h2>
            </div>

            <nav className="nav-menu">
              <button className="nav-btn active"><i className="fa-solid fa-map-location-dot"></i> Búsqueda y Mapa</button>
              <button className="nav-btn"><i className="fa-solid fa-envelope"></i> Soporte y Contacto</button>
            </nav>

            <div className="user-menu">
              <div id="auth-menu">
                <button className="btn-outline"><i className="fa-solid fa-user"></i> Ingresar / Registro</button>
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