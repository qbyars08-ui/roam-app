// =============================================================================
// ROAM — Golden Hour & Blue Hour times (free, no API key)
// Uses sunrise-sunset.org free API for calculations
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GoldenHourData {
  morningGoldenStart: string;  // HH:MM — ~30 min before sunrise
  morningGoldenEnd: string;    // HH:MM — same as sunrise
  eveningGoldenStart: string;  // HH:MM — same as sunset
  eveningGoldenEnd: string;    // HH:MM — ~30 min after sunset
  morningBlueStart: string;    // HH:MM — ~30 min before morningGoldenStart
  morningBlueEnd: string;      // HH:MM — same as morningGoldenStart
  eveningBlueStart: string;    // HH:MM — same as eveningGoldenEnd
  eveningBlueEnd: string;      // HH:MM — ~30 min after eveningGoldenEnd
  goldenDurationMin: number;   // Total minutes of golden hour (morning + evening)
  bestPhotoWindow: string;     // Human readable, e.g. "6:15 PM – 7:02 PM"
  fetchedAt: number;
}

const CACHE_KEY = 'roam_golden_hour';
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

// ISO time string (e.g., "2026-03-15T06:45:00+00:00") → "HH:MM" local
function formatTime(isoTime: string): string {
  const date = new Date(isoTime);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Add or subtract minutes from a Date and return "HH:MM" string
function addMinutesToDate(date: Date, minutes: number): string {
  const adjusted = new Date(date.getTime() + minutes * 60 * 1000);
  const hours = adjusted.getHours().toString().padStart(2, '0');
  const mins = adjusted.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

// Convert "HH:MM" string to minutes since midnight for duration calculation
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Type guard to validate API response structure
function isValidSunsetOrgResponse(data: unknown): data is {
  status: string;
  results: {
    sunrise: string;
    sunset: string;
    civil_twilight_begin: string;
    civil_twilight_end: string;
  };
} {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.status !== 'OK') return false;
  if (typeof obj.results !== 'object' || obj.results === null) return false;
  const results = obj.results as Record<string, unknown>;
  return (
    typeof results.sunrise === 'string' &&
    typeof results.sunset === 'string' &&
    typeof results.civil_twilight_begin === 'string' &&
    typeof results.civil_twilight_end === 'string'
  );
}

export async function getGoldenHour(
  lat: number,
  lng: number,
  date?: string, // YYYY-MM-DD
): Promise<GoldenHourData | null> {
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  const cacheKey = `${CACHE_KEY}::${lat.toFixed(2)}_${lng.toFixed(2)}_${dateStr}`;

  // Check cache
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: GoldenHourData = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss, continue
  }

  try {
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateStr}&formatted=0`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (!isValidSunsetOrgResponse(data)) return null;

    const { sunrise, sunset } = data.results;
    const sunriseDate = new Date(sunrise);
    const sunsetDate = new Date(sunset);

    // Golden hour = ~30 min before/after sunrise/sunset
    const morningGoldenStart = addMinutesToDate(sunriseDate, -30);
    const morningGoldenEnd = formatTime(sunrise);
    const eveningGoldenStart = formatTime(sunset);
    const eveningGoldenEnd = addMinutesToDate(sunsetDate, 30);

    // Blue hour = ~30 min before golden hour starts (morning), ~30 min after golden hour ends (evening)
    const morningBlueStart = addMinutesToDate(sunriseDate, -60);
    const morningBlueEnd = morningGoldenStart;
    const eveningBlueStart = eveningGoldenEnd;
    const eveningBlueEnd = addMinutesToDate(sunsetDate, 60);

    // Calculate total golden hour duration (morning + evening)
    const morningStart = timeToMinutes(morningGoldenStart);
    const morningEnd = timeToMinutes(morningGoldenEnd);
    const eveningStart = timeToMinutes(eveningGoldenStart);
    const eveningEnd = timeToMinutes(eveningGoldenEnd);

    const morningDuration = morningEnd - morningStart;
    const eveningDuration = eveningEnd - eveningStart;
    const goldenDurationMin = morningDuration + eveningDuration;

    // Best photo window = evening golden hour (more commonly used for photography)
    const bestPhotoWindow = `${eveningGoldenStart} – ${eveningGoldenEnd}`;

    const result: GoldenHourData = {
      morningGoldenStart,
      morningGoldenEnd,
      eveningGoldenStart,
      eveningGoldenEnd,
      morningBlueStart,
      morningBlueEnd,
      eveningBlueStart,
      eveningBlueEnd,
      goldenDurationMin,
      bestPhotoWindow,
      fetchedAt: Date.now(),
    };

    // Cache result
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Non-critical cache failure
    }

    return result;
  } catch {
    return null;
  }
}

export function getPhotoTip(data: GoldenHourData): string {
  return `Best light for photos between ${data.eveningGoldenStart} and ${data.eveningGoldenEnd} today`;
}
