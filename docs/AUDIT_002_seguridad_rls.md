# AUDITORÍA #002 — Seguridad y RLS

Fecha: 2026-06-01
Alcance: módulo auth, manejo de secretos, CORS, autorización de endpoints y
políticas RLS de todas las tablas. Correcciones en `sql/004_security_hardening.sql`
y en el route handler de reservas.

Severidad: 🔴 Crítica · 🟠 Alta · 🟡 Media · ⚪ Baja

---

## 🔴 A. El flujo de reservas está roto por RLS (y permite inconsistencia de datos)

- **Problema.** Al reservar, el backend incrementaba `estacionamientos.occupied_spots`
  con el JWT del conductor.
- **Causa raíz.** La policy `estacionamientos UPDATE USING (auth.uid() = user_id)` solo
  permite al dueño (anfitrión). El conductor no es dueño → UPDATE denegado. La Saga
  intentaba compensar con `DELETE` sobre `reservas`, pero **no existía policy DELETE** en
  `reservas` → también denegado. Resultado: reserva huérfana "activa", ocupación sin
  actualizar, datos inconsistentes. Además, el patrón leer-luego-escribir en dos pasos
  permite **doble reserva** bajo concurrencia.
- **Solución.** Función Postgres `reservar_estacionamiento(uuid)` `SECURITY DEFINER` que,
  en una sola transacción: bloquea la fila (`FOR UPDATE`), valida disponibilidad, inserta
  la reserva del `auth.uid()` e incrementa la ocupación. Más `cancelar_reserva(uuid)` para
  liberar cupo. El route handler `apps/web/app/api/reservas/reserve/route.js` ahora llama a
  la RPC en vez de la Saga manual.
- **Archivos.** `sql/004_security_hardening.sql`, `apps/web/app/api/reservas/reserve/route.js`.
- **Riesgo.** Bajo: la RPC valida internamente al usuario; `EXECUTE` solo para
  `authenticated`.
- **Impacto.** Reservar funciona, es atómico y a prueba de doble reserva.

## 🟠 B. Faltaban policies UPDATE/DELETE en `reservas`

- **Problema.** Sin ellas no se pueden cancelar, completar ni reprogramar reservas
  (estados del PRD) ni compensar.
- **Solución.** Policies añadidas: `reservas_update_conductor` (cancelar), 
  `reservas_update_anfitrion` (completar/gestionar), `reservas_delete_conductor`.
- **Archivos.** `sql/004_security_hardening.sql`.
- **Impacto.** Habilita el ciclo de vida de la reserva de forma segura.

## 🟠 E. El perfil no se crea de forma fiable en el registro

- **Problema.** El registro inserta el perfil desde el cliente con el cliente anónimo.
  Si la confirmación por email está activa, el `signUp` no devuelve sesión → el `insert`
  corre sin `auth.uid()` → RLS `perfiles_insert_own` lo bloquea → usuarios sin perfil.
- **Causa raíz.** No existía un trigger que cree el perfil al nacer el usuario.
- **Solución.** Trigger `on_auth_user_created` con `handle_new_user()` `SECURITY DEFINER`
  que inserta en `perfiles` (con `ON CONFLICT DO NOTHING`). Elimina la dependencia del
  insert client-side y del Service Role en el microservicio de auth.
- **Archivos.** `sql/004_security_hardening.sql`.
- **Riesgo.** Bajo.
- **Impacto.** Todo usuario registrado tiene perfil de forma garantizada.

## 🟡 C. Sin constraint de ocupación en base de datos

- **Problema.** `occupied_spots` podía exceder `total_spots` o ser negativo a nivel DB; la
  UI lo limita, pero la API no.
- **Solución.** `CHECK (occupied_spots >= 0 AND occupied_spots <= total_spots)` (añadido
  `NOT VALID` para no bloquear filas históricas; validar luego con `VALIDATE CONSTRAINT`).
- **Archivos.** `sql/004_security_hardening.sql`.

## 🟡 D. La lectura pública expone `user_id` de cada estacionamiento

- **Problema.** `SELECT *` con RLS `USING (true)` devuelve el `user_id` (UUID de auth del
  dueño) a cualquier visitante anónimo.
- **Recomendación (no aplicada para no tocar la UI).** Exponer una **vista pública**
  `estacionamientos_publicos` sin `user_id` y que el mapa lea de ahí; o restringir columnas
  vía vista. Riesgo bajo (un UUID no es secreto crítico), pero es buena práctica de
  minimización de datos. Lo dejo propuesto para la fase de optimización.

## ⚪ F. CORS `Access-Control-Allow-Origin: '*'` en microservicios

- **Problema.** Los microservicios permiten `*` junto con la cabecera `Authorization`.
- **Estado.** Mitigado por defecto: con la web autosuficiente los microservicios ya no se
  usan en runtime. Si se despliegan, fijar `NEXT_PUBLIC_WEB_URL` al dominio real.

## ⚪ G. Service Role Key en el entorno del web

- **Problema.** `SUPABASE_SERVICE_ROLE_KEY` figura en `apps/web/.env.local`. El web ya no
  la necesita tras el FIX #001.
- **Acción.** No definir esta variable en el proyecto web de Vercel. (El `.env.local` está
  en `.gitignore`, por lo que no se ha filtrado al repositorio.) Si alguna vez se subió a un
  repositorio o log, **rotarla** desde el panel de Supabase.

## ⚪ H. `rol` guardado en `localStorage` es manipulable

- **Problema.** `auth/page.js` guarda `{ rol }` en `localStorage`; un usuario podría editarlo.
- **Estado.** Solo afecta la UI. La autorización real la impone RLS con `auth.uid()` en el
  servidor, así que no concede acceso indebido a datos. Recomendado: derivar el rol siempre
  desde `perfiles`/sesión (como ya hacen dashboard y mapa) y dejar de confiar en localStorage.

---

## Cómo aplicar

1. Ejecutar `sql/004_security_hardening.sql` completo en el SQL Editor de Supabase
   (es idempotente; se puede correr más de una vez).
2. Desplegar el web con el route handler de reservas actualizado.
3. En Vercel, no definir `SUPABASE_SERVICE_ROLE_KEY` en el proyecto web.

## Validación

- [x] Sintaxis de los archivos modificados.
- [ ] Ejecución del SQL en Supabase (requiere tu acceso al proyecto).
- [ ] Prueba end-to-end de reserva (crear, llenar, doble-reserva concurrente, cancelar)
      tras aplicar el SQL y el deploy.
