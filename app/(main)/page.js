'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // <-- Ruta de un solo nivel (correcta)
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/Map'), {    ssr: false,
    loading: () => <div className="map-container glass-panel" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Iniciando satélite...</div>
});

export default function Home() {
  const [parkings, setParkings] = useState([]);
  const [filteredParkings, setFilteredParkings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [selectedParkingId, setSelectedParkingId] = useState(null);
  
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const fetchParkings = async () => {
      const { data, error } = await supabase.from('estacionamientos').select('*');
      if (!error) {
        setParkings(data || []);
        setFilteredParkings(data || []); 
      }
      setLoading(false);
    };

    fetchParkings();

    const channel = supabase.channel('realtime-parkings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estacionamientos' }, () => fetchParkings())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredParkings(parkings);
    } else {
      const query = searchQuery.toLowerCase();
      const filtrados = parkings.filter(p => 
        p.nombre.toLowerCase().includes(query) || 
        p.arrendador.toLowerCase().includes(query)
      );
      setFilteredParkings(filtrados);
    }
  }, [searchQuery, parkings]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
      },
      (error) => {
        alert("No se pudo obtener la ubicación. Activa el GPS de tu dispositivo.");
        setIsLocating(false);
      }
    );
  };

  const getStatusColor = (occupied, total) => {
    const occupancy = occupied / total;
    if (occupancy > 0.85) return 'var(--status-red)'; 
    if (occupancy > 0.5) return 'var(--status-yellow)'; 
    return 'var(--status-green)'; 
  };

  return (
    <section className="view-content search-layout">
      <div className="search-main-area">
        <div className="search-header" style={{ marginBottom: '25px' }}>
          <div className="search-box-wrapper glass-panel" style={{ 
            flex: 1, display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '15px', border: '1px solid var(--border-glass)'
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--primary)' }}></i>
            <input 
              type="text" 
              placeholder="¿A dónde vas hoy? (Comuna, lugar o anfitrión...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }} 
            />
          </div>
          
          <button 
            onClick={handleGetLocation} 
            disabled={isLocating}
            className="btn-primary" 
            style={{ width: 'auto', marginLeft: '15px', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px', opacity: isLocating ? 0.7 : 1 }}
          >
            <i className={`fa-solid ${isLocating ? 'fa-circle-notch fa-spin' : 'fa-location-crosshairs'}`}></i> 
            <span style={{ fontWeight: '600' }}>{isLocating ? 'BUSCANDO...' : 'UBICACIÓN'}</span>
          </button>
        </div>

        <div id="real-map" className="map-container glass-panel" style={{ height: '600px', borderRadius: '24px', overflow: 'hidden' }}>
           <MapComponent parkings={filteredParkings} selectedParkingId={selectedParkingId} userLocation={userLocation} />
        </div>
      </div>

      <div className="top-rated-panel glass-panel" style={{ borderRadius: '24px' }}>
        <h3><i className="fa-solid fa-square-p" style={{ color: 'var(--primary)' }}></i> En Vivo</h3>
        <div className="arrendadores-list">
          {loading ? (
             <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '30px' }}><i className="fa-solid fa-circle-notch fa-spin"></i> Sincronizando...</p>
          ) : filteredParkings.length === 0 ? (
             <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '30px' }}>No hay resultados para "{searchQuery}"</p>
          ) : (
            filteredParkings.map(p => {
              const statusColor = getStatusColor(p.occupied_spots, p.total_spots);
              return (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedParkingId(p.id)}
                  className={`arrendador-card ${selectedParkingId === p.id ? 'selected' : ''}`}
                  style={{ marginBottom: '10px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: `4px solid ${statusColor}` }}
                >
                  <h4 style={{ margin: 0 }}>{p.arrendador}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '5px 0' }}>{p.nombre}</p>
                  <span style={{ fontWeight: 'bold', color: statusColor }}>
                    Libres: {p.total_spots - p.occupied_spots}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}