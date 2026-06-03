'use client';
import { useState, useMemo } from 'react';

const DURATION_OPTIONS = [
  { label: '30 min', hours: 0.5 },
  { label: '1 hora', hours: 1 },
  { label: '2 horas', hours: 2 },
  { label: '4 horas', hours: 4 },
  { label: 'Día completo', hours: 8 },
];

function generateSpots(parking) {
  const total = Math.max(parking.total_spots || 8, 1);
  const occupied = Math.min(parking.occupied_spots || 0, total);
  const pmr = parking.es_pmr;

  // Seeded shuffle so occupied positions stay stable per parking
  const seed = parking.id || 1;
  const rng = (n) => ((seed * 1103515245 + n * 12345) & 0x7fffffff) % total;

  const occupiedSet = new Set();
  let attempts = 0;
  while (occupiedSet.size < occupied && attempts < total * 3) {
    const idx = rng(attempts++);
    // Don't mark PMR spots as randomly occupied
    if (!pmr || idx < total - 2) occupiedSet.add(idx);
  }

  return Array.from({ length: total }, (_, i) => {
    const isPmr = pmr && i >= total - 2;
    return {
      id: i,
      label: `${String.fromCharCode(65 + Math.floor(i / 6))}${(i % 6) + 1}`,
      available: !occupiedSet.has(i),
      pmr: isPmr,
    };
  });
}

const STEP = { SELECT: 1, CONFIRM: 2, PROCESSING: 3, SUCCESS: 4 };

