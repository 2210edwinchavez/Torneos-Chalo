-- ============================================================
-- TORNEOS JC SPORT - Script de configuración de base de datos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Tabla profiles (perfiles de usuario) ──────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role      text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Solo el propio usuario puede actualizar su perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ── 2. Trigger para crear perfil automáticamente al registrarse ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Tabla app_state (estado global de la aplicación) ────────
CREATE TABLE IF NOT EXISTS public.app_state (
  id         text PRIMARY KEY DEFAULT 'main',
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer el estado
CREATE POLICY "app_state_select"
  ON public.app_state FOR SELECT
  TO authenticated
  USING (true);

-- Cualquier usuario autenticado puede insertar/actualizar
CREATE POLICY "app_state_insert"
  ON public.app_state FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "app_state_update"
  ON public.app_state FOR UPDATE
  TO authenticated
  USING (true);

-- ── 4. Insertar fila inicial en app_state ────────────────────
INSERT INTO public.app_state (id, data, updated_at)
VALUES (
  'main',
  '{"globalPlayers": [], "tournaments": [], "activeTournamentId": null}'::jsonb,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ── 5. Promover primer usuario a admin (opcional) ────────────
-- Descomenta y reemplaza el email para hacer admin a tu usuario:
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'tu@email.com');

-- ============================================================
-- ✅ Script completado. La base de datos está lista.
-- ============================================================
