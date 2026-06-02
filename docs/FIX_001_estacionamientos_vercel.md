# FIX #001 — Estacionamientos no se muestran en Vercel (Prioridad Crítica)

Fecha: 2026-06-01
Estado: Implementado. Pendiente de validación en deploy de producción.

---

## 1. Problema encontrado

En producción (Vercel) el mapa carga vacío: los estacionamientos almacenados en
Supabase no aparecen. En desarrollo local (`npm run dev`) sí aparecen. No se muestra
ningún error al usuario; el mapa simplemente queda sin nodos.

## 2. Causa raíz (confirmada a nivel de código)

El problema **no es Supabase ni RLS**. La política
`estacionamientos_select_all FOR SELECT USING (true)` permite lectura pública, y la
tabla tiene datos. La causa es **arquitectónica**:

`apps/web` no consultaba Supabase directamente. En el mapa, el navegador del usuario
hacía `fetch` a un microservicio externo (`ms-mapas`) cuya URL viene de una variable
inlineada en build:

```js
// useMapRadar.js (antes)
const URL = process.env.NEXT_PUBLIC_MS_MAPAS_URL || 'http://localhost:3002/api/v1';
fetch(`${URL}/search?...`)
```

Cadena de fallo en Vercel:

1. Si `NEXT_PUBLIC_MS_MAPAS_URL` no está definida en el proyecto web de Vercel, cae al
   fallback `http://localhost:3002`. El navegador del usuario en producción intenta
   conectarse a *su propio* localhost:3002 → conexión rechazada.
2. El error se traga en silencio: `fetchWithTimeout` (api.js) y `fetchRadar`
   (useMapRadar.js) capturan la excepción y devuelven `[]`. No hay error visible, solo
   un mapa vacío. (Este es el "error silencioso".)
3. Aunque la variable estuviera definida, `ms-mapas` debe estar desplegado como proyecto
   Vercel aparte, con sus propias `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` y con CORS
   (`NEXT_PUBLIC_WEB_URL`) correcto. Si falta cualquiera, devuelve 500 →
   `success:false` → `[]`.

Es el patrón clásico "funciona en local, no en Vercel": en local los puertos
3002/3003 existen; en producción no, salvo que se replique toda la infraestructura de
microservicios con sus variables y CORS.

Adicionalmente se detectó que el filtro `radius/lat/lng` que enviaba el frontend se
ignoraba en el backend (el repositorio nunca filtraba por distancia), y que las
escrituras (crear/editar/borrar) usaban el cliente anónimo sin JWT, por lo que las
políticas RLS de INSERT/UPDATE/DELETE las bloqueaban (auth.uid() = null).

## 3. Solución implementada (Web autosuficiente)

Se eliminó la dependencia en runtime de microservicios externos. `apps/web` ahora
incluye **route handlers de Next.js de mismo origen** que consultan Supabase del lado
servidor. Mismo origen ⇒ sin CORS, sin localhost, funciona desplegando un solo proyecto
en Vercel. Los microservicios siguen existiendo y se reactivan si se definen las
variables `NEXT_PUBLIC_MS_*_URL` (modo avanzado).

Detalle:

- **Lecturas (GET)**: cliente anónimo. RLS `USING (true)` permite lectura pública.
- **Escrituras (POST/PATCH/DELETE)**: cliente con el JWT del usuario reenviado en la
  cabecera `Authorization: Bearer <token>`, de modo que RLS evalúa `auth.uid()` con el
  usuario real (las escrituras antes fallaban por esto). No se usa el Service Role en el
  frontend.
- Se implementó el filtro geográfico (Haversine) que antes se ignoraba.
- Se reescribió `fetchWithTimeout` para preservar el mensaje real de error del backend
  en lugar de ocultarlo siempre tras `[]`.

## 4. Archivos modificados / creados

| Archivo | Cambio |
|---|---|
| `packages/supabase-db/index.js` | + `getSupabaseWithToken(accessToken)`: cliente con JWT del usuario (RLS activo). |
| `apps/web/app/api/mapas/search/route.js` | **Nuevo.** Route handler GET/POST/PATCH/DELETE de estacionamientos, mismo origen. |
| `apps/web/app/api/reservas/reserve/route.js` | **Nuevo.** Route handler GET/POST de reservas (patrón Saga) de mismo origen. |
| `apps/web/src/lib/api.js` | URLs por defecto a `/api/mapas` y `/api/reservas`; reenvío del JWT en escrituras; manejo de error que ya no oculta el mensaje. |
| `apps/web/src/hooks/useMapRadar.js` | `fetchRadar` usa `/api/mapas` por defecto en lugar de `localhost:3002`. |
| `apps/web/next.config.mjs` | + `transpilePackages: ["@parkings/supabase-db"]` (el web ahora consume el paquete en sus route handlers). |

## 5. Configuración requerida en Vercel (proyecto web)

Obligatorio para que funcione (variables del proyecto `web`):

- `NEXT_PUBLIC_SUPABASE_URL` = `https://obthriistwvcutjfrksh.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (anon key del proyecto)

Importante:

- **NO definir** `NEXT_PUBLIC_MS_MAPAS_URL` ni `NEXT_PUBLIC_MS_RESERVAS_URL` en el
  proyecto web (o el código volvería a apuntar a microservicios externos). Si existen
  apuntando a `localhost`, hay que eliminarlas.
- `SUPABASE_SERVICE_ROLE_KEY` **ya no es necesaria** en el proyecto web (mejora de
  seguridad).

Para Realtime (sincronización en vivo del mapa), ejecutar una vez en el SQL Editor de
Supabase:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.estacionamientos;
```

## 6. Riesgos asociados

- **Bajo.** Cambio backend/config, sin tocar diseño visual ni CSS.
- Si el usuario tenía un despliegue de microservicios funcional, este cambio cambia el
  modo por defecto a "mismo origen". Para mantener microservicios basta con definir las
  `NEXT_PUBLIC_MS_*_URL`.
- `transpilePackages` en web: estándar y soportado; sin impacto en runtime del cliente.
- Las escrituras ahora exigen sesión (JWT). Es el comportamiento correcto, pero si algún
  flujo creaba estacionamientos sin sesión, dejará de funcionar (deseable por seguridad).

## 7. Impacto esperado

- Los estacionamientos se muestran en Vercel desplegando un único proyecto, sin CORS ni
  microservicios externos, con menor latencia (sin salto entre servicios).
- Crear/editar/borrar estacionamientos y crear reservas funcionan bajo RLS con el usuario
  autenticado.
- Errores de backend dejan de ocultarse silenciosamente.

## 8. Validación

- [x] Sintaxis de todos los archivos modificados (`node --check`).
- [x] Pruebas de runtime de las piezas nuevas: exports de `supabase-db`,
      `getSupabaseWithToken` (con y sin token), guard de Service Role, parsing de token
      Bearer y cálculo Haversine.
- [ ] `next build` completo: no ejecutable en el entorno de análisis (requiere descargar
      el binario SWC de Linux desde npm). Debe validarse en el build de Vercel.
- [ ] Validación en producción: tras configurar variables y redeploy, confirmar que el
      mapa muestra estacionamientos y que crear/editar funciona autenticado.
