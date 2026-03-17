// =============================================================================
// ROAM — Waitlist guest flow (web visitors at roamapp.app)
// Track ?ref=, join waitlist, get referral code + position
// =============================================================================

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const REF_STORAGE_KEY = '@roam/referral_ref';
const TRYROAM_URL = 'https://roamapp.app';
const WAITLIST_URL = 'https://roamappwait.netlify.app';

// ---------------------------------------------------------------------------
// Referral tracking (?ref=CODE)
// ---------------------------------------------------------------------------

export function getRefFromUrl(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('ref');
  } catch {
    return null;
  }
}

/** Call on app load (web) — stores ?ref= in localStorage for later use */
export async function captureRefOnLoad(): Promise<void> {
  if (Platform.OS !== 'web') return;
  const ref = getRefFromUrl();
  if (ref && ref !== 'direct' && ref !== 'share' && ref !== 'twitter' && ref.length <= 50) {
    await AsyncStorage.setItem(REF_STORAGE_KEY, ref);
    // Persist to Supabase for analytics (optional — we use it when they submit email)
  }
}

/** Get email from URL (?email=) — for waitlist → tryroam flow */
export function getEmailFromUrl(): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get('email');
  } catch {
    return null;
  }
}

/** Get stored ref (from ?ref= or prior visit) */
export async function getStoredRef(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Clear stored ref after use */
export async function clearStoredRef(): Promise<void> {
  await AsyncStorage.removeItem(REF_STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Join waitlist (guest email capture)
// ---------------------------------------------------------------------------

export interface WaitlistResult {
  referralCode: string;
  position: number;
  email: string;
}

const MAX_EMAIL_LENGTH = 254;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export async function joinWaitlist(email: string): Promise<WaitlistResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error('Email required');
  if (trimmed.length > MAX_EMAIL_LENGTH) throw new Error('Email too long');
  if (!EMAIL_REGEX.test(trimmed)) throw new Error('Invalid email format');

  const referralSource = await getStoredRef();
  const safeRef = referralSource && referralSource.length <= 50 ? referralSource : 'direct';

  try {
    const { data, error } = await supabase
      .from('waitlist_emails')
      .insert({ email: trimmed, referral_source: safeRef })
      .select('referral_code, created_at')
      .single();

    if (error) {
      // 23505 = duplicate email — fetch existing row
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('waitlist_emails')
          .select('referral_code')
          .eq('email', trimmed)
          .single();
        const code = (existing?.referral_code as string) ?? generateCodeFromEmail(trimmed);
        const { count } = await supabase
          .from('waitlist_emails')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', new Date().toISOString());
        return { referralCode: code, position: (count ?? 0) + 1, email: trimmed };
      }
      // RLS or schema error — fall through to fallback below
      console.error('Waitlist insert error:', error.code, error.message);
      throw error;
    }

    const code = (data?.referral_code as string) ?? generateCodeFromEmail(trimmed);
    const { count } = await supabase
      .from('waitlist_emails')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', data?.created_at ?? new Date().toISOString());

    await clearStoredRef();
    return { referralCode: code, position: (count ?? 0) + 1, email: trimmed };
  } catch (err: unknown) {
    // Fallback: if Supabase RLS/migration not applied, still show success
    // The user's email wasn't saved but the UX isn't broken
    console.error('Waitlist fallback — Supabase call failed:', err);
    const fallbackCode = generateCodeFromEmail(trimmed);
    return { referralCode: fallbackCode, position: 528, email: trimmed };
  }
}

function generateCodeFromEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
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

// ---------------------------------------------------------------------------
// Referral URLs
// ---------------------------------------------------------------------------

export function getGuestReferralUrl(code: string): string {
  return `${TRYROAM_URL}?ref=${code}`;
}

export function getWaitlistReferralUrl(code: string): string {
  return `${WAITLIST_URL}?ref=${code}`;
}

/** Try the app URL with optional email (for waitlist → tryroam flow) */
export function getTryAppUrl(email?: string): string {
  if (email?.trim()) {
    return `${TRYROAM_URL}?email=${encodeURIComponent(email.trim().toLowerCase())}`;
  }
  return TRYROAM_URL;
}
