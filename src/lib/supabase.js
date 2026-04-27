import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const configured = SUPABASE_URL && !SUPABASE_URL.includes('TU_URL') && SUPABASE_ANON_KEY;

if (!configured) {
  console.warn('⚠️ Supabase no configurado. Edita el archivo .env con tu URL y anon key.');
}

export const supabase = createClient(
  configured ? SUPABASE_URL     : 'https://placeholder.supabase.co',
  configured ? SUPABASE_ANON_KEY : 'placeholder-key'
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
