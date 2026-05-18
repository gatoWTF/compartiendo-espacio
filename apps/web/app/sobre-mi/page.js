'use client';
export default function AboutPage() {
  return (
    <div className="about-wrapper">
      <div className="cyber-grid-bg"></div>

      <div className="content-container">
        <header className="report-header">
          <div className="badge-academic">REPORTE TÉCNICO - ARQUITECTURA DE SOFTWARE</div>
          <h1 className="report-title">
            Resolviendo la <br/><span>Movilidad Urbana</span>
          </h1>
          <p className="report-subtitle">
            Un enfoque distribuido para reducir la huella de carbono y optimizar el tiempo mediante redes P2P en Santiago.
          </p>
        </header>

        <div className="report-grid">
          {/* Card 1 */}
          <div className="glass-panel info-card">
            <div className="card-icon"><i className="fa-solid fa-microchip"></i></div>
            <h2>Arquitectura Monorepo</h2>
            <p>
              El proyecto <strong>Parking's Together</strong> utiliza <em>Turborepo</em> para orquestar múltiples microservicios (Auth, Mapas, Reservas) junto a un Frontend unificado en Next.js. Esto permite escalabilidad horizontal y despliegues independientes en la nube (Edge).
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel info-card">
            <div className="card-icon"><i className="fa-solid fa-code-branch"></i></div>
            <h2>Patrón Saga & BFF</h2>
            <p>
              Las reservas de estacionamiento implementan el <strong>Patrón Saga</strong>, asegurando que si un microservicio falla (ej. error al pagar), la base de datos compense y libere el cupo. El Frontend se comunica a través de un <em>Backend For Frontend (BFF)</em>.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel info-card">
            <div className="card-icon"><i className="fa-solid fa-database"></i></div>
            <h2>PostGIS & CQRS</h2>
            <p>
              Las búsquedas radiales de 100km se logran en milisegundos gracias a Supabase y PostgreSQL con extensión <strong>PostGIS</strong>. Las consultas de lectura están separadas de la escritura simulando un entorno <em>CQRS</em> ligero.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel info-card highlight">
            <div className="card-icon"><i className="fa-solid fa-wheelchair"></i></div>
            <h2>Inclusión PMR & Eco-diseño</h2>
            <p>
              Al reducir los tiempos de búsqueda en un 40%, minimizamos la congestión vehicular y las emisiones de CO2. Además, el algoritmo prioriza visualmente plazas adaptadas para <strong>Personas con Movilidad Reducida (PMR)</strong>.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .about-wrapper { min-height: 100vh; padding: 100px 5% 50px; position: relative; overflow: hidden; display: flex; justify-content: center; }
        .cyber-grid-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px); background-size: 30px 30px; z-index: -1; opacity: 0.6; }
        
        .content-container { width: 100%; max-width: 1000px; animation: fadeIn 0.8s ease-out; }
        
        .report-header { text-align: center; margin-bottom: 60px; }
        .badge-academic { display: inline-block; padding: 6px 16px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; border-radius: 100px; font-size: 0.75rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 20px; box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
        .report-title { font-size: 3.5rem; font-weight: 900; color: white; line-height: 1.1; margin-bottom: 20px; letter-spacing: -1px; }
        .report-title span { background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .report-subtitle { color: #94a3b8; font-size: 1.1rem; max-width: 700px; margin: 0 auto; line-height: 1.6; }

        .report-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
        
        .info-card { padding: 40px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; position: relative; overflow: hidden; }
        .info-card:hover { transform: translateY(-5px); border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 15px 30px rgba(0,0,0,0.3); }
        .info-card.highlight { background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.1)); border-color: rgba(16, 185, 129, 0.2); }
        
        .card-icon { width: 50px; height: 50px; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 20px; border: 1px solid rgba(59, 130, 246, 0.2); }
        .info-card.highlight .card-icon { background: rgba(16, 185, 129, 0.1); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }
        
        h2 { color: white; font-size: 1.3rem; font-weight: 800; margin-bottom: 15px; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.7; }
        strong { color: #cbd5e1; }
        em { color: #8b5cf6; font-style: normal; font-weight: 700; }
        .info-card.highlight em { color: #10b981; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 800px) {
          .report-grid { grid-template-columns: 1fr; }
          .report-title { font-size: 2.5rem; }
          .info-card { padding: 30px; }
        }
      `}</style>
    </div>
  );
}