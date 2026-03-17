// =============================================================================
// ROAM — Mapbox Integration (Free Tier: 100K geocoding, 50K map loads/month)
// Dark-styled static maps with day routes as connected paths.
// =============================================================================
import { COLORS } from './constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const GEOCODE_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const STATIC_BASE = 'https://api.mapbox.com/styles/v1';

// Dark map style — ROAM branded
const DARK_STYLE = 'mapbox/dark-v11';

// Pin colors for morning/afternoon/evening (Mapbox expects hex without #)
const SLOT_COLORS: Record<string, string> = {
  morning: COLORS.primary.slice(1),
  afternoon: COLORS.gold.slice(1),
  evening: COLORS.danger.slice(1),
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
  fullAddress: string;
}

export interface DayRouteMap {
  day: number;
  imageUrl: string;
  locations: GeocodedLocation[];
}

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------

/**
 * Geocode a place name in the context of a city.
 * Uses Mapbox forward geocoding with proximity bias.
 */
export async function geocodePlace(
  placeName: string,
  city: string
): Promise<GeocodedLocation | null> {
  if (!TOKEN) return null;

  // First geocode the city for proximity bias
  const cityUrl = `${GEOCODE_BASE}/${encodeURIComponent(city)}.json?access_token=${TOKEN}&limit=1&types=place`;
  const cityRes = await fetch(cityUrl);
  if (!cityRes.ok) return null;
  const cityData = await cityRes.json();
  const cityCenter = cityData.features?.[0]?.center as [number, number] | undefined;

  // Now geocode the place with proximity to the city
  const query = `${placeName}, ${city}`;
  let url = `${GEOCODE_BASE}/${encodeURIComponent(query)}.json?access_token=${TOKEN}&limit=1`;
  if (cityCenter) {
    url += `&proximity=${cityCenter[0]},${cityCenter[1]}`;
  }

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  return {
    name: placeName,
    lat: feature.center[1],
    lng: feature.center[0],
    fullAddress: feature.place_name ?? placeName,
  };
}

/**
 * Geocode multiple places in a city.
 * Returns results in the same order as input. Null entries for failures.
 */
export async function geocodePlaces(
  places: string[],
  city: string
): Promise<(GeocodedLocation | null)[]> {
  // Geocode in parallel with a concurrency limit of 3
  const results: (GeocodedLocation | null)[] = [];
  const batchSize = 3;

  for (let i = 0; i < places.length; i += batchSize) {
    const batch = places.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((place) => geocodePlace(place, city).catch(() => null))
    );
    results.push(...batchResults);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Static Map Generation
// ---------------------------------------------------------------------------

/**
 * Build a Mapbox static map URL with markers and a route path.
 * Returns a dark-styled map image URL ready for <Image>.
 */
export function buildStaticMapUrl(params: {
  locations: GeocodedLocation[];
  slots?: string[]; // 'morning', 'afternoon', 'evening' — for pin colors
  width?: number;
  height?: number;
  padding?: number;
  retina?: boolean;
}): string | null {
  if (!TOKEN || params.locations.length === 0) return null;

  const { locations, width = 600, height = 400, retina = true } = params;
  const slots = params.slots ?? locations.map((_, i) =>
    i === 0 ? 'morning' : i === 1 ? 'afternoon' : 'evening'
  );

  // Build pin markers
  const markers = locations.map((loc, i) => {
    const color = SLOT_COLORS[slots[i]] ?? COLORS.primary.slice(1);
    const label = `${i + 1}`;
    return `pin-l-${label}+${color}(${loc.lng},${loc.lat})`;
  }).join(',');

  // Build path overlay (route connecting the pins)
  let pathOverlay = '';
  if (locations.length >= 2) {
    const coords = locations.map((l) => `[${l.lng},${l.lat}]`).join(',');
    // GeoJSON line with sage green color, 3px width
    const geojson = JSON.stringify({
      type: 'Feature',
      properties: { 'stroke': COLORS.primary, 'stroke-width': 3, 'stroke-opacity': 0.8 },
      geometry: {
        type: 'LineString',
        coordinates: locations.map((l) => [l.lng, l.lat]),
      },
    });
    pathOverlay = `,geojson(${encodeURIComponent(geojson)})`;
  }

  // Auto-fit bounds
  const retinaStr = retina ? '@2x' : '';
  const overlays = `${markers}${pathOverlay}`;

  return `${STATIC_BASE}/${DARK_STYLE}/static/${overlays}/auto/${width}x${height}${retinaStr}?access_token=${TOKEN}&padding=60&attribution=false&logo=false`;
}

/**
 * Build a simple overview map URL showing just the destination city.
 */
export function buildDestinationMapUrl(params: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
}): string | null {
  if (!TOKEN) return null;

  const { lat, lng, zoom = 11, width = 600, height = 300 } = params;

  const marker = `pin-s+${COLORS.primary.slice(1)}(${lng},${lat})`;
  return `${STATIC_BASE}/${DARK_STYLE}/static/${marker}/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${TOKEN}&attribution=false&logo=false`;
}

// ---------------------------------------------------------------------------
// Day Route Map Builder
// ---------------------------------------------------------------------------

/**
 * Build route maps for each day of an itinerary.
 * Geocodes all locations and generates static map URLs.
 */
export async function buildDayRouteMaps(params: {
  days: Array<{
    day: number;
    morning: { location: string };
    afternoon: { location: string };
    evening: { location: string };
  }>;
  city: string;
}): Promise<DayRouteMap[]> {
  if (!TOKEN) return [];

  const { days, city } = params;
  const results: DayRouteMap[] = [];

  for (const day of days) {
    const places = [day.morning.location, day.afternoon.location, day.evening.location];
    const geocoded = await geocodePlaces(places, city);

    // Filter out nulls but keep order
    const validLocations = geocoded.filter((g): g is GeocodedLocation => g !== null);
    const validSlots: string[] = [];
    geocoded.forEach((g, i) => {
      if (g) validSlots.push(['morning', 'afternoon', 'evening'][i]);
    });

    if (validLocations.length === 0) continue;

    const imageUrl = buildStaticMapUrl({
      locations: validLocations,
      slots: validSlots,
    });

    if (imageUrl) {
      results.push({
        day: day.day,
        imageUrl,
        locations: validLocations,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Visited map: static world map with sage (visited) and gold (planned) pins
// Style: mapbox/dark-v11. Auto bounds to fit all pins.
// ---------------------------------------------------------------------------
export function buildVisitedMapUrl(params: {
  visited: Array<{ lat: number; lng: number }>;
  planned: Array<{ lat: number; lng: number }>;
  width?: number;
  height?: number;
}): string | null {
  if (!TOKEN) return null;

  const { width = 600, height = 320 } = params;
  const sageHex = COLORS.sage.replace('#', '');
  const goldHex = COLORS.gold.replace('#', '');

  const markers: string[] = [];
  params.visited.forEach((p) => {
    markers.push(`pin-s+${sageHex}(${p.lng},${p.lat})`);
  });
  params.planned.forEach((p) => {
    markers.push(`pin-s+${goldHex}(${p.lng},${p.lat})`);
  });

  if (markers.length === 0) return null;

  const overlays = markers.join(',');
  return `${STATIC_BASE}/${DARK_STYLE}/static/${overlays}/auto/${width}x${height}@2x?access_token=${TOKEN}&padding=40&attribution=false&logo=false`;
}

// ---------------------------------------------------------------------------
// Check if Mapbox is configured
// ---------------------------------------------------------------------------
export function isMapboxConfigured(): boolean {
  return TOKEN.length > 0;
}
