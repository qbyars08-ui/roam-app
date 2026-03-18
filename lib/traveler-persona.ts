// =============================================================================
// ROAM — Traveler Persona System
// 6 traveler types that shape every trip generation, Sonar query, and UI
// =============================================================================
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TravelerPersona =
  | 'backpacker'
  | 'luxury'
  | 'family'
  | 'business'
  | 'romantic'
  | 'adventure';

export interface PersonaConfig {
  id: TravelerPersona;
  label: string;
  icon: string;
  description: string;
  accommodationType: string;
  foodPreference: string;
  budgetRange: string;
  sonarPromptModifier: string;
  itineraryPromptModifier: string;
  priorityFeatures: string[];
  hideFeatures: string[];
}

// ---------------------------------------------------------------------------
// Persona Configs
// ---------------------------------------------------------------------------

const PERSONA_CONFIGS: Record<TravelerPersona, PersonaConfig> = {
  backpacker: {
    id: 'backpacker',
    label: 'Backpacker',
    icon: 'Backpack',
    description: 'Budget, hostels, street food, social, adventure',
    accommodationType: 'hostels',
    foodPreference: 'street food',
    budgetRange: '$20–50/day',
    sonarPromptModifier:
      'Focus on budget options, hostels, street food, and social backpacker hangouts.',
    itineraryPromptModifier:
      'PERSONA — BACKPACKER: Focus on budget accommodations like hostels and guesthouses ($10–25/night). Prioritize street food stalls, local markets, and budget eateries. Include social activities where solo travelers meet others (hostel common areas, free walking tours, group activities). Keep the total daily budget under $50. Suggest free or very cheap activities. Use public transit only — no taxis or rideshares unless unavoidable.',
    priorityFeatures: ['hostels', 'street-food', 'budget', 'social'],
    hideFeatures: ['luxury-hotels', 'fine-dining', 'private-tours'],
  },

  luxury: {
    id: 'luxury',
    label: 'Luxury Traveler',
    icon: 'Crown',
    description: 'High-end hotels, fine dining, private tours, spa',
    accommodationType: '5-star hotels',
    foodPreference: 'fine dining',
    budgetRange: '$300–800/day',
    sonarPromptModifier:
      'Focus on premium, exclusive, and high-end options only. No budget suggestions.',
    itineraryPromptModifier:
      'PERSONA — LUXURY: Only suggest 4-5 star hotels and boutique properties with exceptional reviews. Include Michelin-starred restaurants, chef\'s tables, and tasting menus. Suggest private guided tours and exclusive experiences (private museum access, after-hours tours, helicopter rides). Budget is not a concern — never mention cost as a limitation. Focus on exclusivity, personalized service, and high-end experiences. Include spa treatments and premium wellness options.',
    priorityFeatures: ['luxury-hotels', 'fine-dining', 'private-tours', 'spa'],
    hideFeatures: ['hostels', 'street-food', 'budget'],
  },

  family: {
    id: 'family',
    label: 'Family Traveler',
    icon: 'Users',
    description: 'Kid-friendly, safety-first, easy access, nap schedules',
    accommodationType: 'family resorts',
    foodPreference: 'family-friendly restaurants',
    budgetRange: '$150–400/day',
    sonarPromptModifier:
      'Focus on family-friendly options, kid activities, and safe neighborhoods.',
    itineraryPromptModifier:
      'PERSONA — FAMILY: All activities MUST be child-friendly — explicitly note age suitability. Include mid-day rest windows (1–3 PM nap/pool time). Note stroller accessibility for every location ("3 steps at entrance — not stroller-friendly" or "fully flat and stroller-accessible"). Suggest family restaurants with kids menus and high chairs. Keep walking distances short between stops (under 15 min on foot). Avoid late-night activities. Prefer hotels with pools or play areas. Flag any age restrictions. Safety is the top priority — note which neighborhoods are family-safe.',
    priorityFeatures: ['family-hotels', 'kid-activities', 'safe-neighborhoods'],
    hideFeatures: ['nightlife', 'extreme-sports', 'hostels'],
  },

  business: {
    id: 'business',
    label: 'Business Traveler',
    icon: 'Briefcase',
    description: 'Airport lounges, wifi quality, coworking, quick meals',
    accommodationType: 'business hotels',
    foodPreference: 'quick quality meals',
    budgetRange: '$200–500/day',
    sonarPromptModifier:
      'Focus on business-friendly options: fast wifi, coworking spaces, airport lounges, and efficient transport.',
    itineraryPromptModifier:
      'PERSONA — BUSINESS: Prioritize hotels near business districts with reliable high-speed wifi (note wifi speed where known). Include coworking space options with day passes. Suggest quick, high-quality meals (not long leisurely lunches). Note airport lounge access options and transport times to/from airport. Include after-work dining options that are impressive for client dinners. Flag morning/evening windows that work around a standard 9–6 schedule. Recommend efficient routes that minimize transit time.',
    priorityFeatures: ['coworking', 'business-hotels', 'airport-lounges', 'wifi'],
    hideFeatures: ['hostels', 'long-hikes', 'extreme-sports'],
  },

  romantic: {
    id: 'romantic',
    label: 'Romantic Escape',
    icon: 'Heart',
    description: 'Couples, sunset spots, intimate restaurants, views',
    accommodationType: 'boutique hotels with views',
    foodPreference: 'intimate restaurants',
    budgetRange: '$200–500/day',
    sonarPromptModifier:
      'Focus on romantic experiences: sunset spots, intimate restaurants, couples activities, and scenic hotels.',
    itineraryPromptModifier:
      'PERSONA — ROMANTIC: This is a couples trip. Suggest intimate, atmospheric restaurants with good ambiance — not loud tourist spots. Include sunset viewpoints with exact timing ("Golden hour 6:42 PM — be there by 6:20 AM for the best spot"). Prioritize hotels with couples amenities: view rooms, balconies, bathtubs, romantic décor. Include slow mornings, couples spa treatments, and private experiences. Evening activities should feel special and intimate. Avoid crowded group tours. Include spontaneous romantic gestures (picnic spots, rooftop bars, candlelit walks).',
    priorityFeatures: ['romantic-hotels', 'sunset-spots', 'intimate-dining', 'couples-activities'],
    hideFeatures: ['hostels', 'group-tours', 'extreme-sports'],
  },

  adventure: {
    id: 'adventure',
    label: 'Adventure Seeker',
    icon: 'Mountain',
    description: 'Hiking, diving, extreme sports, off-grid, camping',
    accommodationType: 'eco-lodges or camping',
    foodPreference: 'local fuel-up spots',
    budgetRange: '$50–150/day',
    sonarPromptModifier:
      'Focus on adventure activities, hiking trails, diving spots, extreme sports, and off-the-beaten-path destinations.',
    itineraryPromptModifier:
      'PERSONA — ADVENTURE: Prioritize physical experiences: hiking, trekking, diving, surfing, rock climbing, kayaking, and extreme sports. Include specific trail names with difficulty ratings and distance. Suggest eco-lodges, mountain huts, or camping options when available. Early starts are expected — 5–6 AM departures for trails are normal and preferred. Include "fuel-up" meals before big activities. Mention equipment rental options. Note permit requirements and booking lead times for popular trails. Off-the-beaten-path destinations preferred over tourist circuits.',
    priorityFeatures: ['hiking', 'diving', 'extreme-sports', 'camping', 'eco-lodges'],
    hideFeatures: ['luxury-hotels', 'fine-dining', 'spa'],
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const ALL_PERSONAS: PersonaConfig[] = Object.values(PERSONA_CONFIGS);

export function getPersonaConfig(persona: TravelerPersona): PersonaConfig {
  return PERSONA_CONFIGS[persona];
}

/**
 * React hook — returns the current persona config from the store.
 * Returns null if no persona has been set.
 */
export function usePersona(): PersonaConfig | null {
  const travelerPersona = useAppStore((s) => s.travelerPersona);
  if (!travelerPersona) return null;
  return getPersonaConfig(travelerPersona);
}
