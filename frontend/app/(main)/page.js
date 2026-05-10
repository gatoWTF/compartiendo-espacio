'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)' }}><i className="fa-solid fa-satellite-dish fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i></div>
});

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [filteredParkings, setFilteredParkings] = useState([]);
  const router = useRouter();

  const [comunaFiltro, setComunaFiltro] = useState('');
  const [radioKm, setRadioKm] = useState(5); 
  const [userLocation, setUserLocation] = useState(null);
  
  // INNOVACIÓN: Estado para filtro Inclusivo PMR
  const [filtroPmr, setFiltroPmr] = useState(false);

  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [isCopying, setIsCopying] = useState(false); 
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data: profile } = await supabase.from('usuarios').select('*').eq('id', session.user.id).single();
        setUserProfile(profile);
      }
    };
    initSession();
  }, []);

  // INNOVACIÓN: Motor de Búsqueda Geoespacial con PostGIS
  useEffect(() => {
    const fetchParkings = async () => {
      let resultData = [];

      if (userLocation && radioKm < 50) {
        // Ejecutamos el microservicio RPC en la base de datos (Ultra rápido)
        const { data, error } = await supabase.rpc('buscar_estacionamientos_cercanos', {
          lat_usuario: userLocation.lat,
          lng_usuario: userLocation.lng,
          radio_km: parseFloat(radioKm),
          solo_pmr: filtroPmr
        });
        if (data) resultData = data;
      } else {
        // Plan B: Si no hay GPS activo o el radio es infinito, traemos todo
        let query = supabase.from('estacionamientos').select('*');
        if (filtroPmr) query = query.eq('es_pmr', true);
        const { data } = await query;
        if (data) resultData = data;
      }

      // Filtro de texto adicional en el cliente
      if (comunaFiltro.trim() !== '') {
        resultData = resultData.filter(p => p.nombre.toLowerCase().includes(comunaFiltro.toLowerCase()));
      }

      setFilteredParkings(resultData);
    };

    fetchParkings();
  }, [userLocation, radioKm, filtroPmr, comunaFiltro]); // Se ejecuta mágicamente al mover un control

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setShowAppSelector(false);
  };

  const handlePreReserve = async () => {
    if (!session) { showToast("Inicia sesión primero.", "error"); setTimeout(() => router.push('/auth'), 1500); return; }
    if (userProfile?.rol === 'arrendador') { showToast("Usa cuenta de Conductor.", "error"); return; }
    setIsReserving(true);
    const { error } = await supabase.from('reservas').insert([{ estacionamiento_id: selectedSpot.id, conductor_id: session.user.id, patente_registrada: userProfile?.patente || 'No registrada', estado: 'pendiente' }]);
    setIsReserving(false);
    if (!error) { setSelectedSpot(null); setShowAppSelector(false); showToast("¡Pre-reserva exitosa!", "success"); } 
    else { showToast("Error: " + error.message, "error"); }
  };

  const openWaze = () => window.open(`https://waze.com/ul?ll=${selectedSpot.lat},${selectedSpot.lng}&navigate=yes`, '_blank');
  const openGoogleMaps = () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`, '_blank');
  
  const copyAddress = async () => {
    setIsCopying(true);
    showToast("Traduciendo coordenadas a dirección...", "success");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedSpot.lat}&lon=${selectedSpot.lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        navigator.clipboard.writeText(data.display_name);
        showToast("¡Dirección copiada al portapapeles!", "success");
      } else throw new Error("No address");
    } catch (e) {
      navigator.clipboard.writeText(`${selectedSpot.lat}, ${selectedSpot.lng}`);
      showToast("Dirección no encontrada. Coordenadas copiadas.", "success");
    } finally {
      setIsCopying(false);
      setShowAppSelector(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      
      {toast && (
        <div id="toast-container" style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <div className={`toast ${toast.type}`} style={{ padding: '15px 25px', background: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-check' : 'fa-xmark'}`} style={{ marginRight: '10px' }}></i> {toast.msg}
          </div>
        </div>
      )}

      {/* PANEL IZQUIERDO */}
      <div style={{ width: '380px', background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '20px', zIndex: 10 }}>
        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '20px', fontWeight: '800' }}>
          <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--primary)', marginRight: '8px' }}></i> CompartiendoEspacio
        </h2>

        {/* CONTROLES DE FILTRO */}
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
          
          {/* Innovación: Toggle PMR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-wheelchair" style={{ color: '#38bdf8' }}></i> Solo Plazas PMR
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
              <input type="checkbox" checked={filtroPmr} onChange={(e) => setFiltroPmr(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: filtroPmr ? '#38bdf8' : '#475569', transition: '.4s', borderRadius: '24px' }}>
                <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: filtroPmr ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
              </span>
            </label>
          </div>

          <div className="input-group" style={{ background: 'rgba(0,0,0,0.5)', marginBottom: '15px' }}>
            <i className="fa-solid fa-magnifying-glass" style={{color: '#64748b'}}></i>
            <input type="text" placeholder="Comuna o Nombre..." value={comunaFiltro} onChange={(e) => setComunaFiltro(e.target.value)} style={{ color: 'white', background: 'none', border: 'none', outline: 'none', width: '100%' }} />
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>Radio Geoespacial</span>
              <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{radioKm >= 50 ? 'Todo Santiago' : `${radioKm} km`}</span>
            </div>
            <input type="range" min="1" max="50" value={radioKm} onChange={(e) => setRadioKm(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Lista de Destacados */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredParkings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', marginTop: '30px', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-satellite" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.3 }}></i>
              <p>Escaneando el perímetro...<br/>No hay zonas detectadas.</p>
            </div>
          ) : (
            filteredParkings.map((p) => {
              const isFull = p.occupied_spots >= p.total_spots;
              return (
                <div key={p.id} className="glass-panel" style={{ padding: '15px', border: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: '0.2s', background: selectedSpot?.id === p.id ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.5)', borderColor: selectedSpot?.id === p.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.03)' }} onClick={() => handleSpotClick(p)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.nombre} {p.es_pmr && <i className="fa-solid fa-wheelchair" style={{ color: '#38bdf8', fontSize: '0.85rem' }} title="Plaza Inclusiva"></i>}
                    </h4>
                    {p.distancia && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>{p.distancia} km</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: isFull ? '#ef4444' : '#10b981', fontWeight: 'bold', background: isFull ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                      {isFull ? 'LLENO' : `${p.total_spots - p.occupied_spots} Disponibles`}
                    </span>
                    <i className="fa-solid fa-crosshairs" style={{ color: selectedSpot?.id === p.id ? '#3b82f6' : '#475569', fontSize: '1rem', transition: '0.2s' }}></i>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PANEL DERECHO: Mapa y Navegación */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapComponent parkings={filteredParkings} focusedSpot={selectedSpot} onUserLocate={setUserLocation} />
        
        {selectedSpot && (
          <div className="slide-in" style={{ position: 'absolute', bottom: '25px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '16px', padding: '25px', width: '90%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', zIndex: 1000, animation: 'slideUp 0.3s ease-out' }}>
            <style dangerouslySetInnerHTML={{__html: ` @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } } @keyframes expandMenu { from { height: 0; opacity: 0; } to { height: 140px; opacity: 1; } } `}} />

            <button onClick={() => { setSelectedSpot(null); setShowAppSelector(false); }} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem', transition: '0.2s' }}><i className="fa-solid fa-xmark hover-elevate"></i></button>

            <h3 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedSpot.nombre} 
              {selectedSpot.es_pmr && <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '8px' }}><i className="fa-solid fa-wheelchair"></i> PMR Priorizado</span>}
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.9rem' }}><i className="fa-solid fa-user-tie"></i> Anfitrión: {selectedSpot.arrendador}</p>
            
            {!showAppSelector ? (
              <div style={{ display: 'flex', gap: '12px', animation: 'slideUp 0.2s' }}>
                <button onClick={() => setShowAppSelector(true)} className="btn-outline" style={{ flex: 1, padding: '14px', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', borderColor: '#3b82f6', color: '#3b82f6', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', background: 'rgba(59, 130, 246, 0.05)', transition: '0.2s' }}>
                  <i className="fa-solid fa-location-arrow"></i> Navegar
                </button>
                <button onClick={handlePreReserve} disabled={isReserving || (selectedSpot.total_spots - selectedSpot.occupied_spots <= 0)} style={{ flex: 1.5, padding: '14px', background: (selectedSpot.total_spots - selectedSpot.occupied_spots <= 0) ? '#475569' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                  {isReserving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-bookmark"></i> Reservar Cupo</>}
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)', animation: 'expandMenu 0.3s ease-out forwards', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold' }}>Elige tu GPS favorito:</span>
                  <button onClick={() => setShowAppSelector(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}><i className="fa-solid fa-arrow-left"></i> Volver</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={openWaze} style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}><i className="fa-brands fa-waze" style={{ fontSize: '1.2rem' }}></i> Abrir con Waze</button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={openGoogleMaps} style={{ flex: 2, background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}><i className="fa-solid fa-map" style={{ color: '#fbbf24' }}></i> Google Maps</button>
                    <button onClick={copyAddress} disabled={isCopying} style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>{isCopying ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-copy"></i> Copiar</>}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}