// =============================================================================
// ROAM — Weather Forecast Cache (6 hours)
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeatherForecast } from './weather';

const CACHE_PREFIX = 'roam_weather_';
const TTL_MS = 6 * 60 * 60 * 1000;

function cacheKey(destination: string, startDate?: string): string {
  return CACHE_PREFIX + destination.toLowerCase().replace(/\s+/g, '_') + (startDate ?? '');
}

export async function getCachedForecast(
  destination: string,
  startDate?: string
): Promise<WeatherForecast | null> {
  try {
    const key = cacheKey(destination, startDate);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > TTL_MS) return null;
    return data as WeatherForecast;
  } catch {
    return null;
  }
}

export async function setCachedForecast(
  destination: string,
  forecast: WeatherForecast,
  startDate?: string
): Promise<void> {
  try {
    const key = cacheKey(destination, startDate);
    await AsyncStorage.setItem(key, JSON.stringify({
      data: forecast,
      cachedAt: Date.now(),
    }));
  } catch {
    // ignore
  }
}
