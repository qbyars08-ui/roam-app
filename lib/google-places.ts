// =============================================================================
// ROAM — Google Places API v1 (New) Integration
// Search for restaurants, experiences, and hikes with travel profile filtering
// =============================================================================

import type { TravelProfile } from './types/travel-profile';
import { getCoordsForDestination } from './destination-coords';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const PHOTO_BASE_URL = 'https://places.googleapis.com/v1';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.formattedAddress',
  'places.photos',
  'places.location',
  'places.currentOpeningHours',
  'places.types',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'rating',
  'userRatingCount',
  'priceLevel',
  'formattedAddress',
  'photos',
  'location',
  'currentOpeningHours',
  'types',
  'editorialSummary',
  'websiteUri',
  'nationalPhoneNumber',
  'regularOpeningHours',
  'reviews',
  'googleMapsUri',
].join(',');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlaceResult = {
  /** Google Place resource name (e.g. "places/ChIJ...") */
  id: string;
  /** Human-readable place name */
  name: string;
  /** Average rating 0-5 */
  rating: number;
  /** Total number of user ratings */
  userRatingsTotal: number;
  /** Price level 0-4 (free to very expensive) */
  priceLevel: number;
  /** Full formatted address */
  address: string;
  /** URL for the first photo, or null */
  photoUrl: string | null;
  /** Geographic coordinates */
  location: { lat: number; lng: number };
  /** Whether the place is currently open */
  openNow?: boolean;
  /** Google place type tags */
  types: string[];
  /** Generated highlight string from rating + reviews + price */
  highlight: string;
};

export type PlaceDetails = {
  id: string;
  name: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel: number;
  address: string;
  photoUrl: string | null;
  /** All available photo URLs */
  photoUrls: string[];
  location: { lat: number; lng: number };
  openNow?: boolean;
  types: string[];
  highlight: string;
  /** Editorial summary from Google */
  editorialSummary: string | null;
  /** Website URL */
  websiteUri: string | null;
  /** Phone number */
  phoneNumber: string | null;
  /** Formatted opening hours */
  openingHours: string[] | null;
  /** Google Maps deep link */
  googleMapsUri: string | null;
  /** User reviews (first few) */
  reviews: PlaceReview[];
};

export type PlaceReview = {
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
};

export type RestaurantSearchOptions = {
  budget?: string;
  cuisine?: string;
  limit?: number;
};

export type ExperienceSearchOptions = {
  type?: string;
  limit?: number;
};

export type HikeSearchOptions = {
  difficulty?: string;
  limit?: number;
};

/** Result of a places search, with transparency flag for mock/offline data */
export type PlaceSearchResult = {
  results: PlaceResult[];
  isMock: boolean;
};

/** True when Google Places API key is configured; false means mock data will be returned */
export const GOOGLE_PLACES_API_AVAILABLE = !!API_KEY;

// ---------------------------------------------------------------------------
// Price level mapping
// ---------------------------------------------------------------------------

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/** Map budget style (1-10 slider) to acceptable price levels */
function getBudgetPriceLevels(budgetStyle: number): [number, number] {
  if (budgetStyle <= 3) return [0, 1];   // backpacker
  if (budgetStyle <= 5) return [1, 2];   // comfort
  if (budgetStyle <= 7) return [2, 3];   // treat-yourself
  return [3, 4];                          // luxury
}

/** Map budget string labels to price level ranges */
function getBudgetPriceLevelsFromString(budget?: string): [number, number] | null {
  if (!budget) return null;
  const lower = budget.toLowerCase();
  if (lower.includes('backpacker') || lower.includes('budget')) return [0, 1];
  if (lower.includes('comfort') || lower.includes('mid')) return [1, 2];
  if (lower.includes('treat') || lower.includes('splurge')) return [2, 3];
  if (lower.includes('luxury') || lower.includes('premium')) return [3, 4];
  return null;
}

// ---------------------------------------------------------------------------
// Highlight generator
// ---------------------------------------------------------------------------

function generateHighlight(rating: number, reviewCount: number, priceLevel: number): string {
  const parts: string[] = [];

  if (rating >= 4.5 && reviewCount > 500) {
    parts.push('Top rated');
  } else if (rating >= 4.0) {
    parts.push('Highly rated');
  } else if (rating >= 3.5) {
    parts.push('Well reviewed');
  }

  if (reviewCount > 5000) {
    parts.push('very popular');
  } else if (reviewCount > 1000) {
    parts.push('popular');
  } else if (reviewCount < 100) {
    parts.push('hidden gem');
  }

  const priceLabels = ['free', 'budget-friendly', 'moderate', 'upscale', 'luxury'];
  parts.push(priceLabels[priceLevel] ?? 'moderate');

  return parts.join(' · ');
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<PlaceResult[]>>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCached(key: string): PlaceResult[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: PlaceResult[]): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Clear all cached place results */
export function clearPlacesCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Internal: API call helper
// ---------------------------------------------------------------------------

/**
 * Execute a text search against Google Places API v1 (New).
 * Returns raw API response or null on failure.
 */
async function textSearch(
  query: string,
  options?: {
    locationBias?: { lat: number; lng: number; radius?: number };
    maxResults?: number;
    priceLevels?: string[];
  }
): Promise<any | null> {
  if (!API_KEY) return null;

  const body: Record<string, any> = {
    textQuery: query,
  };

  if (options?.maxResults) {
    body.maxResultCount = Math.min(options.maxResults, 20);
  }

  if (options?.locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: options.locationBias.lat,
          longitude: options.locationBias.lng,
        },
        radius: options.locationBias.radius ?? 15000,
      },
    };
  }

  if (options?.priceLevels && options.priceLevels.length > 0) {
    body.priceLevels = options.priceLevels;
  }

  try {
    const response = await fetch(TEXT_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[GooglePlaces] Text search failed:', response.status, errText);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error('[GooglePlaces] Text search error:', err);
    return null;
  }
}

