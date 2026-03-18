// ROAM — Rome2Rio API Client (via travel-proxy edge function)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export interface RouteResult {
  name: string;
  mode: 'flight' | 'train' | 'bus' | 'ferry' | 'car' | 'walk';
  duration: number; // minutes
  price: { low: number; high: number; currency: string } | null;
  segments: RouteSegment[];
  bookingUrl: string | null;
}

export interface RouteSegment {
  mode: string;
  from: string;
  to: string;
  duration: number;
  operator: string | null;
}

const PREFIX = 'roam_r2r_';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

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
    // best-effort
  }
}

export async function getRoutes(
  origin: string,
  destination: string,
): Promise<RouteResult[] | null> {
  const cacheKey = `${origin.toLowerCase().trim()}|${destination.toLowerCase().trim()}`;
  const cached = await readCache<RouteResult[]>(cacheKey);
  if (cached) return cached;

  // Guard: edge function requires an authenticated session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: {
        provider: 'rome2rio',
        action: 'get_routes',
        params: { origin, destination },
      },
    });
    if (error || !data?.data) return null;

    const result: RouteResult[] = data.data;
    await writeCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
