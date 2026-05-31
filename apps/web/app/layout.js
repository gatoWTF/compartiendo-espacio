import './globals.css';
import Navbar from '../src/components/Navbar';

export const metadata = {
  title: "Parkings Together | Red P2P de Estacionamientos",
  description: "La red de estacionamientos P2P más inteligente. Optimiza tu movilidad y genera ingresos compartiendo tu espacio.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}