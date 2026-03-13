// =============================================================================
// ROAM — Timezone utilities (free, no API key)
// Uses WorldTimeAPI — free, no registration needed
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TimezoneInfo {
  timezone: string;       // e.g. "Asia/Tokyo"
  abbreviation: string;   // e.g. "JST"
  utcOffset: string;      // e.g. "+09:00"
  currentTime: string;    // HH:MM local
  isDst: boolean;
  fetchedAt: number;
}

const CACHE_KEY = 'roam_timezone';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (timezones rarely change)

// Common destination → timezone mapping for offline fallback
const DESTINATION_TIMEZONES: Record<string, string> = {
  'tokyo': 'Asia/Tokyo',
  'kyoto': 'Asia/Tokyo',
  'osaka': 'Asia/Tokyo',
  'paris': 'Europe/Paris',
  'barcelona': 'Europe/Madrid',
  'rome': 'Europe/Rome',
  'london': 'Europe/London',
  'bangkok': 'Asia/Bangkok',
  'chiang mai': 'Asia/Bangkok',
  'bali': 'Asia/Makassar',
  'istanbul': 'Europe/Istanbul',
  'budapest': 'Europe/Budapest',
  'lisbon': 'Europe/Lisbon',
  'porto': 'Europe/Lisbon',
  'seoul': 'Asia/Seoul',
  'marrakech': 'Africa/Casablanca',
  'new york': 'America/New_York',
  'mexico city': 'America/Mexico_City',
  'oaxaca': 'America/Mexico_City',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'cape town': 'Africa/Johannesburg',
  'dubai': 'Asia/Dubai',
  'sydney': 'Australia/Sydney',
  'amsterdam': 'Europe/Amsterdam',
  'reykjavik': 'Atlantic/Reykjavik',
  'tbilisi': 'Asia/Tbilisi',
  'hoi an': 'Asia/Ho_Chi_Minh',
  'dubrovnik': 'Europe/Zagreb',
  'cartagena': 'America/Bogota',
  'medellín': 'America/Bogota',
  'medellin': 'America/Bogota',
  'jaipur': 'Asia/Kolkata',
  'queenstown': 'Pacific/Auckland',
};

export function getTimezoneByDestination(destination: string): string | null {
  const key = destination.toLowerCase().trim();
  return DESTINATION_TIMEZONES[key] ?? null;
}

export async function getTimezoneInfo(timezone: string): Promise<TimezoneInfo | null> {
  const cacheKey = `${CACHE_KEY}::${timezone}`;

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: TimezoneInfo = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const url = `https://worldtimeapi.org/api/timezone/${timezone}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();

    const dt = new Date(data.datetime);
    const hours = dt.getHours().toString().padStart(2, '0');
    const minutes = dt.getMinutes().toString().padStart(2, '0');

    const result: TimezoneInfo = {
      timezone: data.timezone,
      abbreviation: data.abbreviation,
      utcOffset: data.utc_offset,
      currentTime: `${hours}:${minutes}`,
      isDst: data.dst,
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
 * Get the time difference between the user's local timezone and destination.
 * Returns a human-readable string like "+7 hours" or "-3 hours".
 */
export function getTimeDifference(destUtcOffset: string): string {
  const localOffsetMinutes = -new Date().getTimezoneOffset();

  // Parse destination offset like "+09:00" or "-05:00"
  const match = destUtcOffset.match(/([+-])(\d{2}):(\d{2})/);
  if (!match) return '';

  const sign = match[1] === '+' ? 1 : -1;
  const destOffsetMinutes = sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));

  const diffMinutes = destOffsetMinutes - localOffsetMinutes;
  const diffHours = diffMinutes / 60;

  if (diffHours === 0) return 'Same timezone';
  const prefix = diffHours > 0 ? '+' : '';
  const unit = Math.abs(diffHours) === 1 ? 'hour' : 'hours';
  return `${prefix}${diffHours} ${unit}`;
}
