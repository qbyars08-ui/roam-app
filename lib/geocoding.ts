// =============================================================================
// ROAM — Geocoding (free, no API key)
// Uses Open-Meteo Geocoding API — city name to coordinates
// Fallback for destinations not in DESTINATION_COORDS
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  countryCode: string;
  country: string;
  population: number;
  fetchedAt: number;
}

const CACHE_KEY = 'roam_geocoding';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function geocodeCity(
  cityName: string,
): Promise<GeocodingResult | null> {
  const normalizedName = cityName.toLowerCase().trim();
  const cacheKey = `${CACHE_KEY}::${normalizedName}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: GeocodingResult = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const encoded = encodeURIComponent(cityName.trim());
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=1&language=en`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const results = data.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    const top = results[0];

    const result: GeocodingResult = {
      name: top.name ?? cityName,
      latitude: top.latitude ?? 0,
      longitude: top.longitude ?? 0,
      elevation: top.elevation ?? 0,
      timezone: top.timezone ?? '',
      countryCode: top.country_code ?? '',
      country: top.country ?? '',
      population: top.population ?? 0,
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
 * Get coordinates for a destination, trying the offline DESTINATION_COORDS first
 * (from air-quality.ts), then falling back to Open-Meteo geocoding.
 */
export async function resolveCoordinates(
  destination: string,
  offlineCoords: { lat: number; lng: number } | null,
): Promise<{ lat: number; lng: number } | null> {
  if (offlineCoords) return offlineCoords;

  const geo = await geocodeCity(destination);
  if (!geo) return null;

  return { lat: geo.latitude, lng: geo.longitude };
}
