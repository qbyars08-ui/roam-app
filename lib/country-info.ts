// =============================================================================
// ROAM — Country Info (free, no API key)
// Uses REST Countries API v3.1 — comprehensive country data
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CountryInfo {
  name: string;
  officialName: string;
  capital: string;
  region: string;
  subregion: string;
  population: number;
  languages: Record<string, string>;  // { jpn: "Japanese" }
  currencies: CurrencyEntry[];
  drivingSide: 'left' | 'right';
  callingCode: string;               // e.g. "+81"
  flagUrl: string;                    // SVG URL
  flagEmoji: string;                  // Unicode flag emoji fallback
  timezones: string[];
  fetchedAt: number;
}

interface CurrencyEntry {
  code: string;
  name: string;
  symbol: string;
}

const CACHE_KEY = 'roam_country_info';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

const FIELDS = [
  'name', 'languages', 'currencies', 'capital', 'region', 'subregion',
  'population', 'idd', 'car', 'flags', 'timezones', 'flag',
].join(',');

export async function getCountryInfo(
  countryCode: string,
): Promise<CountryInfo | null> {
  const code = countryCode.toUpperCase();
  const cacheKey = `${CACHE_KEY}::${code}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: CountryInfo = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const url = `https://restcountries.com/v3.1/alpha/${code}?fields=${FIELDS}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    const currencies: CurrencyEntry[] = [];
    if (data.currencies) {
      for (const [currCode, info] of Object.entries(data.currencies)) {
        const typed = info as { name?: string; symbol?: string };
        currencies.push({
          code: currCode,
          name: typed.name ?? currCode,
          symbol: typed.symbol ?? currCode,
        });
      }
    }

    let callingCode = '';
    if (data.idd?.root) {
      const suffix = data.idd.suffixes?.[0] ?? '';
      callingCode = `${data.idd.root}${suffix}`;
    }

    const result: CountryInfo = {
      name: data.name?.common ?? '',
      officialName: data.name?.official ?? '',
      capital: Array.isArray(data.capital) ? data.capital[0] ?? '' : '',
      region: data.region ?? '',
      subregion: data.subregion ?? '',
      population: data.population ?? 0,
      languages: data.languages ?? {},
      currencies,
      drivingSide: data.car?.side === 'left' ? 'left' : 'right',
      callingCode,
      flagUrl: data.flags?.svg ?? data.flags?.png ?? '',
      flagEmoji: data.flag ?? '',
      timezones: data.timezones ?? [],
      fetchedAt: Date.now(),
    };

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Non-critical
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Get a comma-separated string of official languages.
 */
export function formatLanguages(info: CountryInfo): string {
  return Object.values(info.languages).join(', ');
}

/**
 * Get a human-readable population string.
 */
export function formatPopulation(pop: number): string {
  if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(0)}K`;
  return pop.toString();
}

/**
 * Get a brief driving side note for the destination.
 */
export function getDrivingSideNote(side: 'left' | 'right'): string {
  return side === 'left'
    ? 'Drives on the LEFT. Look right first when crossing streets.'
    : 'Drives on the RIGHT. Standard for most countries.';
}
