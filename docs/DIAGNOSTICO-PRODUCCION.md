# Diagnóstico de Producción — Parking-s-Together

Fecha: 2026-06-02
Alcance: Prioridad Crítica #1 (estacionamientos no se muestran en Vercel) + Seguridad.

---

## 1. PRIORIDAD #1 — "Los estacionamientos no se muestran en producción"

### Problema encontrado
En producción (`https://parkings-web.vercel.app`) el sitio no muestra
estacionamientos a los usuarios finales.

### Causa raíz (CONFIRMADA, no hipótesis)
**El backend y los datos funcionan correctamente. El bloqueo es de ACCESO:
el proyecto `parkings-web` en Vercel tiene activada la _Deployment Protection_
(Vercel Authentication) sobre el entorno de Producción.**

Evidencia técnica reproducible:

| Prueba | Resultado |
|---|---|
| `GET /api/mapas/search` **autenticado** (Vercel MCP) | **HTTP 200**, devuelve 5 estacionamientos en JSON |
| `GET /api/mapas/search` **anónimo** (sin sesión Vercel) | **HTTP 403 Forbidden** |
| `GET /mapa` **anónimo** | **HTTP 403 Forbidden** (página de login SSO de Vercel) |
| `get_project` → campo `"live"` | `false` |

Como el sitio entero responde 403 a cualquier visitante que no tenga cuenta
en el equipo de Vercel, los usuarios reales nunca llegan a cargar la app ni,
por tanto, los estacionamientos. La consulta a Supabase y las políticas RLS
de lectura (`SELECT USING (true)`) funcionan: la API devuelve los 5 registros
sembrados sin error.

### Solución (acción requerida en el panel de Vercel)
No es un cambio de código. Debe desactivarse la protección:

1. Vercel → Proyecto **parkings-web** → **Settings** → **Deployment Protection**.
2. En **Vercel Authentication**, desactivar la protección para **Production**
   (o configurarla como "Standard Protection" limitada solo a Preview).
3. Redeploy / esperar propagación. Verificar que `https://parkings-web.vercel.app/mapa`
   responde **200** de forma anónima.

> Nota: las herramientas MCP disponibles en esta sesión no permiten modificar
> ajustes de Deployment Protection; por eso esta acción debe hacerse en el panel.

### Validación post-fix
- `curl -s https://parkings-web.vercel.app/api/mapas/search` debe devolver
  `{"success":true,"data":[...]}` sin 403.
- La página `/mapa` debe renderizar los marcadores.

---

## 2. CRÍTICO — Fuga de secreto en el repositorio

### Problema encontrado
El archivo **`apps/web/.env.local` estaba versionado en git** (tracked) e incluía
la clave **`SUPABASE_SERVICE_ROLE_KEY`** real (privilegios de administrador,
bypassa RLS por completo), además de la URL y anon key del proyecto.

### Causa raíz
El archivo se commiteó antes de existir la regla de `.gitignore`, y la regla
previa (`.env*.local`) no lo retiró del índice una vez ya estaba versionado.

### Solución implementada (en esta rama)
- `git rm --cached apps/web/.env.local` (deja de versionarse; se conserva en local).
- `.gitignore` reforzado: ignora `.env` y `.env.*`, exceptuando `.env.example`.
- Añadida plantilla **`apps/web/.env.example`** sin secretos.

### Acción OBLIGATORIA pendiente (no automatizable desde aquí)
**Rotar inmediatamente la `SUPABASE_SERVICE_ROLE_KEY`** (y preferiblemente la
anon key) en el panel de Supabase → Settings → API, porque la clave ya estuvo
expuesta en el historial de git. Untrackear no borra el historial: la clave
sigue siendo recuperable de commits anteriores hasta que se rote.

### Riesgo
Acceso administrativo total a la base de datos por cualquiera con acceso al repo
o a su historial. Severidad: **crítica**.

---

## 3. Observaciones adicionales detectadas (para auditoría posterior)

- **Divergencia de esquema**: el esquema desplegado en producción difiere de
  `supabase_schema.sql`. Producción expone `precio_hora`, `rating`,
  `reviews_count`, `comuna`, `coordenadas` (geography PostGIS) e `id` entero;
  el archivo del repo define `total_spots`, `occupied_spots`, `arrendador` e
  `id` uuid. El `POST /api/mapas/search` inserta `total_spots`/`occupied_spots`/
  `arrendador`, columnas que podrían no existir en producción → el alta de
  estacionamientos podría fallar. Pendiente: alinear esquema real ↔ código y
  versionar las migraciones reales en `sql/`.
- Pendientes de la hoja de ruta (búsqueda avanzada, historial, reservas
  profesionales, mensajería, perfiles, optimización) quedan para fases
  posteriores una vez resueltos los dos puntos críticos anteriores.
