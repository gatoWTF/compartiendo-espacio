'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing-wrapper">
      <div className="cyber-grid-bg"></div>

      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Estaciona sin estrés.<br />
            <span>Gana con tu espacio.</span>
          </h1>

          <p className="hero-description">
            Conectamos conductores que buscan estacionamiento con propietarios que tienen plazas disponibles.
            Simple, rápido y seguro.
          </p>

          <div className="hero-actions">
            <Link href="/mapa" className="btn-cyber-primary">
              <i className="fa-solid fa-map-location-dot" style={{ marginRight: '10px' }}></i>
              Ver estacionamientos
            </Link>
            <Link href="/auth" className="btn-cyber-secondary">
              <i className="fa-solid fa-user-plus" style={{ marginRight: '10px' }}></i>
              Registrarme gratis
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="radar-container">
            <div className="radar-circle circle-1"></div>
            <div className="radar-circle circle-2"></div>
            <div className="radar-circle circle-3"></div>
            <div className="radar-scanner"></div>
            <div className="node n1"></div>
            <div className="node n2"></div>
            <div className="node n3"></div>
          </div>
        </div>
      </section>

      <section className="features-grid">
        <div className="glass-panel feature-card">
          <div className="f-icon"><i className="fa-solid fa-coins"></i></div>
          <h3>Gana dinero con tu espacio</h3>
          <p>Convierte tu estacionamiento disponible en ingresos adicionales de forma simple y segura. Tú pones el precio y los horarios.</p>
        </div>
        <div className="glass-panel feature-card">
          <div className="f-icon"><i className="fa-solid fa-magnifying-glass-location"></i></div>
          <h3>Encuentra plaza rápidamente</h3>
          <p>Reserva una plaza en segundos y evita perder tiempo buscando dónde estacionar. Filtra por zona, precio y disponibilidad.</p>
        </div>
        <div className="glass-panel feature-card">
          <div className="f-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <h3>Comunidad confiable</h3>
          <p>Perfiles verificados y sistema de reseñas para una experiencia segura y transparente, tanto para conductores como arrendadores.</p>
        </div>
      </section>

      {/* How it works */}
      <section style={{ width: '100%', maxWidth: '900px', padding: '0 5% 80px', position: 'relative', zIndex: 5 }}>
        <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.8rem', textAlign: 'center', marginBottom: '40px' }}>¿Cómo funciona?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '24px' }}>
          {[
            { n: '1', icon: 'fa-magnifying-glass', title: 'Busca', desc: 'Ingresa tu destino o activa tu ubicación para ver plazas cercanas en el mapa.' },
            { n: '2', icon: 'fa-hand-pointer', title: 'Elige', desc: 'Selecciona la plaza que mejor se ajuste a tu horario y presupuesto.' },
            { n: '3', icon: 'fa-lock', title: 'Reserva', desc: 'Confirma tu reserva en segundos. Tu plaza queda bloqueada de inmediato.' },
            { n: '4', icon: 'fa-circle-check', title: '¡Listo!', desc: 'Llega a tu plaza con total tranquilidad. Sin vueltas, sin sorpresas.' },
          ].map(({ n, icon, title, desc }) => (
            <div key={n} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', padding: '28px 22px', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative' }}>
                <i className={`fa-solid ${icon}`} style={{ color: '#60a5fa', fontSize: '1.2rem' }}></i>
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#3b82f6', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</span>
              </div>
              <h4 style={{ color: '#f8fafc', fontWeight: 800, marginBottom: '8px', fontSize: '1rem' }}>{title}</h4>
              <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link href="/mapa" className="btn-cyber-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-location-dot"></i>
            Explorar estacionamientos
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <p style={{ color: '#475569', fontSize: '0.85rem' }}>Parkings Together © 2026 — Plataforma de estacionamientos compartidos</p>
        <p className="sub">Gabriel Molina & Guillermo Santander</p>
      </footer>

      <style jsx>{`
        .landing-wrapper { min-height: 100vh; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; }
        .cyber-grid-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px); background-size: 40px 40px; z-index: -1; opacity: 0.5; mask-image: linear-gradient(to bottom, black 40%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%); }
        .hero-section { display: flex; align-items: center; justify-content: space-between; padding: 100px 5%; width: 100%; max-width: 1300px; gap: 50px; flex: 1; }
        .hero-content { flex: 1; text-align: left; animation: slideRight 0.8s ease-out; }
        .hero-title { font-size: 4rem; line-height: 1.1; font-weight: 900; color: white; margin-bottom: 25px; letter-spacing: -1px; }
        .hero-title span { background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
        .hero-description { font-size: 1.2rem; color: #94a3b8; max-width: 550px; line-height: 1.7; margin-bottom: 45px; }
        .hero-actions { display: flex; gap: 20px; flex-wrap: wrap; }
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
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; width: 100%; max-width: 1200px; padding: 0 5% 60px; position: relative; z-index: 5; }
        .feature-card { padding: 40px 30px; text-align: left; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: rgba(15, 23, 42, 0.6); border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; position: relative; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transform: scaleX(0); transform-origin: left; transition: transform 0.4s; }
        .feature-card:hover { transform: translateY(-15px); border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .feature-card:hover::before { transform: scaleX(1); }
        .f-icon { width: 60px; height: 60px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #60a5fa; margin-bottom: 25px; border: 1px solid rgba(59, 130, 246, 0.2); }
        .feature-card h3 { margin-bottom: 15px; font-weight: 800; font-size: 1.2rem; color: white; }
        .feature-card p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; }
        .landing-footer { margin-top: auto; padding: 40px; text-align: center; color: #475569; font-size: 0.9rem; border-top: 1px solid rgba(255,255,255,0.05); width: 100%; }
        .landing-footer .sub { font-size: 0.8rem; margin-top: 8px; color: #334155; }
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