export default function ParkingSelector({ parking, onClose, onReserve, isReserving }) {
  const [step, setStep] = useState(STEP.SELECT);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [duration, setDuration] = useState(DURATION_OPTIONS[1]);

  const spots = useMemo(() => generateSpots(parking), [parking]);
  const totalPrice = Math.round(parking.precio_hora * duration.hours);
  const rows = useMemo(() => {
    const r = {};
    spots.forEach(s => {
      const row = s.label[0];
      if (!r[row]) r[row] = [];
      r[row].push(s);
    });
    return r;
  }, [spots]);

  const handleConfirm = async () => {
    setStep(STEP.PROCESSING);
    await onReserve();
    setStep(STEP.SUCCESS);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'linear-gradient(145deg, #0f172a, #1e293b)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '24px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(59,130,246,0.15)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <i className="fa-solid fa-square-parking" style={{ color: '#3b82f6', fontSize: '1.1rem' }}></i>
              <h2 style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{parking.nombre}</h2>
            </div>
            <div style={{ display: 'flex', gap: '12px', color: '#94a3b8', fontSize: '0.82rem' }}>
              {parking.comuna && <span><i className="fa-solid fa-location-dot" style={{ marginRight: '4px', color: '#64748b' }}></i>{parking.comuna}</span>}
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>${parking.precio_hora?.toLocaleString()}/hr</span>
              {parking.es_pmr && <span style={{ color: '#38bdf8' }}><i className="fa-solid fa-wheelchair" style={{ marginRight: '4px' }}></i>PMR</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', padding: '8px 10px', fontSize: '1rem' }} aria-label="Cerrar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['Elige plaza', 'Confirma', 'Listo'].map((label, i) => {
            const n = i + 1;
            const done = (step === STEP.SELECT && n < 1) || (step === STEP.CONFIRM && n < 2) || (step >= STEP.PROCESSING && n < 3);
            const active = (step === STEP.SELECT && n === 1) || (step === STEP.CONFIRM && n === 2) || (step >= STEP.PROCESSING && n === 3);
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: n < 3 ? 1 : undefined }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, background: active || done ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: active || done ? 'white' : '#64748b', border: active ? '2px solid #60a5fa' : '1px solid transparent', flexShrink: 0 }}>
                  {done ? <i className="fa-solid fa-check" style={{ fontSize: '0.65rem' }}></i> : n}
                </div>
                <span style={{ fontSize: '0.78rem', color: active ? '#e2e8f0' : '#475569', fontWeight: active ? 700 : 400 }}>{label}</span>
                {n < 3 && <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)', marginLeft: '6px' }}></div>}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

          {/* STEP 1: Seat selector */}
          {step === STEP.SELECT && (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.75rem' }}>
                {[['#10b981', 'Disponible'], ['#ef4444', 'Ocupado'], ['#3b82f6', 'PMR'], ['#f59e0b', 'Seleccionado']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: c }}></div>
                    {l}
                  </div>
                ))}
              </div>

              {/* Entry direction */}
              <div style={{ textAlign: 'center', marginBottom: '10px', color: '#475569', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }}></div>
                <i className="fa-solid fa-arrow-up"></i> ENTRADA
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }}></div>
              </div>

              {/* Grid */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                {Object.entries(rows).map(([rowLabel, rowSpots]) => (
                  <div key={rowLabel} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                    <span style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 700, width: '14px', textAlign: 'center', flexShrink: 0 }}>{rowLabel}</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {rowSpots.map(spot => {
                        const isSelected = selectedSpot?.id === spot.id;
                        let bg = '#ef4444';
                        let cursor = 'not-allowed';
                        let opacity = 0.5;
                        if (spot.available && spot.pmr) { bg = '#3b82f6'; cursor = 'pointer'; opacity = 1; }
                        else if (spot.available) { bg = '#10b981'; cursor = 'pointer'; opacity = 1; }
                        if (isSelected) bg = '#f59e0b';
                        return (
                          <button
                            key={spot.id}
                            disabled={!spot.available}
                            onClick={() => spot.available && setSelectedSpot(spot)}
                            aria-label={`Plaza ${spot.label}${!spot.available ? ' - Ocupada' : spot.pmr ? ' - PMR' : ''}`}
                            style={{ width: '44px', height: '36px', borderRadius: '8px', background: `${bg}${isSelected ? '' : '33'}`, border: `2px solid ${bg}`, color: isSelected ? '#000' : bg, fontSize: '0.68rem', fontWeight: 800, cursor, opacity, transition: 'all 0.15s', transform: isSelected ? 'scale(1.1)' : 'scale(1)', boxShadow: isSelected ? `0 0 12px ${bg}88` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px' }}
                          >
                            {spot.pmr ? <i className="fa-solid fa-wheelchair" style={{ fontSize: '0.7rem' }}></i> : <i className="fa-solid fa-car" style={{ fontSize: '0.6rem' }}></i>}
                            <span style={{ fontSize: '0.6rem' }}>{spot.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px', color: '#475569', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }}></div>
                <i className="fa-solid fa-road"></i> CALLE
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.04)' }}></div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: selectedSpot ? '#f59e0b' : '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                  {selectedSpot ? `Plaza ${selectedSpot.label} seleccionada` : 'Selecciona una plaza disponible'}
                </span>
                <button
                  disabled={!selectedSpot}
                  onClick={() => setStep(STEP.CONFIRM)}
                  style={{ padding: '10px 20px', background: selectedSpot ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: selectedSpot ? 'white' : '#475569', fontWeight: 800, cursor: selectedSpot ? 'pointer' : 'not-allowed', fontSize: '0.9rem', transition: 'all 0.2s' }}
                >
                  Continuar <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Confirm + duration */}
          {step === STEP.CONFIRM && (
            <div>
              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Plaza seleccionada</span>
                  <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1rem' }}>{selectedSpot?.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Estacionamiento</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem' }}>{parking.nombre}</span>
                </div>
                {selectedSpot?.pmr && (
                  <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '8px', padding: '6px 10px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
                    <i className="fa-solid fa-wheelchair" style={{ marginRight: '6px' }}></i>Plaza de Accesibilidad PMR
                  </div>
                )}
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>¿Cuánto tiempo necesitas?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setDuration(opt)}
                    style={{ padding: '10px 6px', borderRadius: '10px', border: duration.label === opt.label ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: duration.label === opt.label ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', color: duration.label === opt.label ? '#60a5fa' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s' }}
                    aria-label={`Duración ${opt.label}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8', fontSize: '0.83rem' }}>
                  <span>Tarifa</span><span>${parking.precio_hora?.toLocaleString()}/hr × {duration.hours}h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 700 }}>Total estimado</span>
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.1rem' }}>${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(STEP.SELECT)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isReserving}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: isReserving ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: '0 4px 20px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-lock"></i>
                  Reservar Plaza {selectedSpot?.label}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Processing */}
          {step === STEP.PROCESSING && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
                <i className="fa-solid fa-car" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#3b82f6', fontSize: '1.5rem' }}></i>
              </div>
              <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Asignando tu plaza…</p>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Confirmando con el arrendador</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === STEP.SUCCESS && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10b981', fontSize: '2rem' }}></i>
              </div>
              <h3 style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px' }}>¡Plaza Reservada!</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                Plaza <strong style={{ color: '#f59e0b' }}>{selectedSpot?.label}</strong> en {parking.nombre} — {duration.label}
              </p>
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Total cobrado</p>
                <p style={{ color: '#10b981', fontWeight: 900, fontSize: '1.5rem', margin: '4px 0 0' }}>${totalPrice.toLocaleString()}</p>
              </div>
              <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
                Volver al mapa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
