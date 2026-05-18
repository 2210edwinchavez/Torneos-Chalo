-- PARTE 2 (sin DROP) — Usar si es la primera vez y Supabase te advierte de "operaciones destructivas"

CREATE POLICY "tournament_tokens_select_anon"
  ON public.tournament_tokens FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "tournament_tokens_write_auth"
  ON public.tournament_tokens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "team_submissions_insert"
  ON public.team_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "team_submissions_select"
  ON public.team_submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "team_submissions_update"
  ON public.team_submissions FOR UPDATE
  TO authenticated
  USING (true);
