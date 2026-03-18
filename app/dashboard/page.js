'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MiniMapComponent = dynamic(() => import('../../components/MiniMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando satélite...</div>
});

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [myParkings, setMyParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [totalSpots, setTotalSpots] = useState(1);

  // INNOVACIÓN: Estado para Selección Múltiple
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
    if (!direccion.trim()) {
      showToast("Escribe una dirección primero.", "error");
      return;
    }
    showToast("Buscando coordenadas...", "success");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', Chile')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(data[0].lat);
        setLng(data[0].lon);
        showToast("¡Dirección ubicada en el mapa!", "success");
      } else {
        showToast("No se encontró la dirección. Intenta agregar la comuna.", "error");
      }
    } catch (error) {
      showToast("Error de conexión al buscar.", "error");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!lat || !lng) {
      showToast("Busca una dirección o usa el mapa para fijar el pin rojo.", "error");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const nombreArrendador = userData.user.user_metadata?.nombre_completo || userData.user.email.split('@')[0]; 

    const { data, error } = await supabase.from('estacionamientos').insert([
      {
        nombre,
        arrendador: nombreArrendador,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        total_spots: parseInt(totalSpots),
        occupied_spots: 0,
        user_id: userData.user.id 
      }
    ]).select();

    if (!error && data) {
      setMyParkings([data[0], ...myParkings]);
      setNombre(''); setDireccion(''); setLat(''); setLng(''); setTotalSpots(1);
      showToast("¡Espacio publicado con éxito!", "success");
    } else {
      showToast("Error en base de datos: " + error.message, "error");
    }
  };

  const updateOccupancy = async (id, currentOccupied, total, change) => {
    const newOccupied = currentOccupied + change;
    if (newOccupied < 0 || newOccupied > total) return;
    setMyParkings(myParkings.map(p => p.id === id ? { ...p, occupied_spots: newOccupied } : p));
    await supabase.from('estacionamientos').update({ occupied_spots: newOccupied }).eq('id', id);
  };

  // INNOVACIÓN: Manejo de Selección Múltiple
  const toggleSelection = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === myParkings.length) {
      setSelectedIds([]); // Deseleccionar todos
    } else {
      setSelectedIds(myParkings.map(p => p.id)); // Seleccionar todos
    }
  };

  // INNOVACIÓN: Función de Eliminación Masiva Real
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const confirmacion = window.confirm(`¿Estás seguro de ELIMINAR ${selectedIds.length} estacionamiento(s)? Esta acción no se puede deshacer.`);
    if (!confirmacion) return;

    // Supabase soporta borrar múltiples IDs de una sola vez usando .in()
    const { error } = await supabase.from('estacionamientos').delete().in('id', selectedIds);
    
    if (!error) {
      setMyParkings(myParkings.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]); // Limpiamos la selección
      showToast(`${selectedIds.length} espacio(s) eliminado(s) correctamente.`, "success");
    } else {
      showToast("No se pudo eliminar: " + error.message, "error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin"></i> Inicializando tu base de mando...</div>;

  return (
    <section className="view-content" style={{ padding: '20px', position: 'relative' }}>
      
      {toast && (
        <div id="toast-container">
          <div className={`toast ${toast.type}`}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0 }}><i className="fa-solid fa-layer-group"></i> Panel de Control</h2>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Administración centralizada de tus espacios.</p>
        </div>
        <button onClick={handleLogout} className="btn-outline" style={{ width: 'auto', padding: '10px 20px', borderColor: 'var(--status-red)', color: 'var(--status-red)' }}>
          <i className="fa-solid fa-right-from-bracket"></i> Salir
        </button>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* COLUMNA IZQUIERDA: Formulario con Mapa Gigante */}
        <div className="glass-panel" style={{ flex: '1', minWidth: '380px', height: 'fit-content' }}>
          <h3><i className="fa-solid fa-location-dot"></i> Nuevo Espacio</h3>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <i className="fa-solid fa-magnifying-glass-location"></i>
                <input type="text" placeholder="Ej: Avenida Falsa 123, Comuna" value={direccion} onChange={e => setDireccion(e.target.value)} />
              </div>
              <button type="button" onClick={handleSearchAddress} className="btn-primary" style={{ width: 'auto', padding: '0 20px' }} title="Buscar en Satélite">
                <i className="fa-solid fa-satellite-dish"></i>
              </button>
            </div>

            {/* INNOVACIÓN: Contenedor del mapa expandido a 350px */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
              <div style={{ height: '350px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                <MiniMapComponent lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                <span>LAT: {lat || 'Pendiente'}</span>
                <span>LNG: {lng || 'Pendiente'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 2 }}>
                <i className="fa-solid fa-signature"></i>
                <input type="text" placeholder="Nombre Comercial" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <i className="fa-solid fa-car-side"></i>
                <input type="number" min="1" placeholder="Cupos" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} required />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" style={{ padding: '15px', fontSize: '1.1rem' }}>
              <i className="fa-solid fa-cloud-arrow-up"></i> Publicar en la Red
            </button>
          </form>
        </div>

        {/* COLUMNA DERECHA: Lista con Selección Masiva */}
        <div style={{ flex: '1.2', minWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}><i className="fa-solid fa-list-check"></i> Inventario</h3>
            
            {/* Panel de Acciones en Lote (Solo visible si hay algo seleccionado) */}
            {myParkings.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={selectAll} className="btn-outline" style={{ padding: '5px 15px', fontSize: '0.8rem', width: 'auto' }}>
                  {selectedIds.length === myParkings.length ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                </button>
                {selectedIds.length > 0 && (
                  <button onClick={handleBulkDelete} className="btn-primary" style={{ padding: '5px 15px', fontSize: '0.8rem', width: 'auto', background: 'var(--status-red)' }}>
                    <i className="fa-solid fa-trash-can"></i> Borrar ({selectedIds.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {myParkings.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fa-solid fa-ghost" style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.1)', marginBottom: '15px' }}></i>
              <p style={{ color: 'var(--text-muted)' }}>No tienes estacionamientos registrados en el sistema.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myParkings.map(parking => {
                const isFull = parking.occupied_spots >= parking.total_spots;
                const isSelected = selectedIds.includes(parking.id);

                return (
                  <div key={parking.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', border: isSelected ? '2px solid var(--status-red)' : '1px solid rgba(255,255,255,0.1)', transition: '0.2s', background: isSelected ? 'rgba(239, 68, 68, 0.05)' : '' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {/* Casilla de Selección */}
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(parking.id)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--status-red)' }}
                      />
                      
                      <div>
                        <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem' }}>{parking.nombre}</h4>
                        <span className={`badge ${isFull ? '' : 'green'}`} style={{ backgroundColor: isFull ? 'rgba(239, 68, 68, 0.2)' : '', color: isFull ? 'var(--status-red)' : '', display: 'inline-block', marginTop: '5px' }}>
                          {isFull ? 'Lleno' : 'Disponible'} ({parking.total_spots} cupos)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '8px 15px', borderRadius: '10px' }}>
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, -1)} disabled={parking.occupied_spots === 0} style={{ background: 'transparent', border: 'none', color: parking.occupied_spots === 0 ? 'var(--text-muted)' : 'var(--status-green)', fontSize: '1.5rem', cursor: parking.occupied_spots === 0 ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-square-minus"></i></button>
                      <div style={{ textAlign: 'center', minWidth: '40px' }}>
                        <strong style={{ fontSize: '1.3rem', color: 'white' }}>{parking.occupied_spots}</strong>
                      </div>
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, 1)} disabled={isFull} style={{ background: 'transparent', border: 'none', color: isFull ? 'var(--text-muted)' : 'var(--status-red)', fontSize: '1.5rem', cursor: isFull ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-square-plus"></i></button>
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