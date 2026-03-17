// ROAM — Universal Destination Enrichment Layer
// Calls all available APIs in parallel, returns whatever succeeds, graceful null fallbacks

import type { PlaceResult, PlaceDetails } from './google-places';
import type { FlightOffer, PriceCalendarDay } from './amadeus';
import type { CurrentWeather, ForecastDay } from './openweather';
import type { GeoResult } from './mapbox';
import type { EventResult } from './eventbrite';
import type { RouteResult } from './rome2rio';
import type { TALocation } from './tripadvisor';
import type { VisaResult, EntryRequirements } from './sherpa';
import type { GYGActivity } from './getyourguide';
import type { FSQPlace } from './foursquare';

import { searchNearby } from './google-places';
import { searchFlights, getFlightPriceCalendar } from './amadeus';
import { getCurrentWeather, getForecast } from './openweather';
import { geocode } from './mapbox';
import { searchEvents } from './eventbrite';
import { getRoutes } from './rome2rio';
import { searchLocations } from './tripadvisor';
import { getVisaRequirements, getEntryRequirements } from './sherpa';
import { searchActivities } from './getyourguide';
import { searchPlaces } from './foursquare';

// ---------------------------------------------------------------------------
// Enrichment result type — every field nullable (graceful degradation)
// ---------------------------------------------------------------------------

