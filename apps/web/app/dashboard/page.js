// Archivo: apps/web/app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '../../src/lib/api';
import { supabase } from '@parkings/supabase-db';

const MiniMapComponent = dynamic(() => import('../../src/components/MiniMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
      <i className="fa-solid fa-satellite-dish fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '10px' }}></i>
      <span style={{color: '#94a3b8', fontSize: '0.8rem'}}>Conectando a satélites...</span>
    </div>
  )
});

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [myParkings, setMyParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [totalSpots, setTotalSpots] = useState(1);
  const [esPmr, setEsPmr] = useState(false);

  // Pricing
  const [precioHora,     setPrecioHora]     = useState('');
  const [pricePerMinute, setPricePerMinute] = useState('');
  const [pricePerDay,    setPricePerDay]    = useState('');

  // Vehicle types
  const VEHICLE_TYPES = [
    { id: 'car',        label: 'Auto',      icon: 'fa-car'           },
    { id: 'motorcycle', label: 'Moto',      icon: 'fa-motorcycle'    },
    { id: 'bicycle',    label: 'Bicicleta', icon: 'fa-bicycle'       },
    { id: 'scooter',    label: 'Scooter',   icon: 'fa-person-biking' },
  ];
  const [allowedVehicleTypes, setAllowedVehicleTypes] = useState(['car']);
  const toggleVehicle = (id) => setAllowedVehicleTypes(prev =>
    prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
  );
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [reservasRecibidas, setReservasRecibidas] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      // Use Supabase session instead of manually checking localStorage
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession?.user) {
        router.push('/auth');
        return;
      }

      // Fetch the user's rol from the database (resilient)
      let profile = null;
      try {
        const { data: profileData } = await supabase.from('perfiles').select('rol, nombre').eq('id', authSession.user.id).single();
        profile = profileData;
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.warn('[Dashboard] Perfil no disponible, usando fallback de auth metadata');
      }
      
      const userObj = {
        id: authSession.user.id,
        email: authSession.user.email,
        nombre: profile?.nombre || authSession.user.user_metadata?.nombre || authSession.user.email?.split('@')[0],
        rol: profile?.rol || authSession.user.user_metadata?.rol || 'cliente'
      };

      setSession({ user: userObj, access_token: authSession.access_token });

      try {
        const result = await api.mapas.getMisEstacionamientos(userObj.id);
        if (result.success) setMyParkings(result.data || []);
      } catch (e) {
        console.error('Error cargando estacionamientos:', e);
      }

      if (userObj.rol === 'arrendador') {
        try {
          const rr = await api.reservas.listar('arrendador');
          if (rr.success) setReservasRecibidas(rr.data || []);
        } catch (e) {
          if (process.env.NODE_ENV === 'development') console.error('Error cargando reservas recibidas:', e);
        }
      }

      setLoading(false);
    };
    checkUserAndFetchData();
  }, [router]);

  const recargarReservasRecibidas = async () => {
    const rr = await api.reservas.listar('arrendador');
    if (rr.success) setReservasRecibidas(rr.data || []);
  };

  const gestionarReserva = async (accion, id) => {
    const fn = { confirmar: api.reservas.confirmar, completar: api.reservas.completar, cancelar: api.reservas.cancelar }[accion];
    showToast('Procesando reserva...', 'syncing');
    const res = await fn(id);
    if (res.success) { showToast('Reserva actualizada', 'success'); recargarReservasRecibidas(); }
    else showToast(res.error || 'No se pudo actualizar la reserva', 'error');
  };

  const fmtFechaR = (f) => f ? new Date(f).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const handleSearchAddress = async () => {
    if (!direccion.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', Chile')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(data[0].lat);
        setLng(data[0].lon);
        showToast('¡Dirección ubicada y fijada en el mapa!', 'success');
      } else {
        showToast('Dirección no encontrada.', 'error');
      }
    } catch {
      showToast('Error de conexión satelital.', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!lat || !lng) { showToast('Fija el pin rojo en el mapa primero.', 'error'); return; }

    const nombreArrendador = session.user.nombre || session.user.email.split('@')[0];
    showToast('Publicando estacionamiento...', 'syncing');

    try {
      const result = await api.mapas.crearEstacionamiento({
        nombre,
        arrendador: nombreArrendador,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        totalSpots: parseInt(totalSpots),
        esPmr,
        userId: session.user.id,
        precioHora:         precioHora     ? parseFloat(precioHora)     : undefined,
        pricePerMinute:     pricePerMinute ? parseFloat(pricePerMinute) : undefined,
        pricePerDay:        pricePerDay    ? parseFloat(pricePerDay)    : undefined,
        allowedVehicleTypes: allowedVehicleTypes.length > 0 ? allowedVehicleTypes : ['car'],
      });

      if (result.success && result.data) {
        setMyParkings(prev => [result.data, ...prev]);
        setNombre(''); setDireccion(''); setLat(''); setLng(''); setTotalSpots(1); setEsPmr(false);
        setPrecioHora(''); setPricePerMinute(''); setPricePerDay('');
        setAllowedVehicleTypes(['car']);
        showToast('¡Estacionamiento publicado con éxito!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar en Supabase.', 'error');
    }
  };

  const updateOccupancy = async (id, currentOccupied, total, change) => {
    const newOccupied = currentOccupied + change;
    if (newOccupied < 0 || newOccupied > total) return;
    
    // Optimistic Update
    setMyParkings(prev => prev.map(p => p.id === id ? { ...p, occupied_spots: newOccupied } : p));
    showToast('Actualizando cupos...', 'syncing');

    try {
      const res = await api.mapas.actualizarOcupacion(id, newOccupied);
      if (res.success) {
        showToast('Cupos actualizados', 'success');
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      setMyParkings(prev => prev.map(p => p.id === id ? { ...p, occupied_spots: currentOccupied } : p));
      showToast('Error al actualizar los cupos', 'error');
    }
  };

  const toggleSelection = (id) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );

  const selectAll = () =>
    selectedIds.length === myParkings.length
      ? setSelectedIds([])
      : setSelectedIds(myParkings.map(p => p.id));

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Edit modal ──
  const [editingParking,   setEditingParking]   = useState(null);
  const [editNombre,       setEditNombre]       = useState('');
  const [editTotalSpots,   setEditTotalSpots]   = useState(1);
  const [editEsPmr,        setEditEsPmr]        = useState(false);
  const [editPrecioHora,   setEditPrecioHora]   = useState('');
  const [editPriceMin,     setEditPriceMin]     = useState('');
  const [editPriceDay,     setEditPriceDay]     = useState('');
  const [editVehicles,     setEditVehicles]     = useState(['car']);
  const VEHICLE_EDIT = [
    { id: 'car',        label: 'Auto',      icon: 'fa-car'           },
    { id: 'motorcycle', label: 'Moto',      icon: 'fa-motorcycle'    },
    { id: 'bicycle',    label: 'Bicicleta', icon: 'fa-bicycle'       },
    { id: 'scooter',    label: 'Scooter',   icon: 'fa-person-biking' },
  ];

  const openEdit = (parking) => {
    setEditingParking(parking);
    setEditNombre(parking.nombre || '');
    setEditTotalSpots(parking.total_spots || 1);
    setEditEsPmr(parking.es_pmr || false);
    setEditPrecioHora(parking.precio_hora != null ? String(parking.precio_hora) : '');
    setEditPriceMin(parking.price_per_minute != null ? String(parking.price_per_minute) : '');
    setEditPriceDay(parking.price_per_day != null ? String(parking.price_per_day) : '');
    setEditVehicles(parking.allowed_vehicle_types?.length > 0 ? parking.allowed_vehicle_types : ['car']);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    showToast('Guardando cambios...', 'syncing');
    try {
      const res = await api.mapas.actualizarEstacionamiento(editingParking.id, {
        nombre:              editNombre,
        totalSpots:          editTotalSpots,
        esPmr:               editEsPmr,
        precioHora:          editPrecioHora,
        pricePerMinute:      editPriceMin,
        pricePerDay:         editPriceDay,
        allowedVehicleTypes: editVehicles.length > 0 ? editVehicles : ['car'],
      });
      if (res.success) {
        setMyParkings(prev => prev.map(p => p.id === editingParking.id ? { ...p, ...res.data } : p));
        setEditingParking(null);
        showToast('Plaza actualizada con éxito', 'success');
      } else {
        showToast(res.error || 'No se pudo actualizar', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar', 'error');
    }
  };

  const handleToggleActivo = async (parking) => {
    const wasActivo = parking.activo !== false;
    showToast(wasActivo ? 'Desactivando plaza...' : 'Reactivando plaza...', 'syncing');
    try {
      const res = await api.mapas.toggleActivar(parking.id);
      if (res.success) {
        setMyParkings(prev => prev.map(p => p.id === parking.id ? { ...p, activo: res.activo } : p));
        showToast(res.activo ? 'Plaza reactivada y visible en el mapa' : 'Plaza desactivada y oculta del mapa', 'success');
      } else {
        showToast(res.error || 'Error al cambiar estado', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setShowConfirmModal(true);
  };

  const executeBulkDelete = async () => {
    setShowConfirmModal(false);
    showToast('Eliminando...', 'syncing');

    try {
      const result = await api.mapas.eliminarEstacionamientos(selectedIds);
      if (result.success) {
        // Hard-deleted → remove from list; soft-deleted → mark as inactive
        setMyParkings(prev => prev
          .filter(p => !selectedIds.includes(p.id) || result.softDeleted > 0)
          .map(p => selectedIds.includes(p.id) ? { ...p, activo: false } : p)
        );
        setSelectedIds([]);
        const msg = result.softDeleted > 0
          ? `${result.hardDeleted} eliminado(s), ${result.softDeleted} desactivado(s) (tienen reservas activas)`
          : `${result.hardDeleted} estacionamiento(s) eliminado(s)`;
        showToast(msg, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al eliminar.', 'error');
    }
  };

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
      <h3 style={{ color: '#94a3b8' }}>Cargando...</h3>
    </div>
  );

  return (
    <section className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-titles">
          <h2>Panel de Control</h2>
          <p>Hola, {session?.user?.nombre || session?.user?.email}</p>
        </div>
        
      </div>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' && <i className="fa-solid fa-check-circle"></i>}
          {toast.type === 'error' && <i className="fa-solid fa-triangle-exclamation"></i>}
          {toast.type === 'syncing' && <i className="fa-solid fa-arrows-rotate fa-spin"></i>}
          {toast.msg}
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editingParking && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '92%', textAlign: 'left', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-pen-to-square" style={{ color: '#3b82f6' }}></i> Editar Plaza
              </h3>
              <button onClick={() => setEditingParking(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Nombre */}
              <div className="input-group">
                <i className="fa-solid fa-signature icon"></i>
                <input type="text" placeholder="Nombre de la Plaza" value={editNombre} onChange={e => setEditNombre(e.target.value)} required />
              </div>
              {/* Cupos y PMR */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <i className="fa-solid fa-car icon"></i>
                  <input type="number" min="1" placeholder="Cupos totales" value={editTotalSpots} onChange={e => setEditTotalSpots(e.target.value)} required />
                </div>
              </div>
              <div className="checkbox-pmr" style={{ cursor: 'pointer' }}>
                <input type="checkbox" id="edit-pmr" checked={editEsPmr} onChange={e => setEditEsPmr(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#38bdf8' }} />
                <label htmlFor="edit-pmr" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white', fontWeight: 700 }}>
                  <i className="fa-solid fa-wheelchair" style={{ color: '#38bdf8' }}></i> Zona Prioritaria PMR
                </label>
              </div>
              {/* Tarifas */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: 700 }}>
                  <i className="fa-solid fa-coins" style={{ color: '#f59e0b', marginRight: '6px' }}></i> Tarifas
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <i className="fa-solid fa-clock icon"></i>
                    <input type="number" min="0" placeholder="Por hora" value={editPrecioHora} onChange={e => setEditPrecioHora(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <i className="fa-solid fa-stopwatch icon"></i>
                    <input type="number" min="0" placeholder="Por minuto" value={editPriceMin} onChange={e => setEditPriceMin(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <i className="fa-solid fa-calendar-day icon"></i>
                    <input type="number" min="0" placeholder="Por día" value={editPriceDay} onChange={e => setEditPriceDay(e.target.value)} />
                  </div>
                </div>
              </div>
              {/* Vehículos */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: 700 }}>
                  <i className="fa-solid fa-car" style={{ color: '#3b82f6', marginRight: '6px' }}></i> Vehículos admitidos
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {VEHICLE_EDIT.map(v => {
                    const active = editVehicles.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setEditVehicles(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '12px 6px', borderRadius: '12px', border: active ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', color: active ? '#60a5fa' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', fontWeight: 700, fontSize: '0.72rem' }}
                      >
                        <i className={`fa-solid ${v.icon}`} style={{ fontSize: '1.1rem' }}></i>
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setEditingParking(null)} className="btn-cancel" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn-cyber-primary" style={{ flex: 2, padding: '12px' }}>
                  <i className="fa-solid fa-floppy-disk"></i> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3><i className="fa-solid fa-triangle-exclamation" style={{color: '#ef4444'}}></i> Confirmar Eliminación</h3>
            <p>¿Estás seguro de que deseas eliminar {selectedIds.length} estacionamiento(s) de la red?</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)} className="btn-cancel">Cancelar</button>
              <button onClick={executeBulkDelete} className="btn-delete-bulk">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* KPI METRICS */}
        {session?.user?.rol === 'arrendador' && myParkings.length > 0 && (
          <div className="kpi-row">
            <div className="kpi-card">
              <div className="kpi-icon blue"><i className="fa-solid fa-warehouse"></i></div>
              <div className="kpi-data">
                <span className="kpi-value">{myParkings.length}</span>
                <span className="kpi-label">Plazas Activas</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon green"><i className="fa-solid fa-car-side"></i></div>
              <div className="kpi-data">
                <span className="kpi-value">{myParkings.reduce((sum, p) => sum + p.total_spots, 0)}</span>
                <span className="kpi-label">Cupos Totales</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon amber"><i className="fa-solid fa-chart-pie"></i></div>
              <div className="kpi-data">
                <span className="kpi-value">
                  {myParkings.reduce((sum, p) => sum + p.total_spots, 0) > 0 
                    ? Math.round((myParkings.reduce((sum, p) => sum + (p.occupied_spots || 0), 0) / myParkings.reduce((sum, p) => sum + p.total_spots, 0)) * 100) 
                    : 0}%
                </span>
                <span className="kpi-label">Tasa Ocupación</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon purple"><i className="fa-solid fa-wheelchair"></i></div>
              <div className="kpi-data">
                <span className="kpi-value">{myParkings.filter(p => p.es_pmr).length}</span>
                <span className="kpi-label">Zonas PMR</span>
              </div>
            </div>
          </div>
        )}
        
        {/* FORMULARIO NUEVO ESPACIO (Sólo Arrendadores) */}
        {session?.user?.rol === 'arrendador' && (
          <div className="glass-panel form-panel">
            <h3><i className="fa-solid fa-square-parking"></i> Publicar Estacionamiento</h3>
            <p className="panel-desc">Añade tu plaza a la red y comienza a generar ingresos con tu espacio disponible.</p>
            
            <form onSubmit={handleCreate} className="create-form">
              {/* 1. Ubicar espacio */}
              <div className="form-block">
                <div className="input-group search-group">
                  <i className="fa-solid fa-map-pin icon"></i>
                  <input type="text" placeholder="Ej: Avenida Falsa 123" value={direccion} onChange={e => setDireccion(e.target.value)} />
                  <button type="button" onClick={handleSearchAddress} className="btn-search">UBICAR EN EL MAPA</button>
                </div>
                
                <div className="map-container">
                  <MiniMapComponent lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
                </div>
              </div>
              
              {/* 2. Configurar características */}
              <div className="form-block">
                <div className="input-row">
                  <div className="input-group">
                    <i className="fa-solid fa-signature icon"></i>
                    <input type="text" placeholder="Nombre de la Plaza" value={nombre} onChange={e => setNombre(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <i className="fa-solid fa-car icon"></i>
                    <input type="number" min="1" placeholder="Cupos" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} required />
                  </div>
                </div>
                
                <div className="checkbox-pmr">
                  <input type="checkbox" id="pmr-check" checked={esPmr} onChange={e => setEsPmr(e.target.checked)} style={{width: '20px', height: '20px', accentColor: '#38bdf8'}} />
                  <label htmlFor="pmr-check" style={{display: 'flex', flexDirection: 'column', cursor: 'pointer'}}>
                    <span style={{color: 'white', fontSize: '1.05rem', fontWeight: 700}}><i className="fa-solid fa-wheelchair" style={{marginRight: '8px', color: '#38bdf8'}}></i> Habilitar Zona Prioritaria PMR</span>
                    <span style={{color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px'}}>Destaca este estacionamiento para usuarios con movilidad reducida.</span>
                  </label>
                </div>
              </div>
              
              {/* 3. Tarifas */}
              <div className="form-block">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <i className="fa-solid fa-coins" style={{ color: '#f59e0b' }}></i>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Configuración de Tarifas</span>
                </div>
                <div className="input-row" style={{ flexDirection: 'row' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <i className="fa-solid fa-clock icon"></i>
                    <input type="number" min="0" placeholder="Por hora (CLP)" value={precioHora} onChange={e => setPrecioHora(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <i className="fa-solid fa-stopwatch icon"></i>
                    <input type="number" min="0" placeholder="Por minuto (CLP)" value={pricePerMinute} onChange={e => setPricePerMinute(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <i className="fa-solid fa-calendar-day icon"></i>
                    <input type="number" min="0" placeholder="Por día (CLP)" value={pricePerDay} onChange={e => setPricePerDay(e.target.value)} />
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '6px' }}>Define las tarifas disponibles. El sistema aplica automáticamente la combinación más conveniente para el usuario.</p>
              </div>

              {/* 4. Vehículos admitidos */}
              <div className="form-block">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <i className="fa-solid fa-car" style={{ color: '#3b82f6' }}></i>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Vehículos Admitidos</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                  {[
                    { id: 'car',        label: 'Auto',      icon: 'fa-car'           },
                    { id: 'motorcycle', label: 'Moto',      icon: 'fa-motorcycle'    },
                    { id: 'bicycle',    label: 'Bicicleta', icon: 'fa-bicycle'       },
                    { id: 'scooter',    label: 'Scooter',   icon: 'fa-person-biking' },
                  ].map(v => {
                    const active = allowedVehicleTypes.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVehicle(v.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '14px 8px', borderRadius: '12px', border: active ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)', color: active ? '#60a5fa' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', fontWeight: 700, fontSize: '0.75rem' }}
                      >
                        <i className={`fa-solid ${v.icon}`} style={{ fontSize: '1.3rem' }}></i>
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Publicar */}
              <div className="form-block">
                <button type="submit" className="btn-cyber-primary submit-btn" style={{width: '100%'}}>
                  <i className="fa-solid fa-cloud-arrow-up"></i> PUBLICAR ESTACIONAMIENTO
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RESERVAS RECIBIDAS (Sólo Arrendadores) */}
        {session?.user?.rol === 'arrendador' && (
          <div className="glass-panel form-panel">
            <h3><i className="fa-solid fa-calendar-check"></i> Reservas Recibidas ({reservasRecibidas.length})</h3>
            <p className="panel-desc">Confirma, completa o cancela las reservas de tus estacionamientos.</p>

            {reservasRecibidas.length === 0 ? (
              <div className="glass-panel empty-state" style={{ marginTop: '10px' }}>
                <i className="fa-solid fa-inbox"></i>
                <p>Todavía no has recibido reservas.</p>
              </div>
            ) : (
              <div className="reservas-recibidas">
                {reservasRecibidas.map(r => (
                  <div key={r.id} className="reserva-row">
                    <div className="reserva-info">
                      <strong>{r.estacionamiento?.nombre || 'Estacionamiento'}</strong>
                      <span>{fmtFechaR(r.fecha_inicio)} → {fmtFechaR(r.fecha_fin)}</span>
                      <span className={`estado-badge estado-${r.estado}`}>{r.estado}</span>
                    </div>
                    <div className="reserva-acts">
                      {r.estado === 'pendiente' && (
                        <button onClick={() => gestionarReserva('confirmar', r.id)} className="btn-cyber-secondary action-btn">
                          <i className="fa-solid fa-check"></i> Confirmar
                        </button>
                      )}
                      {(r.estado === 'confirmada' || r.estado === 'activa') && (
                        <button onClick={() => gestionarReserva('completar', r.id)} className="btn-cyber-secondary action-btn">
                          <i className="fa-solid fa-flag-checkered"></i> Completar
                        </button>
                      )}
                      {(r.estado === 'pendiente' || r.estado === 'confirmada') && (
                        <button onClick={() => gestionarReserva('cancelar', r.id)} className="btn-delete-bulk">
                          <i className="fa-solid fa-ban"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INVENTARIO / MIS VEHICULOS */}
        <div className="inventory-panel">
          <div className="inventory-header">
            <h3>
              {session?.user?.rol === 'arrendador' ? (
                <><i className="fa-solid fa-warehouse"></i> Mis Estacionamientos ({myParkings.length})</>
              ) : (
                <><i className="fa-solid fa-car"></i> Mis Vehículos ({myParkings.length})</>
              )}
            </h3>
            {myParkings.length > 0 && session?.user?.rol === 'arrendador' && (
              <div className="inventory-actions">
                <button onClick={selectAll} className="btn-cyber-secondary action-btn" aria-label={selectedIds.length === myParkings.length ? 'Desmarcar todos' : 'Seleccionar todos'}>
                  {selectedIds.length === myParkings.length ? 'Desmarcar' : 'Seleccionar'}
                </button>
                {selectedIds.length > 0 && (
                  <button onClick={handleBulkDelete} className="btn-delete-bulk" aria-label={`Borrar ${selectedIds.length} estacionamiento(s) seleccionado(s)`}>
                    <i className="fa-solid fa-trash"></i> Borrar ({selectedIds.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {myParkings.length === 0 ? (
            <div className="glass-panel empty-state">
              {session?.user?.rol === 'arrendador' ? (
                <>
                  <i className="fa-solid fa-square-parking"></i>
                  <p>Aún no tienes plazas publicadas. Añade tu primer estacionamiento para comenzar a recibir reservas.</p>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-car-burst"></i>
                  <p>Aún no has registrado vehículos ni reservas.</p>
                  <button onClick={() => router.push('/mapa')} className="btn-cyber-primary" style={{marginTop: '15px'}}>
                    <i className="fa-solid fa-map-location-dot"></i> Ir al Mapa
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="parking-list">
              {myParkings.map((parking) => {
                const isFull     = parking.occupied_spots >= parking.total_spots;
                const isSelected = selectedIds.includes(parking.id);
                const isInactive = parking.activo === false;
                return (
                  <div key={parking.id} className={`glass-panel parking-item ${isSelected ? 'selected' : ''} ${isInactive ? 'inactive-parking' : ''}`}>
                    <div className="item-info">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(parking.id)} className="custom-checkbox" />
                      <div style={{ minWidth: 0 }}>
                        <h4>
                          {parking.nombre}
                          {parking.es_pmr && <i className="fa-solid fa-wheelchair pmr-icon"></i>}
                        </h4>
                        <div className="status-badges">
                          {isInactive
                            ? <span className="badge" style={{ background: 'rgba(100,116,139,0.2)', color: '#64748b' }}>INACTIVO</span>
                            : <span className={`badge ${isFull ? 'red' : 'green'}`}>{isFull ? 'LLENO' : 'DISPONIBLE'}</span>
                          }
                          <span className="spots-info"><i className="fa-solid fa-car-side"></i> {parking.occupied_spots}/{parking.total_spots}</span>
                          {parking.precio_hora > 0 && <span className="spots-info" style={{ color: '#f59e0b' }}>${parking.precio_hora?.toLocaleString()}/hr</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {/* Edit button */}
                      <button
                        onClick={() => openEdit(parking)}
                        title="Editar"
                        aria-label="Editar estacionamiento"
                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', color: '#60a5fa', cursor: 'pointer', padding: '8px 10px', fontSize: '0.9rem', transition: 'all 0.15s' }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>

                      {/* Deactivate / Reactivate toggle */}
                      <button
                        onClick={() => handleToggleActivo(parking)}
                        title={isInactive ? 'Reactivar' : 'Desactivar'}
                        aria-label={isInactive ? 'Reactivar plaza' : 'Desactivar plaza'}
                        style={{ background: isInactive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${isInactive ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`, borderRadius: '10px', color: isInactive ? '#10b981' : '#f59e0b', cursor: 'pointer', padding: '8px 10px', fontSize: '0.9rem', transition: 'all 0.15s' }}
                      >
                        <i className={`fa-solid ${isInactive ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>

                      {/* Occupancy controls (only when active) */}
                      {!isInactive && (
                        <div className="occupancy-controls">
                          <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, -1)} disabled={parking.occupied_spots === 0} className="ctrl-btn minus">
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <strong>{parking.occupied_spots}</strong>
                          <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, 1)} disabled={isFull} className="ctrl-btn plus">
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dashboard-container { padding: 30px; position: relative; max-width: 1400px; margin: 0 auto; }

        /* Reservas recibidas */
        .reservas-recibidas { display: flex; flex-direction: column; gap: 12px; }
        .reserva-row { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 16px 18px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; flex-wrap: wrap; }
        .reserva-row:hover { border-color: rgba(59, 130, 246, 0.3); }
        .reserva-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .reserva-info strong { color: white; font-size: 1.05rem; }
        .reserva-info span { color: #94a3b8; font-size: 0.85rem; }
        .reserva-acts { display: flex; align-items: center; gap: 10px; }
        .estado-badge { display: inline-block; width: fit-content; padding: 2px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .estado-pendiente { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .estado-confirmada { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .estado-activa { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .estado-completada { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
        .estado-cancelada { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; flex-wrap: wrap; gap: 20px; }
        .header-titles h2 { font-size: 2.2rem; color: #3b82f6; margin: 0; font-weight: 900; letter-spacing: -1px; }
        .header-titles p { color: #94a3b8; margin: 5px 0 0 0; font-size: 0.95rem; font-weight: 600; }
        
        
        .toast-notification { position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 10px; z-index: 9999; animation: slideLeft 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .toast-notification.success { background: #10b981; color: white; border: 2px solid #059669; }
        .toast-notification.error { background: #ef4444; color: white; border: 2px solid #b91c1c; }
        .toast-notification.syncing { background: #3b82f6; color: white; border: 2px solid #2563eb; }
        
        .dashboard-grid { display: flex; gap: 30px; align-items: flex-start; flex-wrap: wrap; }
        
        /* KPI METRICS */
        .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; width: 100%; }
        .kpi-card { display: flex; align-items: center; gap: 15px; padding: 18px 20px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; transition: 0.3s; }
        .kpi-card:hover { border-color: rgba(59, 130, 246, 0.2); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .kpi-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
        .kpi-icon.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
        .kpi-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .kpi-icon.amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .kpi-icon.purple { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
        .kpi-data { display: flex; flex-direction: column; }
        .kpi-value { font-size: 1.6rem; font-weight: 900; color: white; line-height: 1; }
        .kpi-label { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-top: 3px; }
        
        .form-panel { flex: 1; min-width: 0; padding: 30px; }
        .form-panel h3 { margin: 0 0 5px 0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; }
        .panel-desc { color: #64748b; font-size: 0.85rem; margin-bottom: 25px; }
        
        .create-form { display: flex; flex-direction: column; gap: 20px; width: 100%; }
        .form-block { display: flex; flex-direction: column; gap: 15px; }
        .input-row { display: flex; flex-direction: column; gap: 15px; width: 100%; }
        .input-group { position: relative; width: 100%; background: rgba(0,0,0,0.4); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); transition: 0.3s; }
        .input-group:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .input-group .icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b; }
        .input-group input { width: 100%; padding: 15px 15px 15px 45px; background: transparent; border: none; color: white; outline: none; }
        
        .search-group { display: flex; flex-direction: row; padding-right: 5px; }
        .btn-search { background: #3b82f6; color: white; border: none; border-radius: 8px; margin: 5px; padding: 0 15px; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .btn-search:hover { background: #2563eb; }
        
        .map-container { height: 350px; width: 100%; border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); }
        
        .checkbox-pmr { display: flex; align-items: center; gap: 12px; background: rgba(56, 189, 248, 0.1); padding: 15px; border-radius: 12px; cursor: pointer; border: 1px solid rgba(56, 189, 248, 0.2); transition: 0.3s; }
        .checkbox-pmr:hover { background: rgba(56, 189, 248, 0.15); }
        .checkbox-pmr span { color: white; font-size: 0.95rem; font-weight: 700; }
        .checkbox-pmr i { color: #38bdf8; margin-right: 8px; }
        
        .submit-btn { padding: 18px; font-size: 1.1rem; border-radius: 12px; margin-top: 10px; }
        
        .inventory-panel { flex: 1.2; min-width: 0; }
        .inventory-header { display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.6); padding: 20px; border-radius: 16px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; gap: 15px; }
        .inventory-header h3 { margin: 0; display: flex; align-items: center; gap: 10px; }
        .inventory-actions { display: flex; gap: 10px; }
        .action-btn { padding: 8px 15px; font-size: 0.85rem; }
        .btn-delete-bulk { padding: 8px 15px; font-size: 0.85rem; background: #dc2626; border: none; border-radius: 12px; color: white; cursor: pointer; font-weight: 900; transition: 0.3s; }
        .btn-delete-bulk:hover { background: #b91c1c; box-shadow: 0 5px 15px rgba(220, 38, 38, 0.3); }
        
        .empty-state { text-align: center; padding: 60px 20px; color: #64748b; }
        .empty-state i { font-size: 3rem; margin-bottom: 20px; opacity: 0.5; }
        .empty-state p { font-weight: 700; }
        
        .parking-list { display: flex; flex-direction: column; gap: 15px; }
        .parking-item { display: flex; justify-content: space-between; align-items: center; padding: 20px; transition: 0.3s; }
        .parking-item.selected { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
        .parking-item.inactive-parking { opacity: 0.55; border-color: rgba(100,116,139,0.2); }
        .parking-item:hover { transform: translateX(5px); }
        
        .item-info { display: flex; align-items: center; gap: 20px; }
        .custom-checkbox { width: 20px; height: 20px; accent-color: #ef4444; cursor: pointer; }
        .item-info h4 { margin: 0 0 8px 0; font-size: 1.2rem; font-weight: 800; display: flex; align-items: center; }
        .pmr-icon { color: #38bdf8; margin-left: 10px; font-size: 0.9rem; }
        
        .status-badges { display: flex; gap: 10px; align-items: center; }
        .badge { font-size: 0.7rem; padding: 4px 10px; border-radius: 6px; font-weight: 900; }
        .badge.green { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .badge.red { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .spots-info { color: #94a3b8; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 5px; }
        
        .occupancy-controls { display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.5); padding: 8px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); }
        .ctrl-btn { background: transparent; border: none; font-size: 1.2rem; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; }
        .ctrl-btn.minus { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .ctrl-btn.plus { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .occupancy-controls strong { font-size: 1.4rem; color: white; min-width: 25px; text-align: center; }
        
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease; }
        .modal-content { padding: 30px; max-width: 400px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(15, 23, 42, 0.95); }
        .modal-content h3 { margin-top: 0; color: white; font-size: 1.4rem; }
        .modal-content p { color: #94a3b8; margin: 20px 0; }
        .modal-actions { display: flex; gap: 15px; justify-content: center; }
        .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 10px 20px; border-radius: 12px; cursor: pointer; transition: 0.3s; font-weight: 700; }
        .btn-cancel:hover { background: rgba(255,255,255,0.1); }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        
        /* RESPONSIVIDAD MOBILE */
        @media (max-width: 1000px) {
          .dashboard-grid { flex-direction: column; }
          .form-panel, .inventory-panel { width: 100%; flex: none; }
        }
        
        @media (max-width: 600px) {
          .dashboard-container { padding: 15px; }
          .form-panel { padding: 20px; }
          .responsive-row { flex-direction: column; }
          .parking-item { flex-direction: column; align-items: flex-start; gap: 15px; }
          .occupancy-controls { width: 100%; justify-content: space-between; }
          .kpi-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}