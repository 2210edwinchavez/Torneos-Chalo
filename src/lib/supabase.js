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

/** Cambia el estado de una solicitud (approved / rejected) */
export async function updateSubmissionStatus(id, status) {
  const { error } = await supabase
    .from('player_submissions')
    .update({ status })
    .eq('id', id);
  return { error: error?.message || null };
}
