/**
 * Unit tests for lib/referral.ts
 * Covers: getReferralCode, getReferralUrl, generateReferralCode,
 * proMonthsFromCount / nextMilestoneMessage (via stats),
 * getReferralStats, recordReferral, trackReferral,
 * getWaitlistReferralStats, getWaitlistPosition.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  getReferralCode,
  getReferralUrl,
  generateReferralCode,
  ensureReferralCode,
  getReferralStats,
  recordReferral,
  shareReferralLink,
  trackReferral,
  getWaitlistReferralStats,
  getWaitlistPosition,
} from '../lib/referral';

// ---------------------------------------------------------------------------
// Supabase chain helper
// ---------------------------------------------------------------------------
let singleMock: jest.Mock;

function setupFromMock(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  singleMock = jest.fn().mockResolvedValue(result);
  (supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lte: jest.fn().mockResolvedValue({ count: 5, error: null }),
    single: singleMock,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  setupFromMock();
});

// ---------------------------------------------------------------------------
// getReferralCode — deterministic hash
// ---------------------------------------------------------------------------

describe('getReferralCode', () => {
  it('returns a 6-character string', () => {
    expect(getReferralCode('user-abc-123')).toHaveLength(6);
  });

  it('is deterministic — same userId always produces same code', () => {
    const a = getReferralCode('user-xyz');
    const b = getReferralCode('user-xyz');
    expect(a).toBe(b);
  });

  it('produces different codes for different userIds', () => {
    expect(getReferralCode('user-1')).not.toBe(getReferralCode('user-2'));
  });

  it('uses only chars from the safe alphabet (no ambiguous chars)', () => {
    const alphabet = new Set('abcdefghjkmnpqrstuvwxyz23456789'.split(''));
    const code = getReferralCode('test-user-id-unique');
    for (const ch of code) expect(alphabet.has(ch)).toBe(true);
  });

  it('handles empty string without throwing', () => {
    expect(() => getReferralCode('')).not.toThrow();
    expect(getReferralCode('')).toHaveLength(6);
  });

  it('handles very long userId without throwing', () => {
    const longId = 'u'.repeat(500);
    expect(getReferralCode(longId)).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// getReferralUrl
// ---------------------------------------------------------------------------

describe('getReferralUrl', () => {
  it('builds URL with code as ?ref= param', () => {
    expect(getReferralUrl('abc123')).toBe('https://roamappwait.netlify.app?ref=abc123');
  });

  it('uses the waitlist base URL', () => {
    expect(getReferralUrl('xyz')).toContain('roamappwait.netlify.app');
  });

  it('preserves the code exactly', () => {
    expect(getReferralUrl('TEST99')).toContain('ref=TEST99');
  });
});

// ---------------------------------------------------------------------------
// generateReferralCode — email-based hash (mirrors seededHash)
// ---------------------------------------------------------------------------

describe('generateReferralCode', () => {
  it('returns a 6-character string', () => {
    expect(generateReferralCode('test@example.com')).toHaveLength(6);
  });

  it('is deterministic for the same email', () => {
    expect(generateReferralCode('same@email.com')).toBe(generateReferralCode('same@email.com'));
  });

  it('normalises — uppercased email produces the same code as lowercase', () => {
    expect(generateReferralCode('HELLO@WORLD.COM')).toBe(generateReferralCode('hello@world.com'));
  });

  it('trims whitespace before hashing', () => {
    expect(generateReferralCode('  spaced@test.com  ')).toBe(generateReferralCode('spaced@test.com'));
  });

  it('different emails produce different codes', () => {
    expect(generateReferralCode('a@b.com')).not.toBe(generateReferralCode('c@d.com'));
  });

  it('uses only safe-alphabet characters', () => {
    const alphabet = new Set('abcdefghjkmnpqrstuvwxyz23456789'.split(''));
    for (const ch of generateReferralCode('test@roam.app')) {
      expect(alphabet.has(ch)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// proMonthsFromCount / nextMilestoneMessage — exercised via getReferralStats
// ---------------------------------------------------------------------------

describe('proMonthsFromCount (via getReferralStats)', () => {
  async function getMonths(count: number) {
    setupFromMock({ data: { code: 'abc123', referral_count: count, free_trips_earned: count }, error: null });
    const stats = await getReferralStats('user-1');
    return stats.proMonthsEarned;
  }

  it('returns 0 for 0 referrals', async () => expect(await getMonths(0)).toBe(0));
  it('returns 0 for 1 referral', async () => expect(await getMonths(1)).toBe(0));
  it('returns 0 for 2 referrals', async () => expect(await getMonths(2)).toBe(0));
  it('returns 1 for exactly 3 referrals', async () => expect(await getMonths(3)).toBe(1));
  it('returns 1 for 4 referrals', async () => expect(await getMonths(4)).toBe(1));
  it('returns 2 for 6 referrals', async () => expect(await getMonths(6)).toBe(2));
  it('returns 3 for 9 referrals', async () => expect(await getMonths(9)).toBe(3));
  it('returns 12 (1 year) for exactly 10 referrals', async () => expect(await getMonths(10)).toBe(12));
  it('returns 12 for > 10 referrals (capped)', async () => expect(await getMonths(99)).toBe(12));
});

describe('nextMilestoneMessage (via getReferralStats)', () => {
  async function getMessage(count: number) {
    setupFromMock({ data: { code: 'abc', referral_count: count, free_trips_earned: count }, error: null });
    return (await getReferralStats('user-1')).nextMilestoneMessage;
  }

  it('shows "3 more = 1 month free" at 0 referrals', async () => {
    expect(await getMessage(0)).toBe('3 more = 1 month free');
  });

  it('shows "2 more = 1 month free" at 1 referral', async () => {
    expect(await getMessage(1)).toBe('2 more = 1 month free');
  });

  it('shows "1 more = 1 month free" at 2 referrals', async () => {
    expect(await getMessage(2)).toBe('1 more = 1 month free');
  });

  it('switches to year messaging at 3+ (toYear=7 → "7 more = 1 year free")', async () => {
    expect(await getMessage(3)).toBe('7 more = 1 year free');
  });

  it('shows "1 more = 1 year free" at 9 referrals', async () => {
    expect(await getMessage(9)).toBe('1 more = 1 year free');
  });

  it('returns null at 10+ referrals (goal achieved)', async () => {
    expect(await getMessage(10)).toBeNull();
    expect(await getMessage(50)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getReferralStats — DB-first, AsyncStorage fallback, zero default
// ---------------------------------------------------------------------------

describe('getReferralStats', () => {
  it('returns stats from DB when available', async () => {
    setupFromMock({ data: { code: 'dbcode', referral_count: 5, free_trips_earned: 5 }, error: null });
    const stats = await getReferralStats('user-1');
    expect(stats.code).toBe('dbcode');
    expect(stats.referralsCount).toBe(5);
    expect(stats.freeTripsEarned).toBe(5);
  });

  it('falls back to AsyncStorage when DB returns null', async () => {
    setupFromMock({ data: null, error: null });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ referralsCount: 4 }));
    const stats = await getReferralStats('user-1');
    expect(stats.referralsCount).toBe(4);
  });

  it('returns zero defaults when both DB and AsyncStorage fail', async () => {
    setupFromMock({ data: null, error: { message: 'DB error' } });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const stats = await getReferralStats('user-1');
    expect(stats.referralsCount).toBe(0);
    expect(stats.proMonthsEarned).toBe(0);
  });

  it('includes a nextMilestoneMessage in the default fallback', async () => {
    setupFromMock({ data: null, error: null });
    const stats = await getReferralStats('user-1');
    expect(typeof stats.nextMilestoneMessage).toBe('string');
    expect(stats.nextMilestoneMessage).toContain('month free');
  });

  it('generates code from userId when DB has no code', async () => {
    const userId = 'known-user-id';
    setupFromMock({ data: { code: null, referral_count: 0, free_trips_earned: 0 }, error: null });
    const stats = await getReferralStats(userId);
    expect(stats.code).toBe(getReferralCode(userId));
  });
});

// ---------------------------------------------------------------------------
// recordReferral
// ---------------------------------------------------------------------------

describe('recordReferral', () => {
  it('increments AsyncStorage count when called without referrerUserId', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ referralsCount: 2 }));
    await recordReferral();
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const stored = JSON.parse(setCall[1] as string);
    expect(stored.referralsCount).toBe(3);
  });

  it('starts from 0 when AsyncStorage is empty', async () => {
    await recordReferral();
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const stored = JSON.parse(setCall[1] as string);
    expect(stored.referralsCount).toBe(1);
  });

  it('also updates Supabase when referrerUserId is provided', async () => {
    setupFromMock({ data: { referral_count: 2 }, error: null });
    await recordReferral('user-ref-123');
    expect(supabase.from).toHaveBeenCalledWith('referral_codes');
  });

  it('does not call Supabase update when no referrerUserId', async () => {
    await recordReferral(undefined);
    // Only AsyncStorage calls, no supabase.from for referral_codes upsert
    expect((supabase.from as jest.Mock).mock.calls.length).toBe(0);
  });

  it('never throws even when AsyncStorage fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('storage fail'));
    await expect(recordReferral()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// trackReferral — filter sentinel codes, update waitlist_emails
// ---------------------------------------------------------------------------

describe('trackReferral', () => {
  it('returns false for empty string', async () => {
    expect(await trackReferral('')).toBe(false);
  });

  it('returns false for whitespace-only', async () => {
    expect(await trackReferral('   ')).toBe(false);
  });

  it('returns false for "direct"', async () => {
    expect(await trackReferral('direct')).toBe(false);
  });

  it('returns false for "share"', async () => {
    expect(await trackReferral('share')).toBe(false);
  });

  it('returns false for "twitter"', async () => {
    expect(await trackReferral('twitter')).toBe(false);
  });

  it('returns false when referrer not found in DB', async () => {
    setupFromMock({ data: null, error: null });
    expect(await trackReferral('validcode')).toBe(false);
  });

  it('returns true when referrer found and updated', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row-1', referral_count: 3 }, error: null });
    expect(await trackReferral('validcode')).toBe(true);
  });

  it('normalises code to lowercase before lookup', async () => {
    singleMock.mockResolvedValueOnce({ data: { id: 'row-1', referral_count: 0 }, error: null });
    await trackReferral('UPPERCASE');
    // The code passed to supabase.eq should be 'uppercase'
    const eqCalls = (supabase.from as jest.Mock).mock.results[0].value.eq.mock.calls;
    expect(eqCalls[0][1]).toBe('uppercase');
  });

  it('returns false and does not throw when Supabase throws', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => { throw new Error('DB down'); });
    expect(await trackReferral('anycode')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getWaitlistReferralStats — referralsToNextReward edge cases
// ---------------------------------------------------------------------------

describe('getWaitlistReferralStats', () => {
  async function getStats(count: number) {
    singleMock.mockResolvedValueOnce({
      data: { referral_code: 'code123', referral_count: count },
      error: null,
    });
    return getWaitlistReferralStats('user@test.com');
  }

  it('referralsToNextReward = 3 at 0 referrals', async () => {
    expect((await getStats(0)).referralsToNextReward).toBe(3);
  });

  it('referralsToNextReward = 2 at 1 referral', async () => {
    expect((await getStats(1)).referralsToNextReward).toBe(2);
  });

  it('referralsToNextReward = 1 at 2 referrals', async () => {
    expect((await getStats(2)).referralsToNextReward).toBe(1);
  });

  it('referralsToNextReward = 3 at 3 referrals (new month cycle)', async () => {
    expect((await getStats(3)).referralsToNextReward).toBe(3);
  });

  it('referralsToNextReward = 0 at 10+ referrals (max tier)', async () => {
    expect((await getStats(10)).referralsToNextReward).toBe(0);
    expect((await getStats(20)).referralsToNextReward).toBe(0);
  });

  it('returns fallback when DB returns null', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: null });
    const stats = await getWaitlistReferralStats('unknown@test.com');
    expect(stats.referralCount).toBe(0);
    expect(stats.referralsToNextReward).toBe(3);
    expect(stats.code).toHaveLength(6);
  });

  it('normalises email before lookup', async () => {
    singleMock.mockResolvedValueOnce({ data: { referral_code: 'c', referral_count: 0 }, error: null });
    await getWaitlistReferralStats('  UPPER@TEST.COM  ');
    const eqCalls = (supabase.from as jest.Mock).mock.results[0].value.eq.mock.calls;
    expect(eqCalls[0][1]).toBe('upper@test.com');
  });
});

// ---------------------------------------------------------------------------
// getWaitlistPosition
// ---------------------------------------------------------------------------

describe('getWaitlistPosition', () => {
  it('returns count when row is found', async () => {
    singleMock.mockResolvedValueOnce({ data: { created_at: '2026-01-01T00:00:00Z' }, error: null });
    const pos = await getWaitlistPosition('user@test.com');
    expect(pos).toBe(5); // from lte mock default
  });

  it('returns 0 when email not found', async () => {
    singleMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await getWaitlistPosition('nobody@test.com')).toBe(0);
  });

  it('returns 0 on Supabase error', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => { throw new Error('DB'); });
    expect(await getWaitlistPosition('err@test.com')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ensureReferralCode
// ---------------------------------------------------------------------------

describe('ensureReferralCode', () => {
  it('returns a 6-char code derived from userId', async () => {
    const code = await ensureReferralCode('user-ensure-test');
    expect(code).toBe(getReferralCode('user-ensure-test'));
  });

  it('does not throw even if supabase upsert fails', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => { throw new Error('fail'); });
    await expect(ensureReferralCode('user-1')).resolves.toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// shareReferralLink
// ---------------------------------------------------------------------------

describe('shareReferralLink', () => {
  it('calls Share.share with a message containing the URL', async () => {
    (Share.share as jest.Mock).mockResolvedValueOnce({ action: 'sharedAction' });
    await shareReferralLink('mycode99');
    expect(Share.share).toHaveBeenCalledTimes(1);
    const args = (Share.share as jest.Mock).mock.calls[0][0];
    expect(args.message).toContain('roamappwait.netlify.app');
    expect(args.message).toContain('mycode99');
  });
});
