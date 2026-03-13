// =============================================================================
// ROAM — Supabase Client (SDK 55 / AsyncStorage persistence)
// =============================================================================

import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * When env vars are missing we still create a client so the app can
 * render its UI (welcome / plan screens, design previews, etc.).
 * Auth calls will fail gracefully at runtime.
 */
const isMissingCredentials = !supabaseUrl || !supabaseAnonKey;

if (isMissingCredentials && __DEV__) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY not set. ' +
      'Auth & DB calls will not work. Add a .env file with your Supabase credentials.'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Web needs URL detection for OAuth redirects; native doesn't have a URL bar
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

export { isMissingCredentials };
