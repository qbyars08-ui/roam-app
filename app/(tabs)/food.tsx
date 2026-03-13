// =============================================================================
// ROAM — AI-curated local food discovery
// Editorial, opinionated, sensory — not Yelp
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { trackScreen } from '../../lib/analytics';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { impactAsync as hapticImpact } from '../../lib/haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, ExternalLink, UtensilsCrossed } from 'lucide-react-native';
import * as Linking from 'expo-linking';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore, getActiveTrip } from '../../lib/store';
import { SkeletonCard } from '../../components/premium/LoadingStates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FoodCategory =
  | 'all'
  | 'Local Gems'
  | 'Street Food'
  | 'Cafe'
  | 'Rooftop'
  | 'Late Night'
  | 'Fine Dining'
  | 'Markets';

interface Restaurant {
  id: string;
  name: string;
  category: FoodCategory;
  cuisine: string;
  neighborhood: string;
  mustTry?: string;
  tryDish?: string;
  insiderTip?: string;
  description?: string;
  priceRange: 1 | 2 | 3 | 4;
  opensAt: number;
  closesAt: number;
  distance: string;
}

interface AIPickRestaurant extends Restaurant {
  isAIPick: true;
  updatedToday: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getPriceRangeDisplay(n: 1 | 2 | 3 | 4): string {
  return '$'.repeat(n);
}

function isOpenNow(opensAt: number, closesAt: number): boolean {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  if (closesAt < opensAt) return hour >= opensAt || hour < closesAt;
  return hour >= opensAt && hour < closesAt;
}

function getClosesAtDisplay(closesAt: number): string {
  const h = Math.floor(closesAt);
  const m = Math.round((closesAt - h) * 60);
  const pm = h >= 12;
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}${m > 0 ? ':' + m.toString().padStart(2, '0') : ''}${pm ? 'pm' : 'am'}`;
}

/** Parse distance string like "0.3 mi" or "1.2 mi" to miles, then estimate walk time (~3 mph) */
function getWalkTime(distance: string): string {
  const match = distance.match(/^([\d.]+)\s*(?:mi|miles?)?/i);
  const mi = match ? parseFloat(match[1]) : 0.25;
  const min = Math.round((mi / 3) * 60);
  if (min < 1) return '1 min walk';
  if (min < 60) return `${min} min walk`;
  const hrs = Math.floor(min / 60);
  const remain = min % 60;
  return remain > 0 ? `${hrs}h ${remain}m walk` : `${hrs} hr walk`;
}

function getAccentColor(category: FoodCategory): string {
  switch (category) {
    case 'Local Gems':
      return COLORS.sage;
    case 'Late Night':
      return COLORS.coral;
    case 'Fine Dining':
      return COLORS.gold;
    case 'Rooftop':
      return COLORS.sage;
    case 'Street Food':
      return COLORS.coral;
    case 'Cafe':
      return COLORS.gold;
    case 'Markets':
      return COLORS.sage;
    default:
      return COLORS.sage;
  }
}

// ---------------------------------------------------------------------------
// Destination-aware food data
// ---------------------------------------------------------------------------
interface CityFoodData {
  restaurants: (Restaurant | AIPickRestaurant)[];
}

const CITY_FOOD: Record<string, CityFoodData> = {
  tokyo: {
    restaurants: [
      { id: 'ai-1', name: 'Fuunji', category: 'Local Gems', cuisine: 'Tsukemen ramen', neighborhood: 'Shinjuku', mustTry: 'Rich pork tsukemen with thick noodles', insiderTip: 'The broth is so concentrated they give you dilution soup to drink after.', priceRange: 2, opensAt: 11, closesAt: 21, distance: '0.3 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
      { id: '2', name: 'Tsukiji Outer Market', category: 'Markets', cuisine: 'Fresh seafood', neighborhood: 'Tsukiji', tryDish: 'Uni (sea urchin) on rice', description: 'Go before 9am for the best selection. Cash only at most stalls.', priceRange: 2, opensAt: 5, closesAt: 14, distance: '1.2 mi' },
      { id: '3', name: 'Yakitori Alley', category: 'Street Food', cuisine: 'Grilled chicken skewers', neighborhood: 'Yurakucho', tryDish: 'Negima (chicken thigh & leek)', description: 'Under the train tracks. Point at what you want — no English needed.', priceRange: 1, opensAt: 17, closesAt: 23, distance: '0.8 mi' },
      { id: '4', name: 'Kissaten Sarutahiko', category: 'Cafe', cuisine: 'Japanese specialty coffee', neighborhood: 'Omotesando', tryDish: 'Pour-over single origin + fluffy souffle pancake', description: 'Minimalist vibes. The baristas take 4+ minutes per cup — worth the wait.', priceRange: 2, opensAt: 8, closesAt: 21, distance: '0.6 mi' },
      { id: '5', name: 'Gonpachi Nishi-Azabu', category: 'Late Night', cuisine: 'Izakaya', neighborhood: 'Roppongi', tryDish: 'Soba noodles + sake flight', description: 'The restaurant that inspired Kill Bill. Open late, great for groups.', priceRange: 3, opensAt: 11.5, closesAt: 3, distance: '1.5 mi' },
      { id: '6', name: 'Den', category: 'Fine Dining', cuisine: 'Innovative Japanese', neighborhood: 'Jingumae', tryDish: 'The "Den-tucky Fried Chicken" course', description: 'Two Michelin stars but zero pretension. Book 2 months ahead.', priceRange: 4, opensAt: 18, closesAt: 22, distance: '0.9 mi' },
      { id: '7', name: 'Rooftop Bar Andaz', category: 'Rooftop', cuisine: 'Japanese cocktails', neighborhood: 'Toranomon', tryDish: 'Yuzu martini with Tokyo skyline', description: '52nd floor. No reservation needed for the bar. Go at sunset.', priceRange: 4, opensAt: 17, closesAt: 1, distance: '2.0 mi' },
    ],
  },
  bali: {
    restaurants: [
      { id: 'ai-1', name: 'Warung Babi Guling Ibu Oka', category: 'Local Gems', cuisine: 'Balinese roast pork', neighborhood: 'Ubud', mustTry: 'Babi guling (suckling pig) with lawar', insiderTip: 'Go at 11am sharp — they sell out by 1pm every day.', priceRange: 1, opensAt: 10, closesAt: 14, distance: '0.2 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
      { id: '2', name: 'Jl. Goutama Food Stalls', category: 'Street Food', cuisine: 'Nasi campur vendors', neighborhood: 'Ubud', tryDish: 'Mixed rice plate with sambal matah', description: 'The whole street is food. Pick the stall with the longest local queue.', priceRange: 1, opensAt: 7, closesAt: 21, distance: '0.3 mi' },
      { id: '3', name: 'Seniman Coffee', category: 'Cafe', cuisine: 'Third-wave coffee', neighborhood: 'Ubud', tryDish: 'Kintamani single origin pour-over', description: 'Best coffee in Bali. Their beans are sourced from the volcanic highlands.', priceRange: 2, opensAt: 8, closesAt: 22, distance: '0.4 mi' },
      { id: '4', name: 'The Lawn', category: 'Rooftop', cuisine: 'Beach club dining', neighborhood: 'Canggu', tryDish: 'Tuna poke bowl with ocean view', description: 'Beanbags on the grass. Get there before 4pm for a good spot at sunset.', priceRange: 3, opensAt: 10, closesAt: 23, distance: '5.0 mi' },
      { id: '5', name: 'Night Market Gianyar', category: 'Markets', cuisine: 'Balinese night market', neighborhood: 'Gianyar', tryDish: 'Sate lilit + black rice pudding', description: 'Locals only. Most tourists miss this. Go around 7pm.', priceRange: 1, opensAt: 17, closesAt: 23, distance: '6.0 mi' },
      { id: '6', name: 'Locavore', category: 'Fine Dining', cuisine: 'Modern Indonesian', neighborhood: 'Ubud', tryDish: '7-course tasting menu with local ingredients', description: 'Asia\'s 50 Best. Every ingredient is sourced within Bali. Book weeks ahead.', priceRange: 4, opensAt: 12, closesAt: 22, distance: '0.5 mi' },
      { id: '7', name: 'Old Man\'s', category: 'Late Night', cuisine: 'Pub grub & cocktails', neighborhood: 'Canggu', tryDish: 'Fish tacos + Bintang', description: 'The official Canggu hangout. Wednesday night is legendary.', priceRange: 2, opensAt: 11, closesAt: 2, distance: '4.8 mi' },
    ],
  },
  bangkok: {
    restaurants: [
      { id: 'ai-1', name: 'Jay Fai', category: 'Local Gems', cuisine: 'Thai street fine dining', neighborhood: 'Old Town', mustTry: 'Crab omelet (the dish that won a Michelin star)', insiderTip: 'Queue starts at 2pm for dinner at 5pm. Bring a book.', priceRange: 3, opensAt: 14, closesAt: 21, distance: '1.0 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
      { id: '2', name: 'Yaowarat Road', category: 'Street Food', cuisine: 'Chinatown street food', neighborhood: 'Chinatown', tryDish: 'Pad thai at Thip Samai + mango sticky rice', description: 'The entire street is a menu. Start at Thip Samai, graze your way down.', priceRange: 1, opensAt: 17, closesAt: 1, distance: '0.8 mi' },
      { id: '3', name: 'Rocket Coffeebar', category: 'Cafe', cuisine: 'Specialty coffee', neighborhood: 'Sathorn', tryDish: 'Thai iced coffee + coconut cake', description: 'Bangkok\'s coffee scene is underrated. This spot proves it.', priceRange: 2, opensAt: 7, closesAt: 18, distance: '1.5 mi' },
      { id: '4', name: 'Vertigo & Moon Bar', category: 'Rooftop', cuisine: 'International', neighborhood: 'Silom', tryDish: 'Cocktails 61 floors up', description: 'No railings at the rooftop bar. The view is vertigo-inducing (hence the name).', priceRange: 4, opensAt: 17, closesAt: 1, distance: '2.0 mi' },
      { id: '5', name: 'Or Tor Kor Market', category: 'Markets', cuisine: 'Premium fresh market', neighborhood: 'Chatuchak', tryDish: 'Durian (if you dare) + coconut ice cream', description: 'CNN ranked it #4 fresh market in the world. Cleaner than most.', priceRange: 2, opensAt: 6, closesAt: 18, distance: '3.5 mi' },
      { id: '6', name: 'Gaggan Anand', category: 'Fine Dining', cuisine: 'Progressive Indian', neighborhood: 'Lumpini', tryDish: '25-course emoji menu (no words, just emojis)', description: 'Asia\'s most awarded restaurant. The emoji menu is a flex.', priceRange: 4, opensAt: 18, closesAt: 23, distance: '1.8 mi' },
      { id: '7', name: 'Soi Rambuttri', category: 'Late Night', cuisine: 'Backpacker row', neighborhood: 'Khao San', tryDish: 'Pad kra pao (holy basil stir-fry) at 2am', description: 'The street that never sleeps. Grab a bucket and settle in.', priceRange: 1, opensAt: 18, closesAt: 4, distance: '1.2 mi' },
    ],
  },
  paris: {
    restaurants: [
      { id: 'ai-1', name: 'Chez Janou', category: 'Local Gems', cuisine: 'French bistro', neighborhood: 'Le Marais', mustTry: 'Chocolate mousse (served from a giant bowl)', insiderTip: 'Don\'t order a portion — they bring the whole bowl and let you serve yourself.', priceRange: 3, opensAt: 12, closesAt: 23, distance: '0.4 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
      { id: '2', name: 'Marche des Enfants Rouges', category: 'Markets', cuisine: 'Covered market', neighborhood: 'Le Marais', tryDish: 'Moroccan couscous stall + crepes', description: 'Paris\' oldest covered market (1615). Go at lunch, not morning.', priceRange: 2, opensAt: 8.5, closesAt: 20, distance: '0.3 mi' },
      { id: '3', name: 'Rue Mouffetard Stalls', category: 'Street Food', cuisine: 'French street snacks', neighborhood: 'Latin Quarter', tryDish: 'Galette complète (ham, cheese, egg crepe)', description: 'The most Parisian street in Paris. Cheese shops, bakeries, wine bars.', priceRange: 1, opensAt: 8, closesAt: 20, distance: '0.9 mi' },
      { id: '4', name: 'Cafe de Flore', category: 'Cafe', cuisine: 'Classic Parisian cafe', neighborhood: 'Saint-Germain', tryDish: 'Espresso + croissant (the only order that matters)', description: 'Where Sartre and de Beauvoir held court. Overpriced. Still worth it once.', priceRange: 3, opensAt: 7.5, closesAt: 1.5, distance: '0.7 mi' },
      { id: '5', name: 'Le Perchoir Marais', category: 'Rooftop', cuisine: 'Cocktails & small plates', neighborhood: 'Le Marais', tryDish: 'Natural wine + charcuterie board', description: 'Paris rooftops are rare. This one has views of the zinc roofs of the 3rd.', priceRange: 3, opensAt: 16, closesAt: 2, distance: '0.5 mi' },
      { id: '6', name: 'Septime', category: 'Fine Dining', cuisine: 'Neo-bistro', neighborhood: 'Oberkampf', tryDish: 'Surprise tasting menu (changes daily)', description: 'One Michelin star, zero ego. Book online exactly 21 days ahead at midnight.', priceRange: 4, opensAt: 12, closesAt: 22, distance: '1.1 mi' },
      { id: '7', name: 'Au Pied de Cochon', category: 'Late Night', cuisine: 'French brasserie', neighborhood: 'Les Halles', tryDish: 'French onion soup at 3am', description: 'Open 24/7. The 3am crowd is half clubbers, half chefs off shift.', priceRange: 3, opensAt: 0, closesAt: 24, distance: '0.6 mi' },
    ],
  },
  'mexico city': {
    restaurants: [
      { id: 'ai-1', name: 'Contramar', category: 'Local Gems', cuisine: 'Mexican seafood', neighborhood: 'Roma Norte', mustTry: 'Tuna tostadas + the red-and-green grilled fish', insiderTip: 'No reservations. Get there at 1pm sharp or wait an hour.', priceRange: 3, opensAt: 13, closesAt: 18, distance: '0.4 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
      { id: '2', name: 'Mercado de Jamaica', category: 'Markets', cuisine: 'Market food stalls', neighborhood: 'Jamaica', tryDish: 'Tlacoyos + fresh fruit agua fresca', description: 'The flower market with a secret food section. Follow the smoke.', priceRange: 1, opensAt: 6, closesAt: 18, distance: '3.0 mi' },
      { id: '3', name: 'Taqueria Orinoco', category: 'Street Food', cuisine: 'Northern-style tacos', neighborhood: 'Roma Norte', tryDish: 'Chicharron taco with guacamole', description: 'Monterrey-style flour tortilla tacos. Not your typical CDMX taco.', priceRange: 1, opensAt: 8, closesAt: 23, distance: '0.2 mi' },
      { id: '4', name: 'Cafe de Tacuba', category: 'Cafe', cuisine: 'Historic Mexican cafe', neighborhood: 'Centro Historico', tryDish: 'Mexican hot chocolate + pan dulce', description: 'Since 1912. The azulejo tiles and stained glass are worth the visit alone.', priceRange: 2, opensAt: 8, closesAt: 23, distance: '1.5 mi' },
      { id: '5', name: 'Pujol', category: 'Fine Dining', cuisine: 'Contemporary Mexican', neighborhood: 'Polanco', tryDish: 'Mole madre (aged 2,500+ days)', description: 'Reservations essential. The tasting menu tells Mexico\'s story.', priceRange: 4, opensAt: 13.5, closesAt: 22.5, distance: '2.1 mi' },
      { id: '6', name: 'Salon Rios', category: 'Late Night', cuisine: 'Mezcal bar + snacks', neighborhood: 'Condesa', tryDish: 'Mezcal flight + chapulines (crickets)', description: 'Tiny bar, massive mezcal list. The bartenders know their agave.', priceRange: 2, opensAt: 18, closesAt: 2, distance: '0.6 mi' },
      { id: '7', name: 'Terraza Cha Cha Cha', category: 'Rooftop', cuisine: 'Mexican-Mediterranean', neighborhood: 'Condesa', tryDish: 'Tostadas de atun + mezcal paloma', description: 'CDMX\' best rooftop for golden hour. DJs on weekends.', priceRange: 3, opensAt: 13, closesAt: 1, distance: '0.5 mi' },
    ],
  },
  barcelona: {
    restaurants: [
      { id: 'ai-1', name: 'Cal Pep', category: 'Local Gems', cuisine: 'Catalan tapas bar', neighborhood: 'Born', mustTry: 'Fried baby squid + razor clams a la plancha', insiderTip: 'Sit at the bar, not the dining room. That\'s where Pep himself serves.', priceRange: 3, opensAt: 13, closesAt: 23.5, distance: '0.3 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
      { id: '2', name: 'Mercat de la Boqueria', category: 'Markets', cuisine: 'Market stalls', neighborhood: 'Las Ramblas', tryDish: 'Fresh juice + jamon iberico', description: 'Skip the front stalls (tourist traps). Walk to the back for the real food.', priceRange: 2, opensAt: 8, closesAt: 20.5, distance: '0.4 mi' },
      { id: '3', name: 'Bo de B', category: 'Street Food', cuisine: 'Bocadillos (sandwiches)', neighborhood: 'Gothic Quarter', tryDish: 'Steak bocadillo with all the sauces', description: 'Best sandwich in Barcelona. The line moves fast. Get all five sauces.', priceRange: 1, opensAt: 12, closesAt: 23, distance: '0.2 mi' },
      { id: '4', name: 'Satan\'s Coffee Corner', category: 'Cafe', cuisine: 'Specialty coffee', neighborhood: 'El Raval', tryDish: 'Flat white + pistachio cookie', description: 'Tiny, loud, perfect. The baristas take coffee more seriously than anything.', priceRange: 2, opensAt: 8, closesAt: 18, distance: '0.5 mi' },
      { id: '5', name: 'Disfrutar', category: 'Fine Dining', cuisine: 'Avant-garde Spanish', neighborhood: 'Eixample', tryDish: 'The multi-spherification olive (liquid olive inside a shell)', description: 'World\'s #1 restaurant (2024). Book 3 months ahead. Life-changing.', priceRange: 4, opensAt: 13, closesAt: 22, distance: '1.0 mi' },
      { id: '6', name: 'Terraza Martinez', category: 'Rooftop', cuisine: 'Mediterranean seafood', neighborhood: 'Montjuic', tryDish: 'Paella with harbor views', description: 'On the hillside of Montjuic. The paella is as good as the panorama.', priceRange: 3, opensAt: 13, closesAt: 23, distance: '2.5 mi' },
      { id: '7', name: 'Bormuth', category: 'Late Night', cuisine: 'Vermouth bar + tapas', neighborhood: 'Born', tryDish: 'Vermouth on tap + patatas bravas', description: 'The vermuteria that started Barcelona\'s vermouth revival. Go after 10pm.', priceRange: 2, opensAt: 12, closesAt: 2, distance: '0.3 mi' },
    ],
  },
  lisbon: {
    restaurants: [
      { id: 'ai-1', name: 'Cervejaria Ramiro', category: 'Local Gems', cuisine: 'Portuguese seafood', neighborhood: 'Intendente', mustTry: 'Tiger prawns + steak sandwich chaser', insiderTip: 'End with the prego (steak sandwich). Everyone does. It\'s the move.', priceRange: 3, opensAt: 12, closesAt: 0.5, distance: '0.6 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
      { id: '2', name: 'Time Out Market', category: 'Markets', cuisine: 'Curated food hall', neighborhood: 'Cais do Sodre', tryDish: 'Pastel de nata + bifana', description: 'The editors of Time Out picked every vendor. Skip the crowds at lunch.', priceRange: 2, opensAt: 10, closesAt: 24, distance: '0.8 mi' },
      { id: '3', name: 'Manteigaria', category: 'Street Food', cuisine: 'Pasteis de nata', neighborhood: 'Chiado', tryDish: 'Watch them make the custard tarts through the window', description: 'Better than Belem, fight me. Eat them warm. Add cinnamon.', priceRange: 1, opensAt: 8, closesAt: 24, distance: '0.5 mi' },
      { id: '4', name: 'Copenhagen Coffee Lab', category: 'Cafe', cuisine: 'Specialty coffee', neighborhood: 'Chiado', tryDish: 'Flat white + avocado toast', description: 'Scandinavian-style coffee in a Portuguese azulejo building. Beautiful clash.', priceRange: 2, opensAt: 8, closesAt: 19, distance: '0.4 mi' },
      { id: '5', name: 'Belcanto', category: 'Fine Dining', cuisine: 'Modern Portuguese', neighborhood: 'Chiado', tryDish: 'The garden of the goose that laid the golden eggs (yes, that\'s a dish)', description: 'Two Michelin stars. Jose Avillez is Portugal\'s greatest chef.', priceRange: 4, opensAt: 12.5, closesAt: 23, distance: '0.5 mi' },
      { id: '6', name: 'PARK Bar', category: 'Rooftop', cuisine: 'Cocktails', neighborhood: 'Bairro Alto', tryDish: 'Gin & tonic with Tagus river sunset', description: 'Hidden on top of a parking garage. Take the elevator to the roof.', priceRange: 3, opensAt: 13, closesAt: 2, distance: '0.7 mi' },
      { id: '7', name: 'Pensao Amor', category: 'Late Night', cuisine: 'Bar & kitchen', neighborhood: 'Cais do Sodre', tryDish: 'Late-night petiscos + cocktails', description: 'A former brothel turned bar. The decor tells the story. Go after midnight.', priceRange: 3, opensAt: 16, closesAt: 4, distance: '0.8 mi' },
    ],
  },
};

// Fallback for destinations not in the curated list
function generateFallbackRestaurants(destination: string): (Restaurant | AIPickRestaurant)[] {
  return [
    { id: 'ai-1', name: `${destination} Local Favorite`, category: 'Local Gems', cuisine: 'Regional specialties', neighborhood: 'City Center', mustTry: 'Ask your host for the dish only locals know', insiderTip: 'Skip the tourist strip. Walk two blocks in any direction for the real food.', priceRange: 2, opensAt: 11, closesAt: 22, distance: '0.3 mi', isAIPick: true, updatedToday: true } as AIPickRestaurant,
    { id: '2', name: 'Central Market', category: 'Markets', cuisine: 'Local produce & prepared food', neighborhood: 'Old Town', tryDish: 'Whatever the locals are eating', description: 'Every great food city has a market. Find it. Eat at the stalls in the back.', priceRange: 1, opensAt: 7, closesAt: 18, distance: '0.5 mi' },
    { id: '3', name: 'Street Food Row', category: 'Street Food', cuisine: 'Street vendors', neighborhood: 'Market District', tryDish: 'The stall with the longest local queue', description: 'Follow the smoke and the line. That\'s usually where the best food is.', priceRange: 1, opensAt: 10, closesAt: 22, distance: '0.4 mi' },
    { id: '4', name: 'Third Wave Coffee', category: 'Cafe', cuisine: 'Specialty coffee', neighborhood: 'Arts District', tryDish: 'Local single-origin pour-over', description: 'Every city has a coffee scene now. Google "specialty coffee [city]" to find it.', priceRange: 2, opensAt: 7, closesAt: 18, distance: '0.6 mi' },
    { id: '5', name: 'The View', category: 'Rooftop', cuisine: 'Cocktails & small plates', neighborhood: 'Downtown', tryDish: 'Sunset cocktail', description: 'Search for the highest rooftop bar. The food is secondary to the view.', priceRange: 3, opensAt: 17, closesAt: 1, distance: '1.0 mi' },
    { id: '6', name: 'Night Owl Kitchen', category: 'Late Night', cuisine: 'Late-night comfort food', neighborhood: 'Entertainment District', tryDish: 'Whatever they\'re known for after midnight', description: 'The best food happens late. Ask your bartender where locals eat at 1am.', priceRange: 2, opensAt: 20, closesAt: 4, distance: '0.8 mi' },
  ];
}

function getRestaurantsForCity(destination: string): (Restaurant | AIPickRestaurant)[] {
  const key = destination.toLowerCase().trim();
  return CITY_FOOD[key]?.restaurants ?? generateFallbackRestaurants(destination);
}

const FOOD_CATEGORIES: FoodCategory[] = [
  'all',
  'Local Gems',
  'Street Food',
  'Cafe',
  'Rooftop',
  'Late Night',
  'Fine Dining',
  'Markets',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useFocusEffect(React.useCallback(() => { trackScreen('Food'); }, []));
  const activeTrip = getActiveTrip();
  const planWizard = useAppStore((s) => s.planWizard);
  const bookmarkedIds = useAppStore((s) => s.bookmarkedRestaurantIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmarkedRestaurant);

  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('all');
  const [savedToast, setSavedToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const destination =
    activeTrip?.destination ?? planWizard.destination ?? null;

  // Brief loading state for perceived quality
  useEffect(() => {
    if (!destination) return;
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [destination]);

  const cityRestaurants = useMemo(
    () => destination ? getRestaurantsForCity(destination) : [],
    [destination]
  );

  const filteredRestaurants = useMemo(() => {
    if (selectedCategory === 'all') return cityRestaurants;
    return cityRestaurants.filter((r) => r.category === selectedCategory);
  }, [selectedCategory, cityRestaurants]);

  const aiPick = useMemo(
    () => cityRestaurants.find((r) => 'isAIPick' in r && r.isAIPick) as AIPickRestaurant | undefined,
    [cityRestaurants]
  );

  const morePicks = useMemo(
    () =>
      filteredRestaurants.filter(
        (r) => !('isAIPick' in r && r.isAIPick)
      ) as Restaurant[],
    [filteredRestaurants]
  );

  const showCategoryFilter = (selectedCategory === 'all' && filteredRestaurants.length > 0) ||
    filteredRestaurants.length > 0;

  const handleCategoryChange = useCallback((cat: FoodCategory) => {
    setSelectedCategory(cat);
    fadeAnim.setValue(0.3);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCardPress = useCallback(
    (restaurant: Restaurant | AIPickRestaurant) => {
      hapticImpact();
      const query = encodeURIComponent(`${restaurant.name} ${destination}`);
      Linking.openURL(`https://www.google.com/maps/search/${query}`);
    },
    [destination]
  );

  const handleAIPickPress = useCallback(() => {
    if (!aiPick) return;
    hapticImpact();
    const query = encodeURIComponent(`${aiPick.name} ${destination}`);
    Linking.openURL(`https://www.google.com/maps/search/${query}`);
  }, [aiPick, destination]);

  const handleBookmark = useCallback(
    (id: string, e: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      hapticImpact();
      toggleBookmark(id);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1800);
    },
    [toggleBookmark]
  );

  if (!destination) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <UtensilsCrossed size={48} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Add a destination to discover local food</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Eat in {destination}</Text>
        <Text style={styles.headerSubtitle}>AI-curated picks</Text>

        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonCard height={200} borderRadius={16} style={{ marginBottom: 16 }} />
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} height={90} borderRadius={14} style={{ marginBottom: 10 }} />
            ))}
          </View>
        ) : null}

        {/* Category filter */}
        {!isLoading && showCategoryFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {FOOD_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleCategoryChange(cat)}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextSelected,
                    ]}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {!isLoading && <Animated.View style={{ opacity: fadeAnim }}>
          {/* AI Pick hero card */}
          {aiPick && (selectedCategory === 'all' || selectedCategory === aiPick.category) && (
            <Pressable
              onPress={handleAIPickPress}
              style={({ pressed }) => [
                styles.heroCard,
                { transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.bgCard, COLORS.sageVeryFaint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroBorder} />
              <View style={styles.heroTopRow}>
                <View style={styles.aiPickBadge}>
                  <Text style={styles.aiPickBadgeText}>AI Pick</Text>
                </View>
                {aiPick.updatedToday && (
                  <Text style={styles.updatedToday}>Updated today</Text>
                )}
              </View>
              <Text style={styles.heroName}>{aiPick.name}</Text>
              <Text style={styles.heroCuisine}>
                {aiPick.cuisine} · {aiPick.neighborhood}
              </Text>
              {aiPick.mustTry && (
                <View style={styles.mustTryRow}>
                  <Text style={styles.mustTryLabel}>Must Try</Text>
                  <Text style={styles.mustTryDish}>{aiPick.mustTry}</Text>
                </View>
              )}
              {aiPick.insiderTip && (
                <Text style={styles.insiderTip} numberOfLines={2}>
                  — {aiPick.insiderTip}
                </Text>
              )}
              <View style={styles.heroBottomRow}>
                <Text style={styles.heroPrice}>
                  {getPriceRangeDisplay(aiPick.priceRange)}
                </Text>
                <View style={styles.heroStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isOpenNow(aiPick.opensAt, aiPick.closesAt)
                          ? COLORS.sage
                          : COLORS.coral,
                      },
                    ]}
                  />
                  <Text style={styles.heroStatusText}>
                    {isOpenNow(aiPick.opensAt, aiPick.closesAt)
                      ? 'Open now'
                      : `Closes at ${getClosesAtDisplay(aiPick.closesAt)}`}
                  </Text>
                </View>
                <Text style={styles.heroDistance}>
                  {getWalkTime(aiPick.distance)} · {aiPick.distance}
                </Text>
              </View>
            </Pressable>
          )}

          {/* See all AI picks — stub link when more than one */}
          {aiPick && morePicks.length > 0 && (
            <Pressable
              onPress={() => handleCategoryChange('all')}
              style={styles.seeAllRow}
            >
              <Text style={styles.seeAllText}>See all picks</Text>
            </Pressable>
          )}

          {/* More picks section */}
          {filteredRestaurants.length === 0 ? (
            <View style={styles.emptyList}>
              <UtensilsCrossed size={40} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
              <Text style={styles.emptyListTitle}>No picks in this category</Text>
              <Text style={styles.emptyListSub}>Try another filter</Text>
            </View>
          ) : morePicks.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>More picks</Text>
              {morePicks.map((r) => {
                const isBookmarked = bookmarkedIds.includes(r.id);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => handleCardPress(r)}
                    style={({ pressed }) => [
                      styles.restaurantCard,
                      { opacity: pressed ? 0.95 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardAccent,
                        { backgroundColor: getAccentColor(r.category) },
                      ]}
                    />
                    <Text style={styles.cardName}>{r.name}</Text>
                    <Text style={styles.cardCategory}>{r.category}</Text>
                    {(r.tryDish || r.mustTry) && (
                      <View style={styles.tryRow}>
                        <Text style={styles.tryLabel}>Try:</Text>
                        <Text style={styles.tryDish}>{r.tryDish ?? r.mustTry}</Text>
                      </View>
                    )}
                    {r.description && (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {r.description}
                      </Text>
                    )}
                    <View style={styles.cardBottomRow}>
                      <Text style={styles.cardPrice}>
                        {getPriceRangeDisplay(r.priceRange)}
                      </Text>
                      <View style={styles.cardStatusRow}>
                        <View
                          style={[
                            styles.statusDotSmall,
                            {
                              backgroundColor: isOpenNow(r.opensAt, r.closesAt)
                                ? COLORS.sage
                                : COLORS.coral,
                            },
                          ]}
                        />
                        <Text style={styles.cardDistance}>
                          {isOpenNow(r.opensAt, r.closesAt)
                            ? 'Open now'
                            : `Closed · Closes ${getClosesAtDisplay(r.closesAt)}`}{' '}
                          · {getWalkTime(r.distance)}
                        </Text>
                      </View>
                      <View style={styles.cardActionsRow}>
                        <ExternalLink size={14} color={COLORS.creamVeryFaint} strokeWidth={2} />
                        <Pressable
                          onPress={(e) => handleBookmark(r.id, e as { stopPropagation?: () => void })}
                          hitSlop={12}
                          style={styles.bookmarkBtn}
                        >
                          <Bookmark
                            size={18}
                            color={COLORS.creamDim}
                            fill={isBookmarked ? COLORS.sage : 'transparent'}
                            strokeWidth={2}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          ) : null}
        </Animated.View>}
      </ScrollView>

      {/* Saved toast */}
      {savedToast && (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>Saved</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    marginBottom: SPACING.lg,
  } as TextStyle,
  categoryScroll: {
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  categoryContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  } as ViewStyle,
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.creamDim,
    marginRight: SPACING.sm,
  } as ViewStyle,
  categoryPillSelected: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  } as ViewStyle,
  categoryPillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  categoryPillTextSelected: {
    color: COLORS.bg,
  } as TextStyle,
  heroCard: {
    borderRadius: RADIUS.lg + 4,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    position: 'relative',
  } as ViewStyle,
  heroBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  aiPickBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  } as ViewStyle,
  aiPickBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  updatedToday: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  heroName: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  heroCuisine: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  mustTryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  mustTryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  mustTryDish: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  insiderTip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
    maxWidth: '95%',
  } as TextStyle,
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  heroPrice: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  heroStatusText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  heroDistance: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  seeAllRow: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  seeAllText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    textDecorationLine: 'underline',
  } as TextStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  restaurantCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  } as ViewStyle,
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  } as ViewStyle,
  cardName: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    width: '100%',
    marginBottom: 2,
  } as TextStyle,
  cardCategory: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    marginBottom: SPACING.xs,
  } as TextStyle,
  tryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
    width: '100%',
  } as ViewStyle,
  tryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  tryDish: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  } as ViewStyle,
  cardPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  cardDistance: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  bookmarkBtn: {
    padding: 4,
  } as ViewStyle,
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  emptyList: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  } as ViewStyle,
  emptyListTitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
  } as TextStyle,
  emptyListSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
  } as TextStyle,
  emptyTitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    marginTop: SPACING.lg,
    textAlign: 'center',
  } as TextStyle,
  toastWrap: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  toastText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // ── Skeleton loaders ──
  skeletonWrap: {
    gap: 16,
    marginTop: SPACING.md,
  } as ViewStyle,

  // ── Card actions ──
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,
});
