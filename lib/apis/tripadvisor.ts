// ROAM — TripAdvisor API Client (via travel-proxy edge function)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TALocation {
  locationId: string;
  name: string;
  rating: number | null;
  numReviews: number;
  priceLevel: string | null;
  category: string;
  address: string;
  photoUrl: string | null;
}

export interface TALocationDetails {
  locationId: string;
  name: string;
  rating: number | null;
  numReviews: number;
  priceLevel: string | null;
  address: string;
  phone: string | null;
  website: string | null;
  hours: string[] | null;
  photos: string[];
  cuisine: string[];
  rankingString: string | null;
}

export interface TAReview {
  id: string;
  rating: number;
  title: string;
  text: string;
  author: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Cache constants
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'roam_ta_';
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

export async function searchLocations(
  destination: string,
  category?: 'restaurants' | 'hotels' | 'attractions',
): Promise<TALocation[] | null> {
  const cacheKey = `search_${destination}_${category ?? 'all'}`;
  const cached = await readCache<TALocation[]>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: { provider: 'tripadvisor', action: 'searchLocations', params: { destination, category } },
    });
    if (error || !data?.locations) return null;

    const locations = data.locations as TALocation[];
    await writeCache(cacheKey, locations);
    return locations;
  } catch {
    return null;
  }
}

export async function getLocationDetails(
  locationId: string,
): Promise<TALocationDetails | null> {
  const cacheKey = `details_${locationId}`;
  const cached = await readCache<TALocationDetails>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: { provider: 'tripadvisor', action: 'getLocationDetails', params: { locationId } },
    });
    if (error || !data?.details) return null;

    const details = data.details as TALocationDetails;
    await writeCache(cacheKey, details);
    return details;
  } catch {
    return null;
  }
}

export async function getLocationReviews(
  locationId: string,
): Promise<TAReview[] | null> {
  const cacheKey = `reviews_${locationId}`;
  const cached = await readCache<TAReview[]>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: { provider: 'tripadvisor', action: 'getLocationReviews', params: { locationId } },
    });
    if (error || !data?.reviews) return null;

    const reviews = data.reviews as TAReview[];
    await writeCache(cacheKey, reviews);
    return reviews;
  } catch {
    return null;
  }
}
