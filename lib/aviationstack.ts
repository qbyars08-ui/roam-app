// =============================================================================
// ROAM — AviationStack API for real-time flight lookup
// Free tier: 100 requests/month, requires EXPO_PUBLIC_AVIATIONSTACK_KEY
// =============================================================================

export interface AviationStackFlight {
  flight_date: string;
  flight_status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted';
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    delay: number | null;
    scheduled: string;
    estimated: string;
    actual: string | null;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal: string | null;
    gate: string | null;
    baggage: string | null;
    delay: number | null;
    scheduled: string;
    estimated: string;
    actual: string | null;
  };
  airline: { name: string; iata: string; icao: string };
  flight: { number: string; iata: string; icao: string; codeshared: string | null };
}

export interface AviationStackResponse {
  pagination?: { limit: number; offset: number; count: number; total: number };
  data?: AviationStackFlight[];
  error?: { code: string; message: string };
}

const BASE_URL = 'https://api.aviationstack.com/v1/flights';

/** Normalize user input (e.g. "AA 1004", "aa1004") to flight IATA (AA1004) */
export function normalizeFlightNumber(input: string): string {
  const cleaned = input.replace(/[\s-]/g, '').toUpperCase();
  return cleaned;
}

/** Fetch flight(s) by IATA flight code (e.g. AA1004) */
export async function lookupFlight(flightIata: string): Promise<AviationStackFlight[]> {
  const key = process.env.EXPO_PUBLIC_AVIATIONSTACK_KEY;
  if (!key) {
    throw new Error('Flight tracking needs an API key. Add EXPO_PUBLIC_AVIATIONSTACK_KEY to .env (free at aviationstack.com)');
  }

  const params = new URLSearchParams({
    access_key: key,
    flight_iata: flightIata,
    limit: '10',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let json: AviationStackResponse;
  try {
    const res = await fetch(`${BASE_URL}?${params}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`AviationStack API failed: ${res.status}`);
    json = await res.json();
  } finally {
    clearTimeout(timer);
  }

  if (json.error) {
    throw new Error(json.error.message || 'Flight lookup failed');
  }

  if (!json.data || json.data.length === 0) {
    throw new Error('No flights found for this flight number');
  }

  return json.data;
}
