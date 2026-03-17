// ROAM — Foursquare Places Client (via travel-proxy edge function)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FSQPlace {
  fsqId: string;
  name: string;
  category: string;
  address: string;
  distance: number; // meters
  rating: number | null;
  price: number | null; // 1-4
  location: { lat: number; lng: number };
  photoUrl: string | null;
}

export interface FSQPlaceDetails {
  fsqId: string;
  name: string;
  category: string;
  address: string;
  phone: string | null;
  website: string | null;
  hours: string[] | null;
  rating: number | null;
  price: number | null;
  photos: string[];
  tips: FSQTip[];
  socialMedia: Record<string, string>;
}

export interface FSQTip {
  text: string;
  agreeCount: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Cache constants
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'roam_fsq_';
const TTL = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw) as { data: T; fetchedAt: number };
    if (Date.now() - fetchedAt > TTL) return null;
    return data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, fetchedAt: Date.now() }),
    );
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Session guard
// ---------------------------------------------------------------------------

async function ensureSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchPlaces(
  query: string,
  lat: number,
  lng: number,
  categories?: string[],
  radius?: number,
): Promise<FSQPlace[] | null> {
  const cacheKey = `search_${query}_${lat}_${lng}_${categories?.join(',') ?? 'all'}_${radius ?? 'default'}`;
  const cached = await readCache<FSQPlace[]>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: {
        provider: 'foursquare',
        action: 'search_places',
        params: { query, lat, lng, categories, radius },
      },
    });
    if (error || !data?.data) return null;

    const places = data.data as FSQPlace[];
    await writeCache(cacheKey, places);
    return places;
  } catch {
    return null;
  }
}

export async function getPlaceDetails(
  fsqId: string,
): Promise<FSQPlaceDetails | null> {
  const cacheKey = `details_${fsqId}`;
  const cached = await readCache<FSQPlaceDetails>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: { provider: 'foursquare', action: 'place_details', params: { fsqId } },
    });
    if (error || !data?.data) return null;

    const place = data.data as FSQPlaceDetails;
    await writeCache(cacheKey, place);
    return place;
  } catch {
    return null;
  }
}

export async function getPlaceTips(
  fsqId: string,
): Promise<FSQTip[] | null> {
  const cacheKey = `tips_${fsqId}`;
  const cached = await readCache<FSQTip[]>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: { provider: 'foursquare', action: 'place_tips', params: { fsqId } },
    });
    if (error || !data?.data) return null;

    const tips = data.data as FSQTip[];
    await writeCache(cacheKey, tips);
    return tips;
  } catch {
    return null;
  }
}
