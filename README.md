# Parking-s-Together Backend
# Parking-s-Together

**Optimización de Movilidad Urbana y Gestión Inteligente de Estacionamientos**

"Compartiendo Espacio" es una plataforma tecnológica diseñada para revolucionar la forma en que los conductores encuentran estacionamiento en áreas metropolitanas. A través de un sistema en tiempo real basado en geolocalización, la aplicación reduce la congestión vehicular, fomenta la inclusión y abre la puerta a un modelo de economía colaborativa (Peer-to-Peer).

---

## Caracteristicas Principales

* **Semáforo de Ocupación en Tiempo Real:** Interfaz visual intuitiva (Verde, Amarillo, Rojo) impulsada por WebSockets para conocer la disponibilidad al instante de forma segura mientras se conduce.
* **Enfoque Inclusivo:** Monitoreo y visualización destacada de plazas de garantía exclusivas para personas con movilidad reducida.
* **Modelo P2P y Tarifas Dinámicas:** Permite a usuarios particulares ofrecer sus propios espacios privados, junto con un sistema de reservas anticipadas.
* **Preparado para IoT y Smart Cities:** Arquitectura escalable diseñada para integrarse en el futuro con sensores de piso y cámaras de reconocimiento de patentes.

---

## Stack Tecnológico

El proyecto está construido sobre una arquitectura moderna, escalable y orientada a la nube para garantizar respuestas de baja latencia:

* **Frontend y API Routes:** Next.js (React)
* **Base de Datos, Realtime y Auth:** Supabase (PostgreSQL + PostGIS para consultas geoespaciales)
* **Despliegue y Hosting (Edge):** Vercel
* **Motor de Predicción (Microservicio):** Python
* **Control de Versiones y CI/CD:** GitHub

---

## Estructura de la Documentación

Para comprender a fondo la lógica, arquitectura y reglas comerciales de este proyecto, revisa los siguientes documentos adjuntos en la raíz de este repositorio:

1. [Contexto Técnico y Arquitectura](docs/context.md): Detalles sobre el flujo de datos, la justificación del stack tecnológico y la estructuración de los módulos.
2. [Product Requirements Document](docs/prd_business.md): Reglas de negocio, modelo de monetización, alcance del producto final y métricas de éxito (KPIs).
