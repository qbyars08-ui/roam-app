// =============================================================================
// ROAM — Emergency Numbers (free, no API key)
// Uses emergencynumberapi.com — global emergency phone numbers
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmergencyNumbers {
  countryCode: string;
  countryName: string;
  police: string[];
  fire: string[];
  ambulance: string[];
  dispatch: string[];
  isMember112: boolean;     // EU 112 member
  fetchedAt: number;
}

const CACHE_KEY = 'roam_emergency_numbers';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function extractNumbers(service: Record<string, unknown> | undefined): string[] {
  if (!service) return [];
  const all = service.all;
  if (Array.isArray(all)) return all.filter((n): n is string => typeof n === 'string' && n.length > 0);
  const gsm = service.gsm;
  if (Array.isArray(gsm)) return gsm.filter((n): n is string => typeof n === 'string' && n.length > 0);
  return [];
}

export async function getEmergencyNumbers(
  countryCode: string,
): Promise<EmergencyNumbers | null> {
  const code = countryCode.toUpperCase();
  const cacheKey = `${CACHE_KEY}::${code}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: EmergencyNumbers = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const url = `https://emergencynumberapi.com/api/country/${code}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const json = await response.json();
    const data = json.data;
    if (!data || data.nodata) return null;

    const result: EmergencyNumbers = {
      countryCode: code,
      countryName: data.country?.name ?? '',
      police: extractNumbers(data.police),
      fire: extractNumbers(data.fire),
      ambulance: extractNumbers(data.ambulance),
      dispatch: extractNumbers(data.dispatch),
      isMember112: data.member_112 === true,
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
 * Format emergency numbers into a single-line summary.
 * e.g. "Police: 110 | Fire: 119 | Ambulance: 119"
 */
export function formatEmergencySummary(numbers: EmergencyNumbers): string {
  const parts: string[] = [];
  if (numbers.police.length > 0) parts.push(`Police: ${numbers.police[0]}`);
  if (numbers.fire.length > 0) parts.push(`Fire: ${numbers.fire[0]}`);
  if (numbers.ambulance.length > 0) parts.push(`Ambulance: ${numbers.ambulance[0]}`);
  if (numbers.isMember112) parts.push('EU 112');
  return parts.join(' | ');
}
