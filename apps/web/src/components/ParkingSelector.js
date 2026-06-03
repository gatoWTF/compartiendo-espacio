'use client';
import { useState, useMemo, useEffect, useRef } from 'react';

const DURATION_OPTIONS = [
  { label: '30 min', hours: 0.5 },
  { label: '1 hora', hours: 1 },
  { label: '2 horas', hours: 2 },
  { label: '4 horas', hours: 4 },
  { label: 'Día completo', hours: 8 },
];

const PAY_METHODS = [
  { id: 'webpay', label: 'Tarjeta (Webpay)', icon: 'fa-credit-card' },
  { id: 'efectivo', label: 'Efectivo al llegar', icon: 'fa-money-bill-wave' },
];

function generateSpots(parking, tempLocks = new Set()) {
  const total = Math.max(parking.total_spots || 8, 1);
  const occupied = Math.min(parking.occupied_spots || 0, total);
  const hasPmr = parking.es_pmr;

  const seed = parking.id || 1;
  const rng = (n) => ((seed * 1103515245 + n * 12345) & 0x7fffffff) % total;

  const occupiedSet = new Set();
  let attempts = 0;
  while (occupiedSet.size < occupied && attempts < total * 3) {
    const idx = rng(attempts++);
    if (!hasPmr || idx < total - 2) occupiedSet.add(idx);
  }

  return Array.from({ length: total }, (_, i) => {
    const label = `${String.fromCharCode(65 + Math.floor(i / 6))}${(i % 6) + 1}`;
    const isPmr = hasPmr && i >= total - 2;
    const isOccupied = occupiedSet.has(i);
    const isTempLocked = tempLocks.has(label);

    let status;
    if (isOccupied)      status = 'occupied';
    else if (isTempLocked) status = 'reserved';
    else if (isPmr)      status = 'pmr';
    else                 status = 'available';

    return { id: i, label, status };
  });
}

const STEP = { SELECT: 1, CONFIRM: 2, PAYMENT: 3, PROCESSING: 4, SUCCESS: 5 };

const SPOT_STYLE = {
  available: { bg: '#10b981', label: 'Disponible',  selectable: true  },
  pmr:       { bg: '#3b82f6', label: 'PMR',          selectable: true  },
  occupied:  { bg: '#ef4444', label: 'Ocupada',      selectable: false },
  reserved:  { bg: '#f59e0b', label: 'Reservada',    selectable: false },
};

