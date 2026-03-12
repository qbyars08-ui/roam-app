// =============================================================================
// ROAM — Booking Deep Links
// One-tap connections to every major travel service. ROAM as the middle layer.
// =============================================================================
import { Linking } from 'react-native';
import { buildAffiliateUrl, trackAffiliateClick } from './affiliate-tracking';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BookingLinkParams {
  destination: string;
  checkin?: string; // YYYY-MM-DD
  checkout?: string;
  adults?: number;
}

interface FlightLinkParams {
  origin?: string; // IATA code
  destination: string;
  departDate?: string; // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
}

// ---------------------------------------------------------------------------
// Hotel Booking — Booking.com deep link
// ---------------------------------------------------------------------------
export function getHotelLink(params: BookingLinkParams): string {
  const base = `https://www.booking.com/searchresults.html`;
  const url = new URL(base);
  url.searchParams.set('ss', params.destination);
  if (params.checkin) url.searchParams.set('checkin', params.checkin);
  if (params.checkout) url.searchParams.set('checkout', params.checkout);
  url.searchParams.set('group_adults', String(params.adults ?? 2));
  return buildAffiliateUrl({ partner: 'booking', baseUrl: url.toString(), destination: params.destination, placement: 'itinerary' });
}

// ---------------------------------------------------------------------------
// Flight Search — Skyscanner deep link
// ---------------------------------------------------------------------------
export function getFlightLink(params: FlightLinkParams): string {
  const dest = encodeURIComponent(params.destination.toLowerCase().replace(/\s+/g, '-'));
  const origin = params.origin ?? 'anywhere';
  const depart = params.departDate ?? 'anytime';
  const ret = params.returnDate ?? 'anytime';
  const base = `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${depart}/${ret}/`;
  return buildAffiliateUrl({ partner: 'skyscanner', baseUrl: base, destination: params.destination, placement: 'itinerary' });
}

// ---------------------------------------------------------------------------
// Experiences — GetYourGuide deep link
// ---------------------------------------------------------------------------
export function getExperienceLink(destination: string, query?: string): string {
  const q = query ?? destination;
  const base = `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}`;
  return buildAffiliateUrl({ partner: 'gyg', baseUrl: base, destination, placement: 'itinerary' });
}

// ---------------------------------------------------------------------------
// Restaurant Reservations — OpenTable
// ---------------------------------------------------------------------------
export function getRestaurantLink(destination: string): string {
  const city = destination.toLowerCase().replace(/\s+/g, '-');
  return `https://www.opentable.com/${city}-restaurants`;
}

// ---------------------------------------------------------------------------
// Ride Hailing — Uber deep link
// ---------------------------------------------------------------------------
export function getUberLink(destLat?: number, destLng?: number): string {
  if (destLat && destLng) {
    return `uber://?action=setPickup&dropoff[latitude]=${destLat}&dropoff[longitude]=${destLng}`;
  }
  return 'uber://';
}

// ---------------------------------------------------------------------------
// Travel Insurance — SafetyWing affiliate
// ---------------------------------------------------------------------------
export function getInsuranceLink(destination: string): string {
  return `https://safetywing.com/nomad-insurance?referenceID=roam&utm_source=roam&utm_medium=app&utm_campaign=${encodeURIComponent(destination.toLowerCase())}`;
}

// ---------------------------------------------------------------------------
// eSIM — Airalo affiliate
// ---------------------------------------------------------------------------
export function getEsimLink(countryCode: string): string {
  return `https://www.airalo.com/${countryCode.toLowerCase()}?ref=roam`;
}

// ---------------------------------------------------------------------------
// Open any link with tracking
// ---------------------------------------------------------------------------
export async function openBookingLink(
  url: string,
  partner: Parameters<typeof trackAffiliateClick>[0]['partner'],
  destination: string,
  placement: string
): Promise<void> {
  await trackAffiliateClick({ partner, destination, placement, url });
  await Linking.openURL(url);
}
