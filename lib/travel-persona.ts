// =============================================================================
// ROAM — AI Travel Persona Engine
// Analyzes trip history + preferences to create a unique Travel DNA profile
// =============================================================================
import { useAppStore } from './store';
import { PERSONA_COLORS } from './constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Persona Archetypes
// ---------------------------------------------------------------------------
export interface TravelPersona {
  archetype: PersonaArchetype;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  traits: PersonaTrait[];
  stats: PersonaStats;
  evolution: string; // "Evolved from Comfort Maximalist after your Bali trip"
  generatedAt: string;
}

export interface PersonaTrait {
  label: string;
  value: number; // 0-100
  emoji: string;
}

export interface PersonaStats {
  tripsGenerated: number;
  topDestinationType: string;
  avgBudgetTier: string;
  mostUsedVibe: string;
  uniqueCountries: number;
  avgTripLength: number;
  planningStyle: 'spontaneous' | 'planner' | 'balanced';
}

export type PersonaArchetype =
  | 'midnight-explorer'
  | 'dawn-chaser'
  | 'food-archaeologist'
  | 'comfort-maximalist'
  | 'chaos-tourist'
  | 'culture-collector'
  | 'budget-ninja'
  | 'adventure-junkie'
  | 'slow-traveler'
  | 'digital-nomad'
  | 'romantic-wanderer'
  | 'solo-wolf';

interface ArchetypeDefinition {
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  vibeSignals: string[];
  budgetSignal?: string;
  destinationSignals?: string[];
}

const ARCHETYPES: Record<PersonaArchetype, ArchetypeDefinition> = {
  'midnight-explorer': {
    title: 'The Midnight Explorer',
    subtitle: 'Nightlife runs through your veins',
    emoji: '',
    color: PERSONA_COLORS['midnight-explorer'],
    vibeSignals: ['nightlife', 'bars', 'rooftop', 'underground', 'late-night'],
  },
  'dawn-chaser': {
    title: 'The Dawn Chaser',
    subtitle: 'First in line. Every time.',
    emoji: '',
    color: PERSONA_COLORS['dawn-chaser'],
    vibeSignals: ['temples', 'sunrise', 'hiking', 'nature', 'early-bird', 'outdoors'],
  },
  'food-archaeologist': {
    title: 'The Food Archaeologist',
    subtitle: 'Every trip is planned around eating',
    emoji: '',
    color: PERSONA_COLORS['food-archaeologist'],
    vibeSignals: ['food', 'street-food', 'culinary', 'foodie', 'cooking', 'restaurants', 'markets'],
  },
  'comfort-maximalist': {
    title: 'The Comfort Maximalist',
    subtitle: 'Nice hotels. Easy transport. No roughing it.',
    emoji: '',
    color: PERSONA_COLORS['comfort-maximalist'],
    vibeSignals: ['luxury', 'spa', 'relaxation', 'comfort', 'boutique'],
    budgetSignal: 'treat-yourself',
  },
  'chaos-tourist': {
    title: 'The Chaos Tourist',
    subtitle: 'No plan. Spontaneous. Loves getting lost.',
    emoji: '',
    color: PERSONA_COLORS['chaos-tourist'],
    vibeSignals: ['spontaneous', 'adventure', 'random', 'surprise', 'offbeat'],
  },
  'culture-collector': {
    title: 'The Culture Collector',
    subtitle: 'Museums, ruins, history — your happy place',
    emoji: '',
    color: PERSONA_COLORS['culture-collector'],
    vibeSignals: ['culture', 'history', 'museums', 'art', 'architecture', 'heritage'],
  },
  'budget-ninja': {
    title: 'The Budget Ninja',
    subtitle: 'Seeing the world without breaking the bank',
    emoji: '',
    color: PERSONA_COLORS['budget-ninja'],
    vibeSignals: ['budget', 'cheap', 'backpacker', 'hostel', 'free'],
    budgetSignal: 'backpacker',
  },
  'adventure-junkie': {
    title: 'The Adventure Junkie',
    subtitle: 'If it has an adrenaline rush, you are there',
    emoji: '',
    color: PERSONA_COLORS['adventure-junkie'],
    vibeSignals: ['adventure', 'extreme', 'hiking', 'diving', 'surfing', 'trekking', 'climbing'],
  },
  'slow-traveler': {
    title: 'The Slow Traveler',
    subtitle: 'One city. Two weeks. Actually living there.',
    emoji: '',
    color: PERSONA_COLORS['slow-traveler'],
    vibeSignals: ['slow', 'local', 'immersive', 'long-stay', 'digital-nomad'],
  },
  'digital-nomad': {
    title: 'The Digital Nomad',
    subtitle: 'WiFi first. Everything else second.',
    emoji: '',
    color: PERSONA_COLORS['digital-nomad'],
    vibeSignals: ['remote', 'coworking', 'wifi', 'digital-nomad', 'laptop'],
  },
  'romantic-wanderer': {
    title: 'The Romantic Wanderer',
    subtitle: 'Sunsets, rooftops, and candlelit dinners',
    emoji: '',
    color: PERSONA_COLORS['romantic-wanderer'],
    vibeSignals: ['romantic', 'couples', 'sunset', 'wine', 'honeymoon', 'date'],
  },
  'solo-wolf': {
    title: 'The Solo Wolf',
    subtitle: 'Your own pace. Your own path.',
    emoji: '',
    color: PERSONA_COLORS['solo-wolf'],
    vibeSignals: ['solo', 'independent', 'alone', 'self-discovery'],
  },
};

