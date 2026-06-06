# Guía de Estudio — Defensa Oral (individual, 70 %)
## Parkings Together — Evaluación Parcial N°3 (DSY1106)

> **Cómo usar esta guía:** la defensa es **individual** y evalúa tu comprensión
> real. Usa estas preguntas para **practicar en voz alta** y asegurarte de que
> entiendes *por qué* se tomó cada decisión, no para memorizar. Abre el código
> mientras estudias: poder señalar el archivo exacto vale más que recitar.

---

## Indicador 5 — Técnicas de ideación y justificación de microservicios (15 %)

**P: ¿Qué técnicas de ideación usaron para diseñar la solución?**
> Partimos del **problema del cliente** (parciales 1 y 2): conectar conductores con
> dueños de estacionamientos. Usamos **mapa de empatía** y **historias de usuario**
> ("como conductor quiero ver plazas cercanas disponibles"), y un **diagrama de
> contexto** para separar responsabilidades. De ahí derivamos los *bounded contexts*
> (Domain‑Driven Design): **Mapas**, **Reservas** y **Autenticación**.

**P: ¿Por qué microservicios y no un monolito?**
> Porque las tres áreas tienen **ritmos de cambio y carga distintos**: la búsqueda
> en el mapa es de **alta lectura** (geoespacial), las reservas son
> **transaccionales** (consistencia), y la autenticación es **transversal**.
> Separarlas permite escalar y desplegar cada una de forma independiente, y aísla
> fallos (si ms‑reservas cae, el mapa sigue navegable).

**P: ¿Por qué un BFF?**
> El **BFF (apps/web)** ofrece al frontend una sola fachada de **mismo origen**
> (sin CORS), inyecta el **JWT** del usuario hacia los servicios y **orquesta**
> respuestas (p. ej. estacionamiento + reseñas). Evita que el cliente conozca las
> URLs internas y centraliza timeouts y validación.

---

## Indicador 6 — Lenguajes, tecnologías e integración (20 %, el de mayor peso)

**P: ¿Qué lenguajes y tecnologías usaron y por qué?**
> - **JavaScript / React / Next.js 16** en frontend, BFF y microservicios:
>   renderizado híbrido, *route handlers* como API y PWA para móvil.
> - **SQL / PL‑pgSQL** en la capa de persistencia: la **lógica transaccional** vive
>   en **stored procedures** (atomicidad y menos round‑trips).
> - **PostgreSQL 17 + PostGIS**: base relacional con **búsqueda geoespacial** nativa.
> - **Supabase**: Auth (JWT), Realtime (WebSockets) y PostgREST.
> - **Leaflet** (mapa), **Jest** (pruebas), **Turborepo** (monorepo).
> Son "distintos lenguajes y tecnologías": la lógica de aplicación en **JS** y la de
> datos en **PL‑pgSQL**, integradas por **API REST** y el cliente `supabase-db`.

**P: ¿Cómo se integran para responder al requerimiento del cliente?**
> El conductor abre la PWA → el **BFF** llama a **ms‑mapas** (`/api/v1/search`) que
> ejecuta el SP `buscar_estacionamientos_radio` (PostGIS) → devuelve plazas →
> el conductor reserva → el **BFF** llama a **ms‑reservas** (`/api/v1/reserve`) que
> corre la **Saga** y persiste con bloqueo → **Realtime** actualiza el mapa de
> todos los usuarios. Todo autenticado con el **JWT** validado por **RLS**.

**P: ¿Qué es el patrón Singleton aquí?**
> `@parkings/supabase-db` exporta **una sola instancia** del cliente Supabase
> compartida por todos los componentes, evitando múltiples conexiones y duplicar
> configuración/credenciales.

---

## Indicador 7 — Integración, funcionalidad y escalabilidad (15 %)

**P: Demuestra que la integración funciona.**
> En producción (`parkings-web.vercel.app`): `GET /api/mapas/search?id=47` devuelve
> el estacionamiento; `GET /api/resenas?estacionamiento_id=47` devuelve sus reseñas;
> el mapa muestra el **semáforo de disponibilidad** (verde/amarillo/rojo por % de
> ocupación) actualizándose por Realtime. (Ver `04_API_REST/ejemplos.http`.)

