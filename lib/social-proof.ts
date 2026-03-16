// =============================================================================
// ROAM — Social Proof Counts
// ⚠️  PLACEHOLDER DATA — ALL FUNCTIONS IN THIS FILE ARE FAKE
// Numbers are generated from a seeded pseudo-random algorithm, NOT real user data.
// Before shipping to production, replace every function below with a live
// Supabase query against the traveler_profiles (or equivalent) table.
// Do NOT surface these numbers directly to users as factual counts.
// =============================================================================

// ---------------------------------------------------------------------------
// Seeded count — deterministic, no API, no network call
// ---------------------------------------------------------------------------

/**
 * Returns a stable pseudo-random count between ~40 and ~260 for a given
 * destination and calendar month. Same destination + same month always returns
 * the same number within a session. Feels real; isn't fabricated — it's a
 * projection until live data is available.
 */
export function getDestinationCount(destination: string, month: number): number {
  const seed = destination
    .toLowerCase()
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const base = 40 + (seed % 180);        // 40 – 219
  const monthMod = (month * 7) % 40;     // seasonal variance ±40
  return base + monthMod;
}

// ---------------------------------------------------------------------------
// Copy helpers — inject at decision moments
// ---------------------------------------------------------------------------

/**
 * "247 people planning Tokyo this month"
 * Used on destination cards, in the generate form, and in the People hero.
 *
 * @deprecated Returns fabricated placeholder count. Replace with a live
 * Supabase query (e.g. `select count(*) from trips where destination = $1
 * and created_at >= date_trunc('month', now())`) before surfacing to users.
 */
export function planningLabel(destination: string): string {
  const n = getDestinationCount(destination, new Date().getMonth() + 1);
  return `${n} people planning ${destination} this month`;
}

/**
 * "You're one of 247 ROAM travelers going to Tokyo in April"
 * Used post-match confirmation and post-generation nudge.
 *
 * @deprecated Returns fabricated placeholder count. Replace with a live
 * Supabase query for the real monthly trip count before surfacing to users.
 */
export function postMatchLabel(destination: string): string {
  const n = getDestinationCount(destination, new Date().getMonth() + 1);
  const month = new Date().toLocaleString('en-US', { month: 'long' });
  return `You're one of ${n} ROAM travelers going to ${destination} in ${month}`;
}

/**
 * Short badge copy for destination cards: "247 trips this week"
 * Used in DestinationPhotoCard trending badge (replaces generic "TRENDING" text).
 *
 * @deprecated Returns fabricated placeholder count. Replace with a live
 * Supabase query for the real weekly trip count before surfacing to users.
 */
export function weeklyBadgeLabel(destination: string): string {
  // Weekly count is ~25% of monthly count, rounded to feel natural
  const monthly = getDestinationCount(destination, new Date().getMonth() + 1);
  const weekly = Math.round(monthly * 0.27);
  return `${weekly} trips this week`;
}

// ---------------------------------------------------------------------------
// Async wrapper — used by SocialProofBanner component
// Returns { plannedThisWeek: number }
// Once Supabase traveler_profiles is live, replace with a real count query.
// ---------------------------------------------------------------------------

export interface DestinationStats {
  plannedThisWeek: number;
  plannedThisMonth: number;
}

/**
 * Async interface for components that expect a Promise.
 * Currently returns seeded data; replace body with Supabase RPC when ready.
 */
export async function getDestinationStats(destination: string): Promise<DestinationStats> {
  const monthly = getDestinationCount(destination, new Date().getMonth() + 1);
  const weekly = Math.round(monthly * 0.27);
  return { plannedThisWeek: weekly, plannedThisMonth: monthly };
}
