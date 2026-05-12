'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@parkings/supabase-db';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/Map'), { ssr: false });

export default function MapaPage() {
  const [parkings, setParkings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(5);
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    // Aquí podrías conectar con tu microservicio bff/api/dashboard?radius=...
    supabase.from('estacionamientos').select('*').then(({ data }) => setParkings(data || []));
  }, [radius]);

  const filtered = parkings.filter(p => 
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ height: 'calc(100vh - 100px)', position: 'relative', display: 'flex' }}>
      {/* Lupa de búsqueda y Radio Flotante */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1500, width: '300px' }}>
        <div className="glass" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
            <input 
              type="text" placeholder="Buscar dirección..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              Radio de búsqueda: <span>{radius} km</span>
            </label>
            <input 
              type="range" min="1" max="50" value={radius} onChange={(e) => setRadius(e.target.value)}
              style={{ width: '100%', marginTop: '10px', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <MapComponent parkings={filtered} focusedSpot={selectedSpot} />
      </div>
    </div>
  );
}