// =============================================================================
// ROAM — Offline Storage (AsyncStorage)
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Itinerary } from './types/itinerary';
import { OFFLINE_TRIPS, OFFLINE_ITINERARY_PREFIX, OFFLINE_LAST_SYNC } from './storage-keys';

const KEYS = {
  TRIPS: OFFLINE_TRIPS,
  ITINERARY_PREFIX: OFFLINE_ITINERARY_PREFIX,
  LAST_SYNC: OFFLINE_LAST_SYNC,
} as const;

// ---------------------------------------------------------------------------
// Trip-level persistence
// ---------------------------------------------------------------------------

export interface OfflineTrip {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  createdAt: string;
  hasItinerary: boolean;
}

/**
 * Save all trips to local storage (lightweight metadata only).
 */
export async function saveTripsOffline(trips: OfflineTrip[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.TRIPS, JSON.stringify(trips));
  } catch (err) {
    console.warn('[offline] Failed to save trips:', err);
  }
}

/**
 * Load all trips from local storage.
 */
export async function loadTripsOffline(): Promise<OfflineTrip[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRIPS);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineTrip[];
  } catch (err) {
    console.warn('[offline] Failed to load trips:', err);
    return [];
  }
}

/**
 * Save or update a single trip in the offline trip list.
 */
export async function saveTripOffline(trip: OfflineTrip): Promise<void> {
  try {
    const existing = await loadTripsOffline();
    const idx = existing.findIndex((t) => t.id === trip.id);
    if (idx >= 0) {
      existing[idx] = trip;
    } else {
      existing.unshift(trip);
    }
    await saveTripsOffline(existing);
  } catch (err) {
    console.warn('[offline] Failed to save single trip:', err);
  }
}

// ---------------------------------------------------------------------------
// Itinerary-level persistence (full JSON, keyed by trip ID)
// ---------------------------------------------------------------------------

/**
 * Save a full itinerary to local storage, keyed by trip ID.
 */
export async function saveItineraryOffline(
  tripId: string,
  itinerary: Itinerary
): Promise<void> {
  try {
    const key = `${KEYS.ITINERARY_PREFIX}${tripId}`;
    await AsyncStorage.setItem(key, JSON.stringify(itinerary));
  } catch (err) {
    console.warn('[offline] Failed to save itinerary:', err);
  }
}

/**
 * Load a full itinerary from local storage by trip ID.
 * Returns null if not cached.
 */
export async function loadItineraryOffline(
  tripId: string
): Promise<Itinerary | null> {
  try {
    const key = `${KEYS.ITINERARY_PREFIX}${tripId}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Itinerary;
  } catch (err) {
    console.warn('[offline] Failed to load itinerary:', err);
    return null;
  }
}

/**
 * Remove a cached itinerary by trip ID.
 */
export async function removeItineraryOffline(tripId: string): Promise<void> {
  try {
    const key = `${KEYS.ITINERARY_PREFIX}${tripId}`;
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn('[offline] Failed to remove itinerary:', err);
  }
}

// ---------------------------------------------------------------------------
// Sync timestamp
// ---------------------------------------------------------------------------

/**
 * Record the current time as the last successful sync with the server.
 */
export async function setLastSyncTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.warn('[offline] Failed to set last sync time:', err);
  }
}

/**
 * Get the ISO timestamp of the last successful server sync.
 * Returns null if the app has never synced.
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.LAST_SYNC);
  } catch (err) {
    console.warn('[offline] Failed to get last sync time:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bulk cleanup
// ---------------------------------------------------------------------------

/**
 * Remove all ROAM-specific offline data. Useful for sign-out.
 */
export async function clearAllOfflineData(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const roamKeys = allKeys.filter((k) => k.startsWith('@roam/'));
    if (roamKeys.length > 0) {
      await AsyncStorage.multiRemove(roamKeys);
    }
  } catch (err) {
    console.warn('[offline] Failed to clear offline data:', err);
  }
}
