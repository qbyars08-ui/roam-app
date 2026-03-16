// =============================================================================
// ROAM — Travel Personality Engine
// Computes a shareable travel personality from trip history.
// 12 unique personalities, each with a name, emoji, description, and traits.
// =============================================================================
import type { Trip } from './store';

// ---------------------------------------------------------------------------
// Personality Types
// ---------------------------------------------------------------------------
export interface TravelPersonality {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  traits: string[];
  color: string;
  gradient: [string, string];
}

const PERSONALITIES: TravelPersonality[] = [
  {
    id: 'urban-explorer',
    name: 'Urban Explorer',
    emoji: '\u{1F3D9}\uFE0F',
    tagline: 'Concrete jungle enthusiast',
    description: 'You gravitate toward the buzz of big cities — neon lights, hidden speakeasies, rooftop views. You\'d rather navigate a subway system than a hiking trail.',
    traits: ['City lover', 'Night owl', 'Culture seeker', 'Foodie'],
    color: '#E8614A',
    gradient: ['#E8614A', '#C94333'],
  },
  {
    id: 'culture-vulture',
    name: 'Culture Vulture',
    emoji: '\u{1F3DB}\uFE0F',
    tagline: 'Museums before beaches',
    description: 'Every trip is a masterclass. You plan around exhibitions, temples, and historical sites. You\'ve stood in front of art and felt something change inside you.',
    traits: ['History buff', 'Art lover', 'Intentional', 'Deep thinker'],
    color: '#C9A84C',
    gradient: ['#C9A84C', '#A8893A'],
  },
  {
    id: 'budget-backpacker',
    name: 'Budget Backpacker',
    emoji: '\u{1F392}',
    tagline: 'More miles, less money',
    description: 'You know that the best experiences don\'t cost much. Hostels over hotels, street food over fine dining, and you always find the free walking tour.',
    traits: ['Resourceful', 'Adventurous', 'Social', 'Flexible'],
    color: '#7CAF8A',
    gradient: ['#7CAF8A', '#5A8C68'],
  },
  {
    id: 'luxury-wanderer',
    name: 'Luxury Wanderer',
    emoji: '\u{2728}',
    tagline: 'Life\'s too short for bad hotels',
    description: 'You believe travel should feel like a reward. Spa days, Michelin stars, business class — you work hard and your trips reflect it.',
    traits: ['Refined taste', 'Comfort-first', 'Curated', 'Generous'],
    color: '#C9A84C',
    gradient: ['#2A1810', '#C9A84C'],
  },
  {
    id: 'nature-seeker',
    name: 'Nature Seeker',
    emoji: '\u{1F3D4}\uFE0F',
    tagline: 'The trail is calling',
    description: 'Mountains, beaches, forests — anywhere without a cell signal. You travel to disconnect and come back feeling like a different person.',
    traits: ['Outdoorsy', 'Mindful', 'Unplugged', 'Early riser'],
    color: '#4A8C5C',
    gradient: ['#1A3A28', '#4A8C5C'],
  },
  {
    id: 'foodie-pilgrim',
    name: 'Foodie Pilgrim',
    emoji: '\u{1F35C}',
    tagline: 'Eat first, sightsee second',
    description: 'You plan trips around restaurants. You\'ve flown somewhere just because someone told you about a noodle shop. Your camera roll is 90% food.',
    traits: ['Adventurous eater', 'Local expert', 'Sensory', 'Passionate'],
    color: '#E8614A',
    gradient: ['#E8614A', '#B84D3A'],
  },
  {
    id: 'solo-sage',
    name: 'Solo Sage',
    emoji: '\u{1F9D8}',
    tagline: 'Main character energy, always',
    description: 'You don\'t wait for anyone to say yes. Solo travel isn\'t lonely for you — it\'s liberating. You make friends everywhere you go.',
    traits: ['Independent', 'Self-assured', 'Open-minded', 'Brave'],
    color: '#8B7EC8',
    gradient: ['#2E2654', '#8B7EC8'],
  },
  {
    id: 'party-nomad',
    name: 'Party Nomad',
    emoji: '\u{1F389}',
    tagline: 'The nightlife IS the culture',
    description: 'You know the best DJs in Ibiza, the hidden bars in Tokyo, and that one club in Berlin that doesn\'t have a sign. You collect sunrises, not sunsets.',
    traits: ['Social butterfly', 'Night owl', 'Spontaneous', 'Energetic'],
    color: '#E84A8A',
    gradient: ['#E84A8A', '#8B2FC8'],
  },
  {
    id: 'photo-chaser',
    name: 'Photo Chaser',
    emoji: '\u{1F4F8}',
    tagline: 'Golden hour or bust',
    description: 'You plan around the light. Every trip produces a gallery. You know the difference between good and perfect, and you\'ll wait two hours for it.',
    traits: ['Visual', 'Patient', 'Detail-oriented', 'Aesthetic'],
    color: '#E8A84A',
    gradient: ['#E8A84A', '#C98A2F'],
  },
  {
    id: 'slow-traveler',
    name: 'Slow Traveler',
    emoji: '\u{2615}',
    tagline: 'Stay longer, go deeper',
    description: 'While others sprint through 3 countries in a week, you spend a month in one city. You learn the barista\'s name. You have a "regular" spot.',
    traits: ['Patient', 'Curious', 'Immersive', 'Thoughtful'],
    color: '#7CAF8A',
    gradient: ['#1A2E22', '#7CAF8A'],
  },
  {
    id: 'adrenaline-junkie',
    name: 'Adrenaline Junkie',
    emoji: '\u{1F3C4}',
    tagline: 'If it scares you, do it',
    description: 'Bungee jumping, cliff diving, paragliding — your trips have an element of danger and that\'s exactly the point. You collect experiences that make great stories.',
    traits: ['Fearless', 'Competitive', 'Physical', 'Story-collector'],
    color: '#E8614A',
    gradient: ['#8B2A1A', '#E8614A'],
  },
  {
    id: 'digital-nomad',
    name: 'Digital Nomad',
    emoji: '\u{1F4BB}',
    tagline: 'WiFi is a dealbreaker',
    description: 'You don\'t take vacations — you relocate. Cafes are your office, Airbnbs are your home. You\'ve figured out how to live everywhere and nowhere.',
    traits: ['Adaptive', 'Self-motivated', 'Connected', 'Location-free'],
    color: '#4AC8E8',
    gradient: ['#1A3040', '#4AC8E8'],
  },
];

