-- PARTE 1 de 2 — Solo tablas (ejecutar primero)
CREATE TABLE IF NOT EXISTS public.tournament_tokens (
  token text PRIMARY KEY,
  tournament_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  sport text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  player_limit int NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  tournament_id text NOT NULL,
  team_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_submissions ENABLE ROW LEVEL SECURITY;
