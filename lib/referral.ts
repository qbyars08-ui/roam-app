// =============================================================================
// ROAM — Referral System Engine
// 3 refs = 1 month Pro free, 10 refs = 1 year Pro free
// =============================================================================
import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ReferralStats {
  code: string;
  referralsCount: number;
  freeTripsEarned: number;
  /** Months of Pro earned (3 refs = 1mo, 10 refs = 12mo) */
  proMonthsEarned: number;
  /** "7 more = 1 year free" style message */
  nextMilestoneMessage: string | null;
}

const BASE_URL = 'https://roamappwait.netlify.app';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY = '@roam/referral_data';
const REFS_FOR_1_MONTH = 3;
const REFS_FOR_1_YEAR = 10;

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------
function seededHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  let h = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    result += chars[h % chars.length];
    h = Math.floor(h / chars.length);
  }
  return result;
}

export function getReferralCode(userId: string): string {
  return seededHash(userId);
}

/**
 * Generate an 8-char referral code: first 3 chars of destination (or "ROAM") + 5 random.
 * Used when creating shareable codes with destination context.
 */
export function generateReferralCodeWithPrefix(
  userId: string,
  destination?: string
): string {
  const prefix = destination
    ? destination.slice(0, 3).toUpperCase()
    : 'ROAM';
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  // Deterministic from userId but looks random
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  let h = Math.abs(hash);
  let suffix = '';
  const needed = 8 - prefix.length;
  for (let i = 0; i < needed; i++) {
    suffix += chars[h % chars.length];
    h = Math.floor(h / chars.length) || 1;
  }
  return (prefix + suffix).slice(0, 8);
}

/**
 * Returns existing referral code or creates a new one for the user.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', userId)
      .single();
    if (data?.code) return data.code as string;
  } catch { /* no existing code */ }
  return ensureReferralCode(userId);
}

/** Full referral URL: roamappwait.netlify.app?ref=code */
export function getReferralUrl(code: string): string {
  return `${BASE_URL}?ref=${code}`;
}

/** App deep link URL for referrals */
export function getReferralDeepLink(code: string): string {
  return `roamapp.app/ref/${code}`;
}

// ---------------------------------------------------------------------------
// Pro months earned from referrals
// ---------------------------------------------------------------------------
function proMonthsFromCount(count: number): number {
  if (count >= REFS_FOR_1_YEAR) return 12;
  return Math.floor(count / REFS_FOR_1_MONTH);
}

function nextMilestoneMessage(count: number): string | null {
  if (count >= REFS_FOR_1_YEAR) return null;
  const toYear = REFS_FOR_1_YEAR - count;
  const toNextMonth = count < REFS_FOR_1_MONTH ? REFS_FOR_1_MONTH - count : REFS_FOR_1_MONTH - (count % REFS_FOR_1_MONTH);
  if (toYear <= 7) return `${toYear} more = 1 year free`;
  return `${toNextMonth} more = 1 month free`;
}

// ---------------------------------------------------------------------------
// Ensure referral_codes row exists (create on first access)
// ---------------------------------------------------------------------------
export async function ensureReferralCode(userId: string): Promise<string> {
  const code = getReferralCode(userId);
  try {
    await supabase.from('referral_codes').upsert(
      { user_id: userId, code, referral_count: 0, free_trips_earned: 0 },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
  } catch { /* silent */ }
  return code;
}

// ---------------------------------------------------------------------------
// Referral stats — Supabase-first, fallback AsyncStorage
// ---------------------------------------------------------------------------
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = getReferralCode(userId);

  try {
    await ensureReferralCode(userId);

    const { data } = await supabase
      .from('referral_codes')
      .select('code, referral_count, free_trips_earned')
      .eq('user_id', userId)
      .single();

    if (data) {
      const count = (data.referral_count as number) ?? 0;
      const dbCode = (data.code as string) ?? code;
      return {
        code: dbCode,
        referralsCount: count,
        freeTripsEarned: count,
        proMonthsEarned: proMonthsFromCount(count),
        nextMilestoneMessage: nextMilestoneMessage(count),
      };
    }
  } catch { /* silent */ }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as { referralsCount?: number };
      const count = data.referralsCount ?? 0;
      return {
        code,
        referralsCount: count,
        freeTripsEarned: count,
        proMonthsEarned: proMonthsFromCount(count),
        nextMilestoneMessage: nextMilestoneMessage(count),
      };
    }
  } catch { /* silent */ }

  return {
    code,
    referralsCount: 0,
    freeTripsEarned: 0,
    proMonthsEarned: 0,
    nextMilestoneMessage: `${REFS_FOR_1_MONTH} more = 1 month free`,
  };
}

