'use client';
import { useState, useEffect, useCallback } from 'react';
import { useMapRadar } from '../../src/hooks/useMapRadar';
import { api } from '../../src/lib/api';
import { supabase } from '@parkings/supabase-db';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../../src/components/Map'), { ssr: false });
const ParkingSelector = dynamic(() => import('../../src/components/ParkingSelector'), { ssr: false });

export default function MapaPageContainer() {
  const { state, actions } = useMapRadar();
  const [filters, setFilters] = useState({ p2p: false, pmr: false });
  const [localRadius, setLocalRadius] = useState(state.radius);

  // ── Búsqueda avanzada ──
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchComuna, setSearchComuna] = useState('');
  const [searchPmr, setSearchPmr] = useState(false);
  const [searchDisponible, setSearchDisponible] = useState(false);
  const [searchPrecioMax, setSearchPrecioMax] = useState('');

  // ── Selector de plaza ──
  const [selectorOpen, setSelectorOpen] = useState(false);

  // ── Favoritos ──
  const [favIds, setFavIds] = useState(new Set());
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      api.favoritos.listar().then(res => {
        if (res.success) {
          setFavIds(new Set(res.data.map(f => f.estacionamiento?.id ?? f.estacionamiento_id)));
        }
      });
    });
  }, []);

  const toggleFavorito = useCallback(async (spot) => {
    const id = spot.id;
    setFavLoading(true);
    if (favIds.has(id)) {
      await api.favoritos.quitar(id);
      setFavIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      await api.favoritos.agregar(id);
      setFavIds(prev => new Set(prev).add(id));
    }
    setFavLoading(false);
  }, [favIds]);

  const handleBusquedaAvanzada = () => {
    // Aplica los filtros de texto/comuna pasando parámetros al hook via URL
    // El hook useMapRadar ya llama a /api/mapas/search; para búsqueda avanzada
    // hacemos el fetch directo aquí y lo inyectamos al estado del hook.
    const filtros = {};
    if (searchQ) filtros.q = searchQ;
    if (searchComuna) filtros.comuna = searchComuna;
    if (searchPmr) filtros.pmr = 'true';
    if (searchDisponible) filtros.disponible = 'true';
    if (searchPrecioMax) filtros.precioMax = searchPrecioMax;
    api.mapas.buscar(filtros).then(res => {
      if (res.success) actions.setParkingsOverride?.(res.data);
    });
    setSearchOpen(false);
  };

  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (window.__mapInstance) {
          window.__mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 15);
          // Actualizar centro del radar visualmente
          if (window.__radarCircle) {
            window.__radarCircle.setLatLng([pos.coords.latitude, pos.coords.longitude]);
          }
        }
      });
    }
  };

  // Convertir slider (1-5) a kms reales
  const radiusMap = { 1: 0.5, 2: 1, 3: 2, 4: 3, 5: 5 };
  
  const handleRadiusChange = (e) => {
    const val = parseInt(e.target.value);
    const km = radiusMap[val];
    setLocalRadius(km);
    actions.setRadius(km);
  };

  // Valor inverso para setear el slider desde el state (por si cambia externamente)
  const getSliderVal = (km) => {
    return Object.keys(radiusMap).find(k => radiusMap[k] === km) || 3; // default 2km -> 3
  };

  return (
    <div className="map-page-wrapper">

      {/* ── PANEL DE RADAR (Top Left - True Glassmorphism) ── */}
      <div className="radar-overlay">
        <div className="glass-panel-strict">
          <div className="panel-header">
            <i className="fa-solid fa-satellite-dish pulse-icon text-green-500"></i>
            <span>Radar de Proximidad</span>
          </div>

          {/* Indicador de precisión de ubicación */}
          {state.locationSource && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px',
              color: state.locationSource === 'gps' ? '#10b981' : state.locationSource === 'network' ? '#f59e0b' : '#94a3b8' }}>
              <i className={`fa-solid fa-${state.locationSource === 'gps' ? 'satellite' : state.locationSource === 'network' ? 'wifi' : 'globe'}`}></i>
              {state.locationSource === 'gps'     && 'GPS · Alta precisión'}
              {state.locationSource === 'network' && 'Red · Precisión media'}
              {state.locationSource === 'ip'      && 'IP · Aproximada — activa el GPS'}
              {state.locationSource === 'fallback'&& 'Sin ubicación — activa el GPS'}
            </div>
          )}

          <div className="panel-divider"></div>

          {/* Control de Alcance (Slider) */}
          <div className="control-group">
            <div className="radar-header">
              <span className="control-label">ALCANCE</span>
              <span className="control-value">{localRadius < 1 ? `${localRadius*1000} m` : `${localRadius} km`}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="1"
              value={getSliderVal(localRadius)} 
              onChange={handleRadiusChange}
              className="modern-slider"
            />
            <div className="slider-marks">
              <span>500m</span>
              <span>1k</span>
              <span>2k</span>
              <span>3k</span>
              <span>5k</span>
            </div>
          </div>

          <div className="panel-divider"></div>

          {/* Filtros Rápidos (Switches) */}
          <div className="control-group">
            <div className="filter-row">
              <span className="switch-text">Mostrar solo P2P</span>
              <label className="modern-switch">
                <input 
                  type="checkbox" 
                  checked={filters.p2p} 
                  onChange={(e) => setFilters({...filters, p2p: e.target.checked})} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="filter-row">
              <span className="switch-text text-blue-400">Mostrar PMR</span>
              <label className="modern-switch">
                <input 
                  type="checkbox" 
                  checked={filters.pmr} 
                  onChange={(e) => setFilters({...filters, pmr: e.target.checked})} 
                />
                <span className="slider round blue"></span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn-gps-strict" onClick={handleGPS} aria-label="Centrar en mi ubicación">
            <i className="fa-solid fa-location-crosshairs"></i>
          </button>
          <button
            className="btn-gps-strict"
            onClick={() => setSearchOpen(o => !o)}
            aria-label="Búsqueda avanzada"
            style={searchOpen ? { color: 'white', borderColor: 'rgba(59,130,246,0.5)', background: 'rgba(59,130,246,0.2)' } : {}}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
      </div>

      {/* ── PANEL BÚSQUEDA AVANZADA ── */}
      {searchOpen && (
        <div className="glass-panel-strict search-panel">
          <div className="panel-header" style={{ marginBottom: '14px' }}>
            <i className="fa-solid fa-sliders text-blue-400"></i>
            <span>Filtros Avanzados</span>
            <button className="btn-close-strict" style={{ marginLeft: 'auto' }} onClick={() => setSearchOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <input
            className="search-input"
            placeholder="Nombre del estacionamiento..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          <input
            className="search-input"
            placeholder="Comuna (ej: Providencia)"
            value={searchComuna}
            onChange={e => setSearchComuna(e.target.value)}
            style={{ marginTop: '8px' }}
          />
          <input
            className="search-input"
            placeholder="Precio máx / hora (CLP)"
            type="number"
            value={searchPrecioMax}
            onChange={e => setSearchPrecioMax(e.target.value)}
            style={{ marginTop: '8px' }}
          />

          <div className="panel-divider" style={{ margin: '12px 0' }}></div>

          <div className="filter-row" style={{ paddingTop: 0 }}>
            <span className="switch-text">Solo disponibles</span>
            <label className="modern-switch">
              <input type="checkbox" checked={searchDisponible} onChange={e => setSearchDisponible(e.target.checked)} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="filter-row">
            <span className="switch-text text-blue-400">Solo PMR</span>
            <label className="modern-switch">
              <input type="checkbox" checked={searchPmr} onChange={e => setSearchPmr(e.target.checked)} />
              <span className="slider round blue"></span>
            </label>
          </div>

          <button className="btn-reserve-strict" style={{ marginTop: '14px' }} onClick={handleBusquedaAvanzada}>
            <i className="fa-solid fa-magnifying-glass"></i> Buscar
          </button>
        </div>
      )}

      {/* ── ÁREA DEL MAPA ── */}
      <div className="map-area" style={{ position: 'relative' }}>
        <Map
          location={state.userLoc}
          isLoading={state.loading}
          error={state.reserveError}
          parkings={state.parkings}
          onSpotSelect={actions.setSelectedSpot}
          radius={localRadius}
          filters={filters}
          userProfile={state.userProfile}
        />
        {state.loading && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 500, textAlign: 'center', pointerEvents: 'none' }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#3b82f6', filter: 'drop-shadow(0 0 8px #3b82f6)' }}></i>
          </div>
        )}
        {!state.loading && state.parkings.length === 0 && (
          <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 20px', color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            <i className="fa-solid fa-radar mr-2" style={{ color: '#3b82f6' }}></i>
            Sin estacionamientos en este radio — expande el radar
          </div>
        )}
      </div>

      {/* ── PANEL DE INFORMACIÓN ── */}
      {state.selectedSpot && !selectorOpen && (() => {
        const totalSpots = state.selectedSpot.total_spots || 10;
        const occupiedSpots = state.selectedSpot.occupied_spots || 0;
        const availableSpots = Math.max(totalSpots - occupiedSpots, 0);
        const isFull = availableSpots === 0;

        return (
          <div className={`glass-panel-strict reservation-panel ${state.selectedSpot ? 'slide-in' : ''}`}>
            <div className="res-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-square-parking" style={{ color: '#3b82f6' }}></i>
                {state.selectedSpot.nombre}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-close-strict"
                  onClick={() => toggleFavorito(state.selectedSpot)}
                  disabled={favLoading}
                  title={favIds.has(state.selectedSpot.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  aria-label={favIds.has(state.selectedSpot.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  style={{ color: favIds.has(state.selectedSpot.id) ? '#f59e0b' : '#64748b', fontSize: '1.1rem' }}
                >
                  <i className={`fa-${favIds.has(state.selectedSpot.id) ? 'solid' : 'regular'} fa-star`}></i>
                </button>
                <button className="btn-close-strict" aria-label="Cerrar panel" onClick={() => actions.setSelectedSpot(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div className="res-body">
              <p className="res-row">
                <i className="fa-solid fa-user-tie" style={{ color: '#64748b', width: '16px' }}></i>
                <span style={{ color: '#cbd5e1' }}>{state.selectedSpot.arrendador || 'Red P2P'}</span>
              </p>
              <p className="res-row">
                <i className="fa-solid fa-car" style={{ color: isFull ? '#ef4444' : '#10b981', width: '16px' }}></i>
                <span style={{ color: isFull ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                  {availableSpots} disponibles
                </span>
                <span style={{ color: '#475569', fontSize: '0.8rem' }}>/ {totalSpots} totales</span>
              </p>
              {state.selectedSpot.precio_hora !== undefined && (
                <p className="res-row">
                  <i className="fa-solid fa-coins" style={{ color: '#64748b', width: '16px' }}></i>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                    {state.selectedSpot.precio_hora === 0 ? 'Gratuito' : `$${state.selectedSpot.precio_hora?.toLocaleString()}/hr`}
                  </span>
                </p>
              )}
              {state.selectedSpot.comuna && (
                <p className="res-row">
                  <i className="fa-solid fa-location-dot" style={{ color: '#64748b', width: '16px' }}></i>
                  <span style={{ color: '#94a3b8' }}>{state.selectedSpot.comuna}</span>
                </p>
              )}
              {state.selectedSpot.es_pmr && (
                <div className="pmr-badge-strict" style={{ marginTop: '8px' }}>
                  <i className="fa-solid fa-wheelchair"></i> Accesibilidad PMR Habilitada
                </div>
              )}

              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {state.reserveError && (
                  <div style={{ color: '#f87171', fontSize: '0.82rem', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '10px', textAlign: 'center' }}>
                    {state.reserveError}
                  </div>
                )}
                <button
                  className="btn-reserve-strict"
                  disabled={isFull}
                  onClick={() => !isFull && setSelectorOpen(true)}
                  aria-label={isFull ? 'Sin disponibilidad' : 'Elegir plaza'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '0.9rem',
                    letterSpacing: '0.5px',
                    ...(isFull ? {
                      background: 'rgba(255,255,255,0.05)',
                      color: '#475569',
                      cursor: 'not-allowed',
                      opacity: 0.5,
                      pointerEvents: 'none',
                      border: '1px solid rgba(255,255,255,0.06)',
                    } : {}),
                  }}
                >
                  {isFull
                    ? <><i className="fa-solid fa-ban"></i> Sin disponibilidad</>
                    : <><i className="fa-solid fa-border-all"></i> ELEGIR PLAZA</>
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL SELECTOR DE PLAZA ── */}
      {selectorOpen && state.selectedSpot && (
        <ParkingSelector
          parking={state.selectedSpot}
          isReserving={state.isReserving}
          onReserve={actions.handleReserve}
          onClose={() => {
            setSelectorOpen(false);
            actions.setSelectedSpot(null);
          }}
        />
      )}

      <style jsx>{`
        .map-page-wrapper {
          position: relative;
          width: 100%;
          height: calc(100vh - 80px);
          overflow: hidden;
          background: #020617; /* Slate 950 */
        }
        .map-area { width: 100%; height: 100%; }

        /* === TRUE GLASSMORPHISM === */
        .glass-panel-strict {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: white;
        }

        /* === RADAR OVERLAY === */
        .radar-overlay {
          position: absolute;
          top: 24px;
          left: 24px;
          z-index: 1000;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          width: 320px;
        }
        
        .radar-overlay > .glass-panel-strict {
          flex: 1;
          padding: 20px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: #f8fafc;
        }

        .pulse-icon {
          animation: text-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes text-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .panel-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 16px 0;
        }

        /* === CONTROLS === */
        .radar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .filter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
        }

        .control-label {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .control-value {
          font-size: 0.9rem;
          color: #60a5fa;
          font-weight: 800;
        }

        /* Modern Slider */
        .modern-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
          margin: 10px 0;
        }
        .modern-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          transition: transform 0.1s;
        }
        .modern-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .slider-marks {
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
        }

        /* Modern Switch */
        .modern-switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }
        .switch-text {
          font-size: 0.9rem;
          color: #cbd5e1;
          font-weight: 500;
        }
        .modern-switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .3s;
          border-radius: 9999px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px; width: 16px;
          left: 2px; bottom: 2px;
          background-color: #cbd5e1;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .slider { background-color: #22c55e; }
        input:checked + .slider.blue { background-color: #3b82f6; }
        input:checked + .slider:before {
          transform: translateX(20px);
          background-color: white;
        }

        /* === GPS BUTTON === */
        .btn-gps-strict {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }
        .btn-gps-strict:hover {
          color: white;
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
        }

        /* === RESERVATION PANEL === */
        .reservation-panel {
          position: absolute;
          bottom: 24px;
          right: 24px;
          width: 320px;
          max-width: calc(100vw - 48px);
          z-index: 1000;
          transform: translateX(120%);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .reservation-panel.slide-in { transform: translateX(0); }
        .res-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.2);
          border-radius: 16px 16px 0 0;
        }
        .res-header h3 { margin: 0; font-size: 1rem; font-weight: 700; font-family: 'Inter', sans-serif; }
        .btn-close-strict {
          background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 1.1rem; transition: color 0.2s;
        }
        .btn-close-strict:hover { color: white; }
        
        .res-body { padding: 20px; }
        .res-row { margin: 0 0 12px 0; font-size: 0.9rem; color: #cbd5e1; display: flex; align-items: center; gap: 12px; }
        .res-row i { color: #64748b; width: 16px; text-align: center; }
        
        .pmr-badge-strict {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(59,130,246,0.1); color: #60a5fa;
          padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(59,130,246,0.2);
          font-size: 0.8rem; font-weight: 600; width: 100%;
        }

        .btn-reserve-strict {
          width: 100%;
          background: #2563eb;
          color: white;
          font-weight: 700; font-size: 0.9rem; letter-spacing: 0.5px;
          padding: 12px; border-radius: 10px; border: none; cursor: pointer;
          transition: background 0.2s;
        }
        .btn-reserve-strict:hover { background: #1d4ed8; }

        /* Búsqueda avanzada */
        .search-panel {
          position: absolute;
          top: 24px;
          left: 360px;
          z-index: 1000;
          width: 280px;
          padding: 18px;
        }
        .search-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: white;
          font-size: 0.9rem;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .search-input:focus { border-color: rgba(59,130,246,0.5); }
        .search-input::placeholder { color: #64748b; }

        @media (max-width: 600px) {
          .radar-overlay { width: calc(100% - 48px); }
          .btn-gps-strict { position: absolute; right: 0; top: 0; }
          .search-panel { left: 24px; top: auto; bottom: 24px; width: calc(100% - 48px); }
        }
      `}</style>
    </div>
  );
}