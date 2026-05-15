'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-wrapper">
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge-beta">COMPARTIENDO ESPACIO (BETA) v1.0</div>
          <h1 className="hero-title">
            El Futuro del Estacionamiento <br />
            <span>P2P es Inteligente</span>
          </h1>
          <p className="hero-description">
            Optimiza tu tiempo y genera ingresos compartiendo tu espacio. 
            La red de estacionamientos colaborativos más grande de Santiago Metropolitan Region.
          </p>

          <div className="hero-actions">
            <Link href="/mapa" className="btn-cyber-primary">
              <i className="fa-solid fa-location-dot" style={{marginRight: '10px'}}></i>
              Empezar a buscar
            </Link>
            <Link href="/sobre-mi" className="btn-cyber-secondary">
              Saber más
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="radar-circle"></div>
          <div className="radar-scanner"></div>
        </div>
      </section>

      <section className="features-grid">
        <div className="glass-panel feature-card">
          <i className="fa-solid fa-shield-halved"></i>
          <h3>Seguridad Total</h3>
          <p>Validación de identidad en cada reserva para tu tranquilidad.</p>
        </div>
        <div className="glass-panel feature-card">
          <i className="fa-solid fa-bolt"></i>
          <h3>Acceso Rápido</h3>
          <p>Encuentra tu plaza en segundos con nuestro radar inteligente.</p>
        </div>
        <div className="glass-panel feature-card">
          <i className="fa-solid fa-leaf"></i>
          <h3>Eco-Sostenible</h3>
          <p>Menos vueltas buscando sitio significa menos emisiones en la ciudad.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Desarrollado por <strong>Gabriel Molina</strong> & <strong>Guillermo Santander</strong></p>
      </footer>

      <style jsx>{`
        .landing-wrapper { min-height: 100vh; padding: 0 5%; display: flex; flex-direction: column; align-items: center; }
        .hero-section { display: flex; align-items: center; justify-content: space-between; padding: 80px 0; width: 100%; max-width: 1200px; gap: 50px; }
        .hero-content { flex: 1; text-align: left; }
        .badge-beta { display: inline-block; padding: 6px 14px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; border-radius: 100px; font-size: 0.75rem; font-weight: 900; letter-spacing: 1.5px; border: 1px solid rgba(59, 130, 246, 0.2); margin-bottom: 25px; }
        .hero-title { font-size: 3.5rem; line-height: 1.1; font-weight: 900; color: white; margin-bottom: 25px; }
        .hero-title span { background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-description { font-size: 1.1rem; color: #94a3b8; max-width: 500px; line-height: 1.6; margin-bottom: 40px; }
        .hero-actions { display: flex; gap: 20px; }
        .hero-visual { flex: 1; height: 400px; position: relative; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%); }
        .radar-circle { width: 300px; height: 300px; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 50%; position: relative; }
        .radar-scanner { position: absolute; width: 150px; height: 150px; background: conic-gradient(from 0deg, #3b82f6 0deg, transparent 90deg); top: 50px; left: 50px; border-radius: 50%; animation: rotate 4s linear infinite; opacity: 0.3; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; width: 100%; max-width: 1200px; margin-top: 50px; padding-bottom: 80px; }
        .feature-card { padding: 40px; text-align: center; transition: 0.3s; }
        .feature-card:hover { transform: translateY(-10px); border-color: rgba(59, 130, 246, 0.5); }
        .feature-card i { font-size: 2.5rem; color: #3b82f6; margin-bottom: 20px; }
        .feature-card h3 { margin-bottom: 15px; font-weight: 800; }
        .feature-card p { color: #64748b; font-size: 0.9rem; line-height: 1.5; }
        .landing-footer { margin-top: auto; padding: 40px; color: #475569; font-size: 0.85rem; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .hero-section { flex-direction: column; text-align: center; padding: 40px 0; }
          .hero-content { text-align: center; }
          .hero-description { margin: 0 auto 40px; }
          .hero-actions { justify-content: center; }
          .features-grid { grid-template-columns: 1fr; }
          .hero-title { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}