export default function AboutPage() {
  return (
    <div style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--primary)', fontSize: '3rem', fontWeight: '800', marginBottom: '40px' }}>Renovando la <br/> Movilidad Urbana</h1>
      <div className="glass" style={{ padding: '40px', lineHeight: '1.8' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
          <strong>Parking's Together</strong> no es solo una aplicación de mapas; es un ecosistema de microservicios diseñado para transformar Santiago en una ciudad inteligente.
        </p>
        <p style={{ color: 'var(--text-muted)' }}>
          Nuestra innovación P2P permite que cualquier ciudadano pueda rentabilizar su espacio privado, mientras que los conductores reducen sus tiempos de búsqueda en un 40%. Integramos <strong>PostGIS</strong> para cálculos de radio precisos y priorizamos la inclusión PMR como un pilar ético del código.
        </p>
      </div>
    </div>
  );
}