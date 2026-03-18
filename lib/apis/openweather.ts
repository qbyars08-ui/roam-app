// ROAM — OpenWeather API Client (via weather-intel edge function)
// Server uses OPENWEATHERMAP_KEY; returns 7-day intel (days, summary, packingAdvice).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { ensureValidSession } from '../ensure-session';

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  uvIndex: number | null;
}

export interface ForecastDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  rainChance: number;
}

export interface WeatherIntel {
  destination: string;
  days: Array<{
    date: string;
    tempHigh: number;
    tempLow: number;
    description: string;
    icon: string;
    rainChance: number;
    humidity: number;
    windSpeed: number;
  }>;
  summary: string;
  packingAdvice: string[];
  itineraryTips: string[];
  bestOutdoorDays: number[];
  rainyDays: number[];
}

const PREFIX = 'roam_owm_';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + TTL_MS };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // silently skip — cache is best-effort
  }
}

/** Fetch full 7-day weather intel from weather-intel edge (OPENWEATHERMAP_KEY). */
export async function getWeatherIntel(destination: string): Promise<WeatherIntel | null> {
  const cacheKey = `intel_${destination.toLowerCase().trim()}`;
  const cached = await readCache<WeatherIntel>(cacheKey);
  if (cached) return cached;

  // Guard: edge function requires an authenticated session
  if (!(await ensureValidSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('weather-intel', {
      body: { destination },
    });
    if (error || !data?.days) return null;

    const intel = data as WeatherIntel;
    await writeCache(cacheKey, intel);
    return intel;
  } catch {
    return null;
  }
}

/** Current weather derived from first day of weather-intel. */
export async function getCurrentWeather(destination: string): Promise<CurrentWeather | null> {
  const cacheKey = `current_${destination.toLowerCase().trim()}`;
  const cached = await readCache<CurrentWeather>(cacheKey);
  if (cached) return cached;

  const intel = await getWeatherIntel(destination);
  if (!intel?.days?.[0]) return null;

  const d = intel.days[0];
  const temp = Math.round((d.tempHigh + d.tempLow) / 2);
  const result: CurrentWeather = {
    temp,
    feelsLike: temp,
    condition: d.description,
    icon: d.icon,
    humidity: d.humidity,
    windSpeed: Math.round(d.windSpeed * 3.6),
    uvIndex: null,
  };
  await writeCache(cacheKey, result);
  return result;
}

/** 7-day forecast from weather-intel. */
export async function getForecast(destination: string): Promise<ForecastDay[] | null> {
  const cacheKey = `forecast_${destination.toLowerCase().trim()}`;
  const cached = await readCache<ForecastDay[]>(cacheKey);
  if (cached) return cached;

  const intel = await getWeatherIntel(destination);
  if (!intel?.days?.length) return null;

  const result: ForecastDay[] = intel.days.map((d) => ({
    date: d.date,
    tempHigh: d.tempHigh,
    tempLow: d.tempLow,
    condition: d.description,
    icon: d.icon,
    rainChance: d.rainChance,
  }));
  await writeCache(cacheKey, result);
  return result;
}
