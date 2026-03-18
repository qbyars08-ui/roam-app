// =============================================================================
// ROAM — Pulse Tab (Clean Spatial Layout)
// Time-aware recommendations, hyper-local tips, and seasonal intelligence.
// Full visual reset — editorial, photo-driven, no filled card backgrounds.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Radio, Clock, MapPin, ChevronRight, Users, GitCompare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';
import { getDestinationPhoto } from '../../lib/photos';
import { getTimezoneByDestination } from '../../lib/timezone';
import LiveFeedTicker from '../../components/features/LiveFeedTicker';
import SocialProofBanner from '../../components/features/SocialProofBanner';
import GoNowFeed from '../../components/features/GoNowFeed';
import WanderlustFeed from '../../components/features/WanderlustFeed';
import { useSonarQuery } from '../../lib/sonar';
import LiveBadge from '../../components/ui/LiveBadge';
import SourceCitation from '../../components/ui/SourceCitation';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import { searchEvents, type EventResult } from '../../lib/apis/eventbrite';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { searchActivities, type GYGActivity } from '../../lib/apis/getyourguide';
import { searchPlaces, getPlaceTips, type FSQPlace, type FSQTip } from '../../lib/apis/foursquare';
import { getDestinationCoords, getAirQuality, type AirQuality } from '../../lib/air-quality';
import { getSunTimes, type SunTimes } from '../../lib/sun-times';
import { getGoldenHour, type GoldenHourData } from '../../lib/golden-hour';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeRec {
  timeSlot: string;
  label: string;
  description: string;
  photo: string;
  timeContext: string;
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
  heroPhoto: string;
  dateRange: string;
}

// ---------------------------------------------------------------------------
// Index-based height variation (avoids uniform AI-generated look)
// ---------------------------------------------------------------------------

const DEST_CARD_HEIGHTS = [140, 155, 130, 160, 145, 135, 150];
const EDITORIAL_CARD_HEIGHTS = [200, 220, 185, 210, 195, 180, 215];
const SEASONAL_SMALL_HEIGHTS = [120, 135, 115, 140, 125, 110, 130];

const getDestCardHeight = (index: number) =>
  DEST_CARD_HEIGHTS[index % DEST_CARD_HEIGHTS.length];
const getEditorialCardHeight = (index: number) =>
  EDITORIAL_CARD_HEIGHTS[index % EDITORIAL_CARD_HEIGHTS.length];
const getSeasonalSmallHeight = (index: number) =>
  SEASONAL_SMALL_HEIGHTS[index % SEASONAL_SMALL_HEIGHTS.length];

// ---------------------------------------------------------------------------
// Destination photo cards config
// ---------------------------------------------------------------------------

