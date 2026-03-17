// ROAM — Google Places API Client (via places-proxy edge function)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { trackEvent } from '../analytics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaceResult {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingsTotal: number;
  priceLevel: number | null;
  vicinity: string;
  location: { lat: number; lng: number };
  types: string[];
  photoRef: string | null;
  openNow: boolean | null;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingsTotal: number;
  priceLevel: number | null;
  address: string;
  phone: string | null;
  website: string | null;
  hours: string[] | null;
  location: { lat: number; lng: number };
  photos: string[];
  reviews: PlaceReview[];
}

export interface PlaceReview {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashParams(params: Record<string, unknown>): string {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .slice(0, 64);
}

function cacheKey(action: string, params: Record<string, unknown>): string {
  return `roam_places_${action}_${hashParams(params)}`;
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw) as { data: T; expiresAt: number };
    if (Date.now() > expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }),
    );
  } catch {
    // Silent — cache write failure never blocks caller
  }
}

// ---------------------------------------------------------------------------
// Session helper — mirrors claude.ts pattern
// ---------------------------------------------------------------------------

async function ensureSession(): Promise<void> {
  const session = useAppStore.getState().session;
  const needsUpgrade =
    !session ||
    !session.access_token ||
    String(session.user?.id).startsWith('guest-');

  if (!needsUpgrade) {
    const { data: { session: refreshed } } = await supabase.auth.getSession();
    if (refreshed && refreshed.access_token !== session?.access_token) {
      useAppStore.getState().setSession(refreshed);
    }
    return;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (!error && data.session) {
    useAppStore.getState().setSession(data.session);
  }
}

// ---------------------------------------------------------------------------
// Proxy invoker — shared error handling, never throws
// ---------------------------------------------------------------------------

/** Response from places-proxy: { data: result, cached?: boolean } */
async function invokePlacesProxy<T>(
  action: string,
  params: Record<string, unknown>,
): Promise<T | null> {
  try {
    await ensureSession();
    const { data, error } = await supabase.functions.invoke('places-proxy', {
      body: { action, params },
    });
    if (error || !data) return null;
    const payload = data as { data?: T; cached?: boolean };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// searchNearby
// ---------------------------------------------------------------------------

export async function searchNearby(
  lat: number,
  lng: number,
  type: string,
  radius = 1500,
): Promise<PlaceResult[] | null> {
  const params = { lat, lng, type, radius };
  const key = cacheKey('searchNearby', params);

  const cached = await readCache<PlaceResult[]>(key);
  if (cached) return cached;

  const result = await invokePlacesProxy<PlaceResult[]>('search_nearby', params);
  if (!result) {
    trackEvent('places_search_nearby_error', { lat, lng, type }).catch(() => {});
    return null;
  }

  await writeCache(key, result);
  trackEvent('places_search_nearby', { type, count: result.length }).catch(() => {});
  return result;
}

// ---------------------------------------------------------------------------
// getPlaceDetails
// ---------------------------------------------------------------------------

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const params = { placeId };
  const key = cacheKey('getPlaceDetails', params);

  const cached = await readCache<PlaceDetails>(key);
  if (cached) return cached;

  const result = await invokePlacesProxy<PlaceDetails>('place_details', params);
  if (!result) {
    trackEvent('places_details_error', { placeId }).catch(() => {});
    return null;
  }

  await writeCache(key, result);
  trackEvent('places_details', { placeId }).catch(() => {});
  return result;
}

// ---------------------------------------------------------------------------
// getPlacePhotos — returns photo URLs
// ---------------------------------------------------------------------------

export async function getPlacePhotos(
  placeId: string,
  maxPhotos = 5,
): Promise<string[] | null> {
  const params = { placeId, maxPhotos };
  const key = cacheKey('getPlacePhotos', params);

  const cached = await readCache<string[]>(key);
  if (cached) return cached;

  const result = await invokePlacesProxy<string[]>('place_photos', params);
  if (!result) {
    trackEvent('places_photos_error', { placeId }).catch(() => {});
    return null;
  }

  await writeCache(key, result);
  trackEvent('places_photos', { placeId, count: result.length }).catch(() => {});
  return result;
}
