// =============================================================================
// ROAM — Visited Places Store
// Persistence layer for the Visited Map feature
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type VisitedPlace = {
  id: string;
  destination: string;
  country: string;
  continent: string;
  visitedAt: string;
  notes?: string;
};

export type BucketListPlace = {
  id: string;
  destination: string;
  country: string;
  continent: string;
  addedAt: string;
};

export type VisitedStats = {
  totalPlaces: number;
  totalCountries: number;
  totalContinents: number;
  totalMilesTraveled: number;
  continentBreakdown: Record<string, number>;
};

/** Approximate country centroids for distance estimation (lat, lng) */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  Japan: [36.2, 138.3],
  Indonesia: [-2.5, 118.0],
  Thailand: [15.9, 100.9],
  'South Korea': [35.9, 127.8],
  Vietnam: [14.1, 108.3],
  Cambodia: [12.6, 105.0],
  India: [20.6, 78.9],
  UAE: [23.4, 54.4],
  Georgia: [42.3, 43.4],
  Portugal: [39.4, -8.2],
  France: [46.2, 2.2],
  Spain: [40.5, -3.7],
  Italy: [42.8, 12.6],
  'United Kingdom': [55.4, -3.4],
  Netherlands: [52.1, 5.3],
  Iceland: [64.9, -19.0],
  Turkey: [38.9, 35.2],
  Croatia: [45.1, 15.2],
  Hungary: [47.2, 19.5],
  Slovenia: [46.2, 14.8],
  Greece: [39.1, 21.8],
  Germany: [51.2, 10.5],
  Mexico: [23.6, -102.6],
  'United States': [37.1, -95.7],
  Canada: [56.1, -106.4],
  Argentina: [38.4, -63.6],
  Colombia: [4.6, -74.1],
  Morocco: [31.8, -7.1],
  'South Africa': [-30.6, 22.9],
  Australia: [25.3, 133.8],
  'New Zealand': [-40.9, 174.9],
};

// ---------------------------------------------------------------------------
// Destination → Country/Continent mapping
// ---------------------------------------------------------------------------
type DestinationMeta = { country: string; continent: string };

export const DESTINATION_TO_COUNTRY_MAP: Record<string, DestinationMeta> = {
  // Asia
  'Tokyo':        { country: 'Japan',        continent: 'Asia' },
  'Osaka':        { country: 'Japan',        continent: 'Asia' },
  'Kyoto':        { country: 'Japan',        continent: 'Asia' },
  'Bali':         { country: 'Indonesia',    continent: 'Asia' },
  'Bangkok':      { country: 'Thailand',     continent: 'Asia' },
  'Chiang Mai':   { country: 'Thailand',     continent: 'Asia' },
  'Seoul':        { country: 'South Korea',  continent: 'Asia' },
  'Hoi An':       { country: 'Vietnam',      continent: 'Asia' },
  'Siem Reap':    { country: 'Cambodia',     continent: 'Asia' },
  'Jaipur':       { country: 'India',        continent: 'Asia' },
  'Dubai':        { country: 'UAE',          continent: 'Asia' },
  'Tbilisi':      { country: 'Georgia',      continent: 'Asia' },

  // Europe
  'Lisbon':       { country: 'Portugal',     continent: 'Europe' },
  'Porto':        { country: 'Portugal',     continent: 'Europe' },
  'Azores':       { country: 'Portugal',     continent: 'Europe' },
  'Paris':        { country: 'France',       continent: 'Europe' },
  'Barcelona':    { country: 'Spain',        continent: 'Europe' },
  'Rome':         { country: 'Italy',        continent: 'Europe' },
  'London':       { country: 'United Kingdom', continent: 'Europe' },
  'Amsterdam':    { country: 'Netherlands',  continent: 'Europe' },
  'Reykjavik':    { country: 'Iceland',      continent: 'Europe' },
  'Istanbul':     { country: 'Turkey',       continent: 'Europe' },
  'Dubrovnik':    { country: 'Croatia',      continent: 'Europe' },
  'Budapest':     { country: 'Hungary',      continent: 'Europe' },
  'Ljubljana':    { country: 'Slovenia',     continent: 'Europe' },
  'Santorini':    { country: 'Greece',       continent: 'Europe' },

  // North America
  'Mexico City':  { country: 'Mexico',       continent: 'North America' },
  'Oaxaca':       { country: 'Mexico',       continent: 'North America' },
  'New York':     { country: 'United States', continent: 'North America' },

  // South America
  'Buenos Aires': { country: 'Argentina',    continent: 'South America' },
  'Medellín':     { country: 'Colombia',     continent: 'South America' },
  'Cartagena':    { country: 'Colombia',     continent: 'South America' },
  "Colombia's Coffee Axis": { country: 'Colombia', continent: 'South America' },

  // Africa
  'Marrakech':    { country: 'Morocco',      continent: 'Africa' },
  'Cape Town':    { country: 'South Africa', continent: 'Africa' },

  // Oceania
  'Sydney':       { country: 'Australia',    continent: 'Oceania' },
  'Queenstown':   { country: 'New Zealand',  continent: 'Oceania' },
};