const PULSE_DESTINATIONS = [
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
        description: 'Go before 10am. Locals shop early. Fresh fruit juice and jamón ibérico for breakfast.',
        photo: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
        timeContext: 'Best before 10 AM',
      },
      {
        timeSlot: '9–11 AM',
        label: 'Park Güell',
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
        label: 'Sacré-Coeur Steps',
        description: "Golden hour from Montmartre. Bring wine (yes, it's legal). Best sunset spot.",
        photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '7–9 PM',
        label: 'Apéro on Seine',
        description: 'Buy wine and cheese from Nicolas, sit on the banks. Pure Paris.',
        photo: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
        timeContext: 'Until midnight',
      },
    ],
    night: [
      {
        timeSlot: '10 PM+',
        label: 'Oberkampf Bar Crawl',
        description: 'Start at Café Charbon, let the night unfold. Paris after midnight is magic.',
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
        label: 'Roma Norte Café Hop',
        description: 'Best specialty coffee in Latin America. Buna, Quentin, Blend Station.',
        photo: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=80',
        timeContext: 'Best 1–4 PM',
      },
    ],
    afternoon: [
      {
        timeSlot: '4–6 PM',
        label: 'Terraza Catedral',
        description: 'Mezcal sunset overlooking the Zócalo. Best rooftop view in the city.',
        photo: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
        timeContext: 'Golden hour',
      },
    ],
    evening: [
      {
        timeSlot: '7–9 PM',
        label: 'Tacos Al Pastor',
        description: 'El Huequito or Taquería Orinoco. The al pastor here is what taco dreams are made of.',
        photo: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=80',
        timeContext: 'Until midnight',
      },
    ],
    night: [
      {
        timeSlot: '10 PM+',
        label: 'Condesa Bar Scene',
        description: 'Start at Baltra Bar for cocktails, end at Salón Los Ángeles for salsa dancing.',
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
        description: 'Shorter line than Pastéis de Belém, arguably better. Order two. Eat them warm.',
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
        label: 'Miradouro da Graça',
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

const LOCAL_TIPS: Record<string, LocalTip[]> = {
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
    { text: 'Do NOT drink tap water or use it to brush teeth. Bali belly is real and will ruin 2–3 days of your trip.', category: 'health', upvotes: 334 },
    { text: 'The real Balinese food is at warungs (small local restaurants), not the Instagram cafés. Nasi campur for $2 beats any $15 smoothie bowl.', category: 'food', upvotes: 276 },
  ],
  barcelona: [
    { text: 'Pickpockets are extremely active on Las Ramblas, in the metro, and at the beach. Use a crossbody bag and stay alert.', category: 'safety', upvotes: 634 },
    { text: 'Locals eat dinner at 9–10 PM. If a restaurant is full at 7 PM, it is full of tourists. Wait for the real crowd.', category: 'food', upvotes: 567 },
    { text: 'Book Sagrada Familia tickets online weeks in advance. Walk-up is nearly impossible and double the price from resellers.', category: 'planning', upvotes: 456 },
    { text: 'Vermouth at 12–2 PM on a terrace is a Barcelona ritual. Order "un vermut" with olives and chips.', category: 'food', upvotes: 412 },
    { text: 'El Born neighborhood has the best tapas, cocktails, and vibe. Skip Las Ramblas entirely for food.', category: 'food', upvotes: 276 },
  ],
  paris: [
    { text: 'Boulangeries with "Artisan Boulanger" on the sign are legally certified. These have the real croissants.', category: 'food', upvotes: 589 },
    { text: 'Say "Bonjour" when entering ANY shop. Not saying hello is considered extremely rude and will affect service.', category: 'culture', upvotes: 512 },
    { text: 'The Louvre takes 3+ hours minimum. Do NOT try to see everything. Pick one wing and enjoy it.', category: 'planning', upvotes: 478 },
    { text: 'Water is free at restaurants — ask for "une carafe d\'eau" (tap water). Never pay for Evian at a café.', category: 'money', upvotes: 445 },
    { text: 'The Seine at night is free and more romantic than any expensive restaurant. Buy wine at a Nicolas shop.', category: 'hack', upvotes: 345 },
  ],
  'mexico city': [
    { text: 'Uber works perfectly in CDMX and is very cheap. Use it for anything beyond walking distance, especially at night.', category: 'transport', upvotes: 567 },
    { text: 'Street tacos are the best tacos. Look for long lines of locals — that is your quality indicator.', category: 'food', upvotes: 534 },
    { text: 'Altitude is 2,240m (7,350ft). You WILL feel it. Take it easy day one, drink water, avoid alcohol first night.', category: 'health', upvotes: 489 },
    { text: 'Roma Norte and Condesa are the safest, most walkable neighborhoods for tourists. Base yourself here.', category: 'planning', upvotes: 456 },
    { text: 'Sunday in Coyoacán is magic. Markets, street performers, families. This is real CDMX culture.', category: 'culture', upvotes: 289 },
  ],
  bangkok: [
    { text: 'BTS Skytrain and MRT are airconditioned and fast. Use them instead of taxis during rush hour (traffic is brutal).', category: 'transport', upvotes: 545 },
    { text: 'Tuk-tuks that approach YOU are scams. They will take you to gem shops and suit stores for commission.', category: 'safety', upvotes: 467 },
    { text: 'Wat Pho has the best Thai massage school. 260 baht ($7) for a 30-minute massage. Skip the tourist spas.', category: 'hack', upvotes: 423 },
    { text: '7-Eleven has surprisingly amazing food. Toasties, onigiri, and Thai milk tea for under $2.', category: 'food', upvotes: 367 },
    { text: 'Khao San Road is a tourist bubble. Locals go to Soi Rambuttri (next street over) for similar vibes, less chaos.', category: 'hack', upvotes: 298 },
  ],
  lisbon: [
    { text: 'Pastel de nata at Manteigaria, not Pastéis de Belém. Shorter line, arguably better pastéis.', category: 'food', upvotes: 478 },
    { text: 'Tram 28 is a pickpocket hotspot. Walk the route instead — it is beautiful and you see more.', category: 'safety', upvotes: 445 },
    { text: 'Portuguese people appreciate "obrigado/obrigada" (thank you, m/f). Basic Portuguese gets better service everywhere.', category: 'culture', upvotes: 389 },
    { text: 'Wine is incredibly cheap. A great bottle is 5–8 euros at a shop. Order the house wine at restaurants.', category: 'money', upvotes: 367 },
    { text: 'Alfama is best explored by getting lost on purpose. Put your phone away and wander the medieval streets.', category: 'hack', upvotes: 345 },
  ],
};

const DEFAULT_TIPS: LocalTip[] = [
  { text: 'Visit the local market on the first morning. It tells you everything about the culture in one place.', category: 'food', upvotes: 234 },
  { text: 'Learn "hello", "thank you", and "how much" in the local language. It transforms interactions.', category: 'culture', upvotes: 212 },
  { text: 'The best restaurant is the one with the most locals, not the best TripAdvisor score.', category: 'food', upvotes: 198 },
  { text: 'Carry cash in local currency. Not everywhere accepts cards, especially the best local spots.', category: 'money', upvotes: 178 },
  { text: 'Walk the neighborhood surrounding your accommodation before looking at Google Maps. You will find hidden spots.', category: 'hack', upvotes: 156 },
];

// ---------------------------------------------------------------------------
// Seasonal events — March 2026
// ---------------------------------------------------------------------------

const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    destination: 'Tokyo',
    event: 'Cherry Blossom Peak',
    description: 'Sakura season hits peak bloom in late March. Ueno Park and Meguro River are the top spots. Book 2+ months ahead — hotels sell out.',
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
    dateRange: 'Late March · 2 weeks',
  },
  {
    destination: 'Bali',
    event: 'Nyepi — Day of Silence',
    description: "Bali's New Year: the entire island shuts down for 24 hours. No lights, no noise, no travel. Book around it or experience the quiet.",
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    dateRange: 'March 28–29',
  },
  {
    destination: 'Mexico City',
    event: 'Spring Equinox at Teotihuacán',
    description: 'Thousands gather at the Pyramid of the Sun to absorb spring energy. Wear white. Go early to beat crowds.',
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
    dateRange: 'March 20–21',
  },
  {
    destination: 'Barcelona',
    event: 'Pre-Season Sweet Spot',
    description: 'March is Barcelona before the summer crowds. 15–18°C, sunny, beaches empty, restaurants not packed. Perfect timing.',
    month: 3,
    heroPhoto: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
    dateRange: 'All of March',
  },
];

