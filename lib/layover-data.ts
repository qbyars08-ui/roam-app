// =============================================================================
// ROAM — Layover Intelligence Data
// What to do with X hours in a layover city.
// =============================================================================

export interface LayoverActivity {
  title: string;
  duration: string; // e.g. "45 min", "2 hr"
  durationMinutes: number;
  category: 'food' | 'explore' | 'relax' | 'culture' | 'shop';
  description: string;
  tip: string;
}

export interface LayoverGuide {
  airport: string;
  airportCode: string;
  city: string;
  transitTime: string; // e.g. "25 min to city center"
  transitMethod: string; // e.g. "Express train"
  activities: LayoverActivity[];
  airportPerks: string[]; // in-airport options
  canLeaveAirport: boolean;
  minHoursToLeave: number; // minimum layover to leave airport
}

const LAYOVER_GUIDES: Record<string, LayoverGuide> = {
  JFK: {
    airport: 'John F. Kennedy International',
    airportCode: 'JFK',
    city: 'New York',
    transitTime: '60 min to Manhattan',
    transitMethod: 'AirTrain + subway',
    canLeaveAirport: true,
    minHoursToLeave: 5,
    airportPerks: [
      'TWA Hotel rooftop pool (open to all)',
      'Shake Shack in Terminal 4',
      'Priority Pass lounges in T1, T4, T7',
      'Free Wi-Fi throughout',
    ],
    activities: [
      { title: 'Pizza in Jamaica, Queens', duration: '1.5 hr', durationMinutes: 90, category: 'food', description: 'AirTrain to Jamaica station. World-class pizza 5 min walk.', tip: 'Try the Sicilian slice at any corner spot' },
      { title: 'TWA Hotel cocktail', duration: '45 min', durationMinutes: 45, category: 'relax', description: 'Retro-futuristic hotel bar inside the old TWA terminal.', tip: 'No reservation needed for the bar. The pool deck has great views.' },
      { title: 'Rockaway Beach', duration: '2 hr', durationMinutes: 120, category: 'explore', description: 'Take the shuttle bus to the beach boardwalk.', tip: 'Summer only. Tacos at Tacoway Beach.' },
      { title: 'Flushing food tour', duration: '3 hr', durationMinutes: 180, category: 'food', description: 'AirTrain to Jamaica, then 7 train to Flushing. Best Chinese food outside Asia.', tip: 'Joe\'s Shanghai for soup dumplings' },
    ],
  },
  LAX: {
    airport: 'Los Angeles International',
    airportCode: 'LAX',
    city: 'Los Angeles',
    transitTime: '30 min to Santa Monica',
    transitMethod: 'FlyAway bus or Uber',
    canLeaveAirport: true,
    minHoursToLeave: 5,
    airportPerks: [
      'In-N-Out Burger visible from runway (short drive)',
      'Star Alliance Lounge in TBIT',
      'Free Wi-Fi throughout',
      'Headspace meditation rooms',
    ],
    activities: [
      { title: 'In-N-Out Burger pilgrimage', duration: '1 hr', durationMinutes: 60, category: 'food', description: 'The iconic spot on Sepulveda Blvd with plane views.', tip: 'Order animal style. Watch planes land while you eat.' },
      { title: 'Venice Beach boardwalk', duration: '3 hr', durationMinutes: 180, category: 'explore', description: 'Uber to Venice. Walk the boardwalk, see Muscle Beach.', tip: 'Abbot Kinney Blvd for boutique shopping' },
      { title: 'Santa Monica Pier sunset', duration: '2.5 hr', durationMinutes: 150, category: 'explore', description: 'FlyAway bus to Santa Monica. Walk the pier at golden hour.', tip: 'Best light 30 min before sunset' },
    ],
  },
  LHR: {
    airport: 'London Heathrow',
    airportCode: 'LHR',
    city: 'London',
    transitTime: '15 min to Paddington',
    transitMethod: 'Heathrow Express',
    canLeaveAirport: true,
    minHoursToLeave: 4,
    airportPerks: [
      'Gordon Ramsay Plane Food (T5)',
      'Harrods shop (T5)',
      'Cathay Pacific lounge (T3)',
      'Free Wi-Fi',
    ],
    activities: [
      { title: 'Paddington quick bite', duration: '1.5 hr', durationMinutes: 90, category: 'food', description: 'Heathrow Express to Paddington (15 min). Great cafes around the station.', tip: 'The canal-side cafes on Little Venice are 10 min walk' },
      { title: 'South Kensington museums', duration: '3 hr', durationMinutes: 180, category: 'culture', description: 'Express to Paddington, then Circle Line. V&A, Natural History, and Science museums all free.', tip: 'Pick ONE museum. You can\'t do them all.' },
      { title: 'Notting Hill wander', duration: '2.5 hr', durationMinutes: 150, category: 'explore', description: 'Express to Paddington, walk to Portobello Road.', tip: 'Market is best on Saturdays' },
    ],
  },
  NRT: {
    airport: 'Narita International',
    airportCode: 'NRT',
    city: 'Tokyo',
    transitTime: '60 min to Shibuya',
    transitMethod: 'Narita Express',
    canLeaveAirport: true,
    minHoursToLeave: 6,
    airportPerks: [
      'Free cultural experience center (T1)',
      'Japanese garden behind Terminal 1',
      'Uniqlo, MUJI stores in terminals',
      'Incredible food courts with real ramen',
    ],
    activities: [
      { title: 'Narita temple town', duration: '2 hr', durationMinutes: 120, category: 'culture', description: 'Free shuttle to Naritasan temple. 1000-year-old Buddhist temple complex.', tip: 'The eel restaurants on the approach road are legendary' },
      { title: 'Shibuya crossing + ramen', duration: '4 hr', durationMinutes: 240, category: 'food', description: 'Narita Express to Shibuya. See the crossing, eat Ichiran ramen.', tip: 'Tight timeline — leave 2.5 hr for return transit + security' },
      { title: 'Airport onsen bath', duration: '1 hr', durationMinutes: 60, category: 'relax', description: 'Nine Hours capsule hotel near T2 has shower/rest facilities.', tip: 'Bring your own towel to save the fee' },
    ],
  },
  DXB: {
    airport: 'Dubai International',
    airportCode: 'DXB',
    city: 'Dubai',
    transitTime: '20 min to Downtown',
    transitMethod: 'Dubai Metro Red Line',
    canLeaveAirport: true,
    minHoursToLeave: 4,
    airportPerks: [
      'Zen Garden & swimming pool (T3)',
      'Dubai Duty Free — massive shopping',
      'Sleep pods in terminals',
      'Gold and diamond retail',
    ],
    activities: [
      { title: 'Dubai Mall + Burj Khalifa views', duration: '3 hr', durationMinutes: 180, category: 'explore', description: 'Metro to Burj Khalifa station. Window-shop the world\'s biggest mall.', tip: 'Dubai Fountain show every 30 min from 6pm' },
      { title: 'Old Dubai spice souk', duration: '2 hr', durationMinutes: 120, category: 'shop', description: 'Metro to Al Fahidi. Walk through Gold Souk and Spice Souk.', tip: 'Haggle — start at 50% of asking price' },
    ],
  },
  SIN: {
    airport: 'Singapore Changi',
    airportCode: 'SIN',
    city: 'Singapore',
    transitTime: '30 min to city center',
    transitMethod: 'MRT East-West Line',
    canLeaveAirport: true,
    minHoursToLeave: 4,
    airportPerks: [
      'Jewel Changi — indoor waterfall & gardens',
      'Free 2-hour city tour (info desk)',
      'Butterfly garden (T3)',
      'Free movie theater (T2 & T3)',
      'Swimming pool & jacuzzi (T1)',
    ],
    activities: [
      { title: 'Jewel Changi Waterfall', duration: '1.5 hr', durationMinutes: 90, category: 'explore', description: 'Connected to T1. World\'s tallest indoor waterfall, canopy walks.', tip: 'Don\'t need to clear immigration — Jewel is airside accessible' },
      { title: 'Hawker center feast', duration: '3 hr', durationMinutes: 180, category: 'food', description: 'MRT to Chinatown. Maxwell Food Centre has Michelin-starred chicken rice.', tip: 'Tian Tian Hainanese Chicken Rice, stall 10' },
      { title: 'Gardens by the Bay', duration: '3.5 hr', durationMinutes: 210, category: 'explore', description: 'MRT to Bayfront. Supertree Grove is free, Cloud Forest costs ~$20.', tip: 'Light show at 7:45pm and 8:45pm — free' },
    ],
  },
  CDG: {
    airport: 'Charles de Gaulle',
    airportCode: 'CDG',
    city: 'Paris',
    transitTime: '35 min to Gare du Nord',
    transitMethod: 'RER B train',
    canLeaveAirport: true,
    minHoursToLeave: 5,
    airportPerks: [
      'Fauchon, Ladurée shops',
      'iClub Lounge with showers',
      'Free Wi-Fi',
    ],
    activities: [
      { title: 'Montmartre quick hit', duration: '3.5 hr', durationMinutes: 210, category: 'culture', description: 'RER B to Gare du Nord, Metro 4 to Barbès. Walk up to Sacré-Coeur.', tip: 'Skip the funicular — the stairs are the experience' },
      { title: 'Le Marais food walk', duration: '3 hr', durationMinutes: 180, category: 'food', description: 'RER B to Châtelet, walk to Le Marais. Falafel on Rue des Rosiers.', tip: 'L\'As du Fallafel — the line moves fast' },
    ],
  },
  ICN: {
    airport: 'Incheon International',
    airportCode: 'ICN',
    city: 'Seoul',
    transitTime: '43 min to Seoul Station',
    transitMethod: 'AREX Express',
    canLeaveAirport: true,
    minHoursToLeave: 5,
    airportPerks: [
      'Korean Cultural Experience (free, T2)',
      'Spa on Air — jjimjilbang in airport',
      'Ice skating rink (seasonal)',
      'Free transit tour program (2hr, 5hr options)',
    ],
    activities: [
      { title: 'Free transit tour', duration: '2 hr', durationMinutes: 120, category: 'culture', description: 'Sign up at Transit Tour Desk (T1, 3F). Guided bus tour to Incheon landmarks.', tip: 'Departures at 10am, 1pm, 3pm — first come first served' },
      { title: 'Jjimjilbang spa', duration: '2 hr', durationMinutes: 120, category: 'relax', description: 'Spa on Air in basement of T1. Full Korean bathhouse experience.', tip: 'Open 24 hours. Great before a redeye.' },
      { title: 'Myeongdong street food', duration: '4 hr', durationMinutes: 240, category: 'food', description: 'AREX to Seoul Station, Line 4 to Myeongdong. Street food paradise.', tip: 'Tteokbokki and hotteok are the moves' },
    ],
  },
};