// Rough total countries per continent for progress calculations
export const COUNTRIES_PER_CONTINENT: Record<string, number> = {
  'Africa': 54,
  'Asia': 49,
  'Europe': 44,
  'North America': 23,
  'South America': 12,
  'Oceania': 14,
  'Antarctica': 0,
};

export const ALL_CONTINENTS = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
];

// Countries in the map grouped by continent (for the world grid)
export const WORLD_GRID: Record<string, string[]> = {
  'Africa': ['Morocco', 'South Africa', 'Egypt', 'Kenya', 'Tanzania', 'Nigeria', 'Ethiopia', 'Ghana'],
  'Asia': ['Japan', 'Indonesia', 'Thailand', 'South Korea', 'Vietnam', 'Cambodia', 'India', 'UAE', 'Georgia', 'China', 'Philippines', 'Malaysia', 'Singapore'],
  'Europe': ['Portugal', 'France', 'Spain', 'Italy', 'United Kingdom', 'Netherlands', 'Iceland', 'Turkey', 'Croatia', 'Hungary', 'Slovenia', 'Greece', 'Germany', 'Switzerland', 'Czech Republic', 'Austria'],
  'North America': ['Mexico', 'United States', 'Canada', 'Costa Rica', 'Cuba', 'Jamaica'],
  'South America': ['Argentina', 'Colombia', 'Brazil', 'Peru', 'Chile', 'Ecuador', 'Uruguay'],
  'Oceania': ['Australia', 'New Zealand', 'Fiji', 'Samoa'],
};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
const STORAGE_KEY = '@roam/visited_places';
const BUCKET_LIST_KEY = '@roam/bucket_list';

// ---------------------------------------------------------------------------
// Helper: generate ID
// ---------------------------------------------------------------------------
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------
export function lookupDestination(destination: string): DestinationMeta | null {
  // Exact match
  if (DESTINATION_TO_COUNTRY_MAP[destination]) {
    return DESTINATION_TO_COUNTRY_MAP[destination];
  }
  // Case-insensitive match
  const key = Object.keys(DESTINATION_TO_COUNTRY_MAP).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  if (key) return DESTINATION_TO_COUNTRY_MAP[key];
  return null;
}

// ---------------------------------------------------------------------------
// CRUD: Visited Places
// ---------------------------------------------------------------------------
export async function getVisitedPlaces(): Promise<VisitedPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VisitedPlace[];
  } catch {
    return [];
  }
}

