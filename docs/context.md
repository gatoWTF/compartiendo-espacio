# Contexto Técnico y Arquitectura

## Propósito del Sistema
Compartiendo Espacio es una red P2P inteligente para estacionamientos. Su propósito es optimizar la movilidad urbana y reducir emisiones al facilitar que dueños de espacios privados (anfitriones) arrienden sus espacios a conductores en tiempo real.

## Arquitectura (Next.js + Turborepo + Supabase)
El proyecto está estructurado como un Monorepo usando **Turborepo** para administrar múltiples aplicaciones Next.js que actúan como microservicios desacoplados:
- `apps/web`: Frontend principal (App Router).
- `apps/auth`: Microservicio de autenticación.
- `apps/ms-mapas`: Microservicio geoespacial.
- `apps/ms-reservas`: Microservicio transaccional.

Se utiliza **Supabase** como la base de datos subyacente (PostgreSQL) y gestor de identidad, empleando `packages/supabase-db` para conectarse a la nube desde los distintos servicios. 

## Flujo de Datos y Concurrencia
- **WebSockets / Realtime:** Supabase es empleado para actualizaciones en tiempo real del semáforo de ocupación.
- **Sagas y Transacciones:** El backend orquesta estados transaccionales usando patrones Saga para revertir o confirmar reservas, asegurando consistencia.
- **Microservicios (BFF):** El cliente se comunica con los microservicios usando REST (Rutas de API de Next.js), y éstos validan, operan y escriben en Supabase de forma segura.

## Seguridad
- La Base de Datos está protegida por Row Level Security (RLS) en tablas como `perfiles` y `vehiculos`.
- Rutas protegidas mediante un Middleware de autenticación central.
- Privilegios de base de datos divididos: Service Role para el backend confiable, Anon Key para el frontend público o consultas protegidas por token.
