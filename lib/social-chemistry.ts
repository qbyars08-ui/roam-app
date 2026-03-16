// =============================================================================
// ROAM — Chemistry / Compatibility Scoring
// Scores traveler compatibility for the dating/social layer.
// =============================================================================
import { supabase } from './supabase';
import { useAppStore } from './store';
import type { SocialProfile, TravelStyle, AgeRange, VibeTag, TripPresence } from './types/social';
import type { TravelProfile } from './types/travel-profile';

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface ChemistryBreakdown {
  vibeOverlap: number;  // 0-100
  styleMatch: number;   // 0-100
  dateOverlap: number;  // 0-100
  ageProximity: number; // 0-100
}

export interface ChemistryResult {
  score: number; // 0-100, weighted composite
  breakdown: ChemistryBreakdown;
}

export interface ChemistryCandidate {
  profile: SocialProfile;
  tripPresence: TripPresence;
  chemistry: ChemistryResult;
  overlapDays: number;
  sharedVibes: VibeTag[];
}

// ---------------------------------------------------------------------------
// Weights (must sum to 1.0)
// ---------------------------------------------------------------------------
const WEIGHTS = {
  vibeOverlap: 0.40,
  styleMatch:  0.25,
  dateOverlap: 0.20,
  ageProximity: 0.15,
} as const;

// ---------------------------------------------------------------------------
// Travel style compatibility matrix (0-100)
// ---------------------------------------------------------------------------
const STYLE_COMPAT: Partial<Record<TravelStyle, Partial<Record<TravelStyle, number>>>> = {
  backpacker:     { adventure: 90, 'slow-travel': 55, comfort: 30, luxury: 15, 'digital-nomad': 60 },
  adventure:      { backpacker: 90, 'slow-travel': 50, comfort: 55, luxury: 20, 'digital-nomad': 60 },
  comfort:        { 'slow-travel': 85, adventure: 55, backpacker: 30, luxury: 65, 'digital-nomad': 60 },
  'slow-travel':  { comfort: 85, 'digital-nomad': 85, backpacker: 55, adventure: 50, luxury: 55 },
  'digital-nomad':{ 'slow-travel': 85, comfort: 60, backpacker: 60, adventure: 60, luxury: 50 },
  luxury:         { comfort: 65, 'slow-travel': 55, 'digital-nomad': 50, backpacker: 15, adventure: 20 },
};

// ---------------------------------------------------------------------------
// Age range ordering — used to measure adjacency distance
// ---------------------------------------------------------------------------
const AGE_RANGE_ORDER: AgeRange[] = ['18-24', '25-30', '31-40', '41-50', '50+'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUserId(): string {
  const session = useAppStore.getState().session;
  if (!session?.user?.id) {
    throw new Error('Not authenticated — sign in to use social features');
  }
  return session.user.id;
}

function scoreVibeOverlap(myVibes: VibeTag[], theirVibes: VibeTag[]): number {
  if (myVibes.length === 0 || theirVibes.length === 0) return 0;
  const theirSet = new Set<VibeTag>(theirVibes);
  const shared = myVibes.filter((v) => theirSet.has(v));
  // Jaccard-style: shared / union
  const union = new Set<VibeTag>([...myVibes, ...theirVibes]);
  return Math.round((shared.length / union.size) * 100);
}

function scoreStyleMatch(myStyle: TravelStyle, theirStyle: TravelStyle): number {
  if (myStyle === theirStyle) return 100;
  return STYLE_COMPAT[myStyle]?.[theirStyle] ?? 40; // default medium compatibility
}

function scoreDateOverlap(overlapDays: number, maxExpected = 14): number {
  if (overlapDays <= 0) return 0;
  return Math.min(Math.round((overlapDays / maxExpected) * 100), 100);
}

function scoreAgeProximity(myRange: AgeRange, theirRange: AgeRange): number {
  const myIdx = AGE_RANGE_ORDER.indexOf(myRange);
  const theirIdx = AGE_RANGE_ORDER.indexOf(theirRange);
  if (myIdx === -1 || theirIdx === -1) return 50; // unknown — neutral
  const distance = Math.abs(myIdx - theirIdx);
  if (distance === 0) return 100;
  if (distance === 1) return 75;
  if (distance === 2) return 50;
  return 25; // 3+ apart
}

function computeOverlapDays(
  myArrival: string,
  myDeparture: string,
  theirArrival: string,
  theirDeparture: string,
): number {
  const overlapStart = new Date(Math.max(
    new Date(myArrival).getTime(),
    new Date(theirArrival).getTime(),
  ));
  const overlapEnd = new Date(Math.min(
    new Date(myDeparture).getTime(),
    new Date(theirDeparture).getTime(),
  ));
  const ms = overlapEnd.getTime() - overlapStart.getTime();
  return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
}

// ---------------------------------------------------------------------------
// TravelProfile → TravelStyle heuristic
// Maps the numeric budgetStyle + accommodation onto a social TravelStyle.
// ---------------------------------------------------------------------------
function inferTravelStyle(profile: TravelProfile): TravelStyle {
  const { budgetStyle, accommodation, travelFrequency } = profile;
  if (accommodation === 'hostels' || budgetStyle <= 2) return 'backpacker';
  if (accommodation === 'luxury' || budgetStyle >= 9) return 'luxury';
  if (travelFrequency === 'constantly' && profile.pace >= 4) return 'digital-nomad';
  if (profile.pace <= 3) return 'slow-travel';
  if (profile.tripPurposes.includes('nature')) return 'adventure';
  return 'comfort';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate a 0-100 chemistry score between the current user and a candidate.
 */
export function calculateChemistryScore(
  myProfile: TravelProfile,
  theirSocialProfile: SocialProfile,
  myVibes: VibeTag[],
  tripOverlapDays: number,
): ChemistryResult {
  const myStyle = inferTravelStyle(myProfile);
  const myAgeRange = useAppStore.getState().socialProfile?.ageRange ?? '25-30';

  const vibeOverlap   = scoreVibeOverlap(myVibes, theirSocialProfile.vibeTags);
  const styleMatch    = scoreStyleMatch(myStyle, theirSocialProfile.travelStyle);
  const dateOverlap   = scoreDateOverlap(tripOverlapDays);
  const ageProximity  = scoreAgeProximity(myAgeRange, theirSocialProfile.ageRange);

  const breakdown: ChemistryBreakdown = { vibeOverlap, styleMatch, dateOverlap, ageProximity };

  const score = Math.round(
    vibeOverlap   * WEIGHTS.vibeOverlap  +
    styleMatch    * WEIGHTS.styleMatch   +
    dateOverlap   * WEIGHTS.dateOverlap  +
    ageProximity  * WEIGHTS.ageProximity,
  );

  return { score, breakdown };
}

// ---------------------------------------------------------------------------
// Supabase row shapes (boundaries — eslint-disable justified)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TripPresenceRow = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocialProfileRow = any;

function rowToTripPresence(row: TripPresenceRow): TripPresence {
  return {
    id: row.id,
    userId: row.user_id,
    destination: row.destination,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    lookingFor: row.looking_for ?? [],
    status: row.status,
    createdAt: row.created_at,
  };
}

function rowToSocialProfile(row: SocialProfileRow): SocialProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    ageRange: row.age_range,
    travelStyle: row.travel_style,
    vibeTags: row.vibe_tags ?? [],
    bio: row.bio ?? '',
    avatarEmoji: row.avatar_emoji ?? '',
    languages: row.languages ?? [],
    verified: row.verified ?? false,
    privacy: row.privacy ?? {},
    createdAt: row.created_at,
  };
}

