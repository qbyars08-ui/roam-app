/**
 * Tests for admin bypass logic in supabase/functions/claude-proxy/index.ts
 *
 * The edge function runs in Deno and cannot be directly imported in Jest.
 * This test file:
 *  1. Mirrors the exact admin-bypass logic verbatim from the edge function
 *  2. Verifies correct behavior under all inputs
 *  3. Verifies the rate-limit bypass condition (isTripGeneration && isFree && !isAdmin)
 *
 * If the edge function logic is refactored, update this test to match.
 *
 * Logic under test (from claude-proxy/index.ts, lines 145-164):
 *
 *   const adminEmails = (env.ADMIN_TEST_EMAILS || "")
 *     .split(",")
 *     .map(e => e.trim().toLowerCase())
 *     .filter(Boolean);
 *   const userEmail = (user.email || "").toLowerCase();
 *   const isAdmin = adminEmails.includes(userEmail);
 *
 *   if (isTripGeneration && isFree && !isAdmin && tripsThisMonth >= FREE_TIER_LIMIT) {
 *     → 429 LIMIT_REACHED
 *   }
 */

const FREE_TIER_LIMIT = 1;

// ---------------------------------------------------------------------------
// Helpers — mirror the edge function's pure logic
// ---------------------------------------------------------------------------

