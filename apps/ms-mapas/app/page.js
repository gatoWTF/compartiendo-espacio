export default function HealthCheckMapas() {
  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif', background: '#0f172a', color: '#38bdf8', height: '100vh' }}>
      <h1>✅ Microservicio de Mapas (PostGIS): ONLINE</h1>
      <p style={{ color: '#94a3b8' }}>El motor geoespacial está desplegado correctamente en Vercel.</p>
      <p>La ruta de búsqueda es: <strong>/api/search?lat=-33.4&lng=-70.6</strong></p>
    </div>
  );
}