export async function addVisitedPlace(
  place: Omit<VisitedPlace, 'id'>
): Promise<VisitedPlace[]> {
  const places = await getVisitedPlaces();
  const newPlace: VisitedPlace = { ...place, id: generateId() };
  const updated = [newPlace, ...places];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeVisitedPlace(id: string): Promise<VisitedPlace[]> {
  const places = await getVisitedPlaces();
  const updated = places.filter((p) => p.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function updateVisitedPlace(
  id: string,
  partial: Partial<VisitedPlace>
): Promise<VisitedPlace[]> {
  const places = await getVisitedPlaces();
  const updated = places.map((p) => (p.id === id ? { ...p, ...partial } : p));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// ---------------------------------------------------------------------------
// CRUD: Bucket List
// ---------------------------------------------------------------------------
export async function getBucketList(): Promise<BucketListPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(BUCKET_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BucketListPlace[];
  } catch {
    return [];
  }
}

export async function addBucketListPlace(
  place: Omit<BucketListPlace, 'id' | 'addedAt'>
): Promise<BucketListPlace[]> {
  const list = await getBucketList();
  const newItem: BucketListPlace = {
    ...place,
    id: generateId(),
    addedAt: new Date().toISOString(),
  };
  const updated = [newItem, ...list];
  await AsyncStorage.setItem(BUCKET_LIST_KEY, JSON.stringify(updated));
  return updated;
}

export async function removeBucketListPlace(id: string): Promise<BucketListPlace[]> {
  const list = await getBucketList();
  const updated = list.filter((p) => p.id !== id);
  await AsyncStorage.setItem(BUCKET_LIST_KEY, JSON.stringify(updated));
  return updated;
}

/** Haversine distance in miles */
function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeTotalMiles(places: VisitedPlace[]): number {
  const sorted = [...places].sort(
    (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()
  );
  const seen = new Set<string>();
  const order: VisitedPlace[] = [];
  for (const p of sorted) {
    if (!seen.has(p.country)) {
      seen.add(p.country);
      order.push(p);
    }
  }
  let total = 0;
  for (let i = 1; i < order.length; i++) {
    const prev = COUNTRY_COORDS[order[i - 1].country];
    const curr = COUNTRY_COORDS[order[i].country];
    if (prev && curr) {
      total += haversineMiles(prev[0], prev[1], curr[0], curr[1]);
    }
  }
  return Math.round(total);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
export async function getVisitedStats(): Promise<VisitedStats> {
  const places = await getVisitedPlaces();
  const countries = new Set(places.map((p) => p.country));
  const continents = new Set(places.map((p) => p.continent));

  const continentBreakdown: Record<string, number> = {};
  for (const place of places) {
    continentBreakdown[place.continent] =
      (continentBreakdown[place.continent] ?? 0) + 1;
  }

  const totalMilesTraveled = computeTotalMiles(places);

  return {
    totalPlaces: places.length,
    totalCountries: countries.size,
    totalContinents: continents.size,
    totalMilesTraveled,
    continentBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Auto-sync from Zustand trips
// ---------------------------------------------------------------------------
export async function syncFromTrips(): Promise<VisitedPlace[]> {
  const { trips } = useAppStore.getState();
  const existing = await getVisitedPlaces();
  const existingDestinations = new Set(
    existing.map((p) => p.destination.toLowerCase())
  );

  let added = false;
  const newPlaces: VisitedPlace[] = [...existing];

  for (const trip of trips) {
    const dest = trip.destination.trim();
    if (!dest || existingDestinations.has(dest.toLowerCase())) continue;

    const meta = lookupDestination(dest);
    if (!meta) continue;

    newPlaces.unshift({
      id: generateId(),
      destination: dest,
      country: meta.country,
      continent: meta.continent,
      visitedAt: trip.createdAt,
    });
    existingDestinations.add(dest.toLowerCase());
    added = true;
  }

  if (added) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaces));
  }

  return newPlaces;
}

// ---------------------------------------------------------------------------
// Get all destination suggestions (for autocomplete)
// ---------------------------------------------------------------------------
export function getDestinationSuggestions(query: string): string[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return Object.keys(DESTINATION_TO_COUNTRY_MAP).filter((d) =>
    d.toLowerCase().includes(lower)
  );
}
