export default function HealthCheckBFF() {
  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif', background: '#0f172a', color: '#10b981', height: '100vh' }}>
      <h1>✅ BFF (Backend For Frontend): ONLINE</h1>
      <p style={{ color: '#94a3b8' }}>El intermediario está desplegado correctamente en Vercel.</p>
      <p>La ruta de datos reales está en: <strong>/api/dashboard</strong></p>
    </div>
  );
}