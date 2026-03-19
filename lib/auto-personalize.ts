// =============================================================================
// ROAM — Auto-Personalize: silently learns and adapts the app per user
// No configuration needed — infers from trips, CRAFT answers, and behavior.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore, type Trip } from './store';
import type { CraftPreferences } from './craft-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BudgetTier = 'budget' | 'mid' | 'luxury';
export type TravelStyle = 'backpacker' | 'culture' | 'foodie' | 'adventure' | 'luxury' | 'solo';
export type Pace = 'fast' | 'moderate' | 'relaxed';
export type AccommodationType = 'hostel' | 'hotel' | 'airbnb' | 'luxury';
export type FlightClass = 'economy' | 'business' | 'first';

export type PersonalizationProfile = {
  budgetTier: BudgetTier;
  travelStyle: TravelStyle;
  pace: Pace;
  accommodationType: AccommodationType;
  dietaryFlag?: string;
  flightClass: FlightClass;
};

export type AnalyticsEvent = {
  readonly screen: string;
  readonly count: number;
};

export type ContentSection = {
  readonly id: string;
  readonly label: string;
  readonly priority: number;
};

export type PersonalizedDefaults = {
  readonly budgetRange: string;
  readonly accommodationType: string;
  readonly activityMix: readonly string[];
  readonly flightClass: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@roam/personalization_profile';

const DEFAULT_PROFILE: PersonalizationProfile = {
  budgetTier: 'mid',
  travelStyle: 'culture',
  pace: 'moderate',
  accommodationType: 'hotel',
  flightClass: 'economy',
};

// SE Asia destinations for backpacker detection
const SE_ASIA_DESTINATIONS = new Set([
  'bangkok', 'chiang mai', 'bali', 'hoi an', 'siem reap',
  'hanoi', 'ho chi minh', 'phnom penh', 'luang prabang',
  'kuala lumpur', 'penang', 'vientiane', 'yangon',
]);

// European capitals for culture detection
const EUROPE_CAPITALS = new Set([
  'paris', 'london', 'rome', 'barcelona', 'amsterdam',
  'lisbon', 'budapest', 'prague', 'vienna', 'berlin',
  'madrid', 'athens', 'copenhagen', 'stockholm',
]);

// ---------------------------------------------------------------------------
// inferFromTrips — analyze generated trips to build partial profile
// ---------------------------------------------------------------------------

export function inferFromTrips(trips: readonly Trip[]): Partial<PersonalizationProfile> {
  if (trips.length === 0) return {};

  const result: Partial<PersonalizationProfile> = {};

  // Budget tier from trip budget strings
  const budgetValues = trips.map((t) => {
    const b = t.budget?.toLowerCase() ?? '';
    if (b.includes('backpacker') || b.includes('budget')) return 50;
    if (b.includes('comfort') || b.includes('mid')) return 150;
    if (b.includes('treat') || b.includes('luxury') || b.includes('no-budget') || b.includes('no limit')) return 400;
    return 150;
  });
  const avgBudget = budgetValues.reduce((a, b) => a + b, 0) / budgetValues.length;
  if (avgBudget < 100) result.budgetTier = 'budget';
  else if (avgBudget <= 300) result.budgetTier = 'mid';
  else result.budgetTier = 'luxury';

  // Destination pattern detection
  const destinations = trips.map((t) => t.destination.toLowerCase());
  const seAsiaCount = destinations.filter((d) =>
    [...SE_ASIA_DESTINATIONS].some((se) => d.includes(se)),
  ).length;
  const europeCount = destinations.filter((d) =>
    [...EUROPE_CAPITALS].some((ec) => d.includes(ec)),
  ).length;

  if (seAsiaCount >= trips.length * 0.6) {
    result.travelStyle = 'backpacker';
  } else if (europeCount >= trips.length * 0.6) {
    result.travelStyle = 'culture';
  }

  // Vibe pattern detection
  const vibeMap: Record<string, TravelStyle> = {
    'local-eats': 'foodie', 'market-hopper': 'foodie',
    adrenaline: 'adventure', 'nature-escape': 'adventure',
    'hidden-gems': 'culture', 'deep-history': 'culture', 'art-design': 'culture',
    'solo-friendly': 'solo',
  };
  const styleCounts: Record<string, number> = {};
  for (const trip of trips) {
    for (const vibe of trip.vibes) {
      const style = vibeMap[vibe];
      if (style) styleCounts[style] = (styleCounts[style] ?? 0) + 1;
    }
  }
  const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0];
  if (topStyle && !result.travelStyle) {
    result.travelStyle = topStyle[0] as TravelStyle;
  }

  // Accommodation from budget tier
  if (result.budgetTier === 'budget') result.accommodationType = 'hostel';
  else if (result.budgetTier === 'luxury') result.accommodationType = 'luxury';

  return result;
}

