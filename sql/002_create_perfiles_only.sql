-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PARKINGS TOGETHER — Migración MÍNIMA                       ║
-- ║  SOLO crea la tabla perfiles (NO toca tablas existentes)     ║
-- ║  Ejecutar en: Supabase Dashboard > SQL Editor                ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. CREAR TABLA PERFILES
CREATE TABLE public.perfiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre text NOT NULL DEFAULT '',
  telefono text,
  avatar_url text,
  requiere_pmr boolean DEFAULT false,
  rol text NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'anfitrion')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.perfiles IS 'Perfil de usuario 1:1 con auth.users';

-- 2. ACTIVAR RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS
CREATE POLICY "perfiles_select_own" ON public.perfiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "perfiles_insert_own" ON public.perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles_update_own" ON public.perfiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "perfiles_delete_own" ON public.perfiles
  FOR DELETE USING (auth.uid() = id);

-- 4. TRIGGER updated_at AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_perfiles_updated
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
