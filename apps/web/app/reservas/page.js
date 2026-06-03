'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@parkings/supabase-db';

const ESTADOS = {
  pendiente:  { label: 'Pendiente',  color: '#f59e0b' },
  confirmada: { label: 'Confirmada', color: '#3b82f6' },
  completada: { label: 'Completada', color: '#10b981' },
  cancelada:  { label: 'Cancelada',  color: '#ef4444' },
};

function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ReservasPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('conductor');
  const [reservas, setReservas] = useState([]);
  const [reservasArr, setReservasArr] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [ratingModal, setRatingModal] = useState(null); // { reservaId }
  const [stars, setStars] = useState(5);
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.push('/auth'); return; }
      setSession(s);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) router.push('/auth');
      else setSession(s);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const fetchReservas = useCallback(async (token) => {
    setLoading(true);
    try {
      const [resCond, resArr] = await Promise.all([
        fetch('/api/reservas/manage?scope=conductor', {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
        fetch('/api/reservas/manage?scope=arrendador', {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
      ]);
      setReservas(resCond.success ? (resCond.data || []) : []);
      setReservasArr(resArr.success ? (resArr.data || []) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchReservas(session.access_token);

    // Realtime updates for reservas
    const channel = supabase
      .channel('reservas-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
        fetchReservas(session.access_token);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [session, fetchReservas]);

  const doAction = async (action, reservaId, extra = {}) => {
    setActionLoading(reservaId + action);
    try {
      const res = await fetch('/api/reservas/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action, reserva_id: reservaId, ...extra }),
      });
      const data = await res.json();
      if (data.success) await fetchReservas(session.access_token);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCalificar = async () => {
    if (!ratingModal) return;
    await doAction('calificar', ratingModal.reservaId, { calificacion: stars, comentario });
    setRatingModal(null);
    setStars(5);
    setComentario('');
  };

  const activeData = tab === 'conductor' ? reservas : reservasArr;

  return (
    <section style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: '#f8fafc', fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
          <i className="fa-solid fa-calendar-check" style={{ color: '#3b82f6', marginRight: '12px' }}></i>
          Mis Reservas
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Gestiona y consulta todas tus reservas activas e historial.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'conductor', label: 'Como Conductor', icon: 'fa-steering-wheel', count: reservas.filter(r => r.estado === 'pendiente' || r.estado === 'confirmada').length },
          { key: 'arrendador', label: 'Como Arrendador', icon: 'fa-warehouse', count: reservasArr.filter(r => r.estado === 'pendiente').length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: tab === t.key ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
              background: tab === t.key ? 'rgba(59,130,246,0.15)' : 'rgba(30,41,59,0.4)',
              color: tab === t.key ? '#60a5fa' : '#94a3b8',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
            }}
          >
            <i className={`fa-solid ${t.icon}`}></i>
            {t.label}
            {t.count > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', fontSize: '0.7rem', padding: '2px 7px', fontWeight: 900 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#3b82f6' }}></i>
        </div>
      ) : activeData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', background: 'rgba(30,41,59,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}></i>
          <p style={{ fontWeight: 700 }}>No hay reservas {tab === 'conductor' ? 'como conductor' : 'recibidas'}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeData.map(r => {
            const est = r.estacionamiento || {};
            const estadoInfo = ESTADOS[r.estado] || { label: r.estado, color: '#94a3b8' };
            const isLoading = actionLoading?.startsWith(r.id);
            return (
              <div key={r.id} style={{ background: 'rgba(30,41,59,0.6)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <strong style={{ color: '#f8fafc', fontSize: '1rem' }}>{est.nombre || 'Estacionamiento'}</strong>
                    <span style={{ background: `${estadoInfo.color}22`, color: estadoInfo.color, borderRadius: '8px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 800 }}>
                      {estadoInfo.label}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {est.comuna && <span><i className="fa-solid fa-location-dot" style={{ width: '14px', color: '#64748b' }}></i> {est.comuna}</span>}
                    <span><i className="fa-solid fa-clock" style={{ width: '14px', color: '#64748b' }}></i> {fmtFecha(r.fecha_inicio)} → {fmtFecha(r.fecha_fin)}</span>
                    {r.precio_total != null && (
                      <span><i className="fa-solid fa-dollar-sign" style={{ width: '14px', color: '#64748b' }}></i> ${Number(r.precio_total).toLocaleString('es-CL')}</span>
                    )}
                    {r.calificacion && (
                      <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.calificacion)}{'☆'.repeat(5 - r.calificacion)}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {tab === 'arrendador' && r.estado === 'pendiente' && (
                    <button
                      onClick={() => doAction('confirmar', r.id)}
                      disabled={isLoading}
                      style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                      aria-label="Confirmar reserva"
                    >
                      <i className="fa-solid fa-check"></i> Confirmar
                    </button>
                  )}
                  {tab === 'arrendador' && r.estado === 'confirmada' && (
                    <button
                      onClick={() => doAction('completar', r.id)}
                      disabled={isLoading}
                      style={{ padding: '8px 14px', background: 'rgba(59,130,246,0.15)', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                      aria-label="Marcar como completada"
                    >
                      <i className="fa-solid fa-flag-checkered"></i> Completar
                    </button>
                  )}
                  {(r.estado === 'pendiente' || r.estado === 'confirmada') && (
                    <button
                      onClick={() => doAction('cancelar', r.id)}
                      disabled={isLoading}
                      style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                      aria-label="Cancelar reserva"
                    >
                      {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-ban"></i>} Cancelar
                    </button>
                  )}
                  {tab === 'conductor' && r.estado === 'completada' && !r.calificacion && (
                    <button
                      onClick={() => setRatingModal({ reservaId: r.id })}
                      style={{ padding: '8px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                      aria-label="Calificar reserva"
                    >
                      <i className="fa-solid fa-star"></i> Calificar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating modal */}
      {ratingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setRatingModal(null)}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', width: '360px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#f8fafc', fontWeight: 800, marginBottom: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-star" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
              Califica esta reserva
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setStars(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2rem', color: n <= stars ? '#f59e0b' : '#334155' }} aria-label={`${n} estrella${n > 1 ? 's' : ''}`}>★</button>
              ))}
            </div>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Comentario opcional..."
              maxLength={500}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', padding: '10px 14px', fontSize: '0.9rem', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setRatingModal(null)} style={{ flex: 1, padding: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
              <button onClick={handleCalificar} style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 800 }}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
