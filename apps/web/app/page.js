'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@parkings/supabase-db'; // Importación desde el paquete compartido
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)' }}><i className="fa-solid fa-satellite-dish fa-spin" style={{ fontSize: '3rem', color: '#3b82f6' }}></i></div>
});

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [filteredParkings, setFilteredParkings] = useState([]);
  const [comunaFiltro, setComunaFiltro] = useState('');
  const [radioKm, setRadioKm] = useState(5); 
  const [userLocation, setUserLocation] = useState(null);
  const [filtroPmr, setFiltroPmr] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    const fetchParkings = async () => {
      let query = supabase.from('estacionamientos').select('*'); // Consulta base
      if (filtroPmr) query = query.eq('es_pmr', true);
      
      const { data } = await query;
      let results = data || [];

      if (comunaFiltro.trim()) {
        results = results.filter(p => p.nombre.toLowerCase().includes(comunaFiltro.toLowerCase()));
      }
      setFilteredParkings(results);
    };
    fetchParkings();
  }, [filtroPmr, comunaFiltro]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <i className="fa-solid fa-map-location-dot logo-icon"></i>
          <h2>Parking's <span>Together</span></h2>
        </div>
        
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '15px', borderRadius: '12px' }}>
          <div className="input-group">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Buscar comuna..." value={comunaFiltro} onChange={(e) => setComunaFiltro(e.target.value)} />
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Radio: {radioKm}km</label>
            <input type="range" min="1" max="50" value={radioKm} onChange={(e) => setRadioKm(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>

        <div className="arrendadores-list">
          {filteredParkings.map(p => (
            <div key={p.id} className="arrendador-card" onClick={() => setSelectedSpot(p)}>
              <h4>{p.nombre}</h4>
              <p>{p.total_spots - p.occupied_spots} disponibles</p>
            </div>
          ))}
        </div>
      </aside>

      <main className="main-content" style={{ padding: 0 }}>
        <MapComponent parkings={filteredParkings} focusedSpot={selectedSpot} onUserLocate={setUserLocation} />
      </main>
    </div>
  );
}