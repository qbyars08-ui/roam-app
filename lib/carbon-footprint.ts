// =============================================================================
// ROAM — Carbon Footprint (Climatiq API)
// Flight emissions + offset option (IATA codes)
// =============================================================================

const CLIMATIQ_KEY = process.env.EXPO_PUBLIC_CLIMATIQ_KEY ?? '';

// City name → IATA airport code for Climatiq
const CITY_TO_IATA: Record<string, string> = {
  tokyo: 'NRT', 'new york': 'JFK', paris: 'CDG', london: 'LHR',
  bangkok: 'BKK', 'los angeles': 'LAX', 'mexico city': 'MEX',
  barcelona: 'BCN', rome: 'FCO', lisbon: 'LIS', seoul: 'ICN',
  istanbul: 'IST', bali: 'DPS', singapore: 'SIN', berlin: 'TXL',
  amsterdam: 'AMS', dubai: 'DXB', sydney: 'SYD', 'hong kong': 'HKG',
};

function cityToIata(city: string): string {
  const k = city.toLowerCase().trim();
  for (const [key, code] of Object.entries(CITY_TO_IATA)) {
    if (k.includes(key) || key.includes(k)) return code;
  }
  return k.slice(0, 3).toUpperCase() || 'XXX'; // fallback
}

export interface CarbonEstimate {
  tonnesCO2: number;
  breakdown: string;
  offsetCost?: number;
}

export async function estimateFlightEmissions(
  origin: string,
  destination: string,
  roundTrip: boolean
): Promise<CarbonEstimate | null> {
  if (!CLIMATIQ_KEY) return null;
  try {
    const from = cityToIata(origin);
    const to = cityToIata(destination);
    const res = await fetch('https://beta3.api.climatiq.io/travel/flights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLIMATIQ_KEY}`,
      },
      body: JSON.stringify({
        legs: [
          {
            from,
            to,
          },
        ],
        trip_type: roundTrip ? 'round_trip' : 'one_way',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const co2 = data.co2e ?? 0;
    const tonnes = co2 / 1000;
    const offsetCost = Math.round(tonnes * 10);
    return {
      tonnesCO2: Math.round(tonnes * 10) / 10,
      breakdown: `Round-trip flight ${from} ↔ ${to}`,
      offsetCost,
    };
  } catch {
    return null;
  }
}
