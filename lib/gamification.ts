// =============================================================================
// ROAM — Gamification Engine
// Ranks, achievements, activity score, profile sync
// =============================================================================

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoamRank = 'explorer' | 'wanderer' | 'nomad' | 'legend';

export interface ActivityStats {
  countries: number;
  miles: number;
  trips: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockCondition: Record<string, number | string>;
}

export interface ProfileGamificationStats {
  countries_visited: number;
  miles_traveled: number;
  trips_planned_lifetime: number;
}

// ---------------------------------------------------------------------------
// Rank thresholds (activity score)
// ---------------------------------------------------------------------------

const RANK_THRESHOLDS: Record<RoamRank, number> = {
  explorer: 0,
  wanderer: 50,
  nomad: 200,
  legend: 500,
};

const RANK_ORDER: RoamRank[] = ['explorer', 'wanderer', 'nomad', 'legend'];

/**
 * Maps activity score to Roam rank.
 */
export function getRoamRank(activityScore: number): RoamRank {
  const rank: RoamRank = 'explorer';
  for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
    const r = RANK_ORDER[i];
    if (activityScore >= RANK_THRESHOLDS[r]) {
      return r;
    }
  }
  return rank;
}

/**
 * Computes activity score from stats.
 * Formula: countries * 10 + miles/1000 + trips * 5
 */
export function computeActivityScore(stats: ActivityStats): number {
  const { countries, miles, trips } = stats;
  return Math.floor(countries * 10 + miles / 1000 + trips * 5);
}

// ---------------------------------------------------------------------------
// Achievement definitions (20 total)
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    id: 'first-trip',
    name: 'First Trip',
    description: 'Plan your first trip in ROAM',
    icon: 'compass',
    unlockCondition: { trips: 1 },
  },
  {
    id: 'five-trips',
    name: 'Trip Planner',
    description: 'Plan 5 trips',
    icon: 'map',
    unlockCondition: { trips: 5 },
  },
  {
    id: 'ten-trips',
    name: 'Frequent Planner',
    description: 'Plan 10 trips',
    icon: 'star',
    unlockCondition: { trips: 10 },
  },
  {
    id: 'fifty-trips',
    name: 'Road Warrior',
    description: 'Plan 50 trips',
    icon: 'badge',
    unlockCondition: { trips: 50 },
  },
  {
    id: 'first-country',
    name: 'First Stop',
    description: 'Visit your first country',
    icon: 'flag',
    unlockCondition: { countries: 1 },
  },
  {
    id: 'five-countries',
    name: 'Continental',
    description: 'Visit 5 countries',
    icon: 'globe',
    unlockCondition: { countries: 5 },
  },
  {
    id: 'ten-countries',
    name: 'World Traveler',
    description: 'Visit 10 countries',
    icon: 'earth',
    unlockCondition: { countries: 10 },
  },
  {
    id: 'twenty-countries',
    name: 'Jet Setter',
    description: 'Visit 20 countries',
    icon: 'airplane',
    unlockCondition: { countries: 20 },
  },
  {
    id: 'fifty-countries',
    name: 'Globetrotter',
    description: 'Visit 50 countries',
    icon: 'trophy',
    unlockCondition: { countries: 50 },
  },
  {
    id: 'thousand-miles',
    name: '1K Miles',
    description: 'Travel 1,000 miles',
    icon: 'road',
    unlockCondition: { miles: 1000 },
  },
  {
    id: 'ten-thousand-miles',
    name: '10K Miles',
    description: 'Travel 10,000 miles',
    icon: 'route',
    unlockCondition: { miles: 10000 },
  },
  {
    id: 'fifty-thousand-miles',
    name: 'Sky King',
    description: 'Travel 50,000 miles',
    icon: 'cloud',
    unlockCondition: { miles: 50000 },
  },
  {
    id: 'hundred-thousand-miles',
    name: 'Centurion',
    description: 'Travel 100,000 miles',
    icon: 'crown',
    unlockCondition: { miles: 100000 },
  },
  {
    id: 'early-adopter',
    name: 'Early Bird',
    description: 'Plan a trip within 7 days of signup',
    icon: 'sunrise',
    unlockCondition: { days_since_signup: 7, trips: 1 },
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Plan 3 weekend trips',
    icon: 'calendar',
    unlockCondition: { weekend_trips: 3 },
  },
  {
    id: 'continent-hopper',
    name: 'Continent Hopper',
    description: 'Visit 3 different continents',
    icon: 'compass-globe',
    unlockCondition: { continents: 3 },
  },
  {
    id: 'foodie',
    name: 'Foodie',
    description: 'Plan 5 food-focused trips',
    icon: 'fork',
    unlockCondition: { food_trips: 5 },
  },
  {
    id: 'budget-master',
    name: 'Budget Master',
    description: 'Plan 10 budget trips under $50/day',
    icon: 'wallet',
    unlockCondition: { budget_trips: 10 },
  },
  {
    id: 'streak-week',
    name: 'On a Roll',
    description: 'Plan a trip 5 days in a row',
    icon: 'fire',
    unlockCondition: { plan_streak: 5 },
  },
  {
    id: 'legend-status',
    name: 'Legend',
    description: 'Reach Legend rank',
    icon: 'medal',
    unlockCondition: { rank: 'legend' },
  },
];

/**
 * Checks if an achievement is unlocked given current stats and rank.
 */
export function isAchievementUnlocked(
  def: AchievementDef,
  stats: ActivityStats,
  rank: RoamRank,
  extra?: { daysSinceSignup?: number; weekendTrips?: number; continents?: number; foodTrips?: number; budgetTrips?: number; planStreak?: number }
): boolean {
  const cond = def.unlockCondition;
  if (cond.trips !== undefined && stats.trips < (cond.trips as number)) return false;
  if (cond.countries !== undefined && stats.countries < (cond.countries as number)) return false;
  if (cond.miles !== undefined && stats.miles < (cond.miles as number)) return false;
  if (cond.rank !== undefined && rank !== cond.rank) return false;
  if (cond.days_since_signup !== undefined && (extra?.daysSinceSignup ?? 999) > (cond.days_since_signup as number)) return false;
  if (cond.weekend_trips !== undefined && (extra?.weekendTrips ?? 0) < (cond.weekend_trips as number)) return false;
  if (cond.continents !== undefined && (extra?.continents ?? 0) < (cond.continents as number)) return false;
  if (cond.food_trips !== undefined && (extra?.foodTrips ?? 0) < (cond.food_trips as number)) return false;
  if (cond.budget_trips !== undefined && (extra?.budgetTrips ?? 0) < (cond.budget_trips as number)) return false;
  if (cond.plan_streak !== undefined && (extra?.planStreak ?? 0) < (cond.plan_streak as number)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Profile sync
// ---------------------------------------------------------------------------

/**
 * Syncs profile gamification stats and updates roamer_ranks.
 * Call after trips/countries/miles change.
 */
export async function syncProfileStats(
  userId: string,
  stats: ActivityStats
): Promise<{ ok: boolean; rank?: RoamRank }> {
  const score = computeActivityScore(stats);
  const rank = getRoamRank(score);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      countries_visited: stats.countries,
      miles_traveled: stats.miles,
      trips_planned_lifetime: stats.trips,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) return { ok: false };

  const { error: rankError } = await supabase.from('roamer_ranks').upsert(
    { user_id: userId, rank, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );

  if (rankError) return { ok: true, rank };

  return { ok: true, rank };
}
