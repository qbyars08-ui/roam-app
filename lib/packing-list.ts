// =============================================================================
// ROAM — Smart Packing List Engine
// Generates personalized packing recommendations based on destination, weather,
// activities, and trip duration. Persists checked state to AsyncStorage.
// =============================================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeatherIntel } from './apis/openweather';
import type { Itinerary } from './types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type PackingCategory =
  | 'clothing'
  | 'toiletries'
  | 'electronics'
  | 'documents'
  | 'health'
  | 'misc';

export interface PackingItem {
  readonly id: string;
  readonly name: string;
  readonly category: PackingCategory;
  readonly essential: boolean;
  readonly weatherDependent: boolean;
  readonly activityDependent: boolean;
  readonly reason?: string;
}

export interface PackingListResult {
  readonly items: readonly PackingItem[];
  readonly proTips: readonly string[];
  readonly skipList: readonly string[];
}

export interface PackingPreferences {
  readonly includeWorkGear?: boolean;
  readonly includePhotographyGear?: boolean;
  readonly minimalist?: boolean;
}

// ---------------------------------------------------------------------------
// Category labels (for UI display)
// ---------------------------------------------------------------------------
export const CATEGORY_LABELS: Record<PackingCategory, string> = {
  clothing: 'Clothing',
  toiletries: 'Toiletries',
  electronics: 'Electronics',
  documents: 'Documents',
  health: 'Health',
  misc: 'Misc',
};

export const CATEGORY_ORDER: readonly PackingCategory[] = [
  'clothing',
  'toiletries',
  'electronics',
  'documents',
  'health',
  'misc',
];

// ---------------------------------------------------------------------------
// AsyncStorage keys
// ---------------------------------------------------------------------------
const CHECKED_PREFIX = 'roam_packv2_checked_';
const CUSTOM_ITEMS_PREFIX = 'roam_packv2_custom_';

