// =============================================================================
// ROAM — Pulse Tab (Local Pulse)
// Time-aware recommendations, hyper-local tips, and seasonal intelligence.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Radio,
  Clock,
  Coffee,
  Sun,
  Sunset,
  Moon,
  MapPin,
  ChevronRight,
  Star,
  Flower2,
  Mountain,
  TreePine,
  Waves,
  ThumbsUp,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, HIDDEN_DESTINATIONS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeRec {
  timeSlot: string;
  label: string;
  description: string;
  Icon: typeof Coffee;
  color: string;
}

interface LocalTip {
  text: string;
  category: string;
  upvotes: number;
}

interface SeasonalEvent {
  destination: string;
  event: string;
  description: string;
  month: number;
  Icon: typeof Flower2;
}

// ---------------------------------------------------------------------------
// Time-aware recommendations engine
// ---------------------------------------------------------------------------

function getCurrentTimeSlot(): 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const TIME_RECS: Record<string, Record<string, TimeRec[]>> = {
  tokyo: {
    morning: [
      { timeSlot: '6-8 AM', label: 'Tsukiji Outer Market', description: 'Fresh sushi breakfast and tamagoyaki. Best before 8am when it gets crowded.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '7-9 AM', label: 'Meiji Shrine', description: 'Peaceful morning walk through the forested path. Arrive before tour groups.', Icon: TreePine, color: COLORS.sage },
    ],
    midday: [
      { timeSlot: '11 AM-1 PM', label: 'Ramen Alley in Shinjuku', description: 'Skip the tourist spots. Fuunji for tsukemen, Nagi for niboshi ramen.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '12-2 PM', label: 'Yanaka District', description: 'Old Tokyo neighborhood with zero tourists at lunch. Local eateries everywhere.', Icon: MapPin, color: COLORS.sage },
    ],
    afternoon: [
      { timeSlot: '3-5 PM', label: 'Shimokitazawa Vintage Shopping', description: 'Best vintage stores in Tokyo. Less crowded weekday afternoons.', Icon: Star, color: COLORS.coral },
      { timeSlot: '4-5 PM', label: 'Yanaka Cemetery Sunset', description: 'Peaceful cherry tree-lined paths. Best golden hour light in Tokyo.', Icon: Sunset, color: COLORS.gold },
    ],
    evening: [
      { timeSlot: '6-8 PM', label: 'Golden Gai', description: 'Tiny bars seating 6-8 people. Tuesday-Thursday for fewer tourists. Cash only.', Icon: Moon, color: COLORS.coral },
      { timeSlot: '7-9 PM', label: 'Omoide Yokocho', description: 'Smoky yakitori alley near Shinjuku. Locals go after 8pm.', Icon: Coffee, color: COLORS.gold },
    ],
    night: [
      { timeSlot: '10 PM+', label: 'Konbini Run', description: 'Late-night convenience store food is a Tokyo experience. 7-Eleven onigiri, FamilyMart chicken.', Icon: Moon, color: COLORS.sage },
      { timeSlot: '11 PM+', label: 'Shibuya Crossing', description: 'The iconic scramble is best experienced late at night with fewer crowds and full neon.', Icon: Star, color: COLORS.coral },
    ],
  },
  bali: {
    morning: [
      { timeSlot: '6-8 AM', label: 'Tegallalang Rice Terrace', description: 'Arrive at opening. By 9am the Instagram crowds make it unbearable.', Icon: Sun, color: COLORS.gold },
      { timeSlot: '7-9 AM', label: 'Canggu Beach Surf', description: 'Best waves before 9am. Rent a board from the local shops, not the branded ones.', Icon: Waves, color: COLORS.sage },
    ],
    midday: [
      { timeSlot: '11 AM-1 PM', label: 'Warung Babi Guling', description: 'Suckling pig is Bali\'s signature dish. Go to Ibu Oka in Ubud, not the tourist version.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '12-2 PM', label: 'Tirta Empul Temple', description: 'Purification ritual temple. Quieter during lunch when tour buses leave.', Icon: MapPin, color: COLORS.sage },
    ],
    afternoon: [
      { timeSlot: '3-5 PM', label: 'Ubud Art Market', description: 'Haggle in the afternoon when vendors are relaxed. Start at 30% of asking price.', Icon: Star, color: COLORS.coral },
      { timeSlot: '4-6 PM', label: 'Uluwatu Temple Sunset', description: 'Kecak fire dance starts at sunset. Arrive 30 min early for good seats.', Icon: Sunset, color: COLORS.gold },
    ],
    evening: [
      { timeSlot: '7-9 PM', label: 'Jimbaran Bay Seafood', description: 'Beach-side grilled seafood as the sun sets. Pick your fish from the display.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '8 PM+', label: 'La Favela Seminyak', description: 'Bali\'s most iconic nightlife. Wednesday and Saturday are the best nights.', Icon: Moon, color: COLORS.coral },
    ],
    night: [
      { timeSlot: '10 PM+', label: 'Potato Head Beach Club', description: 'Late-night DJ sets on the beach. The sunset deck is worth the premium.', Icon: Moon, color: COLORS.coral },
    ],
  },
  barcelona: {
    morning: [
      { timeSlot: '8-10 AM', label: 'La Boqueria Market', description: 'Go before 10am. Locals shop early. Fresh fruit juice and jamón ibérico for breakfast.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '9-11 AM', label: 'Park Güell', description: 'Book the earliest slot. Gaudi\'s masterpiece without the midday crush.', Icon: TreePine, color: COLORS.sage },
    ],
    midday: [
      { timeSlot: '1-3 PM', label: 'El Born Tapas Crawl', description: 'Skip Las Ramblas restaurants. El Born has the real tapas bars locals love.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '2-4 PM', label: 'Barceloneta Beach', description: 'Post-lunch siesta on the beach. Bring your own drinks, beach bars overcharge.', Icon: Waves, color: COLORS.sage },
    ],
    afternoon: [
      { timeSlot: '4-6 PM', label: 'Gothic Quarter Wander', description: 'Afternoon light through narrow medieval streets. Best photography time.', Icon: Sun, color: COLORS.gold },
      { timeSlot: '5-7 PM', label: 'Bunkers del Carmel', description: 'Best free viewpoint in Barcelona. Bring wine and snacks for sunset.', Icon: Sunset, color: COLORS.coral },
    ],
    evening: [
      { timeSlot: '9-11 PM', label: 'Dinner Time', description: 'Locals eat at 9-10pm. Book ahead. Cal Pep for seafood, Can Culleretes for Catalan classics.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '10 PM+', label: 'Raval Bar Hopping', description: 'Start at Bar Marsella (absinthe since 1820), end wherever the night takes you.', Icon: Moon, color: COLORS.coral },
    ],
    night: [
      { timeSlot: '12 AM+', label: 'Razzmatazz', description: 'Five rooms of music. Barcelona\'s nightlife doesn\'t peak until 2am.', Icon: Moon, color: COLORS.coral },
    ],
  },
  paris: {
    morning: [
      { timeSlot: '7-9 AM', label: 'Rue Cler Market Street', description: 'Morning baguette run like a Parisian. Fresh croissants, cheese, charcuterie.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '8-10 AM', label: 'Jardin du Luxembourg', description: 'Morning jog or walk among the fountains before tourists arrive.', Icon: TreePine, color: COLORS.sage },
    ],
    midday: [
      { timeSlot: '12-2 PM', label: 'Le Marais Falafel', description: 'L\'As du Fallafel on Rue des Rosiers. The line is worth it, trust us.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '1-3 PM', label: 'Musée d\'Orsay', description: 'Less crowded than the Louvre. Impressionist collection is world-class.', Icon: Star, color: COLORS.sage },
    ],
    afternoon: [
      { timeSlot: '3-5 PM', label: 'Canal Saint-Martin', description: 'Parisian hipster neighborhood. Sit by the canal with a book and café crème.', Icon: Sun, color: COLORS.gold },
      { timeSlot: '4-6 PM', label: 'Sacré-Coeur Steps', description: 'Golden hour from Montmartre. Bring wine (yes, it\'s legal). Best sunset spot.', Icon: Sunset, color: COLORS.coral },
    ],
    evening: [
      { timeSlot: '7-9 PM', label: 'Apéro on Seine', description: 'Buy wine and cheese from Nicolas, sit on the banks. Pure Paris.', Icon: Moon, color: COLORS.gold },
      { timeSlot: '8-10 PM', label: 'Dinner in Belleville', description: 'Paris\'s most diverse food neighborhood. Chinese, Vietnamese, Tunisian. Real Paris.', Icon: Coffee, color: COLORS.coral },
    ],
    night: [
      { timeSlot: '10 PM+', label: 'Oberkampf Bar Crawl', description: 'Start at Café Charbon, let the night unfold. Paris after midnight is magic.', Icon: Moon, color: COLORS.coral },
    ],
  },
  'mexico city': {
    morning: [
      { timeSlot: '7-9 AM', label: 'Chilaquiles at a Fondita', description: 'Skip the hotel breakfast. Any fondita (small restaurant) serves perfect chilaquiles.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '8-10 AM', label: 'Chapultepec Park', description: 'Morning walk in the largest urban park in the Americas. Free on Sundays.', Icon: TreePine, color: COLORS.sage },
    ],
    midday: [
      { timeSlot: '12-2 PM', label: 'Mercado de la Merced', description: 'Massive local market. Skip the tourist markets, this is where CDMX eats.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '1-3 PM', label: 'Roma Norte Café Hop', description: 'Best specialty coffee in Latin America. Buna, Quentin, Blend Station.', Icon: Coffee, color: COLORS.sage },
    ],
    afternoon: [
      { timeSlot: '3-5 PM', label: 'Coyoacán', description: 'Frida Kahlo\'s neighborhood. Book Casa Azul tickets in advance.', Icon: Star, color: COLORS.gold },
      { timeSlot: '4-6 PM', label: 'Terraza Catedral Rooftop', description: 'Mezcal sunset overlooking the Zócalo. Best rooftop view in the city.', Icon: Sunset, color: COLORS.coral },
    ],
    evening: [
      { timeSlot: '7-9 PM', label: 'Tacos Al Pastor', description: 'El Huequito or Taquería Orinoco. The al pastor here is what taco dreams are made of.', Icon: Coffee, color: COLORS.gold },
      { timeSlot: '9 PM+', label: 'Lucha Libre Wrestling', description: 'Arena México on Friday nights. Buy mask souvenirs. Pure CDMX culture.', Icon: Star, color: COLORS.coral },
    ],
    night: [
      { timeSlot: '10 PM+', label: 'Condesa Bar Scene', description: 'Start at Baltra Bar for cocktails, end at Salón Los Ángeles for salsa dancing.', Icon: Moon, color: COLORS.coral },
    ],
  },
};

// ---------------------------------------------------------------------------
// Hyper-local tips (10 per destination)
// ---------------------------------------------------------------------------

const LOCAL_TIPS: Record<string, LocalTip[]> = {
  tokyo: [
    { text: 'Train station ekiben (boxed lunches) are better and cheaper than any restaurant near tourist spots.', category: 'food', upvotes: 847 },
    { text: 'The 100-yen stores (Daiso, Seria) have travel essentials, unique souvenirs, and kitchen gadgets. Better than any souvenir shop.', category: 'shopping', upvotes: 612 },
    { text: 'Coin lockers at major stations cost 300-700 yen. Store bags and explore hands-free instead of going back to your hotel.', category: 'hack', upvotes: 534 },
    { text: 'Suica card works on ALL trains, buses, and most convenience stores. Load it once and forget about buying tickets.', category: 'transport', upvotes: 489 },
    { text: 'Free WiFi is terrible in Tokyo. Get a pocket WiFi from the airport or an eSIM before you arrive.', category: 'tech', upvotes: 423 },
    { text: 'Convenience store ATMs (7-Eleven) are the only ones that reliably accept foreign cards. Japan Post Bank also works.', category: 'money', upvotes: 398 },
    { text: 'Tipping is considered rude. Do not tip at restaurants, hotels, or taxis. The price is the price.', category: 'culture', upvotes: 367 },
    { text: 'Shinjuku Station has 200+ exits. Screenshot your exact exit number or you will get lost. Google Maps works inside stations.', category: 'transport', upvotes: 345 },
    { text: 'Department store basement floors (depachika) have the best food samples. Isetan and Takashimaya are legendary.', category: 'food', upvotes: 312 },
    { text: 'Standing sushi bars near train stations are often better than sit-down tourist restaurants, and half the price.', category: 'food', upvotes: 289 },
  ],
  bali: [
    { text: 'Grab (ride-hailing) is technically banned in many tourist areas. Drivers will ask you to walk to a pickup point outside the zone.', category: 'transport', upvotes: 523 },
    { text: 'Always negotiate the price BEFORE getting on a motorbike taxi. Or use Grab for a fixed price.', category: 'money', upvotes: 487 },
    { text: 'Temple dress code is strict: sarong covering legs required. Free rentals available at most temples, but bringing your own is cheaper.', category: 'culture', upvotes: 434 },
    { text: 'The monkeys at Ubud Monkey Forest WILL steal your sunglasses, phone, and water bottle. Secure everything.', category: 'safety', upvotes: 412 },
    { text: 'Bintang beer is 15k IDR at a warung but 80k IDR at a beach club. Drink at warungs, then go to the club.', category: 'money', upvotes: 389 },
    { text: 'Canggu is surfer/digital nomad vibe, Seminyak is party, Ubud is spiritual, Uluwatu is cliffs and luxury. Pick based on your vibe.', category: 'planning', upvotes: 356 },
    { text: 'Do NOT drink tap water or use it to brush teeth. Bali belly is real and will ruin 2-3 days of your trip.', category: 'health', upvotes: 334 },
    { text: 'Learn "terima kasih" (thank you) and "berapa" (how much). Locals genuinely appreciate any Indonesian.', category: 'culture', upvotes: 312 },
    { text: 'Rent a scooter only if you have riding experience. Bali traffic is chaotic and medical evacuation is expensive.', category: 'safety', upvotes: 298 },
    { text: 'The real Balinese food is at warungs (small local restaurants), not the Instagram cafés. Nasi campur for $2 beats any $15 smoothie bowl.', category: 'food', upvotes: 276 },
  ],
  barcelona: [
    { text: 'Pickpockets are extremely active on Las Ramblas, in the metro, and at beach. Use a crossbody bag and stay alert.', category: 'safety', upvotes: 634 },
    { text: 'Locals eat dinner at 9-10 PM. If a restaurant is full at 7 PM, it is full of tourists. Wait for the real crowd.', category: 'food', upvotes: 567 },
    { text: 'The T-Casual metro card gives you 10 rides for about 11 euros. Way cheaper than individual tickets.', category: 'transport', upvotes: 489 },
    { text: 'Book Sagrada Familia tickets online weeks in advance. Walk-up is nearly impossible and double the price from resellers.', category: 'planning', upvotes: 456 },
    { text: 'Vermouth (vermut) at 12-2 PM on a terrace is a Barcelona ritual. Order "un vermut" with olives and chips.', category: 'food', upvotes: 412 },
    { text: 'Free tap water is required by law at all restaurants. Ask for "agua del grifo" instead of paying for bottled.', category: 'money', upvotes: 389 },
    { text: 'Sunday morning at Barceloneta beach is when locals play. Weekday mornings for swimming, avoid weekend afternoons.', category: 'planning', upvotes: 345 },
    { text: 'Learn basic Catalan greetings. Barcelona is NOT just Spanish — Catalan identity matters to locals.', category: 'culture', upvotes: 323 },
    { text: 'The rooftop of the Cathedral of Barcelona is 3 euros and has better views than most paid attractions.', category: 'hack', upvotes: 298 },
    { text: 'El Born neighborhood has the best tapas, cocktails, and vibe. Skip Las Ramblas entirely for food and nightlife.', category: 'food', upvotes: 276 },
  ],
  paris: [
    { text: 'Boulangeries with "Artisan Boulanger" on the sign are legally certified. These have the real croissants.', category: 'food', upvotes: 589 },
    { text: 'The Paris Museum Pass pays for itself in 2 days. Covers 60+ museums including Louvre, Orsay, Versailles.', category: 'money', upvotes: 534 },
    { text: 'Say "Bonjour" when entering ANY shop. Not saying hello is considered extremely rude and will affect service.', category: 'culture', upvotes: 512 },
    { text: 'The Louvre takes 3+ hours minimum. Do NOT try to see everything. Pick one wing and enjoy it.', category: 'planning', upvotes: 478 },
    { text: 'Water is free at restaurants — ask for "une carafe d\'eau" (tap water). Never pay for Evian at a café.', category: 'money', upvotes: 445 },
    { text: 'Avoid Montmartre restaurants near Sacré-Coeur (tourist traps). Walk 5 minutes in any direction for real food.', category: 'food', upvotes: 423 },
    { text: 'Navigo Easy card for metro. Load 10 tickets (carnet) for savings. Works on metro, bus, and RER in central Paris.', category: 'transport', upvotes: 398 },
    { text: 'Parisians have café culture: sitting at a table costs more than standing at the bar. Prices are on a sign.', category: 'money', upvotes: 367 },
    { text: 'The Seine at night is free and more romantic than any expensive restaurant. Buy wine at a Nicolas shop nearby.', category: 'hack', upvotes: 345 },
    { text: 'Street crepe stands are a scam near landmarks. Real crêperies are in Montparnasse (Breton quarter). Night and day difference.', category: 'food', upvotes: 312 },
  ],
  'mexico city': [
    { text: 'Uber works perfectly in CDMX and is very cheap. Use it for anything beyond walking distance, especially at night.', category: 'transport', upvotes: 567 },
    { text: 'Street tacos are the best tacos. Look for long lines of locals — that is your quality indicator.', category: 'food', upvotes: 534 },
    { text: 'Altitude is 2,240m (7,350ft). You WILL feel it. Take it easy day one, drink water, avoid alcohol first night.', category: 'health', upvotes: 489 },
    { text: 'Roma Norte and Condesa are the safest, most walkable neighborhoods for tourists. Base yourself here.', category: 'planning', upvotes: 456 },
    { text: 'Never drink tap water. Use bottled even for brushing teeth your first few days until your stomach adjusts.', category: 'health', upvotes: 423 },
    { text: 'Chapultepec Castle has the best view in the city and costs 85 pesos ($5). Free on Sundays for Mexican nationals.', category: 'hack', upvotes: 389 },
    { text: 'Learn "la cuenta, por favor" (check please) and "sin picante" (no spice) — you will use both constantly.', category: 'culture', upvotes: 367 },
    { text: 'Mezcal bars in Roma Norte have free tastings. Pare de Sufrir and Baltra are legendary.', category: 'food', upvotes: 345 },
    { text: 'The pink taxis are safe and licensed. Avoid unmarked cars. Better yet, use Uber or DiDi.', category: 'safety', upvotes: 312 },
    { text: 'Sunday in Coyoacán is magic. Markets, street performers, families. This is real CDMX culture.', category: 'culture', upvotes: 289 },
  ],
  bangkok: [
    { text: 'BTS Skytrain and MRT are airconditioned and fast. Use them instead of taxis during rush hour (traffic is brutal).', category: 'transport', upvotes: 545 },
    { text: 'Street food is safe if the stall has high turnover. Long line = fresh food = safe food.', category: 'food', upvotes: 512 },
    { text: 'Never disrespect the King or the monarchy. This is a serious criminal offense in Thailand.', category: 'culture', upvotes: 489 },
    { text: 'Tuk-tuks that approach YOU are scams. They will take you to gem shops and suit stores for commission.', category: 'safety', upvotes: 467 },
    { text: 'Wat Pho has the best Thai massage school. 260 baht ($7) for a 30-minute massage. Skip the tourist spas.', category: 'hack', upvotes: 423 },
    { text: 'Chatuchak Weekend Market has 15,000+ stalls. Go Saturday morning for best selection, least heat.', category: 'shopping', upvotes: 398 },
    { text: '7-Eleven has surprisingly amazing food. Toasties, onigiri, and Thai milk tea for under $2.', category: 'food', upvotes: 367 },
    { text: 'Dress modestly for temples: cover shoulders and knees. They rent sarongs but it is easier to bring your own.', category: 'culture', upvotes: 345 },
    { text: 'Grab (ride-hailing) is your best friend. Fixed prices, no haggling, AC. Use it for everything.', category: 'transport', upvotes: 323 },
    { text: 'Khao San Road is a tourist bubble. Locals go to Soi Rambuttri (next street over) for similar vibes, less chaos.', category: 'hack', upvotes: 298 },
  ],
  lisbon: [
    { text: 'Pastel de nata at Manteigaria, not Pastéis de Belém. Shorter line, arguably better pastéis.', category: 'food', upvotes: 478 },
    { text: 'Tram 28 is a pickpocket hotspot. Walk the route instead — it is beautiful and you see more.', category: 'safety', upvotes: 445 },
    { text: 'LX Factory is a creative hub with the best brunch, bookshops, and weekend market. Go Saturday afternoon.', category: 'shopping', upvotes: 412 },
    { text: 'Portuguese people appreciate "obrigado/obrigada" (thank you, m/f). Basic Portuguese gets better service everywhere.', category: 'culture', upvotes: 389 },
    { text: 'Wine is incredibly cheap. A great bottle is 5-8 euros at a shop. Order the house wine at restaurants.', category: 'money', upvotes: 367 },
    { text: 'Alfama is best explored getting lost on purpose. Put your phone away and wander the medieval streets.', category: 'hack', upvotes: 345 },
    { text: 'Time Out Market is good but overpriced. Cross the river to Almada for the same food at local prices.', category: 'money', upvotes: 323 },
    { text: 'Miradouros (viewpoints) are free and have the best views. Miradouro da Graça at sunset with wine.', category: 'hack', upvotes: 298 },
    { text: 'Uber works perfectly and is very affordable. Better than trying to find parking or navigate narrow streets.', category: 'transport', upvotes: 276 },
    { text: 'Ginjinha (sour cherry liqueur) shots are 1 euro at stands in Rossio. One is enough — it is very sweet.', category: 'food', upvotes: 254 },
  ],
};

// Default tips for destinations without specific data
const DEFAULT_TIPS: LocalTip[] = [
  { text: 'Visit the local market on the first morning. It tells you everything about the culture in one place.', category: 'food', upvotes: 234 },
  { text: 'Learn "hello", "thank you", and "how much" in the local language. It transforms interactions.', category: 'culture', upvotes: 212 },
  { text: 'The best restaurant is the one with the most locals, not the best TripAdvisor score.', category: 'food', upvotes: 198 },
  { text: 'Carry cash in local currency. Not everywhere accepts cards, especially the best local spots.', category: 'money', upvotes: 178 },
  { text: 'Walk the neighborhood surrounding your accommodation before looking at Google Maps. You will find hidden spots.', category: 'hack', upvotes: 156 },
];

// ---------------------------------------------------------------------------
// Seasonal intelligence — March 2026
// ---------------------------------------------------------------------------

const SEASONAL_EVENTS: SeasonalEvent[] = [
  { destination: 'Tokyo', event: 'Cherry Blossom Peak', description: 'Sakura season hits peak bloom in late March. Ueno Park and Meguro River are the top spots. Book 2+ months ahead — hotels sell out.', month: 3, Icon: Flower2 },
  { destination: 'Amsterdam', event: 'Tulip Season Starting', description: 'Keukenhof Gardens open mid-March through mid-May. 7 million tulips in bloom. Book skip-the-line tickets online.', month: 3, Icon: Flower2 },
  { destination: 'Iceland', event: 'Northern Lights Last Chance', description: 'March is the last reliable month for aurora borealis. Dark enough at night but warm enough to survive outside.', month: 3, Icon: Star },
  { destination: 'Patagonia', event: 'Hiking Season Peak', description: 'Late March is autumn in Patagonia — golden landscapes, fewer crowds than January. Torres del Paine permits still available.', month: 3, Icon: Mountain },
  { destination: 'India', event: 'Holi Festival', description: 'The festival of colors. Usually late March. Jaipur and Mathura have the best celebrations. Wear white clothes you do not mind losing.', month: 3, Icon: Star },
  { destination: 'Mexico City', event: 'Spring Equinox at Teotihuacán', description: 'Thousands gather at the Pyramid of the Sun to absorb spring energy. Wear white. Go early to beat crowds.', month: 3, Icon: Sun },
  { destination: 'Barcelona', event: 'Pre-Season Sweet Spot', description: 'March is Barcelona before the summer crowds. 15-18C, sunny, beaches empty, restaurants not packed. Perfect timing.', month: 3, Icon: Sun },
  { destination: 'Marrakech', event: 'Perfect Weather Window', description: 'March is ideal in Morocco. 20-25C, no summer heat (40C+), flowers blooming in the Atlas Mountains.', month: 3, Icon: Flower2 },
  { destination: 'New Zealand', event: 'Autumn Colors Begin', description: 'Late March: golden trees around Queenstown and Arrowtown. Wine harvest season in Marlborough. Fewer tourists than summer.', month: 3, Icon: TreePine },
  { destination: 'Bali', event: 'Nyepi (Day of Silence)', description: 'Bali\'s New Year: the entire island shuts down for 24 hours. No lights, no noise, no travel. Book around it or experience the quiet.', month: 3, Icon: Star },
];

// ---------------------------------------------------------------------------
// Category chip colors
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  food: COLORS.gold,
  shopping: COLORS.coral,
  hack: COLORS.sage,
  transport: COLORS.cream,
  culture: COLORS.gold,
  money: COLORS.sage,
  safety: COLORS.coral,
  health: COLORS.coral,
  tech: COLORS.cream,
  planning: COLORS.sage,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TimeRecCard({ rec }: { rec: TimeRec }) {
  return (
    <View style={styles.timeRecCard}>
      <View style={[styles.timeRecIcon, { backgroundColor: rec.color + '15' }]}>
        <rec.Icon size={16} color={rec.color} strokeWidth={2} />
      </View>
      <View style={styles.timeRecContent}>
        <View style={styles.timeRecHeader}>
          <Text style={styles.timeRecLabel}>{rec.label}</Text>
          <Text style={[styles.timeRecSlot, { color: rec.color }]}>{rec.timeSlot}</Text>
        </View>
        <Text style={styles.timeRecDesc}>{rec.description}</Text>
      </View>
    </View>
  );
}

function TipCard({ tip, index }: { tip: LocalTip; index: number }) {
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <View style={[styles.tipCategoryBadge, { backgroundColor: (CATEGORY_COLORS[tip.category] ?? COLORS.sage) + '15' }]}>
          <Text style={[styles.tipCategoryText, { color: CATEGORY_COLORS[tip.category] ?? COLORS.sage }]}>
            {tip.category}
          </Text>
        </View>
        <View style={styles.tipUpvoteRow}>
          <ThumbsUp size={12} color={COLORS.creamMuted} strokeWidth={2} />
          <Text style={styles.tipUpvoteText}>{tip.upvotes}</Text>
        </View>
      </View>
      <Text style={styles.tipText}>{tip.text}</Text>
    </View>
  );
}

function SeasonalCard({ event }: { event: SeasonalEvent }) {
  return (
    <View style={styles.seasonalCard}>
      <View style={styles.seasonalHeader}>
        <event.Icon size={18} color={COLORS.gold} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={styles.seasonalDest}>{event.destination}</Text>
          <Text style={styles.seasonalEvent}>{event.event}</Text>
        </View>
      </View>
      <Text style={styles.seasonalDesc}>{event.description}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const [selectedDest, setSelectedDest] = useState('');
  const [activeSection, setActiveSection] = useState<'now' | 'tips' | 'seasonal'>('now');

  useEffect(() => {
    track({ type: 'screen_view', screen: 'pulse' });
  }, []);

  // Auto-set destination from latest trip
  useEffect(() => {
    if (!selectedDest && trips.length > 0) {
      setSelectedDest(trips[0].destination);
    }
  }, [selectedDest, trips]);

  const timeSlot = useMemo(() => getCurrentTimeSlot(), []);
  const destKey = useMemo(() => selectedDest.toLowerCase().trim(), [selectedDest]);

  const timeRecs = useMemo(() => {
    return TIME_RECS[destKey]?.[timeSlot] ?? [];
  }, [destKey, timeSlot]);

  const localTips = useMemo(() => {
    return LOCAL_TIPS[destKey] ?? DEFAULT_TIPS;
  }, [destKey]);

  const savedDests = useMemo(
    () => [...new Set(trips.map((t) => t.destination))],
    [trips],
  );

  const allDests = useMemo(
    () => Object.keys(TIME_RECS),
    [],
  );

  const timeLabel = useMemo(() => {
    const labels: Record<string, string> = {
      morning: 'This morning',
      midday: 'Right now',
      afternoon: 'This afternoon',
      evening: 'Tonight',
      night: 'Late night',
    };
    return labels[timeSlot] ?? 'Right now';
  }, [timeSlot]);

  const TimeIcon = useMemo(() => {
    const icons: Record<string, typeof Coffee> = {
      morning: Coffee,
      midday: Sun,
      afternoon: Sunset,
      evening: Moon,
      night: Moon,
    };
    return icons[timeSlot] ?? Clock;
  }, [timeSlot]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Radio size={22} color={COLORS.coral} strokeWidth={2} />
        <Text style={styles.headerTitle}>Pulse</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Destination selector */}
        <View style={styles.destSection}>
          <Text style={styles.destLabel}>Destination</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.destChipRow}
          >
            {savedDests.length > 0 &&
              savedDests.map((dest) => {
                const active = dest.toLowerCase() === destKey;
                return (
                  <Pressable
                    key={dest}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedDest(dest);
                    }}
                    style={[styles.destChip, active && styles.destChipActive]}
                  >
                    <Text style={[styles.destChipText, active && styles.destChipTextActive]}>
                      {dest}
                    </Text>
                  </Pressable>
                );
              })}
            {allDests
              .filter((d) => !savedDests.map((s) => s.toLowerCase()).includes(d))
              .map((dest) => {
                const active = dest === destKey;
                const label = dest.charAt(0).toUpperCase() + dest.slice(1);
                return (
                  <Pressable
                    key={dest}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedDest(label);
                    }}
                    style={[styles.destChip, active && styles.destChipActive]}
                  >
                    <Text style={[styles.destChipText, active && styles.destChipTextActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>
        </View>

        {/* Section tabs */}
        <View style={styles.sectionTabRow}>
          {(['now', 'tips', 'seasonal'] as const).map((section) => {
            const active = section === activeSection;
            const labels: Record<string, string> = { now: 'Right Now', tips: 'Local Tips', seasonal: 'This Month' };
            return (
              <Pressable
                key={section}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveSection(section);
                }}
                style={[styles.sectionTab, active && styles.sectionTabActive]}
              >
                <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>
                  {labels[section]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Section: Right Now */}
        {activeSection === 'now' && (
          <View style={styles.sectionContent}>
            <View style={styles.timeHeader}>
              <TimeIcon size={18} color={COLORS.gold} strokeWidth={2} />
              <Text style={styles.timeLabel}>{timeLabel} in {selectedDest || 'your destination'}</Text>
            </View>

            {timeRecs.length > 0 ? (
              timeRecs.map((rec, i) => <TimeRecCard key={i} rec={rec} />)
            ) : (
              <View style={styles.emptySection}>
                <Clock size={28} color={COLORS.creamDim} strokeWidth={1.5} />
                <Text style={styles.emptyText}>
                  {selectedDest
                    ? `We're building real-time recommendations for ${selectedDest}. Check back soon.`
                    : 'Select a destination to see what\'s happening right now.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Section: Local Tips */}
        {activeSection === 'tips' && (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>
              The things you did not know about {selectedDest || 'traveling'}
            </Text>
            {localTips.map((tip, i) => (
              <TipCard key={i} tip={tip} index={i} />
            ))}
          </View>
        )}

        {/* Section: This Month */}
        {activeSection === 'seasonal' && (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>What is happening this month</Text>
            <Text style={styles.sectionSub}>
              Seasonal events, natural phenomena, and why certain destinations are special right now.
            </Text>
            {SEASONAL_EVENTS.map((event, i) => (
              <SeasonalCard key={i} event={event} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  } as ViewStyle,

  // Destination selector
  destSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  destLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  destChipRow: {
    gap: SPACING.xs,
  } as ViewStyle,
  destChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  destChipActive: {
    backgroundColor: COLORS.coral + '20',
    borderColor: COLORS.coral,
  } as ViewStyle,
  destChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  destChipTextActive: {
    color: COLORS.coral,
  } as TextStyle,

  // Section tabs
  sectionTabRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  sectionTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  sectionTabActive: {
    backgroundColor: COLORS.coral + '15',
    borderColor: COLORS.coral + '40',
  } as ViewStyle,
  sectionTabText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  sectionTabTextActive: {
    color: COLORS.coral,
  } as TextStyle,

  // Section content
  sectionContent: {
    gap: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,

  // Time header
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  timeLabel: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,

  // Time rec card
  timeRecCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  timeRecIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  timeRecContent: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  timeRecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  timeRecLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  timeRecSlot: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  } as TextStyle,
  timeRecDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,

  // Tip card
  tipCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  tipCategoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  tipCategoryText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  tipUpvoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  tipUpvoteText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 19,
  } as TextStyle,

  // Seasonal card
  seasonalCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  seasonalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  seasonalDest: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  seasonalEvent: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  seasonalDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,

  // Empty state
  emptySection: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  } as TextStyle,
});
