// =============================================================================
// ROAM — People Tab Types, Constants & Mock Data
// Extracted from app/(tabs)/people.tsx for file size management.
// =============================================================================
import React from 'react';
import {
  Compass,
  Globe,
  Heart,
  Moon,
  Mountain,
  Star,
  Utensils,
  Wallet,
} from 'lucide-react-native';
import { COLORS } from '../../lib/constants';
import type { TravelStyle, VibeTag, SocialProfile, TripPresence as TripPresenceType } from '../../lib/types/social';
import { DEFAULT_PRIVACY } from '../../lib/types/social';

// TRAVEL STYLE DEFINITIONS
// =============================================================================
export type TravelStyleOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

export const TRAVEL_STYLES: TravelStyleOption[] = [
  { id: 'solo-explorer', label: 'Solo explorer', icon: <Compass size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'cultural-deep-dive', label: 'Cultural deep-dive', icon: <Globe size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'adventure-seeker', label: 'Adventure seeker', icon: <Mountain size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'food-obsessed', label: 'Food obsessed', icon: <Utensils size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'slow-traveler', label: 'Slow traveler', icon: <Heart size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'night-owl', label: 'Night owl', icon: <Moon size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'budget-master', label: 'Budget master', icon: <Wallet size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
  { id: 'no-compromises', label: 'No compromises', icon: <Star size={20} color={COLORS.creamSoft} strokeWidth={1.5} /> },
];

export const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Japanese',
  'Mandarin', 'Portuguese', 'Italian', 'Arabic', 'Korean',
  'Dutch', 'Other',
];

// Map local travel style IDs -> DB travel_style enum + vibe_tags

export const STYLE_TO_DB: Record<string, { travelStyle: TravelStyle; vibeTags: VibeTag[] }> = {
  'solo-explorer': { travelStyle: 'adventure', vibeTags: ['hiking-buddy', 'day-trip-companion'] },
  'cultural-deep-dive': { travelStyle: 'slow-travel', vibeTags: ['culture-explorer', 'language-exchange'] },
  'adventure-seeker': { travelStyle: 'adventure', vibeTags: ['hiking-buddy', 'day-trip-companion'] },
  'food-obsessed': { travelStyle: 'comfort', vibeTags: ['food-tour-partner', 'coffee-chat'] },
  'slow-traveler': { travelStyle: 'slow-travel', vibeTags: ['coffee-chat', 'culture-explorer'] },
  'night-owl': { travelStyle: 'comfort', vibeTags: ['nightlife-crew', 'hostel-hangout'] },
  'budget-master': { travelStyle: 'backpacker', vibeTags: ['hostel-hangout', 'hiking-buddy'] },
  'no-compromises': { travelStyle: 'luxury', vibeTags: ['food-tour-partner', 'photography-partner'] },
};

export function resolveProfileFromDraft(styles: string[]): { travelStyle: TravelStyle; vibeTags: VibeTag[] } {
  if (styles.length === 0) return { travelStyle: 'comfort', vibeTags: [] };
  const first = STYLE_TO_DB[styles[0]] ?? { travelStyle: 'comfort' as TravelStyle, vibeTags: [] as VibeTag[] };
  // Merge vibe tags from all selected styles (deduplicated)
  const allTags = new Set<VibeTag>();
  for (const s of styles) {
    const mapped = STYLE_TO_DB[s];
    if (mapped) mapped.vibeTags.forEach((t) => allTags.add(t));
  }
  return { travelStyle: first.travelStyle, vibeTags: [...allTags] };
}

// =============================================================================
// MOCK → SOCIAL TYPE CONVERTERS
// =============================================================================
export function mockToSocialProfile(roamer: MockRoamer): SocialProfile {
  const mapped = STYLE_TO_DB[roamer.travelStyles[0]] ?? { travelStyle: 'comfort' as TravelStyle, vibeTags: [] as VibeTag[] };
  const allTags = new Set<VibeTag>();
  for (const s of roamer.travelStyles) {
    const m = STYLE_TO_DB[s];
    if (m) m.vibeTags.forEach((t) => allTags.add(t));
  }
  return {
    id: roamer.id,
    userId: roamer.id,
    displayName: roamer.name,
    ageRange: '25-30',
    travelStyle: mapped.travelStyle,
    vibeTags: [...allTags],
    bio: roamer.bio,
    avatarEmoji: '',
    languages: roamer.languages,
    verified: false,
    privacy: { ...DEFAULT_PRIVACY },
    createdAt: new Date().toISOString(),
  };
}

