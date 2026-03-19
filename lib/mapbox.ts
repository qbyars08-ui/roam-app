// =============================================================================
// ROAM — Mapbox Integration (Free Tier: 100K geocoding, 50K map loads/month)
// Dark-styled static maps with day routes as connected paths.
// Enhanced: interactive maps, heatmaps, route lines, dark style builder
// =============================================================================
import { COLORS } from './constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const GEOCODE_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const STATIC_BASE = 'https://api.mapbox.com/styles/v1';
const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox';

// Dark map style — ROAM branded
const DARK_STYLE = 'mapbox/dark-v11';

// Max URL length for Mapbox static images
const MAX_URL_LENGTH = 7000;

// Max pins before truncation (keep under 10 for reliable URL lengths on web)
const MAX_PINS = 10;

// Pin colors for morning/afternoon/evening (Mapbox expects hex without #)
const SLOT_COLORS: Record<string, string> = {
  morning: COLORS.primary.slice(1),   // sage
  afternoon: COLORS.gold.slice(1),    // gold
  evening: 'E8614A',                  // coral (solid hex, not rgba)
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

export interface MapPin {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  size?: 's' | 'l';
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
// Pin truncation helpers
// ---------------------------------------------------------------------------

/**
 * Truncate pins to MAX_PINS, returning the truncated list and overflow count.
 */
function truncatePins<T>(items: T[], max: number = MAX_PINS): { items: T[]; overflowCount: number } {
  if (items.length <= max) return { items, overflowCount: 0 };
  return { items: items.slice(0, max), overflowCount: items.length - max };
}

/**
 * Build marker overlays string from pins, with URL length guard.
 * Reduces pin count if URL would exceed MAX_URL_LENGTH.
 */
function buildMarkerOverlays(pins: MapPin[]): { overlays: string; overflowCount: number } {
  const { items: truncated, overflowCount } = truncatePins(pins);

  const markers = truncated.map((pin) => {
    const color = pin.color ?? COLORS.primary.slice(1);
    const size = pin.size ?? 's';
    const labelPart = pin.label ? `-${pin.label}` : '';
    return `pin-${size}${labelPart}+${color.replace('#', '')}(${pin.lng},${pin.lat})`;
  }).join(',');

  return { overlays: markers, overflowCount };
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

  // Truncate to MAX_PINS
  const { items: truncLocs, overflowCount: _overflow } = truncatePins(locations);
  const truncSlots = slots.slice(0, truncLocs.length);

  // Build pin markers
  const markers = truncLocs.map((loc, i) => {
    const color = SLOT_COLORS[truncSlots[i]] ?? COLORS.primary.slice(1);
    const label = `${i + 1}`;
    return `pin-l-${label}+${color}(${loc.lng},${loc.lat})`;
  }).join(',');

  // Build path overlay (route connecting the pins)
  let pathOverlay = '';
  if (truncLocs.length >= 2) {
    // GeoJSON line with sage green color, 3px width
    const geojson = JSON.stringify({
      type: 'Feature',
      properties: { 'stroke': COLORS.primary, 'stroke-width': 3, 'stroke-opacity': 0.8 },
      geometry: {
        type: 'LineString',
        coordinates: truncLocs.map((l) => [l.lng, l.lat]),
      },
    });
    pathOverlay = `,geojson(${encodeURIComponent(geojson)})`;
  }

  // Auto-fit bounds
  const retinaStr = retina ? '@2x' : '';
  const overlays = `${markers}${pathOverlay}`;

  let url = `${STATIC_BASE}/${DARK_STYLE}/static/${overlays}/auto/${width}x${height}${retinaStr}?access_token=${TOKEN}&padding=60&attribution=false&logo=false`;

  // URL length guard — strip path overlay if too long, then reduce pins
  if (url.length > MAX_URL_LENGTH && pathOverlay) {
    url = `${STATIC_BASE}/${DARK_STYLE}/static/${markers}/auto/${width}x${height}${retinaStr}?access_token=${TOKEN}&padding=60&attribution=false&logo=false`;
  }

  if (url.length > MAX_URL_LENGTH) {
    // Aggressively reduce pins to stay under the URL length limit
    const reducedCount = Math.min(5, truncLocs.length);
    const reducedLocs = truncLocs.slice(0, reducedCount);
    const reducedMarkers = reducedLocs.map((loc, i) => {
      const color = SLOT_COLORS[truncSlots[i]] ?? COLORS.primary.slice(1);
      return `pin-l-${i + 1}+${color}(${loc.lng},${loc.lat})`;
    }).join(',');
    url = `${STATIC_BASE}/${DARK_STYLE}/static/${reducedMarkers}/auto/${width}x${height}${retinaStr}?access_token=${TOKEN}&padding=60&attribution=false&logo=false`;
  }

  return url;
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
// Interactive Map URL Builder (for web iframes / embeds)
// ---------------------------------------------------------------------------

/**
 * Build an interactive Mapbox GL JS map URL for web embeds.
 * Uses the Mapbox dark style with custom pins.
 */
export function buildInteractiveMapUrl(params: {
  pins: MapPin[];
  zoom?: number;
  center?: { lat: number; lng: number };
  width?: number;
  height?: number;
}): string | null {
  if (!TOKEN) return null;

  const { pins, zoom = 13, center } = params;
  const { items: truncPins } = truncatePins(pins);

  // Calculate center from pins if not provided
  const mapCenter = center ?? (truncPins.length > 0
    ? {
        lat: truncPins.reduce((s, p) => s + p.lat, 0) / truncPins.length,
        lng: truncPins.reduce((s, p) => s + p.lng, 0) / truncPins.length,
      }
    : { lat: 0, lng: 0 });

  // Build static map with the pins (interactive Mapbox GL JS requires JS SDK, so we use enhanced static)
  const { overlays } = buildMarkerOverlays(truncPins);

  if (!overlays) return null;

  const url = `${STATIC_BASE}/${DARK_STYLE}/static/${overlays}/${mapCenter.lng},${mapCenter.lat},${zoom}/800x600@2x?access_token=${TOKEN}&attribution=false&logo=false`;

  return url.length <= MAX_URL_LENGTH ? url : null;
}

// ---------------------------------------------------------------------------
// Heatmap URL Builder (visited places density)
// ---------------------------------------------------------------------------

/**
 * Build a heatmap-style map by clustering pins with varying opacity.
 * Uses larger pins for areas with more visits.
 */
export function buildHeatmapUrl(params: {
  coords: Array<{ lat: number; lng: number; weight?: number }>;
  width?: number;
  height?: number;
}): string | null {
  if (!TOKEN || params.coords.length === 0) return null;

  const { coords, width = 600, height = 400 } = params;
  const sageHex = COLORS.sage.replace('#', '');

  // Cluster nearby coords (simple grid-based clustering)
  const clusters = clusterCoords(coords);
  const { items: truncClusters } = truncatePins(clusters);

  const markers = truncClusters.map((cluster) => {
    // Larger pin for higher weight clusters
    const size = cluster.weight >= 3 ? 'l' : 's';
    return `pin-${size}+${sageHex}(${cluster.lng},${cluster.lat})`;
  }).join(',');

  if (!markers) return null;

  const url = `${STATIC_BASE}/${DARK_STYLE}/static/${markers}/auto/${width}x${height}@2x?access_token=${TOKEN}&padding=40&attribution=false&logo=false`;
  return url.length <= MAX_URL_LENGTH ? url : null;
}

/**
 * Simple grid-based clustering for heatmap visualization.
 */
function clusterCoords(
  coords: Array<{ lat: number; lng: number; weight?: number }>
): Array<{ lat: number; lng: number; weight: number }> {
  const gridSize = 2; // degrees
  const grid = new Map<string, { latSum: number; lngSum: number; count: number }>();

  for (const c of coords) {
    const key = `${Math.floor(c.lat / gridSize)}_${Math.floor(c.lng / gridSize)}`;
    const existing = grid.get(key);
    const w = c.weight ?? 1;
    if (existing) {
      grid.set(key, {
        latSum: existing.latSum + c.lat * w,
        lngSum: existing.lngSum + c.lng * w,
        count: existing.count + w,
      });
    } else {
      grid.set(key, { latSum: c.lat * w, lngSum: c.lng * w, count: w });
    }
  }

  return Array.from(grid.values()).map((g) => ({
    lat: g.latSum / g.count,
    lng: g.lngSum / g.count,
    weight: g.count,
  }));
}

// ---------------------------------------------------------------------------
// Route Map Builder (walking/driving route between waypoints)
// ---------------------------------------------------------------------------

/**
 * Build a static map URL with a Mapbox Directions API route drawn.
 * Falls back to straight-line GeoJSON if directions fail.
 */
export async function getStaticMapWithRoute(params: {
  waypoints: Array<{ lat: number; lng: number; label?: string; color?: string }>;
  profile?: 'walking' | 'driving' | 'cycling';
  width?: number;
  height?: number;
}): Promise<string | null> {
  if (!TOKEN || params.waypoints.length < 2) return null;

  const { waypoints, profile = 'walking', width = 600, height = 400 } = params;
  const { items: truncWaypoints } = truncatePins(waypoints);

  // Build markers
  const markers = truncWaypoints.map((wp, i) => {
    const color = (wp.color ?? COLORS.primary).replace('#', '');
    const label = wp.label ?? `${i + 1}`;
    return `pin-l-${label}+${color}(${wp.lng},${wp.lat})`;
  }).join(',');

  // Try to get actual route geometry from Directions API
  let routeGeojson: string | null = null;
  try {
    const coordStr = truncWaypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const dirUrl = `${DIRECTIONS_BASE}/${profile}/${coordStr}?access_token=${TOKEN}&geometries=geojson&overview=full`;
    const res = await fetch(dirUrl);
    if (res.ok) {
      const data = await res.json();
      const routeCoords = data.routes?.[0]?.geometry?.coordinates;
      if (routeCoords && routeCoords.length > 0) {
        routeGeojson = JSON.stringify({
          type: 'Feature',
          properties: { 'stroke': COLORS.primary, 'stroke-width': 3, 'stroke-opacity': 0.7 },
          geometry: { type: 'LineString', coordinates: routeCoords },
        });
      }
    }
  } catch {
    // Fall through to straight-line fallback
  }

  // Fallback: straight-line GeoJSON
  if (!routeGeojson) {
    routeGeojson = JSON.stringify({
      type: 'Feature',
      properties: { 'stroke': COLORS.primary, 'stroke-width': 3, 'stroke-opacity': 0.6, 'stroke-dasharray': [6, 4] },
      geometry: {
        type: 'LineString',
        coordinates: truncWaypoints.map((w) => [w.lng, w.lat]),
      },
    });
  }

  const pathOverlay = `geojson(${encodeURIComponent(routeGeojson)})`;
  let url = `${STATIC_BASE}/${DARK_STYLE}/static/${markers},${pathOverlay}/auto/${width}x${height}@2x?access_token=${TOKEN}&padding=60&attribution=false&logo=false`;

  // URL length guard
  if (url.length > MAX_URL_LENGTH) {
    // Fall back to markers only
    url = `${STATIC_BASE}/${DARK_STYLE}/static/${markers}/auto/${width}x${height}@2x?access_token=${TOKEN}&padding=60&attribution=false&logo=false`;
  }

  return url;
}

// ---------------------------------------------------------------------------
// Dark Style URL Builder (ROAM's exact dark palette)
// ---------------------------------------------------------------------------

/**
 * Build a dark-styled Mapbox static map URL with ROAM's brand colors.
 * No pins, just the map itself — useful for background images.
 */
export function buildDarkStyleUrl(params: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
  bearing?: number;
  pitch?: number;
}): string | null {
  if (!TOKEN) return null;

  const { lat, lng, zoom = 12, width = 800, height = 400, bearing = 0, pitch = 0 } = params;

  return `${STATIC_BASE}/${DARK_STYLE}/static/${lng},${lat},${zoom},${bearing},${pitch}/${width}x${height}@2x?access_token=${TOKEN}&attribution=false&logo=false`;
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

  const allPins = [
    ...params.visited.map((p) => ({ ...p, color: sageHex, size: 's' as const })),
    ...params.planned.map((p) => ({ ...p, color: goldHex, size: 's' as const })),
  ];

  const { items: truncPins } = truncatePins(allPins);

  const markers = truncPins.map((p) =>
    `pin-${p.size}+${p.color}(${p.lng},${p.lat})`
  ).join(',');

  if (!markers) return null;

  let url = `${STATIC_BASE}/${DARK_STYLE}/static/${markers}/auto/${width}x${height}@2x?access_token=${TOKEN}&padding=40&attribution=false&logo=false`;

  // URL length guard
  if (url.length > MAX_URL_LENGTH) {
    const reducedPins = truncPins.slice(0, Math.floor(truncPins.length / 2));
    const reducedMarkers = reducedPins.map((p) =>
      `pin-${p.size}+${p.color}(${p.lng},${p.lat})`
    ).join(',');
    url = `${STATIC_BASE}/${DARK_STYLE}/static/${reducedMarkers}/auto/${width}x${height}@2x?access_token=${TOKEN}&padding=40&attribution=false&logo=false`;
  }

  return url;
}

// ---------------------------------------------------------------------------
// Check if Mapbox is configured
// ---------------------------------------------------------------------------
/**
 * Check if Mapbox token is available and looks valid.
 * On web, process.env values are string-replaced at build time by Expo/Metro.
 * If the token is empty or the literal placeholder string, Mapbox is not configured.
 */
export function isMapboxConfigured(): boolean {
  // Must have a token and it should start with 'pk.' (public token prefix)
  return TOKEN.length > 0 && TOKEN.startsWith('pk.');
}

/**
 * Get the Mapbox token (for components that need it directly).
 */
export function getMapboxToken(): string {
  return TOKEN;
}
