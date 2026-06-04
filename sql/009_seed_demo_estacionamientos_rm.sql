-- ============================================================================
-- 009_seed_demo_estacionamientos_rm.sql
-- ----------------------------------------------------------------------------
-- Datos de demostración: estacionamientos en comunas de la Región Metropolitana.
--
-- · Idempotente: el guard NOT EXISTS evita duplicar filas si se re-ejecuta.
-- · La columna `coordenadas` (PostGIS geometry) se calcula desde lat/lng con
--   ST_SetSRID(ST_MakePoint(lng, lat), 4326) para que el RPC espacial
--   `buscar_estacionamientos_radio` los devuelva por proximidad.
-- · `user_id` queda NULL: son plazas "del sistema" (no aparecen en el dashboard
--   de ningún arrendador), pero sí son reservables por cualquier conductor.
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
    ('Parking Plaza de Armas', 'Estacionamientos Centro SpA', -33.4372::float8, -70.6506::float8, 'Santiago', 'Compañía 1110, Santiago Centro', 'Estacionamiento techado a pasos de la Plaza de Armas y el Metro Universidad de Chile. Vigilancia 24/7 y cámaras de seguridad.', 2000, 20, 12, true, 4.6::real, 84, ARRAY['car','motorcycle']::text[], ARRAY['https://images.unsplash.com/photo-1545179605-1296651e9d0d?w=600']::text[]),
    ('Estacionamiento Costanera', 'Parking Providencia Ltda.', -33.4180::float8, -70.6060::float8, 'Providencia', 'Av. Andrés Bello 2425, Providencia', 'Subterráneo amplio junto al Costanera Center. Ideal para compras y oficinas. Acceso directo al Metro Tobalaba.', 2500, 30, 25, false, 4.4::real, 156, ARRAY['car']::text[], ARRAY['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600']::text[]),
    ('Parking El Golf', 'Las Condes Premium Parking', -33.4150::float8, -70.5840::float8, 'Las Condes', 'Av. Apoquindo 3000, Las Condes', 'Estacionamiento premium en el corazón financiero de Sanhattan. Plazas amplias y carga para vehículos eléctricos.', 3000, 15, 5, true, 4.8::real, 67, ARRAY['car','motorcycle']::text[], ARRAY['https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=600']::text[]),
    ('Plaza Ñuñoa Parking', 'Vecinos de Ñuñoa SpA', -33.4560::float8, -70.5980::float8, 'Ñuñoa', 'Av. Irarrázaval 3400, Ñuñoa', 'A pasos de Plaza Ñuñoa, bares y restaurantes. Perfecto para salir de noche con tranquilidad.', 1800, 12, 8, false, 4.3::real, 42, ARRAY['car','motorcycle','bicycle']::text[], ARRAY[]::text[]),
    ('Parking Bicentenario', 'Vitacura Parking', -33.3980::float8, -70.5800::float8, 'Vitacura', 'Av. Bicentenario 3800, Vitacura', 'Junto al Parque Bicentenario. Ambiente seguro y arbolado, ideal para deportistas y familias.', 2800, 10, 3, true, 4.7::real, 38, ARRAY['car','bicycle']::text[], ARRAY[]::text[]),
    ('Estacionamiento Plaza Maipú', 'Maipú Centro Parking', -33.5167::float8, -70.7580::float8, 'Maipú', 'Av. 5 de Abril 100, Maipú', 'Amplio estacionamiento frente a la Plaza de Maipú y el Templo Votivo. Tarifas accesibles para todos.', 1200, 25, 10, false, 4.1::real, 91, ARRAY['car','motorcycle']::text[], ARRAY['https://images.unsplash.com/photo-1545179605-1296651e9d0d?w=600']::text[]),
    ('Mall Parking La Florida', 'Plaza Vespucio Parking', -33.5170::float8, -70.5990::float8, 'La Florida', 'Av. Vicuña Mackenna 6100, La Florida', 'Estacionamiento del centro comercial más grande del sector. Conexión directa al Metro Bellavista de La Florida.', 1500, 40, 30, true, 4.2::real, 203, ARRAY['car','motorcycle']::text[], ARRAY[]::text[]),
    ('Parking Centro Puente Alto', 'Cordillera Parking', -33.6110::float8, -70.5760::float8, 'Puente Alto', 'Av. Concha y Toro 1500, Puente Alto', 'Estacionamiento económico en el centro de Puente Alto, cerca de la Plaza y servicios municipales.', 1000, 18, 6, false, 3.9::real, 55, ARRAY['car','motorcycle','bicycle','scooter']::text[], ARRAY[]::text[]),
    ('Estacionamiento Patronato', 'Barrio Patronato SpA', -33.4280::float8, -70.6420::float8, 'Recoleta', 'Loreto 200, Recoleta', 'En pleno barrio comercial Patronato. Ideal para compras de ropa y textiles. Espacio para motos.', 1300, 14, 9, false, 4.0::real, 78, ARRAY['car','motorcycle']::text[], ARRAY['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600']::text[]),
    ('Parking USACH', 'Estación Central Parking', -33.4520::float8, -70.6820::float8, 'Estación Central', 'Av. Libertador B. O''Higgins 3363, Estación Central', 'Frente a la Universidad de Santiago y la Estación Central de trenes. Muy conveniente para estudiantes.', 1400, 22, 15, true, 4.1::real, 112, ARRAY['car','bicycle','scooter']::text[], ARRAY[]::text[]),
    ('Plaza San Bernardo Parking', 'Maipo Parking Ltda.', -33.5930::float8, -70.6990::float8, 'San Bernardo', 'Eyzaguirre 500, San Bernardo', 'Estacionamiento familiar junto a la Plaza de San Bernardo. Tarifa por día disponible.', 900, 16, 4, false, 4.2::real, 47, ARRAY['car','motorcycle']::text[], ARRAY[]::text[]),
    ('Parking Grange', 'Peñalolén Oriente Parking', -33.4880::float8, -70.5500::float8, 'Peñalolén', 'Av. Tobalaba 8200, Peñalolén', 'Estacionamiento tranquilo en sector residencial, cercano al Parque Peñalolén y colegios del sector.', 1600, 10, 2, true, 4.5::real, 29, ARRAY['car','bicycle']::text[], ARRAY['https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=600']::text[])
) AS d(nombre, arrendador, lat, lng, comuna, direccion, descripcion,
       precio_hora, total_spots, occupied_spots, es_pmr, rating, reviews_count, veh, photos)
WHERE NOT EXISTS (
  SELECT 1 FROM public.estacionamientos e WHERE e.nombre = d.nombre AND e.comuna = d.comuna
);
