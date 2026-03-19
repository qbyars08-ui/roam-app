// =============================================================================
// ROAM — WiFi Café & Workspace Intel
// Curated spots for digital nomads and remote workers
// =============================================================================

export interface CafeSpot {
  readonly name: string;
  readonly neighborhood: string;
  readonly wifiSpeed: 'fast' | 'good' | 'okay';
  readonly outlets: 'many' | 'some' | 'few';
  readonly noise: 'quiet' | 'moderate' | 'lively';
  readonly coffeeCost: string;
  readonly stayFriendly: boolean;
  readonly tip: string;
}

export interface CityWorkspaceGuide {
  readonly generalWifi: 'excellent' | 'good' | 'spotty' | 'poor';
  readonly simCardTip: string;
  readonly spots: readonly CafeSpot[];
}

// ---------------------------------------------------------------------------
// Curated workspace data — verified spots, not Yelp dumps
// ---------------------------------------------------------------------------

const GUIDES: Record<string, CityWorkspaceGuide> = {
  tokyo: {
    generalWifi: 'good',
    simCardTip: 'Get a Sakura Mobile eSIM or rent a pocket WiFi at the airport. Free WiFi exists but requires registration at every spot.',
    spots: [
      { name: 'Starbucks Reserve Roastery Nakameguro', neighborhood: 'Meguro', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '¥500-800', stayFriendly: true, tip: 'Go to the 3rd floor — fewer tourists, more outlets, river view.' },
      { name: 'FabCafe Shibuya', neighborhood: 'Shibuya', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '¥500-700', stayFriendly: true, tip: 'Coworking-cafe hybrid. Laser cutters downstairs if you need to procrastinate creatively.' },
      { name: 'Doutor Coffee (any branch)', neighborhood: 'Everywhere', wifiSpeed: 'good', outlets: 'some', noise: 'quiet', coffeeCost: '¥250-400', stayFriendly: true, tip: 'Japan\'s best-kept remote work secret. Cheap, quiet, everywhere. Outlets near walls.' },
      { name: 'Fuglen Tokyo', neighborhood: 'Tomigaya', wifiSpeed: 'good', outlets: 'few', noise: 'quiet', coffeeCost: '¥600-900', stayFriendly: true, tip: 'Norwegian coffee shop turned cocktail bar at night. Morning = productivity paradise.' },
    ],
  },
  paris: {
    generalWifi: 'good',
    simCardTip: 'Buy a Free Mobile SIM at a tabac (€2, 50GB data). Best deal in Europe.',
    spots: [
      { name: 'Anticafé', neighborhood: 'Beaubourg / multiple', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: '€5/hour (unlimited drinks)', stayFriendly: true, tip: 'Pay per time, not per drink. Unlimited coffee, tea, snacks. Built for working.' },
      { name: 'Boot Café', neighborhood: 'Le Marais', wifiSpeed: 'good', outlets: 'some', noise: 'quiet', coffeeCost: '€3.50-5', stayFriendly: true, tip: 'Tiny but legendary among Paris remote workers. Go early — only 12 seats.' },
      { name: 'Café Oberkampf', neighborhood: 'Oberkampf', wifiSpeed: 'good', outlets: 'some', noise: 'moderate', coffeeCost: '€3-5', stayFriendly: true, tip: 'Hipster but functional. Great lunch menu too. Stay all afternoon, nobody cares.' },
      { name: 'Nuage Café', neighborhood: '10th', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: '€4-6', stayFriendly: true, tip: 'Cloud-themed, power-strip friendly. The owner actively welcomes laptop workers.' },
    ],
  },
  bali: {
    generalWifi: 'spotty',
    simCardTip: 'Get a Telkomsel SIM at the airport. 30GB for ~$5. WiFi in cafes is unreliable — always have mobile backup.',
    spots: [
      { name: 'Dojo Bali', neighborhood: 'Canggu', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: 'Rp 35,000-50,000', stayFriendly: true, tip: 'THE coworking space of Bali. Day pass ~$12. Pool, fast fiber, A/C. Worth it.' },
      { name: 'Crate Café', neighborhood: 'Canggu', wifiSpeed: 'good', outlets: 'some', noise: 'lively', coffeeCost: 'Rp 35,000-55,000', stayFriendly: true, tip: 'Instagram-famous but actually functional. Upstairs is quieter. Order the smoothie bowl.' },
      { name: 'Seniman Coffee', neighborhood: 'Ubud', wifiSpeed: 'good', outlets: 'many', noise: 'moderate', coffeeCost: 'Rp 30,000-50,000', stayFriendly: true, tip: 'Best coffee in Ubud, period. They roast their own. Back room is the quiet zone.' },
      { name: 'Hubud', neighborhood: 'Ubud', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: 'Day pass ~$15', stayFriendly: true, tip: 'Open-air bamboo coworking. Fan-cooled, not A/C. Bring a light layer for rain.' },
    ],
  },
  bangkok: {
    generalWifi: 'excellent',
    simCardTip: 'AIS or TrueMove SIM at 7-Eleven. 30GB for ฿299 (~$8). Thailand has insanely fast mobile data.',
    spots: [
      { name: 'Too Fast To Sleep', neighborhood: 'Siam', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '฿80-150', stayFriendly: true, tip: 'Open 24 hours. The 2am coding session spot. Power outlets at every seat.' },
      { name: 'CAMP by Flynow', neighborhood: 'Maya / One Nimman', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '฿80-120', stayFriendly: true, tip: 'In the mall. A/C cranked. Free 2-hour WiFi with any purchase, unlimited with AIS SIM.' },
      { name: 'The Coffee Academics', neighborhood: 'Thonglor', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: '฿130-200', stayFriendly: true, tip: 'Premium price but premium workspace. Quieter than any coworking. Large tables.' },
      { name: 'Analog Café', neighborhood: 'Ari', wifiSpeed: 'good', outlets: 'some', noise: 'quiet', coffeeCost: '฿80-130', stayFriendly: true, tip: 'Ari neighborhood is Bangkok\'s local hipster district. Real neighborhood, not tourist.' },
    ],
  },
  london: {
    generalWifi: 'excellent',
    simCardTip: 'Giffgaff or Three SIM — pick up at Heathrow arrivals. £15 for 20GB. Or just use WiFi — it\'s everywhere.',
    spots: [
      { name: 'Timberyard (Seven Dials)', neighborhood: 'Covent Garden', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '£3.50-5', stayFriendly: true, tip: 'Remote worker HQ of central London. Basement has the best outlets and seats.' },
      { name: 'The Barbican Centre', neighborhood: 'Barbican', wifiSpeed: 'fast', outlets: 'some', noise: 'quiet', coffeeCost: '£3-5', stayFriendly: true, tip: 'Free WiFi, brutalist architecture, civilized. The conservatory cafe is magical.' },
      { name: 'Workshop Coffee (Fitzrovia)', neighborhood: 'Fitzrovia', wifiSpeed: 'good', outlets: 'some', noise: 'moderate', coffeeCost: '£3.50-5', stayFriendly: true, tip: 'Specialty coffee snobs love this place. Flat whites are elite. Afternoon = quieter.' },
      { name: 'British Library', neighborhood: 'King\'s Cross', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: 'Free (library)', stayFriendly: true, tip: 'Free WiFi, quiet rooms, outlets. Register for a free reader pass for the desks.' },
    ],
  },
  seoul: {
    generalWifi: 'excellent',
    simCardTip: 'Korea has the fastest public WiFi on earth. Free KT WiFi at airports, subways, buses. You barely need a SIM.',
    spots: [
      { name: 'Café Onion (Seongsu)', neighborhood: 'Seongsu', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '₩5,000-7,000', stayFriendly: true, tip: 'Converted warehouse. 3 floors — top floor is quietest. Don\'t go weekends (line).' },
      { name: 'Fritz Coffee (Mapo)', neighborhood: 'Mapo', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '₩5,000-6,500', stayFriendly: true, tip: 'Cute seal logo. Best pastries of any café in Seoul. Croissants sell out by 11am.' },
      { name: 'Twosome Place (any branch)', neighborhood: 'Everywhere', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: '₩4,500-6,000', stayFriendly: true, tip: 'Korea\'s version of Starbucks but better for working. More space, cheaper, faster WiFi.' },
      { name: 'National Library of Korea', neighborhood: 'Seocho', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: 'Free (library)', stayFriendly: true, tip: 'Study rooms, fast WiFi, free. Koreans study here 12+ hours. You\'ll fit right in.' },
    ],
  },
  'new york': {
    generalWifi: 'excellent',
    simCardTip: 'US SIM at any phone store. Or skip it — NYC has free LinkNYC WiFi hotspots on every block in Manhattan.',
    spots: [
      { name: 'Think Coffee (multiple)', neighborhood: 'Multiple', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '$4-6', stayFriendly: true, tip: 'The Mercer St location is the best for working. Big tables, good light, chill vibe.' },
      { name: 'Brooklyn Public Library (Central)', neighborhood: 'Prospect Heights', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: 'Free (library)', stayFriendly: true, tip: 'Gorgeous Art Deco building. Free WiFi, study rooms. Better than paying $15/day at a café.' },
      { name: 'Devoción', neighborhood: 'Williamsburg', wifiSpeed: 'good', outlets: 'some', noise: 'moderate', coffeeCost: '$5-7', stayFriendly: true, tip: 'The atrium with the living wall is iconic. Colombian beans roasted in-house. Morning only for seats.' },
      { name: 'The Penny (Meatpacking)', neighborhood: 'Meatpacking', wifiSpeed: 'fast', outlets: 'many', noise: 'moderate', coffeeCost: '$5-7', stayFriendly: true, tip: 'Australian café vibes. They actually encourage working — rare in Manhattan.' },
    ],
  },
  rome: {
    generalWifi: 'spotty',
    simCardTip: 'Get a Vodafone or TIM SIM near Termini station. €10 for 50GB. Italian café WiFi is terrible — plan accordingly.',
    spots: [
      { name: 'Roscioli Caffè', neighborhood: 'Centro Storico', wifiSpeed: 'good', outlets: 'few', noise: 'moderate', coffeeCost: '€2-4', stayFriendly: false, tip: 'Great coffee, terrible for long work sessions. Quick email check only — Italian cafés aren\'t for camping.' },
      { name: 'Open Baladin', neighborhood: 'Campo de\' Fiori', wifiSpeed: 'good', outlets: 'some', noise: 'moderate', coffeeCost: '€3-5', stayFriendly: true, tip: 'Craft beer bar that doubles as a workspace during the day. WiFi password on the receipt.' },
      { name: 'Bibliotheca Hertziana', neighborhood: 'Trinità dei Monti', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: 'Free (library)', stayFriendly: true, tip: 'Stunning view from the terrace. Free WiFi. One of Rome\'s best-kept secrets for remote work.' },
      { name: 'Coworking LATTE', neighborhood: 'Trastevere', wifiSpeed: 'fast', outlets: 'many', noise: 'quiet', coffeeCost: '€10/day pass', stayFriendly: true, tip: 'In Trastevere — work during the day, bar-hop at night. Day pass includes coffee.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getWorkspaceGuide(destination: string): CityWorkspaceGuide | null {
  const key = destination.toLowerCase().trim();
  return GUIDES[key] ?? null;
}

export function getCafeSpots(destination: string): readonly CafeSpot[] {
  return getWorkspaceGuide(destination)?.spots ?? [];
}

export function getTopCafe(destination: string): CafeSpot | null {
  const spots = getCafeSpots(destination);
  return spots[0] ?? null;
}

export function hasWorkspaceGuide(destination: string): boolean {
  return getWorkspaceGuide(destination) !== null;
}

export const WIFI_SPEED_LABELS = {
  fast: '100+ Mbps',
  good: '25-100 Mbps',
  okay: '5-25 Mbps',
} as const;

export const NOISE_ICONS = {
  quiet: 'VolumeX',
  moderate: 'Volume1',
  lively: 'Volume2',
} as const;

export const OUTLET_LABELS = {
  many: 'Outlets everywhere',
  some: 'Some outlets',
  few: 'Bring a battery',
} as const;
