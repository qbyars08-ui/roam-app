/**
 * Test Suite 4: Guest Mode — Anonymous user flow
 * If this breaks, the "try before you sign up" funnel fails.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../lib/store';

// supabase is mocked globally in jest.setup.js

import {
  enterGuestMode,
  isGuestSession,
  isGuestUser,
  clearGuestMode,
  tryRestoreGuestSession,
} from '../lib/guest';

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({ session: null });
});

describe('Guest Mode', () => {
  // ── Guest session creation ──────────────────────────────────
  it('enterGuestMode creates a session with guest- prefix', async () => {
    const session = await enterGuestMode();
    expect(session).not.toBeNull();
    expect(session.user.id).toMatch(/^guest-/);
  });

  it('enterGuestMode persists to AsyncStorage', async () => {
    await enterGuestMode();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@roam/guest_mode',
      'true'
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@roam/guest_id',
      expect.stringMatching(/^guest-/)
    );
  });

  it('enterGuestMode sets session in store', async () => {
    await enterGuestMode();
    const session = useAppStore.getState().session;
    expect(session).not.toBeNull();
    expect(session!.user.id).toMatch(/^guest-/);
  });

  // ── Guest detection (isGuestSession takes a session) ────────
  it('isGuestSession detects guest sessions', () => {
    const guestSession = { user: { id: 'guest-123' } } as any;
    const realSession = { user: { id: 'abc-def-ghi' } } as any;
    expect(isGuestSession(guestSession)).toBe(true);
    expect(isGuestSession(realSession)).toBe(false);
    expect(isGuestSession(null)).toBe(false);
  });

  // ── isGuestUser reads from store ────────────────────────────
  it('isGuestUser returns false when no session', () => {
    expect(isGuestUser()).toBe(false);
  });

  it('isGuestUser returns true after enterGuestMode', async () => {
    await enterGuestMode();
    expect(isGuestUser()).toBe(true);
  });

  // ── Guest session restore ──────────────────────────────────
  it('tryRestoreGuestSession returns null when no guest stored', async () => {
    useAppStore.setState({ session: null });
    // Ensure getItem returns null (no stored guest)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const session = await tryRestoreGuestSession();
    expect(session).toBeNull();
  });

  it('tryRestoreGuestSession restores persisted guest', async () => {
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce('true') // @roam/guest_mode
      .mockResolvedValueOnce('guest-restored-123'); // @roam/guest_id
    const session = await tryRestoreGuestSession();
    expect(session).not.toBeNull();
    expect(session!.user.id).toBe('guest-restored-123');
  });

  // ── Guest cleanup ──────────────────────────────────────────
  it('clearGuestMode removes persisted data', async () => {
    await clearGuestMode();
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      '@roam/guest_mode',
      '@roam/guest_id',
    ]);
  });
});
