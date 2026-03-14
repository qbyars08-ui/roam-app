// =============================================================================
// ROAM — Flight Utilities
// Airport codes, home airport preference, and Skyscanner affiliate deep links.
// No server-side proxy needed — we link directly to Skyscanner for booking.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Major airport codes for popular destinations
const DESTINATION_AIRPORTS: Record<string, string> = {
  tokyo: 'NRT', paris: 'CDG', bali: 'DPS', 'new york': 'JFK',
  barcelona: 'BCN', rome: 'FCO', london: 'LHR', bangkok: 'BKK',
  marrakech: 'RAK', lisbon: 'LIS', 'cape town': 'CPT',
  reykjavik: 'KEF', seoul: 'ICN', 'buenos aires': 'EZE',
  istanbul: 'IST', sydney: 'SYD', 'mexico city': 'MEX',
  dubai: 'DXB', kyoto: 'KIX', amsterdam: 'AMS',
  'medellín': 'MDE', medellin: 'MDE', tbilisi: 'TBS',
  'chiang mai': 'CNX', porto: 'OPO', oaxaca: 'OAX',
  dubrovnik: 'DBV', budapest: 'BUD', 'hoi an': 'DAD',
  cartagena: 'CTG', jaipur: 'JAI', queenstown: 'ZQN',
  santorini: 'JTR', 'siem reap': 'REP', ljubljana: 'LJU',
  singapore: 'SIN', 'ho chi minh': 'SGN', hanoi: 'HAN',
  prague: 'PRG', vienna: 'VIE', berlin: 'BER', munich: 'MUC',
  milan: 'MXP', athens: 'ATH', cairo: 'CAI', nairobi: 'NBO',
  'kuala lumpur': 'KUL', taipei: 'TPE', osaka: 'KIX',
  'hong kong': 'HKG', denver: 'DEN', miami: 'MIA',
  'los angeles': 'LAX', 'san francisco': 'SFO', chicago: 'ORD',
  seattle: 'SEA', boston: 'BOS', atlanta: 'ATL', dallas: 'DFW',
  honolulu: 'HNL', 'las vegas': 'LAS', portland: 'PDX',
};

// User's home airport preference
const HOME_AIRPORT_KEY = 'roam_home_airport';

// Common US airports for picker
export const US_AIRPORTS = [
  { code: 'JFK', city: 'New York (JFK)' },
  { code: 'LAX', city: 'Los Angeles' },
  { code: 'ORD', city: 'Chicago' },
  { code: 'SFO', city: 'San Francisco' },
  { code: 'MIA', city: 'Miami' },
  { code: 'ATL', city: 'Atlanta' },
  { code: 'DFW', city: 'Dallas' },
  { code: 'SEA', city: 'Seattle' },
  { code: 'BOS', city: 'Boston' },
  { code: 'DEN', city: 'Denver' },
  { code: 'IAD', city: 'Washington D.C.' },
  { code: 'EWR', city: 'Newark' },
  { code: 'PHL', city: 'Philadelphia' },
  { code: 'DTW', city: 'Detroit' },
  { code: 'MSP', city: 'Minneapolis' },
  { code: 'HNL', city: 'Honolulu' },
  { code: 'LAS', city: 'Las Vegas' },
  { code: 'PDX', city: 'Portland' },
  { code: 'AUS', city: 'Austin' },
  { code: 'SAN', city: 'San Diego' },
  { code: 'TPA', city: 'Tampa' },
  { code: 'CLT', city: 'Charlotte' },
  { code: 'MCO', city: 'Orlando' },
  { code: 'MSY', city: 'New Orleans' },
  { code: 'SLC', city: 'Salt Lake City' },
  { code: 'RDU', city: 'Raleigh-Durham' },
  { code: 'BNA', city: 'Nashville' },
];

// ---------------------------------------------------------------------------
// User preference
// ---------------------------------------------------------------------------
const IATA_RE = /^[A-Z]{3}$/;

export async function getHomeAirport(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(HOME_AIRPORT_KEY);
    return val ?? 'JFK';
  } catch {
    return 'JFK';
  }
}

export async function setHomeAirport(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  if (!IATA_RE.test(normalized)) {
    throw new Error(`Invalid IATA code: ${normalized}`);
  }
  await AsyncStorage.setItem(HOME_AIRPORT_KEY, normalized);
}

// ---------------------------------------------------------------------------
// Destination to IATA code
// ---------------------------------------------------------------------------
export function getDestinationAirport(destination: string): string | null {
  const key = destination.toLowerCase().trim();
  // Exact match
  if (DESTINATION_AIRPORTS[key]) return DESTINATION_AIRPORTS[key];
  // Partial match (e.g. "Tokyo, Japan" → "tokyo")
  for (const [name, code] of Object.entries(DESTINATION_AIRPORTS)) {
    if (key.includes(name) || name.includes(key)) return code;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Skyscanner affiliate deep links
// ---------------------------------------------------------------------------

/**
 * Build a Skyscanner search URL for flights to a destination.
 * Opens in browser — user books on Skyscanner, we earn affiliate commission.
 */
export function getSkyscannerFlightUrl(params: {
  origin?: string;
  destination: string;
  departureDate?: string;
  returnDate?: string;
}): string {
  const dest = getDestinationAirport(params.destination) ?? encodeURIComponent(params.destination.toLowerCase().replace(/\s+/g, '-'));
  const origin = params.origin ?? 'anywhere';
  const depart = params.departureDate ?? 'anytime';
  const ret = params.returnDate ?? 'anytime';
  return `https://www.skyscanner.com/transport/flights/${origin}/${dest}/${depart}/${ret}/?associateId=roam&utm_source=roam&utm_medium=app&utm_campaign=${encodeURIComponent(params.destination.toLowerCase())}`;
}

/**
 * Build a Google Flights URL (fallback, no affiliate — but best UX).
 */
export function getGoogleFlightsUrl(params: {
  origin?: string;
  destination: string;
  departureDate?: string;
}): string {
  const dest = encodeURIComponent(params.destination);
  const origin = params.origin ?? '';
  const date = params.departureDate ?? '';
  return `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${dest}${date ? `+on+${date}` : ''}`;
}
