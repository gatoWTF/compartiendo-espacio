export default function HealthCheckReservas() {
  return (
    <div style={{ padding: '3rem', fontFamily: 'sans-serif', background: '#0f172a', color: '#f59e0b', height: '100vh' }}>
      <h1>✅ Microservicio de Reservas: ONLINE</h1>
      <p style={{ color: '#94a3b8' }}>El sistema transaccional (Saga) está desplegado correctamente en Vercel.</p>
      <p>La ruta de transacciones POST es: <strong>/api/reserve</strong></p>
    </div>
  );
}