/**
 * Find traveler candidates overlapping with the current user's trip dates and
 * destination, then score + sort by chemistry descending.
 */
export async function getDateCandidates(
  destination: string,
  arrivalDate: string,
  departureDate: string,
): Promise<ChemistryCandidate[]> {
  const userId = getUserId();
  const state = useAppStore.getState();
  const myTravelProfile = state.travelProfile;
  const myVibes: VibeTag[] = state.socialProfile?.vibeTags ?? [];

  // Fetch overlapping trip_presence rows for other users at the same destination
  const { data: presenceRows, error: presenceErr } = await supabase
    .from('trip_presence')
    .select('*')
    .eq('destination', destination)
    .eq('status', 'active')
    .lte('arrival_date', departureDate)
    .gte('departure_date', arrivalDate)
    .neq('user_id', userId);

  if (presenceErr) throw new Error(`Failed to fetch trip presence: ${presenceErr.message}`);
  if (!presenceRows || presenceRows.length === 0) return [];

  // Collect user IDs from presence results
  const candidateUserIds: string[] = presenceRows.map((r: TripPresenceRow) => r.user_id as string);

  // Fetch social profiles for those users who are open to meetups
  const { data: profileRows, error: profileErr } = await supabase
    .from('social_profiles')
    .select('*')
    .in('user_id', candidateUserIds)
    .eq('open_to_meetups', true);

  if (profileErr) throw new Error(`Failed to fetch social profiles: ${profileErr.message}`);
  if (!profileRows || profileRows.length === 0) return [];

  // Index profiles by user_id for O(1) lookup
  const profileByUserId = new Map<string, SocialProfile>(
    profileRows.map((r: SocialProfileRow) => [r.user_id as string, rowToSocialProfile(r)]),
  );

  const candidates: ChemistryCandidate[] = [];

  for (const presenceRow of presenceRows) {
    const profile = profileByUserId.get(presenceRow.user_id as string);
    if (!profile) continue; // user not open to meetups — skip

    const tripPresence = rowToTripPresence(presenceRow);
    const overlapDays = computeOverlapDays(
      arrivalDate,
      departureDate,
      tripPresence.arrivalDate,
      tripPresence.departureDate,
    );

    const chemistry = calculateChemistryScore(myTravelProfile, profile, myVibes, overlapDays);

    const theirVibeSet = new Set<VibeTag>(profile.vibeTags);
    const sharedVibes = myVibes.filter((v) => theirVibeSet.has(v));

    candidates.push({ profile, tripPresence, chemistry, overlapDays, sharedVibes });
  }

  return candidates.sort((a, b) => b.chemistry.score - a.chemistry.score);
}
