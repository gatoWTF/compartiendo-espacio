'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
// 🔥 SOLUCIÓN AL BUG VISUAL: Importamos los estilos obligatorios de Leaflet
import 'leaflet/dist/leaflet.css';

export default function Map({ location, isLoading, error, parkings = [], onSpotSelect }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    if (!mapRef.current) {
      // Inicializar el mapa
      mapRef.current = L.map('map').setView([location.lat, location.lng], 15);

      // 🔥 NUEVO DISEÑO AZUL OSCURO: Cambiamos el proveedor por CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);

    } else {
      // Si el mapa ya existe, solo mover la vista si cambia la ubicación
      mapRef.current.setView([location.lat, location.lng]);
    }

    // Dibujar Marcadores de Estacionamientos
    parkings.forEach(spot => {
      const isAvailable = spot.occupied_spots < spot.total_spots;
      // Colores vivos que resaltan excelente sobre el fondo azul oscuro
      const markerColor = isAvailable ? '#2ecc71' : '#e74c3c';

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${markerColor};"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(mapRef.current);

      marker.on('click', () => {
        if (onSpotSelect) onSpotSelect(spot);
      });
    });

    // Limpieza al desmontar el componente
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location, isLoading, parkings, onSpotSelect]);

  if (error) return <div className="p-4 text-red-500 bg-red-100 rounded">Error de mapa: {error}</div>;

  // Contenedor del mapa con un alto mínimo seguro
  return <div id="map" style={{ height: '100%', width: '100%', minHeight: '500px' }} />;
}