export default function ParkingSelector({ parking, onClose, onReserve, isReserving, tempLocks, authToken }) {
  const [step, setStep] = useState(STEP.SELECT);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [duration, setDuration] = useState(DURATION_OPTIONS[1]);
  const [payMethod, setPayMethod] = useState('webpay');
  const [reserveError, setReserveError] = useState(null);
  const [lockError, setLockError] = useState(null);
  const [lockingSpot, setLockingSpot] = useState(null);

  // Track active lock for cleanup on unmount
  const activeLockRef = useRef(null);
  const [activeLockId, setActiveLockIdState] = useState(null);
  const setActiveLockId = (id) => { activeLockRef.current = id; setActiveLockIdState(id); };

  const releaseLock = async (lockId) => {
    if (!lockId || !authToken) return;
    try {
      await fetch(`/api/mapas/locks?lockId=${lockId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch { /* ignore on cleanup */ }
  };

  // Release lock on unmount if reservation was not completed
  useEffect(() => {
    return () => { if (activeLockRef.current) releaseLock(activeLockRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spots = useMemo(
    () => generateSpots(parking, tempLocks || new Set()),
    [parking, tempLocks]
  );

  const totalPrice = Math.round((parking.precio_hora || 0) * duration.hours);

  const rows = useMemo(() => {
    const r = {};
    spots.forEach(s => {
      const row = s.label[0];
      if (!r[row]) r[row] = [];
      r[row].push(s);
    });
    return r;
  }, [spots]);

  // ── Spot click: acquire temporary lock ──
  const handleSpotClick = async (spot) => {
    const cfg = SPOT_STYLE[spot.status] || SPOT_STYLE.available;
    if (!cfg.selectable || lockingSpot) return;

    // Release previous lock if switching spots
    if (activeLockId && selectedSpot?.label !== spot.label) {
      releaseLock(activeLockId);
      setActiveLockId(null);
    }

    setLockError(null);
    setLockingSpot(spot.label);

    if (!authToken) {
      // No session: still allow selection but no server-side lock
      setSelectedSpot(spot);
      setLockingSpot(null);
      return;
    }

    try {
      const res = await fetch('/api/mapas/locks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ estacionamiento_id: parking.id, spot_label: spot.label }),
      });
      const data = await res.json();

      if (data.success) {
        setActiveLockId(data.lockId);
        setSelectedSpot(spot);
      } else {
        setLockError(data.error || 'Esta plaza no está disponible.');
        setSelectedSpot(null);
      }
    } catch {
      // Network issue: allow selection without lock
      setSelectedSpot(spot);
    } finally {
      setLockingSpot(null);
    }
  };

  // ── Step 2 → Step 3 ──
  const handleProceedToPayment = () => {
    setReserveError(null);
    setStep(STEP.PAYMENT);
  };

  // ── Step 3 → reservation + payment ──
  const handlePayment = async () => {
    setReserveError(null);
    setStep(STEP.PROCESSING);

    const result = await onReserve({ spotLabel: selectedSpot.label, durationHours: duration.hours });

    if (result?.success === false) {
      setReserveError(result.error || 'No se pudo completar la reserva.');
      setStep(STEP.PAYMENT);
      return;
    }

    // Record payment (best-effort; reservation already created)
    if (authToken && totalPrice > 0) {
      try {
        await fetch('/api/pagos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({
            reserva_id: result?.reservaId || null,
            amount: totalPrice,
            provider: payMethod,
            metadata: { spot_label: selectedSpot.label, parking_id: parking.id },
          }),
        });
      } catch { /* payment logging failure doesn't block success */ }
    }

    // Lock was consumed by the reservation — clear ref so cleanup doesn't double-delete
    setActiveLockId(null);
    setStep(STEP.SUCCESS);
  };

  const handleClose = () => {
    if (activeLockRef.current) { releaseLock(activeLockRef.current); setActiveLockId(null); }
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div style={{ background: 'linear-gradient(145deg,#0f172a,#1e293b)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '24px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(59,130,246,0.15)' }}>

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
          <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', padding: '8px 10px', fontSize: '1rem' }} aria-label="Cerrar">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[['Elige plaza', 1], ['Duración', 2], ['Pago', 3], ['Listo', 4]].map(([label, n]) => {
            const done = step > n;
            const active = step === n || (step === STEP.PROCESSING && n === 3) || (step === STEP.SUCCESS && n === 4);
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: n < 4 ? 1 : undefined }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, background: active || done ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: active || done ? 'white' : '#64748b', border: active ? '2px solid #60a5fa' : '1px solid transparent', flexShrink: 0 }}>
                  {done ? <i className="fa-solid fa-check" style={{ fontSize: '0.6rem' }}></i> : n}
                </div>
                <span style={{ fontSize: '0.75rem', color: active ? '#e2e8f0' : '#475569', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
                {n < 4 && <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)', marginLeft: '4px' }}></div>}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>

          {/* ── STEP 1: Seat selector ── */}
          {step === STEP.SELECT && (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                {Object.entries(SPOT_STYLE).map(([key, cfg]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.73rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: cfg.bg, opacity: cfg.selectable ? 1 : 0.5 }}></div>
                    {cfg.label}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.73rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b', border: '2px solid white' }}></div>
                  Seleccionada
                </div>
              </div>

              <div style={{ marginBottom: '10px', color: '#475569', fontSize: '0.73rem', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        const isLocking = lockingSpot === spot.label;
                        const cfg = SPOT_STYLE[spot.status] || SPOT_STYLE.available;
                        return (
                          <button
                            key={spot.id}
                            disabled={!cfg.selectable || !!lockingSpot}
                            onClick={() => handleSpotClick(spot)}
                            aria-label={`Plaza ${spot.label} — ${isSelected ? 'Seleccionada' : cfg.label}`}
                            title={`Plaza ${spot.label} — ${cfg.label}`}
                            style={{
                              width: '44px', height: '38px', borderRadius: '8px',
                              background: isSelected ? '#f59e0b' : `${cfg.bg}22`,
                              border: `2px solid ${isSelected ? '#f59e0b' : cfg.bg}`,
                              color: isSelected ? '#000' : cfg.bg,
                              fontSize: '0.68rem', fontWeight: 800,
                              cursor: cfg.selectable ? 'pointer' : 'not-allowed',
                              opacity: cfg.selectable ? 1 : 0.4,
                              transition: 'all 0.15s',
                              transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                              boxShadow: isSelected ? `0 0 14px #f59e0b99` : 'none',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                            }}
                          >
                            {isLocking
                              ? <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '0.65rem' }}></i>
                              : <>
                                  {spot.status === 'pmr'      && <i className="fa-solid fa-wheelchair"  style={{ fontSize: '0.68rem' }}></i>}
                                  {spot.status === 'occupied' && <i className="fa-solid fa-lock"        style={{ fontSize: '0.6rem'  }}></i>}
                                  {spot.status === 'reserved' && <i className="fa-solid fa-clock"       style={{ fontSize: '0.6rem'  }}></i>}
                                  {(spot.status === 'available' || (spot.status === 'pmr' && false)) && !isSelected && <i className="fa-solid fa-car" style={{ fontSize: '0.6rem' }}></i>}
                                  {isSelected && <i className="fa-solid fa-car" style={{ fontSize: '0.6rem' }}></i>}
                                </>
                            }
                            <span style={{ fontSize: '0.58rem' }}>{spot.label}</span>
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

              {lockError && (
                <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-exclamation"></i> {lockError}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: selectedSpot ? '#f59e0b' : '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                  {selectedSpot ? `Plaza ${selectedSpot.label} seleccionada` : 'Selecciona una plaza disponible'}
                </span>
                <button
                  disabled={!selectedSpot}
                  onClick={() => setStep(STEP.CONFIRM)}
                  style={{ padding: '10px 20px', background: selectedSpot ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: selectedSpot ? 'white' : '#475569', fontWeight: 800, cursor: selectedSpot ? 'pointer' : 'not-allowed', fontSize: '0.9rem', transition: 'all 0.2s' }}
                >
                  Continuar <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Duration ── */}
          {step === STEP.CONFIRM && (
            <div>
              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Plaza seleccionada</span>
                  <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1rem' }}>{selectedSpot?.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Estacionamiento</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem' }}>{parking.nombre}</span>
                </div>
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>¿Cuánto tiempo necesitas?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '20px' }}>
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setDuration(opt)}
                    style={{ padding: '10px 6px', borderRadius: '10px', border: duration.label === opt.label ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: duration.label === opt.label ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', color: duration.label === opt.label ? '#60a5fa' : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s' }}
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
                <button onClick={() => setStep(STEP.SELECT)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <button
                  onClick={handleProceedToPayment}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  Ir al pago <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Payment ── */}
          {step === STEP.PAYMENT && (
            <div>
              {/* Order summary */}
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#64748b', fontSize: '0.73rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 700 }}>Resumen de reserva</p>
                {[
                  ['Estacionamiento', parking.nombre],
                  ['Plaza', selectedSpot?.label],
                  ['Duración', duration.label],
                  ['Ingreso estimado', new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.83rem' }}>{k}</span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.83rem', fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem' }}>Total a pagar</span>
                  <span style={{ color: '#10b981', fontWeight: 900, fontSize: '1.3rem' }}>${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment methods */}
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>Método de pago</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {PAY_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: payMethod === m.id ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: payMethod === m.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', color: payMethod === m.id ? '#60a5fa' : '#94a3b8', transition: 'all 0.15s', textAlign: 'left' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: payMethod === m.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={`fa-solid ${m.icon}`} style={{ fontSize: '1rem' }}></i>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.label}</span>
                    {payMethod === m.id && <i className="fa-solid fa-circle-check" style={{ marginLeft: 'auto', color: '#3b82f6' }}></i>}
                  </button>
                ))}
              </div>

              {reserveError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.83rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-circle-exclamation"></i> {reserveError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(STEP.CONFIRM)} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isReserving}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: isReserving ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: '0 4px 20px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-lock"></i>
                  Confirmar Pago ${totalPrice.toLocaleString()}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Processing ── */}
          {step === STEP.PROCESSING && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
                <i className="fa-solid fa-car" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#3b82f6', fontSize: '1.5rem' }}></i>
              </div>
              <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Procesando tu reserva…</p>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Confirmando plaza y procesando pago</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── STEP 5: Success ── */}
          {step === STEP.SUCCESS && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <i className="fa-solid fa-circle-check" style={{ color: '#10b981', fontSize: '2rem' }}></i>
              </div>
              <h3 style={{ color: '#10b981', fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px' }}>¡Reserva Confirmada!</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                Plaza <strong style={{ color: '#f59e0b' }}>{selectedSpot?.label}</strong> en {parking.nombre} — {duration.label}
              </p>
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Total pagado</p>
                <p style={{ color: '#10b981', fontWeight: 900, fontSize: '1.5rem', margin: '4px 0 0' }}>${totalPrice.toLocaleString()}</p>
              </div>
              <button onClick={handleClose} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
                Volver al mapa
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
