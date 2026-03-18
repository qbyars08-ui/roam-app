// =============================================================================
// ROAM — Shared Session Guard
// Ensures a valid Supabase session exists, upgrading guests to anonymous auth.
// All API modules should import this instead of rolling their own session check.
// =============================================================================

import { supabase } from './supabase';
import { useAppStore } from './store';

/**
 * Ensures a valid Supabase session exists. If the current user is a guest
 * (no session, no access_token, or guest-* ID), upgrades them to anonymous
 * auth via `signInAnonymously()`. Returns `true` when a valid session is
 * available, `false` on failure.
 */
export async function ensureValidSession(): Promise<boolean> {
  const session = useAppStore.getState().session;
  const needsUpgrade =
    !session ||
    !session.access_token ||
    String(session.user?.id).startsWith('guest-');

  if (!needsUpgrade) {
    const {
      data: { session: refreshed },
    } = await supabase.auth.getSession();
    if (refreshed && refreshed.access_token !== session?.access_token) {
      useAppStore.getState().setSession(refreshed);
    }
    return true;
  }

  try {
    const {
      data: { session: anonSession },
      error,
    } = await supabase.auth.signInAnonymously();
    if (error || !anonSession) return false;
    useAppStore.getState().setSession(anonSession);
    return true;
  } catch {
    return false;
  }
}
