import './globals.css';
import Navbar from '../src/components/Navbar';

export const metadata = {
  title: "Parkings Together | Encuentra y Comparte Estacionamientos",
  description: "Encuentra estacionamientos cerca de ti y comienza a generar ingresos compartiendo tu plaza disponible.",
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: "Parkings Together",
    description: "Encuentra y comparte estacionamientos P2P cerca de ti.",
    type: 'website',
    locale: 'es_CL',
  },
  twitter: {
    card: 'summary',
    title: "Parkings Together",
    description: "Encuentra y comparte estacionamientos P2P cerca de ti.",
  },
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