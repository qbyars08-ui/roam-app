// =============================================================================
// ROAM — Google Places Autocomplete & Details
// =============================================================================

const AUTOCOMPLETE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL =
  'https://maps.googleapis.com/maps/api/place/details/json';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlacePrediction {
  /** Google Place ID */
  placeId: string;
  /** Main text (city/place name) */
  mainText: string;
  /** Secondary text (region/country) */
  secondaryText: string;
  /** Full formatted description */
  description: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  /** ISO 3166-1 alpha-2 country code */
  country: string;
  /** URL for the primary photo, if available */
  photoUrl: string | null;
  /** UTC offset in minutes */
  utcOffset: number | null;
}

// ---------------------------------------------------------------------------
// Autocomplete search
// ---------------------------------------------------------------------------

/**
 * Search Google Places Autocomplete for destination predictions.
 * Filters to cities/regions only so users get clean destination results.
 *
 * Returns an empty array (rather than throwing) on errors so the UI
 * can gracefully degrade.
 */
export async function searchPlaces(
  query: string
): Promise<PlacePrediction[]> {
  if (!query || query.length < 2) return [];

  if (!API_KEY) {
    console.warn('[Places] Missing EXPO_PUBLIC_GOOGLE_PLACES_KEY');
    return [];
  }

  try {
    const params = new URLSearchParams({
      input: query,
      types: '(cities)',
      key: API_KEY,
    });

    const response = await fetch(`${AUTOCOMPLETE_URL}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Places] Autocomplete error:', data.status, data.error_message);
      return [];
    }

    return (data.predictions ?? []).map((p: {
      place_id: string;
      description: string;
      structured_formatting?: { main_text?: string; secondary_text?: string };
    }) => ({
      placeId: p.place_id,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
      description: p.description,
    }));
  } catch (err) {
    console.error('[Places] Search error:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Place details
// ---------------------------------------------------------------------------

/**
 * Fetch detailed information for a place by its Place ID.
 * Useful for getting lat/lng, country code, and photo after the user
 * selects a destination from autocomplete.
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  if (!placeId) return null;

  if (!API_KEY) {
    console.warn('[Places] Missing EXPO_PUBLIC_GOOGLE_PLACES_KEY');
    return null;
  }

  try {
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
      'address_components',
      'photos',
      'utc_offset',
    ].join(',');

    const params = new URLSearchParams({
      place_id: placeId,
      fields,
      key: API_KEY,
    });

    const response = await fetch(`${DETAILS_URL}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[Places] Details error:', data.status, data.error_message);
      return null;
    }

    const result = data.result;

    // Extract country code from address_components
    const countryComponent = result.address_components?.find((c: Record<string, unknown>) =>
      (c.types as string[] | undefined)?.includes('country')
    );
    const country = countryComponent?.short_name ?? '';

    // Build a photo URL if available
    let photoUrl: string | null = null;
    if (result.photos?.length > 0) {
      const photoRef = result.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${API_KEY}`;
    }

    return {
      placeId: result.place_id,
      name: result.name,
      formattedAddress: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      country,
      photoUrl,
      utcOffset: result.utc_offset ?? null,
    };
  } catch (err) {
    console.error('[Places] Details error:', err);
    return null;
  }
}
