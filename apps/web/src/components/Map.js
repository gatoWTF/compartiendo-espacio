'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

export default function Map({
  location,
  isLoading,
  error,
  parkings = [],
  onSpotSelect,
  radius = 5,
  filters = { p2p: false, pmr: false },
  userProfile
}) {
  const mapRef        = useRef(null); // L.Map instance
  const markerLayerRef = useRef(null);
  const radarCircleRef = useRef(null);
  const radarPulseRef  = useRef(null);
  const userMarkerRef  = useRef(null); // L.Marker for live avatar — ref, not state
  const [mapReady, setMapReady] = useState(false); // triggers userMarker effect after init
  const [userName, setUserName] = useState(null);

  // ── 1. Sync user display name ──
  useEffect(() => {
    setUserName(userProfile?.name ?? null);
  }, [userProfile]);

  // ── 2. Map init, radar and parking markers ──
  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    // ── Init map (once) ──
    if (!mapRef.current) {
      mapRef.current = L.map('map', { zoomControl: false })
        .setView([location.lat, location.lng], 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(mapRef.current);

      markerLayerRef.current = L.markerClusterGroup({
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          const size = count > 30 ? 44 : count > 10 ? 38 : 32;
          return L.divIcon({
            html: `<div style="background:rgba(59,130,246,0.85);width:${size}px;height:${size}px;border-radius:50%;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 20px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800;">${count}</div>`,
            className: 'marker-cluster-custom',
            iconSize: L.point(size, size),
          });
        },
      }).addTo(mapRef.current);

      setMapReady(true); // signal userMarker effect
    } else {
      // Map already exists — just re-center
      mapRef.current.flyTo([location.lat, location.lng], mapRef.current.getZoom(), {
        animate: true, duration: 1.0,
      });
    }

    // ── Create or update radar circles ──
    // FIX: circles are stored in refs so they survive across effect re-runs.
    // We create them once; thereafter we call setLatLng/setRadius in-place.
    if (!radarCircleRef.current) {
      radarCircleRef.current = L.circle([location.lat, location.lng], {
        color: '#1E3A8A', fillColor: '#1E3A8A', fillOpacity: 0.10, weight: 1,
      }).addTo(mapRef.current);
    }
    if (!radarPulseRef.current) {
      radarPulseRef.current = L.circle([location.lat, location.lng], {
        color: 'transparent', fillColor: '#1E3A8A', fillOpacity: 0.6,
        className: 'radar-pulse-anim',
      }).addTo(mapRef.current);
    }

    // Safe: refs are guaranteed non-null from this point
    radarCircleRef.current.setLatLng([location.lat, location.lng]);
    radarCircleRef.current.setRadius(radius * 1000);
    radarPulseRef.current.setLatLng([location.lat, location.lng]);
    radarPulseRef.current.setRadius(radius * 1000);

    // ── Rebuild parking markers ──
    if (markerLayerRef.current) markerLayerRef.current.clearLayers();

    const filteredParkings = parkings.filter(spot => {
      if (filters.p2p && !spot.arrendador) return false;
      if (filters.pmr && !spot.es_pmr)     return false;
      return true;
    });

    filteredParkings.forEach(spot => {
      const totalSpots    = spot.total_spots   || 10;
      const occupiedSpots = spot.occupied_spots || 0;
      const isAvailable   = occupiedSpots < totalSpots;
      const spotsLeft     = totalSpots - occupiedSpots;

      let stateColor = '#22C55E';
      let stateClass = 'pin-high';
      if (!isAvailable)       { stateColor = '#EF4444'; stateClass = 'pin-saturated'; }
      else if (spotsLeft <= 2){ stateColor = '#FACC15'; stateClass = 'pin-medium';   }
      if (spot.es_pmr)        { stateColor = '#3B82F6'; stateClass = 'pin-pmr';      }

      const icon = L.divIcon({
        className: `custom-div-icon ${stateClass}`,
        html: `<div style="background:${stateColor};width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 15px ${stateColor}80;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">${spot.es_pmr ? '<i class="fa-solid fa-wheelchair"></i>' : spotsLeft}</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon });
      if (markerLayerRef.current) marker.addTo(markerLayerRef.current);

      const precio   = spot.precio_hora ? `$${spot.precio_hora.toLocaleString()}/hr` : 'Gratis';
      const safeName = (spot.nombre || '').replace(/[<>&"']/g, c =>
        ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]
      );

      marker.bindTooltip(`
        <div style="font-family:'Inter',sans-serif;padding:4px;">
          <strong style="font-size:14px;color:#f8fafc;">${safeName}</strong><br>
          <span style="color:#94a3b8;font-size:11px;">${precio}</span><br>
          <span style="color:${stateColor};font-weight:800;font-size:12px;display:block;margin-top:4px;">
            ${isAvailable ? `${spotsLeft} disp.` : 'COMPLETO'}
          </span>
        </div>`, {
        className: 'custom-map-tooltip glass-tooltip',
        direction: 'top', offset: [0, -15], opacity: 1,
      });

      marker.on('click', () => {
        if (onSpotSelect) onSpotSelect({ ...spot, total_spots: totalSpots, occupied_spots: occupiedSpots });
      });
    });

    // Cleanup: only clear dynamic layers — do NOT destroy the map or circles.
    // The circles are updated in-place via setLatLng; destroying and re-adding
    // them on every render was the cause of the setLatLng-on-null crash.
    return () => {
      if (markerLayerRef.current) markerLayerRef.current.clearLayers();
    };
  }, [location, isLoading, parkings, onSpotSelect, radius, filters]);

  // ── Full cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (radarCircleRef.current) { radarCircleRef.current.remove(); radarCircleRef.current = null; }
      if (radarPulseRef.current)  { radarPulseRef.current.remove();  radarPulseRef.current  = null; }
      if (markerLayerRef.current) { markerLayerRef.current.clearLayers(); markerLayerRef.current = null; }
      if (userMarkerRef.current)  { userMarkerRef.current.remove();  userMarkerRef.current  = null; }
      if (mapRef.current)         { mapRef.current.remove();          mapRef.current          = null; }
    };
  }, []);

  // ── 3. Live avatar marker ──
  // FIX: mapReady (state, not ref) is the correct dependency to detect when
  // the map is initialized. mapRef.current is a mutable ref — using it as a
  // dependency does NOT trigger this effect when the ref is first assigned.
  // userMarkerRef replaces useState(userMarker) to avoid stale closure issues.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !location) return;

    const isReady    = userName !== null;
    const userInitial = isReady ? userName.charAt(0).toUpperCase() : '…';

    const userLiveIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `<div class="user-live-marker ${!isReady ? 'loading-avatar' : ''}">${userInitial}</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([location.lat, location.lng], {
        icon: userLiveIcon, zIndexOffset: 1000,
      }).addTo(mapRef.current);
    } else {
      // Safe: ref is guaranteed non-null
      userMarkerRef.current.setLatLng([location.lat, location.lng]);
      userMarkerRef.current.setIcon(userLiveIcon);
    }
  }, [mapReady, location, userName]);

  if (error) return (
    <div className="flex h-full w-full items-center justify-center bg-[#0f172a]">
      <div className="glass-panel p-6 text-red-400 border border-red-500/20">
        <i className="fa-solid fa-triangle-exclamation mr-2"></i> Error de mapa: {error}
      </div>
    </div>
  );

  return (
    <>
      <div id="map" className="map-container shadow-2xl" />
      <style global jsx>{`
        .radar-pulse-anim { animation: radarPulse 3s ease-out infinite; transform-origin: center; }
        @keyframes radarPulse { 0% { transform: scale(0.5); fill-opacity: 0.6; } 100% { transform: scale(1.15); fill-opacity: 0; } }
        @keyframes livePulse { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.7); } 70% { box-shadow: 0 0 0 20px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }
        .user-live-marker { display:flex; justify-content:center; align-items:center; width:36px!important; height:36px!important; background:rgba(15,23,42,0.8); backdrop-filter:blur(4px); border:2px solid #3B82F6; border-radius:9999px; color:white; font-size:16px; font-weight:700; text-transform:uppercase; animation:livePulse 2s infinite; box-shadow:0 4px 6px -1px rgba(0,0,0,.5); }
        .loading-avatar { opacity:0.5; animation:text-pulse 1.5s infinite ease-in-out; }
        @keyframes text-pulse { 0%,100% { opacity:0.4; } 50% { opacity:0.8; } }
        .pin-high { animation: pin-pulse 2s infinite; }
        .pin-saturated { opacity:0.5; filter:grayscale(0.5); }
        .pin-pmr { z-index:1000!important; }
        @keyframes pin-pulse { 0% { transform:scale(1); box-shadow:0 0 0 0 rgba(34,197,94,0.7); } 70% { transform:scale(1.1); box-shadow:0 0 0 10px rgba(34,197,94,0); } 100% { transform:scale(1); box-shadow:0 0 0 0 rgba(34,197,94,0); } }
      `}</style>
      <style jsx>{`
        .map-container { height:100%; width:100%; min-height:calc(100vh - 80px); background-color:var(--bg-dark); }
      `}</style>
    </>
  );
}
