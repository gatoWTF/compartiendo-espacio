-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PARKINGS TOGETHER — Migración de Vehículos                 ║
-- ║  Ejecutar en: Supabase Dashboard > SQL Editor                ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. CREAR TABLA VEHICULOS
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patente text NOT NULL,
  marca text NOT NULL DEFAULT '',
  modelo text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.vehiculos IS 'Vehículos registrados por los usuarios para validar acceso a estacionamientos';

-- 2. ACTIVAR RLS
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS
-- Select: Solo puede ver sus propios vehículos
CREATE POLICY "vehiculos_select_own" ON public.vehiculos
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: Solo puede insertar vehículos asociados a su cuenta
CREATE POLICY "vehiculos_insert_own" ON public.vehiculos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: Solo puede actualizar sus propios vehículos
CREATE POLICY "vehiculos_update_own" ON public.vehiculos
  FOR UPDATE USING (auth.uid() = user_id);

-- Delete: Solo puede eliminar sus propios vehículos
CREATE POLICY "vehiculos_delete_own" ON public.vehiculos
  FOR DELETE USING (auth.uid() = user_id);
