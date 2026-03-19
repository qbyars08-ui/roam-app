// =============================================================================
// ROAM — Weather-Based Wardrobe Advisor
// Tells users exactly what to wear each day of their trip.
// =============================================================================
import { useState, useEffect, useMemo } from 'react';
import type { DailyForecast, WeatherForecast } from './weather-forecast';
import { getWeatherForecast } from './weather-forecast';
import { DESTINATIONS, HIDDEN_DESTINATIONS } from './constants';
import { geocodeCity } from './geocoding';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DayOutfit {
  readonly date: string;
  readonly tempHigh: number;
  readonly tempLow: number;
  readonly condition: string;
  readonly layers: readonly string[];
  readonly shoes: string;
  readonly accessories: readonly string[];
  readonly tip: string;
}

export interface PackingSummaryItem {
  readonly name: string;
  readonly quantity: number;
}

// ---------------------------------------------------------------------------
// Temperature zone helpers
// ---------------------------------------------------------------------------
type TempZone = 'freezing' | 'cold' | 'mild' | 'warm' | 'hot';

function getTempZone(high: number, low: number): TempZone {
  const avg = (high + low) / 2;
  if (avg < 0) return 'freezing';
  if (avg < 10) return 'cold';
  if (avg < 20) return 'mild';
  if (avg < 30) return 'warm';
  return 'hot';
}

function isRainy(code: number): boolean {
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  return rainCodes.includes(code);
}

// ---------------------------------------------------------------------------
// Activity detection from itinerary text
// ---------------------------------------------------------------------------
function detectDayActivities(activities: readonly string[]): Set<string> {
  const found = new Set<string>();
  for (const text of activities) {
    const lower = text.toLowerCase();
    if (lower.includes('temple') || lower.includes('mosque') || lower.includes('shrine') || lower.includes('church')) {
      found.add('temple');
    }
    if (lower.includes('hik') || lower.includes('trek')) found.add('hiking');
    if (lower.includes('fine dining') || lower.includes('dinner') || lower.includes('restaurant') || lower.includes('michelin')) {
      found.add('dining');
    }
    if (lower.includes('beach') || lower.includes('swim') || lower.includes('snorkel')) found.add('beach');
  }
  return found;
}

// ---------------------------------------------------------------------------
// Core: outfit advice for a single day
// ---------------------------------------------------------------------------
function buildDayOutfit(
  day: DailyForecast,
  activities: readonly string[],
): DayOutfit {
  const zone = getTempZone(day.tempMax, day.tempMin);
  const rainy = isRainy(day.weatherCode) || day.precipitationChance > 50;
  const detected = detectDayActivities(activities);

  const layers: string[] = [];
  let shoes = 'Comfortable walking shoes';
  const accessories: string[] = [];
  const tips: string[] = [];

  // Base layers by temperature zone
  switch (zone) {
    case 'hot':
      layers.push('Light cotton t-shirt', 'Shorts or linen pants');
      shoes = 'Sandals or breathable sneakers';
      accessories.push('Sunglasses');
      tips.push('Sunscreen SPF 50. Stay hydrated.');
      break;
    case 'warm':
      layers.push('T-shirt', 'Light pants or chinos');
      tips.push('Bring a light jacket for evening.');
      break;
    case 'mild':
      layers.push('Long-sleeve shirt', 'Light jacket', 'Pants');
      shoes = 'Closed-toe shoes';
      tips.push('Layers are key. Mornings and evenings will be cooler.');
      break;
    case 'cold':
      layers.push('Thermal base layer', 'Warm sweater', 'Insulated coat', 'Warm pants');
      shoes = 'Insulated boots';
      accessories.push('Warm hat', 'Scarf');
      tips.push('Dress in layers you can remove indoors.');
      break;
    case 'freezing':
      layers.push('Thermal base layer', 'Fleece mid-layer', 'Heavy winter coat', 'Insulated pants');
      shoes = 'Waterproof insulated boots';
      accessories.push('Warm hat', 'Insulated gloves', 'Scarf');
      tips.push('Cover all exposed skin. Wind chill makes it worse.');
      break;
  }

  // Rain override
  if (rainy) {
    layers.push('Waterproof jacket');
    accessories.push('Compact umbrella');
    tips.push('Skip the suede shoes.');
    if (zone !== 'freezing' && zone !== 'cold') {
      shoes = 'Water-resistant shoes';
    }
  }

  // High UV
  if (day.uvIndexMax > 5) {
    accessories.push('Sun hat');
    if (!tips.some((t) => t.includes('Sunscreen'))) {
      tips.push(`UV index ${Math.round(day.uvIndexMax)} — wear sunscreen.`);
    }
  }

  // Activity overrides
  if (detected.has('temple')) {
    tips.push('Modest clothing required. Cover shoulders and knees.');
  }
  if (detected.has('hiking')) {
    shoes = 'Hiking boots';
    layers.push('Moisture-wicking base layer');
    accessories.push('Brimmed hat');
    tips.push('Wear hiking boots and moisture-wicking layers.');
  }
  if (detected.has('dining')) {
    tips.push('Smart casual minimum. No sneakers.');
  }
  if (detected.has('beach')) {
    layers.push('Swimsuit + cover-up');
    accessories.push('Beach towel');
  }

  return {
    date: day.date,
    tempHigh: day.tempMax,
    tempLow: day.tempMin,
    condition: day.weatherLabel,
    layers,
    shoes,
    accessories,
    tip: tips.join(' '),
  };
}

