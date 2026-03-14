// =============================================================================
// ROAM — Onboarding A/B Test (3 variants)
// Assigns users to control, variant_a, variant_b and tracks in Supabase
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const VARIANTS = ['control', 'variant_a', 'variant_b'] as const;
export type OnboardingVariant = (typeof VARIANTS)[number];

const SESSION_KEY = '@roam/ab_session_id';
const ASSIGNED_KEY = '@roam/ab_variant';

/** Generate a session ID for pre-auth users */
async function getOrCreateSessionId(): Promise<string> {
  let id = await AsyncStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    await AsyncStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Assign user to one of 3 variants (even distribution).
 * Returns cached variant if already assigned this session.
 */
export async function assignOnboardingVariant(): Promise<OnboardingVariant> {
  const cached = await AsyncStorage.getItem(ASSIGNED_KEY);
  if (cached && VARIANTS.includes(cached as OnboardingVariant)) {
    return cached as OnboardingVariant;
  }

  const sessionId = await getOrCreateSessionId();
  const idx = Math.abs(hashCode(sessionId)) % 3;
  const variant = VARIANTS[idx];

  try {
    await supabase.from('onboarding_ab_assignments').upsert(
      {
        session_id: sessionId,
        variant,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    );
  } catch {
    // Non-blocking
  }
  await AsyncStorage.setItem(ASSIGNED_KEY, variant);
  return variant;
}

/** Mark onboarding completion for current user (post-auth) or session */
export async function trackOnboardingComplete(userId?: string): Promise<void> {
  const sessionId = await AsyncStorage.getItem(SESSION_KEY);
  const variant = await AsyncStorage.getItem(ASSIGNED_KEY);
  if (!sessionId || !variant) return;

  try {
    if (userId) {
      await supabase
        .from('onboarding_ab_assignments')
        .update({
          user_id: userId,
          completed_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
    } else {
      await supabase
        .from('onboarding_ab_assignments')
        .update({ completed_at: new Date().toISOString() })
        .eq('session_id', sessionId);
    }
  } catch { /* silent */ }
}

export function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
