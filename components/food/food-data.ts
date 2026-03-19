// =============================================================================
// ROAM — Food Tab Static Data
// Extracted from app/(tabs)/food.tsx for file size management.
// =============================================================================
import type { FoodCategory, Restaurant, AIPickRestaurant } from './food-types';

// ---------------------------------------------------------------------------
// Destination-aware food data
// ---------------------------------------------------------------------------
export interface CityFoodData {
  restaurants: (Restaurant | AIPickRestaurant)[];
}

export const CITY_FOOD: Record<string, CityFoodData> = {
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

export function getRestaurantsForCity(destination: string): (Restaurant | AIPickRestaurant)[] {
  const key = destination.toLowerCase().trim();
  return CITY_FOOD[key]?.restaurants ?? generateFallbackRestaurants(destination);
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  'all',
  'Local Gems',
  'Street Food',
  'Cafe',
  'Rooftop',
  'Late Night',
  'Fine Dining',
  'Markets',
];

// Popular food cities for hero/empty state (no destination)
export const POPULAR_FOOD_CITIES = [
  { city: 'Tokyo', vibe: 'Ramen, sushi, izakaya', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { city: 'Bangkok', vibe: 'Street food capital', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80' },
  { city: 'Paris', vibe: 'Bistros, pastries, wine', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80' },
  { city: 'Mexico City', vibe: 'Tacos, mezcal, markets', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80' },
  { city: 'Barcelona', vibe: 'Tapas, vermouth, paella', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80' },
  { city: 'Lisbon', vibe: 'Seafood, pasteis, petiscos', image: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=400&q=80' },
];
