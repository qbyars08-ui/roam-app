// =============================================================================
// ROAM — Teleport API: Urban area scores (safety, cost of living)
// Open data, no API key. api.teleport.org
// =============================================================================

const BASE = 'https://api.teleport.org/api';

// Map ROAM destination labels to Teleport urban area slugs
const DESTINATION_TO_SLUG: Record<string, string> = {
  Tokyo: 'tokyo',
  Paris: 'paris',
  Bali: 'denpasar',
  'New York': 'new-york',
  Barcelona: 'barcelona',
  Rome: 'rome',
  London: 'london',
  Bangkok: 'bangkok',
  Marrakech: 'marrakech',
  Lisbon: 'lisbon',
  'Cape Town': 'cape-town',
  Reykjavik: 'reykjavik',
  Seoul: 'seoul',
  'Buenos Aires': 'buenos-aires',
  Istanbul: 'istanbul',
  Sydney: 'sydney',
  'Mexico City': 'mexico-city',
  Dubai: 'dubai',
  Kyoto: 'kyoto',
  Amsterdam: 'amsterdam',
  Medellín: 'medellin',
  Tbilisi: 'tbilisi',
  'Chiang Mai': 'chiang-mai',
  Porto: 'porto',
  Oaxaca: 'oaxaca',
  Dubrovnik: 'dubrovnik',
  Budapest: 'budapest',
  'Hoi An': 'ho-chi-minh-city', // nearest
  Cartagena: 'cartagena',
  Jaipur: 'jaipur',
  Queenstown: 'queenstown',
  Azores: 'ponta-delgada',
  Ljubljana: 'ljubljana',
  Santorini: 'athens', // nearest
  'Siem Reap': 'phnom-penh', // nearest
};

export interface TeleportScore {
  name: string;
  score_out_of_10: number;
  color: string;
}

export interface TeleportScores {
  categories: TeleportScore[];
  summary: string;
  teleport_city_score: number;
}

export interface TeleportUrbanScores {
  _links: { 'ua:items': Array<{ href: string; name: string }> };
  categories: Array<{
    color: string;
    name: string;
    score_out_of_10: number;
  }>;
  summary: string;
  teleport_city_score: number;
}

export function getTeleportSlug(destination: string): string | null {
  const key = Object.keys(DESTINATION_TO_SLUG).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  return key ? DESTINATION_TO_SLUG[key] : null;
}

/**
 * Fetch urban area scores (safety, healthcare, cost, etc.) from Teleport API.
 */
export async function fetchUrbanScores(
  destination: string
): Promise<TeleportScores | null> {
  const slug = getTeleportSlug(destination);
  if (!slug) return null;

  try {
    const res = await fetch(`${BASE}/urban_areas/slug:${slug}/scores/`);
    if (!res.ok) return null;

    const data = (await res.json()) as TeleportUrbanScores;
    if (!data.categories || !Array.isArray(data.categories)) return null;

    return {
      categories: data.categories.map((c) => ({
        name: c.name,
        score_out_of_10: c.score_out_of_10,
        color: c.color || '#7CAF8A',
      })),
      summary: data.summary || '',
      teleport_city_score: data.teleport_city_score ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get safety score (0–10) for a destination.
 * Teleport category names: "Safety", "Healthcare", etc.
 */
export function getSafetyScore(scores: TeleportScores | null): number | null {
  if (!scores) return null;
  const safety = scores.categories.find(
    (c) => c.name.toLowerCase() === 'safety'
  );
  return safety ? safety.score_out_of_10 : null;
}

/**
 * Get cost of living / affordability score (higher = more affordable).
 */
export function getCostScore(scores: TeleportScores | null): number | null {
  if (!scores) return null;
  const cost = scores.categories.find(
    (c) =>
      c.name.toLowerCase().includes('cost') ||
      c.name.toLowerCase().includes('affordability')
  );
  return cost ? cost.score_out_of_10 : null;
}
