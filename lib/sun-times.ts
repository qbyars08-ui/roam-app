// =============================================================================
// ROAM — Sunrise / Sunset times (free, no API key)
// Uses sunrise-sunset.org free API
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SunTimes {
  sunrise: string;   // HH:MM local
  sunset: string;    // HH:MM local
  goldenHour: string; // HH:MM local (evening)
  dayLength: string; // e.g. "13h 42m"
  fetchedAt: number;
}

const CACHE_KEY = 'roam_sun_times';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function formatTime(isoTime: string): string {
  const date = new Date(isoTime);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDayLength(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export async function getSunTimes(
  lat: number,
  lng: number,
  date?: string, // YYYY-MM-DD
): Promise<SunTimes | null> {
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  const cacheKey = `${CACHE_KEY}::${lat.toFixed(2)}_${lng.toFixed(2)}_${dateStr}`;

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: SunTimes = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss, continue
  }

  try {
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateStr}&formatted=0`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'OK') return null;

    const result: SunTimes = {
      sunrise: formatTime(data.results.sunrise),
      sunset: formatTime(data.results.sunset),
      goldenHour: formatTime(data.results.civil_twilight_end),
      dayLength: formatDayLength(data.results.day_length),
      fetchedAt: Date.now(),
    };

    // Cache result
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
