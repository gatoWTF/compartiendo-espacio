'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => <div className="radar-loader">Sincronizando Satélites...</div>
});

export default function MapaPage() {
  const [userLoc, setUserLoc] = useState({ lat: -33.3601, lng: -70.6925 }); 
  const [parkings, setParkings] = useState([]);
  const [radius, setRadius] = useState(5);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRadar = async (r, lat, lng) => {
    try {
      const URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
      const res = await fetch(`${URL}/search?radius=${r}&lat=${lat}&lng=${lng}`, { cache: 'no-store' });
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (e) { return []; }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log("Usando Plaza Norte")
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
    <div className="main-map-container">
      {/* SIDEBAR RADAR */}
      <aside className="sidebar-radar">
        <div className="header-radar">
          <div className="status-dot"></div>
          <h2>RADAR<span>P2P</span></h2>
        </div>

        <div className="control-card">
          <div className="label-group">
            <label>RANGO DE ESCANEO</label>
            <span className="km-value">{radius} KM</span>
          </div>
          <input type="range" min="1" max="30" value={radius} onChange={(e) => setRadius(e.target.value)} className="modern-slider" />
        </div>

        <div className="parking-list-section">
          <p className="section-tag">MEJORES EVALUADOS</p>
          {loading ? (
            <div className="radar-scanning">
               <div className="ring"></div>
               <span>Escaneando sector...</span>
            </div>
          ) : (
            parkings.map(p => (
              <div key={p.id} onClick={() => setSelectedSpot(p)} className={`parking-card-mini ${selectedSpot?.id === p.id ? 'active' : ''}`}>
                <div className="card-top">
                  <span className="p-name">{p.nombre}</span>
                  <span className="p-star">★ {p.rating || '5.0'}</span>
                </div>
                <div className="card-bottom">
                  <span>{p.comuna}</span>
                  <span className="p-price">${p.precio_hora}/hr</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAPA E INTERFAZ DE DETALLES */}
      <main className="map-view">
        <MapComponent parkings={parkings} userLoc={userLoc} focusedSpot={selectedSpot} />
        
        {selectedSpot && (
          <div className="floating-details">
            <button className="btn-close" onClick={() => setSelectedSpot(null)}>×</button>
            <div className="badge">PLAZA VERIFICADA</div>
            <h2>{selectedSpot.nombre}</h2>
            <p className="description">{selectedSpot.descripcion || 'Espacio privado con seguridad avanzada.'}</p>
            
            <div className="info-grid">
              <div className="info-item">
                <small>TARIFA</small>
                <strong>${selectedSpot.precio_hora}</strong>
              </div>
              <div className="info-item">
                <small>DISTANCIA</small>
                <strong>{radius} km</strong>
              </div>
            </div>

            <button className="btn-action">RESERVAR ESTE LUGAR</button>
          </div>
        )}
      </main>

      <style jsx>{`
        .main-map-container { display: flex; height: calc(100vh - 70px); background: #020617; color: white; overflow: hidden; }
        
        .sidebar-radar { width: 380px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(25px); border-right: 1px solid rgba(59, 130, 246, 0.2); padding: 35px; display: flex; flex-direction: column; gap: 30px; }
        
        .header-radar { display: flex; align-items: center; gap: 15px; }
        .status-dot { width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 15px #3b82f6; animation: pulse 2s infinite; }
        h2 { font-size: 1.8rem; font-weight: 900; margin: 0; }
        h2 span { color: #3b82f6; }

        .control-card { background: rgba(255, 255, 255, 0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .label-group { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 12px; }
        .km-value { color: #3b82f6; }
        .modern-slider { width: 100%; accent-color: #3b82f6; cursor: pointer; }

        .parking-card-mini { padding: 18px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 18px; margin-bottom: 15px; cursor: pointer; transition: 0.3s; }
        .parking-card-mini:hover { background: rgba(255, 255, 255, 0.06); transform: translateY(-3px); }
        .parking-card-mini.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        
        .map-view { flex: 1; position: relative; }
        .floating-details { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 440px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(40px); border: 1px solid rgba(59, 130, 246, 0.5); border-radius: 28px; padding: 35px; z-index: 1000; animation: slideIn 0.4s ease; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); }
        
        .badge { display: inline-block; padding: 6px 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border-radius: 8px; font-size: 0.7rem; font-weight: 900; margin-bottom: 20px; }
        .btn-action { width: 100%; padding: 18px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 16px; color: white; font-weight: 800; cursor: pointer; margin-top: 10px; }
        
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideIn { from { transform: translate(-50%, 40px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </div>
  );
}