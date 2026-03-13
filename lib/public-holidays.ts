// =============================================================================
// ROAM — Public Holidays (free, no API key)
// Uses Nager.Date API — free, open source, no registration
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PublicHoliday {
  date: string;      // YYYY-MM-DD
  name: string;      // e.g. "Golden Week"
  localName: string;  // Name in local language
  isFixed: boolean;
  isGlobal: boolean;
}

const CACHE_KEY = 'roam_holidays';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ISO 3166-1 alpha-2 codes for ROAM destinations
const DESTINATION_COUNTRY_CODES: Record<string, string> = {
  'tokyo': 'JP', 'kyoto': 'JP', 'osaka': 'JP',
  'paris': 'FR', 'lyon': 'FR', 'nice': 'FR',
  'bali': 'ID', 'jakarta': 'ID',
  'bangkok': 'TH', 'chiang mai': 'TH', 'phuket': 'TH',
  'new york': 'US', 'los angeles': 'US', 'miami': 'US',
  'barcelona': 'ES', 'madrid': 'ES', 'seville': 'ES',
  'rome': 'IT', 'florence': 'IT', 'milan': 'IT', 'venice': 'IT',
  'london': 'GB', 'edinburgh': 'GB',
  'marrakech': 'MA', 'fez': 'MA',
  'lisbon': 'PT', 'porto': 'PT',
  'seoul': 'KR', 'busan': 'KR',
  'budapest': 'HU',
  'istanbul': 'TR', 'cappadocia': 'TR',
  'mexico city': 'MX', 'oaxaca': 'MX', 'cancun': 'MX',
  'amsterdam': 'NL',
  'dubai': 'AE',
  'cape town': 'ZA', 'johannesburg': 'ZA',
  'sydney': 'AU', 'melbourne': 'AU',
  'buenos aires': 'AR', 'mendoza': 'AR',
  'tbilisi': 'GE', 'batumi': 'GE',
  'hoi an': 'VN', 'hanoi': 'VN', 'ho chi minh': 'VN',
  'dubrovnik': 'HR', 'split': 'HR', 'zagreb': 'HR',
  'cartagena': 'CO', 'medellin': 'CO', 'medellín': 'CO', 'bogota': 'CO',
  'jaipur': 'IN', 'delhi': 'IN', 'mumbai': 'IN', 'goa': 'IN',
  'queenstown': 'NZ', 'auckland': 'NZ',
  'reykjavik': 'IS',
};

export function getCountryCode(destination: string): string | null {
  return DESTINATION_COUNTRY_CODES[destination.toLowerCase().trim()] ?? null;
}

export async function getPublicHolidays(
  countryCode: string,
  year?: number,
): Promise<PublicHoliday[]> {
  const yr = year ?? new Date().getFullYear();
  const cacheKey = `${CACHE_KEY}::${countryCode}_${yr}`;

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed.holidays;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${yr}/${countryCode}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    const holidays: PublicHoliday[] = data.map((h: Record<string, unknown>) => ({
      date: h.date as string,
      name: h.name as string,
      localName: h.localName as string,
      isFixed: h.fixed as boolean,
      isGlobal: h.global as boolean,
    }));

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        holidays,
        fetchedAt: Date.now(),
      }));
    } catch {
      // Non-critical
    }

    return holidays;
  } catch {
    return [];
  }
}

/**
 * Get holidays that overlap with a trip's date range.
 */
export function getHolidaysDuringTrip(
  holidays: PublicHoliday[],
  startDate: string,
  days: number,
): PublicHoliday[] {
  const start = new Date(startDate);
  const end = new Date(startDate);
  end.setDate(end.getDate() + days);

  return holidays.filter((h) => {
    const d = new Date(h.date);
    return d >= start && d <= end;
  });
}
