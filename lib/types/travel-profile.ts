// =============================================================================
// ROAM — Travel Style Profile Types
// =============================================================================

// ---------------------------------------------------------------------------
// Slider dimensions (1-10 scale)
// ---------------------------------------------------------------------------

import type { PassportNationality } from '../visa-intel';
export type { PassportNationality } from '../visa-intel';

/** How often user travels — drives guidance level (tips, safety, hand-holding) */
export type TravelFrequency =
  | 'first-trip'
  | 'once-a-year'
  | 'few-times-year'
  | 'constantly';

export type TravelProfile = {
  /** Passport nationality for visa checks. null = not yet set by user (defaults to US silently, show warning). */
  passportNationality: PassportNationality | null;
  /** How often they travel — first-trip = more tips/safety; constantly = less hand-holding */
  travelFrequency: TravelFrequency;
  /** 1 = slow single-neighborhood traveler, 10 = multi-country speed runner */
  pace: number;
  /** 1 = hostel beds & street food, 10 = money is not the constraint */
  budgetStyle: number;
  /** Multi-select transport preferences */
  transport: TransportPreference[];
  /** 1 = anti-tourist, 10 = full tourist experience */
  crowdTolerance: number;
  /** 1 = recognize what I'm eating, 10 = eat what locals eat */
  foodAdventurousness: number;
  /** Single-select accommodation style */
  accommodation: AccommodationStyle;
  /** Multi-select trip purposes */
  tripPurposes: TripPurpose[];
};

// ---------------------------------------------------------------------------
// Enum-like types for multi/single selects
// ---------------------------------------------------------------------------

export type TransportPreference =
  | 'walk'
  | 'metro'
  | 'rideshare'
  | 'rental-car'
  | 'public-bus'
  | 'cheapest'
  | 'fastest';

export type AccommodationStyle =
  | 'hostels'
  | 'budget-hotels'
  | 'boutique'
  | 'luxury'
  | 'apartments'
  | 'mix';

export type TripPurpose =
  | 'exploration'
  | 'food'
  | 'history'
  | 'nightlife'
  | 'nature'
  | 'photography'
  | 'relaxation'
  | 'meet-locals'
  | 'off-beaten-path';

// ---------------------------------------------------------------------------
// Default profile (middle-of-the-road explorer)
// ---------------------------------------------------------------------------

export const TRAVEL_FREQUENCY_OPTIONS: { id: TravelFrequency; label: string; description: string }[] = [
  { id: 'first-trip', label: 'First trip', description: 'Need lots of guidance' },
  { id: 'once-a-year', label: 'Once a year', description: 'Some experience' },
  { id: 'few-times-year', label: 'Few times a year', description: 'Comfortable' },
  { id: 'constantly', label: 'Constantly', description: 'Just give me the good stuff' },
];

export const DEFAULT_TRAVEL_PROFILE: TravelProfile = {
  passportNationality: null,
  travelFrequency: 'few-times-year',
  pace: 5,
  budgetStyle: 5,
  transport: [],
  crowdTolerance: 5,
  foodAdventurousness: 5,
  accommodation: 'mix',
  tripPurposes: [],
};

// ---------------------------------------------------------------------------
// Labels & display config
// ---------------------------------------------------------------------------

export const PACE_LABELS: Record<string, string> = {
  '1-3': 'The Slow Traveler',
  '4-6': 'The Explorer',
  '7-10': 'The Speed Runner',
};

export const BUDGET_STYLE_LABELS: Record<string, string> = {
  '1-3': 'The Backpacker',
  '4-6': 'The Smart Spender',
  '7-10': 'The Luxury Traveler',
};

export const CROWD_LABELS: Record<string, string> = {
  '1-3': 'The Hidden Gem Hunter',
  '4-6': 'The Balance Seeker',
  '7-10': 'The Full Experience',
};

export const FOOD_LABELS: Record<string, string> = {
  '1-3': 'The Comfort Eater',
  '4-6': 'The Curious Foodie',
  '7-10': 'The Street Food Warrior',
};

export function getSliderLabel(value: number, labels: Record<string, string>): string {
  if (value <= 3) return labels['1-3'];
  if (value <= 6) return labels['4-6'];
  return labels['7-10'];
}

// ---------------------------------------------------------------------------
// Transport options config
// ---------------------------------------------------------------------------

export interface TransportOption {
  id: TransportPreference;
  label: string;
  emoji: string;
}

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { id: 'walk', label: 'Walk everywhere', emoji: '' },
  { id: 'metro', label: 'Metro/subway', emoji: '' },
  { id: 'rideshare', label: 'Uber/rideshare', emoji: '' },
  { id: 'rental-car', label: 'Rent a car', emoji: '' },
  { id: 'public-bus', label: 'Bus/tram', emoji: '' },
  { id: 'cheapest', label: "Whatever's cheapest", emoji: '' },
  { id: 'fastest', label: "Whatever's fastest", emoji: '' },
];

// ---------------------------------------------------------------------------
// Accommodation options config
// ---------------------------------------------------------------------------

export interface AccommodationOption {
  id: AccommodationStyle;
  label: string;
  description: string;
  emoji: string;
}