const SEASONAL_SMALL_EVENTS = [
  {
    name: 'Sakura Train Views',
    dest: 'Tokyo',
    date: 'Mar 25–Apr 5',
    photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  },
  {
    name: 'Marrakech Perfect Weather',
    dest: 'Marrakech',
    date: 'Mar–Apr',
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

function getLocalTimeString(destKey: string): string {
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Animated pulsing live indicator dot
function PulseDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={{ width: SPACING.lg, height: SPACING.lg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity: pulse }}>
        <Radio size={20} color={COLORS.coral} strokeWidth={1.5} />
      </Animated.View>
    </View>
  );
}

function DestinationCard({
  dest,
  active,
  onPress,
  index,
}: {
  dest: typeof PULSE_DESTINATIONS[0];
  active: boolean;
  onPress: () => void;
  index: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => {
          onPress();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/destination/[name]', params: { name: dest.label } } as never);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={t('pulse.selectDestination', { defaultValue: `Select ${dest.label}`, destination: dest.label })}
        accessibilityRole="button"
        style={[styles.destCard, { height: getDestCardHeight(index) }, active && styles.destCardActive]}
      >
        <Image
          source={{ uri: dest.photo }}
          style={styles.destCardImage as ImageStyle}
          contentFit="cover"
          transition={200}
          accessibilityLabel={t('pulse.destinationPhoto', { defaultValue: `${dest.label} destination photo`, destination: dest.label })}
        />
        <LinearGradient
          colors={['transparent', COLORS.overlay]}
          style={styles.destCardGradient}
        />
        <Text style={[styles.destCardLabel, active && styles.destCardLabelActive]}>
          {dest.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function EditorialCard({ rec, index, destinationLabel }: { rec: TimeRec; index: number; destinationLabel: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: destinationLabel } } as never);
      }}
      accessibilityLabel={t('pulse.editorialCardLabel', { defaultValue: `${rec.label} — ${rec.timeSlot}`, label: rec.label, timeSlot: rec.timeSlot })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.editorialCard, { height: getEditorialCardHeight(index), opacity: pressed ? 0.9 : 1 }]}
    >
      <Image
        source={{ uri: rec.photo }}
        style={styles.editorialCardPhoto as ImageStyle}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        style={styles.editorialCardGradient}
      />
      <View style={styles.editorialCardBottom}>
        <View style={styles.editorialCardTextBlock}>
          <Text style={styles.editorialCardTitle}>{rec.label}</Text>
          <Text style={styles.editorialCardDesc}>{rec.description}</Text>
        </View>
        <View style={styles.timeContextChip}>
          <Text style={styles.timeContextText}>{rec.timeContext}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function LocalTipRow({ tip, destinationLabel }: { tip: LocalTip; destinationLabel: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: destinationLabel } } as never);
      }}
      accessibilityLabel={`Local tip: ${tip.text}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tipRow, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={styles.tipText}>{tip.text}</Text>
      <Text style={styles.tipSource}>{`— Local tip · ${tip.upvotes} agree`}</Text>
    </Pressable>
  );
}

function SeasonalHeroCard({ event }: { event: SeasonalEvent }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: event.destination } } as never);
      }}
      accessibilityLabel={t('pulse.seasonalEventLabel', { defaultValue: `${event.event} in ${event.destination}`, event: event.event, destination: event.destination })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.seasonalHeroCard, { opacity: pressed ? 0.9 : 1 }]}
    >
      <Image
        source={{ uri: event.heroPhoto }}
        style={styles.seasonalHeroPhoto as ImageStyle}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        style={styles.seasonalHeroGradient}
      />
      <View style={styles.seasonalHeroBottom}>
        <View style={{ flex: 1 }}>
          <Text style={styles.seasonalHeroEvent}>{event.event}</Text>
          <Text style={styles.seasonalHeroDate}>{event.dateRange}</Text>
        </View>
        <View style={styles.learnMoreButton}>
          <Text style={styles.seasonalLearnMore}>{t('pulse.readBrief', { defaultValue: 'Read the brief →' })}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SeasonalSmallCard({ item, index }: { item: typeof SEASONAL_SMALL_EVENTS[0]; index: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/destination/[name]', params: { name: item.dest } } as never);
      }}
      accessibilityLabel={t('pulse.seasonalSmallLabel', { defaultValue: `${item.name} — ${item.dest}`, name: item.name, dest: item.dest })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.seasonalSmallCard, { height: getSeasonalSmallHeight(index), opacity: pressed ? 0.9 : 1 }]}
    >
      <Image
        source={{ uri: item.photo }}
        style={styles.seasonalSmallPhoto as ImageStyle}
        contentFit="cover"
        transition={200}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDim]}
        style={styles.seasonalSmallGradient}
      />
      <View style={styles.seasonalSmallBottom}>
        <Text style={styles.seasonalSmallName}>{item.name}</Text>
        <Text style={styles.seasonalSmallDate}>{item.date}</Text>
      </View>
    </Pressable>
  );
}

function LiveEventCard({ event }: { event: EventResult }) {
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    if (event.url) {
      Linking.openURL(event.url).catch(() => {/* best-effort */});
    }
  }, [event.url]);

  const priceLabel = event.isFree
    ? t('pulse.liveEvents.free', { defaultValue: 'Free' })
    : event.price
    ? event.price
    : t('pulse.liveEvents.free', { defaultValue: 'Free' });

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t('pulse.liveEvents.cardLabel', { defaultValue: `View event: ${event.name}`, name: event.name })}
      style={styles.liveEventCard}
    >
      <View style={styles.liveEventCardInner}>
        <View style={styles.liveEventLeft}>
          <Text style={styles.liveEventName} numberOfLines={2}>{event.name}</Text>
          <Text style={styles.liveEventVenue} numberOfLines={1}>{event.venue}</Text>
          <Text style={styles.liveEventDate} numberOfLines={1}>{event.date}</Text>
        </View>
        <View style={styles.liveEventRight}>
          <View style={styles.liveEventPriceChip}>
            <Text style={styles.liveEventPrice}>{priceLabel}</Text>
          </View>
          {event.category ? (
            <Text style={styles.liveEventCategory} numberOfLines={1}>{event.category}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PulseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const [selectedKey, setSelectedKey] = useState<string>(PULSE_DESTINATIONS[0].key);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'pulse' });
  }, []);

  // Auto-set from latest trip if it matches a pulse destination
  useEffect(() => {
    if (trips.length > 0) {
      const tripKey = trips[0].destination.toLowerCase().trim();
      const match = PULSE_DESTINATIONS.find((d) => d.key === tripKey);
      if (match) setSelectedKey(match.key);
    }
  }, [trips]);

  const selectedDest = useMemo(
    () => PULSE_DESTINATIONS.find((d) => d.key === selectedKey) ?? PULSE_DESTINATIONS[0],
    [selectedKey],
  );

  const timeSlot = useMemo(() => getCurrentTimeSlot(), []);

  const timeRecs = useMemo(
    () => TIME_RECS[selectedKey]?.[timeSlot] ?? [],
    [selectedKey, timeSlot],
  );

  const localTips = useMemo(
    () => (LOCAL_TIPS[selectedKey] ?? DEFAULT_TIPS).slice(0, 5),
    [selectedKey],
  );

  // Sonar live intelligence
  const sonarPulse = useSonarQuery(selectedDest.label, 'pulse');
  const sonarLocal = useSonarQuery(selectedDest.label, 'local');

  const localTimeString = useMemo(
    () => getLocalTimeString(selectedKey),
    [selectedKey],
  );

  // Seasonal event for selected destination (if any)
  const heroEvent = useMemo(
    () => SEASONAL_EVENTS.find((e) => e.destination.toLowerCase() === selectedKey),
    [selectedKey],
  );

  // Live Eventbrite events
  const [liveEvents, setLiveEvents] = useState<EventResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLiveEvents(null);
    searchEvents(selectedDest.label).then((results) => {
      if (!cancelled) setLiveEvents(results);
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // TripAdvisor trending attractions
  const [taAttractions, setTaAttractions] = useState<TALocation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTaAttractions(null);
    searchLocations(selectedDest.label, 'attractions').then((results) => {
      if (!cancelled) setTaAttractions(results?.slice(0, 5) ?? null);
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // GetYourGuide experiences
  const [gygActivities, setGygActivities] = useState<GYGActivity[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGygActivities(null);
    searchActivities(selectedDest.label).then((results) => {
      if (!cancelled) setGygActivities(results?.slice(0, 5) ?? null);
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // Foursquare insider tips
  const [fsqTips, setFsqTips] = useState<FSQTip[] | null>(null);

  // Foursquare trending venues (with real photos, tappable to Maps)
  const [fsqPlaces, setFsqPlaces] = useState<FSQPlace[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFsqTips(null);
    const coords = getDestinationCoords(selectedDest.label);
    if (!coords) return;
    searchPlaces(selectedDest.label, coords.lat, coords.lng).then(async (places) => {
      if (cancelled || !places?.length) return;
      const firstId = places[0].fsqId;
      const tips = await getPlaceTips(firstId);
      if (!cancelled) setFsqTips(tips?.slice(0, 4) ?? null);
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  useEffect(() => {
    let cancelled = false;
    setFsqPlaces(null);
    const coords = getDestinationCoords(selectedDest.label);
    if (!coords) return;
    searchPlaces(selectedDest.label, coords.lat, coords.lng, undefined, 5000).then((places) => {
      if (!cancelled && places?.length) setFsqPlaces(places.slice(0, 6));
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // Right-now data row: air quality, sun times, golden hour
  const [rightNowAQ, setRightNowAQ] = useState<AirQuality | null>(null);
  const [rightNowSun, setRightNowSun] = useState<SunTimes | null>(null);
  const [rightNowGolden, setRightNowGolden] = useState<GoldenHourData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRightNowAQ(null);
    setRightNowSun(null);
    setRightNowGolden(null);
    const coords = getDestinationCoords(selectedDest.label);
    if (!coords) return;
    const { lat, lng } = coords;
    getAirQuality(lat, lng).then((aq) => { if (!cancelled) setRightNowAQ(aq); }).catch(() => {});
    getSunTimes(lat, lng).then((st) => { if (!cancelled) setRightNowSun(st); }).catch(() => {});
    getGoldenHour(lat, lng).then((gh) => { if (!cancelled) setRightNowGolden(gh); }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  const handleSelectDest = useCallback((key: string) => {
    Haptics.selectionAsync();
    setSelectedKey(key);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with pulsing live dot */}
      <View style={styles.header}>
        <PulseDot />
        <Text style={styles.headerLabel}>{t('pulse.live', { defaultValue: 'LIVE' })}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Destination Photo Card Selector ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destCardRow}
          style={styles.destCardScroll}
        >
          {PULSE_DESTINATIONS.map((dest, index) => (
            <DestinationCard
              key={dest.key}
              dest={dest}
              active={dest.key === selectedKey}
              onPress={() => handleSelectDest(dest.key)}
              index={index}
            />
          ))}
        </ScrollView>

        {/* ── Compare pill ── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg, alignItems: 'flex-start' }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const dest = PULSE_DESTINATIONS.find((d) => d.key === selectedKey);
              if (dest) {
                router.push(`/compare?left=${encodeURIComponent(dest.label)}` as never);
              } else {
                router.push('/compare' as never);
              }
            }}
            style={({ pressed }) => [
              styles.comparePill,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('pulse.compare', { defaultValue: 'Compare destinations' })}
          >
            <GitCompare size={14} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.comparePillText}>
              {t('pulse.compare', { defaultValue: 'Compare' })}
            </Text>
          </Pressable>
        </View>

        {/* ── Live Feed Ticker ── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <LiveFeedTicker />
        </View>

        {/* ── Social Proof Banner (active trip) ── */}
        {trips.length > 0 && (
          <SocialProofBanner destination={trips[0].destination} />
        )}

        {/* ── I Am Here Now — flagship "open at 2AM" button ── */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/i-am-here-now' as never);
              }}
              style={({ pressed }) => [
                styles.hereNowBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityLabel={t('pulse.iAmHereNow', { defaultValue: 'I Am Here Now' })}
              accessibilityRole="button"
            >
              <MapPin size={20} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.hereNowBtnText}>{t('pulse.iAmHereNow', { defaultValue: 'I Am Here Now' })}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Check In — find other travelers in destination ── */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/nearby-travelers' as never);
              }}
              style={({ pressed }) => [
                styles.checkInFloatBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityLabel={t('pulse.checkIn', { defaultValue: 'Check in' })}
              accessibilityRole="button"
            >
              <Users size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.checkInFloatBtnText}>
                {t('pulse.checkIn', { defaultValue: 'Check in' })}
              </Text>
              <Text style={styles.checkInFloatBtnSub}>
                {t('pulse.checkInSub', { defaultValue: 'Meet travelers nearby' })}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── No-trip CTA — shown when user has no planned trips ── */}
        {trips.length === 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/plan' as never);
              }}
              style={({ pressed }) => [
                styles.noTripCtaCard,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityLabel={t('pulse.noTripCta', { defaultValue: 'Plan a trip to unlock live features' })}
              accessibilityRole="button"
            >
              <MapPin size={20} color={COLORS.sage} strokeWidth={1.5} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.noTripCtaText}>
                  {t('pulse.noTripCta', { defaultValue: 'Plan a trip to unlock live features' })}
                </Text>
                <Text style={styles.noTripCtaSub}>
                  {t('pulse.noTripCtaSub', { defaultValue: 'Check in, meet travelers, and go live when you arrive' })}
                </Text>
              </View>
              <ChevronRight size={18} color={COLORS.muted} strokeWidth={1.5} />
            </Pressable>
          </View>
        )}

        {/* ── Right Now Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never);
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.xs }]}
            >
              <Text style={styles.sectionHeading}>
                {t('pulse.rightNowIn', { defaultValue: 'Right now in' })}{'\n'}{selectedDest.label}
              </Text>
              <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} style={{ marginBottom: 4 }} />
            </Pressable>
            {(sonarPulse.data?.isLive ?? sonarPulse.isLive) && <LiveBadge />}
          </View>
          {localTimeString ? (
            <Text style={styles.sectionSubMono}>{localTimeString}</Text>
          ) : null}

          {/* ── Right now data pills ── */}
          {(rightNowAQ || rightNowSun || rightNowGolden) ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: SPACING.md }}
              contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.xs }}
            >
              {rightNowAQ && (
                <View style={[styles.rightNowPill, rightNowAQ.aqi > 100 && styles.rightNowPillAlert]}>
                  <Text style={[styles.rightNowPillText, rightNowAQ.aqi > 100 && { color: COLORS.coral }]}>
                    {t('pulse.airQuality', { defaultValue: 'Air' })} {rightNowAQ.label}
                  </Text>
                </View>
              )}
              {rightNowSun && (
                <>
                  <View style={styles.rightNowPill}>
                    <Text style={styles.rightNowPillText}>
                      {t('pulse.sunrise', { defaultValue: '☀ Rise' })} {rightNowSun.sunrise}
                    </Text>
                  </View>
                  <View style={styles.rightNowPill}>
                    <Text style={styles.rightNowPillText}>
                      {t('pulse.sunset', { defaultValue: '🌇 Set' })} {rightNowSun.sunset}
                    </Text>
                  </View>
                </>
              )}
              {rightNowGolden && (
                <View style={styles.rightNowPill}>
                  <Text style={styles.rightNowPillText}>
                    {t('pulse.goldenHour', { defaultValue: '📸' })} {rightNowGolden.eveningGoldenStart}
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : null}

          {/* Skeleton while Sonar loading (not on error/timeout) */}
          {(sonarPulse.isLoading && !sonarPulse.error) ? (
            <View style={styles.sonarSkeletonStack}>
              <View style={styles.sonarCard}>
                <SkeletonCard width="100%" height={16} borderRadius={RADIUS.sm} style={{ marginBottom: SPACING.sm }} />
                <SkeletonCard width="100%" height={60} borderRadius={RADIUS.sm} style={{ marginBottom: SPACING.sm }} />
                <SkeletonCard width={80} height={12} borderRadius={RADIUS.sm} />
              </View>
            </View>
          ) : null}

          {/* Live Sonar intel card: title, description, source chip, Live badge */}
          {sonarPulse.data && !sonarPulse.isLoading ? (
            <View style={styles.sonarCard}>
              <View style={styles.sonarCardTitleRow}>
                <Text style={styles.sonarCardTitle}>{t('pulse.rightNow', { defaultValue: 'Right now' })}</Text>
                {(sonarPulse.data.isLive ?? sonarPulse.isLive) && <LiveBadge />}
              </View>
              <Text style={styles.sonarAnswer}>{sonarPulse.data.answer}</Text>
              {sonarPulse.citations.length > 0 ? (
                <View style={{ marginTop: SPACING.sm }}>
                  <SourceCitation citations={sonarPulse.citations} />
                </View>
              ) : null}
              {sonarPulse.data.timestamp ? (
                <Text style={styles.sonarTimestamp}>
                  {t('sonar.updated', { defaultValue: 'Updated' })}{' '}
                  {new Date(sonarPulse.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Hardcoded time recs (always shown as fallback/supplement) */}
          {timeRecs.length > 0 ? (
            <View style={styles.editorialStack}>
              {timeRecs.map((rec, i) => (
                <EditorialCard key={i} rec={rec} index={i} destinationLabel={selectedDest.label} />
              ))}
            </View>
          ) : !sonarPulse.data && !sonarPulse.isLoading ? (
            <View style={styles.emptyState}>
              <Clock size={24} color={COLORS.creamDim} strokeWidth={1.5} />
              <Text style={styles.emptyText}>
                {t('pulse.emptyState', { defaultValue: `Nothing live for ${selectedDest.label} right now. Pick a destination above.`, destination: selectedDest.label })}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── What Locals Know Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.tipsLabel}>{t('pulse.localsOnly', { defaultValue: 'LOCALS ONLY' })}</Text>
              <Text style={styles.sectionHeading}>{t('pulse.whatTheyWontTellYou', { defaultValue: "What they won't tell you" })}</Text>
            </View>
            {sonarLocal.isLive && <LiveBadge />}
          </View>

          {/* Live Sonar local intel */}
          {sonarLocal.data ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never);
              }}
              style={({ pressed }) => [styles.sonarCard, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.sonarAnswer}>{sonarLocal.data.answer}</Text>
              {sonarLocal.citations.length > 0 && (
                <View style={{ marginTop: SPACING.sm }}>
                  <SourceCitation citations={sonarLocal.citations} />
                </View>
              )}
            </Pressable>
          ) : null}

          {/* Hardcoded tips (always shown) */}
          <View style={styles.tipsStack}>
            {localTips.map((tip, i) => (
              <LocalTipRow key={i} tip={tip} destinationLabel={selectedDest.label} />
            ))}
          </View>
        </View>

        {/* ── Go Now Flight Deals ── */}
        <GoNowFeed />

        {/* ── Wanderlust — aspirational destination moments ── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
          <WanderlustFeed />
        </View>

        {/* ── This Month Section ── */}
        <View style={styles.section}>
          <Text style={styles.seasonLabel}>{t('pulse.thisMonth', { defaultValue: 'THIS MONTH' })}</Text>
          <Text style={styles.sectionHeading}>{t('pulse.worthGoingNow', { defaultValue: 'Worth going now' })}</Text>

          {heroEvent ? <SeasonalHeroCard event={heroEvent} /> : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.seasonalSmallRow}
            style={styles.seasonalSmallScroll}
          >
            {SEASONAL_SMALL_EVENTS.map((item, i) => (
              <SeasonalSmallCard key={i} item={item} index={i} />
            ))}
          </ScrollView>
        </View>

        {/* ── Live Events Section (Eventbrite) ── */}
        {liveEvents && liveEvents.length > 0 ? (
          <View style={[styles.section, styles.sectionLast]}>
            <Text style={styles.liveEventsLabel}>
              {t('pulse.liveEvents.label', { defaultValue: 'LIVE EVENTS' })}
            </Text>
            <Text style={styles.sectionHeading}>
              {t('pulse.liveEvents.heading', { defaultValue: `Happening in ${selectedDest.label}`, destination: selectedDest.label })}
            </Text>
            <View style={styles.liveEventsStack}>
              {liveEvents.map((evt) => (
                <LiveEventCard key={evt.id} event={evt} />
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Foursquare trending venues (real photos, tappable to Maps) ── */}
        {fsqPlaces && fsqPlaces.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.trendingVenues.label', { defaultValue: 'TRENDING VENUES' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.trendingVenues.heading', { defaultValue: `Popular in ${selectedDest.label}` })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fsqPlacesRow}>
              {fsqPlaces.map((place) => {
                const mapsUrl = place.location
                  ? `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + selectedDest.label)}`;
                return (
                  <Pressable
                    key={place.fsqId}
                    style={styles.fsqPlaceCard}
                    onPress={() => { Haptics.selectionAsync(); Linking.openURL(mapsUrl).catch(() => {}); }}
                  >
                    {place.photoUrl ? (
                      <Image source={{ uri: place.photoUrl }} style={styles.fsqPlacePhoto as ImageStyle} contentFit="cover" />
                    ) : (
                      <View style={[styles.fsqPlacePhoto, styles.fsqPlacePhotoFallback]}>
                        <MapPin size={24} color={COLORS.creamMuted} strokeWidth={1.5} />
                      </View>
                    )}
                    <LinearGradient colors={['transparent', COLORS.overlayDark]} style={styles.fsqPlaceGradient} />
                    <View style={styles.fsqPlaceBottom}>
                      <Text style={styles.fsqPlaceName} numberOfLines={2}>{place.name}</Text>
                      {place.category ? <Text style={styles.fsqPlaceCategory} numberOfLines={1}>{place.category}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── TripAdvisor Trending Attractions (tappable to TA search) ── */}
        {taAttractions && taAttractions.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.trending.label', { defaultValue: 'TRENDING' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.trending.heading', { defaultValue: `Worth your time in ${selectedDest.label}` })}</Text>
            <View style={styles.apiCardStack}>
              {taAttractions.map((loc) => {
                const taUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(loc.name + ' ' + selectedDest.label)}`;
                return (
                  <Pressable
                    key={loc.locationId}
                    style={styles.apiCard}
                    onPress={() => { Haptics.selectionAsync(); Linking.openURL(taUrl).catch(() => {}); }}
                  >
                    <Text style={styles.apiCardName}>{loc.name}</Text>
                    {loc.rating != null && <Text style={styles.apiCardMeta}>{loc.rating} ★ · {loc.numReviews ?? 0} reviews</Text>}
                    {loc.address ? <Text style={styles.apiCardSub}>{loc.address}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── GetYourGuide Experiences ── */}
        {gygActivities && gygActivities.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.experiences.label', { defaultValue: 'EXPERIENCES' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.experiences.heading', { defaultValue: `Bookable in ${selectedDest.label}` })}</Text>
            <View style={styles.apiCardStack}>
              {gygActivities.map((act) => (
                <Pressable
                  key={act.id}
                  style={styles.apiCard}
                  onPress={() => { Haptics.selectionAsync(); if (act.bookingUrl) Linking.openURL(act.bookingUrl); }}
                >
                  <Text style={styles.apiCardName}>{act.name}</Text>
                  {act.price != null && <Text style={styles.apiCardMeta}>From {act.currency ?? '$'} {act.price}</Text>}
                  {act.rating != null && <Text style={styles.apiCardSub}>{act.rating} ★ · {act.duration ?? ''}</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Foursquare Insider Tips ── */}
        {fsqTips && fsqTips.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.insider.label', { defaultValue: 'INSIDER' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.insider.heading', { defaultValue: 'Local tips' })}</Text>
            <View style={styles.apiCardStack}>
              {fsqTips.map((tip, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.apiCard, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never);
                  }}
                >
                  <Text style={styles.apiCardName}>{'\u201C'}{tip.text}{'\u201D'}</Text>
                  {tip.createdAt ? <Text style={styles.apiCardSub}>{new Date(tip.createdAt).toLocaleDateString()}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Local Eats Radar nav card */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/local-eats', params: { destination: selectedDest.label } } as never);
            }}
            style={({ pressed }) => [
              styles.pulseNavCard,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityLabel="Local Eats Radar"
            accessibilityRole="button"
          >
            <View style={styles.pulseNavCardLeft}>
              <MapPin size={20} color={COLORS.sage} strokeWidth={1.5} />
              <View>
                <Text style={styles.pulseNavCardTitle}>{t('pulse.localEatsRadar', { defaultValue: 'Local Eats Radar' })}</Text>
                <Text style={styles.pulseNavCardSub}>{t('pulse.localEatsSub', { defaultValue: `Authentic spots locals eat in ${selectedDest.label}`, destination: selectedDest.label })}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.muted} strokeWidth={1.5} />
          </Pressable>
        </View>
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

  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 4,
  } as TextStyle,

  scrollContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // ── Destination card row ──
  destCardScroll: {
    marginBottom: SPACING.xxl,
  } as ViewStyle,

  destCardRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  destCard: {
    width: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    opacity: 0.7,
    position: 'relative',
  } as ViewStyle,

  destCardActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: COLORS.sage,
  } as ViewStyle,

  destCardImage: {
    width: '100%',
    height: '100%',
  } as ViewStyle,

  destCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  } as ViewStyle,

  destCardLabel: {
    position: 'absolute',
    bottom: SPACING.sm + 2,
    left: SPACING.md,
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,

  destCardLabelActive: {
    color: COLORS.sage,
  } as TextStyle,

  // ── Sections ──
  section: {
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  sectionLast: {
    marginBottom: 0,
  } as ViewStyle,

  sectionHeading: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    marginBottom: SPACING.xs + 2,
    letterSpacing: -0.8,
    lineHeight: 38,
  } as TextStyle,

  sectionSubMono: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginBottom: SPACING.lg,
    letterSpacing: 0.3,
  } as TextStyle,

  tipsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,

  seasonLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // ── Editorial card stack ──
  editorialStack: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,

  editorialCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,

  editorialCardPhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,

  editorialCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  } as ViewStyle,

  editorialCardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: SPACING.md - 2,
  } as ViewStyle,

  editorialCardTextBlock: {
    flex: 1,
    paddingRight: SPACING.sm,
  } as ViewStyle,

  editorialCardTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    lineHeight: 26,
    marginBottom: 2,
  } as TextStyle,

  editorialCardDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 18,
  } as TextStyle,

  timeContextChip: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    flexShrink: 0,
  } as ViewStyle,

  timeContextText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.2,
  } as TextStyle,

  // ── Tips ──
  tipsStack: {
    marginTop: SPACING.lg,
  } as ViewStyle,

  tipRow: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    paddingLeft: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,

  tipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: SPACING.xs + 2,
  } as TextStyle,

  tipSource: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.2,
  } as TextStyle,

  // ── Seasonal hero ──
  seasonalHeroCard: {
    height: 220,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,

  seasonalHeroPhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,

  seasonalHeroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  } as ViewStyle,

  seasonalHeroBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  } as ViewStyle,

  seasonalHeroEvent: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 32,
  } as TextStyle,

  seasonalHeroDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: SPACING.xs,
    letterSpacing: 0.2,
  } as TextStyle,

  learnMoreButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    flexShrink: 0,
  } as ViewStyle,

  seasonalLearnMore: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  // ── Seasonal small cards ──
  seasonalSmallScroll: {
    marginLeft: -(SPACING.lg),
    marginRight: -(SPACING.lg),
  } as ViewStyle,

  seasonalSmallRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  seasonalSmallCard: {
    width: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,

  seasonalSmallPhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,

  seasonalSmallGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  } as ViewStyle,

  seasonalSmallBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm + 2,
  } as ViewStyle,

  seasonalSmallName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 17,
  } as TextStyle,

  seasonalSmallDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamSoft,
    marginTop: 2,
    letterSpacing: 0.2,
  } as TextStyle,

  // ── Empty state ──
  emptyState: {
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
  } as TextStyle,

  // Sonar live intel
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  } as ViewStyle,
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
  } as ViewStyle,
  sonarCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sonarCardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  sonarSkeletonStack: {
    marginTop: SPACING.md,
  } as ViewStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,
  sonarTimestamp: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,

  // ── Live Events (Eventbrite) ──
  liveEventsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.coral,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,

  liveEventsStack: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,

  liveEventCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minHeight: 44,
  } as ViewStyle,

  liveEventCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  liveEventLeft: {
    flex: 1,
    gap: SPACING.xs,
  } as ViewStyle,

  liveEventName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,

  liveEventVenue: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 18,
  } as TextStyle,

  liveEventDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.2,
    marginTop: 2,
  } as TextStyle,

  liveEventRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
    flexShrink: 0,
  } as ViewStyle,

  liveEventPriceChip: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  } as ViewStyle,

  liveEventPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.2,
  } as TextStyle,

  liveEventCategory: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    textAlign: 'right',
    maxWidth: 100,
  } as TextStyle,

  // ── API integration sections (TripAdvisor, GetYourGuide, Foursquare) ──
  apiSection: {
    paddingHorizontal: 20,
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,

  apiSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,

  apiSectionHeading: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  } as TextStyle,

  apiCardStack: {
    gap: SPACING.sm,
  } as ViewStyle,

  apiCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  } as ViewStyle,

  apiCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,

  apiCardMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,

  apiCardSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,

  fsqPlacesRow: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  } as ViewStyle,
  fsqPlaceCard: {
    width: 160,
    height: 140,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  fsqPlacePhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  fsqPlacePhotoFallback: {
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fsqPlaceGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  } as ViewStyle,
  fsqPlaceBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  fsqPlaceName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 17,
  } as TextStyle,
  fsqPlaceCategory: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  hereNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  hereNowBtnText: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
  checkInFloatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  checkInFloatBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  checkInFloatBtnSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'right',
  } as TextStyle,
  noTripCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  noTripCtaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  noTripCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  pulseNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  pulseNavCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  } as ViewStyle,
  pulseNavCardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  pulseNavCardSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  // Right now data pills
  rightNowPill: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  rightNowPillAlert: {
    borderColor: COLORS.coral + '40',
    backgroundColor: COLORS.coralSubtle,
  } as ViewStyle,
  rightNowPillText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
  } as TextStyle,
  comparePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  comparePillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});
