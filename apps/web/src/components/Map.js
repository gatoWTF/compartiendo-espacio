'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map({ 
  location, 
  isLoading, 
  error, 
  parkings = [], 
  onSpotSelect,
  radius = 5, // In km
  filters = { p2p: false, pmr: false }
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    if (!mapRef.current) {
      // 1. INICIALIZAR MAPA
      mapRef.current = L.map('map', {
        zoomControl: false // Minimalista
      }).setView([location.lat, location.lng], 15);
      
      window.__mapInstance = mapRef.current;

      // Proveedor Dark Matter (Estética Tecnológica)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);

      // Crear capas globales en window para mantener persistencia entre re-renders
      window.__markerLayer = L.layerGroup().addTo(mapRef.current);
      
      // Geovalla Base
      window.__radarCircle = L.circle([location.lat, location.lng], {
        color: '#1E3A8A',
        fillColor: '#1E3A8A',
        fillOpacity: 0.10,
        weight: 1
      }).addTo(mapRef.current);

      // Capa de Pulso Animado (Escáner)
      window.__radarPulse = L.circle([location.lat, location.lng], {
        color: 'transparent',
        fillColor: '#1E3A8A',
        fillOpacity: 0.6,
        className: 'radar-pulse-anim'
      }).addTo(mapRef.current);

    } else {
      // Si el mapa ya existe, centramos suavemente en la ubicación
      mapRef.current.flyTo([location.lat, location.lng], mapRef.current.getZoom(), { animate: true, duration: 1.0 });
    }

    const markerLayer = window.__markerLayer;
    const radarCircle = window.__radarCircle;
    const radarPulse = window.__radarPulse;

    // Actualizar Geovalla del Radar
    radarCircle.setLatLng([location.lat, location.lng]);
    radarCircle.setRadius(radius * 1000); // km to meters
    
    radarPulse.setLatLng([location.lat, location.lng]);
    radarPulse.setRadius(radius * 1000);

    // Limpiar pines anteriores
    markerLayer.clearLayers();

    // Filtrar parkings (P2P o PMR)
    const filteredParkings = parkings.filter(spot => {
      if (filters.p2p && !spot.arrendador) return false;
      if (filters.pmr && !spot.es_pmr) return false;
      return true;
    });

    filteredParkings.forEach(spot => {
      const totalSpots = spot.total_spots || 10;
      const occupiedSpots = spot.occupied_spots || 0;
      const isAvailable = occupiedSpots < totalSpots;
      const spotsLeft = totalSpots - occupiedSpots;
      
      let stateColor = '#22C55E'; // Alta disponibilidad (Verde)
      let stateClass = 'pin-high';
      
      if (!isAvailable) {
        stateColor = '#EF4444'; // Saturado (Rojo)
        stateClass = 'pin-saturated';
      } else if (spotsLeft <= 2) {
        stateColor = '#FACC15'; // Medio (Amarillo)
        stateClass = 'pin-medium';
      }

      if (spot.es_pmr) {
        stateColor = '#3B82F6'; // PMR Prioridad (Azul)
        stateClass = 'pin-pmr';
      }

      const icon = L.divIcon({
        className: `custom-div-icon ${stateClass}`,
        html: `<div style="
          background: ${stateColor};
          width: 24px; height: 24px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 0 15px ${stateColor}80;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 10px; font-weight: bold;
        ">${spot.es_pmr ? '<i class="fa-solid fa-wheelchair"></i>' : spotsLeft}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(markerLayer);

      const precio = spot.precio_hora ? `$${spot.precio_hora.toLocaleString()}/hr` : 'Gratis';
      const tooltipContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <strong style="font-size: 14px; color: #f8fafc;">${spot.nombre}</strong><br>
          <span style="color: #94a3b8; font-size: 11px;">${precio}</span><br>
          <span style="color: ${stateColor}; font-weight: 800; font-size: 12px; display: block; margin-top: 4px;">
            ${isAvailable ? `${spotsLeft} disp.` : 'COMPLETO'}
          </span>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        className: 'custom-map-tooltip glass-tooltip',
        direction: 'top',
        offset: [0, -15],
        opacity: 1
      });

      marker.on('click', () => {
        if (onSpotSelect) onSpotSelect({ ...spot, total_spots: totalSpots, occupied_spots: occupiedSpots });
      });
    });

    return () => {}; // Evitamos limpieza total en unmount
  }, [location, isLoading, parkings, onSpotSelect, radius, filters]);

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
        /* Animación de Escaneo de Radar */
        .radar-pulse-anim {
          animation: radarPulse 3s ease-out infinite;
          transform-origin: center;
        }

        @keyframes radarPulse {
          0% { transform: scale(0.5); fill-opacity: 0.6; }
          100% { transform: scale(1.15); fill-opacity: 0; }
        }

        /* Sistema de Semáforo de Pines */
        .pin-high {
          animation: pin-pulse 2s infinite;
        }
        .pin-medium {
          /* Estático */
        }
        .pin-saturated {
          opacity: 0.5;
          filter: grayscale(0.5);
        }
        .pin-pmr {
          z-index: 1000 !important; /* Máxima prioridad visual */
        }

        @keyframes pin-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>
      <style jsx>{`
        .map-container {
          height: 100%;
          width: 100%;
          min-height: calc(100vh - 80px); /* Ajuste basado en el navbar */
          background-color: var(--bg-dark);
        }
      `}</style>
    </>
  );
}