export const ACCOMMODATION_OPTIONS: AccommodationOption[] = [
  { id: 'hostels', label: 'Hostels', description: 'Social, cheap', emoji: '' },
  { id: 'budget-hotels', label: 'Budget Hotels', description: 'Private, affordable', emoji: '' },
  { id: 'boutique', label: 'Boutique Hotels', description: 'Character over chain', emoji: '' },
  { id: 'luxury', label: 'Luxury Only', description: 'The best, always', emoji: '' },
  { id: 'apartments', label: 'Apartments', description: 'Airbnb vibes', emoji: '' },
  { id: 'mix', label: 'Mix It Up', description: 'Depends on the mood', emoji: '' },
];

// ---------------------------------------------------------------------------
// Trip purpose options config
// ---------------------------------------------------------------------------

export interface TripPurposeOption {
  id: TripPurpose;
  label: string;
  emoji: string;
}

export const TRIP_PURPOSE_OPTIONS: TripPurposeOption[] = [
  { id: 'exploration', label: 'Pure Exploration', emoji: '' },
  { id: 'food', label: 'Food Focused', emoji: '' },
  { id: 'history', label: 'History/Culture', emoji: '' },
  { id: 'nightlife', label: 'Nightlife', emoji: '' },
  { id: 'nature', label: 'Nature/Outdoors', emoji: '' },
  { id: 'photography', label: 'Photography', emoji: '' },
  { id: 'relaxation', label: 'Relaxation', emoji: '' },
  { id: 'meet-locals', label: 'Meet Locals', emoji: '' },
  { id: 'off-beaten-path', label: 'Off the Beaten Path', emoji: '' },
];

// ---------------------------------------------------------------------------
// Slider descriptors (shown as hint text under each slider)
// ---------------------------------------------------------------------------

export const SLIDER_DESCRIPTORS = {
  pace: {
    1: 'One neighborhood, three days, no rush',
    5: 'See the highlights, keep it relaxed',
    10: '5 countries, 8 days, sleep on trains',
  },
  budgetStyle: {
    1: 'Hostel beds and street food only',
    5: 'Comfortable — nice but not stupid',
    10: 'Money is not the constraint',
  },
  crowdTolerance: {
    1: "If it's on TripAdvisor I'm not going",
    5: 'Popular spots are fine if they earn it',
    10: 'I want the full tourist experience',
  },
  foodAdventurousness: {
    1: 'I need to recognize what I\'m eating',
    5: 'Open to trying new things',
    10: 'Street food, markets, eat what locals eat',
  },
} as const;

export function getSliderDescriptor(
  dimension: keyof typeof SLIDER_DESCRIPTORS,
  value: number
): string {
  const descriptors = SLIDER_DESCRIPTORS[dimension];
  if (value <= 2) return descriptors[1];
  if (value <= 4) return descriptors[1];
  if (value <= 7) return descriptors[5];
  return descriptors[10];
}

// ---------------------------------------------------------------------------
// Convert profile to prompt string for AI
// ---------------------------------------------------------------------------

export function profileToPromptString(profile: TravelProfile): string {
  const lines: string[] = [];
  const passportLabel = profile.passportNationality === 'US'
    ? 'US passport'
    : profile.passportNationality === 'AT'
      ? 'Austrian passport'
      : 'US passport (default — user has not set passport country)';
  lines.push(`Passport: ${passportLabel}`);

  const freqLabels: Record<TravelFrequency, string> = {
    'first-trip': 'First trip — needs lots of guidance, safety info, and explanations',
    'once-a-year': 'Travels once a year — some experience, moderate guidance',
    'few-times-year': 'Travels a few times a year — comfortable, standard level',
    constantly: 'Travels constantly — minimal hand-holding, advanced recs only, skip basics',
  };
  lines.push(`Travel frequency: ${freqLabels[profile.travelFrequency]}`);

  lines.push(`Pace: ${profile.pace}/10 (${getSliderLabel(profile.pace, PACE_LABELS)})`);
  lines.push(`Budget style: ${profile.budgetStyle}/10 (${getSliderLabel(profile.budgetStyle, BUDGET_STYLE_LABELS)})`);
  lines.push(`Crowd tolerance: ${profile.crowdTolerance}/10 (${getSliderLabel(profile.crowdTolerance, CROWD_LABELS)})`);
  lines.push(`Food adventurousness: ${profile.foodAdventurousness}/10 (${getSliderLabel(profile.foodAdventurousness, FOOD_LABELS)})`);

  if (profile.transport.length > 0) {
    const labels = profile.transport.map(
      (t) => TRANSPORT_OPTIONS.find((o) => o.id === t)?.label ?? t
    );
    lines.push(`Preferred transport: ${labels.join(', ')}`);
  }

  const accom = ACCOMMODATION_OPTIONS.find((a) => a.id === profile.accommodation);
  if (accom) lines.push(`Accommodation: ${accom.label} (${accom.description})`);

  if (profile.tripPurposes.length > 0) {
    const purposes = profile.tripPurposes.map(
      (p) => TRIP_PURPOSE_OPTIONS.find((o) => o.id === p)?.label ?? p
    );
    lines.push(`Trip focus: ${purposes.join(', ')}`);
  }

  return lines.join('\n');
}
