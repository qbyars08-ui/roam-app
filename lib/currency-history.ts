// =============================================================================
// ROAM — Currency Exchange Rate History (free, no API key)
// Uses Frankfurter API — completely free, no registration
// Fetches 30-day exchange rate history with caching
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CurrencyPoint {
  date: string;
  rate: number;
}

export interface CurrencyHistory {
  base: string;
  target: string;
  points: CurrencyPoint[];
  change30d: number;
  fetchedAt: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Destination → ISO currency code mapping
const DESTINATION_CURRENCIES: Record<string, string> = {
  'tokyo': 'JPY',
  'kyoto': 'JPY',
  'osaka': 'JPY',
  'yokohama': 'JPY',
  'japan': 'JPY',

  'paris': 'EUR',
  'london': 'GBP',
  'madrid': 'EUR',
  'barcelona': 'EUR',
  'berlin': 'EUR',
  'amsterdam': 'EUR',
  'rome': 'EUR',
  'lisbon': 'EUR',
  'budapest': 'EUR',
  'prague': 'EUR',
  'vienna': 'EUR',
  'athens': 'EUR',
  'brussels': 'EUR',
  'zurich': 'CHF',
  'geneva': 'CHF',
  'istanbul': 'TRY',
  'cappadocia': 'TRY',

  'bangkok': 'THB',
  'phuket': 'THB',
  'chiang mai': 'THB',
  'thailand': 'THB',

  'bali': 'IDR',
  'jakarta': 'IDR',
  'indonesia': 'IDR',

  'seoul': 'KRW',
  'busan': 'KRW',
  'korea': 'KRW',

  'marrakech': 'MAD',
  'fez': 'MAD',
  'casablanca': 'MAD',
  'morocco': 'MAD',

  'mexico city': 'MXN',
  'cancun': 'MXN',
  'playa del carmen': 'MXN',
  'mexico': 'MXN',

  'buenos aires': 'ARS',
  'argentina': 'ARS',

  'cape town': 'ZAR',
  'johannesburg': 'ZAR',
  'south africa': 'ZAR',

  'dubai': 'AED',
  'abu dhabi': 'AED',
  'uae': 'AED',

  'sydney': 'AUD',
  'melbourne': 'AUD',
  'australia': 'AUD',

  'auckland': 'NZD',
  'new zealand': 'NZD',

  'bogota': 'COP',
  'cartagena': 'COP',
  'colombia': 'COP',
  'medellin': 'COP',

  'reykjavik': 'ISK',
  'iceland': 'ISK',

  'tbilisi': 'GEL',
  'georgia': 'GEL',

  'hanoi': 'VND',
  'ho chi minh': 'VND',
  'hoi an': 'VND',
  'vietnam': 'VND',

  'jaipur': 'INR',
  'delhi': 'INR',
  'mumbai': 'INR',
  'india': 'INR',
  'goa': 'INR',
};

export function getDestinationCurrency(destination: string): string | null {
  return DESTINATION_CURRENCIES[destination.toLowerCase().trim()] ?? null;
}

/**
 * Fetches 30-day currency exchange rate history from Frankfurter API.
 * Caches results for 24 hours in AsyncStorage.
 *
 * @param base - Base currency code (e.g., 'USD')
 * @param target - Target currency code (e.g., 'EUR')
 * @returns CurrencyHistory with historical points and 30-day percentage change, or null on error
 */
export async function getCurrencyHistory(
  base: string,
  target: string
): Promise<CurrencyHistory | null> {
  // Validate inputs
  if (typeof base !== 'string' || typeof target !== 'string') {
    return null;
  }

  const normalizedBase = base.toUpperCase().trim();
  const normalizedTarget = target.toUpperCase().trim();

  if (!normalizedBase || !normalizedTarget || normalizedBase === normalizedTarget) {
    return null;
  }

  const cacheKey = `roam_currency_history::${normalizedBase}_${normalizedTarget}`;

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'fetchedAt' in parsed &&
        typeof parsed.fetchedAt === 'number'
      ) {
        const history = parsed as CurrencyHistory;
        if (Date.now() - history.fetchedAt < CACHE_TTL) {
          return history;
        }
      }
    }
  } catch {
    // Cache miss or parse error — proceed with fetch
  }

  try {
    // Calculate 30-day date range (30 days ago to today)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDate = formatDate(thirtyDaysAgo);
    const endDate = formatDate(today);

    const url = `https://api.frankfurter.app/${startDate}..${endDate}?from=${normalizedBase}&to=${normalizedTarget}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json() as unknown;

    // Type guard: validate response structure
    if (
      typeof data !== 'object' ||
      data === null ||
      !('rates' in data) ||
      typeof data.rates !== 'object' ||
      data.rates === null
    ) {
      return null;
    }

    const rates = data.rates as Record<string, unknown>;
    const points: CurrencyPoint[] = [];

    // Extract rates into CurrencyPoint array, sorted by date
    for (const [dateStr, rateObj] of Object.entries(rates)) {
      if (typeof rateObj === 'object' && rateObj !== null && normalizedTarget in rateObj) {
        const rate = rateObj[normalizedTarget as keyof typeof rateObj];
        if (typeof rate === 'number') {
          points.push({ date: dateStr, rate });
        }
      }
    }

    // Sort by date ascending
    points.sort((a, b) => a.date.localeCompare(b.date));

    if (points.length < 2) {
      return null;
    }

    // Calculate 30-day percentage change
    const firstRate = points[0].rate;
    const lastRate = points[points.length - 1].rate;
    const change30d = ((lastRate - firstRate) / firstRate) * 100;

    const result: CurrencyHistory = {
      base: normalizedBase,
      target: normalizedTarget,
      points,
      change30d,
      fetchedAt: Date.now(),
    };

    // Cache result
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Non-critical cache failure
    }

    return result;
  } catch {
    // Network or parse error
    return null;
  }
}
