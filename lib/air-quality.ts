// =============================================================================
// ROAM — Air Quality Index (free, no API key)
// Uses Open-Meteo Air Quality API — completely free, no registration
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AirQuality {
  aqi: number;          // US AQI (0-500)
  label: string;        // 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | etc.
  color: string;        // hex color for UI
  pm25: number;         // PM2.5 µg/m³
  pm10: number;         // PM10 µg/m³
  advice: string;       // Short travel advice
  fetchedAt: number;
}

const CACHE_KEY = 'roam_air_quality';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

// Offline coordinate lookup for ROAM destinations (for AQI + sun times)
const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'kyoto': { lat: 35.0116, lng: 135.7681 },
  'bali': { lat: -8.3405, lng: 115.0920 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'barcelona': { lat: 41.3874, lng: 2.1686 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'marrakech': { lat: 31.6295, lng: -7.9811 },
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'seoul': { lat: 37.5665, lng: 126.9780 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'medellín': { lat: 6.2442, lng: -75.5812 },
  'medellin': { lat: 6.2442, lng: -75.5812 },
  'tbilisi': { lat: 41.7151, lng: 44.8271 },
  'dubrovnik': { lat: 42.6507, lng: 18.0944 },
  'reykjavik': { lat: 64.1466, lng: -21.9426 },
  'hoi an': { lat: 15.8801, lng: 108.3380 },
  'cartagena': { lat: 10.3910, lng: -75.5144 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'queenstown': { lat: -45.0312, lng: 168.6626 },
};

export function getDestinationCoords(destination: string): { lat: number; lng: number } | null {
  return DESTINATION_COORDS[destination.toLowerCase().trim()] ?? null;
}

/**
 * Resolve coordinates for any destination: tries offline lookup first,
 * then falls back to Open-Meteo geocoding API.
 */
export async function resolveDestinationCoords(
  destination: string,
): Promise<{ lat: number; lng: number } | null> {
  const offline = getDestinationCoords(destination);
  if (offline) return offline;

  // Lazy import to avoid circular dependency
  const { geocodeCity } = await import('./geocoding');
  const geo = await geocodeCity(destination);
  if (!geo) return null;
  return { lat: geo.latitude, lng: geo.longitude };
}

function getAqiInfo(aqi: number): { label: string; color: string; advice: string } {
  if (aqi <= 50) return {
    label: 'Good',
    color: '#4CAF50',
    advice: 'Air quality is great — enjoy outdoor activities.',
  };
  if (aqi <= 100) return {
    label: 'Moderate',
    color: '#FFC107',
    advice: 'Acceptable for most. Sensitive travelers may notice mild effects.',
  };
  if (aqi <= 150) return {
    label: 'Unhealthy for Sensitive Groups',
    color: '#FF9800',
    advice: 'Consider limiting prolonged outdoor exertion if you have respiratory issues.',
  };
  if (aqi <= 200) return {
    label: 'Unhealthy',
    color: '#F44336',
    advice: 'Limit outdoor activities. Wear a mask if walking outside for extended periods.',
  };
  if (aqi <= 300) return {
    label: 'Very Unhealthy',
    color: '#9C27B0',
    advice: 'Avoid prolonged outdoor activities. Consider indoor alternatives.',
  };
  return {
    label: 'Hazardous',
    color: '#7B1FA2',
    advice: 'Stay indoors. Reschedule outdoor plans if possible.',
  };
}

export async function getAirQuality(
  lat: number,
  lng: number,
): Promise<AirQuality | null> {
  const cacheKey = `${CACHE_KEY}::${lat.toFixed(2)}_${lng.toFixed(2)}`;

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: AirQuality = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const current = data.current;
    if (!current) return null;

    const aqi = current.us_aqi ?? 0;
    const info = getAqiInfo(aqi);

    const result: AirQuality = {
      aqi,
      label: info.label,
      color: info.color,
      pm25: current.pm2_5 ?? 0,
      pm10: current.pm10 ?? 0,
      advice: info.advice,
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
