// Archivo: apps/auth/app/page.js
export default function HealthCheckAuth() {
  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif', background: '#0f172a', color: '#10b981', height: '100vh' }}>
      <h1>✅ Microservicio de Autenticación: ONLINE</h1>
      <p style={{ color: '#94a3b8' }}>El motor de autenticación está desplegado correctamente en Vercel.</p>
      <p>Rutas disponibles:</p>
      <ul style={{ color: '#94a3b8' }}>
        <li><strong>POST</strong> /api/v1/auth/login</li>
        <li><strong>POST</strong> /api/v1/auth/register</li>
      </ul>
    </div>
  );
}