/**
 * Parse a raw API place object into a PlaceResult.
 */
function parsePlaceResult(place: any): PlaceResult {
  const priceLevel = PRICE_LEVEL_MAP[place.priceLevel] ?? 2;
  const rating = place.rating ?? 0;
  const reviewCount = place.userRatingCount ?? 0;

  let photoUrl: string | null = null;
  if (place.photos?.length > 0) {
    const photoName = place.photos[0].name;
    photoUrl = `${PHOTO_BASE_URL}/${photoName}/media?maxWidthPx=400&key=${API_KEY}`;
  }

  return {
    id: place.id ?? place.name ?? '',
    name: place.displayName?.text ?? 'Unknown',
    rating,
    userRatingsTotal: reviewCount,
    priceLevel,
    address: place.formattedAddress ?? '',
    photoUrl,
    location: {
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
    },
    openNow: place.currentOpeningHours?.openNow,
    types: place.types ?? [],
    highlight: generateHighlight(rating, reviewCount, priceLevel),
  };
}

// ---------------------------------------------------------------------------
// Profile-aware filtering & sorting
// ---------------------------------------------------------------------------

/**
 * Apply travel profile preferences to filter and sort results.
 * - Budget style controls which price levels pass through
 * - Food adventurousness affects cuisine filtering (restaurants only)
 * - Pace determines result count: slow = fewer top picks, fast = more variety
 */
function applyProfileFilters(
  results: PlaceResult[],
  profile?: TravelProfile,
  requestedLimit?: number
): PlaceResult[] {
  let filtered = [...results];

  if (profile) {
    // Filter by budget/price level
    const [minPrice, maxPrice] = getBudgetPriceLevels(profile.budgetStyle);
    filtered = filtered.filter(
      (r) => r.priceLevel >= minPrice && r.priceLevel <= maxPrice
    );

    // Sort: higher rating first, break ties by review count
    filtered.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.userRatingsTotal - a.userRatingsTotal;
    });

    // Pace-based limiting
    if (!requestedLimit) {
      if (profile.pace <= 3) {
        // Slow: fewer, higher-quality picks
        filtered = filtered.slice(0, 5);
      } else if (profile.pace >= 8) {
        // Fast: more variety
        filtered = filtered.slice(0, 15);
      } else {
        filtered = filtered.slice(0, 10);
      }
    }

    // Food adventurousness: for low adventurousness, boost familiar types
    if (profile.foodAdventurousness <= 3) {
      filtered.sort((a, b) => {
        const aFamiliar = a.types.some((t) =>
          ['cafe', 'pizza_restaurant', 'hamburger_restaurant', 'sandwich_shop'].includes(t)
        ) ? 1 : 0;
        const bFamiliar = b.types.some((t) =>
          ['cafe', 'pizza_restaurant', 'hamburger_restaurant', 'sandwich_shop'].includes(t)
        ) ? 1 : 0;
        return bFamiliar - aFamiliar;
      });
    }
  }

  if (requestedLimit) {
    filtered = filtered.slice(0, requestedLimit);
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Public API: searchRestaurants
// ---------------------------------------------------------------------------

/**
 * Search for restaurants near a destination, optionally filtered by budget,
 * cuisine, and travel profile preferences.
 *
 * @param destination - City name (must match a known destination for location bias)
 * @param options - Optional filters for budget, cuisine, and result count
 * @param profile - Optional travel profile for personalized filtering
 * @returns Array of restaurant results sorted by relevance
 *
 * @example
 * ```ts
 * const { results, isMock } = await searchRestaurants('Tokyo', { cuisine: 'ramen', limit: 5 });
 * // Show MockDataBadge when isMock is true
 * ```
 */
export async function searchRestaurants(
  destination: string,
  options?: RestaurantSearchOptions,
  profile?: TravelProfile
): Promise<PlaceSearchResult> {
  const cacheKey = `restaurants:${destination}:${options?.cuisine ?? ''}:${options?.budget ?? ''}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { results: applyProfileFilters(cached, profile, options?.limit), isMock: false };
  }

  // Fall back to mock data if no API key
  if (!API_KEY) {
    const mocks = getMockRestaurants(destination);
    return { results: applyProfileFilters(mocks, profile, options?.limit), isMock: true };
  }

  const coords = getCoordsForDestination(destination);
  const cuisineClause = options?.cuisine ? ` ${options.cuisine}` : '';
  const query = `best restaurants${cuisineClause} in ${destination}`;

  // Build price level filter from budget string
  const budgetRange = getBudgetPriceLevelsFromString(options?.budget);
  const priceLevelEnums = budgetRange
    ? buildPriceLevelEnums(budgetRange[0], budgetRange[1])
    : undefined;

  const data = await textSearch(query, {
    locationBias: coords ? { ...coords, radius: 15000 } : undefined,
    maxResults: 20,
    priceLevels: priceLevelEnums,
  });

  if (!data?.places) {
    const mocks = getMockRestaurants(destination);
    return { results: applyProfileFilters(mocks, profile, options?.limit), isMock: true };
  }

  const results = data.places.map(parsePlaceResult);
  setCache(cacheKey, results);
  return { results: applyProfileFilters(results, profile, options?.limit), isMock: false };
}

// ---------------------------------------------------------------------------
// Public API: searchExperiences
// ---------------------------------------------------------------------------

/**
 * Search for experiences, attractions, and things to do near a destination.
 *
 * @param destination - City name
 * @param options - Optional type filter and result count
 * @param profile - Optional travel profile for personalized filtering
 * @returns Array of experience/attraction results
 *
 * @example
 * ```ts
 * const results = await searchExperiences('Bali', { type: 'temple', limit: 5 });
 * ```
 */
export async function searchExperiences(
  destination: string,
  options?: ExperienceSearchOptions,
  profile?: TravelProfile
): Promise<PlaceSearchResult> {
  const cacheKey = `experiences:${destination}:${options?.type ?? ''}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { results: applyProfileFilters(cached, profile, options?.limit), isMock: false };
  }

  if (!API_KEY) {
    const mocks = getMockExperiences(destination);
    return { results: applyProfileFilters(mocks, profile, options?.limit), isMock: true };
  }

  const coords = getCoordsForDestination(destination);
  const typeClause = options?.type ? ` ${options.type}` : '';
  const query = `best${typeClause} things to do attractions in ${destination}`;

  const data = await textSearch(query, {
    locationBias: coords ? { ...coords, radius: 20000 } : undefined,
    maxResults: 20,
  });

  if (!data?.places) {
    const mocks = getMockExperiences(destination);
    return { results: applyProfileFilters(mocks, profile, options?.limit), isMock: true };
  }

  const results = data.places.map(parsePlaceResult);
  setCache(cacheKey, results);
  return { results: applyProfileFilters(results, profile, options?.limit), isMock: false };
}

