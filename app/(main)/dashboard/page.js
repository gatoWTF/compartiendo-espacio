'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase'; 
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// RUTA ARREGLADA (3 NIVELES)
const MiniMapComponent = dynamic(() => import('../../../components/MiniMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', animation: 'pulse 2s infinite' }}>
      <i className="fa-solid fa-satellite-dish" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '10px' }}></i>
      <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Conectando con el satélite...</span>
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setSession(session);

      const { data, error } = await supabase
        .from('estacionamientos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error) setMyParkings(data || []);
      setLoading(false);
    };

    checkUserAndFetchData();
  }, [router]);

  const handleSearchAddress = async () => {
    if (!direccion.trim()) { showToast("Escribe una dirección primero.", "error"); return; }
    showToast("Buscando coordenadas...", "success");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', Chile')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(data[0].lat); setLng(data[0].lon); showToast("¡Dirección ubicada!", "success");
      } else { showToast("No se encontró. Agrega la comuna.", "error"); }
    } catch (error) { showToast("Error de conexión.", "error"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!lat || !lng) { showToast("Fija el pin rojo en el mapa.", "error"); return; }

    const { data: userData } = await supabase.auth.getUser();
    const nombreArrendador = userData.user.user_metadata?.nombre_completo || userData.user.email.split('@')[0]; 

    const { data, error } = await supabase.from('estacionamientos').insert([{
      nombre, arrendador: nombreArrendador, lat: parseFloat(lat), lng: parseFloat(lng),
      total_spots: parseInt(totalSpots), occupied_spots: 0, user_id: userData.user.id 
    }]).select();

    if (!error && data) {
      setMyParkings([data[0], ...myParkings]);
      setNombre(''); setDireccion(''); setLat(''); setLng(''); setTotalSpots(1);
      showToast("¡Espacio publicado!", "success");
    } else { showToast("Error: " + error.message, "error"); }
  };

  const updateOccupancy = async (id, currentOccupied, total, change) => {
    const newOccupied = currentOccupied + change;
    if (newOccupied < 0 || newOccupied > total) return;
    setMyParkings(myParkings.map(p => p.id === id ? { ...p, occupied_spots: newOccupied } : p));
    await supabase.from('estacionamientos').update({ occupied_spots: newOccupied }).eq('id', id);
  };

  const toggleSelection = (id) => selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(i => i !== id)) : setSelectedIds([...selectedIds, id]);
  const selectAll = () => selectedIds.length === myParkings.length ? setSelectedIds([]) : setSelectedIds(myParkings.map(p => p.id));

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmacion = window.confirm(`¿Seguro de ELIMINAR ${selectedIds.length} estacionamiento(s)?`);
    if (!confirmacion) return;

    const { error } = await supabase.from('estacionamientos').delete().in('id', selectedIds);
    if (!error) {
      setMyParkings(myParkings.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]); showToast(`${selectedIds.length} espacio(s) eliminado(s).`, "success");
    } else { showToast("Error al eliminar", "error"); }
  };

  if (loading) return <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '20px' }}></i><h3>Inicializando tu base de mando...</h3></div>;

  return (
    <section className="view-content" style={{ padding: '20px', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{__html: ` @keyframes fadeInSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animated-card { animation: fadeInSlide 0.4s ease-out forwards; } .hover-elevate { transition: all 0.3s ease; } .hover-elevate:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.5); border-color: rgba(59, 130, 246, 0.3) !important; } `}} />

      {toast && (
        <div id="toast-container" style={{ animation: 'fadeInSlide 0.3s ease-out' }}>
          <div className={`toast ${toast.type}`} style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i><span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="dashboard-header animated-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
        <div><h2 style={{ fontSize: '2.2rem', color: 'var(--primary)', margin: 0, fontWeight: '800' }}><i className="fa-solid fa-layer-group"></i> Panel de Control</h2><p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0', fontSize: '1.05rem' }}>Administración centralizada de tus espacios.</p></div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="glass-panel animated-card hover-elevate" style={{ flex: '1', minWidth: '380px', height: 'fit-content' }}>
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px', marginBottom: '20px' }}><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i> Nuevo Espacio</h3>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="input-group" style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }}>
                <i className="fa-solid fa-magnifying-glass-location"></i>
                <input type="text" placeholder="Ej: Avenida Falsa 123, Comuna" value={direccion} onChange={e => setDireccion(e.target.value)} />
              </div>
              <button type="button" onClick={handleSearchAddress} className="btn-primary" style={{ width: 'auto', padding: '0 15px', borderRadius: '10px' }}><i className="fa-solid fa-search"></i></button>
              
              <button type="button" onClick={() => {
                if (!navigator.geolocation) { showToast("Tu navegador no soporta geolocalización.", "error"); return; }
                showToast("Detectando tu ubicación...", "success");
                navigator.geolocation.getCurrentPosition(async (position) => {
                  const { latitude, longitude } = position.coords;
                  setLat(latitude); setLng(longitude);
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if(data && data.display_name) { setDireccion(data.display_name); showToast("¡Ubicación fijada con éxito!", "success"); }
                  } catch (e) { showToast("Ubicación fijada en el mapa.", "success"); }
                }, () => showToast("Permiso de ubicación denegado.", "error"));
              }} className="btn-outline hover-elevate" style={{ width: 'auto', padding: '0 15px', borderRadius: '10px', borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}><i className="fa-solid fa-location-crosshairs"></i></button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ height: '350px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}><MiniMapComponent lat={lat} lng={lng} setLat={setLat} setLng={setLng} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}><span>LAT: {lat ? Number(lat).toFixed(6) : 'Pendiente'}</span><span>LNG: {lng ? Number(lng).toFixed(6) : 'Pendiente'}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 2, background: 'rgba(0,0,0,0.3)' }}><i className="fa-solid fa-signature"></i><input type="text" placeholder="Nombre Comercial" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
              <div className="input-group" style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }}><i className="fa-solid fa-car-side"></i><input type="number" min="1" placeholder="Cupos" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} required /></div>
            </div>
            
            <button type="submit" className="btn-primary hover-elevate" style={{ padding: '16px', fontSize: '1.1rem', borderRadius: '10px', fontWeight: 'bold' }}><i className="fa-solid fa-cloud-arrow-up"></i> Publicar en la Red</button>
          </form>
        </div>

        {/* COLUMNA DERECHA: Inventario */}
        <div style={{ flex: '1.2', minWidth: '400px' }} className="animated-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'rgba(30, 41, 59, 0.4)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: 0 }}><i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i> Inventario</h3>
            {myParkings.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={selectAll} className="btn-outline hover-elevate" style={{ padding: '6px 15px', fontSize: '0.85rem', borderRadius: '8px' }}>{selectedIds.length === myParkings.length ? 'Desmarcar Todos' : 'Seleccionar Todos'}</button>
                {selectedIds.length > 0 && <button onClick={handleBulkDelete} className="btn-primary hover-elevate" style={{ padding: '6px 15px', fontSize: '0.85rem', background: '#dc2626', border: 'none', borderRadius: '8px' }}><i className="fa-solid fa-trash-can"></i> Borrar ({selectedIds.length})</button>}
              </div>
            )}
          </div>

          {myParkings.length === 0 ? (
             <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.1)' }}><i className="fa-solid fa-ghost" style={{ fontSize: '5rem', color: 'rgba(255,255,255,0.05)', marginBottom: '20px' }}></i><p style={{ color: 'var(--text-muted)' }}>No tienes estacionamientos registrados.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {myParkings.map((parking, index) => {
                const isFull = parking.occupied_spots >= parking.total_spots;
                const isSelected = selectedIds.includes(parking.id);
                return (
                  <div key={parking.id} className="glass-panel hover-elevate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: isSelected ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.08)', background: isSelected ? 'rgba(239, 68, 68, 0.05)' : 'rgba(15, 23, 42, 0.6)', animationDelay: `${index * 0.1}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(parking.id)} style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#ef4444' }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>{parking.nombre}</h4>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                          <span className={`badge ${isFull ? '' : 'green'}`} style={{ backgroundColor: isFull ? 'rgba(239, 68, 68, 0.2)' : '', color: isFull ? '#f87171' : '', padding: '4px 10px' }}>{isFull ? 'Lleno' : 'Disponible'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px' }}><i className="fa-solid fa-car" style={{ marginRight: '5px' }}></i> {parking.total_spots} cupos</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.4)', padding: '10px 18px', borderRadius: '12px' }}>
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, -1)} disabled={parking.occupied_spots === 0} style={{ background: 'transparent', border: 'none', color: parking.occupied_spots === 0 ? 'rgba(255,255,255,0.1)' : '#10b981', fontSize: '1.6rem', cursor: parking.occupied_spots === 0 ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-square-minus"></i></button>
                      <strong style={{ fontSize: '1.6rem', color: 'white', fontFamily: 'monospace' }}>{parking.occupied_spots}</strong>
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, 1)} disabled={isFull} style={{ background: 'transparent', border: 'none', color: isFull ? 'rgba(255,255,255,0.1)' : '#ef4444', fontSize: '1.6rem', cursor: isFull ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-square-plus"></i></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}