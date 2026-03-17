'use client';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="map-container glass-panel" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>Cargando mapa...</div>
});

export default function Home() {
  return (
    <section className="view-content search-layout">
      <div className="search-main-area">
        <div className="search-header" style={{ marginBottom: '25px' }}>
          
          <div className="search-box-wrapper" style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 20px',
            gap: '15px',
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.1)'
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
            <input 
              type="text" 
              id="map-search-input" 
              placeholder="¿A dónde vas hoy? (Comuna, lugar o anfitrión...)" 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                width: '100%', 
                outline: 'none',
                fontSize: '1rem',
                fontWeight: '300'
              }}
            />
          </div>
          
          <button id="btn-gps" className="btn-primary" style={{ 
            width: 'auto', 
            marginLeft: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            padding: '12px 28px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)',
            border: 'none',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
            transition: 'transform 0.2s'
          }}>
            <i className="fa-solid fa-location-crosshairs"></i> 
            <span style={{ fontWeight: '600' }}>UBICACIÓN</span>
          </button>
        </div>

        <div id="real-map" className="map-container glass-panel" style={{ 
          height: '600px', 
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          position: 'relative'
        }}>
           <MapComponent />
        </div>
      </div>

      <div className="top-rated-panel glass-panel" style={{ borderRadius: '24px' }}>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem' }}>
                <i className="fa-solid fa-square-p" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i>
                Disponibilidad Real
            </h3>
        </div>
        <div id="arrendadores-list" className="arrendadores-list">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '30px' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '10px' }}></i> 
            Sincronizando con la red...
          </p>
        </div>
      </div>
    </section>
  );
}