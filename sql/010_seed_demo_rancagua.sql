-- ============================================================================
-- 010_seed_demo_rancagua.sql
-- ----------------------------------------------------------------------------
-- Datos de demostración: estacionamientos en Rancagua y comunas cercanas
-- de la Región del Libertador General Bernardo O'Higgins.
--
-- · Idempotente: el guard NOT EXISTS evita duplicar filas si se re-ejecuta.
-- · La columna `coordenadas` usa ST_SetSRID(ST_MakePoint(lng, lat), 4326)
--   para compatibilidad con el RPC espacial `buscar_estacionamientos_radio`.
-- · `user_id` queda NULL: son plazas "del sistema", reservables por cualquier
--   conductor pero no aparecen en el dashboard de ningún arrendador.
-- ============================================================================

INSERT INTO public.estacionamientos
  (nombre, arrendador, lat, lng, coordenadas, comuna, direccion, descripcion,
   precio_hora, total_spots, occupied_spots, es_pmr, rating, reviews_count,
   allowed_vehicle_types, activo, photos)
SELECT
  d.nombre, d.arrendador, d.lat, d.lng,
  ST_SetSRID(ST_MakePoint(d.lng, d.lat), 4326),
  d.comuna, d.direccion, d.descripcion,
  d.precio_hora, d.total_spots, d.occupied_spots, d.es_pmr, d.rating, d.reviews_count,
  d.veh, true, d.photos
FROM (
  VALUES
    ('Parking Plaza de los Héroes', 'Rancagua Centro Parking', -34.1708::float8, -70.7444::float8, 'Rancagua', 'Estado 285, Rancagua', 'Estacionamiento techado en el corazón de Rancagua, a pasos de la Plaza de los Héroes y servicios municipales. Vigilancia 24/7.', 1200, 20, 8, true, 4.3::real, 61, ARRAY['car','motorcycle']::text[], ARRAY['https://images.unsplash.com/photo-1545179605-1296651e9d0d?w=600']::text[]),
    ('Estacionamiento Terminal Rancagua', 'OHiggins Bus Terminal Parking', -34.1755::float8, -70.7400::float8, 'Rancagua', 'Av. Salinas 1165, Rancagua', 'Junto al Terminal de Buses de Rancagua. Ideal para viajeros y visitas al centro. Tarifa por hora y por día disponible.', 1000, 30, 14, false, 4.0::real, 88, ARRAY['car','motorcycle','bicycle']::text[], ARRAY[]::text[]),
    ('Parking Mall Portal Rancagua', 'Portal Rancagua SpA', -34.1630::float8, -70.7370::float8, 'Rancagua', 'Av. San Martín 255, Rancagua', 'Estacionamiento del Mall Portal Rancagua. Acceso cubierto, vigilancia permanente y fácil acceso desde la ruta 5 Sur.', 1400, 40, 22, true, 4.5::real, 134, ARRAY['car','motorcycle']::text[], ARRAY['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600']::text[]),
    ('Parking Estadio El Teniente', 'Machalí Parking', -34.1590::float8, -70.7220::float8, 'Machalí', 'Av. Los Libertadores 1500, Machalí', 'Estacionamiento amplio cerca del Estadio El Teniente y zona residencial de Machalí. Tarifas accesibles.', 900, 18, 5, false, 4.1::real, 33, ARRAY['car','motorcycle','bicycle']::text[], ARRAY[]::text[]),
    ('Estacionamiento Graneros Centro', 'Graneros Parking Ltda.', -34.0670::float8, -70.7280::float8, 'Graneros', 'Calle Balmaceda 320, Graneros', 'Estacionamiento tranquilo en el centro de Graneros, con acceso a comercio local y servicios de la comuna.', 800, 12, 3, false, 3.9::real, 21, ARRAY['car','motorcycle']::text[], ARRAY[]::text[])
) AS d(nombre, arrendador, lat, lng, comuna, direccion, descripcion,
       precio_hora, total_spots, occupied_spots, es_pmr, rating, reviews_count, veh, photos)
WHERE NOT EXISTS (
  SELECT 1 FROM public.estacionamientos e WHERE e.nombre = d.nombre AND e.comuna = d.comuna
);
