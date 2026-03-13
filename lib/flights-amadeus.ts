// =============================================================================
// ROAM — Amadeus Flight Search (Free Tier: 2,000 req/month)
// Real flight prices from user's nearest airport to destination.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface AmadeusToken {
  access_token: string;
  expires_at: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const API_KEY = process.env.EXPO_PUBLIC_AMADEUS_KEY ?? '';
const API_SECRET = process.env.EXPO_PUBLIC_AMADEUS_SECRET ?? '';
const TOKEN_KEY = 'roam_amadeus_token';
// Test environment (free tier)
const BASE = 'https://test.api.amadeus.com';

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
  if (!key) return null;
  // Exact match
  if (DESTINATION_AIRPORTS[key]) return DESTINATION_AIRPORTS[key];
  // Partial match (e.g. "Tokyo, Japan" → "tokyo")
  for (const [name, code] of Object.entries(DESTINATION_AIRPORTS)) {
    if (key.includes(name) || name.includes(key)) return code;
  }
  return null;
}

// ---------------------------------------------------------------------------
// OAuth token management
// ---------------------------------------------------------------------------

async function getToken(): Promise<string> {
  if (!API_KEY || !API_SECRET) {
    throw new Error('Missing Amadeus API credentials');
  }

  // Check cached token
  try {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    if (raw) {
      const cached: AmadeusToken = JSON.parse(raw);
      if (cached.expires_at > Date.now() + 60_000) {
        return cached.access_token;
      }
    }
  } catch {
    // Ignore
  }

  // Fetch new token
  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`,
  });

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`);
  }

  const data = await res.json();
  const token: AmadeusToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(token)).catch(() => {});
  return token.access_token;
}

// ---------------------------------------------------------------------------
// Airline name lookup (top carriers)
// ---------------------------------------------------------------------------
const AIRLINE_NAMES: Record<string, string> = {
  AA: 'American Airlines', UA: 'United', DL: 'Delta', WN: 'Southwest',
  B6: 'JetBlue', NK: 'Spirit', F9: 'Frontier', AS: 'Alaska',
  HA: 'Hawaiian', BA: 'British Airways', LH: 'Lufthansa',
  AF: 'Air France', KL: 'KLM', IB: 'Iberia', AY: 'Finnair',
  SK: 'SAS', LX: 'Swiss', OS: 'Austrian', TP: 'TAP Portugal',
  TK: 'Turkish Airlines', EK: 'Emirates', QR: 'Qatar Airways',
  EY: 'Etihad', SQ: 'Singapore Airlines', CX: 'Cathay Pacific',
  NH: 'ANA', JL: 'JAL', OZ: 'Asiana', KE: 'Korean Air',
  QF: 'Qantas', NZ: 'Air New Zealand', AC: 'Air Canada',
  AM: 'Aeromexico', AV: 'Avianca', LA: 'LATAM', G3: 'Gol',
  FR: 'Ryanair', U2: 'easyJet', W6: 'Wizz Air', VY: 'Vueling',
  TG: 'Thai Airways', GA: 'Garuda', MH: 'Malaysia Airlines',
  BR: 'EVA Air', CI: 'China Airlines', CA: 'Air China',
  MU: 'China Eastern', CZ: 'China Southern', AI: 'Air India',
  ET: 'Ethiopian', SA: 'South African', MS: 'EgyptAir',
  RJ: 'Royal Jordanian', SV: 'Saudi Arabian',
};

export function formatDuration(iso: string): string {
  // PT2H30M → "2h 30m"
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : '';
  const m = match[2] ? `${match[2]}m` : '';
  return `${h} ${m}`.trim();
}

// ---------------------------------------------------------------------------
// Search Flights
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
  const token = await getToken();
  const { origin, destination, departureDate, returnDate } = params;
  const adults = params.adults ?? 1;
  const max = params.maxOffers ?? 5;

  const url = new URL(`${BASE}/v2/shopping/flight-offers`);
  url.searchParams.set('originLocationCode', origin);
  url.searchParams.set('destinationLocationCode', destination);
  url.searchParams.set('departureDate', departureDate);
  url.searchParams.set('returnDate', returnDate);
  url.searchParams.set('adults', String(adults));
  url.searchParams.set('max', String(max));
  url.searchParams.set('currencyCode', 'USD');
  url.searchParams.set('nonStop', 'false');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Amadeus flight search failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const rawOffers = data.data ?? [];

  const offers: FlightOffer[] = rawOffers.map((offer: Record<string, unknown>) => {
    const price = parseFloat((offer.price as Record<string, string>).total);
    const currency = (offer.price as Record<string, string>).currency;
    const itineraries = offer.itineraries as Array<Record<string, unknown>>;
    const outbound = itineraries[0];
    const returnFlight = itineraries[1];

    const segments = outbound.segments as Array<Record<string, unknown>>;
    const mainCarrier = (segments[0]?.carrierCode as string) ?? 'XX';
    const stops = segments.length - 1;

    return {
      airline: mainCarrier,
      airlineName: AIRLINE_NAMES[mainCarrier] ?? mainCarrier,
      price,
      currency,
      departureDate,
      returnDate,
      outboundDuration: formatDuration(outbound.duration as string),
      returnDuration: returnFlight
        ? formatDuration(returnFlight.duration as string)
        : '',
      stops,
      origin,
      destination,
      bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${departureDate}`,
    };
  });

  // Sort by price
  offers.sort((a: FlightOffer, b: FlightOffer) => a.price - b.price);

  return {
    offers,
    cheapest: offers[0] ?? null,
    origin,
    destination,
    searchedAt: new Date().toISOString(),
  };
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
