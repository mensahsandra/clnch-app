import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { getConfig, getStoredSession } from '../config.js';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

export async function getSupabaseClient() {
  const config = await getConfig();

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  const session = await getStoredSession();
  if (session?.access_token) {
    await client.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token || '',
    });
  }

  return client;
}

export function resetSupabaseClient() {
  client = null;
}
