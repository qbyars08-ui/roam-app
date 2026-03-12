// =============================================================================
// ROAM — Local events (concerts, experiences) during trip dates
// Uses Ticketmaster Discovery API — free key at developer.ticketmaster.com
// =============================================================================

const API_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_KEY ?? '';
const BASE = 'https://app.ticketmaster.com/discovery/v2';

export interface TripEvent {
  id: string;
  name: string;
  type: 'concert' | 'festival' | 'sports' | 'arts' | 'family' | 'other';
  venue: string;
  date: string; // ISO
  url: string;
  imageUrl?: string;
}

// City name → Ticketmaster geo/place lookup
const CITY_KEYWORDS: Record<string, string> = {
  Tokyo: 'Tokyo',
  Paris: 'Paris',
  Bali: 'Denpasar',
  'New York': 'New York',
  Barcelona: 'Barcelona',
  Rome: 'Rome',
  London: 'London',
  Bangkok: 'Bangkok',
  Marrakech: 'Marrakesh',
  Lisbon: 'Lisbon',
  'Cape Town': 'Cape Town',
  Reykjavik: 'Reykjavik',
  Seoul: 'Seoul',
  'Buenos Aires': 'Buenos Aires',
  Istanbul: 'Istanbul',
  Sydney: 'Sydney',
  'Mexico City': 'Mexico City',
  Dubai: 'Dubai',
  Kyoto: 'Kyoto',
  Amsterdam: 'Amsterdam',
  Medellín: 'Medellin',
  Tbilisi: 'Tbilisi',
  'Chiang Mai': 'Chiang Mai',
  Porto: 'Porto',
  Oaxaca: 'Oaxaca',
  Dubrovnik: 'Dubrovnik',
  Budapest: 'Budapest',
  'Hoi An': 'Ho Chi Minh',
  Cartagena: 'Cartagena',
  Jaipur: 'Jaipur',
  Queenstown: 'Queenstown',
  Ljubljana: 'Ljubljana',
};

function getCityKeyword(destination: string): string {
  return CITY_KEYWORDS[destination] ?? destination;
}

function mapClassification(segment?: string, genre?: string): TripEvent['type'] {
  const s = (segment ?? '').toLowerCase();
  const g = (genre ?? '').toLowerCase();
  if (s.includes('music') || g.includes('concert') || g.includes('festival'))
    return 'concert';
  if (s.includes('sport')) return 'sports';
  if (s.includes('arts') || g.includes('theatre') || g.includes('opera'))
    return 'arts';
  if (s.includes('family')) return 'family';
  return 'other';
}

/**
 * Fetch events (concerts, experiences) for a destination during trip dates.
 */
export async function fetchTripEvents(
  destination: string,
  startDate: Date,
  endDate: Date
): Promise<TripEvent[]> {
  if (!API_KEY) return [];

  const city = getCityKeyword(destination);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  try {
    const params = new URLSearchParams({
      apikey: API_KEY,
      city,
      startDateTime: `${startStr}T00:00:00Z`,
      endDateTime: `${endStr}T23:59:59Z`,
      size: '20',
      sort: 'date,asc',
    });

    const res = await fetch(`${BASE}/events.json?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    const rawEvents = data._embedded?.events ?? [];
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents.slice(0, 10).map((e: Record<string, unknown>) => {
      const classifications = (e.classifications as Array<Record<string, unknown>>)?.[0];
      const segment = classifications?.segment as Record<string, string> | undefined;
      const genre = classifications?.genre as Record<string, string> | undefined;
      const embedded = e._embedded as { venues?: Array<Record<string, string>> } | undefined;
      const venue = embedded?.venues?.[0];
      const images = e.images as Array<{ url: string; width: number }> | undefined;
      const img = images?.sort((a, b) => a.width - b.width).find((i) => i.width >= 200);
      const dates = e.dates as { start?: { localDate?: string } } | undefined;

      return {
        id: (e.id as string) ?? '',
        name: (e.name as string) ?? 'Event',
        type: mapClassification(segment?.name, genre?.name),
        venue: (venue?.name as string) ?? '',
        date: (dates?.start?.localDate as string) ?? startStr,
        url: (e.url as string) ?? '',
        imageUrl: img?.url,
      } as TripEvent;
    });
  } catch {
    return [];
  }
}
