-- supabase_schema.sql
-- Ejecutar en el Editor SQL de Supabase

-- 1. Tabla Perfiles
CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid references auth.users on delete cascade not null primary key,
  nombre text not null,
  telefono text,
  avatar_url text,
  requiere_pmr boolean default false,
  rol text not null default 'cliente' check (rol in ('cliente', 'anfitrion')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security para Perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Políticas para Perfiles
CREATE POLICY "Usuarios pueden ver su propio perfil." ON public.perfiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil." ON public.perfiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil." ON public.perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tabla Vehículos
CREATE TABLE IF NOT EXISTS public.vehiculos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  placa text not null,
  modelo text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security para Vehículos
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

-- Políticas para Vehículos
CREATE POLICY "Usuarios pueden ver sus propios vehículos." ON public.vehiculos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios vehículos." ON public.vehiculos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios vehículos." ON public.vehiculos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios vehículos." ON public.vehiculos
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Tabla Estacionamientos
CREATE TABLE IF NOT EXISTS public.estacionamientos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  nombre text not null,
  arrendador text not null,
  lat numeric not null,
  lng numeric not null,
  total_spots integer not null,
  occupied_spots integer default 0,
  es_pmr boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security para Estacionamientos
ALTER TABLE public.estacionamientos ENABLE ROW LEVEL SECURITY;

-- Políticas para Estacionamientos
CREATE POLICY "Cualquiera puede ver los estacionamientos." ON public.estacionamientos
  FOR SELECT USING (true);

CREATE POLICY "Solo anfitriones pueden crear estacionamientos." ON public.estacionamientos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'anfitrion')
    AND auth.uid() = user_id
  );

CREATE POLICY "Anfitriones pueden actualizar sus estacionamientos." ON public.estacionamientos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anfitriones pueden eliminar sus estacionamientos." ON public.estacionamientos
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Tabla Reservas
CREATE TABLE IF NOT EXISTS public.reservas (
  id uuid default gen_random_uuid() primary key,
  estacionamiento_id uuid references public.estacionamientos(id) on delete cascade not null,
  conductor_id uuid references auth.users not null,
  estado text not null default 'activa' check (estado in ('activa', 'completada', 'cancelada')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security para Reservas
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- Políticas para Reservas
CREATE POLICY "Conductores pueden ver sus propias reservas." ON public.reservas
  FOR SELECT USING (auth.uid() = conductor_id);

CREATE POLICY "Conductores pueden crear sus propias reservas." ON public.reservas
  FOR INSERT WITH CHECK (auth.uid() = conductor_id);

CREATE POLICY "Anfitriones pueden ver reservas de sus estacionamientos." ON public.reservas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.estacionamientos 
      WHERE id = public.reservas.estacionamiento_id 
      AND user_id = auth.uid()
    )
  );
