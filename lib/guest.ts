// =============================================================================
// ROAM — Guest mode helpers
// Skip login, browse limited content, capture email at paywall
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { useAppStore } from './store';
import { GUEST_MODE, GUEST_ID, ONBOARDING_COMPLETE } from './storage-keys';

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
  await AsyncStorage.setItem(GUEST_MODE, 'true');
  await AsyncStorage.setItem(GUEST_ID, guestId);
  await AsyncStorage.setItem(ONBOARDING_COMPLETE, 'true');
  useAppStore.getState().setSession(session);
  return session;
}

/** Clear guest mode when user signs in for real */
export async function clearGuestMode(): Promise<void> {
  await AsyncStorage.multiRemove([GUEST_MODE, GUEST_ID]);
}

/** Restore guest session after page refresh (call when no real session) */
export async function tryRestoreGuestSession(): Promise<Session | null> {
  const [mode, id] = await Promise.all([
    AsyncStorage.getItem(GUEST_MODE),
    AsyncStorage.getItem(GUEST_ID),
  ]);
  if (mode !== 'true' || !id?.startsWith('guest-')) return null;
  const session: Session = {
    user: { id, email: null } as unknown as Session['user'],
    access_token: '',
    refresh_token: '',
    expires_in: 0,
    token_type: 'bearer',
  };
  useAppStore.getState().setSession(session);
  return session;
}