**P: ¿Cómo escala la solución?**
> 1. **Geoespacial:** índice **GIST** + `ST_DWithin` → búsqueda por radio **O(log n)**
>    en vez de recorrer todas las plazas.
> 2. **Servicios independientes:** cada microservicio se despliega/escala aparte.
> 3. **BFF con timeouts** (`AbortController`) → degradación elegante ante latencia.
> 4. **Caché** `stale-while-revalidate` en lecturas del mapa.
> 5. **Realtime** evita *polling* masivo a la base.

**P: ¿Qué pasa si dos personas reservan la última plaza a la vez?**
> El SP bloquea la fila con `SELECT ... FOR UPDATE` (bloqueo pesimista): la segunda
> transacción espera y, al re‑evaluar el cupo, es rechazada. A nivel de servicio,
> la **Saga** compensa si una etapa posterior falla.

---

## Indicador 8 — Pruebas unitarias y patrones de diseño (20 %, el de mayor peso)

**P: ¿Cómo aseguran la cobertura y qué cubre?**
> Con **Jest** + cobertura Istanbul: **66 pruebas**, **71.22 % de sentencias**
> (supera el 60 % exigido). La lógica de negocio (`pricing` 100 %, `payments` 92 %,
> `comunas` 100 %) y el servicio de reservas (78 %, 100 % de ramas) están cubiertos.
> (Ver `03_Informe_Pruebas_Unitarias` y `03_Cobertura_HTML/`.)

**P: ¿Qué patrones de diseño aplicaron y cómo mejoran la mantenibilidad?**
> - **Controller → Service → Repository** en cada microservicio: separa HTTP, lógica
>   y acceso a datos → se puede **cambiar la BD sin tocar la lógica** y **probar el
>   Service con el Repository mockeado**.
> - **Saga + transacción compensatoria** (ms‑reservas): consistencia sin
>   transacciones distribuidas.
> - **CQRS** (separación lectura/escritura de disponibilidad).
> - **Singleton** (cliente Supabase) y **BFF** (fachada).
> - En pruebas: **AAA** y **mocks** → tests deterministas y rápidos.

**P: Muestra una prueba que valide un patrón.**
> La prueba *"rollback (compensación) si la actualización de plazas falla"* verifica
> que, ante un error al actualizar la ocupación, la Saga **borra la reserva creada**
> (`deleteReserve('res-999')`). Es la evidencia de que el patrón compensatorio
> mantiene la integridad. (Archivo `apps/ms-reservas/tests/reserveService.test.js`.)

---

## Preguntas "trampa" frecuentes (prepárate)

| Pregunta | Respuesta corta |
|---|---|
| ¿Usan JPA? | No; el equivalente en este stack son **stored procedures** (PL‑pgSQL) + PostgREST. La pauta acepta "JPA **o** SPs". |
| ¿Dónde está la autorización? | En la base, con **RLS** evaluando `auth.uid()` desde el JWT; no se confía al código. |
| ¿Qué pasa si falta una variable de entorno? | Los endpoints degradan con `try/catch` devolviendo JSON, no un 500 con HTML (lección aprendida en el fix de reseñas). |
| ¿Por qué Next.js para microservicios? | *Route handlers* dan una API REST con poco *boilerplate* y despliegue homogéneo; la separación lógica está en Controller/Service/Repository. |
| ¿Cómo versionan? | Monorepo Turborepo en GitHub; CI/CD automático a Vercel desde `master`. |

---

## Checklist personal antes de la defensa

- [ ] Sé señalar en el código **dónde** está el BFF, cada microservicio y un SP.
- [ ] Puedo explicar **una** decisión de arquitectura con su *por qué*.
- [ ] Puedo abrir el reporte de cobertura y leer un número.
- [ ] Puedo describir la **Saga** y por qué garantiza consistencia.
- [ ] Puedo nombrar **2 patrones** y cómo ayudan a la mantenibilidad.
