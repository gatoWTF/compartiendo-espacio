'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MiniMapComponent = dynamic(() => import('../../components/MiniMap'), { 
  ssr: false,
  loading: () => <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>Cargando mapa...</div>
});

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [myParkings, setMyParkings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState(''); // INNOVACIÓN: Nuevo estado para la dirección escrita
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [totalSpots, setTotalSpots] = useState(1);

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

  // INNOVACIÓN: Convertir dirección de texto a coordenadas (Geocoding)
  const handleSearchAddress = async () => {
    if (!direccion.trim()) {
      showToast("Escribe una dirección primero.", "error");
      return;
    }

    showToast("Buscando dirección...", "success");
    try {
      // Usamos la API gratuita de Nominatim (OpenStreetMap)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', Chile')}`);
      const data = await res.json();

      if (data && data.length > 0) {
        setLat(data[0].lat);
        setLng(data[0].lon);
        showToast("¡Dirección encontrada en el mapa!", "success");
      } else {
        showToast("No encontramos la dirección. Intenta añadir la comuna (Ej: Arturo Prat 123, Santiago).", "error");
      }
    } catch (error) {
      showToast("Hubo un error al buscar la dirección.", "error");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!lat || !lng) {
      showToast("Por favor, busca una dirección o usa el mapa para fijar la ubicación.", "error");
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
      showToast("¡Estacionamiento publicado con éxito!", "success");
    } else {
      showToast("Error al crear: " + error.message, "error");
    }
  };

  const updateOccupancy = async (id, currentOccupied, total, change) => {
    const newOccupied = currentOccupied + change;
    if (newOccupied < 0 || newOccupied > total) return;
    setMyParkings(myParkings.map(p => p.id === id ? { ...p, occupied_spots: newOccupied } : p));
    await supabase.from('estacionamientos').update({ occupied_spots: newOccupied }).eq('id', id);
  };

  // INNOVACIÓN: Función para Eliminar Estacionamiento
  const handleDelete = async (id) => {
    const confirmacion = window.confirm("¿Estás seguro de que deseas borrar este estacionamiento del mapa?");
    if (!confirmacion) return;

    const { error } = await supabase.from('estacionamientos').delete().eq('id', id);
    
    if (!error) {
      setMyParkings(myParkings.filter(p => p.id !== id));
      showToast("Estacionamiento eliminado permanentemente.", "success");
    } else {
      showToast("No se pudo eliminar: " + error.message, "error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin"></i> Cargando tu espacio...</div>;

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
          <h2 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0 }}><i className="fa-solid fa-chart-line"></i> Mi Panel</h2>
          <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Gestiona la disponibilidad de tus espacios en tiempo real.</p>
        </div>
        <button onClick={handleLogout} className="btn-outline" style={{ width: 'auto', padding: '10px 20px', borderColor: 'var(--status-red)', color: 'var(--status-red)' }}>
          <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
        </button>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* FORMULARIO MEJORADO CON BÚSQUEDA DE DIRECCIÓN */}
        <div className="glass-panel" style={{ flex: '1', minWidth: '350px', height: 'fit-content' }}>
          <h3><i className="fa-solid fa-plus"></i> Publicar Espacio</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>Añade un nuevo estacionamiento al mapa.</p>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* BUSCADOR DE DIRECCIÓN */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <i className="fa-solid fa-map-location"></i>
                <input 
                  type="text" 
                  placeholder="Calle, Número, Comuna..." 
                  value={direccion} 
                  onChange={e => setDireccion(e.target.value)} 
                />
              </div>
              <button type="button" onClick={handleSearchAddress} className="btn-primary" style={{ width: 'auto', padding: '0 20px' }}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ height: '200px', width: '100%', marginBottom: '10px' }}>
                <MiniMapComponent lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                Verifica en el mapa que la ubicación sea correcta (puedes hacer clic para ajustarla).
              </p>
            </div>

            <div className="input-group">
              <i className="fa-solid fa-tag"></i>
              <input type="text" placeholder="Nombre (Ej: Estacionamiento Casa)" value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>

            <div className="input-group">
              <i className="fa-solid fa-car"></i>
              <input type="number" min="1" placeholder="Capacidad Total de Autos" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} required />
            </div>
            
            <button type="submit" className="btn-primary"><i className="fa-solid fa-paper-plane"></i> Publicar Estacionamiento</button>
          </form>
        </div>

        {/* LISTA CON BOTÓN DE ELIMINAR */}
        <div style={{ flex: '2', minWidth: '400px' }}>
          <h3>Tus Espacios Activos</h3>
          {myParkings.length === 0 ? (
            <div className="glass-panel" style={{ marginTop: '15px', textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-car-tunnel" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '15px' }}></i>
              <p>Aún no tienes estacionamientos publicados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              {myParkings.map(parking => {
                const isFull = parking.occupied_spots >= parking.total_spots;
                return (
                  <div key={parking.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ color: 'var(--primary)', margin: 0 }}>{parking.nombre}</h4>
                        {/* Botón de Eliminar */}
                        <button 
                          onClick={() => handleDelete(parking.id)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--status-red)', cursor: 'pointer', padding: '5px' }}
                          title="Eliminar estacionamiento"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '5px 0' }}>Capacidad: {parking.total_spots} vehículos</p>
                      <span className={`badge ${isFull ? '' : 'green'}`} style={{ backgroundColor: isFull ? 'rgba(239, 68, 68, 0.2)' : '', color: isFull ? 'var(--status-red)' : '' }}>
                        {isFull ? 'Lleno' : 'Disponible'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, -1)} disabled={parking.occupied_spots === 0} style={{ background: 'transparent', border: 'none', color: parking.occupied_spots === 0 ? 'var(--text-muted)' : 'var(--status-green)', fontSize: '1.5rem', cursor: parking.occupied_spots === 0 ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-circle-minus"></i></button>
                      <div style={{ textAlign: 'center', minWidth: '60px' }}>
                        <strong style={{ fontSize: '1.5rem', color: 'white' }}>{parking.occupied_spots}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OCUPADOS</div>
                      </div>
                      <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, 1)} disabled={isFull} style={{ background: 'transparent', border: 'none', color: isFull ? 'var(--text-muted)' : 'var(--status-red)', fontSize: '1.5rem', cursor: isFull ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-circle-plus"></i></button>
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