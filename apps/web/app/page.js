'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-wrapper">
      {/* Background Decorativo */}
      <div className="cyber-grid-bg"></div>
      
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge-beta">
            <span className="dot pulse-blue"></span>
            COMPARTIENDO ESPACIO (BETA) v1.0
          </div>
          
          <h1 className="hero-title">
            El Futuro del Estacionamiento <br />
            <span>P2P Inteligente</span>
          </h1>
          
          <p className="hero-description">
            Optimiza tu tiempo y genera ingresos compartiendo tu espacio. 
            Arquitectura de microservicios diseñada para reducir las emisiones y 
            la congestión en la Región Metropolitana.
          </p>

          <div className="hero-actions">
            <Link href="/mapa" className="btn-cyber-primary">
              <i className="fa-solid fa-location-dot" style={{marginRight: '10px'}}></i>
              Entrar a la Red P2P
            </Link>
            <Link href="/sobre-mi" className="btn-cyber-secondary">
              <i className="fa-solid fa-file-contract" style={{marginRight: '10px'}}></i>
              Whitepaper / Arquitectura
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="radar-container">
            <div className="radar-circle circle-1"></div>
            <div className="radar-circle circle-2"></div>
            <div className="radar-circle circle-3"></div>
            <div className="radar-scanner"></div>
            {/* Nodos parpadeantes simulando la red */}
            <div className="node n1"></div>
            <div className="node n2"></div>
            <div className="node n3"></div>
          </div>
        </div>
      </section>

      <section className="features-grid">
        <div className="glass-panel feature-card">
          <div className="f-icon"><i className="fa-solid fa-server"></i></div>
          <h3>Microservicios Escalables</h3>
          <p>Arquitectura desacoplada (BFF + CQRS) para consultas geoespaciales de latencia ultrabaja.</p>
        </div>
        <div className="glass-panel feature-card">
          <div className="f-icon"><i className="fa-solid fa-money-check-dollar"></i></div>
          <h3>Transacciones Seguras</h3>
          <p>Implementación de Patrón Saga para garantizar compensaciones en caso de fallo.</p>
        </div>
        <div className="glass-panel feature-card">
          <div className="f-icon"><i className="fa-solid fa-leaf"></i></div>
          <h3>Eco-Sostenible & PMR</h3>
          <p>Inclusión ética desde el diseño y optimización de rutas para reducir emisiones.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Desarrollado para Universidad de las Américas | <strong>Arquitectura de Software</strong></p>
        <p className="sub">Gabriel Molina & Guillermo Santander © 2026</p>
      </footer>

      <style jsx>{`
        .landing-wrapper { min-height: 100vh; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; }
        
        .cyber-grid-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px); background-size: 40px 40px; z-index: -1; opacity: 0.5; mask-image: linear-gradient(to bottom, black 40%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%); }

        .hero-section { display: flex; align-items: center; justify-content: space-between; padding: 100px 5%; width: 100%; max-width: 1300px; gap: 50px; flex: 1; }
        
        .hero-content { flex: 1; text-align: left; animation: slideRight 0.8s ease-out; }
        .badge-beta { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-radius: 100px; font-size: 0.75rem; font-weight: 900; letter-spacing: 1.5px; border: 1px solid rgba(59, 130, 246, 0.3); margin-bottom: 30px; box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .pulse-blue { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; animation: pulseNode 2s infinite; }
        
        .hero-title { font-size: 4rem; line-height: 1.1; font-weight: 900; color: white; margin-bottom: 25px; letter-spacing: -1px; }
        .hero-title span { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; animation: shimmer 3s infinite linear; }
        
        .hero-description { font-size: 1.2rem; color: #94a3b8; max-width: 550px; line-height: 1.7; margin-bottom: 45px; }
        
        .hero-actions { display: flex; gap: 20px; }
        
        /* Visual Radar */
        .hero-visual { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; height: 450px; animation: scaleUp 1s ease-out; }
        .radar-container { position: relative; width: 400px; height: 400px; display: flex; align-items: center; justify-content: center; }
        .radar-circle { position: absolute; border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 50%; }
        .circle-1 { width: 100%; height: 100%; box-shadow: inset 0 0 40px rgba(59,130,246,0.1); }
        .circle-2 { width: 65%; height: 65%; border-color: rgba(59, 130, 246, 0.4); }
        .circle-3 { width: 30%; height: 30%; background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.6); box-shadow: 0 0 30px rgba(59,130,246,0.4); }
        .radar-scanner { position: absolute; width: 50%; height: 50%; background: conic-gradient(from 0deg, rgba(59,130,246,0.8) 0deg, transparent 60deg); top: 0; left: 50%; transform-origin: bottom left; border-radius: 100% 0 0 0; animation: scanRotate 3s linear infinite; }
        
        .node { position: absolute; width: 12px; height: 12px; background: #10b981; border-radius: 50%; box-shadow: 0 0 15px #10b981; animation: pulseNode 1.5s infinite; }
        .n1 { top: 20%; left: 30%; animation-delay: 0.2s; }
        .n2 { top: 60%; right: 20%; background: #fbbf24; box-shadow: 0 0 15px #fbbf24; animation-delay: 0.7s; }
        .n3 { bottom: 25%; left: 40%; background: #3b82f6; box-shadow: 0 0 15px #3b82f6; animation-delay: 1.2s; }

        /* Features */
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; width: 100%; max-width: 1200px; padding: 0 5% 80px; position: relative; z-index: 5; }
        .feature-card { padding: 40px 30px; text-align: left; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: rgba(15, 23, 42, 0.6); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; position: relative; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transform: scaleX(0); transform-origin: left; transition: transform 0.4s; }
        .feature-card:hover { transform: translateY(-15px); border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .feature-card:hover::before { transform: scaleX(1); }
        .f-icon { width: 60px; height: 60px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #60a5fa; margin-bottom: 25px; border: 1px solid rgba(59, 130, 246, 0.2); }
        .feature-card h3 { margin-bottom: 15px; font-weight: 800; font-size: 1.3rem; color: white; }
        .feature-card p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
        
        .landing-footer { margin-top: auto; padding: 40px; text-align: center; color: #475569; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.05); width: 100%; }
        .landing-footer strong { color: #64748b; }
        .landing-footer .sub { font-size: 0.8rem; margin-top: 10px; }

        @keyframes scanRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseNode { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        
        @media (max-width: 1024px) {
          .hero-section { flex-direction: column; text-align: center; padding: 60px 5%; }
          .hero-content { text-align: center; display: flex; flex-direction: column; align-items: center; }
          .hero-title { font-size: 3rem; }
          .hero-visual { height: 350px; margin-top: 40px; }
          .radar-container { width: 300px; height: 300px; }
          .features-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 500px) {
          .hero-title { font-size: 2.2rem; }
          .hero-actions { flex-direction: column; width: 100%; }
        }
      `}</style>
    </div>
  );
}