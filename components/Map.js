'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map({ parkings, selectedParkingId, userLocation }) {
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markersMapRef = useRef({});
  const userMarkerRef = useRef(null); // Ref para el marcador del GPS

  useEffect(() => {
    let isMounted = true;
    const container = L.DomUtil.get('real-map');
    if (container != null) { container._leaflet_id = null; }

    const map = L.map('real-map', { preferCanvas: true, zoomControl: false }).setView([-33.4489, -70.6693], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '©OpenStreetMap ©CartoDB'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => { isMounted = false; map.remove(); };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current || !parkings) return;

    markersLayerRef.current.clearLayers();
    markersMapRef.current = {}; 

    parkings.forEach(spot => {
      const occupancy = spot.occupied_spots / spot.total_spots;
      const statusClass = occupancy > 0.85 ? 'red' : (occupancy > 0.5 ? 'orange' : 'green');
      const hexColor = occupancy > 0.85 ? '#ef4444' : (occupancy > 0.5 ? '#f59e0b' : '#10b981');

      const customIcon = L.divIcon({
        className: 'leaflet-div-icon',
        html: `<div class="parking-marker parking-marker-${statusClass}" style="box-shadow: 0 0 10px ${hexColor}">P</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon })
      .bindPopup(`
        <div style="color: #1e293b; font-family: sans-serif; padding: 5px;">
          <strong style="font-size: 1.1rem; color: ${hexColor};">${spot.nombre}</strong><br/>
          <span style="color: #64748b; font-size: 0.9rem;">Anfitrión: ${spot.arrendador}</span><br/>
          <hr style="margin: 8px 0; border: 0.5px solid #e2e8f0;"/>
          <b style="color: black; font-size: 1rem;">Libres: ${spot.total_spots - spot.occupied_spots}</b>
        </div>
      `);

      markersLayerRef.current.addLayer(marker);
      markersMapRef.current[spot.id] = marker;
    });
  }, [parkings]); 

  useEffect(() => {
    if (!mapRef.current || !markersMapRef.current || !selectedParkingId) return;
    const selectedMarker = markersMapRef.current[selectedParkingId];
    if (selectedMarker) {
      mapRef.current.flyTo(selectedMarker.getLatLng(), 16, { animate: true, duration: 1.5 });
      selectedMarker.openPopup();
    }
  }, [selectedParkingId]); 

  // INNOVACIÓN FASE 2: Dibujar y Volar al marcador del usuario
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (userMarkerRef.current) {
      mapRef.current.removeLayer(userMarkerRef.current);
    }

    const userIcon = L.divIcon({
      className: 'leaflet-div-icon',
      html: `<div class="parking-marker" style="background-color: var(--primary); box-shadow: 0 0 15px var(--primary); border: 2px solid white; font-size: 8px;">TÚ</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapRef.current)
      .bindPopup('<b style="color:black;">Tu ubicación actual</b>');

    mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true, duration: 1.5 });
  }, [userLocation]);

  return null;
}