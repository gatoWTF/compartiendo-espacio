# Documento de Arquitectura y Evolución UI/UX: "Parkings Together"

**Objetivo:** Proveer el contexto absoluto sobre el rediseño de la interfaz, el cambio de paradigma funcional y la implementación técnica del mapa interactivo predictivo (MVP) para la plataforma P2P de estacionamientos.

## 1. Evolución de Marca y UI (Design System)
El diseño abandona la estética plana anterior para adoptar un enfoque moderno, inmersivo y unificado, centrado en el concepto de comunidad.

*   **Integración Simbólica (Logotipo):** Se elimina la separación entre el contenedor, la letra "P" y el ícono del automóvil. El nuevo isotipo integra múltiples siluetas de vehículos en el espacio negativo de la letra "P", comunicando visualmente el concepto "Together".
*   **Estética "Neon Glassmorphism":** El contenedor del logotipo y los elementos flotantes de la UI adoptan fondos translúcidos (`background: rgba(...)`) con desenfoque de fondo (`backdrop-filter: blur()`).
*   **Iluminación de Interfaz (Glow):** Se reemplazan los bordes planos por capas de sombras exteriores (`box-shadow`) que simulan un resplandor de neón, transicionando hacia tonos violetas para un aspecto tecnológico sobre fondos oscuros.
*   **Unificación Tipográfica:** Se utiliza una fuente Sans-Serif limpia. Las palabras "Parkings" (Bold) y "Together" (Regular) se alinean perfectamente en el mismo bloque horizontal, eliminando asimetrías.

## 2. Cambio de Paradigma UX: "Smart Spot-Matching"
Se descarta la búsqueda pasiva basada en un selector manual de "radios de distancia" (1km, 3km, 5km) con un mapa oscuro de pines estáticos. La aplicación transiciona hacia un modelo proactivo.

*   **Asistencia Predictiva:** La interfaz principal evalúa el destino y procesa la información para mostrar métricas clave al usuario antes de que comience a navegar.
*   **Métricas de Valor:** Eliminación de los radios en favor de Probabilidad de Éxito (%) y Tiempo Estimado (incluyendo el desvío para estacionar).
*   **Filtros de Acción Rápida:** Implementación de switches de un solo clic para necesidades específicas (Cargador EV, Económico, Accesibilidad PMR, Techado) que recalculan el mapa en tiempo real.

## 3. Arquitectura Frontend (React / Next.js)
El ecosistema técnico exige un rendimiento impecable (60 FPS) sin bloquear el hilo principal de JavaScript durante las transiciones de la UI o la carga de datos del mapa.

*   **Stack Principal:** Next.js (App Router), arquitectura de microservicios con Turborepo, y estilización mediante `styled-jsx` nativo complementado con variables globales CSS.
*   **Motor de Renderizado UI:** Las animaciones de estado (ej. "Buscando", "Calculando Match") deben delegarse estrictamente a la GPU utilizando las propiedades CSS `transform` y `opacity`.
*   **Motor de Mapas:** Se utiliza Leaflet (a través de `react-leaflet`).
*   **Estrategia de Capa Térmica (Heatmap):** Queda estrictamente prohibido el uso masivo de nodos del DOM (`L.divIcon`) con filtros CSS para simular calor visual, debido al DOM thrashing. La capa térmica predictiva se implementará utilizando renderizado sobre un `<canvas>` (ej. plugin `leaflet.heat`).

## 4. Implementación del MVP: Modelos Matemáticos para Leaflet
Para evitar optimizaciones prematuras en Supabase/PostGIS durante la fase MVP, el frontend procesará un array plano de objetos JSON proveniente del backend.

### Estructura de Datos Base (Por Spot)
*   `total_spots`: Espacios totales del recinto.
*   `occupied_spots`: Espacios actualmente ocupados.
*   `precio_hora`: Tarifa horaria.
*   `rating`: Calificación del anfitrión (0.0 a 5.0).
*   `es_pmr`: Booleano de accesibilidad.

El componente de React utilizará `useMemo` para iterar este array de forma ultra-rápida y transformarlo en una matriz de formato `[latitud, longitud, intensidad]` apta para inyectar en el Canvas de Leaflet. La variable intensidad (0.0 a 1.0) se calculará dinámicamente según el modo seleccionado:

### Modo 1: Congestión (Visualización por defecto)
Alerta sobre zonas saturadas. El color intenso (caliente) significa "evitar".
*   **Fórmula:** `intensidad = occupied_spots / total_spots`

### Modo 2: Oportunidad (Disponibilidad)
Revela "oasis" de espacios libres. El color intenso significa "estacionamiento asegurado".
*   **Fórmula:** `intensidad = (total_spots - occupied_spots) / total_spots`

### Modo 3: Multifiltro Ponderado (Búsqueda Inteligente)
Si el usuario activa filtros como "Económico" y "Buen Rating", se aplica un promedio ponderado matemático para destacar las mejores opciones integrales. Se requiere definir el `MAX_PRECIO_ZONA` de manera local o por entorno.

*   **Peso Ocupación (50%):** `w_ocupacion = (total_spots - occupied_spots) / total_spots`
*   **Peso Precio (30%):** `w_precio = 1 - (precio_hora / MAX_PRECIO_ZONA)`
*   **Peso Rating (20%):** `w_rating = rating / 5.0`
*   **Fórmula Final:** `intensidad = (w_ocupacion * 0.5) + (w_precio * 0.3) + (w_rating * 0.2)`
