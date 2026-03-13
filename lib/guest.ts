// =============================================================================
// ROAM — Guest mode helpers
// Skip login, browse limited content, capture email at paywall
// =============================================================================

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

/** Create a guest session object for fake auth */
export function createGuestSession(): Session {
  const guestId = `guest-web-${Date.now()}`;
  return {
    user: { id: guestId, email: null },
    access_token: '',
    refresh_token: '',
  } as Session;
}
