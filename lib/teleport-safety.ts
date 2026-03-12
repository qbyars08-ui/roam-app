// =============================================================================
// ROAM — Neighborhood Safety (Teleport API, free, no key)
// City quality/safety scores for itinerary activity cards
// =============================================================================

export type SafetyLevel = 'safe' | 'caution' | 'avoid';

export interface SafetyScore {
  score: number;       // 0-100
  level: SafetyLevel;
  label: string;
  timeNote?: string;   // "Safe during day, avoid after midnight"
}

const CITY_SLUGS: Record<string, string> = {
  tokyo: 'tokyo', paris: 'paris', london: 'london', 'new york': 'new-york',
  barcelona: 'barcelona', rome: 'rome', amsterdam: 'amsterdam',
  bangkok: 'bangkok', bali: 'bali', lisbon: 'lisbon', seoul: 'seoul',
  dubai: 'dubai', sydney: 'sydney', 'mexico city': 'mexico-city',
  istanbul: 'istanbul', 'cape town': 'cape-town', reykjavik: 'reykjavik',
  budapest: 'budapest', prague: 'prague', vienna: 'vienna',
  medellin: 'medellin', 'medellín': 'medellin', cartagena: 'cartagena',
  dubrovnik: 'dubrovnik', porto: 'porto', athens: 'athens',
  tbilisi: 'tbilisi', marrakech: 'marrakech', 'buenos aires': 'buenos-aires',
};

function slugForCity(city: string): string | null {
  const key = city.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const [k, v] of Object.entries(CITY_SLUGS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return key.replace(/\s+/g, '-').replace(/,/g, '');
}

export async function getCitySafetyScore(city: string): Promise<SafetyScore | null> {
  const slug = slugForCity(city);
  if (!slug) return null;

  try {
    const res = await fetch(
      `https://api.teleport.org/api/urban_areas/slug:${slug}/scores/`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const categories = (data.categories ?? []) as Array<{
      name: string;
      score_out_of_10: number;
    }>;
    const safety = categories.find(
      (c) =>
        c.name?.toLowerCase().includes('safety') ||
        c.name?.toLowerCase().includes('crime')
    );
    const overall =
      safety?.score_out_of_10 != null
        ? Math.round(safety.score_out_of_10 * 10)
        : 70;

    let level: SafetyLevel = 'safe';
    let label = 'Very safe';
    let timeNote: string | undefined;

    if (overall >= 75) {
      level = 'safe';
      label = 'Very safe';
    } else if (overall >= 50) {
      level = 'caution';
      label = 'Take care';
      timeNote = 'Safe during day, avoid after midnight';
    } else {
      level = 'avoid';
      label = 'Avoid at night';
      timeNote = 'Stay in well-lit areas after dark';
    }

    return { score: overall, level, label, timeNote };
  } catch {
    return null;
  }
}

export const SAFETY_COLORS: Record<SafetyLevel, string> = {
  safe: '#7CAF8A',
  caution: '#C9A84C',
  avoid: '#C0392B',
};
