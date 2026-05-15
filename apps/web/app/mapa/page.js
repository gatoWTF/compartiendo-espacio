'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => <div className="spinner" style={{marginTop: '50px'}}></div>
});

export default function MapaPage() {
  const [userLoc, setUserLoc] = useState({ lat: -33.3601, lng: -70.6925 }); 
  const [parkings, setParkings] = useState([]);
  const [radius, setRadius] = useState(5);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lógica interna para evitar errores de importación en Turbopack
  const fetchRadar = async (r, lat, lng) => {
    try {
      const URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
      const res = await fetch(`${URL}/search?radius=${r}&lat=${lat}&lng=${lng}`, { cache: 'no-store' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (e) {
      console.error("Fallo de conexión ms-mapas");
      return [];
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log("Usando ubicación por defecto")
    );
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchRadar(radius, userLoc.lat, userLoc.lng);
      if (active) { setParkings(data); setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [radius, userLoc]);

  return (
    <div className="map-layout">
      {/* PANEL LATERAL */}
      <aside className="glass-panel map-sidebar">
        <div className="radar-brand">
          <h2>RADAR<span>P2P</span></h2>
          <p>COMPARTIENDO ESPACIO BETA</p>
        </div>

        <div className="radar-control">
          <div className="radar-control-labels">
            <span>Rango de Escaneo</span>
            <span style={{ color: '#3b82f6' }}>{radius} KM</span>
          </div>
          <input type="range" min="1" max="30" value={radius} onChange={(e) => setRadius(e.target.value)} className="radar-slider" />
        </div>

        <div className="spot-list">
          <p className="spot-list-title">Mejores opciones cerca</p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner"></div>
              <p style={{ color: '#3b82f6', fontSize: '0.9rem', marginTop: '15px' }}>Escaneando señales...</p>
            </div>
          ) : (
            parkings.sort((a,b) => b.rating - a.rating).map(p => (
              <div key={p.id} onClick={() => setSelectedSpot(p)} className={`spot-card ${selectedSpot?.id === p.id ? 'active' : ''}`}>
                <div className="spot-header">
                  <span className="spot-name">{p.nombre}</span>
                  <span className="spot-rating">★ {p.rating}</span>
                </div>
                <div className="spot-footer">
                  <span className="spot-comuna">{p.comuna}</span>
                  <span className="spot-price">${p.precio_hora}/hr</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAPA Y OVERLAY */}
      <main className="map-canvas">
        <MapComponent parkings={parkings} userLoc={userLoc} focusedSpot={selectedSpot} />
        
        {selectedSpot && (
          <div className="glass-panel detail-overlay">
            <button className="detail-close" onClick={() => setSelectedSpot(null)}>×</button>
            <h3 className="detail-title">{selectedSpot.nombre}</h3>
            <p className="detail-desc">{selectedSpot.descripcion || 'Estacionamiento P2P verificado.'}</p>
            
            <div className="detail-stats">
              <div className="stat-box">
                <span className="stat-label">TARIFA (POR HORA)</span>
                <span className="stat-value text-success">${selectedSpot.precio_hora}</span>
              </div>
              <div className={`stat-box ${selectedSpot.es_pmr ? 'pmr' : ''}`}>
                <span className="stat-label">ACCESIBILIDAD</span>
                <span className={`stat-value ${selectedSpot.es_pmr ? 'text-success' : ''}`}>
                  {selectedSpot.es_pmr ? '♿ PMR PRIORIDAD' : 'ESTÁNDAR'}
                </span>
              </div>
            </div>

            <button className="btn-cyber-primary">RESERVAR AHORA</button>
          </div>
        )}
      </main>
    </div>
  );
}