/**
 * Test Suite: Waitlist — Email capture & referral flow
 * If this breaks, the growth funnel dies.
 *
 * Covers:
 *   - getRefFromUrl() (non-web platform returns null)
 *   - getStoredRef() read/write via AsyncStorage
 *   - joinWaitlist() email validation
 *   - joinWaitlist() Supabase success path
 *   - joinWaitlist() duplicate email (23505) graceful handling
 *   - joinWaitlist() Supabase failure fallback
 *   - Referral URL generation helpers
 *   - clearStoredRef() cleanup
 */

// supabase is mocked globally in jest.setup.js

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getRefFromUrl,
  getStoredRef,
  clearStoredRef,
  joinWaitlist,
  getGuestReferralUrl,
  getWaitlistReferralUrl,
  getTryAppUrl,
} from '../lib/waitlist-guest';

const mockFrom = supabase.from as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  // Default successful insert mock (chainable)
  const chainDefault = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { referral_code: 'abc123', created_at: '2026-03-16T10:00:00Z' },
      error: null,
    }),
    count: 42,
  };
  mockFrom.mockReturnValue(chainDefault);
});

// ---------------------------------------------------------------------------
// getRefFromUrl — non-web always returns null
// ---------------------------------------------------------------------------

describe('Waitlist — getRefFromUrl', () => {
  it('returns null on non-web platform (jest runs as iOS)', () => {
    expect(getRefFromUrl()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getStoredRef — AsyncStorage read
// ---------------------------------------------------------------------------

describe('Waitlist — getStoredRef', () => {
  it('returns null when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    expect(await getStoredRef()).toBeNull();
  });

  it('returns the stored referral code', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('INVITE42');
    expect(await getStoredRef()).toBe('INVITE42');
  });

  it('returns null when AsyncStorage.getItem throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('storage error'));
    expect(await getStoredRef()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearStoredRef — AsyncStorage remove
// ---------------------------------------------------------------------------

describe('Waitlist — clearStoredRef', () => {
  it('calls AsyncStorage.removeItem with the correct key', async () => {
    await clearStoredRef();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@roam/referral_ref');
  });
});

// ---------------------------------------------------------------------------
// joinWaitlist — email validation (no Supabase call needed)
// ---------------------------------------------------------------------------

describe('Waitlist — joinWaitlist email validation', () => {
  it('throws when email is empty string', async () => {
    await expect(joinWaitlist('')).rejects.toThrow('Email required');
  });

  it('throws when email is whitespace only', async () => {
    await expect(joinWaitlist('   ')).rejects.toThrow('Email required');
  });

  it('throws when email exceeds 254 characters', async () => {
    const longEmail = 'a'.repeat(250) + '@b.co';
    await expect(joinWaitlist(longEmail)).rejects.toThrow('Email too long');
  });

  it('throws when email has no @ symbol', async () => {
    await expect(joinWaitlist('notanemail')).rejects.toThrow('Invalid email format');
  });

  it('throws when email has no domain', async () => {
    await expect(joinWaitlist('user@')).rejects.toThrow('Invalid email format');
  });

  it('throws when email has no characters in domain (@ at end)', async () => {
    await expect(joinWaitlist('user@.com')).rejects.toThrow('Invalid email format');
  });
});

// ---------------------------------------------------------------------------
// joinWaitlist — Supabase success path
// ---------------------------------------------------------------------------

describe('Waitlist — joinWaitlist Supabase success', () => {
  beforeEach(() => {
    // Full chain for the success path:
    // .from('waitlist_emails').insert(...).select(...).single() → data
    // .from('waitlist_emails').select('*', { count: 'exact', head: true }).lte(...) → count
    let callCount = 0;
    mockFrom.mockImplementation(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: { referral_code: 'xyzabc', created_at: '2026-03-16T12:00:00Z' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null, count: 55 });
      }),
      count: 55,
    }));
  });

  it('returns a WaitlistResult object', async () => {
    const result = await joinWaitlist('hello@roam.app');
    expect(result).toHaveProperty('referralCode');
    expect(result).toHaveProperty('position');
    expect(result).toHaveProperty('email');
  });

  it('normalizes email to lowercase', async () => {
    const result = await joinWaitlist('HELLO@ROAM.APP');
    expect(result.email).toBe('hello@roam.app');
  });

  it('trims whitespace from email', async () => {
    const result = await joinWaitlist('  hello@roam.app  ');
    expect(result.email).toBe('hello@roam.app');
  });
});

// ---------------------------------------------------------------------------
// joinWaitlist — duplicate email (23505) graceful handling
// ---------------------------------------------------------------------------

describe('Waitlist — joinWaitlist duplicate email fallback', () => {
  beforeEach(() => {
    let callCount = 0;
    mockFrom.mockImplementation(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: insert fails with duplicate
          return Promise.resolve({
            data: null,
            error: { code: '23505', message: 'duplicate key value' },
          });
        }
        if (callCount === 2) {
          // Second call: fetch existing row
          return Promise.resolve({
            data: { referral_code: 'existing99' },
            error: null,
          });
        }
        // Third call: count query
        return Promise.resolve({ data: null, error: null, count: 100 });
      }),
      count: 100,
    }));
  });

  it('returns a result even for duplicate email (does not throw)', async () => {
    const result = await joinWaitlist('duplicate@roam.app');
    expect(result).toBeDefined();
    expect(result.email).toBe('duplicate@roam.app');
  });

  it('uses the existing referral code for duplicate email', async () => {
    const result = await joinWaitlist('duplicate@roam.app');
    expect(result.referralCode).toBe('existing99');
  });
});

// ---------------------------------------------------------------------------
// joinWaitlist — Supabase complete failure fallback
// ---------------------------------------------------------------------------

describe('Waitlist — joinWaitlist Supabase failure fallback', () => {
  beforeEach(() => {
    // Suppress the expected console.error from the fallback path
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFrom.mockImplementation(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Network error')),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('falls back gracefully when Supabase is unreachable', async () => {
    const result = await joinWaitlist('fallback@roam.app');
    expect(result).toBeDefined();
    expect(result.email).toBe('fallback@roam.app');
  });

  it('fallback still returns a referral code', async () => {
    const result = await joinWaitlist('fallback@roam.app');
    expect(typeof result.referralCode).toBe('string');
    expect(result.referralCode.length).toBeGreaterThan(0);
  });

  it('fallback returns position 528 (hardcoded offline fallback)', async () => {
    const result = await joinWaitlist('fallback@roam.app');
    expect(result.position).toBe(528);
  });
});

// ---------------------------------------------------------------------------
// Referral URL helpers
// ---------------------------------------------------------------------------

describe('Waitlist — referral URL helpers', () => {
  it('getGuestReferralUrl returns a URL with the ref code', () => {
    const url = getGuestReferralUrl('abc123');
    expect(url).toContain('ref=abc123');
    expect(url).toContain('roamapp.app');
  });

  it('getWaitlistReferralUrl returns a URL with the ref code', () => {
    const url = getWaitlistReferralUrl('xyz789');
    expect(url).toContain('ref=xyz789');
  });

  it('getTryAppUrl returns base URL when no email given', () => {
    const url = getTryAppUrl();
    expect(url).toContain('roamapp.app');
    expect(url).not.toContain('email=');
  });

  it('getTryAppUrl includes encoded email when provided', () => {
    const url = getTryAppUrl('user@roam.app');
    expect(url).toContain('email=');
    expect(url).toContain('user%40roam.app');
  });

  it('getTryAppUrl ignores whitespace-only email', () => {
    const url = getTryAppUrl('   ');
    expect(url).not.toContain('email=');
  });
});
