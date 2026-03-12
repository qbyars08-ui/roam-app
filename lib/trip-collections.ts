// =============================================================================
// ROAM — Trip Collections
// Curated lists: Best $50/day, underrated cities, solo-friendly, etc.
// =============================================================================

export interface TripCollection {
  id: string;
  title: string;
  subtitle: string;
  destinations: string[];
}

export const TRIP_COLLECTIONS: TripCollection[] = [
  {
    id: 'sea-50',
    title: 'Best $50/day trips in Southeast Asia',
    subtitle: 'Full days on a backpacker budget',
    destinations: ['Bali', 'Bangkok', 'Chiang Mai', 'Hoi An', 'Siem Reap', 'Porto', 'Medellín'],
  },
  {
    id: 'underrated-europe',
    title: 'Most underrated European cities',
    subtitle: 'Skip the crowds, keep the charm',
    destinations: ['Ljubljana', 'Porto', 'Budapest', 'Tbilisi', 'Oaxaca', 'Medellín', 'Lisbon', 'Valencia'],
  },
  {
    id: 'solo-first-timers',
    title: 'Solo-friendly for first timers',
    subtitle: 'Safe, welcoming, easy to navigate',
    destinations: ['Lisbon', 'Tokyo', 'Reykjavik', 'Singapore', 'Amsterdam', 'Porto', 'Seoul', 'Copenhagen'],
  },
  {
    id: 'food-pilgrimage',
    title: 'Food pilgrimage',
    subtitle: 'Where to eat too much',
    destinations: ['Tokyo', 'Mexico City', 'Bangkok', 'Oaxaca', 'Seoul', 'Istanbul', 'Lisbon', 'Paris'],
  },
  {
    id: 'beach-without-resorts',
    title: 'Beaches without the resorts',
    subtitle: 'Real coast, real vibe',
    destinations: ['Bali', 'Hoi An', 'Cartagena', 'Lisbon', 'Split', 'Porto', 'Medellín'],
  },
  {
    id: 'digital-nomad-hubs',
    title: 'Digital nomad hubs',
    subtitle: 'WiFi, cafes, community',
    destinations: ['Bali', 'Lisbon', 'Chiang Mai', 'Medellín', 'Mexico City', 'Barcelona', 'Bangkok', 'Tbilisi'],
  },
];
