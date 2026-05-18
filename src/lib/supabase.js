import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const urlOk  = SUPABASE_URL && SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co');
const keyOk  = SUPABASE_ANON_KEY && (
  SUPABASE_ANON_KEY.startsWith('eyJ') ||          // formato JWT legacy
  SUPABASE_ANON_KEY.startsWith('sb_publishable_') // formato nuevo
);
const configured = urlOk && keyOk;

if (!urlOk)  console.error('❌ VITE_SUPABASE_URL inválida. Debe ser https://xxxx.supabase.co');
if (!keyOk)  console.error('❌ VITE_SUPABASE_ANON_KEY inválida. Ve a Supabase → Ajustes → Claves API → anon/publicable.');
if (configured) console.info('✅ Supabase configurado correctamente.');

export const supabaseConfigured = configured;

export const supabase = createClient(
  urlOk  ? SUPABASE_URL      : 'https://placeholder.supabase.co',
  keyOk  ? SUPABASE_ANON_KEY : 'placeholder-key'
);

const STATE_ID = 'main';

const SAVE_MAX_ATTEMPTS = 4;
const SAVE_BASE_DELAY_MS = 350;
const LOAD_MAX_ATTEMPTS = 3;
const LOAD_BASE_DELAY_MS = 300;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function loadStateFromDB() {
  if (!configured) return null;
  for (let attempt = 1; attempt <= LOAD_MAX_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', STATE_ID)
      .single();

    if (!error) return data?.data ?? null;
    console.error(`Error cargando desde Supabase (intento ${attempt}/${LOAD_MAX_ATTEMPTS}):`, error.message);
    if (attempt < LOAD_MAX_ATTEMPTS) await sleep(LOAD_BASE_DELAY_MS * attempt);
  }
  return null;
}

/**
 * Guarda el estado en la nube con reintentos (red inestable / rate limits).
 * @returns {{ ok: boolean, error?: string }}
 */
export async function saveStateToDB(state) {
  if (!configured) return { ok: false, error: 'Supabase no configurado' };

  let lastMessage = '';
  for (let attempt = 1; attempt <= SAVE_MAX_ATTEMPTS; attempt++) {
    const { error } = await supabase
      .from('app_state')
      .upsert({ id: STATE_ID, data: state, updated_at: new Date().toISOString() });

    if (!error) return { ok: true };
    lastMessage = error.message;
    console.error(`Error guardando en Supabase (intento ${attempt}/${SAVE_MAX_ATTEMPTS}):`, error.message);
    if (attempt < SAVE_MAX_ATTEMPTS) {
      await sleep(SAVE_BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }
  return { ok: false, error: lastMessage };
}

/** Lee el estado público sin autenticación (necesita política anon en Supabase) */
export async function loadStatePublic() {
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', STATE_ID)
    .single();
  if (error) return null;
  return data?.data ?? null;
}

/** Envía una solicitud de inscripción pública (sin auth, tabla player_submissions) */
export async function submitPlayerRegistration({ token, tournamentId, teamId, playerData }) {
  const { error } = await supabase
    .from('player_submissions')
    .insert({
      token,
      tournament_id: tournamentId,
      team_id: teamId,
      player_data: playerData,
      status: 'pending',
    });
  return { error: error?.message || null };
}

/** Carga las solicitudes pendientes para un token de equipo (solo admin) */
export async function loadPendingSubmissions(token) {
  const { data, error } = await supabase
    .from('player_submissions')
    .select('*')
    .eq('token', token)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

/** Cambia el estado de una solicitud de jugador (approved / rejected) */
export async function updateSubmissionStatus(id, status) {
  const { error } = await supabase
    .from('player_submissions')
    .update({ status })
    .eq('id', id);
  return { error: error?.message || null };
}

/* ── Tabla liviana de tokens de torneo (para evitar leer el JSON gigante) ── */

/** Guarda o actualiza la info pública del torneo en una tabla ligera */
export async function saveTournamentToken({ token, tournamentId, name, sport, type, playerLimit }) {
  const { error } = await supabase
    .from('tournament_tokens')
    .upsert({ token, tournament_id: tournamentId, name, sport, type, player_limit: playerLimit || 30, active: true });
  return { error: error?.message || null };
}

/** Lee la info de un torneo por token (sin imágenes, solo texto) */
export async function loadTournamentByToken(token) {
  const { data, error } = await supabase
    .from('tournament_tokens')
    .select('*')
    .eq('token', token)
    .eq('active', true)
    .single();
  if (error || !data) return null;
  return {
    id: data.tournament_id,
    name: data.name,
    sport: data.sport,
    type: data.type,
    playerLimit: data.player_limit || 30,
    shield: null,
  };
}

/** Desactiva un token de torneo */
export async function deactivateTournamentToken(token) {
  await supabase.from('tournament_tokens').update({ active: false }).eq('token', token);
}

/* ── Inscripción de equipos completos ── */

/** Envía solicitud de inscripción de equipo completo */
export async function submitTeamRegistration({ token, tournamentId, teamData }) {
  const { error } = await supabase
    .from('team_submissions')
    .insert({
      token,
      tournament_id: tournamentId,
      team_data: teamData,
      status: 'pending',
    });
  return { error: error?.message || null };
}

/** Carga solicitudes de equipo (por torneo; el token puede cambiar si se regenera el enlace) */
export async function loadTeamSubmissions(token, tournamentId) {
  let query = supabase
    .from('team_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (tournamentId) {
    query = query.eq('tournament_id', tournamentId);
  } else if (token) {
    query = query.eq('token', token);
  } else {
    return { data: [], error: 'Falta identificador del torneo' };
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error cargando solicitudes de equipo:', error.message);
    return { data: [], error: error.message };
  }
  return { data: data || [], error: null };
}

/** Cambia el estado de una solicitud de equipo */
export async function updateTeamSubmissionStatus(id, status) {
  const { error } = await supabase
    .from('team_submissions')
    .update({ status })
    .eq('id', id);
  return { error: error?.message || null };
}