// ---------------------------------------------------------------------------
// Persona Engine
// ---------------------------------------------------------------------------
const PERSONA_STORAGE_KEY = 'roam_travel_persona';

export function analyzePersona(): TravelPersona {
  const { trips, travelProfile } = useAppStore.getState();

  // Gather signals from all trips
  const allVibes = trips.flatMap((t) => t.vibes.map((v) => v.toLowerCase()));
  const allBudgets = trips.map((t) => t.budget?.toLowerCase() ?? '');
  const allDestinations = trips.map((t) => t.destination?.toLowerCase() ?? '');
  const allDays = trips.map((t) => t.days);

  // Count vibe frequency
  const vibeFreq = new Map<string, number>();
  for (const v of allVibes) {
    vibeFreq.set(v, (vibeFreq.get(v) ?? 0) + 1);
  }

  // Score each archetype
  const scores = new Map<PersonaArchetype, number>();

  for (const [key, def] of Object.entries(ARCHETYPES) as [PersonaArchetype, ArchetypeDefinition][]) {
    let score = 0;

    // Vibe signal matching
    for (const signal of def.vibeSignals) {
      for (const [vibe, count] of vibeFreq) {
        if (vibe.includes(signal) || signal.includes(vibe)) {
          score += count * 10;
        }
      }
    }

    // Budget signal bonus
    if (def.budgetSignal) {
      const budgetMatches = allBudgets.filter((b) => b === def.budgetSignal).length;
      score += budgetMatches * 15;
    }

    // Travel profile modifiers
    if (travelProfile) {
      // Food adventurousness high → food-archaeologist bonus
      if (key === 'food-archaeologist' && (travelProfile.foodAdventurousness ?? 0) >= 7) {
        score += 20;
      }
      // Low budget style → budget-ninja bonus
      if (key === 'budget-ninja' && (travelProfile.budgetStyle ?? 5) <= 3) {
        score += 20;
      }
      // High budget → comfort-maximalist bonus
      if (key === 'comfort-maximalist' && (travelProfile.budgetStyle ?? 5) >= 8) {
        score += 20;
      }
      // Spontaneous pace → chaos-tourist bonus
      if (key === 'chaos-tourist' && (travelProfile.pace ?? 5) <= 3) {
        score += 20;
      }
      // Long trips → slow-traveler bonus
      if (key === 'slow-traveler') {
        const avgDays = allDays.length > 0 ? allDays.reduce((a, b) => a + b, 0) / allDays.length : 7;
        if (avgDays >= 10) score += 25;
      }
    }

    scores.set(key, score);
  }

  // Pick top archetype (default to culture-collector if no data)
  let topArchetype: PersonaArchetype = 'culture-collector';
  let topScore = 0;
  for (const [key, score] of scores) {
    if (score > topScore) {
      topScore = score;
      topArchetype = key;
    }
  }

  // If zero trips, infer from profile
  if (trips.length === 0) {
    if ((travelProfile?.foodAdventurousness ?? 5) >= 8) topArchetype = 'food-archaeologist';
    else if ((travelProfile?.budgetStyle ?? 5) <= 3) topArchetype = 'budget-ninja';
    else if ((travelProfile?.budgetStyle ?? 5) >= 8) topArchetype = 'comfort-maximalist';
    else topArchetype = 'culture-collector';
  }

  const def = ARCHETYPES[topArchetype];

  // Build traits
  const sortedVibes = [...vibeFreq.entries()].sort((a, b) => b[1] - a[1]);
  const topVibes = sortedVibes.slice(0, 5);

  const traits: PersonaTrait[] = [
    {
      label: 'Adventurousness',
      value: clamp(((travelProfile?.foodAdventurousness ?? 5) / 10) * 100),
      emoji: '',
    },
    {
      label: 'Budget Savvy',
      value: clamp(100 - ((travelProfile?.budgetStyle ?? 5) / 10) * 100),
      emoji: '',
    },
    {
      label: 'Crowd Tolerance',
      value: clamp(((travelProfile?.crowdTolerance ?? 5) / 10) * 100),
      emoji: '',
    },
    {
      label: 'Travel Pace',
      value: clamp(((travelProfile?.pace ?? 5) / 10) * 100),
      emoji: '',
    },
    {
      label: 'Trip Intensity',
      value: clamp(trips.length > 0 ? Math.min(trips.length * 15, 100) : 30),
      emoji: '',
    },
  ];

  // Build stats
  const uniqueDestinations = new Set(allDestinations);
  const avgDays = allDays.length > 0 ? Math.round(allDays.reduce((a, b) => a + b, 0) / allDays.length) : 0;

  const budgetCounts = new Map<string, number>();
  for (const b of allBudgets) {
    if (b) budgetCounts.set(b, (budgetCounts.get(b) ?? 0) + 1);
  }
  const topBudget = [...budgetCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'comfort';

  const stats: PersonaStats = {
    tripsGenerated: trips.length,
    topDestinationType: topVibes[0]?.[0] ?? 'culture',
    avgBudgetTier: topBudget,
    mostUsedVibe: topVibes[0]?.[0] ?? 'exploring',
    uniqueCountries: uniqueDestinations.size,
    avgTripLength: avgDays,
    planningStyle:
      (travelProfile?.pace ?? 5) <= 3
        ? 'spontaneous'
        : (travelProfile?.pace ?? 5) >= 7
          ? 'planner'
          : 'balanced',
  };

  // Evolution message
  const lastTrip = trips[0];
  const evolution = lastTrip
    ? `Shaped by your ${lastTrip.destination} trip`
    : 'Your persona evolves with every trip';

  const persona: TravelPersona = {
    archetype: topArchetype,
    title: def.title,
    subtitle: def.subtitle,
    emoji: def.emoji,
    color: def.color,
    traits,
    stats,
    evolution,
    generatedAt: new Date().toISOString(),
  };

  // Persist
  AsyncStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(persona)).catch(() => {});

  return persona;
}

