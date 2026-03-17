// =============================================================================
// ROAM — Offline Itinerary Support (Phase 2)
// Enhanced offline caching with destination context + emergency numbers
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Itinerary } from './types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OfflineItineraryData {
  tripId: string;
  destination: string;
  itinerary: Itinerary;
  emergencyNumbers: OfflineEmergencyNumbers | null;
  savedAt: string;
}

export interface OfflineEmergencyNumbers {
  police: string[];
  fire: string[];
  ambulance: string[];
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const OFFLINE_KEY_PREFIX = 'roam_offline_';

function getKey(tripId: string): string {
  return `${OFFLINE_KEY_PREFIX}${tripId}`;
}

// ---------------------------------------------------------------------------
// Save itinerary offline
// ---------------------------------------------------------------------------

/**
 * Save a parsed itinerary along with destination context and emergency numbers
 * to AsyncStorage for offline access.
 *
 * @param tripId       Unique trip identifier
 * @param itinerary    Parsed Itinerary object
 * @param destination  Destination name (e.g. "Tokyo")
 */
export async function saveItineraryOffline(
  tripId: string,
  itinerary: Itinerary,
  destination: string
): Promise<void> {
  try {
    // Try to get emergency numbers — don't block on failure
    let emergencyNumbers: OfflineEmergencyNumbers | null = null;
    try {
      const { getEmergencyNumbers } = require('./emergency-numbers');
      const numbers = await getEmergencyNumbers(destination);
      if (numbers) {
        emergencyNumbers = {
          police: numbers.police ?? [],
          fire: numbers.fire ?? [],
          ambulance: numbers.ambulance ?? [],
        };
      }
    } catch {
      // Emergency numbers are optional — continue without them
    }

    const data: OfflineItineraryData = {
      tripId,
      destination,
      itinerary,
      emergencyNumbers,
      savedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(getKey(tripId), JSON.stringify(data));
  } catch (err) {
    console.warn('[offline-itinerary] Failed to save:', err);
  }
}

// ---------------------------------------------------------------------------
// Load itinerary offline
// ---------------------------------------------------------------------------

/**
 * Load a cached itinerary from AsyncStorage.
 * Returns the full offline data including emergency numbers, or null if not cached.
 *
 * @param tripId  The trip to load
 */
export async function loadOfflineItinerary(
  tripId: string
): Promise<OfflineItineraryData | null> {
  try {
    const raw = await AsyncStorage.getItem(getKey(tripId));
    if (!raw) return null;
    return JSON.parse(raw) as OfflineItineraryData;
  } catch (err) {
    console.warn('[offline-itinerary] Failed to load:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Check if offline data is available
// ---------------------------------------------------------------------------

/**
 * Check whether a trip has offline itinerary data cached.
 *
 * @param tripId  The trip to check
 */
export async function isOfflineAvailable(tripId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(getKey(tripId));
    return raw !== null;
  } catch {
    return false;
  }
}