// ---------------------------------------------------------------------------
// Scoring Engine
// ---------------------------------------------------------------------------

// Vibe → personality affinity map
const VIBE_AFFINITY: Record<string, string[]> = {
  'adventure': ['adrenaline-junkie', 'nature-seeker', 'budget-backpacker'],
  'cultural': ['culture-vulture', 'slow-traveler', 'photo-chaser'],
  'foodie': ['foodie-pilgrim', 'slow-traveler', 'luxury-wanderer'],
  'nightlife': ['party-nomad', 'urban-explorer', 'solo-sage'],
  'relaxation': ['slow-traveler', 'nature-seeker', 'luxury-wanderer'],
  'luxury': ['luxury-wanderer', 'photo-chaser', 'foodie-pilgrim'],
  'budget': ['budget-backpacker', 'solo-sage', 'digital-nomad'],
  'romantic': ['slow-traveler', 'luxury-wanderer', 'photo-chaser'],
  'solo': ['solo-sage', 'digital-nomad', 'slow-traveler'],
  'family': ['nature-seeker', 'culture-vulture', 'slow-traveler'],
  'outdoors': ['nature-seeker', 'adrenaline-junkie', 'photo-chaser'],
  'photography': ['photo-chaser', 'slow-traveler', 'nature-seeker'],
  'history': ['culture-vulture', 'slow-traveler', 'solo-sage'],
  'wellness': ['slow-traveler', 'nature-seeker', 'solo-sage'],
  'party': ['party-nomad', 'urban-explorer', 'budget-backpacker'],
  'shopping': ['urban-explorer', 'luxury-wanderer', 'photo-chaser'],
  'art': ['culture-vulture', 'photo-chaser', 'urban-explorer'],
};

// Budget → personality
const BUDGET_AFFINITY: Record<string, string[]> = {
  'budget': ['budget-backpacker', 'solo-sage', 'party-nomad'],
  'mid-range': ['urban-explorer', 'culture-vulture', 'foodie-pilgrim', 'digital-nomad'],
  'luxury': ['luxury-wanderer', 'photo-chaser', 'foodie-pilgrim'],
  'backpacker': ['budget-backpacker', 'adrenaline-junkie', 'solo-sage'],
};

/**
 * Compute a user's travel personality from their trip history.
 * Returns the top personality + runner-up.
 */
export function computeTravelPersonality(
  trips: Trip[]
): { primary: TravelPersonality; secondary: TravelPersonality; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  for (const p of PERSONALITIES) {
    scores[p.id] = 0;
  }

  if (trips.length === 0) {
    // Default for no trips — give everyone "Urban Explorer" as starter
    return {
      primary: PERSONALITIES[0],
      secondary: PERSONALITIES[2],
      scores,
    };
  }

  for (const trip of trips) {
    // Score from vibes
    for (const vibe of trip.vibes) {
      const normalizedVibe = vibe.toLowerCase().trim();
      const affinities = VIBE_AFFINITY[normalizedVibe];
      if (affinities) {
        affinities.forEach((pid, i) => {
          scores[pid] = (scores[pid] ?? 0) + (3 - i); // 3, 2, 1 weighting
        });
      }
    }

    // Score from budget
    const budgetKey = trip.budget.toLowerCase().trim();
    const budgetAffinities = BUDGET_AFFINITY[budgetKey];
    if (budgetAffinities) {
      budgetAffinities.forEach((pid, i) => {
        scores[pid] = (scores[pid] ?? 0) + (2 - Math.min(i, 1));
      });
    }

    // Score from trip length
    if (trip.days >= 10) {
      scores['slow-traveler'] = (scores['slow-traveler'] ?? 0) + 2;
      scores['digital-nomad'] = (scores['digital-nomad'] ?? 0) + 1;
    } else if (trip.days <= 3) {
      scores['urban-explorer'] = (scores['urban-explorer'] ?? 0) + 2;
      scores['party-nomad'] = (scores['party-nomad'] ?? 0) + 1;
    }
  }

  // Sort by score
  const sorted = [...PERSONALITIES].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
  );

  return {
    primary: sorted[0],
    secondary: sorted[1],
    scores,
  };
}

/**
 * Get all personality types — useful for showing the full list.
 */
export function getAllPersonalities(): TravelPersonality[] {
  return [...PERSONALITIES];
}

/**
 * Get a personality by ID.
 */
export function getPersonality(id: string): TravelPersonality | null {
  return PERSONALITIES.find((p) => p.id === id) ?? null;
}
