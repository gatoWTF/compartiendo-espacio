'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MiniMap({ lat, lng, setLat, setLng }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const container = L.DomUtil.get('mini-map');
    if (container != null) { container._leaflet_id = null; }

    // Iniciamos en Santiago Centro por defecto
    const map = L.map('mini-map', { preferCanvas: true, zoomControl: true }).setView([-33.4489, -70.6693], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
      attribution: '©OpenStreetMap' 
    }).addTo(map);
    
    mapRef.current = map;

    // INNOVACIÓN: Evento de clic para fijar el pin de ubicación
    map.on('click', function(e) {
      const { lat: newLat, lng: newLng } = e.latlng;
      
      // Actualizamos los estados del formulario en el Dashboard
      setLat(newLat.toFixed(6));
      setLng(newLng.toFixed(6));
      
      addOrUpdateMarker(newLat, newLng, map);
    });

    return () => { isMounted = false; map.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // INNOVACIÓN: Si las coordenadas cambian desde el botón GPS, movemos el mapa
  useEffect(() => {
    if (mapRef.current && lat && lng) {
      addOrUpdateMarker(lat, lng, mapRef.current);
      mapRef.current.flyTo([lat, lng], 16);
    }
  }, [lat, lng]);

  const addOrUpdateMarker = (latitude, longitude, mapInstance) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const customIcon = L.divIcon({
        className: 'leaflet-div-icon',
        html: `<div class="parking-marker" style="background-color: var(--status-red); box-shadow: 0 0 15px var(--status-red); border: 2px solid white; font-size: 14px; line-height: 18px;">📍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(mapInstance);
    }
  };

  return <div id="mini-map" style={{ height: '100%', width: '100%', borderRadius: '12px' }}></div>;
}