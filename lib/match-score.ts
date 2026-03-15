// =============================================================================
// ROAM — Travel Buddy Match Score
// Client-side match scoring between two traveler profiles.
// Runs entirely offline — no API required.
// Replace with Supabase RPC once traveler_profiles table is live.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TripIntent {
  destination: string;
  start_date: string; // ISO 8601: "2026-04-12"
  end_date: string;   // ISO 8601: "2026-04-19"
}

export interface TravelerProfile {
  vibes: string[];
  where_going: TripIntent[];
  travel_style: 'solo' | 'duo' | 'group' | 'any';
}

// ---------------------------------------------------------------------------
// Date overlap helper
// ---------------------------------------------------------------------------

function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

// ---------------------------------------------------------------------------
// Match score — 0 to 99
// ---------------------------------------------------------------------------

/**
 * Computes a match score (0–99) between two traveler profiles.
 *
 * Scoring breakdown:
 *   - Destination overlap:  40 pts max (20 per shared destination, max 2)
 *   - Date overlap:         30 pts (per destination where dates also overlap)
 *   - Vibe overlap:         20 pts max (5 per shared vibe, max 4)
 *   - Travel style match:   10 pts
 *
 * Cap at 99 — "100%" feels algorithmically fake.
 */
export function computeMatchScore(
  me: TravelerProfile,
  other: TravelerProfile
): number {
  let score = 0;

  const myDests = me.where_going.map((d) => d.destination.toLowerCase());
  const theirDests = other.where_going.map((d) => d.destination.toLowerCase());

  // Destination overlap (40 pts max — 20 per match, max 2 destinations counted)
  const sharedDests = myDests.filter((d) => theirDests.includes(d));
  score += Math.min(sharedDests.length * 20, 40);

  // Date overlap per shared destination (30 pts — only the first overlap counts)
  let dateOverlapFound = false;
  for (const myTrip of me.where_going) {
    if (dateOverlapFound) break;
    const theirTrip = other.where_going.find(
      (t) => t.destination.toLowerCase() === myTrip.destination.toLowerCase()
    );
    if (
      theirTrip &&
      datesOverlap(
        myTrip.start_date,
        myTrip.end_date,
        theirTrip.start_date,
        theirTrip.end_date
      )
    ) {
      score += 30;
      dateOverlapFound = true;
    }
  }

  // Vibe overlap (20 pts max — 5 per shared vibe, max 4 vibes counted)
  const myVibes = me.vibes.map((v) => v.toLowerCase());
  const theirVibes = other.vibes.map((v) => v.toLowerCase());
  const sharedVibes = myVibes.filter((v) => theirVibes.includes(v));
  score += Math.min(sharedVibes.length * 5, 20);

  // Travel style (10 pts)
  const compatibleStyle =
    me.travel_style === 'any' ||
    other.travel_style === 'any' ||
    me.travel_style === other.travel_style;
  if (compatibleStyle) score += 10;

  return Math.min(score, 99);
}

// ---------------------------------------------------------------------------
// Label — "94% match" or "Great match" for UI
// ---------------------------------------------------------------------------

export function matchLabel(score: number): string {
  if (score >= 90) return `${score}% match`;
  if (score >= 75) return `${score}% match`;
  if (score >= 60) return `${score}% match`;
  return `${score}% match`;
}

/**
 * Qualitative tier for accessibility label or empty-state copy.
 */
export function matchTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 55) return 'medium';
  return 'low';
}
