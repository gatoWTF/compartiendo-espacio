'use client';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export default function MapComponent({ parkings = [], focusedSpot = null, onUserLocate = null }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const userMarkerLayer = useRef(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const L = require('leaflet'); // Carga segura en cliente

      if (!mapInstance.current && mapRef.current) {
        mapInstance.current = L.map(mapRef.current, { 
          preferCanvas: true, 
          zoomControl: false 
        }).setView([-33.4489, -70.6693], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '©OpenStreetMap'
        }).addTo(mapInstance.current);

        markersLayer.current = L.layerGroup().addTo(mapInstance.current);
        userMarkerLayer.current = L.layerGroup().addTo(mapInstance.current);
      }

      if (markersLayer.current && mapInstance.current) {
        markersLayer.current.clearLayers();
        parkings.forEach(p => {
          const isFull = p.occupied_spots >= p.total_spots;
          const markerColor = isFull ? '#ef4444' : '#10b981';
          const isFocused = focusedSpot && focusedSpot.id === p.id;

          const customIcon = L.divIcon({
            className: 'custom-pin',
            html: `<div style="background-color: ${markerColor}; width: ${isFocused ? '34px' : '28px'}; height: ${isFocused ? '34px' : '28px'}; border-radius: 50%; border: ${isFocused ? '4px' : '3px'} solid white; box-shadow: 0 0 ${isFocused ? '20px' : '10px'} ${markerColor}; display: flex; align-items: center; justify-content: center; transition: all 0.3s;"><i class="fa-solid fa-car" style="color: white; font-size: ${isFocused ? '14px' : '12px'};"></i></div>`,
            iconSize: isFocused ? [34, 34] : [28, 28],
            iconAnchor: isFocused ? [17, 17] : [14, 14]
          });

          const marker = L.marker([p.lat, p.lng], { icon: customIcon })
            .bindPopup(`<strong style="color:#333;">${p.nombre}</strong><br/><span style="color:${markerColor}">${isFull ? 'LLENO' : 'Disponible'}</span>`)
            .addTo(markersLayer.current);
            
          if(isFocused) marker.openPopup();
        });
      }
    }
  }, [parkings, focusedSpot]);

  useEffect(() => {
    if (focusedSpot && mapInstance.current) {
      mapInstance.current.flyTo([focusedSpot.lat, focusedSpot.lng], 17, { animate: true, duration: 1.2 });
    }
  }, [focusedSpot]);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    const L = require('leaflet');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (onUserLocate) onUserLocate({ lat: latitude, lng: longitude });
        mapInstance.current.flyTo([latitude, longitude], 16, { animate: true, duration: 1.5 });
        userMarkerLayer.current.clearLayers();
        const userIcon = L.divIcon({
          className: 'user-gps-pin',
          html: `<div style="position: relative; width: 20px; height: 20px;"><div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; border: 3px solid white; z-index: 2;"></div><div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; animation: pulseRing 1.5s infinite; z-index: 1;"></div></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        L.marker([latitude, longitude], { icon: userIcon }).addTo(userMarkerLayer.current);
        setIsLocating(false);
      },
      () => setIsLocating(false)
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style dangerouslySetInnerHTML={{__html: `@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(3.5); opacity: 0; } }`}} />
      <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
      <button onClick={locateUser} disabled={isLocating} style={{ position: 'absolute', bottom: '30px', right: '20px', zIndex: 1000, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '50%', width: '55px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        <i className={`fa-solid ${isLocating ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
      </button>
    </div>
  );
}