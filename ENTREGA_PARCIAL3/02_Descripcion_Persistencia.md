# Descripción de la Persistencia de Datos
## Parkings Together — Evaluación Parcial N°3 (DSY1106)

---

## 1. Motor y estrategia

La persistencia se implementa sobre **PostgreSQL 17** gestionado por **Supabase**,
con la extensión geoespacial **PostGIS**. La estrategia **no** usa un ORM tipo JPA,
sino el enfoque equivalente y nativo del stack: **acceso por PostgREST** (API REST
autogenerada sobre las tablas) combinado con **Stored Procedures (funciones
PL/pgSQL)** para toda la lógica de negocio transaccional. En la rúbrica esto
corresponde explícitamente a la opción **“SPs” (procedimientos almacenados)**.

| Capa | Mecanismo | Rol |
|---|---|---|
| Acceso CRUD simple | PostgREST (`supabase.from('tabla')`) | Lecturas/escrituras directas con RLS |
| Lógica de negocio | **Stored Procedures** PL/pgSQL (`supabase.rpc(...)`) | Transacciones atómicas, reglas, agregados |
| Seguridad | **RLS** (Row Level Security) | Autorización por fila según `auth.uid()` |
| Geolocalización | **PostGIS** (`geography`, índice GIST) | Búsqueda por radio O(log n) |
| Tiempo real | **Realtime** (WebSockets) | Sincronización de ocupación en el mapa |

---

## 2. Modelo de datos (esquema relacional)

Cinco tablas principales (archivo fuente: `supabase_schema.sql` y `sql/`):

| Tabla | PK | Relaciones | Notas |
|---|---|---|---|
| `perfiles` | `id uuid` | 1:1 con `auth.users` | Rol `cliente`/`arrendador`; trigger crea el perfil al registrarse |
| `vehiculos` | `id uuid` | N:1 con `auth.users` | Patente, modelo, color |
| `estacionamientos` | `id serial` | N:1 con `auth.users` | `lat/lng`, `coordenadas geography(Point,4326)`, `total_spots`, `occupied_spots` |
| `reservas` | `id uuid` | N:1 con `estacionamientos` y `auth.users` | Estados: pendiente→confirmada→activa→completada/cancelada |
| `favoritos` | `id uuid` | N:1 a usuario y estacionamiento | `UNIQUE(user_id, estacionamiento_id)` |

**Integridad referencial:** claves foráneas con `ON DELETE CASCADE`, y restricciones
`CHECK` de negocio, p. ej.:

```sql
CONSTRAINT estacionamientos_spots_validos
  CHECK (occupied_spots >= 0 AND occupied_spots <= total_spots),
CONSTRAINT reservas_calificacion_rango
  CHECK (calificacion IS NULL OR calificacion BETWEEN 1 AND 5)
```

---

## 3. Seguridad a nivel de fila (RLS)

Todas las tablas tienen **RLS habilitado**. Ejemplos reales:

```sql
-- Lectura pública de estacionamientos; escritura solo del dueño arrendador
CREATE POLICY estacionamientos_select_all   ON estacionamientos FOR SELECT USING (true);
CREATE POLICY estacionamientos_insert_arrendador ON estacionamientos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'arrendador'));

-- Un conductor solo ve/gestiona SUS reservas; el arrendador ve las de sus plazas
CREATE POLICY reservas_select_conductor  ON reservas FOR SELECT USING (auth.uid() = conductor_id);
CREATE POLICY reservas_select_arrendador ON reservas FOR SELECT USING (
  EXISTS (SELECT 1 FROM estacionamientos e
          WHERE e.id = reservas.estacionamiento_id AND e.user_id = auth.uid()));
```

El **JWT del usuario** viaja desde el BFF/microservicio hasta Postgres (cabecera
`Authorization: Bearer`), de modo que `auth.uid()` evalúa al **usuario real** y RLS
autoriza cada fila. Esto evita confiar la autorización al código de aplicación.

---

## 4. Stored Procedures (lógica de negocio en la base)

Las operaciones críticas son **funciones PL/pgSQL**, ejecutadas con
`supabase.rpc('nombre', { ...args })`. Ventajas: **atomicidad** (transacción dentro
de la función), menor latencia (un round‑trip) y reglas centralizadas.

