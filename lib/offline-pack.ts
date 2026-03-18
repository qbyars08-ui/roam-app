// =============================================================================
// ROAM — Offline Pack: Download everything for a trip before losing WiFi
// Caches itinerary, emergency numbers, survival phrases, weather, cost of
// living, visa requirements, and exchange rates into a single AsyncStorage blob.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getEmergencyNumbers, type EmergencyNumbers } from './emergency-numbers';
import { getPhrasesForDestination, type SurvivalPhrase } from './survival-phrases';
import { getWeatherForecast, type WeatherForecast } from './weather-forecast';
import { getCostOfLiving, type CostOfLiving } from './cost-of-living';
import { getSimpleVisaInfo as getVisaInfo, destinationToCountryCode, type SimpleVisaInfo as VisaInfo } from './visa-intel';
import { getExchangeRates, type ExchangeRateData } from './exchange-rates';
import { geocodeCity } from './geocoding';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OfflinePackMeta {
  version: number;
  tripId: string;
  destination: string;
  downloadedAt: string; // ISO timestamp
  sizeBytes: number;
}

export interface OfflinePackData {
  meta: OfflinePackMeta;
  itinerary: string | null;
  emergencyNumbers: EmergencyNumbers | null;
  survivalPhrases: { language: string; phrases: SurvivalPhrase[] } | null;
  weatherForecast: WeatherForecast | null;
  costOfLiving: CostOfLiving | null;
  visaInfo: VisaInfo | null;
  exchangeRate: ExchangeRateData | null;
}

export interface OfflinePackStatus {
  isDownloaded: boolean;
  sizeBytes: number;
  downloadedAt: string | null;
}

export type OfflinePackProgressCallback = (
  step: number,
  total: number,
  label: string,
) => void;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PACK_VERSION = 1;
const TOTAL_STEPS = 7;

function cacheKey(tripId: string): string {
  return `roam_offline_pack_${tripId}`;
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

/**
 * Downloads and caches all offline data for a trip.
 * @param tripId         - Unique trip ID (used as part of the cache key).
 * @param destination    - Destination city name (e.g. "Tokyo").
 * @param itineraryJson  - Full itinerary JSON string from the Zustand store.
 * @param onProgress     - Optional progress callback: (step, total, label).
 */
export async function downloadOfflinePack(
  tripId: string,
  destination: string,
  itineraryJson: string | null,
  onProgress?: OfflinePackProgressCallback,
): Promise<OfflinePackData> {
  const report = (step: number, label: string) =>
    onProgress?.(step, TOTAL_STEPS, label);

  // Step 1 — Itinerary (already in memory, just record it)
  report(1, 'Saving itinerary…');
  const itinerary = itineraryJson ?? null;

  // Step 2 — Emergency numbers
  report(2, 'Fetching emergency numbers…');
  const countryCode = destinationToCountryCode(destination);
  const emergencyNumbers = countryCode
    ? await getEmergencyNumbers(countryCode).catch(() => null)
    : null;

  // Step 3 — Survival phrases (pure data, no network)
  report(3, 'Loading survival phrases…');
  const survivalPhrases = getPhrasesForDestination(destination);

  // Step 4 — Weather forecast
  report(4, 'Downloading weather forecast…');
  let weatherForecast: WeatherForecast | null = null;
  try {
    const geo = await geocodeCity(destination);
    if (geo) {
      weatherForecast = await getWeatherForecast(geo.latitude, geo.longitude, 7);
    }
  } catch {
    // Non-critical — leave null
  }

  // Step 5 — Cost of living (pure data, no network)
  report(5, 'Loading cost of living data…');
  const costOfLiving = getCostOfLiving(destination);

  // Step 6 — Visa requirements (pure data, no network)
  report(6, 'Loading visa requirements…');
  const visaInfo = getVisaInfo(destination);

  // Step 7 — Exchange rates
  report(7, 'Fetching exchange rates…');
  const exchangeRate = await getExchangeRates('USD').catch(() => null);

  // Assemble pack
  const now = new Date().toISOString();
  const pack: Omit<OfflinePackData, 'meta'> = {
    itinerary,
    emergencyNumbers,
    survivalPhrases,
    weatherForecast,
    costOfLiving,
    visaInfo,
    exchangeRate,
  };

  const serialised = JSON.stringify(pack);
  const sizeBytes = new TextEncoder().encode(serialised).length;

  const meta: OfflinePackMeta = {
    version: PACK_VERSION,
    tripId,
    destination,
    downloadedAt: now,
    sizeBytes,
  };

  const fullPack: OfflinePackData = { meta, ...pack };

  await AsyncStorage.setItem(cacheKey(tripId), JSON.stringify(fullPack));

  return fullPack;
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/** Returns the cached download status for a trip without loading the full pack. */
export async function getOfflinePackStatus(
  tripId: string,
): Promise<OfflinePackStatus> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(tripId));
    if (!raw) return { isDownloaded: false, sizeBytes: 0, downloadedAt: null };

    const pack: OfflinePackData = JSON.parse(raw);
    return {
      isDownloaded: true,
      sizeBytes: pack.meta?.sizeBytes ?? new TextEncoder().encode(raw).length,
      downloadedAt: pack.meta?.downloadedAt ?? null,
    };
  } catch {
    return { isDownloaded: false, sizeBytes: 0, downloadedAt: null };
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Removes a cached offline pack. */
export async function deleteOfflinePack(tripId: string): Promise<void> {
  await AsyncStorage.removeItem(cacheKey(tripId));
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Loads the full offline pack from cache. Returns null if not downloaded. */
export async function getOfflinePack(
  tripId: string,
): Promise<OfflinePackData | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(tripId));
    if (!raw) return null;
    return JSON.parse(raw) as OfflinePackData;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format bytes into a human-readable string (e.g. "2.4 MB"). */
export function formatPackSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
