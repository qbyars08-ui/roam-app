// =============================================================================
// ROAM — People Tab Data Layer
// Fetches real squad candidates + open groups from Supabase.
// Falls back to mock data gracefully if unauthenticated or no results.
// =============================================================================
import { supabase } from './supabase';
import { findSquadCandidates, postTripPresence } from './social';
import { getDestinationPhoto } from './photos';
import type { Trip } from './store';

// ---------------------------------------------------------------------------
// Shared display types (consumed by people.tsx)
// ---------------------------------------------------------------------------
export interface TravelerDisplay {
  id: string;
  name: string;
  age: number;
  avatar: string;
  avatarEmoji: string;
  destination: string;
  dates: string;
  vibes: string[];
  bio: string;
  countries: number;
  matchScore: number;
  presenceId: string | null;
  userId: string | null;
}

export interface GroupDisplay {
  id: string;
  destination: string;
  image: string;
  memberCount: number;
  dateRange: string;
  vibeMatch: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const AGE_MIDPOINTS: Record<string, number> = {
  '18-24': 21, '25-30': 27, '31-40': 35, '41-50': 45, '50+': 52,
};

function ageFromRange(range: string): number {
  return AGE_MIDPOINTS[range] ?? 25;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateRange(arrival: string, departure: string): string {
  return `${fmtDate(arrival)} – ${fmtDate(departure)}`;
}

function tripArrivalDate(trip: Trip): string {
  return trip.createdAt.split('T')[0];
}

function tripDepartureDate(trip: Trip): string {
  const d = new Date(trip.createdAt);
  d.setDate(d.getDate() + trip.days);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Fetch matched travelers for a given trip
// Returns empty array on any error (caller falls back to mocks)
// ---------------------------------------------------------------------------
export async function fetchMatchedTravelers(trip: Trip): Promise<TravelerDisplay[]> {
  try {
    const arrival = tripArrivalDate(trip);
    const departure = tripDepartureDate(trip);
    const candidates = await findSquadCandidates(trip.destination, arrival, departure);
    if (!candidates.length) return [];

    return candidates.slice(0, 10).map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase row boundary
      const p = c.profile as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase row boundary
      const t = c.tripPresence as any;
      const displayName: string = p.displayName ?? p.display_name ?? 'Traveler';
      const ageRange: string = p.ageRange ?? p.age_range ?? '25-30';
      const vibeTags: string[] = p.vibeTags ?? p.vibe_tags ?? [];
      const bio: string = p.bio ?? '';
      const avatarEmoji: string = p.avatarEmoji ?? p.avatar_emoji ?? '🌍';
      const userId: string = p.userId ?? p.user_id ?? '';
      const arrivalDate: string = t.arrivalDate ?? t.arrival_date ?? trip.createdAt;
      const departureDate: string = t.departureDate ?? t.departure_date ?? trip.createdAt;

      return {
        id: String(t.id ?? Math.random()),
        name: displayName,
        age: ageFromRange(ageRange),
        avatar: '',
        avatarEmoji,
        destination: String(t.destination ?? trip.destination),
        dates: formatDateRange(arrivalDate, departureDate),
        vibes: vibeTags.slice(0, 3).map((v: string) => v.replace(/-/g, ' ')),
        bio,
        countries: 0,
        matchScore: Math.round(c.compatibilityScore),
        presenceId: String(t.id ?? ''),
        userId,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fetch open group trips from public_trips table
// Returns empty array on any error (caller falls back to mocks)
// ---------------------------------------------------------------------------
export async function fetchOpenGroups(limit = 5): Promise<GroupDisplay[]> {
  try {
    const { data } = await supabase
      .from('public_trips')
      .select('id, destination, start_date, end_date, vibes, current_members')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data?.length) return [];

    return data.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase row boundary
      const r = row as any;
      const vibes: string[] = r.vibes ?? [];
      const members: unknown[] = r.current_members ?? [];
      const vibeMatch = vibes.slice(0, 2).map((v: string) =>
        v.charAt(0).toUpperCase() + v.slice(1)
      ).join(' + ') || 'Adventure';

      return {
        id: String(r.id),
        destination: String(r.destination),
        image: getDestinationPhoto(String(r.destination), 400),
        memberCount: members.length,
        dateRange: r.start_date && r.end_date
          ? `${fmtDate(r.start_date)}–${fmtDate(r.end_date)}`
          : 'Dates TBD',
        vibeMatch,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Fetch active traveler count for a destination (from trip_presence)
// Returns 0 on error — hero stats show hardcoded fallback
// ---------------------------------------------------------------------------
export async function fetchPresenceCount(destination?: string): Promise<number> {
  try {
    const q = supabase
      .from('trip_presence')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    if (destination) q.eq('destination', destination);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Auto-post trip_presence when a new trip is generated
// Fire-and-forget — called from store.ts addTrip side-effect
// ---------------------------------------------------------------------------
export async function postTripPresenceForTrip(
  trip: Trip,
  _userId: string,
): Promise<void> {
  try {
    await postTripPresence({
      destination: trip.destination,
      arrivalDate: tripArrivalDate(trip),
      departureDate: tripDepartureDate(trip),
      lookingFor: [],
    });
  } catch {
    // Silently swallow — not critical
  }
}