/**
 * Get layover guide for an airport.
 */
export function getLayoverGuide(airportCode: string): LayoverGuide | null {
  return LAYOVER_GUIDES[airportCode.toUpperCase()] ?? null;
}

/**
 * Filter activities that fit within the available time.
 * Returns activities sorted by duration (shortest first).
 * Accounts for transit time and security buffer.
 */
export function getLayoverActivities(
  airportCode: string,
  layoverHours: number,
): { inAirport: string[]; canLeave: boolean; activities: LayoverActivity[] } {
  const guide = getLayoverGuide(airportCode);
  if (!guide) {
    return { inAirport: [], canLeave: false, activities: [] };
  }

  const canLeave = guide.canLeaveAirport && layoverHours >= guide.minHoursToLeave;

  // Available time for outside activities (subtract 90 min for transit + security)
  const availableMinutes = canLeave ? (layoverHours * 60) - 90 : 0;

  const activities = canLeave
    ? guide.activities
        .filter((a) => a.durationMinutes <= availableMinutes)
        .sort((a, b) => a.durationMinutes - b.durationMinutes)
    : [];

  return {
    inAirport: guide.airportPerks,
    canLeave,
    activities,
  };
}

/**
 * Get all supported airport codes.
 */
export function getSupportedLayoverAirports(): string[] {
  return Object.keys(LAYOVER_GUIDES);
}
