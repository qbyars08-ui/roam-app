// =============================================================================
// ROAM — Trip DNA Matching
// Extract a "DNA fingerprint" from any trip and find similar public trips.
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { Itinerary } from './types/itinerary';
import type { Trip } from './store';
import { BUDGETS } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TripPace = 'relaxed' | 'moderate' | 'packed';
export type TripStyle = 'culture' | 'food' | 'adventure' | 'nightlife' | 'nature' | 'shopping';
export type GroupType = 'solo' | 'couple' | 'group';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface TripDNA {
  destination: string;
  budget_tier: string;
  pace: TripPace;
  style: TripStyle[];
  duration: number;
  solo_vs_group: GroupType;
  season: Season;
}

export interface TripMatch {
  tripId: string;
  destination: string;
  similarity: number;
  duration: number;
  budgetTier: string;
  styleTags: TripStyle[];
  creatorName: string;
  createdAt: string;
  itinerary: string | null;
}

// ---------------------------------------------------------------------------
// DNA Extraction
// ---------------------------------------------------------------------------

/**
 * Determine the season from a date string.
 */
function seasonFromDate(dateStr: string): Season {
  const month = new Date(dateStr).getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Infer trip pace from the number of activities per day in the itinerary.
 */
function inferPace(itinerary: Itinerary | null): TripPace {
  if (!itinerary || itinerary.days.length === 0) return 'moderate';

  // Count activities with real content (not just placeholders)
  let totalActivities = 0;
  for (const day of itinerary.days) {
    const slots = [day.morning, day.afternoon, day.evening];
    for (const slot of slots) {
      if (slot.activity && slot.activity.length > 5) {
        totalActivities += 1;
      }
    }
  }

  const avgPerDay = totalActivities / itinerary.days.length;
  if (avgPerDay <= 2) return 'relaxed';
  if (avgPerDay >= 2.8) return 'packed';
  return 'moderate';
}

/**
 * Infer style tags from itinerary activities and vibes.
 */
function inferStyles(vibes: string[], itinerary: Itinerary | null): TripStyle[] {
  const styles = new Set<TripStyle>();
  const lower = vibes.map((v) => v.toLowerCase()).join(' ');

  const activityText = itinerary
    ? itinerary.days.map((d) =>
        [d.morning.activity, d.afternoon.activity, d.evening.activity, d.theme].join(' ')
      ).join(' ').toLowerCase()
    : '';

  const combined = `${lower} ${activityText}`;

  if (/museum|temple|history|heritage|architecture|gallery/.test(combined)) styles.add('culture');
  if (/food|eat|restaurant|market|street food|cuisine|ramen|taco/.test(combined)) styles.add('food');
  if (/hike|trek|surf|dive|adventure|adrenaline|climb|kayak/.test(combined)) styles.add('adventure');
  if (/bar|club|night|cocktail|rooftop|pub/.test(combined)) styles.add('nightlife');
  if (/nature|park|beach|mountain|forest|waterfall|lake/.test(combined)) styles.add('nature');
  if (/shop|boutique|market|souvenir|mall/.test(combined)) styles.add('shopping');

  // Default to culture + food if nothing matched
  if (styles.size === 0) {
    styles.add('culture');
    styles.add('food');
  }

  return Array.from(styles);
}

/**
 * Map budget string to a normalized tier ID.
 */
function normalizeBudget(budget: string): string {
  const lower = budget.toLowerCase();
  for (const tier of BUDGETS) {
    if (lower.includes(tier.id) || lower.includes(tier.label.toLowerCase())) {
      return tier.id;
    }
  }
  // Fallback: guess from daily cost if numeric
  const match = budget.match(/\d+/);
  if (match) {
    const val = parseInt(match[0], 10);
    if (val <= 75) return 'backpacker';
    if (val <= 200) return 'comfort';
    if (val <= 500) return 'treat-yourself';
    return 'no-budget';
  }
  return 'comfort';
}

/**
 * Extract TripDNA from a trip and its parsed itinerary.
 */
export function calculateTripDNA(trip: Trip, itinerary: Itinerary | null): TripDNA {
  return {
    destination: trip.destination,
    budget_tier: normalizeBudget(trip.budget),
    pace: inferPace(itinerary),
    style: inferStyles(trip.vibes, itinerary),
    duration: trip.days,
    solo_vs_group: trip.vibes.some((v) => /solo/i.test(v))
      ? 'solo'
      : trip.vibes.some((v) => /couple|date|romantic/i.test(v))
        ? 'couple'
        : 'group',
    season: seasonFromDate(trip.startDate ?? trip.createdAt),
  };
}

// ---------------------------------------------------------------------------
// Matching Algorithm
// ---------------------------------------------------------------------------

/** Weight distribution for similarity scoring */
const WEIGHTS = {
  budget: 0.30,
  style: 0.25,
  pace: 0.20,
  duration: 0.15,
  season: 0.10,
} as const;

/**
 * Score similarity between two TripDNA objects (0-100).
 */
function scoreSimilarity(a: TripDNA, b: TripDNA): number {
  // Budget: exact match = 1, adjacent tier = 0.5, else 0
  const tiers = ['backpacker', 'comfort', 'treat-yourself', 'no-budget'];
  const aIdx = tiers.indexOf(a.budget_tier);
  const bIdx = tiers.indexOf(b.budget_tier);
  const budgetDiff = Math.abs(aIdx - bIdx);
  const budgetScore = budgetDiff === 0 ? 1 : budgetDiff === 1 ? 0.5 : 0;

  // Style: Jaccard similarity
  const aSet = new Set(a.style);
  const bSet = new Set(b.style);
  const intersection = a.style.filter((s) => bSet.has(s)).length;
  const union = new Set([...aSet, ...bSet]).size;
  const styleScore = union > 0 ? intersection / union : 0;

  // Pace: exact = 1, adjacent = 0.5, else 0
  const paces: TripPace[] = ['relaxed', 'moderate', 'packed'];
  const paceDiff = Math.abs(paces.indexOf(a.pace) - paces.indexOf(b.pace));
  const paceScore = paceDiff === 0 ? 1 : paceDiff === 1 ? 0.5 : 0;

  // Duration: within 2 days = 1, within 4 = 0.5, else 0
  const daysDiff = Math.abs(a.duration - b.duration);
  const durationScore = daysDiff <= 2 ? 1 : daysDiff <= 4 ? 0.5 : 0;

  // Season: exact = 1, adjacent = 0.5, else 0
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'];
  const seasonDiff = Math.abs(seasons.indexOf(a.season) - seasons.indexOf(b.season));
  const seasonScore = seasonDiff === 0 ? 1 : seasonDiff === 1 || seasonDiff === 3 ? 0.5 : 0;

  const raw =
    WEIGHTS.budget * budgetScore +
    WEIGHTS.style * styleScore +
    WEIGHTS.pace * paceScore +
    WEIGHTS.duration * durationScore +
    WEIGHTS.season * seasonScore;

  return Math.round(raw * 100);
}

// ---------------------------------------------------------------------------
// Supabase Query
// ---------------------------------------------------------------------------

/**
 * Find public trips matching the given DNA, sorted by similarity.
 * Returns top 5 matches with similarity >= 30%.
 */
export async function findSimilarTrips(
  myDNA: TripDNA,
  excludeTripId?: string
): Promise<TripMatch[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('id, destination, days, budget, vibes, trip_dna, itinerary, created_at, user_id')
    .eq('is_public', true)
    .eq('destination', myDNA.destination)
    .limit(50);

  if (error || !data) return [];

  type TripRow = {
    id: string;
    destination: string;
    days: number;
    budget: string;
    vibes: string[];
    trip_dna: TripDNA | null;
    itinerary: string | null;
    created_at: string;
    user_id: string;
  };

  const matches: TripMatch[] = (data as TripRow[])
    .filter((row) => row.id !== excludeTripId && row.trip_dna !== null)
    .map((row) => {
      const otherDNA = row.trip_dna as TripDNA;
      const similarity = scoreSimilarity(myDNA, otherDNA);
      return {
        tripId: row.id,
        destination: row.destination,
        similarity,
        duration: row.days,
        budgetTier: otherDNA.budget_tier,
        styleTags: otherDNA.style,
        creatorName: 'Traveler',
        createdAt: row.created_at,
        itinerary: row.itinerary,
      };
    })
    .filter((m) => m.similarity >= 30)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  return matches;
}

// ---------------------------------------------------------------------------
// React Hook
// ---------------------------------------------------------------------------

interface UseSimilarTripsResult {
  matches: TripMatch[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that finds similar public trips for a given trip.
 */
export function useSimilarTrips(
  trip: Trip | null,
  itinerary: Itinerary | null
): UseSimilarTripsResult {
  const [matches, setMatches] = useState<TripMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!trip) {
      setMatches([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const dna = calculateTripDNA(trip, itinerary);

    findSimilarTrips(dna, trip.id)
      .then((results) => {
        if (!cancelled) {
          setMatches(results);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to find matches');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [trip, itinerary, fetchKey]);

  return { matches, isLoading, error, refetch };
}
