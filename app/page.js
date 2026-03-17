'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../components/Map'), { 
    ssr: false,
    loading: () => <div className="map-container glass-panel" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa...</div>
});

export default function Home() {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getParkings() {
      const { data, error } = await supabase.from('estacionamientos').select('*');
      if (!error) setParkings(data);
      setLoading(false);
    }
    getParkings();
  }, []);

  return (
    <section className="view-content search-layout">
      <div className="search-main-area">
        <div className="search-header" style={{ marginBottom: '25px' }}>
          <div className="search-box-wrapper" style={{ 
            flex: 1, display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '15px',
            background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(20px)', borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--primary)' }}></i>
            <input type="text" placeholder="¿A dónde vas hoy?" style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }} />
          </div>
          <button className="btn-primary" style={{ width: 'auto', marginLeft: '15px', padding: '12px 28px', borderRadius: '16px' }}>
            <i className="fa-solid fa-location-crosshairs"></i> UBICACIÓN
          </button>
        </div>

        <div id="real-map" className="map-container glass-panel" style={{ height: '600px', borderRadius: '24px', overflow: 'hidden' }}>
           <MapComponent />
        </div>
      </div>

      <div className="top-rated-panel glass-panel" style={{ borderRadius: '24px' }}>
        <h3><i className="fa-solid fa-square-p" style={{ color: 'var(--primary)' }}></i> Estacionamientos</h3>
        <div className="arrendadores-list">
          {loading ? <p>Sincronizando...</p> : parkings.map(p => (
            <div key={p.id} className="arrendador-card" style={{ marginBottom: '10px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <h4>{p.arrendador}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.nombre}</p>
              <span style={{ color: (p.occupied_spots / p.total_spots) > 0.85 ? 'var(--status-red)' : 'var(--status-green)' }}>
                Libres: {p.total_spots - p.occupied_spots}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}