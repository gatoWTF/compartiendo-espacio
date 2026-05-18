// Archivo: apps/web/app/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '../../src/lib/api';

const MiniMapComponent = dynamic(() => import('../../components/MiniMap'), {
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
  const [isCloud, setIsCloud] = useState(false);
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [totalSpots, setTotalSpots] = useState(1);
  const [esPmr, setEsPmr] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    // Detectar si está en Vercel
    const url = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'localhost';
    if (url.includes('vercel.app') || window.location.hostname.includes('vercel.app')) {
      setIsCloud(true);
    }

    const checkUserAndFetchData = async () => {
      const userStr = window.localStorage.getItem('user');
      const token   = window.localStorage.getItem('access_token');

      if (!userStr || !token) {
        router.push('/auth');
        return;
      }

      const user = JSON.parse(userStr);
      setSession({ user, access_token: token });

      try {
        const result = await api.mapas.getMisEstacionamientos(user.id);
        if (result.success) setMyParkings(result.data || []);
      } catch (e) {
        console.error('Error cargando estacionamientos:', e);
      }

      setLoading(false);
    };
    checkUserAndFetchData();
  }, [router]);

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
    showToast('Sincronizando con Supabase Cloud...', 'syncing');

    try {
      const result = await api.mapas.crearEstacionamiento({
        nombre,
        arrendador: nombreArrendador,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        totalSpots: parseInt(totalSpots),
        esPmr,
        userId: session.user.id,
      });

      if (result.success && result.data) {
        setMyParkings([result.data, ...myParkings]);
        setNombre(''); setDireccion(''); setLat(''); setLng(''); setTotalSpots(1); setEsPmr(false);
        showToast('¡Espacio creado y guardado en Supabase DB!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al guardar en Supabase.', 'error');
    }
  };

  const updateOccupancy = async (id, currentOccupied, total, change) => {
    const newOccupied = currentOccupied + change;
    if (newOccupied < 0 || newOccupied > total) return;
    
    // Optimistic Update
    setMyParkings(myParkings.map(p => p.id === id ? { ...p, occupied_spots: newOccupied } : p));
    showToast('Sincronizando cupos...', 'syncing');

    try {
      const res = await api.mapas.actualizarOcupacion(id, newOccupied);
      if (res.success) {
        showToast('Cupos actualizados en la Nube', 'success');
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      // Revertir si falla
      setMyParkings(myParkings.map(p => p.id === id ? { ...p, occupied_spots: currentOccupied } : p));
      showToast('Error al actualizar en DB', 'error');
    }
  };

  const toggleSelection = (id) =>
    selectedIds.includes(id)
      ? setSelectedIds(selectedIds.filter(i => i !== id))
      : setSelectedIds([...selectedIds, id]);

  const selectAll = () =>
    selectedIds.length === myParkings.length
      ? setSelectedIds([])
      : setSelectedIds(myParkings.map(p => p.id));

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Seguro de ELIMINAR ${selectedIds.length} estacionamiento(s) de la base de datos?`)) return;

    showToast('Borrando de Supabase Cloud...', 'syncing');

    try {
      const result = await api.mapas.eliminarEstacionamientos(selectedIds);
      if (result.success) {
        setMyParkings(myParkings.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        showToast(`${selectedIds.length} nodo(s) eliminado(s) de Supabase.`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al eliminar.', 'error');
    }
  };

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
      <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
      <h3 style={{ color: '#94a3b8' }}>Conectando a Microservicios...</h3>
    </div>
  );

  return (
    <section className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-titles">
          <h2>Panel de Control</h2>
          <p>Hola, {session?.user?.nombre || session?.user?.email}</p>
        </div>
        
        <div className="infra-badges">
          <div className="infra-badge db">
            <span className="dot pulse-green"></span> Supabase DB: Conectado
          </div>
          {isCloud && (
            <div className="infra-badge cloud">
              <i className="fa-solid fa-cloud"></i> Vercel Edge: Activo
            </div>
          )}
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

      <div className="dashboard-grid">
        {/* FORMULARIO NUEVO ESPACIO */}
        <div className="glass-panel form-panel">
          <h3><i className="fa-solid fa-satellite-dish"></i> Desplegar Nuevo Nodo</h3>
          <p className="panel-desc">Añade tu espacio a la red descentralizada de estacionamientos.</p>
          
          <form onSubmit={handleCreate} className="create-form">
            <div className="input-row">
              <div className="input-group search-group">
                <i className="fa-solid fa-map-pin icon"></i>
                <input type="text" placeholder="Ej: Avenida Falsa 123" value={direccion} onChange={e => setDireccion(e.target.value)} />
                <button type="button" onClick={handleSearchAddress} className="btn-search">UBICAR</button>
              </div>
            </div>
            
            <div className="map-container">
              <MiniMapComponent lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
            </div>
            
            <div className="input-row responsive-row">
              <div className="input-group">
                <i className="fa-solid fa-signature icon"></i>
                <input type="text" placeholder="Nombre de la Plaza" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div className="input-group small">
                <i className="fa-solid fa-car icon"></i>
                <input type="number" min="1" placeholder="Cupos" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} required />
              </div>
            </div>
            
            <label className="checkbox-pmr">
              <input type="checkbox" checked={esPmr} onChange={e => setEsPmr(e.target.checked)} />
              <span>
                <i className="fa-solid fa-wheelchair"></i>
                Habilitar Zona Prioritaria PMR
              </span>
            </label>
            
            <button type="submit" className="btn-cyber-primary submit-btn">
              <i className="fa-solid fa-cloud-arrow-up"></i> PUBLICAR EN SUPABASE
            </button>
          </form>
        </div>

        {/* INVENTARIO */}
        <div className="inventory-panel">
          <div className="inventory-header">
            <h3><i className="fa-solid fa-server"></i> Nodos Publicados ({myParkings.length})</h3>
            {myParkings.length > 0 && (
              <div className="inventory-actions">
                <button onClick={selectAll} className="btn-cyber-secondary action-btn">
                  {selectedIds.length === myParkings.length ? 'Desmarcar' : 'Seleccionar'}
                </button>
                {selectedIds.length > 0 && (
                  <button onClick={handleBulkDelete} className="btn-delete-bulk">
                    <i className="fa-solid fa-trash"></i> Borrar ({selectedIds.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {myParkings.length === 0 ? (
            <div className="glass-panel empty-state">
              <i className="fa-solid fa-network-wired"></i>
              <p>Tu red está vacía. ¡Despliega tu primer nodo!</p>
            </div>
          ) : (
            <div className="parking-list">
              {myParkings.map((parking) => {
                const isFull = parking.occupied_spots >= parking.total_spots;
                const isSelected = selectedIds.includes(parking.id);
                return (
                  <div key={parking.id} className={`glass-panel parking-item ${isSelected ? 'selected' : ''}`}>
                    <div className="item-info">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(parking.id)} className="custom-checkbox" />
                      <div>
                        <h4>
                          {parking.nombre}
                          {parking.es_pmr && <i className="fa-solid fa-wheelchair pmr-icon"></i>}
                        </h4>
                        <div className="status-badges">
                          <span className={`badge ${isFull ? 'red' : 'green'}`}>{isFull ? 'LLENO' : 'DISPONIBLE'}</span>
                          <span className="spots-info"><i className="fa-solid fa-car-side"></i> {parking.occupied_spots}/{parking.total_spots} ocupados</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="occupancy-controls">
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, -1)} disabled={parking.occupied_spots === 0} className="ctrl-btn minus">
                        <i className="fa-solid fa-minus"></i>
                      </button>
                      <strong>{parking.occupied_spots}</strong>
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, 1)} disabled={isFull} className="ctrl-btn plus">
                        <i className="fa-solid fa-plus"></i>
                      </button>
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
        
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; flex-wrap: wrap; gap: 20px; }
        .header-titles h2 { font-size: 2.2rem; color: #3b82f6; margin: 0; font-weight: 900; letter-spacing: -1px; }
        .header-titles p { color: #94a3b8; margin: 5px 0 0 0; font-size: 0.95rem; font-weight: 600; }
        
        .infra-badges { display: flex; gap: 10px; flex-wrap: wrap; }
        .infra-badge { padding: 6px 12px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.75rem; color: #94a3b8; display: flex; align-items: center; gap: 8px; font-weight: 800; }
        .infra-badge.db { border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
        .infra-badge.cloud { border-color: rgba(59, 130, 246, 0.3); color: #3b82f6; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .pulse-green { background: #10b981; box-shadow: 0 0 10px #10b981; animation: pulse 2s infinite; }
        
        .toast-notification { position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 10px; z-index: 9999; animation: slideLeft 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .toast-notification.success { background: #10b981; color: white; border: 2px solid #059669; }
        .toast-notification.error { background: #ef4444; color: white; border: 2px solid #b91c1c; }
        .toast-notification.syncing { background: #3b82f6; color: white; border: 2px solid #2563eb; }
        
        .dashboard-grid { display: flex; gap: 30px; align-items: flex-start; }
        
        .form-panel { flex: 1; min-width: 0; padding: 30px; }
        .form-panel h3 { margin: 0 0 5px 0; font-size: 1.4rem; display: flex; align-items: center; gap: 10px; }
        .panel-desc { color: #64748b; font-size: 0.85rem; margin-bottom: 25px; }
        
        .create-form { display: flex; flexDirection: column; gap: 15px; }
        .input-row { display: flex; gap: 15px; width: 100%; }
        .input-group { position: relative; flex: 1; background: rgba(0,0,0,0.4); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); transition: 0.3s; }
        .input-group:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .input-group .icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b; }
        .input-group input { width: 100%; padding: 15px 15px 15px 45px; background: transparent; border: none; color: white; outline: none; }
        
        .search-group { display: flex; padding-right: 5px; }
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
        
        .parking-list { display: flex; flexDirection: column; gap: 15px; }
        .parking-item { display: flex; justify-content: space-between; align-items: center; padding: 20px; transition: 0.3s; }
        .parking-item.selected { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
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
        }
      `}</style>
    </section>
  );
}