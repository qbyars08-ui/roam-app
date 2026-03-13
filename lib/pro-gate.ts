// =============================================================================
// ROAM — Pro Feature Gating & Trip Limit Enforcement
// Pro status comes from RevenueCat via _layout bootstrap + CustomerInfo listener.
// Store (isPro) is synced on app start and after every purchase/restore.
// =============================================================================
import { useAppStore } from './store';
import { FREE_TRIPS_PER_MONTH } from './constants';

// ---------------------------------------------------------------------------
// Feature gates — which features require Pro
// ---------------------------------------------------------------------------
export const PRO_FEATURES = [
  'offline-prep',
  'travel-twin',
  'trip-chemistry',
  'memory-lane',
  'unlimited-trips',
  'priority-ai',
] as const;

export type ProFeature = (typeof PRO_FEATURES)[number];

/**
 * Check if a specific feature requires Pro and the user doesn't have it.
 * Returns true if the feature is BLOCKED (user needs Pro).
 */
export function isFeatureGated(feature: ProFeature): boolean {
  const { isPro } = useAppStore.getState();
  if (isPro) return false; // Pro users get everything
  return PRO_FEATURES.includes(feature);
}

/**
 * Hook-friendly version: returns { canAccess, isPro } for a given feature.
 */
export function useProGate(feature: ProFeature): {
  canAccess: boolean;
  isPro: boolean;
} {
  const isPro = useAppStore((s) => s.isPro);
  return {
    canAccess: isPro || !PRO_FEATURES.includes(feature),
    isPro,
  };
}

// ---------------------------------------------------------------------------
// Trip limit enforcement
// ---------------------------------------------------------------------------

/**
 * Check if the user can generate another trip.
 * Free users: 1 trip/month. Pro users: unlimited.
 * Returns { canGenerate, remaining, reason }
 */
export function canGenerateTrip(): {
  canGenerate: boolean;
  remaining: number;
  reason?: 'limit' | 'pro';
} {
  const { isPro, tripsThisMonth } = useAppStore.getState();

  if (isPro) {
    return { canGenerate: true, remaining: Infinity, reason: 'pro' };
  }

  const remaining = Math.max(0, FREE_TRIPS_PER_MONTH - tripsThisMonth);
  return {
    canGenerate: remaining > 0,
    remaining,
    reason: remaining <= 0 ? 'limit' : undefined,
  };
}

/**
 * Hook version of canGenerateTrip for reactive UI.
 */
export function useCanGenerateTrip(): {
  canGenerate: boolean;
  remaining: number;
  isPro: boolean;
} {
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);

  if (isPro) {
    return { canGenerate: true, remaining: Infinity, isPro: true };
  }

  const remaining = Math.max(0, FREE_TRIPS_PER_MONTH - tripsThisMonth);
  return { canGenerate: remaining > 0, remaining, isPro: false };
}

/**
 * Increment trip count after successful generation.
 * Call this after callClaude() succeeds.
 */
export function recordTripGeneration(): void {
  const { tripsThisMonth, setTripsThisMonth } = useAppStore.getState();
  setTripsThisMonth(tripsThisMonth + 1);
}

// ---------------------------------------------------------------------------
// Pro badge text
// ---------------------------------------------------------------------------
export function getProBadgeText(): string {
  const { isPro } = useAppStore.getState();
  return isPro ? 'PRO' : 'FREE';
}