/** Called when a referred user signs up — increments their referrer's count */
export async function recordReferral(referrerUserId?: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as { referralsCount?: number }) : {};
    const count = (data.referralsCount ?? 0) + 1;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ referralsCount: count }));
  } catch { /* silent */ }
  if (referrerUserId) {
    try {
      const code = getReferralCode(referrerUserId);
      const { data: existing } = await supabase.from('referral_codes').select('referral_count').eq('code', code).single();
      const next = ((existing as { referral_count?: number })?.referral_count ?? 0) + 1;
      await supabase.from('referral_codes').upsert({ user_id: referrerUserId, code, referral_count: next }, { onConflict: 'user_id' });
    } catch { /* silent */ }
  }
}

// ---------------------------------------------------------------------------
// Share sheet — native share with waitlist URL
// ---------------------------------------------------------------------------
export async function shareReferralLink(code: string): Promise<void> {
  const deepLink = getReferralDeepLink(code);
  const url = getReferralUrl(code);
  await Share.share({
    message: `Plan your next trip in 30 seconds. Use code ${code} for 3 bonus trips. ${deepLink}`,
    url,
    title: 'Join ROAM',
  });
}

// =============================================================================
// Waitlist Referral Tracking
// Functions for the public waitlist flow (waitlist.html / welcome.html).
// These operate on the waitlist_emails table, not referral_codes.
// =============================================================================

export interface WaitlistReferralStats {
  code: string;
  referralCount: number;
  proMonthsEarned: number;
  nextMilestoneMessage: string | null;
  referralsToNextReward: number;
}

/**
 * Generate a deterministic 6-char alphanumeric referral code from an email.
 * Mirrors the Supabase function waitlist_referral_code() so the client can
 * compute the code without a round-trip when needed.
 */
export function generateReferralCode(email: string): string {
  return seededHash(email.trim().toLowerCase());
}

/**
 * Track a referral: find the referrer by code and increment their
 * referral_count in waitlist_emails. Called when a new user signs up
 * with ?ref=CODE.
 *
 * The Supabase trigger credit_referrer_on_waitlist_insert handles this
 * server-side, but this function exists for explicit client-side calls
 * or edge-function use when the trigger is bypassed.
 */
export async function trackReferral(referralCode: string): Promise<boolean> {
  const code = referralCode.trim().toLowerCase();
  if (!code || code === 'direct' || code === 'share' || code === 'twitter') {
    return false;
  }
  try {
    const { data: referrer } = await supabase
      .from('waitlist_emails')
      .select('id, referral_count')
      .eq('referral_code', code)
      .single();

    if (!referrer) return false;

    const nextCount = ((referrer as { referral_count?: number }).referral_count ?? 0) + 1;
    await supabase
      .from('waitlist_emails')
      .update({ referral_count: nextCount })
      .eq('referral_code', code);

    return true;
  } catch {
    return false;
  }
}

/**
 * Get referral stats for a waitlist email.
 * Returns count, months earned (every 3 referrals = 1 month Pro), and
 * progress toward next reward.
 */
export async function getWaitlistReferralStats(
  email: string
): Promise<WaitlistReferralStats> {
  const trimmed = email.trim().toLowerCase();
  const fallbackCode = generateReferralCode(trimmed);

  try {
    const { data } = await supabase
      .from('waitlist_emails')
      .select('referral_code, referral_count')
      .eq('email', trimmed)
      .single();

    if (data) {
      const code = (data.referral_code as string) ?? fallbackCode;
      const count = (data.referral_count as number) ?? 0;
      return {
        code,
        referralCount: count,
        proMonthsEarned: proMonthsFromCount(count),
        nextMilestoneMessage: nextMilestoneMessage(count),
        referralsToNextReward: count < REFS_FOR_1_MONTH
          ? REFS_FOR_1_MONTH - count
          : count < REFS_FOR_1_YEAR
            ? REFS_FOR_1_MONTH - (count % REFS_FOR_1_MONTH)
            : 0,
      };
    }
  } catch (_err) { /* getReferralStats — falls through to default values on any error */ }

  return {
    code: fallbackCode,
    referralCount: 0,
    proMonthsEarned: 0,
    nextMilestoneMessage: `${REFS_FOR_1_MONTH} more = 1 month free`,
    referralsToNextReward: REFS_FOR_1_MONTH,
  };
}

/**
 * Get waitlist position for an email — ordered by created_at ascending.
 * Position 1 = earliest signup.
 */
export async function getWaitlistPosition(email: string): Promise<number> {
  const trimmed = email.trim().toLowerCase();
  try {
    const { data: row } = await supabase
      .from('waitlist_emails')
      .select('created_at')
      .eq('email', trimmed)
      .single();

    if (!row?.created_at) return 0;

    const { count } = await supabase
      .from('waitlist_emails')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', row.created_at as string);

    return count ?? 0;
  } catch {
    return 0;
  }
}
