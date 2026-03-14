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

/** Full referral URL: roamappwait.netlify.app?ref=code */
export function getReferralUrl(code: string): string {
  return `${BASE_URL}?ref=${code}`;
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
  const url = getReferralUrl(code);
  await Share.share({
    message: `Plan your next trip with ROAM — it's like having a well-traveled friend in your pocket. Join the waitlist: ${url}`,
    url,
    title: 'Join ROAM',
  });
}
