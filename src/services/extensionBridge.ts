import { supabase } from './supabase';

const AUTH_MESSAGE = 'CLNCH_AUTH_SYNC';

/**
 * Sync Supabase auth session to the Chrome extension via postMessage.
 * The extension content script picks this up and stores tokens in chrome.storage.local.
 */
export function initExtensionBridge() {
  const syncSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    if (!supabaseUrl || !supabaseAnonKey) return;

    window.postMessage(
      {
        type: AUTH_MESSAGE,
        payload: session
          ? {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
              supabaseUrl,
              supabaseAnonKey,
            }
          : { supabaseUrl, supabaseAnonKey, access_token: null },
      },
      window.location.origin
    );
  };

  supabase.auth.onAuthStateChange(() => {
    syncSession();
  });

  syncSession();
}
