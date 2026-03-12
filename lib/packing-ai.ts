// =============================================================================
// ROAM — Packing AI
// Hyper-personalized packing lists based on destination, weather forecast,
// activities, trip length, and travel style.
// =============================================================================
import type { Itinerary } from './types/itinerary';
import type { WeatherForecast } from './weather';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PackingList {
  destination: string;
  days: number;
  categories: PackingCategory[];
  proTips: string[];
  skipList: string[]; // "Don't bring X — you can buy it cheaper there"
  totalItems: number;
}

export interface PackingCategory {
  name: string;
  emoji: string;
  items: PackingItem[];
}

export interface PackingItem {
  name: string;
  quantity: number;
  essential: boolean;
  reason?: string; // "Rain forecast Day 3"
}

// ---------------------------------------------------------------------------
// Weather context (simplified — used until we integrate OpenWeatherMap)
// ---------------------------------------------------------------------------
interface WeatherContext {
  avgTempC: number;
  rainyDays: number;
  humid: boolean;
}

const DESTINATION_WEATHER: Record<string, WeatherContext> = {
  'tokyo': { avgTempC: 18, rainyDays: 3, humid: true },
  'bali': { avgTempC: 28, rainyDays: 5, humid: true },
  'paris': { avgTempC: 14, rainyDays: 4, humid: false },
  'barcelona': { avgTempC: 20, rainyDays: 2, humid: false },
  'new york': { avgTempC: 12, rainyDays: 3, humid: false },
  'bangkok': { avgTempC: 32, rainyDays: 4, humid: true },
  'london': { avgTempC: 12, rainyDays: 5, humid: false },
  'rome': { avgTempC: 18, rainyDays: 2, humid: false },
  'lisbon': { avgTempC: 20, rainyDays: 2, humid: false },
  'marrakech': { avgTempC: 24, rainyDays: 1, humid: false },
  'reykjavik': { avgTempC: 4, rainyDays: 6, humid: false },
  'seoul': { avgTempC: 14, rainyDays: 3, humid: true },
  'istanbul': { avgTempC: 16, rainyDays: 3, humid: false },
  'sydney': { avgTempC: 22, rainyDays: 2, humid: false },
  'mexico city': { avgTempC: 18, rainyDays: 4, humid: false },
  'cape town': { avgTempC: 20, rainyDays: 2, humid: false },
  'amsterdam': { avgTempC: 10, rainyDays: 5, humid: false },
  'dubrovnik': { avgTempC: 22, rainyDays: 2, humid: false },
  'buenos aires': { avgTempC: 20, rainyDays: 3, humid: true },
  'kyoto': { avgTempC: 16, rainyDays: 3, humid: true },
};

function getWeather(destination: string): WeatherContext {
  const key = destination.toLowerCase();
  return DESTINATION_WEATHER[key] ?? { avgTempC: 20, rainyDays: 2, humid: false };
}

