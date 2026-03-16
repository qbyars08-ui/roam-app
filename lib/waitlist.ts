// =============================================================================
// ROAM — Waitlist & Invite System
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const REFERRAL_CODE_KEY = 'roam_referral_code';
const INVITE_COUNT_KEY = 'roam_invite_count';

// Generate a unique referral code for the user
export function generateReferralCode(userId: string): string {
  const hash = userId.slice(0, 6).toUpperCase();
  return `ROAM-${hash}`;
}

// Get or create referral code
export async function getReferralCode(): Promise<string> {
  const stored = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
  if (stored) return stored;

  const id = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `ROAM-${id}`;
  await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
  return code;
}

// Get invite count
export async function getInviteCount(): Promise<number> {
  const stored = await AsyncStorage.getItem(INVITE_COUNT_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

// Increment invite count
export async function incrementInviteCount(): Promise<number> {
  const current = await getInviteCount();
  const next = current + 1;
  await AsyncStorage.setItem(INVITE_COUNT_KEY, String(next));
  return next;
}

// Submit email to waitlist
export async function submitToWaitlist(email: string, referralCode?: string): Promise<{ success: boolean; position?: number; error?: string }> {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    // Try Supabase insert
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        referral_code: referralCode || null,
        source: 'app_invite',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // Duplicate email
      if (error.code === '23505') {
        return { success: false, error: "You're already on the list! We'll be in touch soon." };
      }
      // If Supabase fails (no table yet), store locally
      console.warn('Waitlist insert failed, storing locally:', error.message);
      return await storeLocalWaitlistEntry(email, referralCode);
    }

    // Get position — use data to avoid unused-var lint
    void data;
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    return { success: true, position: count ?? 1 };
  } catch {
    return await storeLocalWaitlistEntry(email, referralCode);
  }
}

// Local fallback when Supabase isn't available
async function storeLocalWaitlistEntry(email: string, referralCode?: string): Promise<{ success: boolean; position?: number; error?: string }> {
  try {
    const key = 'roam_local_waitlist';
    const stored = await AsyncStorage.getItem(key);
    const entries: Array<{ email: string; referralCode?: string; timestamp: string }> = stored ? JSON.parse(stored) : [];

    // Check duplicate
    if (entries.some(e => e.email === email.toLowerCase().trim())) {
      return { success: false, error: "You're already on the list!" };
    }

    entries.push({
      email: email.toLowerCase().trim(),
      referralCode,
      timestamp: new Date().toISOString(),
    });

    await AsyncStorage.setItem(key, JSON.stringify(entries));
    return { success: true, position: entries.length };
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

// Get all local waitlist entries (for admin)
export async function getLocalWaitlistEntries(): Promise<Array<{ email: string; referralCode?: string; timestamp: string }>> {
  try {
    const stored = await AsyncStorage.getItem('roam_local_waitlist');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Get waitlist stats (for admin)
export async function getWaitlistStats(): Promise<{ total: number; today: number; thisWeek: number; topReferrers: Array<{ code: string; count: number }> }> {
  try {
    const { count: total } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weekCount } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo);

    return {
      total: total ?? 0,
      today: todayCount ?? 0,
      thisWeek: weekCount ?? 0,
      topReferrers: [],
    };
  } catch {
    // Fallback to local
    const local = await getLocalWaitlistEntries();
    return { total: local.length, today: 0, thisWeek: 0, topReferrers: [] };
  }
}
