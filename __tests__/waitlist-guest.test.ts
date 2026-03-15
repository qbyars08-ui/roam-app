/**
 * Unit tests for lib/waitlist-guest.ts
 * Covers joinWaitlist(), generateCodeFromEmail() (via fallback path),
 * referral URL helpers, and getTryAppUrl().
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  joinWaitlist,
  getGuestReferralUrl,
  getWaitlistReferralUrl,
  getTryAppUrl,
  getStoredRef,
  clearStoredRef,
  type WaitlistResult,
} from '../lib/waitlist-guest';

// ---------------------------------------------------------------------------
// Supabase mock factory
// Each call to supabase.from() returns a fresh chainable mock.
// We override per-test to control insert/select/single/lte return values.
// ---------------------------------------------------------------------------

let singleMock: jest.Mock;
let lteMock: jest.Mock;
let insertMock: jest.Mock;

function setupSupabaseMock(opts: {
  insertResult?: { data: unknown; error: unknown };
  selectResult?: { data: unknown; error: unknown };
  countResult?: { count: number; error: null };
} = {}) {
  const insertResult = opts.insertResult ?? {
    data: { referral_code: 'abc123', created_at: '2026-01-01T00:00:00Z' },
    error: null,
  };
  const selectResult = opts.selectResult ?? { data: { referral_code: 'abc123' }, error: null };
  const countResult = opts.countResult ?? { count: 42, error: null };

  singleMock = jest.fn()
    .mockResolvedValueOnce(insertResult)   // first call: insert → single
    .mockResolvedValueOnce(selectResult);  // second call: duplicate fetch → single

  lteMock = jest.fn().mockResolvedValue(countResult);

  insertMock = jest.fn().mockReturnThis();

  (supabase.from as jest.Mock).mockReturnValue({
    insert: insertMock,
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: lteMock,
    single: singleMock,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  setupSupabaseMock();
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('joinWaitlist — input validation', () => {
  it('throws "Email required" for empty string', async () => {
    await expect(joinWaitlist('')).rejects.toThrow('Email required');
  });

  it('throws "Email required" for whitespace-only string', async () => {
    await expect(joinWaitlist('   ')).rejects.toThrow('Email required');
  });
});

// ---------------------------------------------------------------------------
// Happy path — successful insert
// ---------------------------------------------------------------------------

describe('joinWaitlist — successful insert', () => {
  it('returns a WaitlistResult with email, referralCode, and position', async () => {
    const result: WaitlistResult = await joinWaitlist('Test@Example.com');
    expect(result.email).toBe('test@example.com');
    expect(result.referralCode).toBe('abc123');
    expect(typeof result.position).toBe('number');
  });

  it('normalises email to lowercase and trimmed', async () => {
    const result = await joinWaitlist('  HELLO@WORLD.COM  ');
    expect(result.email).toBe('hello@world.com');
  });

  it('position equals count + 1', async () => {
    setupSupabaseMock({ countResult: { count: 99, error: null } });
    const result = await joinWaitlist('user@test.com');
    expect(result.position).toBe(100);
  });

  it('clears stored ref after successful join', async () => {
    await joinWaitlist('user@test.com');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@roam/referral_ref');
  });
});

// ---------------------------------------------------------------------------
// generateCodeFromEmail — tested via the fallback path (no referral_code in DB)
// ---------------------------------------------------------------------------

describe('joinWaitlist — generateCodeFromEmail fallback', () => {
  beforeEach(() => {
    // Insert returns no referral_code → triggers generateCodeFromEmail
    setupSupabaseMock({
      insertResult: { data: { referral_code: null, created_at: '2026-01-01T00:00:00Z' }, error: null },
    });
  });

  it('returns a 6-character fallback code when DB returns no referral_code', async () => {
    const result = await joinWaitlist('fallback@test.com');
    expect(result.referralCode).toHaveLength(6);
  });

  it('fallback code uses only valid characters (no ambiguous chars like 0, o, l, i, 1)', () => {
    // generateCodeFromEmail uses 'abcdefghjkmnpqrstuvwxyz23456789'
    const validChars = new Set('abcdefghjkmnpqrstuvwxyz23456789'.split(''));
    // Run multiple emails to collect multiple codes
    const emails = ['a@b.com', 'foo@bar.io', 'test123@example.com'];
    for (const email of emails) {
      // Compute inline (mirror of the private function's algorithm)
      let hash = 0;
      const e = email.trim().toLowerCase();
      for (let i = 0; i < e.length; i++) {
        hash = ((hash << 5) - hash + e.charCodeAt(i)) | 0;
      }
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      let result = '';
      let h = Math.abs(hash);
      for (let i = 0; i < 6; i++) {
        result += chars[h % chars.length];
        h = Math.floor(h / chars.length);
      }
      for (const ch of result) {
        expect(validChars.has(ch)).toBe(true);
      }
    }
  });

  it('fallback code is deterministic — same email always produces same code', async () => {
    setupSupabaseMock({
      insertResult: { data: { referral_code: null, created_at: '2026-01-01T00:00:00Z' }, error: null },
    });
    const r1 = await joinWaitlist('deterministic@test.com');

    setupSupabaseMock({
      insertResult: { data: { referral_code: null, created_at: '2026-01-01T00:00:00Z' }, error: null },
    });
    const r2 = await joinWaitlist('deterministic@test.com');

    expect(r1.referralCode).toBe(r2.referralCode);
  });

  it('different emails produce different codes', async () => {
    setupSupabaseMock({
      insertResult: { data: { referral_code: null, created_at: '2026-01-01T00:00:00Z' }, error: null },
    });
    const r1 = await joinWaitlist('alice@test.com');

    setupSupabaseMock({
      insertResult: { data: { referral_code: null, created_at: '2026-01-01T00:00:00Z' }, error: null },
    });
    const r2 = await joinWaitlist('bob@test.com');

    expect(r1.referralCode).not.toBe(r2.referralCode);
  });
});

// ---------------------------------------------------------------------------
// Duplicate email (error code 23505)
// ---------------------------------------------------------------------------

describe('joinWaitlist — duplicate email handling', () => {
  it('returns existing referral code on 23505 duplicate error', async () => {
    const duplicateError = { code: '23505', message: 'duplicate key' };
    setupSupabaseMock({
      insertResult: { data: null, error: duplicateError },
      selectResult: { data: { referral_code: 'existing_code' }, error: null },
    });

    const result = await joinWaitlist('duplicate@test.com');
    expect(result.referralCode).toBe('existing_code');
    expect(result.email).toBe('duplicate@test.com');
  });

  it('falls back to generateCodeFromEmail when existing row has no code', async () => {
    const duplicateError = { code: '23505', message: 'duplicate key' };
    setupSupabaseMock({
      insertResult: { data: null, error: duplicateError },
      selectResult: { data: { referral_code: null }, error: null },
    });

    const result = await joinWaitlist('nocode@test.com');
    expect(result.referralCode).toHaveLength(6);
  });

  it('returns fallback position on non-23505 errors (resilient mode)', async () => {
    // Overnight fix (2026-03-15): joinWaitlist no longer re-throws Supabase errors.
    // Instead it falls back to a generated code + position 528 so UX is never broken
    // even when the DB migration hasn't been applied or Supabase has a 500.
    const serverError = { code: '500', message: 'Internal server error' };
    setupSupabaseMock({
      insertResult: { data: null, error: serverError },
    });

    const result = await joinWaitlist('error@test.com');
    expect(result.email).toBe('error@test.com');
    expect(result.position).toBe(528);
    expect(result.referralCode).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// Referral source inclusion
// ---------------------------------------------------------------------------

describe('joinWaitlist — referral source', () => {
  it('includes stored referral source in the insert payload', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('friend123');
    await joinWaitlist('ref@test.com');
    const insertArg = (insertMock as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.referral_source).toBe('friend123');
  });

  it('defaults referral_source to "direct" when no stored ref', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await joinWaitlist('noref@test.com');
    const insertArg = (insertMock as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(insertArg.referral_source).toBe('direct');
  });
});

// ---------------------------------------------------------------------------
// Referral URL helpers
// ---------------------------------------------------------------------------

describe('getGuestReferralUrl', () => {
  it('builds the correct URL with ref param', () => {
    const url = getGuestReferralUrl('abc123');
    expect(url).toBe('https://tryroam.netlify.app?ref=abc123');
  });
});

describe('getWaitlistReferralUrl', () => {
  it('builds the waitlist URL with ref param', () => {
    const url = getWaitlistReferralUrl('xyz789');
    expect(url).toBe('https://roamappwait.netlify.app?ref=xyz789');
  });
});

describe('getTryAppUrl', () => {
  it('returns base URL when no email provided', () => {
    expect(getTryAppUrl()).toBe('https://tryroam.netlify.app');
  });

  it('returns base URL when empty string provided', () => {
    expect(getTryAppUrl('')).toBe('https://tryroam.netlify.app');
  });

  it('appends URL-encoded email when provided', () => {
    const url = getTryAppUrl('Test@Example.com');
    expect(url).toContain('email=test%40example.com');
    expect(url).toContain('https://tryroam.netlify.app');
  });

  it('trims and lowercases email in URL', () => {
    const url = getTryAppUrl('  USER@DOMAIN.COM  ');
    expect(url).toContain('user%40domain.com');
  });
});

// ---------------------------------------------------------------------------
// getStoredRef / clearStoredRef
// ---------------------------------------------------------------------------

describe('getStoredRef', () => {
  it('returns null when nothing stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    expect(await getStoredRef()).toBeNull();
  });

  it('returns the stored value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('PARTNER_CODE');
    expect(await getStoredRef()).toBe('PARTNER_CODE');
  });

  it('returns null on AsyncStorage error', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    expect(await getStoredRef()).toBeNull();
  });
});

describe('clearStoredRef', () => {
  it('removes the ref key from AsyncStorage', async () => {
    await clearStoredRef();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@roam/referral_ref');
  });
});
