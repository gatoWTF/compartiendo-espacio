'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@parkings/supabase-db'; // RUTA CORREGIDA
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MiniMapComponent = dynamic(() => import('../../components/MiniMap'), { // RUTA CORREGIDA
  ssr: false,
  loading: () => (
    <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
      <i className="fa-solid fa-satellite-dish" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setSession(session);

      const { data, error } = await supabase.from('estacionamientos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (!error) setMyParkings(data || []);
      setLoading(false);
    };
    checkUserAndFetchData();
  }, [router]);

  const handleSearchAddress = async () => {
    if (!direccion.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion + ', Chile')}`);
      const data = await res.json();
      if (data && data.length > 0) { setLat(data[0].lat); setLng(data[0].lon); showToast("¡Dirección ubicada!", "success"); } 
    } catch (error) { showToast("Error de conexión.", "error"); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!lat || !lng) { showToast("Fija el pin rojo en el mapa.", "error"); return; }
    const { data: userData } = await supabase.auth.getUser();
    const nombreArrendador = userData.user.user_metadata?.nombre_completo || userData.user.email.split('@')[0]; 

    const { data, error } = await supabase.from('estacionamientos').insert([{
      nombre, arrendador: nombreArrendador, lat: parseFloat(lat), lng: parseFloat(lng), total_spots: parseInt(totalSpots), occupied_spots: 0, user_id: userData.user.id, es_pmr: esPmr, ubicacion: `SRID=4326;POINT(${parseFloat(lng)} ${parseFloat(lat)})`
    }]).select();

    if (!error && data) {
      setMyParkings([data[0], ...myParkings]);
      setNombre(''); setDireccion(''); setLat(''); setLng(''); setTotalSpots(1); setEsPmr(false);
      showToast("¡Espacio publicado con éxito!", "success");
    }
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
    if (!error) { setMyParkings(myParkings.filter(p => !selectedIds.includes(p.id))); setSelectedIds([]); showToast(`${selectedIds.length} espacio(s) eliminado(s).`, "success"); }
  };

  if (loading) return <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}><i className="fa-solid fa-circle-notch fa-spin"></i></div>;

  return (
    <section className="view-content" style={{ padding: '20px', position: 'relative' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
        <div><h2 style={{ fontSize: '2.2rem', color: 'var(--primary)', margin: 0, fontWeight: '800' }}> Panel de Control</h2></div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ flex: '1', minWidth: '380px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px' }}>Nuevo Espacio</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="input-group" style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }}>
                <input type="text" placeholder="Ej: Avenida Falsa 123" value={direccion} onChange={e => setDireccion(e.target.value)} />
              </div>
              <button type="button" onClick={handleSearchAddress} className="btn-primary" style={{ width: 'auto', padding: '0 15px', borderRadius: '10px' }}>Buscar</button>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '12px' }}>
              <div style={{ height: '350px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}><MiniMapComponent lat={lat} lng={lng} setLat={setLat} setLng={setLng} /></div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 2, background: 'rgba(0,0,0,0.3)' }}><input type="text" placeholder="Nombre Comercial" value={nombre} onChange={e => setNombre(e.target.value)} required /></div>
              <div className="input-group" style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }}><input type="number" min="1" placeholder="Cupos" value={totalSpots} onChange={e => setTotalSpots(e.target.value)} required /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={esPmr} onChange={(e) => setEsPmr(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <span style={{ color: 'white', fontSize: '0.95rem' }}> Zona Prioritaria PMR</span>
            </label>
            <button type="submit" className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem', borderRadius: '10px', fontWeight: 'bold' }}>Publicar en la Red</button>
          </form>
        </div>

        <div style={{ flex: '1.2', minWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'rgba(30, 41, 59, 0.4)', padding: '15px 20px', borderRadius: '12px' }}>
            <h3 style={{ margin: 0 }}>Inventario</h3>
            {myParkings.length > 0 && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={selectAll} className="btn-outline" style={{ padding: '6px 15px', fontSize: '0.85rem', borderRadius: '8px' }}>{selectedIds.length === myParkings.length ? 'Desmarcar' : 'Seleccionar Todos'}</button>
                {selectedIds.length > 0 && <button onClick={handleBulkDelete} className="btn-primary" style={{ padding: '6px 15px', fontSize: '0.85rem', background: '#dc2626', border: 'none', borderRadius: '8px' }}>Borrar ({selectedIds.length})</button>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {myParkings.map((parking) => {
              const isFull = parking.occupied_spots >= parking.total_spots;
              const isSelected = selectedIds.includes(parking.id);
              return (
                <div key={parking.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: isSelected ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(parking.id)} style={{ width: '22px', height: '22px' }} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>{parking.nombre}</h4>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                        <span className={`badge ${isFull ? '' : 'green'}`}>{isFull ? 'Lleno' : 'Disponible'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.4)', padding: '10px 18px', borderRadius: '12px' }}>
                    <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, -1)} disabled={parking.occupied_spots === 0} style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '1.6rem', cursor: 'pointer' }}><i className="fa-solid fa-square-minus"></i></button>
                    <strong style={{ fontSize: '1.6rem', color: 'white' }}>{parking.occupied_spots}</strong>
                    <button onClick={() => updateOccupancy(parking.id, parking.occupied_spots, parking.total_spots, 1)} disabled={isFull} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.6rem', cursor: 'pointer' }}><i className="fa-solid fa-square-plus"></i></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}