'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from '@parkings/supabase-db';
import { api } from '../../src/lib/api';
import { PLANES, precioCiclo, mesesToPayback, NIVELES_CONDUCTOR, BADGES, FAQ, COMISION_PLATAFORMA } from '../../src/lib/planes';

const fmt = (n) => n === 0 ? 'Gratis' : `$${n.toLocaleString('es-CL')}`;

// ── Calculadora de ahorro para conductores ─────────────────────────────────
function Calculadora() {
  const [gasto, setGasto] = useState(30000);
  const ahorro = Math.round(gasto * (COMISION_PLATAFORMA / 100));
  const conviene = ahorro >= 2990;

  return (
    <div className="calc-wrap">
      <h3><i className="fa-solid fa-calculator"></i> ¿Te conviene el plan Pro?</h3>
      <p className="calc-sub">Mueve el slider según cuánto gastas en estacionamientos al mes:</p>
      <div className="calc-slider-row">
        <span>$5.000</span>
        <input type="range" min={5000} max={150000} step={5000} value={gasto} onChange={e => setGasto(+e.target.value)} />
        <span>$150.000</span>
      </div>
      <p className="calc-gasto">Gasto mensual estimado: <strong>{fmt(gasto)}</strong></p>
      <div className={`calc-result ${conviene ? 'yes' : 'no'}`}>
        <div className="calc-numbers">
          <div>
            <span className="calc-label">Tarifa de servicio que pagarías (free)</span>
            <span className="calc-val">{fmt(ahorro)}/mes</span>
          </div>
          <div className="calc-vs"><i className="fa-solid fa-arrow-right"></i></div>
          <div>
            <span className="calc-label">Costo plan Conductor Pro</span>
            <span className="calc-val">$2.990/mes</span>
          </div>
        </div>
        <div className="calc-verdict">
          {conviene
            ? <><i className="fa-solid fa-circle-check"></i> ¡Te conviene! Ahorras <strong>{fmt(ahorro - 2990)}/mes</strong> con Pro</>
            : <><i className="fa-solid fa-circle-info"></i> Con ese uso, el plan Gratis es suficiente — Pro conviene desde ~$37.500/mes</>
          }
        </div>
      </div>
    </div>
  );
}

