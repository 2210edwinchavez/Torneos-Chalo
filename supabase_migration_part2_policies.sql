-- PARTE 2 de 2 — Políticas RLS (ejecutar después de la parte 1)

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