| Procedimiento | Tipo | Qué hace |
|---|---|---|
| `buscar_estacionamientos_radio(lat,lng,radio,...)` | `STABLE` | Búsqueda geoespacial PostGIS por radio + filtros (comuna, PMR, precio, disponibilidad) |
| `reservar_estacionamiento(p_id)` | `SECURITY DEFINER` | Reserva atómica: valida cupo, inserta reserva y actualiza ocupación con bloqueo `FOR UPDATE` |
| `calificar_reserva(id,calif,coment)` | `SECURITY DEFINER` | Registra calificación y **recalcula** `rating`/`reviews_count` del estacionamiento |
| `completar_reserva(id)` | `SECURITY DEFINER` | Transiciona la reserva a `completada` (arrendador o conductor) |
| `obtener_resenas(p_id)` | `SECURITY DEFINER` | Expone reseñas públicas sin requerir `service_role` (lectura segura cross‑user) |

**Ejemplo — reserva atómica con bloqueo pesimista (extracto):**

```sql
CREATE OR REPLACE FUNCTION reservar_estacionamiento(p_estacionamiento_id integer)
RETURNS reservas LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_e estacionamientos%ROWTYPE; v_r reservas;
BEGIN
  SELECT * INTO v_e FROM estacionamientos WHERE id = p_estacionamiento_id FOR UPDATE; -- lock
  IF v_e.occupied_spots >= v_e.total_spots THEN
    RAISE EXCEPTION 'Estacionamiento lleno';
  END IF;
  INSERT INTO reservas(estacionamiento_id, conductor_id, estado)
       VALUES (p_estacionamiento_id, auth.uid(), 'activa') RETURNING * INTO v_r;
  UPDATE estacionamientos SET occupied_spots = occupied_spots + 1 WHERE id = p_estacionamiento_id;
  RETURN v_r;
END; $$;
```

> El microservicio **ms‑reservas** implementa además, a nivel de aplicación, el
> patrón **Saga** con **transacción compensatoria**: si tras crear la reserva falla
> la actualización de ocupación, elimina la reserva (rollback lógico). Así hay
> consistencia tanto en la BD (transacción del SP) como entre servicios (Saga).

---

## 5. Geolocalización (PostGIS)

Cada estacionamiento guarda `coordenadas geography(Point, 4326)` además de
`lat/lng`. Un **índice GIST** permite que la búsqueda por radio sea **O(log n)**:

```sql
-- Índice espacial
CREATE INDEX idx_estac_coordenadas ON estacionamientos USING GIST (coordenadas);

-- Búsqueda por radio (dentro del SP buscar_estacionamientos_radio)
WHERE ST_DWithin(
  coordenadas,
  ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
  p_radio_km * 1000        -- metros
)
```

Esto sustituye el cálculo Haversine en memoria por una operación indexada en la
base, clave para escalar a miles de plazas (criterio de **escalabilidad** del
indicador 7 de la defensa).

---

## 6. Sincronización en tiempo real

La tabla `estacionamientos` está publicada en `supabase_realtime`. El frontend se
suscribe vía **WebSockets** y recibe `INSERT/UPDATE/DELETE`, de modo que la
ocupación de las plazas se refleja en el mapa **sin recargar** (semáforo de
disponibilidad verde/amarillo/rojo).

```js
supabase.channel('public:estacionamientos')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'estacionamientos' }, applyChange)
  .subscribe();
```

---

## 7. Cómo accede cada componente a la persistencia

```
Frontend ──HTTP──▶ BFF (apps/web) ──┬─ supabase.from('estacionamientos')  (CRUD + RLS)
                                     └─ supabase.rpc('reservar_estacionamiento')  (SP)
ms-mapas    ──▶ MapRepository    ──▶ supabase.from(...) / rpc('buscar_estacionamientos_radio')
ms-reservas ──▶ ReserveRepository──▶ supabase.rpc(...) + Saga compensatoria
auth        ──▶ AuthRepository   ──▶ supabase.auth + tabla perfiles (trigger)
```

El acceso siempre pasa por el paquete **`@parkings/supabase-db`** (cliente
**Singleton**), que centraliza la configuración y la inyección del token. Ningún
componente abre conexiones directas ni duplica credenciales.

---

## 8. Resumen de cumplimiento (indicador 3 de la rúbrica)

- ✅ **Persistencia mediante SPs** (PL/pgSQL) + PostgREST.
- ✅ **Integridad** por FKs, CHECKs y RLS.
- ✅ **Transaccionalidad** (bloqueo `FOR UPDATE` + Saga compensatoria).
- ✅ **Escalabilidad** geoespacial (PostGIS + índice GIST).
- ✅ **Tiempo real** (Realtime/WebSockets).
- ✅ Verificado **en producción** (Supabase `obthriistwvcutjfrksh`, PostgreSQL 17).
