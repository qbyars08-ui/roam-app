// =============================================================================
// ROAM — Sync Pro Status to Supabase
// Ensures profiles.subscription_tier matches RevenueCat + referral so
// claude-proxy (server-side) enforces limits correctly.
// =============================================================================

import { supabase } from './supabase';
import { useAppStore } from './store';

/**
 * Compute effective Pro status: RevenueCat purchases OR active referral.
 */
function isProFromReferral(profile: { pro_referral_expires_at?: string | null } | null): boolean {
  if (!profile?.pro_referral_expires_at) return false;
  return new Date(profile.pro_referral_expires_at) > new Date();
}

/**
 * Sync Pro status to Supabase profiles.subscription_tier.
 * Call when RevenueCat state changes (purchase, restore, expiration).
 * Merges proFromPurchases with referral-earned Pro.
 */
export async function syncProStatusToSupabase(
  userId: string,
  proFromPurchases: boolean
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, pro_referral_expires_at')
    .eq('id', userId)
    .single();

  const proFromReferral = isProFromReferral(profile ?? null);
  const effectivePro = proFromPurchases || proFromReferral;

  const currentTier = (profile as { subscription_tier?: string } | null)?.subscription_tier ?? 'free';
  const targetTier = effectivePro ? 'pro' : 'free';

  if (currentTier === targetTier) {
    useAppStore.getState().setIsPro(effectivePro);
    return effectivePro;
  }

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: targetTier })
    .eq('id', userId);

  if (error) {
    console.warn('[sync-pro] Failed to update subscription_tier:', error);
  }

  useAppStore.getState().setIsPro(effectivePro);
  return effectivePro;
}
