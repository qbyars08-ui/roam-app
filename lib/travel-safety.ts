// =============================================================================
// ROAM — Travel Safety Advisory (free, no API key)
// Uses travel-advisory.info — aggregated government travel advisories
// Attribution required: link to travel-advisory.info
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TravelAdvisory {
  countryCode: string;
  countryName: string;
  score: number;            // 0–5 risk score
  label: string;            // 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Extreme'
  color: string;            // hex color for UI
  advice: string;           // Short travel advice
  sourcesActive: number;    // Number of advisory sources contributing
  updatedAt: string;        // ISO-ish timestamp from API
  sourceUrl: string;        // Attribution link
  fetchedAt: number;
}

const CACHE_KEY = 'roam_travel_advisory';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getRiskInfo(score: number): { label: string; color: string; advice: string } {
  if (score <= 2.5) return {
    label: 'Low Risk',
    color: '#4CAF50',
    advice: 'Generally safe for travelers. Standard precautions apply.',
  };
  if (score <= 3.5) return {
    label: 'Medium Risk',
    color: '#FFC107',
    advice: 'Exercise increased caution. Some areas may have warnings.',
  };
  if (score <= 4.5) return {
    label: 'High Risk',
    color: '#FF9800',
    advice: 'Reconsider travel. Check government advisories for specifics.',
  };
  return {
    label: 'Extreme Warning',
    color: '#F44336',
    advice: 'Avoid all travel. Government advisories warn against visiting.',
  };
}

export async function getTravelAdvisory(
  countryCode: string,
): Promise<TravelAdvisory | null> {
  const code = countryCode.toUpperCase();
  const cacheKey = `${CACHE_KEY}::${code}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: TravelAdvisory = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const url = `https://www.travel-advisory.info/api?countrycode=${code}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const countryData = data.data?.[code];
    if (!countryData) return null;

    const advisory = countryData.advisory;
    if (!advisory) return null;

    const score = advisory.score ?? 0;
    const riskInfo = getRiskInfo(score);

    const result: TravelAdvisory = {
      countryCode: code,
      countryName: countryData.name ?? '',
      score,
      label: riskInfo.label,
      color: riskInfo.color,
      advice: riskInfo.advice,
      sourcesActive: advisory.sources_active ?? 0,
      updatedAt: advisory.updated ?? '',
      sourceUrl: advisory.source ?? `https://www.travel-advisory.info/${countryData.name?.toLowerCase() ?? ''}`,
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
 * Get a safety score as a visual fraction (e.g. "2.1 / 5").
 */
export function formatSafetyScore(score: number): string {
  return `${score.toFixed(1)} / 5.0`;
}
