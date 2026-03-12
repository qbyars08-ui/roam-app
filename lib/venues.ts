// =============================================================================
// ROAM — Venue Enrichment (via Supabase Edge Function)
// =============================================================================

import { supabase } from './supabase';

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
// Public API
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