export async function getSavedPersona(): Promise<TravelPersona | null> {
  try {
    const raw = await AsyncStorage.getItem(PERSONA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clamp(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

// ---------------------------------------------------------------------------
// All archetypes for display
// ---------------------------------------------------------------------------
export function getAllArchetypes(): { id: PersonaArchetype; title: string; emoji: string; color: string }[] {
  return Object.entries(ARCHETYPES).map(([id, def]) => ({
    id: id as PersonaArchetype,
    title: def.title,
    emoji: def.emoji,
    color: def.color,
  }));
}

/** Famous travelers who share this persona archetype */
export const FAMOUS_TRAVELER_MATCH: Record<PersonaArchetype, { name: string; tagline: string }> = {
  'midnight-explorer': { name: 'Anthony Bourdain', tagline: 'Night markets and late-night eats' },
  'dawn-chaser': { name: 'Steve McCurry', tagline: 'First light, empty temples' },
  'food-archaeologist': { name: 'Jonathan Gold', tagline: 'The critic who ate every taco' },
  'comfort-maximalist': { name: 'Oprah', tagline: 'Private jets and spa days' },
  'chaos-tourist': { name: 'Jack Kerouac', tagline: 'On the road, no map' },
  'culture-collector': { name: 'Rick Steves', tagline: 'History over hype' },
  'budget-ninja': { name: 'Tim Ferriss', tagline: 'Hacks and hostels' },
  'adventure-junkie': { name: 'Bear Grylls', tagline: 'Adrenaline first' },
  'slow-traveler': { name: 'Elizabeth Gilbert', tagline: 'Eat, pray, stay a while' },
  'digital-nomad': { name: 'Tim Ferriss', tagline: 'Remote work, remote play' },
  'romantic-wanderer': { name: 'Audrey Hepburn', tagline: 'Roman Holiday vibes' },
  'solo-wolf': { name: 'Cheryl Strayed', tagline: 'Wild, alone, free' },
};
