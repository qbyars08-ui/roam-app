// =============================================================================
// ROAM — Affiliate Revenue Layer
// Deep link templates + click tracking for booking partners
// =============================================================================
import { Linking, Platform } from 'react-native';
import { supabase } from './supabase';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Partner configurations
// ---------------------------------------------------------------------------
export interface AffiliatePartner {
  id: string;
  name: string;
  category: 'flights' | 'hotels' | 'experiences' | 'car-rental';
  color: string;
  /** Builds the deep link URL from destination + dates */
  buildUrl: (params: AffiliateParams) => string;
  /** Estimated price display text */
  estimateLabel: (params: AffiliateParams) => string;
}

export interface AffiliateParams {
  destination: string;
  /** ISO country code */
  countryCode?: string;
  /** Number of days */
  days?: number;
  /** Daily budget string */
  budget?: string;
  /** Origin city (for flights) */
  origin?: string;
}

// IATA-ish city codes for Skyscanner (best-effort mapping)
const CITY_CODES: Record<string, string> = {
  'Tokyo': 'TYO', 'Paris': 'PAR', 'Bali': 'DPS', 'New York': 'NYC',
  'Barcelona': 'BCN', 'Rome': 'ROM', 'London': 'LON', 'Bangkok': 'BKK',
  'Marrakech': 'RAK', 'Lisbon': 'LIS', 'Cape Town': 'CPT', 'Reykjavik': 'REK',
  'Seoul': 'SEL', 'Buenos Aires': 'BUE', 'Istanbul': 'IST', 'Sydney': 'SYD',
  'Mexico City': 'MEX', 'Dubai': 'DXB', 'Kyoto': 'KIX', 'Amsterdam': 'AMS',
  'Medellín': 'MDE', 'Tbilisi': 'TBS', 'Chiang Mai': 'CNX', 'Porto': 'OPO',
  'Oaxaca': 'OAX', 'Dubrovnik': 'DBV', 'Budapest': 'BUD', 'Hoi An': 'DAD',
  'Cartagena': 'CTG', 'Jaipur': 'JAI', 'Queenstown': 'ZQN',
};

function getCityCode(destination: string): string {
  return CITY_CODES[destination] ?? destination.slice(0, 3).toUpperCase();
}

function encodeCity(destination: string): string {
  return encodeURIComponent(destination.toLowerCase().replace(/\s+/g, '-'));
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    category: 'flights',
    color: '#0770E3',
    buildUrl: (p) => {
      const dest = getCityCode(p.destination);
      return `https://www.skyscanner.net/transport/flights/USAA/${dest}/?associateId=roam&utm_source=roam&utm_medium=app`;
    },
    estimateLabel: () => 'Find cheap flights',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    category: 'hotels',
    color: '#003580',
    buildUrl: (p) => {
      const city = encodeCity(p.destination);
      return `https://www.booking.com/searchresults.html?ss=${city}&aid=roam&utm_source=roam&utm_medium=app`;
    },
    estimateLabel: (p) => p.days ? `${p.days} nights from $${Math.round((p.days || 3) * 45)}` : 'Find hotels',
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    category: 'experiences',
    color: '#FF5533',
    buildUrl: (p) => {
      const city = encodeCity(p.destination);
      return `https://www.getyourguide.com/s/?q=${city}&partner_id=roam&utm_source=roam&utm_medium=app`;
    },
    estimateLabel: () => 'Book tours & activities',
  },
  {
    id: 'rentalcars',
    name: 'Rentalcars.com',
    category: 'car-rental',
    color: '#F7B731',
    buildUrl: (p) => {
      const city = encodeCity(p.destination);
      return `https://www.rentalcars.com/search-results?location=${city}&affiliateCode=roam&utm_source=roam&utm_medium=app`;
    },
    estimateLabel: (p) => p.days ? `${p.days} days from $${Math.round((p.days || 3) * 25)}` : 'Rent a car',
  },
];

// ---------------------------------------------------------------------------
// Click tracking
// ---------------------------------------------------------------------------
export async function trackAffiliateClick(
  partnerId: string,
  destination: string,
  tripId?: string,
): Promise<void> {
  try {
    const userId = useAppStore.getState().session?.user?.id;
    await supabase.from('affiliate_clicks').insert({
      user_id: userId ?? null,
      partner_id: partnerId,
      destination,
      trip_id: tripId ?? null,
      platform: Platform.OS,
      clicked_at: new Date().toISOString(),
    });
  } catch {
    // Non-blocking — don't disrupt user flow
  }
}

/**
 * Open an affiliate link and track the click.
 */
export async function openAffiliateLink(
  partner: AffiliatePartner,
  params: AffiliateParams,
  tripId?: string,
): Promise<void> {
  const url = partner.buildUrl(params);

  // Track click (fire-and-forget)
  trackAffiliateClick(partner.id, params.destination, tripId);

  // Open link
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback: try with https if it was a deep link
      const webUrl = url.startsWith('http') ? url : `https://${url}`;
      await Linking.openURL(webUrl);
    }
  } catch {
    // Silently fail — don't disrupt user flow
  }
}

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------
export const CATEGORY_LABELS: Record<string, string> = {
  flights: 'Flights',
  hotels: 'Hotels',
  experiences: 'Experiences',
  'car-rental': 'Car Rental',
};

export const CATEGORY_ICONS: Record<string, string> = {
  flights: '\u2708\uFE0F',
  hotels: '\uD83C\uDFE8',
  experiences: '\uD83C\uDFAD',
  'car-rental': '\uD83D\uDE97',
};
