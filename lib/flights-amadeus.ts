// =============================================================================
// ROAM — Amadeus Flight Search (Free Tier: 2,000 req/month)
// Real flight prices from user's nearest airport to destination.
// SECURITY: API keys kept server-side. All searches go through amadeus-proxy.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FlightOffer {
  airline: string;
  airlineName: string;
  price: number;
  currency: string;
  departureDate: string;
  returnDate: string;
  outboundDuration: string;
  returnDuration: string;
  stops: number;
  origin: string;
  destination: string;
  bookingUrl: string;
}

export interface FlightSearchResult {
  offers: FlightOffer[];
  cheapest: FlightOffer | null;
  origin: string;
  destination: string;
  searchedAt: string;
}

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
export async function getHomeAirport(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(HOME_AIRPORT_KEY);
    return val ?? 'JFK';
  } catch {
    return 'JFK';
  }
}

export async function setHomeAirport(code: string): Promise<void> {
  await AsyncStorage.setItem(HOME_AIRPORT_KEY, code.toUpperCase());
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
// Search Flights (via amadeus-proxy edge function — keys stay server-side)
// ---------------------------------------------------------------------------

/**
 * Search for round-trip flights from origin to destination.
 * Returns up to 5 cheapest offers.
 */
export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string;    // YYYY-MM-DD
  adults?: number;
  maxOffers?: number;
}): Promise<FlightSearchResult> {
  const { data, error } = await supabase.functions.invoke('amadeus-proxy', {
    body: {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults ?? 1,
      maxOffers: params.maxOffers ?? 5,
    },
  });

  if (error) {
    throw new Error(error.message ?? 'Flight search failed');
  }

  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Flight search failed');
  }

  return data as FlightSearchResult;
}

/**
 * Quick search for flights to a destination.
 * Auto-resolves destination airport code and user's home airport.
 * Departure = 2 weeks from now, return = departure + tripDays.
 */
export async function quickFlightSearch(
  destination: string,
  tripDays: number
): Promise<FlightSearchResult | null> {
  const destCode = getDestinationAirport(destination);
  if (!destCode) return null;

  const origin = await getHomeAirport();

  // Default to 2 weeks from now
  const departure = new Date();
  departure.setDate(departure.getDate() + 14);
  const returnDate = new Date(departure);
  returnDate.setDate(returnDate.getDate() + tripDays);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  try {
    return await searchFlights({
      origin,
      destination: destCode,
      departureDate: fmt(departure),
      returnDate: fmt(returnDate),
      maxOffers: 3,
    });
  } catch {
    return null;
  }
}