export interface DestinationEnrichment {
  destination: string;
  coordinates: GeoResult | null;
  weather: {
    current: CurrentWeather | null;
    forecast: ForecastDay[] | null;
  };
  places: {
    restaurants: PlaceResult[] | null;
    attractions: PlaceResult[] | null;
    hotels: PlaceResult[] | null;
  };
  flights: {
    offers: FlightOffer[] | null;
    calendar: PriceCalendarDay[] | null;
  };
  events: EventResult[] | null;
  transit: RouteResult[] | null;
  tripadvisor: TALocation[] | null;
  visa: VisaResult | null;
  entry: EntryRequirements | null;
  activities: GYGActivity[] | null;
  foursquare: FSQPlace[] | null;
  fetchedAt: string;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface EnrichOptions {
  origin?: string;           // IATA code for flights + transit
  departureDate?: string;    // YYYY-MM-DD
  departureMonth?: string;   // YYYY-MM for price calendar
  passportCountry?: string;  // ISO for visa check
  tripDates?: { start: string; end: string };
  skip?: Array<
    'weather' | 'places' | 'flights' | 'events' | 'transit' |
    'tripadvisor' | 'visa' | 'activities' | 'foursquare'
  >;
}

// ---------------------------------------------------------------------------
// Safe wrapper — catches per-API, never lets one failure break others
// ---------------------------------------------------------------------------

async function safe<T>(
  label: string,
  fn: () => Promise<T | null>,
  errors: string[],
): Promise<T | null> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`${label}: ${msg}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// enrichDestination — the main export
// ---------------------------------------------------------------------------

export async function enrichDestination(
  destination: string,
  options: EnrichOptions = {},
): Promise<DestinationEnrichment> {
  const errors: string[] = [];
  const skip = new Set(options.skip ?? []);

  // Step 1: Geocode first (needed for lat/lng-dependent APIs)
  const coordinates = await safe('geocode', () => geocode(destination), errors);
  const lat = coordinates?.lat ?? 0;
  const lng = coordinates?.lng ?? 0;
  const hasCoords = lat !== 0 || lng !== 0;

  // Step 2: Fire all remaining APIs in parallel
  const [
    currentWeather,
    forecast,
    restaurants,
    attractions,
    hotels,
    flightOffers,
    flightCalendar,
    events,
    transit,
    taLocations,
    visa,
    entry,
    activities,
    fsqPlaces,
  ] = await Promise.all([
    // Weather
    skip.has('weather')
      ? Promise.resolve(null)
      : safe('weather.current', () => getCurrentWeather(destination), errors),
    skip.has('weather')
      ? Promise.resolve(null)
      : safe('weather.forecast', () => getForecast(destination), errors),

    // Google Places (need coords)
    skip.has('places') || !hasCoords
      ? Promise.resolve(null)
      : safe('places.restaurants', () => searchNearby(lat, lng, 'restaurant'), errors),
    skip.has('places') || !hasCoords
      ? Promise.resolve(null)
      : safe('places.attractions', () => searchNearby(lat, lng, 'tourist_attraction'), errors),
    skip.has('places') || !hasCoords
      ? Promise.resolve(null)
      : safe('places.hotels', () => searchNearby(lat, lng, 'lodging'), errors),

    // Flights (need origin + date)
    skip.has('flights') || !options.origin || !options.departureDate
      ? Promise.resolve(null)
      : safe('flights.search', () =>
          searchFlights(options.origin!, destination, options.departureDate!),
        errors),
    skip.has('flights') || !options.origin || !options.departureMonth
      ? Promise.resolve(null)
      : safe('flights.calendar', () =>
          getFlightPriceCalendar(options.origin!, destination, options.departureMonth!),
        errors),

    // Events
    skip.has('events')
      ? Promise.resolve(null)
      : safe('events', () =>
          searchEvents(
            destination,
            options.tripDates?.start,
            options.tripDates?.end,
          ),
        errors),

    // Transit (need origin)
    skip.has('transit') || !options.origin
      ? Promise.resolve(null)
      : safe('transit', () => getRoutes(options.origin!, destination), errors),

    // TripAdvisor
    skip.has('tripadvisor')
      ? Promise.resolve(null)
      : safe('tripadvisor', () => searchLocations(destination), errors),

    // Visa (need passport country)
    skip.has('visa') || !options.passportCountry
      ? Promise.resolve(null)
      : safe('visa', () =>
          getVisaRequirements(options.passportCountry!, destination),
        errors),
    skip.has('visa')
      ? Promise.resolve(null)
      : safe('entry', () => getEntryRequirements(destination), errors),

    // Activities
    skip.has('activities')
      ? Promise.resolve(null)
      : safe('activities', () =>
          searchActivities(destination, options.tripDates?.start),
        errors),

    // Foursquare (need coords)
    skip.has('foursquare') || !hasCoords
      ? Promise.resolve(null)
      : safe('foursquare', () =>
          searchPlaces('things to do', lat, lng),
        errors),
  ]);

  return {
    destination,
    coordinates,
    weather: { current: currentWeather, forecast },
    places: { restaurants, attractions, hotels },
    flights: { offers: flightOffers, calendar: flightCalendar },
    events,
    transit,
    tripadvisor: taLocations,
    visa,
    entry,
    activities,
    foursquare: fsqPlaces,
    fetchedAt: new Date().toISOString(),
    errors,
  };
}

// ---------------------------------------------------------------------------
// Re-exports — named to avoid collisions
// ---------------------------------------------------------------------------

export {
  searchNearby,
  getPlaceDetails as getGooglePlaceDetails,
  getPlacePhotos,
} from './google-places';
export type { PlaceResult, PlaceDetails, PlaceReview } from './google-places';

export { searchFlights, getFlightPriceCalendar, getCheapestDates } from './amadeus';
export type { FlightOffer, PriceCalendarDay, CheapDate } from './amadeus';

export { getCurrentWeather, getForecast } from './openweather';
export type { CurrentWeather, ForecastDay } from './openweather';

export { geocode, reverseGeocode, getDirections } from './mapbox';
export type { GeoResult, DirectionsResult, DirectionStep } from './mapbox';

export { searchEvents } from './eventbrite';
export type { EventResult } from './eventbrite';

export { getRoutes } from './rome2rio';
export type { RouteResult, RouteSegment } from './rome2rio';

export {
  searchLocations as searchTALocations,
  getLocationDetails,
  getLocationReviews,
} from './tripadvisor';
export type { TALocation, TALocationDetails, TAReview } from './tripadvisor';

export { getVisaRequirements, getEntryRequirements } from './sherpa';
export type { VisaResult, EntryRequirements } from './sherpa';

export { searchActivities, getActivityDetails } from './getyourguide';
export type { GYGActivity, GYGActivityDetails } from './getyourguide';

export {
  searchPlaces as searchFSQPlaces,
  getPlaceDetails as getFSQPlaceDetails,
  getPlaceTips,
} from './foursquare';
export type { FSQPlace, FSQPlaceDetails, FSQTip } from './foursquare';
