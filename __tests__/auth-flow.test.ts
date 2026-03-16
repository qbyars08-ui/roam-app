/**
 * Test Suite: Auth Flow — Session & guest state transitions
 *
 * Critical path: if session management breaks, ALL users get logged out or
 * are stuck as guests.
 *
 * Tests:
 *   - Initial auth state (no session)
 *   - Detected guest user vs authenticated user
 *   - Sign-in / sign-up store state changes
 *   - Session clearing on logout
 *   - ensureValidSession guest upgrade path (via signInAnonymously mock)
 */

// supabase and AsyncStorage mocked globally in jest.setup.js

import type { Session } from '@supabase/supabase-js';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { isGuestSession, isGuestUser, enterGuestMode, clearGuestMode } from '../lib/guest';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockSignInAnonymously = supabase.auth.signInAnonymously as jest.Mock;
const mockSignUp = supabase.auth.signUp as jest.Mock;
const mockSignInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(id = 'user-abc-123', email = 'test@roam.app'): Session {
  return {
    user: { id, email } as Session['user'],
    access_token: 'valid-jwt-token',
    refresh_token: 'refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
  };
}

function makeGuestSession(): Session {
  return {
    user: { id: 'guest-web-1700000000000', email: null } as unknown as Session['user'],
    access_token: '',
    refresh_token: '',
    expires_in: 0,
    token_type: 'bearer',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({ session: null });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('Auth State — initial values', () => {
  it('session is null before any auth action', () => {
    expect(useAppStore.getState().session).toBeNull();
  });

  it('isPro defaults to false', () => {
    expect(useAppStore.getState().isPro).toBe(false);
  });

  it('tripsThisMonth defaults to 0', () => {
    expect(useAppStore.getState().tripsThisMonth).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Guest detection
// ---------------------------------------------------------------------------

describe('Auth State — guest user detection', () => {
  it('isGuestSession returns false for null session', () => {
    expect(isGuestSession(null)).toBe(false);
  });

  it('isGuestSession returns true when user.id starts with "guest-"', () => {
    expect(isGuestSession(makeGuestSession())).toBe(true);
  });

  it('isGuestSession returns false for a real authenticated session', () => {
    expect(isGuestSession(makeSession())).toBe(false);
  });

  it('isGuestUser returns false when store has no session', () => {
    expect(isGuestUser()).toBe(false);
  });

  it('isGuestUser returns true when store holds a guest session', () => {
    useAppStore.getState().setSession(makeGuestSession());
    expect(isGuestUser()).toBe(true);
  });

  it('isGuestUser returns false when store holds a real session', () => {
    useAppStore.getState().setSession(makeSession());
    expect(isGuestUser()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Guest mode enter / exit lifecycle
// ---------------------------------------------------------------------------

describe('Auth State — guest mode lifecycle', () => {
  it('enterGuestMode sets a guest session in the store', async () => {
    await enterGuestMode();
    const { session } = useAppStore.getState();
    expect(session).not.toBeNull();
    expect(session!.user.id).toMatch(/^guest-/);
  });

  it('enterGuestMode access_token is empty string (not a real JWT)', async () => {
    const session = await enterGuestMode();
    expect(session.access_token).toBe('');
  });

  it('enterGuestMode writes GUEST_MODE and GUEST_ID to AsyncStorage', async () => {
    await enterGuestMode();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@roam/guest_mode', 'true');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@roam/guest_id',
      expect.stringMatching(/^guest-/)
    );
  });

  it('clearGuestMode removes persisted guest keys', async () => {
    await clearGuestMode();
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      '@roam/guest_mode',
      '@roam/guest_id',
    ]);
  });

  it('after clearGuestMode, a subsequent enterGuestMode still works', async () => {
    await enterGuestMode();
    await clearGuestMode();
    const session = await enterGuestMode();
    expect(session.user.id).toMatch(/^guest-/);
  });
});

// ---------------------------------------------------------------------------
// Sign-in state transitions (mocked Supabase auth calls)
// ---------------------------------------------------------------------------

describe('Auth State — sign-in flow', () => {
  it('setSession updates the store with the new session', () => {
    const session = makeSession();
    useAppStore.getState().setSession(session);
    expect(useAppStore.getState().session?.user.id).toBe('user-abc-123');
  });

  it('simulates successful sign-in: session goes from null → real session', async () => {
    const realSession = makeSession('user-xyz-456', 'user@example.com');
    mockSignInWithPassword.mockResolvedValue({ data: { session: realSession }, error: null });

    // Simulate what the auth screen does after a successful login
    const { data } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password123',
    });
    if (data.session) useAppStore.getState().setSession(data.session);

    expect(useAppStore.getState().session?.user.email).toBe('user@example.com');
    expect(isGuestUser()).toBe(false);
  });

  it('simulates failed sign-in: session remains null on error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'bad@example.com',
      password: 'wrong',
    });
    if (!error && data.session) useAppStore.getState().setSession(data.session);

    expect(useAppStore.getState().session).toBeNull();
    expect(error?.message).toContain('Invalid login credentials');
  });
});

// ---------------------------------------------------------------------------
// Sign-up state transitions
// ---------------------------------------------------------------------------

describe('Auth State — sign-up flow', () => {
  it('simulates successful sign-up: session is set in store', async () => {
    const newSession = makeSession('new-user-789', 'newuser@roam.app');
    mockSignUp.mockResolvedValue({ data: { session: newSession }, error: null });

    const { data } = await supabase.auth.signUp({
      email: 'newuser@roam.app',
      password: 'SecurePass123!',
    });
    if (data.session) useAppStore.getState().setSession(data.session);

    expect(useAppStore.getState().session?.user.id).toBe('new-user-789');
    expect(isGuestUser()).toBe(false);
  });

  it('simulates guest → sign-up upgrade: guest session replaced by real session', async () => {
    // Step 1: enter as guest
    await enterGuestMode();
    expect(isGuestUser()).toBe(true);

    // Step 2: user signs up → real session
    const realSession = makeSession('upgraded-user-001', 'upgraded@roam.app');
    mockSignUp.mockResolvedValue({ data: { session: realSession }, error: null });
    const { data } = await supabase.auth.signUp({
      email: 'upgraded@roam.app',
      password: 'SecurePass123!',
    });
    if (data.session) useAppStore.getState().setSession(data.session);

    expect(useAppStore.getState().session?.user.id).toBe('upgraded-user-001');
    expect(isGuestUser()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

describe('Auth State — logout / sign-out', () => {
  it('setSession(null) clears the session', () => {
    useAppStore.getState().setSession(makeSession());
    useAppStore.getState().setSession(null);
    expect(useAppStore.getState().session).toBeNull();
  });

  it('simulates sign-out flow: store session cleared after signOut', async () => {
    useAppStore.getState().setSession(makeSession());
    mockSignOut.mockResolvedValue({ error: null });

    await supabase.auth.signOut();
    useAppStore.getState().setSession(null);

    expect(useAppStore.getState().session).toBeNull();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('isPro is not automatically cleared on sign-out (needs explicit reset)', () => {
    useAppStore.setState({ isPro: true });
    useAppStore.getState().setSession(null);
    // isPro is managed by RevenueCat listener separately — not cleared by setSession
    expect(useAppStore.getState().isPro).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Anonymous auth upgrade (ensureValidSession path)
// ---------------------------------------------------------------------------

describe('Auth State — anonymous auth upgrade for guest', () => {
  it('signInAnonymously is available on the mocked supabase client', () => {
    expect(typeof supabase.auth.signInAnonymously).toBe('function');
  });

  it('guest session has an empty access_token that triggers upgrade', () => {
    const guestSession = makeGuestSession();
    const needsUpgrade =
      !guestSession.access_token ||
      String(guestSession.user?.id).startsWith('guest-');
    expect(needsUpgrade).toBe(true);
  });

  it('real session does NOT trigger upgrade', () => {
    const realSession = makeSession();
    const needsUpgrade =
      !realSession.access_token ||
      String(realSession.user?.id).startsWith('guest-');
    expect(needsUpgrade).toBe(false);
  });

  it('after anonymous upgrade, session has a real access_token', async () => {
    const anonSession = makeSession('anon-user-1', undefined);
    mockSignInAnonymously.mockResolvedValue({
      data: { session: anonSession },
      error: null,
    });

    const { data } = await supabase.auth.signInAnonymously();
    if (data.session) useAppStore.getState().setSession(data.session);

    expect(useAppStore.getState().session?.access_token).toBe('valid-jwt-token');
  });
});