function weatherFromForecast(forecast: { days: Array<{ tempMin: number; tempMax: number; pop: number }> }): WeatherContext {
  const days = forecast.days ?? [];
  const avgTempC = days.length > 0
    ? days.reduce((s, d) => s + (d.tempMin + d.tempMax) / 2, 0) / days.length
    : 20;
  const rainyDays = days.filter((d) => d.pop > 0.4).length;
  return { avgTempC, rainyDays, humid: avgTempC > 22 };
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------
export function generatePackingList(params: {
  destination: string;
  days: number;
  vibes: string[];
  budget?: string;
  itinerary?: Itinerary;
  /** Real-time forecast — overrides static weather when provided */
  weatherForecast?: WeatherForecast;
}): PackingList {
  const { destination, days, vibes, budget, itinerary, weatherForecast } = params;
  const weather = weatherForecast
    ? weatherFromForecast(weatherForecast)
    : getWeather(destination);
  const categories: PackingCategory[] = [];
  const proTips: string[] = [];
  const skipList: string[] = [];

  // Detect activity types from vibes + itinerary
  const activities = detectActivities(vibes, itinerary);

  // -------------------------------------------------------------------------
  // 1. CLOTHING
  // -------------------------------------------------------------------------
  const clothing: PackingItem[] = [];
  const needsWarm = weather.avgTempC < 15;
  const needsHot = weather.avgTempC > 25;
  const needsRain = weather.rainyDays >= 3;

  // Basics
  const topsCount = Math.min(days, 7);
  const bottomsCount = Math.min(Math.ceil(days / 2), 4);
  clothing.push({ name: 'T-shirts / tops', quantity: topsCount, essential: true });
  clothing.push({ name: 'Underwear', quantity: Math.min(days + 1, 8), essential: true });
  clothing.push({ name: 'Socks', quantity: Math.min(days, 7), essential: true });
  clothing.push({ name: 'Pants / shorts', quantity: bottomsCount, essential: true });
  clothing.push({ name: 'Sleepwear', quantity: 1, essential: false });

  // Weather-specific
  if (needsWarm) {
    clothing.push({ name: 'Warm jacket', quantity: 1, essential: true, reason: `Avg ${weather.avgTempC}°C` });
    clothing.push({ name: 'Long-sleeve layers', quantity: 2, essential: true });
    if (weather.avgTempC < 5) {
      clothing.push({ name: 'Thermal base layer', quantity: 1, essential: true, reason: 'Near freezing temps' });
      clothing.push({ name: 'Warm hat + gloves', quantity: 1, essential: true });
    }
  }
  if (needsHot) {
    clothing.push({ name: 'Light breathable shirts', quantity: 2, essential: true, reason: 'Hot + humid' });
    clothing.push({ name: 'Sunhat', quantity: 1, essential: true });
  }
  if (needsRain) {
    clothing.push({ name: 'Rain jacket or packable umbrella', quantity: 1, essential: true, reason: `${weather.rainyDays} rainy days expected` });
  }

  // Activity-specific clothing
  if (activities.has('hiking') || activities.has('trekking')) {
    clothing.push({ name: 'Hiking boots', quantity: 1, essential: true });
    clothing.push({ name: 'Quick-dry athletic wear', quantity: 2, essential: true });
  }
  if (activities.has('nightlife') || activities.has('dining')) {
    clothing.push({ name: 'Going-out outfit', quantity: 1, essential: false, reason: 'For nightlife/dinner spots' });
  }
  if (activities.has('beach') || activities.has('swimming')) {
    clothing.push({ name: 'Swimsuit', quantity: 2, essential: true });
    clothing.push({ name: 'Cover-up / sarong', quantity: 1, essential: false });
  }
  if (activities.has('temple') || activities.has('religious')) {
    clothing.push({ name: 'Modest clothing (covers shoulders + knees)', quantity: 1, essential: true, reason: 'Required for temple visits' });
  }

  categories.push({ name: 'Clothing', emoji: '', items: clothing });

  // -------------------------------------------------------------------------
  // 2. TOILETRIES
  // -------------------------------------------------------------------------
  const toiletries: PackingItem[] = [
    { name: 'Toothbrush + toothpaste', quantity: 1, essential: true },
    { name: 'Deodorant', quantity: 1, essential: true },
    { name: 'Shampoo (travel size)', quantity: 1, essential: true },
    { name: 'Sunscreen', quantity: 1, essential: needsHot || weather.avgTempC > 20 },
  ];
  if (weather.humid) {
    toiletries.push({ name: 'Anti-humidity hair product', quantity: 1, essential: false, reason: 'High humidity' });
  }
  if (activities.has('hiking') || activities.has('outdoors')) {
    toiletries.push({ name: 'Insect repellent', quantity: 1, essential: true });
  }
  categories.push({ name: 'Toiletries', emoji: '', items: toiletries });

  // -------------------------------------------------------------------------
  // 3. TECH
  // -------------------------------------------------------------------------
  const tech: PackingItem[] = [
    { name: 'Phone charger', quantity: 1, essential: true },
    { name: 'Power adapter', quantity: 1, essential: true, reason: `Check plug type for ${destination}` },
    { name: 'Portable battery pack', quantity: 1, essential: true },
    { name: 'Earbuds / headphones', quantity: 1, essential: false },
  ];
  if (activities.has('photography')) {
    tech.push({ name: 'Camera + charger', quantity: 1, essential: false });
  }
  if (activities.has('digital-nomad') || activities.has('working')) {
    tech.push({ name: 'Laptop + charger', quantity: 1, essential: true });
    tech.push({ name: 'USB-C hub / dongle', quantity: 1, essential: false });
  }
  categories.push({ name: 'Tech', emoji: '🔌', items: tech });

  // -------------------------------------------------------------------------
  // 4. DOCUMENTS
  // -------------------------------------------------------------------------
  const docs: PackingItem[] = [
    { name: 'Passport', quantity: 1, essential: true },
    { name: 'Travel insurance details', quantity: 1, essential: true },
    { name: 'Flight confirmation (saved offline)', quantity: 1, essential: true },
    { name: 'Hotel booking confirmation', quantity: 1, essential: true },
  ];
  categories.push({ name: 'Documents', emoji: '', items: docs });

  // -------------------------------------------------------------------------
  // 5. EXTRAS (activity-specific)
  // -------------------------------------------------------------------------
  const extras: PackingItem[] = [];
  if (activities.has('hiking')) {
    extras.push({ name: 'Daypack (20-30L)', quantity: 1, essential: true });
    extras.push({ name: 'Water bottle', quantity: 1, essential: true });
  }
  if (activities.has('beach')) {
    extras.push({ name: 'Beach towel (quick-dry)', quantity: 1, essential: false });
    extras.push({ name: 'Snorkel gear', quantity: 1, essential: false });
  }
  if (activities.has('food-tour')) {
    extras.push({ name: 'Antacids / digestive aids', quantity: 1, essential: false, reason: 'For adventurous eating' });
  }
  if (days >= 7) {
    extras.push({ name: 'Laundry bag + detergent sheets', quantity: 1, essential: false, reason: `${days} days — you will need to do laundry` });
  }
  extras.push({ name: 'Packing cubes', quantity: 1, essential: false });
  extras.push({ name: 'Earplugs + sleep mask', quantity: 1, essential: false });

  if (extras.length > 0) {
    categories.push({ name: 'Extras', emoji: '', items: extras });
  }

  // -------------------------------------------------------------------------
  // Pro Tips
  // -------------------------------------------------------------------------
  if (budget === 'backpacker') {
    proTips.push('Pack light — you will thank yourself on every bus/train/walk');
    proTips.push('Bring a padlock for hostel lockers');
  }
  if (needsHot && weather.humid) {
    proTips.push('Cotton dries slowly in humidity — bring synthetic fabrics');
  }
  if (weather.rainyDays >= 4) {
    proTips.push(`Expect rain ${weather.rainyDays} out of ${days} days — waterproof your electronics`);
  }
  if (days <= 3) {
    proTips.push('For a short trip, pack carry-on only — skip the checked bag line');
  }
  if (days >= 14) {
    proTips.push('For 2+ week trips, plan to do laundry instead of packing more clothes');
  }

  // -------------------------------------------------------------------------
  // Skip List
  // -------------------------------------------------------------------------
  const cheapDests = ['bangkok', 'bali', 'mexico city', 'marrakech', 'buenos aires'];
  if (cheapDests.includes(destination.toLowerCase())) {
    skipList.push(`Toiletries — ${destination} has cheap pharmacies everywhere`);
    skipList.push(`Flip flops — buy them locally for a fraction of the price`);
  }
  if (needsHot) {
    skipList.push('Heavy jacket — you will not need it');
    skipList.push('Jeans — too hot and takes forever to dry');
  }
  if (!activities.has('hiking') && !activities.has('trekking')) {
    skipList.push('Hiking boots — walking shoes are enough');
  }

  // Count total items
  const totalItems = categories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  return { destination, days, categories, proTips, skipList, totalItems };
}

// ---------------------------------------------------------------------------
// Activity detection
// ---------------------------------------------------------------------------
function detectActivities(vibes: string[], itinerary?: Itinerary): Set<string> {
  const activities = new Set<string>();

  // From vibes
  for (const v of vibes) {
    const lower = v.toLowerCase();
    if (lower.includes('hik') || lower.includes('trek')) activities.add('hiking');
    if (lower.includes('beach') || lower.includes('surf')) activities.add('beach');
    if (lower.includes('food') || lower.includes('culinar') || lower.includes('street food')) activities.add('food-tour');
    if (lower.includes('night') || lower.includes('bar') || lower.includes('club')) activities.add('nightlife');
    if (lower.includes('temple') || lower.includes('shrine') || lower.includes('mosque')) activities.add('temple');
    if (lower.includes('photo')) activities.add('photography');
    if (lower.includes('nomad') || lower.includes('remote') || lower.includes('cowork')) activities.add('digital-nomad');
    if (lower.includes('swim') || lower.includes('dive') || lower.includes('snorkel')) activities.add('swimming');
    if (lower.includes('dine') || lower.includes('dinner') || lower.includes('restaurant')) activities.add('dining');
    if (lower.includes('culture') || lower.includes('museum') || lower.includes('art')) activities.add('culture');
    if (lower.includes('adventure') || lower.includes('outdoor')) activities.add('outdoors');
  }

  // From itinerary content (if available)
  if (itinerary?.days) {
    for (const day of itinerary.days) {
      const slots = [day.morning, day.afternoon, day.evening].filter(Boolean);
      for (const slot of slots) {
        const text = (slot?.activity ?? '').toLowerCase();
        if (text.includes('hik') || text.includes('trek')) activities.add('hiking');
        if (text.includes('beach') || text.includes('surf')) activities.add('beach');
        if (text.includes('temple') || text.includes('shrine')) activities.add('temple');
        if (text.includes('market') || text.includes('food')) activities.add('food-tour');
        if (text.includes('museum') || text.includes('gallery')) activities.add('culture');
      }
    }
  }

  return activities;
}
