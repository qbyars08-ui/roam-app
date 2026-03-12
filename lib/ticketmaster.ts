// =============================================================================
// ROAM — Ticketmaster Discovery API: events during trip dates
// Free tier: 5,000 req/day (~150K/month). No cost.
// Docs: developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_KEY ?? '';
const BASE = 'https://app.ticketmaster.com/discovery/v2';
const CACHE_PREFIX = 'roam_events_';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TripEvent {
  id: string;
  name: string;
  type: 'concert' | 'festival' | 'sports' | 'arts' | 'family' | 'other';
  venue: string;
  date: string;          // YYYY-MM-DD
  time: string | null;   // HH:MM local
  url: string;
  imageUrl: string | null;
  priceRange: string | null; // "$45 - $120"
}

// ---------------------------------------------------------------------------
// Ticketmaster classification → our event type
// ---------------------------------------------------------------------------
function mapType(segment?: string, genre?: string): TripEvent['type'] {
  const s = (segment ?? '').toLowerCase();
  const g = (genre ?? '').toLowerCase();
  if (g.includes('festival')) return 'festival';
  if (s.includes('music') || g.includes('rock') || g.includes('pop') || g.includes('hip-hop'))
    return 'concert';
  if (s.includes('sport')) return 'sports';
  if (s.includes('arts') || g.includes('theatre') || g.includes('comedy') || g.includes('opera'))
    return 'arts';
  if (s.includes('family')) return 'family';
  return 'other';
}

// ---------------------------------------------------------------------------
// Country code mapping for Ticketmaster countryCode param
// Ticketmaster only covers: US, CA, MX, AU, NZ, GB, IE, plus several EU countries
// ---------------------------------------------------------------------------
const DESTINATION_COUNTRY: Record<string, string> = {
  'New York': 'US', 'Los Angeles': 'US', 'Miami': 'US', 'Nashville': 'US',
  'Austin': 'US', 'Chicago': 'US', 'San Francisco': 'US',
  London: 'GB', Edinburgh: 'GB', Manchester: 'GB',
  Dublin: 'IE',
  Sydney: 'AU', Melbourne: 'AU', Brisbane: 'AU', Queenstown: 'NZ',
  Toronto: 'CA', Vancouver: 'CA', Montreal: 'CA',
  'Mexico City': 'MX', Cancun: 'MX', Oaxaca: 'MX',
  Paris: 'FR', Barcelona: 'ES', Amsterdam: 'NL', Berlin: 'DE',
  Rome: 'IT', Lisbon: 'PT', Porto: 'PT', Budapest: 'HU',
  Vienna: 'AT', Prague: 'CZ', Warsaw: 'PL', Copenhagen: 'DK',
  Stockholm: 'SE', Helsinki: 'FI', Oslo: 'NO',
  Brussels: 'BE', Zurich: 'CH', Ljubljana: 'SI',
};

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------
function cacheKey(destination: string, start: string, end: string): string {
  return `${CACHE_PREFIX}${destination.toLowerCase()}_${start}_${end}`;
}

async function getCached(key: string): Promise<TripEvent[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
    return data as TripEvent[];
  } catch {
    return null;
  }
}

async function setCache(key: string, data: TripEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if Ticketmaster is configured (API key present).
 */
export function isTicketmasterConfigured(): boolean {
  return API_KEY.length > 0;
}

/**
 * Fetch events happening at a destination during specific dates.
 * Returns up to 10 events, sorted by date. Results are cached for 6 hours.
 */
export async function fetchTripEvents(
  destination: string,
  startDate: Date,
  endDate: Date,
): Promise<TripEvent[]> {
  if (!API_KEY) return [];

  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);
  const key = cacheKey(destination, startStr, endStr);

  // Check cache first
  const cached = await getCached(key);
  if (cached) return cached;

  try {
    const countryCode = DESTINATION_COUNTRY[destination];

    const params = new URLSearchParams({
      apikey: API_KEY,
      keyword: destination,
      startDateTime: `${startStr}T00:00:00Z`,
      endDateTime: `${endStr}T23:59:59Z`,
      size: '20',
      sort: 'date,asc',
    });

    // If we know the country code, use it for better results
    if (countryCode) {
      params.set('countryCode', countryCode);
    }

    const res = await fetch(`${BASE}/events.json?${params}`);
    if (!res.ok) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const rawEvents: any[] = data?._embedded?.events ?? [];
    if (!Array.isArray(rawEvents) || rawEvents.length === 0) return [];

    const events: TripEvent[] = rawEvents.slice(0, 10).map((e) => {
      const classification = e.classifications?.[0];
      const segmentName = classification?.segment?.name as string | undefined;
      const genreName = classification?.genre?.name as string | undefined;
      const venueName = e._embedded?.venues?.[0]?.name as string | undefined;

      // Pick best image (medium size preferred)
      const images: Array<{ url: string; width: number }> = e.images ?? [];
      const bestImage = images
        .filter((i) => i.width >= 200 && i.width <= 800)
        .sort((a, b) => b.width - a.width)[0] ?? images[0];

      // Price range
      let priceRange: string | null = null;
      if (e.priceRanges?.[0]) {
        const pr = e.priceRanges[0];
        const currency = pr.currency ?? 'USD';
        if (pr.min && pr.max) {
          priceRange = `${currency === 'USD' ? '$' : ''}${Math.round(pr.min)} – ${currency === 'USD' ? '$' : ''}${Math.round(pr.max)}`;
        } else if (pr.min) {
          priceRange = `From ${currency === 'USD' ? '$' : ''}${Math.round(pr.min)}`;
        }
      }

      return {
        id: String(e.id ?? ''),
        name: String(e.name ?? 'Event'),
        type: mapType(segmentName, genreName),
        venue: String(venueName ?? ''),
        date: String(e.dates?.start?.localDate ?? startStr),
        time: e.dates?.start?.localTime
          ? String(e.dates.start.localTime).slice(0, 5)
          : null,
        url: String(e.url ?? ''),
        imageUrl: bestImage?.url ?? null,
        priceRange,
      };
    });

    await setCache(key, events);
    return events;
  } catch {
    return [];
  }
}
