// Archivo: apps/web/components/MiniMap.js
// ✅ REGLA 1: Eliminado import de Supabase. Solo Leaflet para el mapa interactivo.
'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export default function MiniMap({ lat, lng, setLat, setLng }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstance.current) return;

    const L = require('leaflet');

    const initialLat = parseFloat(lat) || -33.4489;
    const initialLng = parseFloat(lng) || -70.6693;

    mapInstance.current = L.map(mapRef.current, {
      preferCanvas: true,
      zoomControl: true,
    }).setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap',
    }).addTo(mapInstance.current);

    // Click en el mapa para colocar el pin
    mapInstance.current.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      setLat(clickLat.toFixed(6));
      setLng(clickLng.toFixed(6));

      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        const pinIcon = L.divIcon({
          className: 'mini-map-pin',
          html: `<div style="width:20px;height:20px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 10px #ef4444;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        markerRef.current = L.marker([clickLat, clickLng], { icon: pinIcon }).addTo(mapInstance.current);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando lat/lng cambian desde fuera (búsqueda de dirección), mover el mapa
  useEffect(() => {
    if (!mapInstance.current || !lat || !lng) return;
    const L = require('leaflet');
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    mapInstance.current.flyTo([parsedLat, parsedLng], 16, { animate: true, duration: 1 });

    if (markerRef.current) {
      markerRef.current.setLatLng([parsedLat, parsedLng]);
    } else {
      const pinIcon = L.divIcon({
        className: 'mini-map-pin',
        html: `<div style="width:20px;height:20px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 10px #ef4444;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      markerRef.current = L.marker([parsedLat, parsedLng], { icon: pinIcon }).addTo(mapInstance.current);
    }
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  );
}