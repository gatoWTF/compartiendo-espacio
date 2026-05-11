export default function Map({ locations = [] }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
      <h2>Mapa de Estacionamientos (PostGIS)</h2>
      <p>Plazas cercanas encontradas: {locations.length}</p>
      <ul>
        {locations.map((loc, i) => (
          <li key={i}>{JSON.stringify(loc)}</li>
        ))}
      </ul>
    </div>
  );
}