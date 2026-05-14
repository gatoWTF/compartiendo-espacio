'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
// Asegúrate de que esta ruta sea la misma que te funcionó en el Dashboard
import { api } from '../scr/lib/api'; 

// IMPORTANTE: Importamos el mapa dinámicamente, apagando el SSR (Server Side Rendering)
const MapComponent = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Cargando mapa...</div>
});

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
    <div style={{ height: 'calc(100vh - 80px)', position: 'relative' }}>
       {/* Selector de radio para demostrar la lógica del microservicio */}
       <div className="filter-bar" style={{ position: 'absolute', zIndex: 1000, top: 20, left: 20, background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <label style={{ color: 'black', marginRight: '10px', fontWeight: 'bold' }}>Radio de búsqueda:</label>
          <select onChange={(e) => setRadio(e.target.value)} value={radio} style={{ color: 'black', padding: '5px' }}>
            <option value="1">1 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
          </select>
       </div>
       
       {/* Aquí usamos el componente dinámico */}
       <MapComponent parkings={parkings} />
    </div>
  );
}