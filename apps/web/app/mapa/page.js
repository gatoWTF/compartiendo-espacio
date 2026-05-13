'use client';
import { useState, useEffect } from 'react';
import { api } from '@/src/lib/api';
import MapComponent from '@/components/MapComponent'; // Ajusta la ruta a tu componente

export default function MapaPage() {
  const [parkings, setParkings] = useState([]);
  const [radio, setRadio] = useState(5);

  const cargarEstacionamientos = async (nuevoRadio) => {
    const result = await api.mapas.getParkings(nuevoRadio);
    if (result.success) {
      setParkings(result.data);
    }
  };

  useEffect(() => {
    cargarEstacionamientos(radio);
  }, [radio]);

  return (
    <div style={{ height: 'calc(100vh - 80px)' }}>
       {/* Selector de radio para demostrar la lógica del microservicio */}
       <div className="filter-bar" style={{ position: 'absolute', zIndex: 10, top: 100, left: 20 }}>
          <select onChange={(e) => setRadio(e.target.value)} value={radio}>
            <option value="1">1 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
          </select>
       </div>
       <MapComponent parkings={parkings} />
    </div>
  );
}