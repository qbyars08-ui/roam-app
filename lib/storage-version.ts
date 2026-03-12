// =============================================================================
// ROAM — AsyncStorage version check (clear stale data on app update)
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const VERSION_KEY = '@roam/app_version';

/** Known cache/data keys that can be cleared on version bump (optional) */
const CACHE_KEYS_TO_CLEAR = [
  '@roam/freshness/',
  '@roam/freshness_',
  '@roam/error_counts',
  '@roam/language_cache',
  '@roam/currency_cache',
  '@roam/travel_advisory_cache',
  '@roam/flight_deals',
  '@roam/visa_',
  '@roam/weather_',
  '@roam/ticketmaster_',
  '@roam/amadeus_token',
];

/**
 * Call on app startup. If app version changed, clear caches that may be stale.
 * Preserves: trips, pets, travel profile, onboarding, emergency contact, etc.
 */
export async function checkStorageVersion(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(VERSION_KEY);
    const current = Constants.expoConfig?.version ?? '1.0.0';
    if (stored === current) return;
    await AsyncStorage.setItem(VERSION_KEY, current);
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter((k) =>
      CACHE_KEYS_TO_CLEAR.some((prefix) => k.startsWith(prefix) || k === prefix)
    );
    if (toRemove.length > 0) {
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch {
    // Non-fatal
  }
}
