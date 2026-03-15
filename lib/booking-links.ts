// =============================================================================
// ROAM — Booking Deep Links
// One-tap connections to every major travel service. ROAM as the middle layer.
// =============================================================================
import { Linking } from 'react-native';
import { trackAffiliateClick, isSafeUrl } from './affiliate-tracking';
import { captureEvent } from './posthog';
import { EVENTS } from './posthog-events';

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
// Hotel Booking — Booking.com affiliate deep link
// Format: https://www.booking.com/search.html?ss=[destination]&aid=[YOUR_AID]
// ---------------------------------------------------------------------------
export function getHotelLink(params: BookingLinkParams): string {
  const url = new URL('https://www.booking.com/search.html');
  url.searchParams.set('ss', params.destination);
  url.searchParams.set('aid', 'roam');
  if (params.checkin) url.searchParams.set('checkin', params.checkin);
  if (params.checkout) url.searchParams.set('checkout', params.checkout);
  url.searchParams.set('group_adults', String(params.adults ?? 2));
  url.searchParams.set('utm_source', 'roam');
  url.searchParams.set('utm_medium', 'app');
  url.searchParams.set('utm_campaign', params.destination.toLowerCase().replace(/\s+/g, '-'));
  return url.toString();
}

// ---------------------------------------------------------------------------
// Flight Search — Skyscanner affiliate deep link
// ---------------------------------------------------------------------------
export function getFlightLink(params: FlightLinkParams): string {
  const dest = encodeURIComponent(params.destination.toLowerCase().replace(/\s+/g, '-'));
  const origin = params.origin ?? 'anywhere';
  const depart = params.departDate ?? 'anytime';
  const ret = params.returnDate ?? 'anytime';
  const url = `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${depart}/${ret}/?associateId=roam&utm_source=roam&utm_medium=app&utm_campaign=${encodeURIComponent(params.destination.toLowerCase())}`;
  return url;
}

// ---------------------------------------------------------------------------
// Experiences — GetYourGuide affiliate deep link
// ---------------------------------------------------------------------------
export function getExperienceLink(destination: string, query?: string): string {
  const q = query ?? destination;
  const url = new URL('https://www.getyourguide.com/s/');
  url.searchParams.set('q', q);
  url.searchParams.set('partner_id', 'roam');
  url.searchParams.set('utm_source', 'roam');
  url.searchParams.set('utm_medium', 'app');
  url.searchParams.set('utm_campaign', destination.toLowerCase().replace(/\s+/g, '-'));
  return url.toString();
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
  if (!isSafeUrl(url)) return;
  await trackAffiliateClick({ partner, destination, placement, url });
  captureEvent(EVENTS.AFFILIATE_CLICK.name, {
    partner,
    destination,
    placement,
    url,
  });
  await Linking.openURL(url).catch(() => {});
}
