-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PARKINGS TOGETHER — Script de Producción                   ║
-- ║  Ejecutar COMPLETO en: Supabase Dashboard > SQL Editor      ║
-- ║  Proyecto: obthriistwvcutjfrksh                             ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════
-- 1. TABLA PERFILES
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  telefono text,
  avatar_url text,
  requiere_pmr boolean DEFAULT false,
  rol text NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'anfitrion')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentario descriptivo
COMMENT ON TABLE public.perfiles IS 'Perfil público de cada usuario de Parkings Together. Relación 1:1 con auth.users.';

-- ═══════════════════════════════════════
-- 2. ROW LEVEL SECURITY — PERFILES
-- ═══════════════════════════════════════

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Lectura: usuarios autenticados pueden ver su propio perfil
CREATE POLICY "perfiles_select_own"
  ON public.perfiles
  FOR SELECT
  USING (auth.uid() = id);

-- Inserción: usuarios autenticados pueden crear su propio perfil
CREATE POLICY "perfiles_insert_own"
  ON public.perfiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Actualización: usuarios autenticados pueden modificar su propio perfil
CREATE POLICY "perfiles_update_own"
  ON public.perfiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Eliminación: usuarios autenticados pueden eliminar su propio perfil
CREATE POLICY "perfiles_delete_own"
  ON public.perfiles
  FOR DELETE
  USING (auth.uid() = id);

-- ═══════════════════════════════════════
-- 3. TRIGGER PARA updated_at AUTOMÁTICO
-- ═══════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_perfiles_updated
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════
-- 4. STORAGE BUCKET — AVATARS
-- ═══════════════════════════════════════

-- Crear bucket público para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5MB máximo
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════
-- 5. POLÍTICAS DE STORAGE — AVATARS
-- ═══════════════════════════════════════

-- Lectura pública (cualquiera puede ver avatares)
CREATE POLICY "avatars_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Upload: solo usuarios autenticados, en su propia carpeta (userId/*)
CREATE POLICY "avatars_auth_upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update/Reemplazo: solo el propietario del archivo
CREATE POLICY "avatars_auth_update"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Eliminación: solo el propietario del archivo
CREATE POLICY "avatars_auth_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════
-- 6. TABLAS COMPLEMENTARIAS (si no existen)
-- ═══════════════════════════════════════

-- Vehículos
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  placa text NOT NULL,
  modelo text NOT NULL,
  color text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehiculos_select_own" ON public.vehiculos
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vehiculos_insert_own" ON public.vehiculos
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vehiculos_update_own" ON public.vehiculos
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vehiculos_delete_own" ON public.vehiculos
  FOR DELETE USING (auth.uid() = user_id);

-- Estacionamientos
CREATE TABLE IF NOT EXISTS public.estacionamientos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  arrendador text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  total_spots integer NOT NULL,
  occupied_spots integer DEFAULT 0,
  es_pmr boolean DEFAULT false,
  precio_hora numeric,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.estacionamientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estacionamientos_select_all" ON public.estacionamientos
  FOR SELECT USING (true);
CREATE POLICY "estacionamientos_insert_anfitrion" ON public.estacionamientos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'anfitrion')
    AND auth.uid() = user_id
  );
CREATE POLICY "estacionamientos_update_own" ON public.estacionamientos
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "estacionamientos_delete_own" ON public.estacionamientos
  FOR DELETE USING (auth.uid() = user_id);

-- Reservas
CREATE TABLE IF NOT EXISTS public.reservas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  estacionamiento_id uuid REFERENCES public.estacionamientos(id) ON DELETE CASCADE NOT NULL,
  conductor_id uuid REFERENCES auth.users(id) NOT NULL,
  estado text NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'completada', 'cancelada')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservas_select_conductor" ON public.reservas
  FOR SELECT USING (auth.uid() = conductor_id);
CREATE POLICY "reservas_insert_conductor" ON public.reservas
  FOR INSERT WITH CHECK (auth.uid() = conductor_id);
CREATE POLICY "reservas_select_anfitrion" ON public.reservas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.estacionamientos
      WHERE id = public.reservas.estacionamiento_id
      AND user_id = auth.uid()
    )
  );