// ---------------------------------------------------------------------------
// getWardrobeAdvice — for each forecast day, return outfit advice
// ---------------------------------------------------------------------------
export function getWardrobeAdvice(
  forecast: WeatherForecast,
  _destination: string,
  activities: readonly string[],
): readonly DayOutfit[] {
  return forecast.days.map((day) => buildDayOutfit(day, activities));
}

// ---------------------------------------------------------------------------
// getPackingFromWardrobe — deduplicate across days into a summary
// ---------------------------------------------------------------------------
export function getPackingFromWardrobe(
  outfits: readonly DayOutfit[],
  _days: number,
): readonly PackingSummaryItem[] {
  const counts = new Map<string, number>();

  for (const outfit of outfits) {
    for (const layer of outfit.layers) {
      counts.set(layer, (counts.get(layer) ?? 0) + 1);
    }
    counts.set(outfit.shoes, 1); // shoes don't multiply
    for (const acc of outfit.accessories) {
      counts.set(acc, 1); // accessories don't multiply
    }
  }

  // Cap clothing items at reasonable amounts
  const result: PackingSummaryItem[] = [];
  for (const [name, raw] of counts) {
    const isClothing = !['Sunglasses', 'Sun hat', 'Warm hat', 'Insulated gloves',
      'Scarf', 'Compact umbrella', 'Brimmed hat', 'Beach towel'].includes(name)
      && !name.includes('boots') && !name.includes('shoes') && !name.includes('Sandals')
      && !name.includes('jacket') && !name.includes('coat');

    const quantity = isClothing ? Math.min(raw, 5) : 1;
    result.push({ name, quantity });
  }

  return result.sort((a, b) => b.quantity - a.quantity);
}

// ---------------------------------------------------------------------------
// useWardrobeAdvisor — React hook
// ---------------------------------------------------------------------------
export interface UseWardrobeAdvisorReturn {
  readonly outfits: readonly DayOutfit[];
  readonly packingSummary: readonly PackingSummaryItem[];
  readonly loading: boolean;
}

export function useWardrobeAdvisor(
  tripId: string | undefined,
  destination: string,
  activities: readonly string[] = [],
  forecastDays = 7,
): UseWardrobeAdvisorReturn {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!destination) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      // Find lat/lng from known destinations or geocode
      const allDests = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
      const known = allDests.find(
        (d) => d.label.toLowerCase() === destination.toLowerCase(),
      );

      let lat: number | undefined;
      let lng: number | undefined;

      if (known) {
        lat = known.lat;
        lng = known.lng;
      } else {
        const geo = await geocodeCity(destination);
        if (geo) {
          lat = geo.latitude;
          lng = geo.longitude;
        }
      }

      if (lat == null || lng == null || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      const result = await getWeatherForecast(lat, lng, forecastDays);
      if (!cancelled) {
        setForecast(result);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [destination, forecastDays, tripId]);

  const outfits = useMemo(
    () => (forecast ? getWardrobeAdvice(forecast, destination, activities) : []),
    [forecast, destination, activities],
  );

  const packingSummary = useMemo(
    () => getPackingFromWardrobe(outfits, forecastDays),
    [outfits, forecastDays],
  );

  return { outfits, packingSummary, loading };
}
