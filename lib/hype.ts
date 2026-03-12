// =============================================================================
// ROAM — Pre-Trip Hype Mode Engine
// Countdown + daily destination intel to build excitement before a trip
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------
const STORAGE_KEY = '@roam/hype_trips';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type HypeTrip = {
  tripId: string;
  destination: string;
  departureDate: string;
  createdAt: string;
};

export type HypeContent = {
  emoji: string;
  title: string;
  tip: string;
};

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Save a trip with a departure date for hype mode tracking.
 */
export async function setHypeTrip(
  tripId: string,
  destination: string,
  departureDate: string
): Promise<void> {
  const trips = await getHypeTrips();

  // Replace if trip already exists, otherwise add
  const existing = trips.findIndex((t) => t.tripId === tripId);
  const entry: HypeTrip = {
    tripId,
    destination,
    departureDate,
    createdAt: new Date().toISOString(),
  };

  if (existing >= 0) {
    trips[existing] = entry;
  } else {
    trips.push(entry);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

/**
 * Get all hype trips from storage.
 */
export async function getHypeTrips(): Promise<HypeTrip[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HypeTrip[];
  } catch {
    return [];
  }
}

/**
 * Remove a hype trip by tripId.
 */
export async function removeHypeTrip(tripId: string): Promise<void> {
  const trips = await getHypeTrips();
  const filtered = trips.filter((t) => t.tripId !== tripId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Calculate the number of days until the departure date.
 * Returns 0 if the date is today or in the past.
 */
export function getDaysUntil(departureDate: string): number {
  const now = new Date();
  const departure = new Date(departureDate);

  // Zero out time components for accurate day diff
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const departureStart = new Date(
    departure.getFullYear(),
    departure.getMonth(),
    departure.getDate()
  );

  const diffMs = departureStart.getTime() - todayStart.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get hype content (emoji, title, tip) based on destination and days remaining.
 */
export function getHypeContent(
  destination: string,
  daysUntil: number
): HypeContent {
  if (daysUntil === 0) {
    return {
      emoji: '\u2708\uFE0F',
      title: 'TODAY IS THE DAY!',
      tip: `Have an amazing trip to ${destination}!`,
    };
  }

  if (daysUntil <= 2) {
    return {
      emoji: '\uD83D\uDCCB',
      title: 'Final checks',
      tip: 'Print or screenshot your booking confirmations',
    };
  }

  if (daysUntil <= 6) {
    return {
      emoji: '\uD83D\uDD0B',
      title: 'Almost there',
      tip: 'Charge your devices, download entertainment for the flight',
    };
  }

  if (daysUntil <= 13) {
    return {
      emoji: '\uD83E\uDDF3',
      title: 'Time to pack',
      tip: `Start packing \u2014 check weather forecast for your dates in ${destination}`,
    };
  }

  if (daysUntil <= 20) {
    return {
      emoji: '\uD83D\uDDFA\uFE0F',
      title: 'Get prepared',
      tip: `Download offline maps for ${destination}`,
    };
  }

  if (daysUntil <= 29) {
    return {
      emoji: '\uD83C\uDFAB',
      title: 'Book ahead',
      tip: 'Check visa requirements and book any tours that sell out',
    };
  }

  // 30+ days
  return {
    emoji: '\uD83D\uDDE3\uFE0F',
    title: 'Start learning',
    tip: `Start learning 5 phrases in the local language for ${destination}`,
  };
}
