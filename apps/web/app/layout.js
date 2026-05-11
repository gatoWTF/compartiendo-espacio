import "./globals.css";

export const metadata = {
  title: "Parking's Together",
  description: "Sistema de gestión de estacionamientos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}