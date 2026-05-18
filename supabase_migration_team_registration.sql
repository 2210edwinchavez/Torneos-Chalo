-- Ejecutar en Supabase → SQL Editor (solo si ya tienes la BD creada)
-- Corrige: POST team_submissions 404 y enlaces /unirse/:token

CREATE TABLE IF NOT EXISTS public.tournament_tokens (
  token          text PRIMARY KEY,
  tournament_id  text NOT NULL,
  name           text NOT NULL DEFAULT '',
  sport          text NOT NULL DEFAULT '',
  type           text NOT NULL DEFAULT '',
  player_limit   int  NOT NULL DEFAULT 30,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tournament_tokens_select_anon" ON public.tournament_tokens;
CREATE POLICY "tournament_tokens_select_anon"
  ON public.tournament_tokens FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "tournament_tokens_write_auth" ON public.tournament_tokens;
CREATE POLICY "tournament_tokens_write_auth"
  ON public.tournament_tokens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.team_submissions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token          text NOT NULL,
  tournament_id  text NOT NULL,
  team_data      jsonb NOT NULL DEFAULT '{}'::jsonb,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_submissions_insert" ON public.team_submissions;
CREATE POLICY "team_submissions_insert"
  ON public.team_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "team_submissions_select" ON public.team_submissions;
CREATE POLICY "team_submissions_select"
  ON public.team_submissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "team_submissions_update" ON public.team_submissions;
CREATE POLICY "team_submissions_update"
  ON public.team_submissions FOR UPDATE
  TO authenticated
  USING (true);
