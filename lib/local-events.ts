// =============================================================================
// ROAM — Local Events (Ticketmaster + Eventbrite APIs)
// "What's happening while you're there"
// =============================================================================

export type EventCategory = 'music' | 'food' | 'culture' | 'sports' | 'nightlife';

export interface LocalEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  category: EventCategory;
  url: string;
  imageUrl?: string;
}

const TM_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_KEY ?? '';
const CITY_TO_COORDS: Record<string, { lat: string; lon: string }> = {
  tokyo: { lat: '35.6762', lon: '139.6503' },
  paris: { lat: '48.8566', lon: '2.3522' },
  london: { lat: '51.5074', lon: '-0.1278' },
  'new york': { lat: '40.7128', lon: '-74.006' },
  barcelona: { lat: '41.3874', lon: '2.1686' },
  rome: { lat: '41.9028', lon: '12.4964' },
  lisbon: { lat: '38.7223', lon: '-9.1393' },
  amsterdam: { lat: '52.3676', lon: '4.9041' },
  bangkok: { lat: '13.7563', lon: '100.5018' },
  bali: { lat: '-8.3405', lon: '115.092' },
  seoul: { lat: '37.5665', lon: '126.978' },
  sydney: { lat: '-33.8688', lon: '151.2093' },
  dubai: { lat: '25.2048', lon: '55.2708' },
};

function getCoords(city: string): { lat: string; lon: string } | null {
  const key = city.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const [k, v] of Object.entries(CITY_TO_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

export async function getLocalEvents(
  city: string,
  startDate: string,
  endDate: string
): Promise<LocalEvent[]> {
  const coords = getCoords(city);
  const events: LocalEvent[] = [];

  if (TM_KEY && coords) {
    try {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TM_KEY}&latlong=${coords.lat},${coords.lon}&startDateTime=${startDate}T00:00:00Z&endDateTime=${endDate}T23:59:59Z&size=10`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data._embedded?.events ?? [];
        for (const e of items) {
          const cat = (e.classifications?.[0]?.segment?.name ?? '').toLowerCase();
          let category: EventCategory = 'culture';
          if (cat.includes('music')) category = 'music';
          else if (cat.includes('sport')) category = 'sports';
          else if (cat.includes('food')) category = 'food';
          events.push({
            id: e.id,
            name: e.name,
            date: e.dates?.start?.localDate ?? startDate,
            venue: e._embedded?.venues?.[0]?.name ?? '',
            category,
            url: e.url ?? '',
            imageUrl: e.images?.[0]?.url,
          });
        }
      }
    } catch {
      // fallback
    }
  }

  return events.slice(0, 8);
}