// ── Sección de gamificación ────────────────────────────────────────────────
function GamificacionSection() {
  return (
    <section className="gami-section">
      <div className="gami-header">
        <span className="section-badge"><i className="fa-solid fa-medal"></i> Sistema de niveles</span>
        <h2>Sube de nivel mientras te mueves</h2>
        <p>Cada reserva completada y reseña publicada te acerca al siguiente nivel. Sin pagar nada.</p>
      </div>
      <div className="gami-grid">
        <div className="niveles-list">
          {[
            { icon: 'fa-seedling', color: '#64748b', label: 'Novato', desc: 'Comienzas aquí', range: '0–4 reservas' },
            { icon: 'fa-car', color: '#3b82f6', label: 'Conductor Regular', desc: 'Ya conoces el sistema', range: '5–19 reservas' },
            { icon: 'fa-bolt', color: '#8b5cf6', label: 'Conductor Frecuente', desc: 'Rutas optimizadas', range: '20–49 reservas' },
            { icon: 'fa-star', color: '#f59e0b', label: 'Conductor Elite', desc: 'Máxima experiencia', range: '50+ reservas' },
          ].map((n, i) => (
            <div key={i} className="nivel-row" style={{ '--nc': n.color }}>
              <div className="nivel-icon"><i className={`fa-solid ${n.icon}`}></i></div>
              <div>
                <strong>{n.label}</strong>
                <span>{n.desc} · <em>{n.range}</em></span>
              </div>
            </div>
          ))}
        </div>
        <div className="badges-grid">
          {BADGES.map(b => (
            <div key={b.id} className="badge-chip">
              <i className={`fa-solid ${b.icon}`}></i>
              <span>{b.label}</span>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Comparativa mercado (insight de investigación) ─────────────────────────
function ComparativaSection() {
  const rows = [
    { app: 'SpotHero',     conductor: 'Gratis siempre', comision: '~12–15%',  premium: '—' },
    { app: 'JustPark',     conductor: 'Gratis siempre', comision: '3–20%',    premium: '—' },
    { app: 'EasyPark',     conductor: 'Gratis / €2.99', comision: 'Variable', premium: '€2.99/mes' },
    { app: 'Parkings Together', conductor: 'Gratis siempre', comision: '5–15%', premium: '$2.990/mes', highlight: true },
  ];
  return (
    <section className="comp-section">
      <span className="section-badge"><i className="fa-solid fa-scale-balanced"></i> Vs. la competencia</span>
      <h2>¿Por qué Parkings Together?</h2>
      <div className="comp-table-wrap">
        <table className="comp-table">
          <thead><tr><th>Plataforma</th><th>Conductor</th><th>Comisión plataforma</th><th>Premium</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.app} className={r.highlight ? 'hl-row' : ''}>
                <td>{r.highlight ? <><i className="fa-solid fa-location-pin" style={{ color: '#3b82f6', marginRight: 6 }}></i><strong>{r.app}</strong></> : r.app}</td>
                <td>{r.conductor}</td>
                <td>{r.comision}</td>
                <td>{r.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="comp-note"><i className="fa-solid fa-circle-info"></i> Datos basados en análisis público de tarifas de SpotHero, JustPark y EasyPark (junio 2026).</p>
    </section>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function PremiumPage() {
  const router = useRouter();
  const [audiencia, setAudiencia] = useState('conductor');
  const [ciclo, setCiclo]         = useState('mensual');
  const [user, setUser]           = useState(null);
  const [planActual, setPlanActual] = useState('free');
  const [procesando, setProcesando] = useState(null);
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
        <span className="hero-badge"><i className="fa-solid fa-crown"></i> Planes y precios</span>
        <h1>Gratis de verdad.<br /><span className="grad">Premium cuando vale la pena.</span></h1>
        <p className="hero-sub">
          Los conductores reservan <strong>siempre gratis</strong> — igual que en SpotHero o JustPark.
          El premium agrega conveniencia y ahorro, nunca te bloquea el acceso básico.
        </p>

        <div className="aud-toggle">
          <button className={audiencia === 'conductor' ? 'active' : ''} onClick={() => setAudiencia('conductor')}>
            <i className="fa-solid fa-car"></i> Soy Conductor
          </button>
          <button className={audiencia === 'arrendador' ? 'active' : ''} onClick={() => setAudiencia('arrendador')}>
            <i className="fa-solid fa-square-parking"></i> Soy Arrendador
          </button>
        </div>

        <div className="ciclo-toggle">
          <span className={ciclo === 'mensual' ? 'on' : ''}>Mensual</span>
          <button className="switch" onClick={() => setCiclo(c => c === 'mensual' ? 'anual' : 'mensual')} aria-label="Cambiar ciclo">
            <span className={`knob ${ciclo === 'anual' ? 'right' : ''}`}></span>
          </button>
          <span className={ciclo === 'anual' ? 'on' : ''}>Anual <em className="save-pill">2 meses gratis</em></span>
        </div>
      </header>

      {/* ═══ PLANES ═══ */}
      <section className={`planes-grid cols-${planes.length}`}>
        {planes.map(plan => {
          const precio = precioCiclo(plan.precioMensual, ciclo);
          const esActual = plan.id === planActual;
          return (
            <article key={plan.id} className={`plan-card ${plan.destacado ? 'featured' : ''}`} style={{ '--accent': plan.color }}>
              {plan.tag && <div className="ribbon">{plan.tag}</div>}
              <div className="plan-icon"><i className={`fa-solid ${plan.icon}`}></i></div>
              <h3>{plan.nombre}</h3>
              <p className="plan-tag">{plan.tagline}</p>

              <div className="plan-price">
                <span className="amount">{fmt(precio)}</span>
                {precio > 0 && <span className="period">/{ciclo === 'anual' ? 'año' : 'mes'}</span>}
              </div>
              {precio > 0 && ciclo === 'anual' && (
                <p className="price-note">≈ {fmt(Math.round(precio / 12))}/mes facturado anual</p>
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
                      : <><i className="fa-solid fa-bolt"></i> {precio === 0 ? 'Empezar gratis' : 'Suscribirme'}</>}
              </button>

              <ul className="plan-benefits">
                {plan.beneficios.map((b, i) => (
                  <li key={i} className={`${b.ok ? '' : 'off'} ${b.bold ? 'bold' : ''}`}>
                    <i className={`fa-solid ${b.ok ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                    <span>
                      {b.txt}
                      {b.note && <em className="benefit-note">{b.note}</em>}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      {/* ═══ CALCULADORA (solo conductores) ═══ */}
      {audiencia === 'conductor' && <Calculadora />}

      {/* ═══ GAMIFICACIÓN ═══ */}
      <GamificacionSection />

      {/* ═══ COMPARATIVA ═══ */}
      <ComparativaSection />

      {/* ═══ CTA RANKING ═══ */}
      <section className="ranking-promo">
        <div className="rp-text">
          <h2><i className="fa-solid fa-trophy" style={{ color: '#f59e0b' }}></i> Ranking de tu zona</h2>
          <p>Descubre los estacionamientos mejor evaluados cerca de ti. Disponible para todos los usuarios — sin suscripción.</p>
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
        .premium-wrap { max-width: 1100px; margin: 0 auto; padding: 30px 20px 80px; color: #e2e8f0; }

        /* HERO */
        .premium-hero { text-align: center; padding: 30px 0 20px; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); padding: 6px 16px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 18px; }
        .premium-hero h1 { font-size: 2.5rem; font-weight: 900; margin: 0 0 12px; letter-spacing: -1.5px; color: white; line-height: 1.15; }
        .grad { background: linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-sub { color: #94a3b8; font-size: 1rem; max-width: 600px; margin: 0 auto 28px; line-height: 1.7; }
        .hero-sub strong { color: #93c5fd; }

        .aud-toggle { display: inline-flex; gap: 6px; background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 5px; margin-bottom: 22px; }
        .aud-toggle button { padding: 10px 20px; border: none; background: transparent; color: #94a3b8; font-weight: 700; border-radius: 10px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
        .aud-toggle button.active { background: linear-gradient(135deg,#3b82f6,#2563eb); color: white; box-shadow: 0 4px 14px rgba(37,99,235,0.4); }
        .ciclo-toggle { display: flex; align-items: center; justify-content: center; gap: 14px; font-size: 0.9rem; color: #64748b; font-weight: 600; }
        .ciclo-toggle .on { color: white; }
        .switch { width: 52px; height: 28px; border-radius: 99px; background: #1e293b; border: 1px solid rgba(255,255,255,0.1); position: relative; cursor: pointer; padding: 0; flex-shrink: 0; }
        .knob { position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; border-radius: 50%; background: #3b82f6; transition: left 0.25s; }
        .knob.right { left: 26px; background: #8b5cf6; }
        .save-pill { font-style: normal; background: rgba(16,185,129,0.15); color: #34d399; font-size: 0.7rem; padding: 2px 8px; border-radius: 8px; margin-left: 4px; font-weight: 800; }

        /* PLANES */
        .planes-grid { display: grid; gap: 22px; margin: 38px 0; }
        .planes-grid.cols-2 { grid-template-columns: repeat(2,1fr); max-width: 800px; margin-left: auto; margin-right: auto; }
        .planes-grid.cols-3 { grid-template-columns: repeat(3,1fr); }
        .plan-card { position: relative; background: rgba(15,23,42,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 30px 26px; transition: transform 0.25s, border-color 0.25s; }
        .plan-card.featured { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), 0 20px 50px -20px var(--accent); }
        .plan-card:hover { transform: translateY(-4px); }
        .ribbon { position: absolute; top: 18px; right: 18px; background: var(--accent); color: white; font-size: 0.7rem; font-weight: 900; padding: 4px 12px; border-radius: 99px; letter-spacing: 0.5px; }
        .plan-icon { width: 52px; height: 52px; border-radius: 14px; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 14px; }
        .plan-card h3 { font-size: 1.3rem; font-weight: 900; margin: 0 0 4px; color: white; }
        .plan-tag { color: #64748b; font-size: 0.85rem; margin: 0 0 16px; }
        .plan-price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
        .plan-price .amount { font-size: 2.2rem; font-weight: 900; color: white; letter-spacing: -1px; }
        .plan-price .period { color: #94a3b8; font-weight: 600; }
        .price-note { color: #64748b; font-size: 0.75rem; margin: 0 0 12px; }

        .plan-cta { width: 100%; padding: 13px; border-radius: 13px; border: none; background: var(--accent); color: white; font-weight: 800; font-size: 0.92rem; cursor: pointer; transition: all 0.2s; margin: 14px 0 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .plan-cta:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-2px); }
        .plan-cta:disabled { opacity: 0.75; cursor: default; transform: none; }
        .plan-cta.current { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.4); }

        .plan-benefits { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 11px; }
        .plan-benefits li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem; color: #94a3b8; line-height: 1.5; }
        .plan-benefits li i { color: #10b981; margin-top: 2px; flex-shrink: 0; }
        .plan-benefits li.off { color: #475569; }
        .plan-benefits li.off i { color: #334155; }
        .plan-benefits li.bold { color: #e2e8f0; font-weight: 600; }
        .benefit-note { display: block; font-size: 0.75rem; color: #64748b; font-style: normal; margin-top: 2px; }

        /* CALCULADORA */
        .calc-wrap { background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.06)); border: 1px solid rgba(59,130,246,0.2); border-radius: 20px; padding: 28px 30px; margin: 10px auto 40px; max-width: 760px; }
        .calc-wrap h3 { color: white; font-size: 1.1rem; font-weight: 800; margin: 0 0 6px; display: flex; align-items: center; gap: 10px; }
        .calc-sub { color: #94a3b8; font-size: 0.88rem; margin: 0 0 18px; }
        .calc-slider-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; color: #64748b; font-size: 0.8rem; }
        .calc-slider-row input[type=range] { flex: 1; accent-color: #3b82f6; height: 4px; }
        .calc-gasto { text-align: center; color: #94a3b8; font-size: 0.88rem; margin: 0 0 16px; }
        .calc-gasto strong { color: white; font-size: 1.1rem; }
        .calc-result { border-radius: 14px; padding: 18px 20px; border: 1px solid; }
        .calc-result.yes { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); }
        .calc-result.no { background: rgba(100,116,139,0.1); border-color: rgba(100,116,139,0.2); }
        .calc-numbers { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .calc-numbers > div { flex: 1; min-width: 120px; }
        .calc-vs { color: #64748b; flex-shrink: 0; font-size: 1.1rem; }
        .calc-label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 4px; }
        .calc-val { font-size: 1.3rem; font-weight: 900; color: white; }
        .calc-verdict { font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .calc-result.yes .calc-verdict { color: #34d399; }
        .calc-result.no .calc-verdict { color: #94a3b8; }

        /* GAMIFICACIÓN */
        .gami-section { margin: 0 0 50px; }
        .gami-header { text-align: center; margin-bottom: 30px; }
        .section-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.25); padding: 5px 14px; border-radius: 99px; font-size: 0.78rem; font-weight: 800; margin-bottom: 14px; }
        .gami-section h2, .comp-section h2 { text-align: center; color: white; font-size: 1.6rem; font-weight: 900; margin: 0 0 8px; }
        .gami-header p { color: #94a3b8; max-width: 520px; margin: 0 auto; line-height: 1.6; font-size: 0.92rem; }
        .gami-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .niveles-list { background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
        .nivel-row { display: flex; align-items: center; gap: 14px; }
        .nivel-icon { width: 40px; height: 40px; border-radius: 12px; background: color-mix(in srgb, var(--nc,#64748b) 18%, transparent); color: var(--nc,#64748b); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .nivel-row strong { display: block; color: white; font-size: 0.9rem; }
        .nivel-row span { color: #64748b; font-size: 0.8rem; }
        .nivel-row em { color: #475569; font-style: normal; }
        .badges-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; }
        .badge-chip { background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px; text-align: center; }
        .badge-chip i { font-size: 1.3rem; color: #fbbf24; margin-bottom: 6px; display: block; }
        .badge-chip span { display: block; color: white; font-size: 0.82rem; font-weight: 700; margin-bottom: 4px; }
        .badge-chip p { margin: 0; color: #64748b; font-size: 0.72rem; line-height: 1.4; }

        /* COMPARATIVA */
        .comp-section { margin: 0 0 50px; }
        .comp-section .section-badge { display: block; text-align: center; margin: 0 auto 14px; width: fit-content; }
        .comp-table-wrap { overflow-x: auto; margin-top: 20px; }
        .comp-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
        .comp-table th { text-align: left; padding: 10px 16px; color: #64748b; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 0.78rem; letter-spacing: 0.5px; }
        .comp-table td { padding: 12px 16px; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .comp-table tr.hl-row td { background: rgba(59,130,246,0.07); color: white; }
        .comp-note { color: #475569; font-size: 0.78rem; margin-top: 12px; display: flex; align-items: center; gap: 6px; }

        /* RANKING PROMO */
        .ranking-promo { display: flex; align-items: center; gap: 30px; background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.08)); border: 1px solid rgba(139,92,246,0.2); border-radius: 24px; padding: 36px; margin: 20px 0 50px; }
        .rp-text { flex: 1; }
        .rp-text h2 { font-size: 1.4rem; font-weight: 900; color: white; margin: 0 0 10px; display: flex; align-items: center; gap: 10px; text-align: left; }
        .rp-text p { color: #94a3b8; line-height: 1.6; margin: 0 0 18px; font-size: 0.92rem; }
        .rp-btn { background: linear-gradient(135deg,#3b82f6,#8b5cf6); color: white; border: none; padding: 12px 22px; border-radius: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s; font-size: 0.9rem; }
        .rp-btn:hover { transform: translateX(3px); box-shadow: 0 10px 25px rgba(99,102,241,0.4); }
        .rp-podium { display: flex; align-items: flex-end; gap: 8px; height: 110px; flex-shrink: 0; }
        .podium-bar { width: 46px; border-radius: 10px 10px 0 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 8px; color: white; font-weight: 900; gap: 4px; font-size: 0.85rem; }
        .podium-bar.first { height: 110px; background: linear-gradient(180deg,#fbbf24,#f59e0b); }
        .podium-bar.first i { font-size: 0.85rem; }
        .podium-bar.second { height: 80px; background: linear-gradient(180deg,#cbd5e1,#94a3b8); }
        .podium-bar.third { height: 58px; background: linear-gradient(180deg,#d97706,#b45309); }

        /* FAQ */
        .faq { margin: 0 auto 40px; max-width: 760px; }
        .faq h2 { text-align: center; color: white; font-size: 1.5rem; font-weight: 900; margin-bottom: 22px; }
        .faq-item { border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; margin-bottom: 10px; overflow: hidden; background: rgba(15,23,42,0.5); }
        .faq-item button { width: 100%; padding: 16px 18px; background: none; border: none; color: #e2e8f0; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; }
        .faq-item button i { color: #64748b; flex-shrink: 0; }
        .faq-item p { margin: 0; padding: 0 18px 16px; color: #94a3b8; line-height: 1.6; font-size: 0.88rem; animation: fadeIn 0.2s; }
        .demo-note { text-align: center; color: #475569; font-size: 0.8rem; }
        .demo-note i { margin-right: 6px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 900px) {
          .planes-grid.cols-3 { grid-template-columns: 1fr; }
          .gami-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .premium-hero h1 { font-size: 1.9rem; }
          .planes-grid.cols-2 { grid-template-columns: 1fr; }
          .aud-toggle button { padding: 9px 14px; font-size: 0.82rem; }
          .ranking-promo { flex-direction: column; padding: 24px 18px; }
          .rp-text h2 { justify-content: center; }
          .badges-grid { grid-template-columns: repeat(3,1fr); }
          .calc-numbers { flex-direction: column; align-items: flex-start; }
          .calc-vs { transform: rotate(90deg); align-self: center; }
        }
      `}</style>
    </div>
  );
}
