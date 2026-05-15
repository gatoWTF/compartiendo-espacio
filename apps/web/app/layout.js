import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: "Parking's Together | Compartiendo Espacio",
  description: "La red de estacionamientos P2P más inteligente.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}