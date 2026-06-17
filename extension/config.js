/** @typedef {{ supabaseUrl: string, supabaseAnonKey: string }} ClnchConfig */

const STORAGE_KEYS = {
  supabaseUrl: 'clnch_supabase_url',
  supabaseAnonKey: 'clnch_supabase_anon_key',
  session: 'clnch_session',
};

/**
 * Default Supabase project credentials — overridden when the web app syncs auth.
 * Set these to your project values for standalone extension use, or log in via CLNCH web app.
 */
const DEFAULT_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};

/** @returns {Promise<ClnchConfig>} */
export async function getConfig() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.supabaseUrl,
    STORAGE_KEYS.supabaseAnonKey,
  ]);

  return {
    supabaseUrl: stored[STORAGE_KEYS.supabaseUrl] || DEFAULT_CONFIG.supabaseUrl,
    supabaseAnonKey: stored[STORAGE_KEYS.supabaseAnonKey] || DEFAULT_CONFIG.supabaseAnonKey,
  };
}

/** @returns {Promise<import('@supabase/supabase-js').Session | null>} */
export async function getStoredSession() {
  const { [STORAGE_KEYS.session]: session } = await chrome.storage.local.get(STORAGE_KEYS.session);
  return session ?? null;
}

/** @param {Record<string, unknown>} payload */
export async function storeAuthPayload(payload) {
  const updates = {};

  if (payload.supabaseUrl) updates[STORAGE_KEYS.supabaseUrl] = payload.supabaseUrl;
  if (payload.supabaseAnonKey) updates[STORAGE_KEYS.supabaseAnonKey] = payload.supabaseAnonKey;

  if (payload.access_token) {
    updates[STORAGE_KEYS.session] = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at,
    };
  }

  await chrome.storage.local.set(updates);
}

export async function clearAuth() {
  await chrome.storage.local.remove(STORAGE_KEYS.session);
}

export { STORAGE_KEYS };
