// =============================================================================
// ROAM — US State Department Travel Advisory API
// No auth required. Unlimited. Completely free government open data.
// Endpoint: https://cadataapi.state.gov/api/TravelAdvisories
// Levels: 1 (Exercise Normal Precautions) → 4 (Do Not Travel)
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './constants';

const BASE = 'https://cadataapi.state.gov/api/TravelAdvisories';
const CACHE_KEY = 'roam_travel_advisories';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours — advisories change infrequently

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TravelAdvisory {
  countryCode: string;    // ISO 3166-1 alpha-2 (e.g., "JP")
  countryName: string;    // "Japan"
  level: 1 | 2 | 3 | 4;
  levelDescription: string;
  lastUpdated: string;    // ISO date
}

export interface AdvisoryDisplay {
  level: 1 | 2 | 3 | 4;
  label: string;
  shortLabel: string;
  color: string;
  emoji: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Advisory level display mapping
// ---------------------------------------------------------------------------
const LEVEL_INFO: Record<number, Omit<AdvisoryDisplay, 'level' | 'description'>> = {
  1: { label: 'Exercise Normal Precautions', shortLabel: 'Safe to visit', color: COLORS.primary, emoji: '' },
  2: { label: 'Exercise Increased Caution', shortLabel: 'Use caution', color: COLORS.gold, emoji: '' },
  3: { label: 'Reconsider Travel', shortLabel: 'Reconsider travel', color: COLORS.orangeAccent, emoji: '' },
  4: { label: 'Do Not Travel', shortLabel: 'Do not travel', color: COLORS.danger, emoji: '' },
};

export function getAdvisoryDisplay(advisory: TravelAdvisory): AdvisoryDisplay {
  const info = LEVEL_INFO[advisory.level] ?? LEVEL_INFO[1];
  return {
    level: advisory.level,
    label: info.label,
    shortLabel: info.shortLabel,
    color: info.color,
    emoji: info.emoji,
    description: advisory.levelDescription,
  };
}

// ---------------------------------------------------------------------------
// Destination → country mapping
// Maps ROAM destination labels to ISO country codes
// ---------------------------------------------------------------------------
const DESTINATION_COUNTRY: Record<string, { code: string; name: string }> = {
  Tokyo: { code: 'JP', name: 'Japan' },
  Kyoto: { code: 'JP', name: 'Japan' },
  Paris: { code: 'FR', name: 'France' },
  Bali: { code: 'ID', name: 'Indonesia' },
  'New York': { code: 'US', name: 'United States' },
  Barcelona: { code: 'ES', name: 'Spain' },
  Rome: { code: 'IT', name: 'Italy' },
  London: { code: 'GB', name: 'United Kingdom' },
  Bangkok: { code: 'TH', name: 'Thailand' },
  'Chiang Mai': { code: 'TH', name: 'Thailand' },
  Marrakech: { code: 'MA', name: 'Morocco' },
  Lisbon: { code: 'PT', name: 'Portugal' },
  Porto: { code: 'PT', name: 'Portugal' },
  'Cape Town': { code: 'ZA', name: 'South Africa' },
  Reykjavik: { code: 'IS', name: 'Iceland' },
  Seoul: { code: 'KR', name: 'South Korea' },
  'Buenos Aires': { code: 'AR', name: 'Argentina' },
  Istanbul: { code: 'TR', name: 'Turkey' },
  Sydney: { code: 'AU', name: 'Australia' },
  'Mexico City': { code: 'MX', name: 'Mexico' },
  Oaxaca: { code: 'MX', name: 'Mexico' },
  Cancun: { code: 'MX', name: 'Mexico' },
  Dubai: { code: 'AE', name: 'United Arab Emirates' },
  Amsterdam: { code: 'NL', name: 'Netherlands' },
  Medellín: { code: 'CO', name: 'Colombia' },
  Cartagena: { code: 'CO', name: 'Colombia' },
  Tbilisi: { code: 'GE', name: 'Georgia' },
  Dubrovnik: { code: 'HR', name: 'Croatia' },
  Budapest: { code: 'HU', name: 'Hungary' },
  'Hoi An': { code: 'VN', name: 'Vietnam' },
  Jaipur: { code: 'IN', name: 'India' },
  Queenstown: { code: 'NZ', name: 'New Zealand' },
  Azores: { code: 'PT', name: 'Portugal' },
  Ljubljana: { code: 'SI', name: 'Slovenia' },
  Santorini: { code: 'GR', name: 'Greece' },
  'Siem Reap': { code: 'KH', name: 'Cambodia' },
  Prague: { code: 'CZ', name: 'Czech Republic' },
  Berlin: { code: 'DE', name: 'Germany' },
  Vienna: { code: 'AT', name: 'Austria' },
  Copenhagen: { code: 'DK', name: 'Denmark' },
  Singapore: { code: 'SG', name: 'Singapore' },
  'Kuala Lumpur': { code: 'MY', name: 'Malaysia' },
  Havana: { code: 'CU', name: 'Cuba' },
  Lima: { code: 'PE', name: 'Peru' },
  Cusco: { code: 'PE', name: 'Peru' },
  'Costa Rica': { code: 'CR', name: 'Costa Rica' },
};

/**
 * Get the country info for a destination label. Returns null if not mapped.
 */
export function getCountryForDestination(destination: string): { code: string; name: string } | null {
  // Exact match first
  if (DESTINATION_COUNTRY[destination]) return DESTINATION_COUNTRY[destination];
  // Case-insensitive
  const key = Object.keys(DESTINATION_COUNTRY).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  return key ? DESTINATION_COUNTRY[key] : null;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------
interface CachedAdvisories {
  ts: number;
  data: Record<string, TravelAdvisory>; // keyed by ISO country code
}

async function getCached(): Promise<Record<string, TravelAdvisory> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedAdvisories = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) {
      AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

async function setCache(data: Record<string, TravelAdvisory>): Promise<void> {
  try {
    const payload: CachedAdvisories = { ts: Date.now(), data };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// In-memory store (loaded once per session)
// ---------------------------------------------------------------------------
let advisoryMap: Record<string, TravelAdvisory> | null = null;
let fetchPromise: Promise<void> | null = null;

/**
 * Load all travel advisories into memory. Called once, then cached.
 * The State Dept API returns all countries in one call — very efficient.
 */
async function ensureLoaded(): Promise<void> {
  if (advisoryMap) return;

  // Check AsyncStorage cache
  const cached = await getCached();
  if (cached) {
    advisoryMap = cached;
    return;
  }

  // Avoid duplicate fetches
  if (fetchPromise) {
    await fetchPromise;
    return;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch(BASE, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw: any[] = await res.json();
      if (!Array.isArray(raw)) return;

      const map: Record<string, TravelAdvisory> = {};
      for (const entry of raw) {
        // State Dept API returns objects with ISO code and advisory level
        const code = String(entry.iso_code ?? entry.ISO_Code ?? entry.isoCode ?? '').toUpperCase();
        const level = Number(entry.advisory_level ?? entry.AdvisoryLevel ?? entry.level ?? 0);
        const name = String(entry.country ?? entry.Country ?? entry.name ?? '');
        const desc = String(entry.advisory_text ?? entry.AdvisoryText ?? entry.description ?? '');
        const updated = String(entry.date_updated ?? entry.DateUpdated ?? entry.lastUpdated ?? '');

        if (code && level >= 1 && level <= 4) {
          map[code] = {
            countryCode: code,
            countryName: name,
            level: level as 1 | 2 | 3 | 4,
            levelDescription: desc,
            lastUpdated: updated,
          };
        }
      }

      if (Object.keys(map).length > 0) {
        advisoryMap = map;
        await setCache(map);
      }
    } catch {
      // Graceful degradation — feature just won't show
    } finally {
      fetchPromise = null;
    }
  })();

  await fetchPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the travel advisory for a specific destination.
 * Returns null if no data available (graceful degradation).
 */
export async function getAdvisory(destination: string): Promise<TravelAdvisory | null> {
  const country = getCountryForDestination(destination);
  if (!country) return null;

  await ensureLoaded();
  if (!advisoryMap) return null;

  return advisoryMap[country.code] ?? null;
}

/**
 * Get advisory for a country code directly (e.g., "JP", "FR").
 */
export async function getAdvisoryByCode(countryCode: string): Promise<TravelAdvisory | null> {
  await ensureLoaded();
  if (!advisoryMap) return null;
  return advisoryMap[countryCode.toUpperCase()] ?? null;
}

/**
 * Check if advisory data is available (loaded successfully).
 */
export function isAdvisoryDataLoaded(): boolean {
  return advisoryMap !== null && Object.keys(advisoryMap).length > 0;
}
