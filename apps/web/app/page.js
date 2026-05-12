import Link from 'next/link';

export default function LandingPage() {
  return (
    <main style={{ padding: '0 20px', textAlign: 'center', marginTop: '100px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <span style={{ color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '2px' }}>PROYECTO BETA</span>
        <h1 style={{ fontSize: '4rem', fontWeight: '800', margin: '20px 0', lineHeight: '1.1' }}>
          La Red de Estacionamientos <br/> <span style={{ color: 'var(--primary)' }}>P2P de Chile</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '40px' }}>
          Optimiza tu tiempo, reduce emisiones y encuentra plazas exclusivas PMR en segundos. 
          La solución inteligente para la movilidad urbana.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link href="/mapa" className="btn-main" style={{ fontSize: '1.1rem' }}>Empezar a buscar</Link>
          <Link href="/sobre-mi" className="glass" style={{ padding: '12px 24px', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>Saber más</Link>
        </div>
      </div>

      <div style={{ marginTop: '100px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1000px', margin: '100px auto' }}>
        <div className="glass" style={{ padding: '30px' }}>
          <i className="fa-solid fa-bolt" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
          <h3 style={{ marginTop: '15px' }}>Baja Latencia</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>Búsquedas rápidas gracias al motor PostGIS.</p>
        </div>
        <div className="glass" style={{ padding: '30px' }}>
          <i className="fa-solid fa-wheelchair" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
          <h3 style={{ marginTop: '15px' }}>Inclusividad</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>Priorización real de plazas para movilidad reducida.</p>
        </div>
        <div className="glass" style={{ padding: '30px' }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
          <h3 style={{ marginTop: '15px' }}>Seguridad</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '10px' }}>Transacciones seguras y trazables.</p>
        </div>
      </div>
    </main>
  );
}