// =============================================================================
// ROAM — Venue Enrichment (enrich-venues + places-proxy)
// =============================================================================

import { supabase } from './supabase';
import { searchNearby, getPlaceDetails, type PlaceDetails } from './apis/google-places';
import { resolveDestinationCoords } from './air-quality';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VenueQuery {
  name: string;
  city: string;
}

export interface EnrichedVenue {
  place_id: string;
  name: string;
  photo_url: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  formatted_address: string | null;
  opening_hours: {
    open_now: boolean | null;
    weekday_text: string[];
  } | null;
  website: string | null;
  maps_url: string;
  lat: number | null;
  lng: number | null;
}

// ---------------------------------------------------------------------------
// enrich-venues (existing)
// ---------------------------------------------------------------------------

/**
 * Enrich venue data for a list of activity names + city.
 * Calls the enrich-venues edge function which handles Google Places lookups
 * and server-side caching.
 *
 * Returns an array in the same order as the input. Entries that could not
 * be matched return null.
 */
export async function enrichVenues(
  venues: VenueQuery[]
): Promise<(EnrichedVenue | null)[]> {
  if (venues.length === 0) return [];

  try {
    const { data, error } = await supabase.functions.invoke('enrich-venues', {
      body: { venues },
    });

    if (error) {
      console.warn('[venues] Enrichment failed:', error);
      return venues.map(() => null);
    }

    return (data?.venues ?? venues.map(() => null)) as (EnrichedVenue | null)[];
  } catch (err) {
    console.warn('[venues] Enrichment error:', err);
    return venues.map(() => null);
  }
}

// ---------------------------------------------------------------------------
// places-proxy enrichment (real photo + rating from Google Places)
// ---------------------------------------------------------------------------

function placeDetailsToEnrichedVenue(details: PlaceDetails, name: string): EnrichedVenue {
  const photoUrl = details.photos?.[0] ?? null;
  const lat = details.location?.lat ?? null;
  const lng = details.location?.lng ?? null;
  const mapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  return {
    place_id: details.placeId,
    name: details.name,
    photo_url: photoUrl,
    rating: details.rating ?? null,
    user_ratings_total: details.userRatingsTotal ?? null,
    formatted_address: details.address ?? null,
    opening_hours: details.hours
      ? { open_now: null, weekday_text: details.hours }
      : null,
    website: details.website ?? null,
    maps_url: mapsUrl,
    lat,
    lng,
  };
}

/** Match query name to place name (contains or equals, case-insensitive). */
function nameMatches(queryName: string, placeName: string): boolean {
  const q = queryName.toLowerCase().trim();
  const p = placeName.toLowerCase().trim();
  if (q === p) return true;
  if (p.includes(q) || q.includes(p)) return true;
  return false;
}

/**
 * Enrich venues via places-proxy (search_nearby + place_details).
 * Uses destination coords, then matches activity names to nearby places.
 * Returns array in same order as queries; null where no match.
 */
export async function enrichVenuesViaPlacesProxy(
  destination: string,
  queries: Array<VenueQuery & { key: string }>,
): Promise<Map<string, EnrichedVenue>> {
  const map = new Map<string, EnrichedVenue>();
  if (queries.length === 0) return map;

  const coords = await resolveDestinationCoords(destination);
  if (!coords) return map;

  let nearby = await searchNearby(coords.lat, coords.lng, 'restaurant', 2500);
  if (!nearby?.length) {
    const establishment = await searchNearby(coords.lat, coords.lng, 'establishment', 2500);
    if (!establishment?.length) return map;
    nearby = establishment;
  }

  for (const q of queries) {
    const match = nearby.find((p) => nameMatches(q.name, p.name));
    if (!match) continue;
    const details = await getPlaceDetails(match.placeId);
    if (!details) continue;
    const venue = placeDetailsToEnrichedVenue(details, q.name);
    map.set(q.key, venue);
  }

  return map;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract today's hours from Google Places weekday_text array.
 * weekday_text is formatted as ["Monday: 9:00 AM – 5:00 PM", ...].
 * Returns the hours string for today, or null.
 */
export function getTodayHours(weekdayText: string[] | undefined): string | null {
  if (!weekdayText || weekdayText.length === 0) return null;

  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const today = dayNames[new Date().getDay()];

  const todayEntry = weekdayText.find((entry) => entry.startsWith(today));
  if (!todayEntry) return null;

  // Extract just the hours: "Monday: 9:00 AM – 5:00 PM" → "9:00 AM – 5:00 PM"
  const colonIdx = todayEntry.indexOf(':');
  if (colonIdx < 0) return null;
  return todayEntry.slice(colonIdx + 1).trim();
}
