// =============================================================================
// ROAM — Pulse Tab Static Data & Types
// Extracted from app/(tabs)/pulse.tsx for file size management.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeRec {
  timeSlot: string;
  label: string;
  description: string;
  photo: string;
  timeContext: string;
}

export interface LocalTip {
  text: string;
  category: string;
  upvotes: number;
}

export interface SeasonalEvent {
  destination: string;
  event: string;
  description: string;
  month: number;
  heroPhoto: string;
  dateRange: string;
}

// ---------------------------------------------------------------------------
// Index-based height variation (avoids uniform AI-generated look)
// ---------------------------------------------------------------------------

const DEST_CARD_HEIGHTS = [140, 155, 130, 160, 145, 135, 150];
const EDITORIAL_CARD_HEIGHTS = [200, 220, 185, 210, 195, 180, 215];
const SEASONAL_SMALL_HEIGHTS = [120, 135, 115, 140, 125, 110, 130];

export const getDestCardHeight = (index: number) =>
  DEST_CARD_HEIGHTS[index % DEST_CARD_HEIGHTS.length];
export const getEditorialCardHeight = (index: number) =>
  EDITORIAL_CARD_HEIGHTS[index % EDITORIAL_CARD_HEIGHTS.length];
export const getSeasonalSmallHeight = (index: number) =>
  SEASONAL_SMALL_HEIGHTS[index % SEASONAL_SMALL_HEIGHTS.length];

// ---------------------------------------------------------------------------
// Destination photo cards config
// ---------------------------------------------------------------------------