/** Parse ADMIN_TEST_EMAILS env string into a normalised Set */
function parseAdminEmails(envValue: string | undefined): string[] {
  return (envValue || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Check if a user email is in the admin list */
function isAdminUser(userEmail: string, adminEmails: string[]): boolean {
  return adminEmails.includes((userEmail || '').toLowerCase());
}

/** Determine whether the rate limit should fire */
function shouldRateLimit(opts: {
  isTripGeneration: boolean;
  subscriptionTier: string;
  isAdmin: boolean;
  tripsThisMonth: number;
}): boolean {
  const isFree = opts.subscriptionTier === 'free' || !opts.subscriptionTier;
  return (
    opts.isTripGeneration &&
    isFree &&
    !opts.isAdmin &&
    opts.tripsThisMonth >= FREE_TIER_LIMIT
  );
}

// ---------------------------------------------------------------------------
// parseAdminEmails
// ---------------------------------------------------------------------------

describe('parseAdminEmails', () => {
  it('returns empty array for undefined env var', () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseAdminEmails('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseAdminEmails('   ')).toEqual([]);
  });

  it('parses a single email', () => {
    expect(parseAdminEmails('admin@test.com')).toEqual(['admin@test.com']);
  });

  it('parses a comma-separated list of emails', () => {
    const result = parseAdminEmails('admin@test.com, dev@roam.app, qa@roam.app');
    expect(result).toEqual(['admin@test.com', 'dev@roam.app', 'qa@roam.app']);
  });

  it('normalises to lowercase', () => {
    expect(parseAdminEmails('ADMIN@TEST.COM')).toEqual(['admin@test.com']);
  });

  it('trims whitespace around each email', () => {
    expect(parseAdminEmails('  dev@test.com  ,  qa@test.com  ')).toEqual([
      'dev@test.com',
      'qa@test.com',
    ]);
  });

  it('filters out empty entries from double commas', () => {
    expect(parseAdminEmails('admin@test.com,,qa@test.com')).toEqual([
      'admin@test.com',
      'qa@test.com',
    ]);
  });

  it('handles the documented admin email qbyars08@gmail.com', () => {
    const emails = parseAdminEmails('qbyars08@gmail.com');
    expect(emails).toContain('qbyars08@gmail.com');
  });
});

// ---------------------------------------------------------------------------
// isAdminUser
// ---------------------------------------------------------------------------

describe('isAdminUser', () => {
  const admins = ['qbyars08@gmail.com', 'dev@roam.app'];

  it('returns true for a known admin email', () => {
    expect(isAdminUser('qbyars08@gmail.com', admins)).toBe(true);
  });

  it('returns false for a non-admin email', () => {
    expect(isAdminUser('regular@user.com', admins)).toBe(false);
  });

  it('is case-insensitive — uppercase admin email still matches', () => {
    expect(isAdminUser('QBYARS08@GMAIL.COM', admins)).toBe(true);
  });

  it('returns false for empty email string', () => {
    expect(isAdminUser('', admins)).toBe(false);
  });

  it('returns false when admin list is empty', () => {
    expect(isAdminUser('qbyars08@gmail.com', [])).toBe(false);
  });

  it('partial match does not count (exact email required)', () => {
    expect(isAdminUser('dev@roam.app.evil.com', admins)).toBe(false);
    expect(isAdminUser('@roam.app', admins)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shouldRateLimit — full bypass matrix
// ---------------------------------------------------------------------------

describe('shouldRateLimit — admin bypass', () => {
  it('does NOT rate-limit admin users even when at free tier limit', () => {
    expect(shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: 'free',
      isAdmin: true,
      tripsThisMonth: FREE_TIER_LIMIT,
    })).toBe(false);
  });

  it('does NOT rate-limit admin users who exceed the limit many times over', () => {
    expect(shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: 'free',
      isAdmin: true,
      tripsThisMonth: 100,
    })).toBe(false);
  });

  it('DOES rate-limit non-admin free users at the limit', () => {
    expect(shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: 'free',
      isAdmin: false,
      tripsThisMonth: FREE_TIER_LIMIT,
    })).toBe(true);
  });

  it('DOES rate-limit non-admin users with empty subscription_tier (treated as free)', () => {
    expect(shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: '',
      isAdmin: false,
      tripsThisMonth: FREE_TIER_LIMIT,
    })).toBe(true);
  });

  it('does NOT rate-limit when trips is below the limit', () => {
    expect(shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: 'free',
      isAdmin: false,
      tripsThisMonth: FREE_TIER_LIMIT - 1,
    })).toBe(false);
  });

  it('does NOT rate-limit Pro users regardless of trip count', () => {
    expect(shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: 'pro',
      isAdmin: false,
      tripsThisMonth: 999,
    })).toBe(false);
  });

  it('does NOT rate-limit when isTripGeneration is false (chat messages)', () => {
    expect(shouldRateLimit({
      isTripGeneration: false,
      subscriptionTier: 'free',
      isAdmin: false,
      tripsThisMonth: FREE_TIER_LIMIT,
    })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// End-to-end scenario: real admin email in env
// ---------------------------------------------------------------------------

describe('admin bypass — end-to-end scenario', () => {
  it('qbyars08@gmail.com is in the whitelist and bypasses rate limit', () => {
    const ENV_VALUE = 'qbyars08@gmail.com';
    const adminEmails = parseAdminEmails(ENV_VALUE);
    const isAdmin = isAdminUser('qbyars08@gmail.com', adminEmails);
    const limited = shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: 'free',
      isAdmin,
      tripsThisMonth: 10, // well above free tier limit
    });
    expect(isAdmin).toBe(true);
    expect(limited).toBe(false);
  });

  it('a regular free user with the same trip count IS rate-limited', () => {
    const ENV_VALUE = 'qbyars08@gmail.com';
    const adminEmails = parseAdminEmails(ENV_VALUE);
    const isAdmin = isAdminUser('regular@user.com', adminEmails);
    const limited = shouldRateLimit({
      isTripGeneration: true,
      subscriptionTier: 'free',
      isAdmin,
      tripsThisMonth: 10,
    });
    expect(isAdmin).toBe(false);
    expect(limited).toBe(true);
  });

  it('multiple admin emails all bypass correctly', () => {
    const ENV_VALUE = 'qbyars08@gmail.com, dev@roam.app, qa@test.com';
    const adminEmails = parseAdminEmails(ENV_VALUE);

    for (const email of ['qbyars08@gmail.com', 'dev@roam.app', 'qa@test.com']) {
      const isAdmin = isAdminUser(email, adminEmails);
      expect(isAdmin).toBe(true);
      expect(shouldRateLimit({ isTripGeneration: true, subscriptionTier: 'free', isAdmin, tripsThisMonth: 5 })).toBe(false);
    }
  });

  it('rate limit is based on FREE_TIER_LIMIT = 1', () => {
    // Exactly at limit (1 trip) → rate limited
    expect(shouldRateLimit({ isTripGeneration: true, subscriptionTier: 'free', isAdmin: false, tripsThisMonth: 1 })).toBe(true);
    // Below limit (0 trips) → not rate limited
    expect(shouldRateLimit({ isTripGeneration: true, subscriptionTier: 'free', isAdmin: false, tripsThisMonth: 0 })).toBe(false);
  });
});