export function mockToTripPresence(roamer: MockRoamer): TripPresenceType {
  const mapped = STYLE_TO_DB[roamer.travelStyles[0]] ?? { vibeTags: [] as VibeTag[] };
  return {
    id: roamer.id,
    userId: roamer.id,
    destination: roamer.destination,
    arrivalDate: roamer.arrivalDate,
    departureDate: roamer.departureDate,
    lookingFor: mapped.vibeTags,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

// =============================================================================
// PROFILE CREATION STATE
// =============================================================================
export type ProfileDraft = {
  name: string;
  homeCity: string;
  travelStyles: string[];
  languages: string[];
  bio: string;
  firstTripDestination: string;
  firstTripStartDate: string;
  firstTripEndDate: string;
};

export const EMPTY_DRAFT: ProfileDraft = {
  name: '',
  homeCity: '',
  travelStyles: [],
  languages: [],
  bio: '',
  firstTripDestination: '',
  firstTripStartDate: '',
  firstTripEndDate: '',
};

// =============================================================================
// COMPATIBILITY SCORE CALCULATOR
// =============================================================================
export function computeCompatibility(
  myStyles: string[],
  myLanguages: string[],
  myTripCount: number,
  theirStyles: string[],
  theirLanguages: string[],
  theirTripCount: number,
  datesOverlap: boolean,
): number {
  let score = 0;
  // Shared travel styles: 30 pts each, max 3
  const sharedStyles = myStyles.filter((st) => theirStyles.includes(st));
  score += Math.min(sharedStyles.length, 3) * 30;
  // Overlapping dates
  if (datesOverlap) score += 10;
  // Shared language
  const sharedLangs = myLanguages.filter((l) => theirLanguages.includes(l));
  if (sharedLangs.length > 0) score += 20;
  // Similar trip count (within 3)
  if (Math.abs(myTripCount - theirTripCount) <= 3) score += 10;
  return Math.min(score, 100);
}

// =============================================================================
// CONNECTION STATUS TYPE
// =============================================================================
export type ConnectionStatus = 'none' | 'requested' | 'connected';

// =============================================================================
// MOCK DATA FOR DEMO (replaces Supabase reads until tables exist)
// =============================================================================
export type MockRoamer = {
  id: string;
  name: string;
  homeCity: string;
  travelStyles: string[];
  languages: string[];
  bio: string;
  tripCount: number;
  destination: string;
  arrivalDate: string;
  departureDate: string;
  currentlyThere: boolean;
  isDemo?: boolean;
};

export function getMockRoamers(destination: string): MockRoamer[] {
  return [
    {
      id: 'mock-1',
      name: 'Lena K.',
      homeCity: 'Berlin',
      travelStyles: ['cultural-deep-dive', 'food-obsessed', 'slow-traveler'],
      languages: ['English', 'German', 'French'],
      bio: 'Film photographer with a thing for street food markets.',
      tripCount: 12,
      destination,
      arrivalDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      departureDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      currentlyThere: false,
      isDemo: true,
    },
    {
      id: 'mock-2',
      name: 'Marco T.',
      homeCity: 'Lisbon',
      travelStyles: ['adventure-seeker', 'night-owl', 'budget-master'],
      languages: ['English', 'Portuguese', 'Spanish'],
      bio: 'Surf and sunsets. Looking for hiking partners.',
      tripCount: 8,
      destination,
      arrivalDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      departureDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      currentlyThere: true,
      isDemo: true,
    },
    {
      id: 'mock-3',
      name: 'Yuki A.',
      homeCity: 'Tokyo',
      travelStyles: ['solo-explorer', 'food-obsessed', 'cultural-deep-dive'],
      languages: ['English', 'Japanese'],
      bio: 'Architecture nerd. Will walk 30k steps for the right coffee.',
      tripCount: 15,
      destination,
      arrivalDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      departureDate: new Date(Date.now() + 12 * 86400000).toISOString(),
      currentlyThere: false,
      isDemo: true,
    },
  ];
}

export function getMockDestinationCounts(): { destination: string; count: number }[] {
  return [
    { destination: 'Tokyo', count: 24 },
    { destination: 'Lisbon', count: 18 },
    { destination: 'Mexico City', count: 15 },
    { destination: 'Bali', count: 31 },
    { destination: 'Barcelona', count: 12 },
    { destination: 'Seoul', count: 9 },
  ];
}
