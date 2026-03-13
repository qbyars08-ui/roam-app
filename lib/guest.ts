// =============================================================================
// ROAM — Guest mode helpers
// Skip login, browse limited content, capture email at paywall
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { useAppStore } from './store';

const GUEST_MODE_KEY = '@roam/guest_mode';
const GUEST_ID_KEY = '@roam/guest_id';

/** True when session is a fake guest (no real auth) */
export function isGuestSession(session: Session | null): boolean {
  if (!session?.user?.id) return false;
  return String(session.user.id).startsWith('guest-');
}

/** Current user is a guest (read from store) */
export function isGuestUser(): boolean {
  const session = useAppStore.getState().session;
  return isGuestSession(session);
}

/** Create a guest session and persist for refresh survival */
export async function enterGuestMode(): Promise<Session> {
  const guestId = `guest-web-${Date.now()}`;
  const session: Session = {
    user: { id: guestId, email: null } as unknown as Session['user'],
    access_token: '',
    refresh_token: '',
    expires_in: 0,
    token_type: 'bearer',
  };
  await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
  await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
  await AsyncStorage.setItem('@roam/onboarding_complete', 'true');
  useAppStore.getState().setSession(session);
  return session;
}

/** Clear guest mode when user signs in for real */
export async function clearGuestMode(): Promise<void> {
  await AsyncStorage.multiRemove([GUEST_MODE_KEY, GUEST_ID_KEY]);
}

/** Restore guest session after page refresh (call when no real session) */
export async function tryRestoreGuestSession(): Promise<Session | null> {
  const [mode, id] = await Promise.all([
    AsyncStorage.getItem(GUEST_MODE_KEY),
    AsyncStorage.getItem(GUEST_ID_KEY),
  ]);
  if (mode !== 'true' || !id?.startsWith('guest-')) return null;
  const session = {
    user: { id, email: null },
    access_token: '',
    refresh_token: '',
    expires_in: 0,
    token_type: 'bearer',
  } as unknown as Session;
  useAppStore.getState().setSession(session);
  return session;
}
