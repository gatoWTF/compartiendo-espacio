// Catálogo de planes de suscripción de Parkings Together.
// Precios en CLP. El ciclo anual aplica ~2 meses gratis (10x el mensual).

export const PLANES = {
  conductor: [
    {
      id: 'free',
      nombre: 'Gratis',
      tagline: 'Para empezar a moverte',
      precioMensual: 0,
      color: '#64748b',
      icon: 'fa-car',
      destacado: false,
      beneficios: [
        { txt: 'Búsqueda y reserva de plazas', ok: true },
        { txt: 'Radar de proximidad en el mapa', ok: true },
        { txt: 'Hasta 3 reservas activas a la vez', ok: true },
        { txt: 'Reseñas y favoritos', ok: true },
        { txt: 'Reserva anticipada (hasta 7 días)', ok: false },
        { txt: 'Ranking "Mejores de tu zona"', ok: false },
        { txt: 'Sin comisión de servicio', ok: false },
      ],
    },
    {
      id: 'pro',
      nombre: 'Conductor Pro',
      tagline: 'El estacionamiento, resuelto',
      precioMensual: 3990,
      color: '#3b82f6',
      icon: 'fa-bolt',
      destacado: true,
      beneficios: [
        { txt: 'Todo lo del plan Gratis', ok: true },
        { txt: 'Reservas activas ilimitadas', ok: true },
        { txt: 'Reserva anticipada hasta 7 días', ok: true },
        { txt: 'Sin comisión de servicio en reservas', ok: true },
        { txt: 'Ranking "Mejores de tu zona" con filtros', ok: true },
        { txt: 'Insignia Pro en tus reseñas', ok: true },
        { txt: 'Soporte prioritario', ok: true },
      ],
    },
  ],
  arrendador: [
    {
      id: 'free',
      nombre: 'Gratis',
      tagline: 'Publica tu primera plaza',
      precioMensual: 0,
      color: '#64748b',
      icon: 'fa-square-parking',
      destacado: false,
      beneficios: [
        { txt: 'Hasta 2 estacionamientos publicados', ok: true },
        { txt: 'Gestión de reservas básica', ok: true },
        { txt: 'Hasta 3 fotos por plaza', ok: true },
        { txt: 'Aparición estándar en el mapa', ok: true },
        { txt: 'Destacado ⭐ en el mapa', ok: false },
        { txt: 'Analítica avanzada de ingresos', ok: false },
        { txt: 'Insignia "Verificado"', ok: false },
      ],
    },
    {
      id: 'premium',
      nombre: 'Arrendador Premium',
      tagline: 'Maximiza tus ingresos',
      precioMensual: 9990,
      color: '#8b5cf6',
      icon: 'fa-crown',
      destacado: true,
      beneficios: [
        { txt: 'Estacionamientos ilimitados', ok: true },
        { txt: 'Destacado ⭐ en el mapa (apareces primero)', ok: true },
        { txt: 'Fotos ilimitadas por plaza', ok: true },
        { txt: 'Analítica avanzada de ocupación e ingresos', ok: true },
        { txt: 'Insignia "Verificado" en tus plazas', ok: true },
        { txt: 'Comisión reducida por reserva', ok: true },
        { txt: 'Soporte prioritario 24/7', ok: true },
      ],
    },
  ],
};

// Precio según ciclo: anual = 10 mensualidades (≈ 2 meses gratis).
export function precioCiclo(precioMensual, ciclo) {
  if (precioMensual === 0) return 0;
  return ciclo === 'anual' ? precioMensual * 10 : precioMensual;
}

export const FAQ = [
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. Puedes volver al plan Gratis en cualquier momento desde tu perfil. Mantienes los beneficios hasta el final del período pagado.',
  },
  {
    q: '¿Cómo se cobra el plan anual?',
    a: 'El plan anual equivale a 10 mensualidades: pagas una vez al año y ahorras el equivalente a 2 meses.',
  },
  {
    q: '¿Qué pasa con mis reservas si bajo de plan?',
    a: 'Tus reservas activas se respetan siempre. Solo cambian los límites para nuevas reservas o publicaciones.',
  },
  {
    q: '¿Los pagos son seguros?',
    a: 'Esta es una demo académica con pago simulado. En producción se integra Webpay (Transbank) para pagos reales en Chile.',
  },
];
