// ROAM — Mapbox API Client (client-side, key in EXPO_PUBLIC_MAPBOX_TOKEN)

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GeoResult {
  lat: number;
  lng: number;
  placeName: string;
}

export interface DirectionsResult {
  distance: number; // meters
  duration: number; // seconds
  geometry: string; // encoded polyline
  steps: DirectionStep[];
}

export interface DirectionStep {
  instruction: string;
  distance: number;
  duration: number;
}

const PREFIX = 'roam_mapbox_';
const GEO_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DIR_TTL_MS = 60 * 60 * 1000; // 1 hour

const BASE_URL = 'https://api.mapbox.com';

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

async function writeCache<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttl };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // best-effort
  }
}

function getToken(): string | null {
  return process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? null;
}

export async function geocode(address: string): Promise<GeoResult | null> {
  const cacheKey = `geo_${address.toLowerCase().trim()}`;
  const cached = await readCache<GeoResult>(cacheKey);
  if (cached) return cached;

  const token = getToken();
  if (!token) return null;

  try {
    const encoded = encodeURIComponent(address);
    const url = `${BASE_URL}/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const feature = json?.features?.[0];
    if (!feature) return null;

    const result: GeoResult = {
      lat: feature.center[1],
      lng: feature.center[0],
      placeName: feature.place_name,
    };
    await writeCache(cacheKey, result, GEO_TTL_MS);
    return result;
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const cacheKey = `rgeo_${lat.toFixed(4)}_${lng.toFixed(4)}`;
  const cached = await readCache<string>(cacheKey);
  if (cached) return cached;

  const token = getToken();
  if (!token) return null;

  try {
    const url = `${BASE_URL}/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const placeName: string = json?.features?.[0]?.place_name ?? null;
    if (!placeName) return null;

    await writeCache(cacheKey, placeName, GEO_TTL_MS);
    return placeName;
  } catch {
    return null;
  }
}

export async function getDirections(
  origin: [number, number],
  destination: [number, number],
  mode: 'driving' | 'walking' | 'cycling' = 'driving',
): Promise<DirectionsResult | null> {
  const cacheKey = `dir_${mode}_${origin.join(',')}_${destination.join(',')}`;
  const cached = await readCache<DirectionsResult>(cacheKey);
  if (cached) return cached;

  const token = getToken();
  if (!token) return null;

  try {
    const coords = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
    const profile = mode === 'cycling' ? 'cycling' : mode === 'walking' ? 'walking' : 'driving';
    const url =
      `${BASE_URL}/directions/v5/mapbox/${profile}/${coords}` +
      `?access_token=${token}&geometries=polyline&steps=true&overview=simplified`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route) return null;

    const steps: DirectionStep[] = (route.legs?.[0]?.steps ?? []).map((s: any) => ({
      instruction: s.maneuver?.instruction ?? '',
      distance: s.distance,
      duration: s.duration,
    }));

    const result: DirectionsResult = {
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps,
    };
    await writeCache(cacheKey, result, DIR_TTL_MS);
    return result;
  } catch {
    return null;
  }
}