export const PULSE_DESTINATIONS = [
  { label: 'Tokyo',       key: 'tokyo',       photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { label: 'Bali',        key: 'bali',        photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { label: 'Barcelona',   key: 'barcelona',   photo: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80' },
  { label: 'Paris',       key: 'paris',       photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80' },
  { label: 'Mexico City', key: 'mexico city', photo: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400&q=80' },
  { label: 'Bangkok',     key: 'bangkok',     photo: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80' },
  { label: 'Lisbon',      key: 'lisbon',      photo: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=400&q=80' },
];

// ---------------------------------------------------------------------------
// Time-aware recommendations engine
// ---------------------------------------------------------------------------

export function getCurrentTimeSlot(): 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export const TIME_RECS: Record<string, Record<string, TimeRec[]>> = {
  tokyo: {
    morning: [
      {
        timeSlot: '6–8 AM',
        label: 'Tsukiji Outer Market',
        description: 'Fresh sushi breakfast and tamagoyaki. Best before 8am when it gets crowded.',
        photo: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
        timeContext: 'Best now',
      },
      {
        timeSlot: '7–9 AM',
        label: 'Meiji Shrine',
        description: 'Peaceful morning walk through the forested path. Arrive before tour groups.',
        photo: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
        timeContext: 'Until 9 AM',
      },
    ],
    midday: [
      {
        timeSlot: '11 AM–1 PM',
        label: 'Ramen Alley, Shinjuku',
        description: 'Skip the tourist spots. Fuunji for tsukemen, Nagi for niboshi ramen.',
        photo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80',
        timeContext: 'Best now',
      },
      {
        timeSlot: '12–2 PM',
        label: 'Yanaka District',
        description: 'Old Tokyo neighborhood with zero tourists at lunch. Local eateries everywhere.',
        photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
        timeContext: 'Until 2 PM',
      },
    ],
    afternoon: [
      {
        timeSlot: '3–5 PM',
        label: 'Shimokitazawa',
        description: 'Best vintage stores in Tokyo. Less crowded on weekday afternoons.',
        photo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80',
        timeContext: 'Best now',
      },
      {
        timeSlot: '4–5 PM',
        label: 'Yanaka Cemetery',
        description: 'Peaceful cherry tree-lined paths. Best golden hour light in Tokyo.',
        photo: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '6–8 PM',
        label: 'Golden Gai',
        description: 'Tiny bars seating 6–8 people. Tuesday–Thursday for fewer tourists. Cash only.',
        photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
        timeContext: 'Until 2 AM',
      },
      {
        timeSlot: '7–9 PM',
        label: 'Omoide Yokocho',
        description: 'Smoky yakitori alley near Shinjuku. Locals go after 8pm.',
        photo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80',
        timeContext: 'Until midnight',
      },
    ],
    night: [
      {
        timeSlot: '10 PM+',
        label: 'Konbini Run',
        description: 'Late-night convenience store food is a Tokyo experience. 7-Eleven onigiri, FamilyMart chicken.',
        photo: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
        timeContext: '24 hours',
      },
      {
        timeSlot: '11 PM+',
        label: 'Shibuya Crossing',
        description: 'The iconic scramble is best late at night with fewer crowds and full neon.',
        photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
        timeContext: 'All night',
      },
    ],
  },
  bali: {
    morning: [
      {
        timeSlot: '6–8 AM',
        label: 'Tegallalang Rice Terrace',
        description: 'Arrive at opening. By 9am the Instagram crowds make it unbearable.',
        photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
        timeContext: 'Best before 9 AM',
      },
      {
        timeSlot: '7–9 AM',
        label: 'Canggu Beach Surf',
        description: 'Best waves before 9am. Rent a board from local shops, not branded ones.',
        photo: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80',
        timeContext: 'Best now',
      },
    ],
    midday: [
      {
        timeSlot: '11 AM–1 PM',
        label: 'Warung Babi Guling',
        description: "Suckling pig is Bali's signature dish. Go to Ibu Oka in Ubud, not the tourist version.",
        photo: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
        timeContext: 'Lunch rush',
      },
      {
        timeSlot: '12–2 PM',
        label: 'Tirta Empul Temple',
        description: 'Purification ritual temple. Quieter during lunch when tour buses leave.',
        photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
        timeContext: 'Until 2 PM',
      },
    ],
    afternoon: [
      {
        timeSlot: '4–6 PM',
        label: 'Uluwatu Temple Sunset',
        description: 'Kecak fire dance starts at sunset. Arrive 30 min early for good seats.',
        photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '7–9 PM',
        label: 'Jimbaran Bay Seafood',
        description: 'Beach-side grilled seafood as the sun sets. Pick your fish from the display.',
        photo: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80',
        timeContext: 'Until 10 PM',
      },
    ],
    night: [
      {
        timeSlot: '10 PM+',
        label: 'Potato Head Beach Club',
        description: 'Late-night DJ sets on the beach. The sunset deck is worth the premium.',
        photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
        timeContext: 'Until 4 AM',
      },
    ],
  },
  barcelona: {
    morning: [
      {
        timeSlot: '8–10 AM',
        label: 'La Boqueria Market',
        description: 'Go before 10am. Locals shop early. Fresh fruit juice and jam\u00f3n ib\u00e9rico for breakfast.',
        photo: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
        timeContext: 'Best before 10 AM',
      },
      {
        timeSlot: '9–11 AM',
        label: 'Park G\u00fcell',
        description: "Book the earliest slot. Gaudi's masterpiece without the midday crush.",
        photo: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
        timeContext: 'Until 11 AM',
      },
    ],
    midday: [
      {
        timeSlot: '1–3 PM',
        label: 'El Born Tapas Crawl',
        description: 'Skip Las Ramblas restaurants. El Born has the real tapas bars locals love.',
        photo: 'https://images.unsplash.com/photo-1569470451072-68314f596aec?w=800&q=80',
        timeContext: 'Lunch prime',
      },
    ],
    afternoon: [
      {
        timeSlot: '5–7 PM',
        label: 'Bunkers del Carmel',
        description: 'Best free viewpoint in Barcelona. Bring wine and snacks for sunset.',
        photo: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '9–11 PM',
        label: 'Dinner in Barcelona',
        description: 'Locals eat at 9-10pm. Cal Pep for seafood, Can Culleretes for Catalan classics.',
        photo: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
        timeContext: 'Best 9–11 PM',
      },
    ],
    night: [
      {
        timeSlot: '12 AM+',
        label: 'Razzmatazz',
        description: "Five rooms of music. Barcelona's nightlife doesn't peak until 2am.",
        photo: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
        timeContext: 'Until dawn',
      },
    ],
  },
  paris: {
    morning: [
      {
        timeSlot: '7–9 AM',
        label: 'Rue Cler Market Street',
        description: 'Morning baguette run like a Parisian. Fresh croissants, cheese, charcuterie.',
        photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
        timeContext: 'Best before 9 AM',
      },
    ],
    midday: [
      {
        timeSlot: '12–2 PM',
        label: 'Le Marais Falafel',
        description: "L'As du Fallafel on Rue des Rosiers. The line is worth it, trust us.",
        photo: 'https://images.unsplash.com/photo-1478135467691-82ab4014be5d?w=800&q=80',
        timeContext: 'Lunch only',
      },
    ],
    afternoon: [
      {
        timeSlot: '4–6 PM',
        label: 'Sacr\u00e9-Coeur Steps',
        description: "Golden hour from Montmartre. Bring wine (yes, it's legal). Best sunset spot.",
        photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '7–9 PM',
        label: 'Ap\u00e9ro on Seine',
        description: 'Buy wine and cheese from Nicolas, sit on the banks. Pure Paris.',
        photo: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
        timeContext: 'Until midnight',
      },
    ],
    night: [
      {
        timeSlot: '10 PM+',
        label: 'Oberkampf Bar Crawl',
        description: 'Start at Caf\u00e9 Charbon, let the night unfold. Paris after midnight is magic.',
        photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
        timeContext: 'Until 4 AM',
      },
    ],
  },
  'mexico city': {
    morning: [
      {
        timeSlot: '7–9 AM',
        label: 'Chilaquiles at a Fondita',
        description: 'Skip the hotel breakfast. Any fondita serves perfect chilaquiles.',
        photo: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
        timeContext: 'Breakfast only',
      },
    ],
    midday: [
      {
        timeSlot: '1–3 PM',
        label: 'Roma Norte Caf\u00e9 Hop',
        description: 'Best specialty coffee in Latin America. Buna, Quentin, Blend Station.',
        photo: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=80',
        timeContext: 'Best 1–4 PM',
      },
    ],
    afternoon: [
      {
        timeSlot: '4–6 PM',
        label: 'Terraza Catedral',
        description: 'Mezcal sunset overlooking the Z\u00f3calo. Best rooftop view in the city.',
        photo: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '7–9 PM',
        label: 'Tacos Al Pastor',
        description: 'El Huequito or Taquer\u00eda Orinoco. The al pastor here is what taco dreams are made of.',
        photo: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=80',
        timeContext: 'Until midnight',
      },
    ],
    night: [
      {
        timeSlot: '10 PM+',
        label: 'Condesa Bar Scene',
        description: 'Start at Baltra Bar for cocktails, end at Sal\u00f3n Los \u00c1ngeles for salsa dancing.',
        photo: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
        timeContext: 'Until 3 AM',
      },
    ],
  },
  bangkok: {
    morning: [
      {
        timeSlot: '7–9 AM',
        label: 'Wat Pho at Opening',
        description: 'The reclining Buddha before tour buses arrive. Worth the early start.',
        photo: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80',
        timeContext: 'Opens 8 AM',
      },
    ],
    midday: [
      {
        timeSlot: '12–2 PM',
        label: 'Or Tor Kor Market',
        description: 'The finest fresh market in Bangkok. Better produce, better food, zero tourist pricing.',
        photo: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
        timeContext: 'Until 3 PM',
      },
    ],
    afternoon: [
      {
        timeSlot: '3–5 PM',
        label: 'Chatuchak Weekend Market',
        description: '15,000+ stalls. Go Saturday morning for best selection, least heat.',
        photo: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80',
        timeContext: 'Sat & Sun only',
      },
    ],
    evening: [
      {
        timeSlot: '7–10 PM',
        label: 'Chinatown Street Food',
        description: 'Yaowarat Road at night. Crab omelets, roast duck, mango sticky rice. Arrive hungry.',
        photo: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
        timeContext: 'Best after 7 PM',
      },
    ],
    night: [
      {
        timeSlot: '11 PM+',
        label: 'Khao San Road',
        description: 'Messy, loud, totally unapologetic. For when you need to switch your brain off.',
        photo: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80',
        timeContext: 'Until dawn',
      },
    ],
  },
  lisbon: {
    morning: [
      {
        timeSlot: '8–10 AM',
        label: 'Pastel de Nata at Manteigaria',
        description: 'Shorter line than Past\u00e9is de Bel\u00e9m, arguably better. Order two. Eat them warm.',
        photo: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=800&q=80',
        timeContext: 'Fresh until noon',
      },
    ],
    midday: [
      {
        timeSlot: '1–3 PM',
        label: 'LX Factory Sunday Market',
        description: 'Best brunch, bookshops, and flea market in Lisbon. Go Saturday afternoon.',
        photo: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80',
        timeContext: 'Sat & Sun only',
      },
    ],
    afternoon: [
      {
        timeSlot: '5–7 PM',
        label: 'Miradouro da Gra\u00e7a',
        description: 'Best free sunset viewpoint. Bring wine (2 euros at the local shop nearby).',
        photo: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '8–10 PM',
        label: 'Alfama Fado',
        description: 'The neighborhood was built for this music. Book a small fado house, not a tourist venue.',
        photo: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=800&q=80',
        timeContext: 'Starts 9 PM',
      },
    ],
    night: [
      {
        timeSlot: '11 PM+',
        label: 'Bairro Alto Bar Hop',
        description: 'Bars spill onto the streets. Cheap wine, local crowd, zero pretension.',
        photo: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=800&q=80',
        timeContext: 'Until 4 AM',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Hyper-local tips (5 per destination, shown max 5)
// ---------------------------------------------------------------------------

export const LOCAL_TIPS: Record<string, LocalTip[]> = {
  tokyo: [
    { text: 'Train station ekiben (boxed lunches) are better and cheaper than any restaurant near tourist spots.', category: 'food', upvotes: 847 },
    { text: 'Suica card works on ALL trains, buses, and most convenience stores. Load it once and forget about buying tickets.', category: 'transport', upvotes: 489 },
    { text: 'Tipping is considered rude. Do not tip at restaurants, hotels, or taxis. The price is the price.', category: 'culture', upvotes: 367 },
    { text: 'Shinjuku Station has 200+ exits. Screenshot your exact exit number or you will get lost.', category: 'transport', upvotes: 345 },
    { text: 'Standing sushi bars near train stations are often better than sit-down tourist restaurants, and half the price.', category: 'food', upvotes: 289 },
  ],
  bali: [
    { text: 'Grab (ride-hailing) is technically banned in many tourist areas. Drivers will ask you to walk to a pickup point outside the zone.', category: 'transport', upvotes: 523 },
    { text: 'Temple dress code is strict: sarong covering legs required. Free rentals at most temples, but bringing your own is cheaper.', category: 'culture', upvotes: 434 },
    { text: 'The monkeys at Ubud Monkey Forest WILL steal your sunglasses, phone, and water bottle. Secure everything.', category: 'safety', upvotes: 412 },
    { text: 'Do NOT drink tap water or use it to brush teeth. Bali belly is real and will ruin 2\u20133 days of your trip.', category: 'health', upvotes: 334 },
    { text: 'The real Balinese food is at warungs (small local restaurants), not the Instagram caf\u00e9s. Nasi campur for $2 beats any $15 smoothie bowl.', category: 'food', upvotes: 276 },
  ],
  barcelona: [
    { text: 'Pickpockets are extremely active on Las Ramblas, in the metro, and at the beach. Use a crossbody bag and stay alert.', category: 'safety', upvotes: 634 },
    { text: 'Locals eat dinner at 9\u201310 PM. If a restaurant is full at 7 PM, it is full of tourists. Wait for the real crowd.', category: 'food', upvotes: 567 },
    { text: 'Book Sagrada Familia tickets online weeks in advance. Walk-up is nearly impossible and double the price from resellers.', category: 'planning', upvotes: 456 },
    { text: 'Vermouth at 12\u20132 PM on a terrace is a Barcelona ritual. Order "un vermut" with olives and chips.', category: 'food', upvotes: 412 },
    { text: 'El Born neighborhood has the best tapas, cocktails, and vibe. Skip Las Ramblas entirely for food.', category: 'food', upvotes: 276 },
  ],
  paris: [
    { text: 'Boulangeries with "Artisan Boulanger" on the sign are legally certified. These have the real croissants.', category: 'food', upvotes: 589 },
    { text: 'Say "Bonjour" when entering ANY shop. Not saying hello is considered extremely rude and will affect service.', category: 'culture', upvotes: 512 },
    { text: 'The Louvre takes 3+ hours minimum. Do NOT try to see everything. Pick one wing and enjoy it.', category: 'planning', upvotes: 478 },
    { text: 'Water is free at restaurants \u2014 ask for "une carafe d\'eau" (tap water). Never pay for Evian at a caf\u00e9.', category: 'money', upvotes: 445 },
    { text: 'The Seine at night is free and more romantic than any expensive restaurant. Buy wine at a Nicolas shop.', category: 'hack', upvotes: 345 },
  ],
  'mexico city': [
    { text: 'Uber works perfectly in CDMX and is very cheap. Use it for anything beyond walking distance, especially at night.', category: 'transport', upvotes: 567 },
    { text: 'Street tacos are the best tacos. Look for long lines of locals \u2014 that is your quality indicator.', category: 'food', upvotes: 534 },
    { text: 'Altitude is 2,240m (7,350ft). You WILL feel it. Take it easy day one, drink water, avoid alcohol first night.', category: 'health', upvotes: 489 },
    { text: 'Roma Norte and Condesa are the safest, most walkable neighborhoods for tourists. Base yourself here.', category: 'planning', upvotes: 456 },
    { text: 'Sunday in Coyoac\u00e1n is magic. Markets, street performers, families. This is real CDMX culture.', category: 'culture', upvotes: 289 },
  ],
  bangkok: [
    { text: 'BTS Skytrain and MRT are airconditioned and fast. Use them instead of taxis during rush hour (traffic is brutal).', category: 'transport', upvotes: 545 },
    { text: 'Tuk-tuks that approach YOU are scams. They will take you to gem shops and suit stores for commission.', category: 'safety', upvotes: 467 },
    { text: 'Wat Pho has the best Thai massage school. 260 baht ($7) for a 30-minute massage. Skip the tourist spas.', category: 'hack', upvotes: 423 },
    { text: '7-Eleven has surprisingly amazing food. Toasties, onigiri, and Thai milk tea for under $2.', category: 'food', upvotes: 367 },
    { text: 'Khao San Road is a tourist bubble. Locals go to Soi Rambuttri (next street over) for similar vibes, less chaos.', category: 'hack', upvotes: 298 },
  ],
  lisbon: [
    { text: 'Pastel de nata at Manteigaria, not Past\u00e9is de Bel\u00e9m. Shorter line, arguably better past\u00e9is.', category: 'food', upvotes: 478 },
    { text: 'Tram 28 is a pickpocket hotspot. Walk the route instead \u2014 it is beautiful and you see more.', category: 'safety', upvotes: 445 },
    { text: 'Portuguese people appreciate "obrigado/obrigada" (thank you, m/f). Basic Portuguese gets better service everywhere.', category: 'culture', upvotes: 389 },
    { text: 'Wine is incredibly cheap. A great bottle is 5\u20138 euros at a shop. Order the house wine at restaurants.', category: 'money', upvotes: 367 },
    { text: 'Alfama is best explored by getting lost on purpose. Put your phone away and wander the medieval streets.', category: 'hack', upvotes: 345 },
  ],
};

export const DEFAULT_TIPS: LocalTip[] = [
  { text: 'Visit the local market on the first morning. It tells you everything about the culture in one place.', category: 'food', upvotes: 234 },
  { text: 'Learn "hello", "thank you", and "how much" in the local language. It transforms interactions.', category: 'culture', upvotes: 212 },
  { text: 'The best restaurant is the one with the most locals, not the best TripAdvisor score.', category: 'food', upvotes: 198 },
  { text: 'Carry cash in local currency. Not everywhere accepts cards, especially the best local spots.', category: 'money', upvotes: 178 },
  { text: 'Walk the neighborhood surrounding your accommodation before looking at Google Maps. You will find hidden spots.', category: 'hack', upvotes: 156 },
];

// ---------------------------------------------------------------------------
// Seasonal events — March 2026
// ---------------------------------------------------------------------------

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    destination: 'Tokyo',
    event: 'Cherry Blossom Peak',
    description: 'Sakura season hits peak bloom in late March. Ueno Park and Meguro River are the top spots. Book 2+ months ahead \u2014 hotels sell out.',
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
    dateRange: 'Late March \u00b7 2 weeks',
  },
  {
    destination: 'Bali',
    event: 'Nyepi \u2014 Day of Silence',
    description: "Bali's New Year: the entire island shuts down for 24 hours. No lights, no noise, no travel. Book around it or experience the quiet.",
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    dateRange: 'March 28\u201329',
  },
  {
    destination: 'Mexico City',
    event: 'Spring Equinox at Teotihuac\u00e1n',
    description: 'Thousands gather at the Pyramid of the Sun to absorb spring energy. Wear white. Go early to beat crowds.',
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
    dateRange: 'March 20\u201321',
  },
  {
    destination: 'Barcelona',
    event: 'Pre-Season Sweet Spot',
    description: 'March is Barcelona before the summer crowds. 15\u201318\u00b0C, sunny, beaches empty, restaurants not packed. Perfect timing.',
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
    dateRange: 'All of March',
  },
];

export const SEASONAL_SMALL_EVENTS = [
  {
    name: 'Sakura Train Views',
    dest: 'Tokyo',
    date: 'Mar 25\u2013Apr 5',
    photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  },
  {
    name: 'Marrakech Perfect Weather',
    dest: 'Marrakech',
    date: 'Mar\u2013Apr',
    photo: 'https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=400&q=80',
  },
  {
    name: 'Lisbon Sunshine Begins',
    dest: 'Lisbon',
    date: 'Mid March',
    photo: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=400&q=80',
  },
];

// ---------------------------------------------------------------------------
// Local time display helper
// ---------------------------------------------------------------------------

export function getLocalTimeString(destKey: string, getTimezoneByDestination: (key: string) => string | null): string {
  const tz = getTimezoneByDestination(destKey);
  if (!tz) return '';
  try {
    const now = new Date();
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: tz }).format(now);
    const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).format(now);
    return `${dayName} ${timeStr}`;
  } catch {
    return '';
  }
}
