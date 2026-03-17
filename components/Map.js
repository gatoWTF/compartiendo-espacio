'use client';
import { useEffect } from 'react';
import L from 'leaflet';

export default function Map() {
  useEffect(() => {
    const container = L.DomUtil.get('real-map');
    if (container != null) {
      container._leaflet_id = null;
    }

    const map = L.map('real-map', { 
      preferCanvas: true,
      zoomControl: false 
    }).setView([-33.4489, -70.6693], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
      attribution: '© OpenStreetMap' 
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  return null; 
}