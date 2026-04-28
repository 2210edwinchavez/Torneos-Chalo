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

export async function loadStateFromDB() {
  const { data, error } = await supabase
    .from('app_state')
    .select('data')
    .eq('id', STATE_ID)
    .single();

  if (error) {
    console.error('Error cargando desde Supabase:', error.message);
    return null;
  }
  return data?.data ?? null;
}

export async function saveStateToDB(state) {
  const { error } = await supabase
    .from('app_state')
    .upsert({ id: STATE_ID, data: state, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Error guardando en Supabase:', error.message);
  }
}
