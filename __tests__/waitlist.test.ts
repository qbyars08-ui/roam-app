/**
 * Test Suite 5: Waitlist — Email capture & referral flow
 * If this breaks, the growth funnel dies.
 */

// supabase is mocked globally in jest.setup.js

import { getRefFromUrl, getStoredRef } from '../lib/waitlist-guest';
import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Waitlist & Referrals', () => {
  // ── Referral URL parsing ────────────────────────────────────
  // getRefFromUrl() reads from window.location.search (web only)
  // In iOS test environment (Platform.OS = 'ios'), it returns null
  it('getRefFromUrl returns null on non-web platform', () => {
    expect(getRefFromUrl()).toBeNull();
  });

  // ── Stored referral ─────────────────────────────────────────
  it('getStoredRef returns null when nothing stored', async () => {
    const ref = await getStoredRef();
    expect(ref).toBeNull();
  });

  it('getStoredRef returns stored value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('STORED123');
    const ref = await getStoredRef();
    expect(ref).toBe('STORED123');
  });
});
