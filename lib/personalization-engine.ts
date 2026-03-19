// =============================================================================
// ROAM — Personalization Engine: TravelerDNA + personalized greetings/recs
// Pure functions, never throw, return defaults when data missing
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAppStore, type Trip } from './store';
import type { CraftPreferences } from './craft-engine';
import type { TravelPreference } from './travel-preferences';

// ---------------------------------------------------------------------------
// TravelerDNA — the core profile type
// ---------------------------------------------------------------------------

export type BudgetTier = 'backpacker' | 'mid-range' | 'luxury' | 'no-limit';
export type TravelPace = 'fast' | 'moderate' | 'slow';
export type TravelStyle = 'adventure' | 'culture' | 'food' | 'relaxation' | 'nightlife' | 'nature';
export type AccommodationType = 'hostel' | 'hotel' | 'airbnb' | 'luxury' | 'boutique';
export type DietaryPref = 'omnivore' | 'vegetarian' | 'vegan' | 'halal' | 'kosher';
export type FlightClass = 'economy' | 'premium economy' | 'business' | 'first';
export type CompanionType = 'solo' | 'couple' | 'family' | 'friends' | 'group';
export type MorningType = 'early_bird' | 'night_owl' | 'regular';

export type TravelerDNA = {
  readonly budget_tier: BudgetTier;
  readonly pace: TravelPace;
  readonly styles: readonly TravelStyle[];
  readonly accommodation: AccommodationType;
  readonly dietary: DietaryPref;
  readonly flight_class: FlightClass;
  readonly companions: CompanionType;
  readonly morning_type: MorningType;
  readonly confidence: number; // 0-1: how much data we have
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_DNA: TravelerDNA = {
  budget_tier: 'mid-range',
  pace: 'moderate',
  styles: [],
  accommodation: 'hotel',
  dietary: 'omnivore',
  flight_class: 'economy',
  companions: 'solo',
  morning_type: 'regular',
  confidence: 0,
};

// ---------------------------------------------------------------------------
// inferDNAFromTrips — analyzes past trip data to build profile
// ---------------------------------------------------------------------------

export function inferDNAFromTrips(trips: readonly Trip[]): TravelerDNA {
  if (trips.length === 0) return DEFAULT_DNA;

  const budgetCounts: Record<string, number> = {};
  const vibeCounts: Record<string, number> = {};

  for (const trip of trips) {
    const b = trip.budget?.toLowerCase() ?? '';
    budgetCounts[b] = (budgetCounts[b] ?? 0) + 1;
    for (const v of trip.vibes) {
      vibeCounts[v] = (vibeCounts[v] ?? 0) + 1;
    }
  }

  const topBudget = Object.entries(budgetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const budgetMap: Record<string, BudgetTier> = {
    backpacker: 'backpacker', 'budget-friendly': 'backpacker', budget: 'backpacker',
    comfort: 'mid-range', comfortable: 'mid-range', 'mid-range': 'mid-range',
    'treat-yourself': 'luxury', luxury: 'luxury',
    'no-budget': 'no-limit', 'no limits': 'no-limit', 'no-limit': 'no-limit',
  };

  const vibeToStyle: Record<string, TravelStyle> = {
    'local-eats': 'food', 'market-hopper': 'food',
    'hidden-gems': 'culture', 'deep-history': 'culture', 'art-design': 'culture',
    adrenaline: 'adventure', 'nature-escape': 'nature',
    'night-owl': 'nightlife',
    wellness: 'relaxation', 'slow-morning': 'relaxation', 'beach-vibes': 'relaxation',
  };

  const styleCounts: Record<string, number> = {};
  for (const [vibe, count] of Object.entries(vibeCounts)) {
    const style = vibeToStyle[vibe];
    if (style) styleCounts[style] = (styleCounts[style] ?? 0) + count;
  }
  const topStyles = Object.entries(styleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s as TravelStyle);

  const confidence = Math.min(1, trips.length / 5);

  return {
    ...DEFAULT_DNA,
    budget_tier: budgetMap[topBudget] ?? 'mid-range',
    styles: topStyles.length > 0 ? topStyles : DEFAULT_DNA.styles,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// inferDNAFromCraft — extracts DNA from CRAFT session answers
// ---------------------------------------------------------------------------

export function inferDNAFromCraft(prefs: CraftPreferences): TravelerDNA {
  const result = { ...DEFAULT_DNA };

  const budgetMap: Record<string, BudgetTier> = {
    backpacker: 'backpacker', 'budget-friendly': 'backpacker',
    comfort: 'mid-range', comfortable: 'mid-range',
    'treat-yourself': 'luxury', 'no-budget': 'no-limit', 'no limits': 'no-limit',
  };
  const budget = prefs.budget?.toLowerCase() ?? '';
  const budget_tier = budgetMap[budget] ?? result.budget_tier;

  const accomMap: Record<string, AccommodationType> = {
    hostel: 'hostel', hotel: 'hotel', airbnb: 'airbnb',
    apartment: 'airbnb', resort: 'luxury', boutique: 'boutique', luxury: 'luxury',
  };
  const accomRaw = prefs.accommodation?.toLowerCase() ?? '';
  const accommodation = Object.entries(accomMap).find(([k]) => accomRaw.includes(k))?.[1] ?? result.accommodation;

  const styleMap: Record<string, TravelStyle> = {
    adventure: 'adventure', thrill: 'adventure', hike: 'adventure',
    culture: 'culture', museum: 'culture', history: 'culture',
    food: 'food', eat: 'food', cuisine: 'food',
    relax: 'relaxation', chill: 'relaxation', spa: 'relaxation',
    nightlife: 'nightlife', party: 'nightlife', bar: 'nightlife',
    nature: 'nature', outdoor: 'nature',
  };
  const matterRaw = prefs.whatMatters?.toLowerCase() ?? '';
  const styles = Object.entries(styleMap)
    .filter(([k]) => matterRaw.includes(k))
    .map(([, v]) => v)
    .filter((v, i, arr) => arr.indexOf(v) === i) as TravelStyle[];

  const flightMap: Record<string, FlightClass> = {
    business: 'business', first: 'first',
    premium: 'premium economy', comfort: 'premium economy',
    economy: 'economy', cheap: 'economy',
  };
  const flyRaw = prefs.flying?.toLowerCase() ?? '';
  const flight_class = Object.entries(flightMap).find(([k]) => flyRaw.includes(k))?.[1] ?? result.flight_class;

  const companionMap: Record<string, CompanionType> = {
    solo: 'solo', alone: 'solo', couple: 'couple', partner: 'couple',
    family: 'family', kid: 'family', children: 'family',
    friend: 'friends', group: 'group',
  };
  const partyRaw = prefs.travelParty?.toLowerCase() ?? '';
  const companions = Object.entries(companionMap).find(([k]) => partyRaw.includes(k))?.[1] ?? result.companions;

  const dietMap: Record<string, DietaryPref> = {
    vegan: 'vegan', vegetarian: 'vegetarian', halal: 'halal', kosher: 'kosher',
  };
  const dietRaw = prefs.dietaryHealth?.toLowerCase() ?? '';
  const dietary = Object.entries(dietMap).find(([k]) => dietRaw.includes(k))?.[1] ?? 'omnivore';

  return {
    budget_tier,
    pace: result.pace,
    styles: styles.length > 0 ? styles : result.styles,
    accommodation,
    dietary,
    flight_class,
    companions,
    morning_type: result.morning_type,
    confidence: 0.8,
  };
}

// ---------------------------------------------------------------------------
// inferDNAFromPreferences — from TravelPreference[]
// ---------------------------------------------------------------------------

export function inferDNAFromPreferences(prefs: readonly TravelPreference[]): TravelerDNA {
  if (prefs.length === 0) return DEFAULT_DNA;

  const get = (key: string): string | undefined =>
    prefs.find((p) => p.key === key)?.value;

  const budgetMap: Record<string, BudgetTier> = {
    budget: 'backpacker', backpacker: 'backpacker',
    'mid-range': 'mid-range', comfort: 'mid-range',
    luxury: 'luxury', 'no-limit': 'no-limit',
  };

  const styleMap: Record<string, TravelStyle> = {
    adventure: 'adventure', culture: 'culture', food: 'food',
    relaxation: 'relaxation', nightlife: 'nightlife', nature: 'nature',
  };

  const rawStyle = get('travel_style')?.toLowerCase() ?? '';
  const styles: TravelStyle[] = [];
  const matched = styleMap[rawStyle];
  if (matched) styles.push(matched);

  const paceMap: Record<string, TravelPace> = { fast: 'fast', moderate: 'moderate', slow: 'slow' };
  const morningMap: Record<string, MorningType> = {
    early_bird: 'early_bird', 'early-bird': 'early_bird',
    night_owl: 'night_owl', 'night-owl': 'night_owl',
    regular: 'regular',
  };

  const accomMap: Record<string, AccommodationType> = {
    hostel: 'hostel', hotel: 'hotel', airbnb: 'airbnb',
    resort: 'luxury', 'boutique hotel': 'boutique', luxury: 'luxury',
  };

  return {
    budget_tier: budgetMap[get('budget_tier')?.toLowerCase() ?? ''] ?? 'mid-range',
    pace: paceMap[get('pace')?.toLowerCase() ?? ''] ?? 'moderate',
    styles,
    accommodation: accomMap[get('accommodation_type')?.toLowerCase() ?? ''] ?? 'hotel',
    dietary: (get('dietary_restrictions')?.toLowerCase() as DietaryPref) ?? 'omnivore',
    flight_class: (get('flight_class')?.toLowerCase() as FlightClass) ?? 'economy',
    companions: (get('travel_companions')?.toLowerCase() as CompanionType) ?? 'solo',
    morning_type: morningMap[get('morning_type')?.toLowerCase() ?? ''] ?? 'regular',
    confidence: Math.min(1, prefs.length / 6),
  };
}

// ---------------------------------------------------------------------------
// mergeDNA — immutable merge, higher confidence wins
// ---------------------------------------------------------------------------

export function mergeDNA(existing: TravelerDNA, incoming: TravelerDNA): TravelerDNA {
  if (incoming.confidence >= existing.confidence) {
    const mergedStyles = incoming.styles.length > 0 ? incoming.styles : existing.styles;
    return { ...incoming, styles: mergedStyles, confidence: Math.max(existing.confidence, incoming.confidence) };
  }
  const mergedStyles = existing.styles.length > 0 ? existing.styles : incoming.styles;
  return { ...existing, styles: mergedStyles, confidence: Math.max(existing.confidence, incoming.confidence) };
}

// ---------------------------------------------------------------------------
// getPersonalizedGreeting — returns greeting that reflects style + time
// ---------------------------------------------------------------------------

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const GREETINGS: Record<TimeOfDay, Record<string, readonly string[]>> = {
  morning: {
    default: ['Good morning.', 'Morning.', 'Rise and plan.'],
    early_bird: ['You\'re up early. Good.', 'The best flights drop before 7 AM.'],
    food: ['Breakfast spots don\'t book themselves.', 'Coffee first, then itinerary.'],
    adventure: ['Perfect time to plan something reckless.'],
    solo: ['Just you and the open map.'],
    budget: ['Free walking tours start early.'],
  },
  afternoon: {
    default: ['What are we planning?', 'Afternoon. Let\'s go somewhere.'],
    food: ['Lunch break planning is underrated.'],
    culture: ['Museums close at 5. Let\'s be strategic.'],
    nightlife: ['Planning tonight already?'],
  },
  evening: {
    default: ['Evening. Where to next?', 'Good evening.'],
    night_owl: ['This is when the best ideas happen.', 'Late-night trip planning hits different.'],
    food: ['Dinner plans need a destination first.'],
    nightlife: ['The night is young. The trip isn\'t planned yet.'],
  },
  night: {
    default: ['Can\'t sleep? Plan a trip.', 'Late night, big plans.'],
    night_owl: ['Your time. Let\'s plan.'],
    adventure: ['3 AM trip planning. You\'re committed.'],
  },
};

export function getPersonalizedGreeting(dna: TravelerDNA, _destination?: string): string {
  const time = getTimeOfDay();
  const pool = GREETINGS[time];

  // Try to find a pool matching the traveler's primary style
  const primaryStyle = dna.styles[0];
  const morningKey = dna.morning_type === 'early_bird' ? 'early_bird' : dna.morning_type === 'night_owl' ? 'night_owl' : undefined;
  const budgetKey = dna.budget_tier === 'backpacker' ? 'budget' : undefined;
  const companionKey = dna.companions === 'solo' ? 'solo' : undefined;

  // Priority: morning_type > style > companions > budget > default
  const keys = [morningKey, primaryStyle, companionKey, budgetKey].filter(Boolean) as string[];
  for (const key of keys) {
    const options = pool[key];
    if (options && options.length > 0) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }

  const defaults = pool.default;
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ---------------------------------------------------------------------------
// getQuickActions — returns relevant quick actions based on DNA
// ---------------------------------------------------------------------------

export type QuickAction = {
  readonly id: string;
  readonly label: string;
  readonly reason: string;
};

export function getQuickActions(dna: TravelerDNA): readonly QuickAction[] {
  const actions: QuickAction[] = [];
  const primary = dna.styles[0];

  if (primary === 'food' || dna.styles.includes('food')) {
    actions.push({ id: 'food', label: 'Local eats', reason: 'Because you love food' });
  }
  if (dna.budget_tier === 'backpacker') {
    actions.push({ id: 'hostels', label: 'Find hostels', reason: 'Budget-friendly stays' });
  }
  if (primary === 'adventure' || dna.styles.includes('adventure')) {
    actions.push({ id: 'adventures', label: 'Adventures', reason: 'For the thrill-seeker in you' });
  }
  if (primary === 'culture' || dna.styles.includes('culture')) {
    actions.push({ id: 'culture', label: 'Culture & history', reason: 'Deep dives await' });
  }
  if (dna.companions === 'family') {
    actions.push({ id: 'family', label: 'Family-friendly', reason: 'Kid-approved picks' });
  }
  if (primary === 'nightlife') {
    actions.push({ id: 'nightlife', label: 'Night scene', reason: 'Where to go after dark' });
  }

  // Always add flights
  actions.push({ id: 'flights', label: 'Search flights', reason: '' });

  return actions.slice(0, 4);
}

// ---------------------------------------------------------------------------
// getPersonalizedRecommendations — filters recs by preferences
// ---------------------------------------------------------------------------

export type RecommendationLabel = {
  readonly text: string;
  readonly style: TravelStyle;
};

export function getRecommendationLabel(dna: TravelerDNA): RecommendationLabel | null {
  const primary = dna.styles[0];
  if (!primary || dna.confidence < 0.3) return null;

  const labels: Record<TravelStyle, string> = {
    food: 'Because you love food',
    adventure: 'Because you love adventure',
    culture: 'Because you love culture',
    relaxation: 'Because you love to unwind',
    nightlife: 'Because you love the night scene',
    nature: 'Because you love nature',
  };

  return { text: labels[primary] ?? '', style: primary };
}

// ---------------------------------------------------------------------------
// shouldShowFeature — decides if a feature is relevant
// ---------------------------------------------------------------------------

export function shouldShowFeature(dna: TravelerDNA, feature: string): boolean {
  const featureMap: Record<string, () => boolean> = {
    hostel_hub: () => dna.budget_tier === 'backpacker',
    luxury_picks: () => dna.budget_tier === 'luxury' || dna.budget_tier === 'no-limit',
    family_mode: () => dna.companions === 'family',
    solo_tips: () => dna.companions === 'solo',
    nightlife_guide: () => dna.styles.includes('nightlife'),
    food_tours: () => dna.styles.includes('food'),
    adventure_gear: () => dna.styles.includes('adventure'),
    early_bird_tips: () => dna.morning_type === 'early_bird',
  };

  const check = featureMap[feature];
  return check ? check() : true;
}

// ---------------------------------------------------------------------------
// dnaSummaryForPrompt — natural language for Claude system prompt
// ---------------------------------------------------------------------------

export function dnaSummaryForPrompt(dna: TravelerDNA): string | null {
  if (dna.confidence < 0.2) return null;

  const parts: string[] = [];
  parts.push(`budget: ${dna.budget_tier}`);
  if (dna.styles.length > 0) parts.push(`style: ${dna.styles.join(', ')}`);
  parts.push(`accommodation: ${dna.accommodation}`);
  if (dna.dietary !== 'omnivore') parts.push(`dietary: ${dna.dietary}`);
  parts.push(`pace: ${dna.pace}`);
  parts.push(`companions: ${dna.companions}`);
  parts.push(`morning: ${dna.morning_type}`);
  if (dna.flight_class !== 'economy') parts.push(`flights: ${dna.flight_class}`);

  return `This traveler prefers: ${parts.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// useTravelerDNA — React hook: loads from Supabase, returns DNA
// ---------------------------------------------------------------------------

export function useTravelerDNA(): {
  dna: TravelerDNA;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [dna, setDna] = useState<TravelerDNA>(DEFAULT_DNA);
  const [loading, setLoading] = useState(true);
  const userId = useAppStore((s) => s.session?.user?.id);
  const trips = useAppStore((s) => s.trips);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Try to load from Supabase profile
      let supabaseDna = DEFAULT_DNA;
      if (userId) {
        const { data: row } = await supabase
          .from('profiles')
          .select('travel_profile')
          .eq('id', userId)
          .single();

        const tp = row?.travel_profile as Record<string, unknown> | null;
        if (tp?.traveler_dna && typeof tp.traveler_dna === 'object') {
          supabaseDna = { ...DEFAULT_DNA, ...(tp.traveler_dna as Partial<TravelerDNA>) };
        }

        // Also merge from travel_preferences if present
        if (Array.isArray(tp?.travel_preferences)) {
          const prefsDna = inferDNAFromPreferences(tp.travel_preferences as TravelPreference[]);
          supabaseDna = mergeDNA(supabaseDna, prefsDna);
        }
      }

      // 2. Infer from local trips
      const tripsDna = inferDNAFromTrips(trips);

      // 3. Merge: Supabase data wins (higher confidence from explicit input)
      const merged = mergeDNA(tripsDna, supabaseDna);
      setDna(merged);
    } catch {
      // Fallback to trip inference only
      const tripsDna = inferDNAFromTrips(trips);
      setDna(tripsDna);
    } finally {
      setLoading(false);
    }
  }, [userId, trips]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dna, loading, refresh };
}

// ---------------------------------------------------------------------------
// saveDNA — persist to Supabase profiles.travel_profile.traveler_dna
// ---------------------------------------------------------------------------

export async function saveDNA(userId: string, dna: TravelerDNA): Promise<void> {
  const { data: row } = await supabase
    .from('profiles')
    .select('travel_profile')
    .eq('id', userId)
    .single();

  const existing = (row?.travel_profile as Record<string, unknown> | null) ?? {};
  const updated = { ...existing, traveler_dna: dna };

  await supabase.from('profiles').update({ travel_profile: updated }).eq('id', userId);
}
