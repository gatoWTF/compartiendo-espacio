import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function Map({ location, isLoading, error, parkings = [], onSpotSelect }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (isLoading || typeof window === 'undefined') return;

    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([location.lat, location.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([location.lat, location.lng]);
    }

    // Dibujar Marcadores
    parkings.forEach(spot => {
      const isAvailable = spot.occupied_spots < spot.total_spots;
      const markerColor = isAvailable ? '#2ecc71' : '#e74c3c';
      
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(mapRef.current);
      
      marker.on('click', () => {
        if (onSpotSelect) onSpotSelect(spot);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [location, isLoading, parkings, onSpotSelect]);

  if (error) return <div className="p-4 text-red-500 bg-red-100 rounded">Error de mapa: {error}</div>;

  return <div id="map" style={{ height: '100%', width: '100%', minHeight: '400px' }} />;
}