// ---------------------------------------------------------------------------
// Public API: searchHikes
// ---------------------------------------------------------------------------

/**
 * Search for hiking trails and nature walks near a destination.
 *
 * @param destination - City name
 * @param options - Optional difficulty filter and result count
 * @param profile - Optional travel profile for personalized filtering
 * @returns Array of hiking trail results
 *
 * @example
 * ```ts
 * const { results, isMock } = await searchHikes('Cape Town', { difficulty: 'moderate', limit: 3 });
 * // Show MockDataBadge when isMock is true
 * ```
 */
export async function searchHikes(
  destination: string,
  options?: HikeSearchOptions,
  profile?: TravelProfile
): Promise<PlaceSearchResult> {
  const cacheKey = `hikes:${destination}:${options?.difficulty ?? ''}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { results: applyProfileFilters(cached, profile, options?.limit), isMock: false };
  }

  if (!API_KEY) {
    const mocks = getMockHikes(destination);
    return { results: applyProfileFilters(mocks, profile, options?.limit), isMock: true };
  }

  const coords = getCoordsForDestination(destination);
  const diffClause = options?.difficulty ? ` ${options.difficulty}` : '';
  const query = `best${diffClause} hiking trails nature walks near ${destination}`;

  const data = await textSearch(query, {
    locationBias: coords ? { ...coords, radius: 50000 } : undefined,
    maxResults: 20,
  });

  if (!data?.places) {
    const mocks = getMockHikes(destination);
    return { results: applyProfileFilters(mocks, profile, options?.limit), isMock: true };
  }

  const results = data.places.map(parsePlaceResult);
  setCache(cacheKey, results);
  return { results: applyProfileFilters(results, profile, options?.limit), isMock: false };
}

// ---------------------------------------------------------------------------
// Public API: getPlaceDetails
// ---------------------------------------------------------------------------

/**
 * Fetch full details for a single place by its resource ID.
 *
 * @param placeId - Google Place resource name (e.g. "places/ChIJ...")
 * @returns Detailed place information including reviews and hours
 */
export async function getPlaceDetailsV2(placeId: string): Promise<PlaceDetails | null> {
  if (!placeId) return null;

  if (!API_KEY) {
    console.warn('[GooglePlaces] No API key — cannot fetch place details');
    return null;
  }

  // Ensure the ID has the "places/" prefix
  const resourceName = placeId.startsWith('places/') ? placeId : `places/${placeId}`;

  try {
    const response = await fetch(`${PLACE_DETAILS_URL}/${resourceName}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[GooglePlaces] Details failed:', response.status, errText);
      return null;
    }

    const place = await response.json();
    const priceLevel = PRICE_LEVEL_MAP[place.priceLevel] ?? 2;
    const rating = place.rating ?? 0;
    const reviewCount = place.userRatingCount ?? 0;

    const photoUrls: string[] = (place.photos ?? []).map(
      (p: any) => `${PHOTO_BASE_URL}/${p.name}/media?maxWidthPx=800&key=${API_KEY}`
    );

    const reviews: PlaceReview[] = (place.reviews ?? []).slice(0, 5).map((r: any) => ({
      authorName: r.authorAttribution?.displayName ?? 'Anonymous',
      rating: r.rating ?? 0,
      text: r.text?.text ?? '',
      relativeTime: r.relativePublishTimeDescription ?? '',
    }));

    return {
      id: place.id ?? '',
      name: place.displayName?.text ?? 'Unknown',
      rating,
      userRatingsTotal: reviewCount,
      priceLevel,
      address: place.formattedAddress ?? '',
      photoUrl: photoUrls[0] ?? null,
      photoUrls,
      location: {
        lat: place.location?.latitude ?? 0,
        lng: place.location?.longitude ?? 0,
      },
      openNow: place.currentOpeningHours?.openNow,
      types: place.types ?? [],
      highlight: generateHighlight(rating, reviewCount, priceLevel),
      editorialSummary: place.editorialSummary?.text ?? null,
      websiteUri: place.websiteUri ?? null,
      phoneNumber: place.nationalPhoneNumber ?? null,
      openingHours: place.regularOpeningHours?.weekdayDescriptions ?? null,
      googleMapsUri: place.googleMapsUri ?? null,
      reviews,
    };
  } catch (err) {
    console.error('[GooglePlaces] Details error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API: getPlacePhoto
// ---------------------------------------------------------------------------

/**
 * Build a URL for a Google Places photo by its resource name.
 *
 * @param photoReference - Photo resource name from Places API (e.g. "places/ChIJ.../photos/...")
 * @param maxWidth - Maximum width in pixels (default 400)
 * @returns Full photo URL string
 */
export function getPlacePhoto(photoReference: string, maxWidth: number = 400): string {
  if (!API_KEY) return '';
  // Handle both full resource names and bare references
  const name = photoReference.startsWith('places/')
    ? photoReference
    : photoReference;
  return `${PHOTO_BASE_URL}/${name}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the enum strings the Places API v1 expects for price levels */
function buildPriceLevelEnums(min: number, max: number): string[] {
  const levels = [
    'PRICE_LEVEL_FREE',
    'PRICE_LEVEL_INEXPENSIVE',
    'PRICE_LEVEL_MODERATE',
    'PRICE_LEVEL_EXPENSIVE',
    'PRICE_LEVEL_VERY_EXPENSIVE',
  ];
  return levels.slice(min, max + 1);
}

// =============================================================================
// Mock Data Fallback
// =============================================================================
// When EXPO_PUBLIC_GOOGLE_PLACES_KEY is not set, the search functions fall back
// to curated mock data so the app remains fully functional during development.
// =============================================================================

function makeMockPlace(overrides: Partial<PlaceResult> & { name: string }): PlaceResult {
  const rating = overrides.rating ?? 4.2;
  const userRatingsTotal = overrides.userRatingsTotal ?? 500;
  const priceLevel = overrides.priceLevel ?? 2;
  return {
    id: `mock-${overrides.name.toLowerCase().replace(/\s+/g, '-')}`,
    rating,
    userRatingsTotal,
    priceLevel,
    address: overrides.address ?? '',
    photoUrl: null,
    location: overrides.location ?? { lat: 0, lng: 0 },
    openNow: true,
    types: overrides.types ?? ['restaurant'],
    highlight: generateHighlight(rating, userRatingsTotal, priceLevel),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock Restaurants
// ---------------------------------------------------------------------------

const MOCK_RESTAURANTS: Record<string, PlaceResult[]> = {
  Tokyo: [
    makeMockPlace({ name: 'Tsukiji Outer Market Sushi', rating: 4.6, userRatingsTotal: 8200, priceLevel: 2, address: 'Tsukiji, Chuo City, Tokyo', types: ['restaurant', 'sushi_restaurant'], location: { lat: 35.6654, lng: 139.7707 } }),
    makeMockPlace({ name: 'Ichiran Ramen Shibuya', rating: 4.4, userRatingsTotal: 12500, priceLevel: 1, address: 'Shibuya, Tokyo', types: ['restaurant', 'ramen_restaurant'], location: { lat: 35.6595, lng: 139.7004 } }),
    makeMockPlace({ name: 'Narisawa', rating: 4.7, userRatingsTotal: 1800, priceLevel: 4, address: 'Minato City, Tokyo', types: ['restaurant', 'fine_dining_restaurant'], location: { lat: 35.6722, lng: 139.7262 } }),
    makeMockPlace({ name: 'Afuri Ramen', rating: 4.3, userRatingsTotal: 5600, priceLevel: 1, address: 'Ebisu, Shibuya City, Tokyo', types: ['restaurant', 'ramen_restaurant'], location: { lat: 35.6467, lng: 139.7100 } }),
    makeMockPlace({ name: 'Gonpachi Nishi-Azabu', rating: 4.2, userRatingsTotal: 3400, priceLevel: 2, address: 'Nishi-Azabu, Minato City, Tokyo', types: ['restaurant', 'japanese_restaurant'], location: { lat: 35.6560, lng: 139.7265 } }),
    makeMockPlace({ name: 'Yakitori Alley Yurakucho', rating: 4.5, userRatingsTotal: 2100, priceLevel: 1, address: 'Yurakucho, Chiyoda City, Tokyo', types: ['restaurant', 'japanese_restaurant'], location: { lat: 35.6748, lng: 139.7631 } }),
    makeMockPlace({ name: 'Tempura Kondo', rating: 4.8, userRatingsTotal: 900, priceLevel: 4, address: 'Ginza, Chuo City, Tokyo', types: ['restaurant', 'japanese_restaurant'], location: { lat: 35.6713, lng: 139.7654 } }),
    makeMockPlace({ name: 'Omoide Yokocho Stalls', rating: 4.1, userRatingsTotal: 6700, priceLevel: 0, address: 'Shinjuku, Tokyo', types: ['restaurant', 'food_court'], location: { lat: 35.6938, lng: 139.6989 } }),
  ],
  Bali: [
    makeMockPlace({ name: 'Locavore', rating: 4.7, userRatingsTotal: 2100, priceLevel: 3, address: 'Jl. Dewi Sita, Ubud, Bali', types: ['restaurant', 'fine_dining_restaurant'], location: { lat: -8.5069, lng: 115.2625 } }),
    makeMockPlace({ name: 'Warung Babi Guling Ibu Oka', rating: 4.5, userRatingsTotal: 7800, priceLevel: 1, address: 'Jl. Tegal Sari, Ubud, Bali', types: ['restaurant', 'indonesian_restaurant'], location: { lat: -8.5039, lng: 115.2631 } }),
    makeMockPlace({ name: 'La Lucciola', rating: 4.3, userRatingsTotal: 3200, priceLevel: 3, address: 'Seminyak Beach, Bali', types: ['restaurant', 'italian_restaurant'], location: { lat: -8.6870, lng: 115.1561 } }),
    makeMockPlace({ name: 'Naughty Nuri\'s Warung', rating: 4.4, userRatingsTotal: 5100, priceLevel: 2, address: 'Jl. Raya Sanggingan, Ubud, Bali', types: ['restaurant', 'bbq_restaurant'], location: { lat: -8.4988, lng: 115.2568 } }),
    makeMockPlace({ name: 'Mama San', rating: 4.5, userRatingsTotal: 4300, priceLevel: 3, address: 'Jl. Raya Kerobokan, Bali', types: ['restaurant', 'asian_restaurant'], location: { lat: -8.6800, lng: 115.1600 } }),
    makeMockPlace({ name: 'Warung Makan Bu Rus', rating: 4.2, userRatingsTotal: 1200, priceLevel: 0, address: 'Ubud, Bali', types: ['restaurant', 'indonesian_restaurant'], location: { lat: -8.5100, lng: 115.2650 } }),
    makeMockPlace({ name: 'Sardine', rating: 4.6, userRatingsTotal: 2800, priceLevel: 3, address: 'Jl. Petitenget, Seminyak, Bali', types: ['restaurant', 'seafood_restaurant'], location: { lat: -8.6730, lng: 115.1590 } }),
    makeMockPlace({ name: 'Bebek Bengil (Dirty Duck Diner)', rating: 4.1, userRatingsTotal: 6500, priceLevel: 2, address: 'Padangtegal, Ubud, Bali', types: ['restaurant', 'indonesian_restaurant'], location: { lat: -8.5150, lng: 115.2600 } }),
  ],
  Bangkok: [
    makeMockPlace({ name: 'Jay Fai', rating: 4.6, userRatingsTotal: 9200, priceLevel: 3, address: 'Mahachai Rd, Phra Nakhon, Bangkok', types: ['restaurant', 'thai_restaurant'], location: { lat: 13.7535, lng: 100.5037 } }),
    makeMockPlace({ name: 'Thipsamai Pad Thai', rating: 4.5, userRatingsTotal: 11000, priceLevel: 1, address: 'Mahachai Rd, Bangkok', types: ['restaurant', 'thai_restaurant'], location: { lat: 13.7520, lng: 100.5050 } }),
    makeMockPlace({ name: 'Gaggan Anand', rating: 4.8, userRatingsTotal: 3100, priceLevel: 4, address: 'Sukhumvit, Bangkok', types: ['restaurant', 'fine_dining_restaurant'], location: { lat: 13.7380, lng: 100.5640 } }),
    makeMockPlace({ name: 'Raan Jay Fai', rating: 4.4, userRatingsTotal: 2800, priceLevel: 2, address: 'Samran Rat, Phra Nakhon, Bangkok', types: ['restaurant', 'thai_restaurant'], location: { lat: 13.7580, lng: 100.5020 } }),
    makeMockPlace({ name: 'Som Tam Nua', rating: 4.3, userRatingsTotal: 6700, priceLevel: 1, address: 'Siam Square, Bangkok', types: ['restaurant', 'thai_restaurant'], location: { lat: 13.7449, lng: 100.5341 } }),
    makeMockPlace({ name: 'Yaowarat Street Food Market', rating: 4.5, userRatingsTotal: 8900, priceLevel: 0, address: 'Yaowarat Rd, Samphanthawong, Bangkok', types: ['restaurant', 'street_food'], location: { lat: 13.7390, lng: 100.5098 } }),
    makeMockPlace({ name: 'Nahm', rating: 4.6, userRatingsTotal: 1500, priceLevel: 4, address: 'COMO Metropolitan Bangkok', types: ['restaurant', 'fine_dining_restaurant'], location: { lat: 13.7230, lng: 100.5400 } }),
    makeMockPlace({ name: 'Nai Mong Hoi Tod', rating: 4.2, userRatingsTotal: 4500, priceLevel: 0, address: 'Charoen Krung, Bangkok', types: ['restaurant', 'thai_restaurant'], location: { lat: 13.7360, lng: 100.5130 } }),
  ],
  Lisbon: [
    makeMockPlace({ name: 'Time Out Market Lisboa', rating: 4.4, userRatingsTotal: 15000, priceLevel: 2, address: 'Av. 24 de Julho, Lisbon', types: ['restaurant', 'food_court'], location: { lat: 38.7068, lng: -9.1453 } }),
    makeMockPlace({ name: 'Cervejaria Ramiro', rating: 4.5, userRatingsTotal: 9800, priceLevel: 3, address: 'Av. Almirante Reis, Lisbon', types: ['restaurant', 'seafood_restaurant'], location: { lat: 38.7289, lng: -9.1365 } }),
    makeMockPlace({ name: 'Belcanto', rating: 4.7, userRatingsTotal: 2200, priceLevel: 4, address: 'Largo de Sao Carlos, Lisbon', types: ['restaurant', 'fine_dining_restaurant'], location: { lat: 38.7105, lng: -9.1420 } }),
    makeMockPlace({ name: 'Pasteis de Belem', rating: 4.6, userRatingsTotal: 22000, priceLevel: 1, address: 'Rua de Belem, Lisbon', types: ['restaurant', 'bakery'], location: { lat: 38.6976, lng: -9.2031 } }),
    makeMockPlace({ name: 'Taberna da Rua das Flores', rating: 4.5, userRatingsTotal: 3400, priceLevel: 2, address: 'Rua das Flores, Lisbon', types: ['restaurant', 'portuguese_restaurant'], location: { lat: 38.7120, lng: -9.1450 } }),
    makeMockPlace({ name: 'A Cevicheria', rating: 4.3, userRatingsTotal: 4100, priceLevel: 3, address: 'Rua Dom Pedro V, Lisbon', types: ['restaurant', 'seafood_restaurant'], location: { lat: 38.7163, lng: -9.1470 } }),
    makeMockPlace({ name: 'Tasca do Chico', rating: 4.4, userRatingsTotal: 5200, priceLevel: 2, address: 'Rua dos Remedios, Lisbon', types: ['restaurant', 'portuguese_restaurant'], location: { lat: 38.7130, lng: -9.1260 } }),
    makeMockPlace({ name: 'Cafe A Brasileira', rating: 4.1, userRatingsTotal: 7800, priceLevel: 1, address: 'Rua Garrett, Chiado, Lisbon', types: ['restaurant', 'cafe'], location: { lat: 38.7107, lng: -9.1424 } }),
  ],
  'Mexico City': [
    makeMockPlace({ name: 'Pujol', rating: 4.8, userRatingsTotal: 4500, priceLevel: 4, address: 'Tennyson 133, Polanco, Mexico City', types: ['restaurant', 'fine_dining_restaurant'], location: { lat: 19.4342, lng: -99.1961 } }),
    makeMockPlace({ name: 'Contramar', rating: 4.6, userRatingsTotal: 7200, priceLevel: 3, address: 'Calle de Durango, Roma Norte, Mexico City', types: ['restaurant', 'seafood_restaurant'], location: { lat: 19.4180, lng: -99.1680 } }),
    makeMockPlace({ name: 'Taqueria Orinoco', rating: 4.5, userRatingsTotal: 8900, priceLevel: 1, address: 'Roma Norte, Mexico City', types: ['restaurant', 'mexican_restaurant'], location: { lat: 19.4190, lng: -99.1640 } }),
    makeMockPlace({ name: 'Los Cocuyos', rating: 4.3, userRatingsTotal: 3200, priceLevel: 0, address: 'Centro Historico, Mexico City', types: ['restaurant', 'street_food'], location: { lat: 19.4330, lng: -99.1340 } }),
    makeMockPlace({ name: 'Rosetta', rating: 4.6, userRatingsTotal: 3800, priceLevel: 3, address: 'Colima 166, Roma Norte, Mexico City', types: ['restaurant', 'italian_restaurant'], location: { lat: 19.4200, lng: -99.1620 } }),
    makeMockPlace({ name: 'El Huequito', rating: 4.4, userRatingsTotal: 6100, priceLevel: 1, address: 'Centro Historico, Mexico City', types: ['restaurant', 'mexican_restaurant'], location: { lat: 19.4340, lng: -99.1380 } }),
    makeMockPlace({ name: 'Mercado Roma', rating: 4.2, userRatingsTotal: 5500, priceLevel: 2, address: 'Queretaro, Roma Norte, Mexico City', types: ['restaurant', 'food_court'], location: { lat: 19.4150, lng: -99.1610 } }),
    makeMockPlace({ name: 'Quintonil', rating: 4.7, userRatingsTotal: 2400, priceLevel: 4, address: 'Newton 55, Polanco, Mexico City', types: ['restaurant', 'fine_dining_restaurant'], location: { lat: 19.4320, lng: -99.1970 } }),
  ],
};

// ---------------------------------------------------------------------------
// Mock Experiences
// ---------------------------------------------------------------------------

const MOCK_EXPERIENCES: Record<string, PlaceResult[]> = {
  Tokyo: [
    makeMockPlace({ name: 'Senso-ji Temple', rating: 4.6, userRatingsTotal: 45000, priceLevel: 0, address: 'Asakusa, Taito City, Tokyo', types: ['tourist_attraction', 'place_of_worship'], location: { lat: 35.7148, lng: 139.7967 } }),
    makeMockPlace({ name: 'teamLab Borderless', rating: 4.7, userRatingsTotal: 18000, priceLevel: 2, address: 'Odaiba, Koto City, Tokyo', types: ['tourist_attraction', 'museum'], location: { lat: 35.6264, lng: 139.7841 } }),
    makeMockPlace({ name: 'Meiji Shrine', rating: 4.7, userRatingsTotal: 32000, priceLevel: 0, address: 'Shibuya, Tokyo', types: ['tourist_attraction', 'place_of_worship'], location: { lat: 35.6764, lng: 139.6993 } }),
    makeMockPlace({ name: 'Shibuya Crossing', rating: 4.5, userRatingsTotal: 28000, priceLevel: 0, address: 'Shibuya, Tokyo', types: ['tourist_attraction'], location: { lat: 35.6595, lng: 139.7004 } }),
    makeMockPlace({ name: 'Tsukiji Outer Market', rating: 4.4, userRatingsTotal: 15000, priceLevel: 1, address: 'Tsukiji, Chuo City, Tokyo', types: ['tourist_attraction', 'market'], location: { lat: 35.6654, lng: 139.7707 } }),
  ],
  Bali: [
    makeMockPlace({ name: 'Tegallalang Rice Terraces', rating: 4.5, userRatingsTotal: 22000, priceLevel: 1, address: 'Tegallalang, Gianyar, Bali', types: ['tourist_attraction', 'natural_feature'], location: { lat: -8.4312, lng: 115.2795 } }),
    makeMockPlace({ name: 'Uluwatu Temple', rating: 4.6, userRatingsTotal: 18000, priceLevel: 1, address: 'Pecatu, South Kuta, Bali', types: ['tourist_attraction', 'place_of_worship'], location: { lat: -8.8291, lng: 115.0849 } }),
    makeMockPlace({ name: 'Sacred Monkey Forest Sanctuary', rating: 4.5, userRatingsTotal: 25000, priceLevel: 1, address: 'Ubud, Bali', types: ['tourist_attraction', 'park'], location: { lat: -8.5187, lng: 115.2588 } }),
    makeMockPlace({ name: 'Tirta Empul Temple', rating: 4.6, userRatingsTotal: 12000, priceLevel: 1, address: 'Tampaksiring, Gianyar, Bali', types: ['tourist_attraction', 'place_of_worship'], location: { lat: -8.4152, lng: 115.3154 } }),
    makeMockPlace({ name: 'Tanah Lot Temple', rating: 4.5, userRatingsTotal: 20000, priceLevel: 1, address: 'Beraban, Tabanan, Bali', types: ['tourist_attraction', 'place_of_worship'], location: { lat: -8.6213, lng: 115.0868 } }),
  ],
  Bangkok: [
    makeMockPlace({ name: 'Grand Palace', rating: 4.6, userRatingsTotal: 52000, priceLevel: 2, address: 'Na Phra Lan Rd, Phra Nakhon, Bangkok', types: ['tourist_attraction', 'historical_landmark'], location: { lat: 13.7500, lng: 100.4913 } }),
    makeMockPlace({ name: 'Wat Pho', rating: 4.7, userRatingsTotal: 38000, priceLevel: 1, address: 'Sanamchai Rd, Phra Nakhon, Bangkok', types: ['tourist_attraction', 'place_of_worship'], location: { lat: 13.7463, lng: 100.4930 } }),
    makeMockPlace({ name: 'Chatuchak Weekend Market', rating: 4.4, userRatingsTotal: 25000, priceLevel: 1, address: 'Chatuchak, Bangkok', types: ['tourist_attraction', 'market'], location: { lat: 13.7999, lng: 100.5508 } }),
    makeMockPlace({ name: 'Wat Arun', rating: 4.7, userRatingsTotal: 30000, priceLevel: 1, address: 'Bangkok Yai, Bangkok', types: ['tourist_attraction', 'place_of_worship'], location: { lat: 13.7437, lng: 100.4888 } }),
    makeMockPlace({ name: 'Jim Thompson House Museum', rating: 4.5, userRatingsTotal: 9800, priceLevel: 2, address: 'Rama I Rd, Pathum Wan, Bangkok', types: ['tourist_attraction', 'museum'], location: { lat: 13.7488, lng: 100.5290 } }),
  ],
  Lisbon: [
    makeMockPlace({ name: 'Belem Tower', rating: 4.5, userRatingsTotal: 42000, priceLevel: 1, address: 'Av. Brasilia, Lisbon', types: ['tourist_attraction', 'historical_landmark'], location: { lat: 38.6916, lng: -9.2160 } }),
    makeMockPlace({ name: 'Jeronimos Monastery', rating: 4.7, userRatingsTotal: 35000, priceLevel: 2, address: 'Praca do Imperio, Lisbon', types: ['tourist_attraction', 'place_of_worship'], location: { lat: 38.6979, lng: -9.2068 } }),
    makeMockPlace({ name: 'Alfama Neighborhood Walk', rating: 4.6, userRatingsTotal: 8500, priceLevel: 0, address: 'Alfama, Lisbon', types: ['tourist_attraction'], location: { lat: 38.7114, lng: -9.1300 } }),
    makeMockPlace({ name: 'LX Factory', rating: 4.4, userRatingsTotal: 12000, priceLevel: 1, address: 'Rua Rodrigues de Faria, Lisbon', types: ['tourist_attraction', 'shopping_mall'], location: { lat: 38.7036, lng: -9.1787 } }),
    makeMockPlace({ name: 'National Tile Museum', rating: 4.6, userRatingsTotal: 7200, priceLevel: 1, address: 'Rua da Madre de Deus, Lisbon', types: ['tourist_attraction', 'museum'], location: { lat: 38.7250, lng: -9.1140 } }),
  ],
  'Mexico City': [
    makeMockPlace({ name: 'Museo Nacional de Antropologia', rating: 4.8, userRatingsTotal: 38000, priceLevel: 1, address: 'Av. Paseo de la Reforma, Chapultepec, Mexico City', types: ['tourist_attraction', 'museum'], location: { lat: 19.4260, lng: -99.1863 } }),
    makeMockPlace({ name: 'Frida Kahlo Museum', rating: 4.6, userRatingsTotal: 22000, priceLevel: 2, address: 'Coyoacan, Mexico City', types: ['tourist_attraction', 'museum'], location: { lat: 19.3554, lng: -99.1626 } }),
    makeMockPlace({ name: 'Palacio de Bellas Artes', rating: 4.7, userRatingsTotal: 28000, priceLevel: 1, address: 'Centro Historico, Mexico City', types: ['tourist_attraction', 'performing_arts_theater'], location: { lat: 19.4353, lng: -99.1413 } }),
    makeMockPlace({ name: 'Xochimilco Floating Gardens', rating: 4.4, userRatingsTotal: 15000, priceLevel: 2, address: 'Xochimilco, Mexico City', types: ['tourist_attraction', 'park'], location: { lat: 19.2570, lng: -99.1040 } }),
    makeMockPlace({ name: 'Chapultepec Castle', rating: 4.7, userRatingsTotal: 20000, priceLevel: 1, address: 'Bosque de Chapultepec, Mexico City', types: ['tourist_attraction', 'historical_landmark'], location: { lat: 19.4205, lng: -99.1817 } }),
  ],
};

// ---------------------------------------------------------------------------
// Mock Hikes
// ---------------------------------------------------------------------------

const MOCK_HIKES: Record<string, PlaceResult[]> = {
  Tokyo: [
    makeMockPlace({ name: 'Mt. Takao Trail', rating: 4.5, userRatingsTotal: 12000, priceLevel: 0, address: 'Takaomachi, Hachioji, Tokyo', types: ['hiking_area', 'park'], location: { lat: 35.6251, lng: 139.2436 } }),
    makeMockPlace({ name: 'Todoroki Valley Walk', rating: 4.3, userRatingsTotal: 3200, priceLevel: 0, address: 'Todoroki, Setagaya, Tokyo', types: ['hiking_area', 'park'], location: { lat: 35.6101, lng: 139.6480 } }),
    makeMockPlace({ name: 'Okutama Mountains', rating: 4.6, userRatingsTotal: 5400, priceLevel: 0, address: 'Okutama, Nishitama District, Tokyo', types: ['hiking_area', 'natural_feature'], location: { lat: 35.8094, lng: 139.0962 } }),
  ],
  Bali: [
    makeMockPlace({ name: 'Mt. Batur Sunrise Trek', rating: 4.6, userRatingsTotal: 15000, priceLevel: 2, address: 'Kintamani, Bangli, Bali', types: ['hiking_area', 'natural_feature'], location: { lat: -8.2417, lng: 115.3753 } }),
    makeMockPlace({ name: 'Campuhan Ridge Walk', rating: 4.4, userRatingsTotal: 8000, priceLevel: 0, address: 'Ubud, Bali', types: ['hiking_area', 'park'], location: { lat: -8.4962, lng: 115.2503 } }),
    makeMockPlace({ name: 'Sekumpul Waterfall Trail', rating: 4.7, userRatingsTotal: 4500, priceLevel: 1, address: 'Sekumpul, Buleleng, Bali', types: ['hiking_area', 'natural_feature'], location: { lat: -8.1754, lng: 115.4224 } }),
  ],
  Bangkok: [
    makeMockPlace({ name: 'Khao Yai National Park Trails', rating: 4.6, userRatingsTotal: 9800, priceLevel: 1, address: 'Khao Yai National Park, Nakhon Ratchasima', types: ['hiking_area', 'national_park'], location: { lat: 14.4389, lng: 101.3725 } }),
    makeMockPlace({ name: 'Erawan National Park', rating: 4.7, userRatingsTotal: 7200, priceLevel: 1, address: 'Erawan, Kanchanaburi', types: ['hiking_area', 'national_park'], location: { lat: 14.3690, lng: 98.8692 } }),
    makeMockPlace({ name: 'Bang Krachao Green Lung', rating: 4.3, userRatingsTotal: 3500, priceLevel: 0, address: 'Phra Pradaeng, Samut Prakan', types: ['hiking_area', 'park'], location: { lat: 13.6803, lng: 100.5572 } }),
  ],
  Lisbon: [
    makeMockPlace({ name: 'Sintra-Cascais Natural Park', rating: 4.7, userRatingsTotal: 8500, priceLevel: 0, address: 'Sintra, Lisbon District', types: ['hiking_area', 'national_park'], location: { lat: 38.7873, lng: -9.3906 } }),
    makeMockPlace({ name: 'Rota Vicentina Fisherman\'s Trail', rating: 4.8, userRatingsTotal: 3200, priceLevel: 0, address: 'Alentejo Coast, Portugal', types: ['hiking_area', 'natural_feature'], location: { lat: 37.5271, lng: -8.7875 } }),
    makeMockPlace({ name: 'Arrabida Natural Park Trails', rating: 4.5, userRatingsTotal: 4800, priceLevel: 0, address: 'Setubal, Portugal', types: ['hiking_area', 'national_park'], location: { lat: 38.4890, lng: -8.9727 } }),
  ],
  'Mexico City': [
    makeMockPlace({ name: 'Nevado de Toluca', rating: 4.5, userRatingsTotal: 6200, priceLevel: 1, address: 'Zinacantepec, State of Mexico', types: ['hiking_area', 'natural_feature'], location: { lat: 19.1082, lng: -99.7578 } }),
    makeMockPlace({ name: 'Desierto de los Leones', rating: 4.4, userRatingsTotal: 8900, priceLevel: 0, address: 'Cuajimalpa, Mexico City', types: ['hiking_area', 'national_park'], location: { lat: 19.3100, lng: -99.3190 } }),
    makeMockPlace({ name: 'Iztaccihuatl Volcano Trail', rating: 4.6, userRatingsTotal: 3100, priceLevel: 1, address: 'Puebla / State of Mexico', types: ['hiking_area', 'natural_feature'], location: { lat: 19.1787, lng: -98.6424 } }),
  ],
};

// ---------------------------------------------------------------------------
// Mock data lookup helpers
// ---------------------------------------------------------------------------

function getMockRestaurants(destination: string): PlaceResult[] {
  const key = Object.keys(MOCK_RESTAURANTS).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  if (key) return MOCK_RESTAURANTS[key];

  // Generate generic mock data for unknown destinations
  return generateGenericMocks(destination, 'restaurant', 8);
}

function getMockExperiences(destination: string): PlaceResult[] {
  const key = Object.keys(MOCK_EXPERIENCES).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  if (key) return MOCK_EXPERIENCES[key];

  return generateGenericMocks(destination, 'experience', 5);
}

function getMockHikes(destination: string): PlaceResult[] {
  const key = Object.keys(MOCK_HIKES).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  if (key) return MOCK_HIKES[key];

  return generateGenericMocks(destination, 'hike', 3);
}

/**
 * Generate generic placeholder mocks for destinations without curated data.
 * This ensures the app never shows an empty state during development.
 */
function generateGenericMocks(
  destination: string,
  category: 'restaurant' | 'experience' | 'hike',
  count: number
): PlaceResult[] {
  const coords = getCoordsForDestination(destination) ?? { lat: 0, lng: 0 };

  const templates: Record<string, { names: string[]; types: string[] }> = {
    restaurant: {
      names: [
        `${destination} Central Market`,
        `Old Town Bistro`,
        `The Local Kitchen`,
        `Street Food Alley`,
        `Harbor View Restaurant`,
        `Garden Terrace Cafe`,
        `Night Market Food Stalls`,
        `Rooftop Bar & Grill`,
      ],
      types: ['restaurant'],
    },
    experience: {
      names: [
        `${destination} Historical Center`,
        `National Museum`,
        `Central Market Tour`,
        `Old Quarter Walking Tour`,
        `Sunset Viewpoint`,
      ],
      types: ['tourist_attraction'],
    },
    hike: {
      names: [
        `${destination} Nature Trail`,
        `Coastal Path Walk`,
        `Mountain Overlook Trek`,
      ],
      types: ['hiking_area', 'park'],
    },
  };

  const template = templates[category];
  return template.names.slice(0, count).map((name) =>
    makeMockPlace({
      name,
      rating: 4.0 + Math.round(Math.random() * 8) / 10,
      userRatingsTotal: 500 + Math.floor(Math.random() * 5000),
      priceLevel: Math.floor(Math.random() * 3),
      address: `${destination}`,
      types: template.types,
      location: {
        lat: coords.lat + (Math.random() - 0.5) * 0.05,
        lng: coords.lng + (Math.random() - 0.5) * 0.05,
      },
    })
  );
}