// ---------------------------------------------------------------------------
// inferFromCraft — extract from CRAFT session answers
// ---------------------------------------------------------------------------

export function inferFromCraft(craftPrefs: CraftPreferences): Partial<PersonalizationProfile> {
  const result: Partial<PersonalizationProfile> = {};

  // Budget
  if (craftPrefs.budget) {
    const b = craftPrefs.budget.toLowerCase();
    if (b.includes('backpacker') || b.includes('budget')) result.budgetTier = 'budget';
    else if (b.includes('treat') || b.includes('no-budget') || b.includes('no limit')) result.budgetTier = 'luxury';
    else result.budgetTier = 'mid';
  }

  // Accommodation
  if (craftPrefs.accommodation) {
    const a = craftPrefs.accommodation.toLowerCase();
    if (a.includes('hostel')) result.accommodationType = 'hostel';
    else if (a.includes('airbnb') || a.includes('apartment') || a.includes('rental')) result.accommodationType = 'airbnb';
    else if (a.includes('resort') || a.includes('luxury') || a.includes('boutique')) result.accommodationType = 'luxury';
    else result.accommodationType = 'hotel';
  }

  // Flight class
  if (craftPrefs.flying) {
    const f = craftPrefs.flying.toLowerCase();
    if (f.includes('business')) result.flightClass = 'business';
    else if (f.includes('first')) result.flightClass = 'first';
    else result.flightClass = 'economy';
  }

  // Travel style from whatMatters
  if (craftPrefs.whatMatters) {
    const m = craftPrefs.whatMatters.toLowerCase();
    if (m.includes('food') || m.includes('eat') || m.includes('cuisine')) result.travelStyle = 'foodie';
    else if (m.includes('adventure') || m.includes('thrill') || m.includes('hike')) result.travelStyle = 'adventure';
    else if (m.includes('culture') || m.includes('museum') || m.includes('history')) result.travelStyle = 'culture';
    else if (m.includes('relax') || m.includes('spa') || m.includes('luxury')) result.travelStyle = 'luxury';
  }

  // Solo detection from travel party
  if (craftPrefs.travelParty) {
    const p = craftPrefs.travelParty.toLowerCase();
    if (p.includes('solo') || p.includes('alone') || p.includes('myself')) {
      result.travelStyle = result.travelStyle ?? 'solo';
    }
  }

  // Dietary
  if (craftPrefs.dietaryHealth) {
    const d = craftPrefs.dietaryHealth.toLowerCase();
    if (!d.includes('none') && !d.includes('no restriction') && d.length > 2) {
      result.dietaryFlag = craftPrefs.dietaryHealth;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// inferFromBehavior — what screens they visit most
// ---------------------------------------------------------------------------

export function inferFromBehavior(events: readonly AnalyticsEvent[]): Partial<PersonalizationProfile> {
  if (events.length === 0) return {};

  const screenCounts = new Map<string, number>();
  for (const event of events) {
    screenCounts.set(event.screen, (screenCounts.get(event.screen) ?? 0) + event.count);
  }

  const result: Partial<PersonalizationProfile> = {};
  const topScreen = [...screenCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (topScreen) {
    const screenStyleMap: Record<string, TravelStyle> = {
      food: 'foodie',
      flights: 'backpacker', // deal hunters visit flights often
      people: 'solo', // social travelers
      stays: 'culture',
    };
    const inferred = screenStyleMap[topScreen[0]];
    if (inferred) result.travelStyle = inferred;
  }

  return result;
}

// ---------------------------------------------------------------------------
// mergeProfile — highest confidence wins per field (inferred overwrites)
// ---------------------------------------------------------------------------

export function mergeProfile(
  existing: PersonalizationProfile,
  inferred: Partial<PersonalizationProfile>,
): PersonalizationProfile {
  return {
    budgetTier: inferred.budgetTier ?? existing.budgetTier,
    travelStyle: inferred.travelStyle ?? existing.travelStyle,
    pace: inferred.pace ?? existing.pace,
    accommodationType: inferred.accommodationType ?? existing.accommodationType,
    dietaryFlag: inferred.dietaryFlag ?? existing.dietaryFlag,
    flightClass: inferred.flightClass ?? existing.flightClass,
  };
}

// ---------------------------------------------------------------------------
// getPersonalizedDefaults — returns defaults for CRAFT session pre-fill
// ---------------------------------------------------------------------------

export function getPersonalizedDefaults(profile: PersonalizationProfile): PersonalizedDefaults {
  const budgetRanges: Record<BudgetTier, string> = {
    budget: 'backpacker',
    mid: 'comfort',
    luxury: 'treat-yourself',
  };

  const activityMixes: Record<TravelStyle, readonly string[]> = {
    backpacker: ['hidden-gems', 'local-eats', 'nature-escape'],
    culture: ['deep-history', 'art-design', 'hidden-gems'],
    foodie: ['local-eats', 'market-hopper', 'slow-morning'],
    adventure: ['adrenaline', 'nature-escape', 'off-grid'],
    luxury: ['wellness', 'date-night', 'photo-worthy'],
    solo: ['solo-friendly', 'hidden-gems', 'local-eats'],
  };

  const accomLabels: Record<AccommodationType, string> = {
    hostel: 'Hostels',
    hotel: 'Hotels',
    airbnb: 'Airbnb / Apartments',
    luxury: 'Luxury hotels & resorts',
  };

  return {
    budgetRange: budgetRanges[profile.budgetTier],
    accommodationType: accomLabels[profile.accommodationType],
    activityMix: activityMixes[profile.travelStyle],
    flightClass: profile.flightClass,
  };
}

// ---------------------------------------------------------------------------
// getPersonalizedContent — reorder sections based on profile
// ---------------------------------------------------------------------------

export function getPersonalizedContent(
  profile: PersonalizationProfile,
  _destination?: string,
): readonly ContentSection[] {
  const base: ContentSection[] = [
    { id: 'accommodation', label: 'Where to stay', priority: 0 },
    { id: 'food', label: 'Where to eat', priority: 0 },
    { id: 'activities', label: 'What to do', priority: 0 },
    { id: 'transport', label: 'Getting around', priority: 0 },
    { id: 'safety', label: 'Safety info', priority: 0 },
  ];

  const priorityBoosts: Record<TravelStyle, Record<string, number>> = {
    backpacker: { accommodation: 10, safety: 8, transport: 6 },
    culture: { activities: 10, food: 6, accommodation: 4 },
    foodie: { food: 10, activities: 6, accommodation: 4 },
    adventure: { activities: 10, safety: 8, transport: 6 },
    luxury: { accommodation: 10, food: 8, activities: 6 },
    solo: { safety: 10, transport: 8, food: 6 },
  };

  const boosts = priorityBoosts[profile.travelStyle] ?? {};
  const boosted = base.map((section) => ({
    ...section,
    priority: section.priority + (boosts[section.id] ?? 0),
  }));

  return [...boosted].sort((a, b) => b.priority - a.priority);
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function loadProfile(): Promise<PersonalizationProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<PersonalizationProfile>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

async function saveProfile(profile: PersonalizationProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // silent — personalization is non-critical
  }
}

// ---------------------------------------------------------------------------
// usePersonalization — React hook: loads, auto-infers, returns profile
// ---------------------------------------------------------------------------

export function usePersonalization(): {
  profile: PersonalizationProfile;
  defaults: PersonalizedDefaults;
  contentOrder: readonly ContentSection[];
  isPersonalized: boolean;
} {
  const [profile, setProfile] = useState<PersonalizationProfile>({ ...DEFAULT_PROFILE });
  const trips = useAppStore((s) => s.trips);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Load existing profile from storage
      const existing = await loadProfile();
      if (cancelled) return;

      // 2. Infer from trips
      const tripInferred = inferFromTrips(trips);

      // 3. Merge: trip inference fills gaps in existing
      const merged = mergeProfile(existing, tripInferred);

      // 4. Persist and update state
      await saveProfile(merged);
      if (!cancelled) setProfile(merged);
    })();

    return () => { cancelled = true; };
  }, [trips]);

  const defaults = getPersonalizedDefaults(profile);
  const contentOrder = getPersonalizedContent(profile);
  const isPersonalized = trips.length > 0;

  return { profile, defaults, contentOrder, isPersonalized };
}
