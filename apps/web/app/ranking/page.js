'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../src/lib/api';
import { REGIONES, detectarRegion } from '../../src/lib/comunas-chile';

const VEHICULOS = [
  { value: '',           label: 'Todos',   icon: 'fa-layer-group' },
  { value: 'car',        label: 'Auto',    icon: 'fa-car' },
  { value: 'motorcycle', label: 'Moto',    icon: 'fa-motorcycle' },
  { value: 'bicycle',    label: 'Bici',    icon: 'fa-bicycle' },
  { value: 'scooter',    label: 'Scooter', icon: 'fa-person-biking' },
];

const MEDALLAS = ['#fbbf24', '#cbd5e1', '#d97706']; // oro, plata, bronce

function Estrellas({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="stars">
      {[0, 1, 2, 3, 4].map(i => (
        <i key={i} className={`fa-${i < full ? 'solid' : (i === full && half ? 'solid fa-star-half-stroke' : 'regular')} ${i < full ? 'fa-star' : (i === full && half ? '' : 'fa-star')}`}></i>
      ))}
      <span className="rating-num">{Number(rating).toFixed(1)}</span>
    </span>
  );
}

export default function RankingPage() {
  const router = useRouter();
  const [todos, setTodos]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [regionId, setRegionId] = useState('');
  const [comuna, setComuna]     = useState('');
  const [vehiculo, setVehiculo] = useState('');
  const [soloDisp, setSoloDisp] = useState(false);
  const [precioMax, setPrecioMax] = useState('');
  const [zonaAuto, setZonaAuto] = useState(null);

  // Carga inicial de todos los estacionamientos + auto-detección de zona por GPS.
  useEffect(() => {
    api.mapas.buscar({}).then(res => {
      if (res.success) setTodos(res.data || []);
      setLoading(false);
    });

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const reg = detectarRegion(pos.coords.latitude, pos.coords.longitude);
          if (reg) { setRegionId(reg.id); setZonaAuto(reg.nombre); }
        },
        () => { /* sin permiso: el usuario filtra manualmente */ },
        { timeout: 5000 }
      );
    }
  }, []);

  const comunasDisponibles = useMemo(() => {
    const reg = REGIONES.find(r => r.id === regionId);
    return reg ? [...new Set(reg.comunas)].sort((a, b) => a.localeCompare(b)) : [];
  }, [regionId]);

  // Ranking filtrado + ordenado por rating (desempate por nº de reseñas).
  const ranking = useMemo(() => {
    const reg = REGIONES.find(r => r.id === regionId);
    const comunasReg = reg ? new Set(reg.comunas) : null;

    return (todos || [])
      .filter(p => {
        if (comuna && p.comuna !== comuna) return false;
        if (!comuna && comunasReg && !comunasReg.has(p.comuna)) return false;
        if (vehiculo && !(p.allowed_vehicle_types || []).includes(vehiculo)) return false;
        if (soloDisp && !((p.total_spots - p.occupied_spots) > 0)) return false;
        if (precioMax && Number(p.precio_hora) > Number(precioMax)) return false;
        return true;
      })
      .sort((a, b) =>
        (b.rating - a.rating) ||
        (b.reviews_count - a.reviews_count) ||
        a.nombre.localeCompare(b.nombre)
      );
  }, [todos, regionId, comuna, vehiculo, soloDisp, precioMax]);

  const podio = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  const limpiar = () => { setRegionId(''); setComuna(''); setVehiculo(''); setSoloDisp(false); setPrecioMax(''); };

  const irAlMapa = () => router.push('/mapa');

  return (
    <div className="rank-wrap">
      {/* HERO */}
      <header className="rank-hero">
        <span className="rank-badge"><i className="fa-solid fa-trophy"></i> Ranking</span>
        <h1>Mejores estacionamientos <span className="grad">de tu zona</span></h1>
        <p>
          {zonaAuto
            ? <>Detectamos que estás en <strong>{zonaAuto}</strong>. Estos son los mejor evaluados cerca de ti.</>
            : 'Los estacionamientos mejor evaluados, según las reseñas de la comunidad.'}
        </p>
      </header>

      {/* FILTROS */}
      <section className="rank-filters">
        <div className="filter-row">
          <div className="f-group">
            <label>Región</label>
            <select value={regionId} onChange={e => { setRegionId(e.target.value); setComuna(''); }}>
              <option value="">Todo Chile</option>
              {REGIONES.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="f-group">
            <label>Comuna</label>
            <select value={comuna} onChange={e => setComuna(e.target.value)} disabled={!regionId}>
              <option value="">Todas</option>
              {comunasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="f-group">
            <label>Precio máx. ($/h)</label>
            <input type="number" min="0" step="100" placeholder="Sin límite" value={precioMax} onChange={e => setPrecioMax(e.target.value)} />
          </div>
        </div>

        <div className="filter-row bottom">
          <div className="veh-chips">
            {VEHICULOS.map(v => (
              <button key={v.value} className={`veh-chip ${vehiculo === v.value ? 'active' : ''}`} onClick={() => setVehiculo(v.value)}>
                <i className={`fa-solid ${v.icon}`}></i> {v.label}
              </button>
            ))}
          </div>
          <label className="disp-check">
            <input type="checkbox" checked={soloDisp} onChange={e => setSoloDisp(e.target.checked)} />
            <span>Solo con cupos</span>
          </label>
          <button className="clear-btn" onClick={limpiar}><i className="fa-solid fa-rotate-left"></i> Limpiar</button>
        </div>
      </section>

      {/* RESULTADOS */}
      {loading ? (
        <div className="rank-empty"><i className="fa-solid fa-spinner fa-spin"></i> Cargando ranking...</div>
      ) : ranking.length === 0 ? (
        <div className="rank-empty">
          <i className="fa-solid fa-magnifying-glass"></i>
          <p>No hay estacionamientos que coincidan con tu filtro.</p>
          <button className="clear-btn" onClick={limpiar}>Quitar filtros</button>
        </div>
      ) : (
        <>
          {/* PODIO */}
          {podio.length > 0 && (
            <section className="podio">
              {podio.map((p, i) => (
                <article key={p.id} className={`podio-card pos-${i}`} onClick={irAlMapa} style={{ '--medal': MEDALLAS[i] }}>
                  <div className="medal"><i className="fa-solid fa-medal"></i><span>{i + 1}</span></div>
                  {p.photos?.[0]
                    ? <img src={p.photos[0]} alt={p.nombre} className="podio-img" />
                    : <div className="podio-img placeholder"><i className="fa-solid fa-square-parking"></i></div>}
                  <h3>{p.nombre}</h3>
                  <p className="podio-comuna"><i className="fa-solid fa-location-dot"></i> {p.comuna}</p>
                  <Estrellas rating={p.rating} />
                  <span className="reviews">{p.reviews_count} reseñas</span>
                  <span className="podio-precio">${Number(p.precio_hora).toLocaleString('es-CL')}/h</span>
                </article>
              ))}
            </section>
          )}

          {/* LISTA */}
          {resto.length > 0 && (
            <section className="rank-list">
              {resto.map((p, i) => (
                <article key={p.id} className="rank-row" onClick={irAlMapa}>
                  <span className="rank-pos">{i + 4}</span>
                  {p.photos?.[0]
                    ? <img src={p.photos[0]} alt={p.nombre} className="row-img" />
                    : <div className="row-img placeholder"><i className="fa-solid fa-square-parking"></i></div>}
                  <div className="row-info">
                    <h4>{p.nombre}</h4>
                    <p><i className="fa-solid fa-location-dot"></i> {p.comuna} · ${Number(p.precio_hora).toLocaleString('es-CL')}/h</p>
                  </div>
                  <div className="row-rating">
                    <Estrellas rating={p.rating} />
                    <span className="reviews">{p.reviews_count} reseñas</span>
                  </div>
                  <i className="fa-solid fa-chevron-right row-arrow"></i>
                </article>
              ))}
            </section>
          )}
        </>
      )}

      <style jsx>{`
        .rank-wrap { max-width: 980px; margin: 0 auto; padding: 30px 20px 80px; color: #e2e8f0; }

        .rank-hero { text-align: center; padding: 20px 0 30px; }
        .rank-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); padding: 6px 16px; border-radius: 99px; font-size: 0.8rem; font-weight: 800; margin-bottom: 16px; }
        .rank-hero h1 { font-size: 2.3rem; font-weight: 900; margin: 0 0 12px; letter-spacing: -1px; color: white; }
        .grad { background: linear-gradient(135deg,#3b82f6,#8b5cf6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .rank-hero p { color: #94a3b8; max-width: 560px; margin: 0 auto; line-height: 1.6; }
        .rank-hero strong { color: #93c5fd; }

        /* FILTROS */
        .rank-filters { background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 20px; margin-bottom: 30px; }
        .filter-row { display: flex; gap: 14px; flex-wrap: wrap; }
        .filter-row.bottom { margin-top: 16px; align-items: center; }
        .f-group { flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 6px; }
        .f-group label { font-size: 0.75rem; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
        .f-group select, .f-group input { padding: 11px 14px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; outline: none; font-size: 0.9rem; }
        .f-group select:focus, .f-group input:focus { border-color: #3b82f6; }
        .f-group select:disabled { opacity: 0.5; }

        .veh-chips { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; }
        .veh-chip { padding: 8px 14px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; color: #94a3b8; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .veh-chip.active { background: rgba(59,130,246,0.15); border-color: #3b82f6; color: #93c5fd; }
        .disp-check { display: flex; align-items: center; gap: 8px; color: #cbd5e1; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .disp-check input { width: 16px; height: 16px; accent-color: #3b82f6; }
        .clear-btn { padding: 9px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #94a3b8; font-weight: 700; cursor: pointer; font-size: 0.82rem; transition: all 0.2s; white-space: nowrap; }
        .clear-btn:hover { background: rgba(255,255,255,0.1); color: white; }

        /* PODIO */
        .podio { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-bottom: 28px; }
        .podio-card { position: relative; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 20px 18px; text-align: center; cursor: pointer; transition: transform 0.25s, border-color 0.25s; border-top: 3px solid var(--medal); }
        .podio-card:hover { transform: translateY(-5px); border-color: var(--medal); }
        .podio-card.pos-0 { transform: scale(1.04); }
        .podio-card.pos-0:hover { transform: scale(1.04) translateY(-5px); }
        .medal { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); width: 34px; height: 34px; border-radius: 50%; background: var(--medal); color: #1e293b; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
        .medal i { display: none; }
        .podio-img { width: 100%; height: 110px; object-fit: cover; border-radius: 14px; margin: 10px 0 14px; }
        .podio-img.placeholder { display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); color: #334155; font-size: 2rem; }
        .podio-card h3 { font-size: 1rem; font-weight: 800; color: white; margin: 0 0 6px; line-height: 1.3; }
        .podio-comuna { font-size: 0.8rem; color: #64748b; margin: 0 0 10px; }
        .podio-precio { display: block; margin-top: 8px; color: #34d399; font-weight: 800; font-size: 0.9rem; }

        /* ESTRELLAS */
        .stars { color: #fbbf24; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 2px; }
        .stars .fa-regular { color: #475569; }
        .rating-num { color: white; font-weight: 800; margin-left: 6px; font-size: 0.85rem; }
        .reviews { display: block; color: #64748b; font-size: 0.72rem; margin-top: 4px; }

        /* LISTA */
        .rank-list { display: flex; flex-direction: column; gap: 10px; }
        .rank-row { display: flex; align-items: center; gap: 16px; background: rgba(15,23,42,0.5); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; }
        .rank-row:hover { background: rgba(15,23,42,0.8); border-color: rgba(59,130,246,0.3); }
        .rank-pos { font-weight: 900; color: #475569; font-size: 1rem; width: 24px; text-align: center; flex-shrink: 0; }
        .row-img { width: 60px; height: 48px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
        .row-img.placeholder { display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); color: #334155; }
        .row-info { flex: 1; min-width: 0; }
        .row-info h4 { margin: 0 0 4px; color: white; font-size: 0.95rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .row-info p { margin: 0; color: #64748b; font-size: 0.8rem; }
        .row-rating { text-align: right; flex-shrink: 0; }
        .row-arrow { color: #475569; flex-shrink: 0; }

        .rank-empty { text-align: center; padding: 60px 20px; color: #64748b; }
        .rank-empty i { font-size: 2rem; margin-bottom: 14px; display: block; }
        .rank-empty p { margin: 0 0 16px; }

        @media (max-width: 760px) {
          .rank-hero h1 { font-size: 1.7rem; }
          .podio { grid-template-columns: 1fr; }
          .podio-card.pos-0 { transform: none; }
          .podio-card.pos-0:hover { transform: translateY(-5px); }
          .row-rating .stars { font-size: 0.75rem; }
          .row-arrow { display: none; }
        }
      `}</style>
    </div>
  );
}
