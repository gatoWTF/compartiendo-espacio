'use client';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Esto arregla los iconos que a veces no salen
import { supabase } from '../lib/supabase';

export default function Map() {
  useEffect(() => {
    // 1. Limpiar contenedor
    const container = L.DomUtil.get('real-map');
    if (container != null) { container._leaflet_id = null; }

    // 2. Crear Mapa
    const map = L.map('real-map', { 
      preferCanvas: true,
      zoomControl: false 
    }).setView([-33.4489, -70.6693], 13);

    // 3. Capa de diseño Dark
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
      attribution: '© OpenStreetMap' 
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 4. Cargar marcadores desde Supabase
    const fetchMarkers = async () => {
      const { data, error } = await supabase.from('estacionamientos').select('*');
      
      if (error) {
        console.error("Error en Supabase:", error.message);
        return;
      }

      data.forEach(spot => {
        // Lógica de semáforo del PRD (85% ocupación)
        const occupancy = spot.occupied_spots / spot.total_spots;
        const color = occupancy > 0.85 ? '#ef4444' : '#10b981';

        L.circleMarker([spot.lat, spot.lng], {
          color: color,
          fillColor: color,
          radius: 10,
          fillOpacity: 0.8
        })
        .bindPopup(`<b>${spot.nombre}</b><br>Libres: ${spot.total_spots - spot.occupied_spots}`)
        .addTo(map);
      });
    };

    fetchMarkers();

    return () => { map.remove(); };
  }, []);

  return null; 
}