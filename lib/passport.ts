// =============================================================================
// ROAM — Travel Passport (stamp system)
// Tracks visited destinations with passport-style stamps
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PassportStamp {
  /** Destination name */
  destination: string;
  /** ISO country code */
  country: string;
  /** When the stamp was earned */
  stampedAt: string;
  /** Trip ID that earned this stamp */
  tripId: string;
  /** Emoji for the destination */
  emoji: string;
}

export interface TravelStats {
  countriesVisited: number;
  tripsCompleted: number;
  stamps: PassportStamp[];
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
const STAMPS_KEY = '@roam/passport_stamps';

export async function getStamps(): Promise<PassportStamp[]> {
  try {
    const raw = await AsyncStorage.getItem(STAMPS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PassportStamp[];
  } catch {
    return [];
  }
}

export async function addStamp(stamp: PassportStamp): Promise<PassportStamp[]> {
  const stamps = await getStamps();

  // Avoid duplicate stamps for same destination + trip
  const exists = stamps.some(
    (s) => s.destination === stamp.destination && s.tripId === stamp.tripId
  );
  if (exists) return stamps;

  const updated = [stamp, ...stamps];
  await AsyncStorage.setItem(STAMPS_KEY, JSON.stringify(updated));
  return updated;
}

export async function getStats(): Promise<TravelStats> {
  const stamps = await getStamps();
  const countries = new Set(stamps.map((s) => s.country));
  return {
    countriesVisited: countries.size,
    tripsCompleted: stamps.length,
    stamps,
  };
}

// ---------------------------------------------------------------------------
// Badge system
// ---------------------------------------------------------------------------
export interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  requirement: number;
  type: 'trips' | 'countries';
}

export const BADGES: Badge[] = [
  { id: 'first-flight', label: 'The One That Started It All', emoji: '\u2708\uFE0F', description: 'Complete your first trip', requirement: 1, type: 'trips' },
  { id: 'explorer', label: 'Just Getting Started', emoji: '\uD83E\uDDED', description: '3 trips down', requirement: 3, type: 'trips' },
  { id: 'globetrotter', label: 'Frequent Flyer Energy', emoji: '\uD83C\uDF0D', description: '5 trips and counting', requirement: 5, type: 'trips' },
  { id: 'world-traveler', label: 'You\'ve Got Stories', emoji: '\uD83D\uDDFA\uFE0F', description: '10 trips completed', requirement: 10, type: 'trips' },
  { id: 'wanderlust', label: 'Passport\'s Getting Heavy', emoji: '\uD83E\uDDE1', description: '3 countries visited', requirement: 3, type: 'countries' },
  { id: 'passport-heavy', label: 'We Can\'t Keep Up With You', emoji: '\uD83D\uDCD8', description: '5 countries visited', requirement: 5, type: 'countries' },
  { id: 'world-citizen', label: 'World Citizen', emoji: '\uD83C\uDF1F', description: '10 countries — not slowing down', requirement: 10, type: 'countries' },
  { id: 'legendary', label: 'Legendary', emoji: '\uD83D\uDC51', description: '20 countries. Respect.', requirement: 20, type: 'countries' },
];

export function getEarnedBadges(stats: TravelStats): Badge[] {
  return BADGES.filter((badge) => {
    const value =
      badge.type === 'trips'
        ? stats.tripsCompleted
        : stats.countriesVisited;
    return value >= badge.requirement;
  });
}