// ---------------------------------------------------------------------------
// Activity detection from itinerary + vibes
// ---------------------------------------------------------------------------
function detectActivities(
  activities: readonly string[],
  itinerary?: Itinerary | null
): Set<string> {
  const result = new Set<string>();

  for (const v of activities) {
    const lower = v.toLowerCase();
    if (lower.includes('hik') || lower.includes('trek')) result.add('hiking');
    if (lower.includes('beach') || lower.includes('surf')) result.add('beach');
    if (lower.includes('food') || lower.includes('culinar')) result.add('food-tour');
    if (lower.includes('night') || lower.includes('bar') || lower.includes('club')) result.add('nightlife');
    if (lower.includes('temple') || lower.includes('shrine') || lower.includes('mosque')) result.add('temple');
    if (lower.includes('photo')) result.add('photography');
    if (lower.includes('nomad') || lower.includes('remote') || lower.includes('cowork')) result.add('digital-nomad');
    if (lower.includes('swim') || lower.includes('dive') || lower.includes('snorkel')) result.add('swimming');
    if (lower.includes('dine') || lower.includes('dinner') || lower.includes('restaurant') || lower.includes('fine dining')) result.add('dining');
    if (lower.includes('adventure') || lower.includes('outdoor')) result.add('outdoors');
    if (lower.includes('wellness') || lower.includes('spa') || lower.includes('yoga')) result.add('wellness');
    if (lower.includes('ski') || lower.includes('snow')) result.add('skiing');
  }

  if (itinerary?.days) {
    for (const day of itinerary.days) {
      const slots = [day.morning, day.afternoon, day.evening].filter(Boolean);
      for (const slot of slots) {
        const text = (slot?.activity ?? '').toLowerCase();
        if (text.includes('hik') || text.includes('trek')) result.add('hiking');
        if (text.includes('beach') || text.includes('surf')) result.add('beach');
        if (text.includes('temple') || text.includes('shrine')) result.add('temple');
        if (text.includes('market') || text.includes('food')) result.add('food-tour');
        if (text.includes('museum') || text.includes('gallery')) result.add('culture');
        if (text.includes('fine dining') || text.includes('dinner')) result.add('dining');
        if (text.includes('swim') || text.includes('snorkel')) result.add('swimming');
        if (text.includes('spa') || text.includes('yoga')) result.add('wellness');
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Weather analysis helpers
// ---------------------------------------------------------------------------
interface WeatherContext {
  readonly avgTempC: number;
  readonly minTempC: number;
  readonly maxTempC: number;
  readonly rainyDays: number;
  readonly humid: boolean;
  readonly hasHighUV: boolean;
}

function analyzeWeather(weather: WeatherIntel | null): WeatherContext {
  if (!weather?.days?.length) {
    return { avgTempC: 20, minTempC: 15, maxTempC: 25, rainyDays: 2, humid: false, hasHighUV: false };
  }

  const temps = weather.days.map((d) => (d.tempHigh + d.tempLow) / 2);
  const avgTempC = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  const minTempC = Math.round(Math.min(...weather.days.map((d) => d.tempLow)));
  const maxTempC = Math.round(Math.max(...weather.days.map((d) => d.tempHigh)));
  const rainyDays = weather.days.filter((d) => d.rainChance > 40).length;
  const humid = weather.days.some((d) => d.humidity > 70);
  const hasHighUV = maxTempC > 28;

  return { avgTempC, minTempC, maxTempC, rainyDays, humid, hasHighUV };
}

// ---------------------------------------------------------------------------
// Item ID generator
// ---------------------------------------------------------------------------
let itemCounter = 0;
function makeId(category: PackingCategory, name: string): string {
  itemCounter += 1;
  return `${category}-${name.toLowerCase().replace(/\s+/g, '-')}-${itemCounter}`;
}

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------
export function generatePackingList(
  destination: string,
  days: number,
  weather: WeatherIntel | null,
  activities: readonly string[],
  preferences?: PackingPreferences,
  itinerary?: Itinerary | null
): PackingListResult {
  itemCounter = 0;
  const wx = analyzeWeather(weather);
  const acts = detectActivities(activities, itinerary);
  const items: PackingItem[] = [];
  const proTips: string[] = [];
  const skipList: string[] = [];

  const needsWarm = wx.avgTempC < 15;
  const needsHot = wx.avgTempC > 25;
  const needsRain = wx.rainyDays >= 2;
  const isMinimalist = preferences?.minimalist === true;

  // -----------------------------------------------------------------------
  // CLOTHING
  // -----------------------------------------------------------------------
  const topsCount = isMinimalist ? Math.min(days, 4) : Math.min(days, 7);
  const bottomsCount = isMinimalist ? Math.min(Math.ceil(days / 3), 3) : Math.min(Math.ceil(days / 2), 4);

  items.push(
    { id: makeId('clothing', 'tops'), name: `T-shirts / tops (${topsCount})`, category: 'clothing', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('clothing', 'underwear'), name: `Underwear (${Math.min(days + 1, 8)})`, category: 'clothing', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('clothing', 'socks'), name: `Socks (${Math.min(days, 7)})`, category: 'clothing', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('clothing', 'bottoms'), name: `Pants / shorts (${bottomsCount})`, category: 'clothing', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('clothing', 'walking-shoes'), name: 'Walking shoes', category: 'clothing', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('clothing', 'sleepwear'), name: 'Sleepwear', category: 'clothing', essential: false, weatherDependent: false, activityDependent: false },
  );

  if (needsWarm) {
    items.push(
      { id: makeId('clothing', 'warm-jacket'), name: 'Warm jacket', category: 'clothing', essential: true, weatherDependent: true, activityDependent: false, reason: `Avg ${wx.avgTempC}°C` },
      { id: makeId('clothing', 'layers'), name: 'Long-sleeve layers (2)', category: 'clothing', essential: true, weatherDependent: true, activityDependent: false },
    );
    if (wx.minTempC < 5) {
      items.push(
        { id: makeId('clothing', 'thermal'), name: 'Thermal base layer', category: 'clothing', essential: true, weatherDependent: true, activityDependent: false, reason: 'Near freezing temps' },
        { id: makeId('clothing', 'hat-gloves'), name: 'Warm hat + gloves', category: 'clothing', essential: true, weatherDependent: true, activityDependent: false },
      );
    }
  }

  if (needsHot) {
    items.push(
      { id: makeId('clothing', 'breathable'), name: 'Light breathable shirts (2)', category: 'clothing', essential: true, weatherDependent: true, activityDependent: false, reason: 'Hot climate' },
      { id: makeId('clothing', 'sunhat'), name: 'Sun hat', category: 'clothing', essential: true, weatherDependent: true, activityDependent: false },
    );
  }

  if (needsRain) {
    items.push({
      id: makeId('clothing', 'rain-gear'), name: 'Rain jacket or packable umbrella', category: 'clothing', essential: true, weatherDependent: true, activityDependent: false,
      reason: `${wx.rainyDays} rainy days in forecast`,
    });
  }

  if (acts.has('hiking') || acts.has('outdoors')) {
    items.push(
      { id: makeId('clothing', 'hiking-boots'), name: 'Hiking boots', category: 'clothing', essential: true, weatherDependent: false, activityDependent: true, reason: 'Outdoor activities planned' },
      { id: makeId('clothing', 'athletic'), name: 'Quick-dry athletic wear (2)', category: 'clothing', essential: true, weatherDependent: false, activityDependent: true },
    );
  }

  if (acts.has('nightlife') || acts.has('dining')) {
    items.push({
      id: makeId('clothing', 'going-out'), name: 'Going-out outfit', category: 'clothing', essential: false, weatherDependent: false, activityDependent: true, reason: 'For restaurants/nightlife',
    });
  }

  if (acts.has('beach') || acts.has('swimming')) {
    items.push(
      { id: makeId('clothing', 'swimsuit'), name: 'Swimsuit (2)', category: 'clothing', essential: true, weatherDependent: false, activityDependent: true },
      { id: makeId('clothing', 'coverup'), name: 'Cover-up / sarong', category: 'clothing', essential: false, weatherDependent: false, activityDependent: true },
    );
  }

  if (acts.has('temple')) {
    items.push({
      id: makeId('clothing', 'modest'), name: 'Modest clothing (covers shoulders + knees)', category: 'clothing', essential: true, weatherDependent: false, activityDependent: true, reason: 'Required for temple visits',
    });
  }

  if (acts.has('skiing')) {
    items.push(
      { id: makeId('clothing', 'ski-jacket'), name: 'Ski jacket', category: 'clothing', essential: true, weatherDependent: true, activityDependent: true },
      { id: makeId('clothing', 'ski-pants'), name: 'Ski pants', category: 'clothing', essential: true, weatherDependent: true, activityDependent: true },
    );
  }

  // -----------------------------------------------------------------------
  // TOILETRIES
  // -----------------------------------------------------------------------
  items.push(
    { id: makeId('toiletries', 'toothbrush'), name: 'Toothbrush + toothpaste', category: 'toiletries', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('toiletries', 'deodorant'), name: 'Deodorant', category: 'toiletries', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('toiletries', 'shampoo'), name: 'Shampoo (travel size)', category: 'toiletries', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('toiletries', 'lip-balm'), name: 'Lip balm', category: 'toiletries', essential: false, weatherDependent: false, activityDependent: false },
  );

  if (needsHot || wx.hasHighUV) {
    items.push({
      id: makeId('toiletries', 'sunscreen'), name: 'Sunscreen (SPF 50+)', category: 'toiletries', essential: true, weatherDependent: true, activityDependent: false,
      reason: `High UV — max ${wx.maxTempC}°C`,
    });
  }

  if (wx.humid) {
    items.push({
      id: makeId('toiletries', 'anti-humidity'), name: 'Anti-humidity product', category: 'toiletries', essential: false, weatherDependent: true, activityDependent: false, reason: 'High humidity expected',
    });
  }

  if (acts.has('hiking') || acts.has('outdoors') || acts.has('beach')) {
    items.push({
      id: makeId('toiletries', 'insect-repellent'), name: 'Insect repellent', category: 'toiletries', essential: true, weatherDependent: false, activityDependent: true,
    });
  }

  // -----------------------------------------------------------------------
  // ELECTRONICS
  // -----------------------------------------------------------------------
  items.push(
    { id: makeId('electronics', 'phone-charger'), name: 'Phone charger', category: 'electronics', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('electronics', 'power-adapter'), name: 'Power adapter', category: 'electronics', essential: true, weatherDependent: false, activityDependent: false, reason: `Check plug type for ${destination}` },
    { id: makeId('electronics', 'battery-pack'), name: 'Portable battery pack', category: 'electronics', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('electronics', 'earbuds'), name: 'Earbuds / headphones', category: 'electronics', essential: false, weatherDependent: false, activityDependent: false },
  );

  if (preferences?.includePhotographyGear || acts.has('photography')) {
    items.push(
      { id: makeId('electronics', 'camera'), name: 'Camera + charger', category: 'electronics', essential: false, weatherDependent: false, activityDependent: true },
    );
  }

  if (preferences?.includeWorkGear || acts.has('digital-nomad')) {
    items.push(
      { id: makeId('electronics', 'laptop'), name: 'Laptop + charger', category: 'electronics', essential: true, weatherDependent: false, activityDependent: true },
      { id: makeId('electronics', 'usb-hub'), name: 'USB-C hub / dongle', category: 'electronics', essential: false, weatherDependent: false, activityDependent: true },
    );
  }

  // -----------------------------------------------------------------------
  // DOCUMENTS
  // -----------------------------------------------------------------------
  items.push(
    { id: makeId('documents', 'passport'), name: 'Passport / ID', category: 'documents', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('documents', 'insurance'), name: 'Travel insurance details', category: 'documents', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('documents', 'flight'), name: 'Flight confirmation (offline)', category: 'documents', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('documents', 'hotel'), name: 'Hotel booking confirmation', category: 'documents', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('documents', 'copies'), name: 'Copies of important docs', category: 'documents', essential: false, weatherDependent: false, activityDependent: false },
  );

  // -----------------------------------------------------------------------
  // HEALTH
  // -----------------------------------------------------------------------
  items.push(
    { id: makeId('health', 'first-aid'), name: 'Basic first aid kit', category: 'health', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('health', 'medications'), name: 'Personal medications', category: 'health', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('health', 'hand-sanitizer'), name: 'Hand sanitizer', category: 'health', essential: false, weatherDependent: false, activityDependent: false },
  );

  if (acts.has('food-tour')) {
    items.push({
      id: makeId('health', 'antacids'), name: 'Antacids / digestive aids', category: 'health', essential: false, weatherDependent: false, activityDependent: true, reason: 'For adventurous eating',
    });
  }

  if (acts.has('hiking') || acts.has('outdoors')) {
    items.push({
      id: makeId('health', 'blister-pads'), name: 'Blister pads', category: 'health', essential: false, weatherDependent: false, activityDependent: true,
    });
  }

  // -----------------------------------------------------------------------
  // MISC
  // -----------------------------------------------------------------------
  items.push(
    { id: makeId('misc', 'water-bottle'), name: 'Reusable water bottle', category: 'misc', essential: true, weatherDependent: false, activityDependent: false },
    { id: makeId('misc', 'packing-cubes'), name: 'Packing cubes', category: 'misc', essential: false, weatherDependent: false, activityDependent: false },
    { id: makeId('misc', 'earplugs'), name: 'Earplugs + sleep mask', category: 'misc', essential: false, weatherDependent: false, activityDependent: false },
    { id: makeId('misc', 'tote-bag'), name: 'Tote bag / day bag', category: 'misc', essential: false, weatherDependent: false, activityDependent: false },
  );

  if (acts.has('hiking')) {
    items.push({
      id: makeId('misc', 'daypack'), name: 'Daypack (20-30L)', category: 'misc', essential: true, weatherDependent: false, activityDependent: true,
    });
  }

  if (acts.has('beach')) {
    items.push(
      { id: makeId('misc', 'beach-towel'), name: 'Beach towel (quick-dry)', category: 'misc', essential: false, weatherDependent: false, activityDependent: true },
    );
  }

  if (days >= 7 && !isMinimalist) {
    items.push({
      id: makeId('misc', 'laundry'), name: 'Laundry bag + detergent sheets', category: 'misc', essential: false, weatherDependent: false, activityDependent: false,
      reason: `${days} days — plan to do laundry`,
    });
  }

  // -----------------------------------------------------------------------
  // Pro Tips
  // -----------------------------------------------------------------------
  if (needsHot && wx.humid) {
    proTips.push('Cotton dries slowly in humidity — bring synthetic fabrics');
  }
  if (wx.rainyDays >= 4) {
    proTips.push(`Expect rain ${wx.rainyDays} days — waterproof your electronics`);
  }
  if (days <= 3) {
    proTips.push('For a short trip, pack carry-on only — skip the checked bag line');
  }
  if (days >= 14) {
    proTips.push('For 2+ week trips, plan to do laundry instead of packing more');
  }

  // -----------------------------------------------------------------------
  // Skip list
  // -----------------------------------------------------------------------
  const cheapDests = ['bangkok', 'bali', 'mexico city', 'marrakech', 'buenos aires', 'chiang mai', 'hoi an'];
  if (cheapDests.includes(destination.toLowerCase())) {
    skipList.push(`Toiletries — ${destination} has cheap pharmacies everywhere`);
  }
  if (needsHot) {
    skipList.push('Heavy jacket — you will not need it');
  }
  if (!acts.has('hiking') && !acts.has('outdoors')) {
    skipList.push('Hiking boots — walking shoes are enough');
  }

  return { items, proTips, skipList };
}

// ---------------------------------------------------------------------------
// usePackingList hook
// ---------------------------------------------------------------------------
export interface UsePackingListReturn {
  readonly items: readonly PackingItem[];
  readonly customItems: readonly PackingItem[];
  readonly allItems: readonly PackingItem[];
  readonly checkedIds: ReadonlySet<string>;
  readonly proTips: readonly string[];
  readonly skipList: readonly string[];
  readonly totalCount: number;
  readonly checkedCount: number;
  readonly progressPercent: number;
  readonly toggleItem: (id: string) => void;
  readonly addCustomItem: (name: string, category: PackingCategory) => void;
  readonly removeCustomItem: (id: string) => void;
}

export function usePackingList(
  tripId: string | undefined,
  destination: string,
  days: number,
  weather: WeatherIntel | null,
  activities: readonly string[],
  preferences?: PackingPreferences,
  itinerary?: Itinerary | null
): UsePackingListReturn {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<PackingItem[]>([]);

  // Generate the packing list (memoized)
  const generated = useMemo(
    () => generatePackingList(destination, days, weather, activities, preferences, itinerary),
    [destination, days, weather, activities, preferences, itinerary]
  );

  // Load persisted checked state
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CHECKED_PREFIX + tripId);
        if (raw && !cancelled) {
          setCheckedIds(new Set(JSON.parse(raw) as string[]));
        }
      } catch {
        // silent — best effort
      }
    })();
    return () => { cancelled = true; };
  }, [tripId]);

  // Load persisted custom items
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CUSTOM_ITEMS_PREFIX + tripId);
        if (raw && !cancelled) {
          setCustomItems(JSON.parse(raw) as PackingItem[]);
        }
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, [tripId]);

  // Persist checked state on change
  useEffect(() => {
    if (!tripId || checkedIds.size === 0) return;
    AsyncStorage.setItem(CHECKED_PREFIX + tripId, JSON.stringify([...checkedIds])).catch(() => {});
  }, [tripId, checkedIds]);

  // Persist custom items on change
  useEffect(() => {
    if (!tripId) return;
    AsyncStorage.setItem(CUSTOM_ITEMS_PREFIX + tripId, JSON.stringify(customItems)).catch(() => {});
  }, [tripId, customItems]);

  const allItems = useMemo(
    () => [...generated.items, ...customItems],
    [generated.items, customItems]
  );

  const totalCount = allItems.length;
  const checkedCount = useMemo(
    () => allItems.filter((i) => checkedIds.has(i.id)).length,
    [allItems, checkedIds]
  );
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const toggleItem = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const addCustomItem = useCallback((name: string, category: PackingCategory) => {
    const newItem: PackingItem = {
      id: `custom-${category}-${Date.now()}`,
      name,
      category,
      essential: false,
      weatherDependent: false,
      activityDependent: false,
    };
    setCustomItems((prev) => [...prev, newItem]);
  }, []);

  const removeCustomItem = useCallback((id: string) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
    setCheckedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    items: generated.items,
    customItems,
    allItems,
    checkedIds,
    proTips: generated.proTips,
    skipList: generated.skipList,
    totalCount,
    checkedCount,
    progressPercent,
    toggleItem,
    addCustomItem,
    removeCustomItem,
  };
}
