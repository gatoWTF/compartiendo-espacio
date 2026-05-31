# Product Requirements Document (PRD)

## Visión del Producto
Transformar los estacionamientos subutilizados en recursos de infraestructura compartida, disminuyendo el tráfico por búsqueda de estacionamiento en la ciudad y promoviendo la accesibilidad a personas con movilidad reducida (PMR).

## Reglas de Negocio Clave
1. **Roles de Usuario:**
   - **Cliente / Conductor:** Busca espacios, los reserva y realiza el pago.
   - **Anfitrión / Arrendador:** Registra espacios, define capacidad, gestiona disponibilidad.
2. **Modelo de Transacciones:**
   - Sistema P2P con modelo de comisión.
   - Estado "Semáforo" (Verde/Disponible, Rojo/Lleno).
   - "Zonas de Garantía": Un porcentaje de espacios debe estar habilitado para PMR.
3. **Flujos Críticos:**
   - Creación de perfiles (Vehículo y Necesidad PMR).
   - Publicación de estacionamientos (Definición de Lat/Lng y Cupos).
   - Reserva anticipada (Microservicio `ms-reservas`).
   - Monitor en tiempo real (Microservicio `ms-mapas`).

## Métricas de Éxito (KPIs)
- **Tasa de Conversión:** Búsquedas que resultan en reservas exitosas.
- **Adopción PMR:** % de espacios de garantía ocupados efectivamente por usuarios autorizados.
- **Tiempo de Respuesta del Mapa:** Latencia menor a 100ms para mostrar nodos activos.
- **Emisiones Evitadas:** Cálculo estimado (minutos de búsqueda reducidos * emisión promedio/minuto).
