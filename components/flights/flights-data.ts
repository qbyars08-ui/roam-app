// =============================================================================
// ROAM — Flights Tab Static Data
// Extracted from app/(tabs)/flights.tsx for file size management.
// =============================================================================


// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
export interface PopularRoute {
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  price: string;
  image: string;
}

export const POPULAR_ROUTES: PopularRoute[] = [
  {
    from: 'New York',
    fromCode: 'JFK',
    to: 'London',
    toCode: 'LHR',
    price: 'from ~$420',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
  },
  {
    from: 'Los Angeles',
    fromCode: 'LAX',
    to: 'Tokyo',
    toCode: 'NRT',
    price: 'from ~$580',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  },
  {
    from: 'Chicago',
    fromCode: 'ORD',
    to: 'Paris',
    toCode: 'CDG',
    price: 'from ~$445',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  },
  {
    from: 'Miami',
    fromCode: 'MIA',
    to: 'Cancun',
    toCode: 'CUN',
    price: 'from ~$190',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=400&q=80',
  },
  {
    from: 'San Francisco',
    fromCode: 'SFO',
    to: 'Bali',
    toCode: 'DPS',
    price: 'from ~$650',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  },
  {
    from: 'New York',
    fromCode: 'JFK',
    to: 'Barcelona',
    toCode: 'BCN',
    price: 'from ~$380',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
  },
];

export interface InspirationCard {
  destination: string;
  month: string;
  reason: string;
  image: string;
  code: string;
}

export const INSPIRATION: InspirationCard[] = [
  {
    destination: 'Tokyo',
    month: 'March',
    reason: 'Cherry blossom season at its peak',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
    code: 'NRT',
  },
  {
    destination: 'Bali',
    month: 'July',
    reason: 'Dry season, perfect surf and sunsets',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
    code: 'DPS',
  },
  {
    destination: 'Paris',
    month: 'May',
    reason: 'Warm but not crowded, long golden evenings',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
    code: 'CDG',
  },
  {
    destination: 'Barcelona',
    month: 'September',
    reason: 'Beach weather, locals are back, La Merce festival',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
    code: 'BCN',
  },
];

