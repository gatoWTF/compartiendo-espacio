'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from '@parkings/supabase-db';
import { api } from '../../src/lib/api';
import { PLANES, precioCiclo, FAQ } from '../../src/lib/planes';

const fmt = (n) => n === 0 ? 'Gratis' : `$${n.toLocaleString('es-CL')}`;

export default function PremiumPage() {
  const router = useRouter();
  const [audiencia, setAudiencia] = useState('conductor'); // conductor | arrendador
  const [ciclo, setCiclo]         = useState('mensual');   // mensual | anual
  const [user, setUser]           = useState(null);
  const [planActual, setPlanActual] = useState('free');
  const [procesando, setProcesando] = useState(null); // id del plan en proceso
  const [faqOpen, setFaqOpen]     = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        api.premium.estado().then(res => {
          if (res.success && res.data) {
            setPlanActual(res.data.plan || 'free');
            if (res.data.rol === 'arrendador') setAudiencia('arrendador');
          }
        });
      }
    });
  }, []);

  const handleSuscribir = async (planId) => {
    if (!user) { router.push('/auth?redirectTo=/premium'); return; }
    if (planId === planActual) { toast('Ya tienes este plan activo.', { icon: 'ℹ️' }); return; }

    setProcesando(planId);
    // Simula la pasarela de pago (en prod: Webpay/Transbank).
    await new Promise(r => setTimeout(r, 1100));
    const res = await api.premium.suscribir(planId, ciclo);
    setProcesando(null);

    if (res.success) {
      setPlanActual(planId);
      toast.success(res.message || '¡Listo!');
    } else {
      toast.error(res.error || 'No se pudo procesar la suscripción.');
    }
  };

  const planes = PLANES[audiencia];

  return (
    <div className="premium-wrap">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #3b82f6' } }} />

      {/* ═══ HERO ═══ */}
      <header className="premium-hero">
        <span className="hero-badge"><i className="fa-solid fa-crown"></i> Planes premium</span>
        <h1>Estaciona como un <span className="grad">profesional</span></h1>
        <p className="hero-sub">Desbloquea reservas sin límites, el ranking de las mejores plazas de tu zona y mucho más.</p>

        {/* Audiencia */}
        <div className="aud-toggle">
          <button className={audiencia === 'conductor' ? 'active' : ''} onClick={() => setAudiencia('conductor')}>
            <i className="fa-solid fa-car"></i> Soy Conductor
          </button>
          <button className={audiencia === 'arrendador' ? 'active' : ''} onClick={() => setAudiencia('arrendador')}>
            <i className="fa-solid fa-square-parking"></i> Soy Arrendador
          </button>
        </div>

        {/* Ciclo */}
        <div className="ciclo-toggle">
          <span className={ciclo === 'mensual' ? 'on' : ''}>Mensual</span>
          <button className="switch" onClick={() => setCiclo(c => c === 'mensual' ? 'anual' : 'mensual')} aria-label="Cambiar ciclo de facturación">
            <span className={`knob ${ciclo === 'anual' ? 'right' : ''}`}></span>
          </button>
          <span className={ciclo === 'anual' ? 'on' : ''}>Anual <em className="save-pill">2 meses gratis</em></span>
        </div>
      </header>

      {/* ═══ PLANES ═══ */}
      <section className="planes-grid">
        {planes.map(plan => {
          const precio = precioCiclo(plan.precioMensual, ciclo);
          const esActual = plan.id === planActual;
          return (
            <article key={plan.id} className={`plan-card ${plan.destacado ? 'featured' : ''}`} style={{ '--accent': plan.color }}>
              {plan.destacado && <div className="ribbon">Más popular</div>}

              <div className="plan-icon"><i className={`fa-solid ${plan.icon}`}></i></div>
              <h3>{plan.nombre}</h3>
              <p className="plan-tag">{plan.tagline}</p>

              <div className="plan-price">
                <span className="amount">{fmt(precio)}</span>
                {precio > 0 && <span className="period">/{ciclo === 'anual' ? 'año' : 'mes'}</span>}
              </div>
              {precio > 0 && ciclo === 'anual' && (
                <p className="price-note">≈ ${Math.round(precio / 12).toLocaleString('es-CL')}/mes facturado anual</p>
              )}

              <button
                className={`plan-cta ${esActual ? 'current' : ''}`}
                disabled={procesando === plan.id || esActual}
                onClick={() => handleSuscribir(plan.id)}
              >
                {procesando === plan.id
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Procesando...</>
                  : esActual
                    ? <><i className="fa-solid fa-check"></i> Tu plan actual</>
                    : plan.id === 'free'
                      ? 'Volver a Gratis'
                      : <><i className="fa-solid fa-bolt"></i> Suscribirme</>}
              </button>

              <ul className="plan-benefits">
                {plan.beneficios.map((b, i) => (
                  <li key={i} className={b.ok ? '' : 'off'}>
                    <i className={`fa-solid ${b.ok ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                    {b.txt}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      {/* ═══ CTA RANKING ═══ */}
      <section className="ranking-promo">
        <div className="rp-text">
          <h2><i className="fa-solid fa-trophy" style={{ color: '#f59e0b' }}></i> Mejores de tu zona</h2>
          <p>Con Pro descubres los estacionamientos mejor evaluados según dónde estés, con filtros por comuna, precio y tipo de vehículo.</p>
          <button className="rp-btn" onClick={() => router.push('/ranking')}>
            Ver ranking <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div className="rp-podium">
          <div className="podium-bar second"><span>2</span></div>
          <div className="podium-bar first"><i className="fa-solid fa-crown"></i><span>1</span></div>
          <div className="podium-bar third"><span>3</span></div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="faq">
        <h2>Preguntas frecuentes</h2>
        {FAQ.map((f, i) => (
          <div key={i} className={`faq-item ${faqOpen === i ? 'open' : ''}`}>
            <button onClick={() => setFaqOpen(o => o === i ? null : i)}>
              <span>{f.q}</span>
              <i className={`fa-solid fa-chevron-${faqOpen === i ? 'up' : 'down'}`}></i>
            </button>
            {faqOpen === i && <p>{f.a}</p>}
          </div>
        ))}
      </section>

      <p className="demo-note">
        <i className="fa-solid fa-circle-info"></i> Demo académica · pago simulado. En producción se integra Webpay (Transbank).
      </p>

      <style jsx>{`
        .premium-wrap { max-width: 1080px; margin: 0 auto; padding: 30px 20px 80px; color: #e2e8f0; }

        /* HERO */
        .premium-hero { text-align: center; padding: 30px 0 20px; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); padding: 6px 16px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 18px; }
        .premium-hero h1 { font-size: 2.6rem; font-weight: 900; margin: 0 0 12px; letter-spacing: -1.5px; color: white; }
        .grad { background: linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-sub { color: #94a3b8; font-size: 1.05rem; max-width: 560px; margin: 0 auto 28px; line-height: 1.6; }

        .aud-toggle { display: inline-flex; gap: 6px; background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 5px; margin-bottom: 22px; }
        .aud-toggle button { padding: 10px 20px; border: none; background: transparent; color: #94a3b8; font-weight: 700; border-radius: 10px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
        .aud-toggle button.active { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }

        .ciclo-toggle { display: flex; align-items: center; justify-content: center; gap: 14px; font-size: 0.9rem; color: #64748b; font-weight: 600; }
        .ciclo-toggle .on { color: white; }
        .switch { width: 52px; height: 28px; border-radius: 99px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); position: relative; cursor: pointer; padding: 0; }
        .knob { position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; border-radius: 50%; background: #3b82f6; transition: left 0.25s; }
        .knob.right { left: 26px; background: #8b5cf6; }
        .save-pill { font-style: normal; background: rgba(16,185,129,0.15); color: #34d399; font-size: 0.7rem; padding: 2px 8px; border-radius: 8px; margin-left: 4px; font-weight: 800; }

        /* PLANES */
        .planes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; margin: 38px 0; }
        .plan-card { position: relative; background: rgba(15,23,42,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px 28px; transition: transform 0.25s, border-color 0.25s; }
        .plan-card.featured { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 20px 50px -20px var(--accent); }
        .plan-card:hover { transform: translateY(-4px); }
        .ribbon { position: absolute; top: 18px; right: 18px; background: var(--accent); color: white; font-size: 0.72rem; font-weight: 900; padding: 4px 12px; border-radius: 99px; letter-spacing: 0.5px; }
        .plan-icon { width: 56px; height: 56px; border-radius: 16px; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 16px; }
        .plan-card h3 { font-size: 1.4rem; font-weight: 900; margin: 0 0 4px; color: white; }
        .plan-tag { color: #64748b; font-size: 0.88rem; margin: 0 0 18px; }
        .plan-price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
        .plan-price .amount { font-size: 2.4rem; font-weight: 900; color: white; letter-spacing: -1px; }
        .plan-price .period { color: #94a3b8; font-weight: 600; }
        .price-note { color: #64748b; font-size: 0.78rem; margin: 0 0 16px; }
        .plan-card .plan-price + .plan-cta { margin-top: 18px; }

        .plan-cta { width: 100%; padding: 14px; border-radius: 14px; border: none; background: var(--accent); color: white; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; margin: 16px 0 22px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .plan-cta:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-2px); }
        .plan-cta:disabled { opacity: 0.75; cursor: default; }
        .plan-cta.current { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.4); }

        .plan-benefits { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-benefits li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: #cbd5e1; line-height: 1.4; }
        .plan-benefits li i { color: #10b981; margin-top: 2px; flex-shrink: 0; }
        .plan-benefits li.off { color: #475569; }
        .plan-benefits li.off i { color: #475569; }

        /* RANKING PROMO */
        .ranking-promo { display: flex; align-items: center; gap: 30px; background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08)); border: 1px solid rgba(139,92,246,0.2); border-radius: 24px; padding: 36px; margin: 20px 0 50px; }
        .rp-text { flex: 1; }
        .rp-text h2 { font-size: 1.5rem; font-weight: 900; color: white; margin: 0 0 10px; display: flex; align-items: center; gap: 10px; }
        .rp-text p { color: #94a3b8; line-height: 1.6; margin: 0 0 18px; }
        .rp-btn { background: linear-gradient(135deg,#3b82f6,#8b5cf6); color: white; border: none; padding: 12px 22px; border-radius: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .rp-btn:hover { transform: translateX(3px); box-shadow: 0 10px 25px rgba(99,102,241,0.4); }
        .rp-podium { display: flex; align-items: flex-end; gap: 8px; height: 120px; }
        .podium-bar { width: 50px; border-radius: 10px 10px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10px; color: white; font-weight: 900; gap: 4px; }
        .podium-bar.first { height: 120px; background: linear-gradient(180deg,#fbbf24,#f59e0b); font-size: 1.2rem; }
        .podium-bar.first i { font-size: 1rem; }
        .podium-bar.second { height: 90px; background: linear-gradient(180deg,#cbd5e1,#94a3b8); }
        .podium-bar.third { height: 65px; background: linear-gradient(180deg,#d97706,#b45309); }

        /* FAQ */
        .faq { margin: 0 auto 40px; max-width: 760px; }
        .faq h2 { text-align: center; color: white; font-size: 1.6rem; font-weight: 900; margin-bottom: 24px; }
        .faq-item { border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; margin-bottom: 12px; overflow: hidden; background: rgba(15,23,42,0.5); }
        .faq-item button { width: 100%; padding: 18px 20px; background: none; border: none; color: #e2e8f0; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; }
        .faq-item button i { color: #64748b; }
        .faq-item p { margin: 0; padding: 0 20px 18px; color: #94a3b8; line-height: 1.6; font-size: 0.9rem; animation: fadeIn 0.2s; }

        .demo-note { text-align: center; color: #475569; font-size: 0.82rem; }
        .demo-note i { margin-right: 6px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 760px) {
          .premium-hero h1 { font-size: 2rem; }
          .planes-grid { grid-template-columns: 1fr; }
          .aud-toggle button { padding: 10px 14px; font-size: 0.85rem; }
          .ranking-promo { flex-direction: column; text-align: center; padding: 28px 22px; }
          .rp-text h2 { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
