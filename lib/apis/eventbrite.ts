// ROAM — Eventbrite API Client (via travel-proxy edge function)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { ensureValidSession } from '../ensure-session';

export interface EventResult {
  id: string;
  name: string;
  date: string;
  endDate: string | null;
  venue: string;
  address: string;
  price: string | null;
  currency: string | null;
  url: string;
  category: string;
  imageUrl: string | null;
  isFree: boolean;
}

const PREFIX = 'roam_events_api_';
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
    // best-effort
  }
}

export async function searchEvents(
  destination: string,
  startDate?: string,
  endDate?: string,
  categories?: string[],
): Promise<EventResult[] | null> {
  const cacheKey = [
    destination.toLowerCase().trim(),
    startDate ?? '',
    endDate ?? '',
    (categories ?? []).sort().join(','),
  ].join('|');

  const cached = await readCache<EventResult[]>(cacheKey);
  if (cached) return cached;

  // Guard: edge function requires an authenticated session
  if (!(await ensureValidSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: {
        provider: 'eventbrite',
        action: 'search_events',
        params: { destination, startDate, endDate, categories },
      },
    });
    if (error || !data?.data) return null;

    const result: EventResult[] = data.data;
    await writeCache(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
