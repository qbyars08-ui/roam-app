// =============================================================================
// ROAM — Smart Packing Engine
// Context-aware packing list generation: weather, duration, activities,
// destination-specific gear, plug types, and travel style.
// =============================================================================
import type { WeatherIntel } from './apis/openweather';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type PackingCategory =
  | 'essentials'
  | 'clothing'
  | 'toiletries'
  | 'tech'
  | 'documents'
  | 'destination_specific';

export interface PackingItem {
  readonly name: string;
  readonly category: PackingCategory;
  readonly quantity: number;
  readonly reason: string;
  readonly priority: 'must_have' | 'recommended' | 'nice_to_have';
  readonly packed: boolean;
}

export type TravelStyle = 'backpacker' | 'comfort' | 'luxury';

export interface PlugInfo {
  readonly plugType: string;
  readonly voltage: string;
  readonly adapterNeeded: boolean;
  readonly notes: string;
}

interface DestinationData {
  readonly country: string;
  readonly plugType: string;
  readonly voltage: string;
  readonly culturalItems: readonly string[];
  readonly gearTips: readonly string[];
}

// ---------------------------------------------------------------------------
// Curated destination data (10 destinations)
// ---------------------------------------------------------------------------
const DESTINATION_DB: Record<string, DestinationData> = {
  tokyo: {
    country: 'JP', plugType: 'A/B', voltage: '100V',
    culturalItems: ['Indoor slippers (ryokan stays)', 'Coin purse (cash-heavy culture)'],
    gearTips: ['IC card for trains (Suica/Pasmo)', 'Pocket Wi-Fi or eSIM'],
  },
  bali: {
    country: 'ID', plugType: 'C/F', voltage: '230V',
    culturalItems: ['Sarong for temple visits', 'Modest top (shoulders covered)'],
    gearTips: ['Reef-safe sunscreen', 'Waterproof phone pouch'],
  },
  paris: {
    country: 'FR', plugType: 'C/E', voltage: '230V',
    culturalItems: ['Smart-casual outfit for restaurants', 'Scarf (Parisians never skip it)'],
    gearTips: ['Museum pass printout', 'Reusable tote for boulangerie runs'],
  },
  bangkok: {
    country: 'TH', plugType: 'A/B/C/O', voltage: '220V',
    culturalItems: ['Sarong or shawl for temples', 'Closed-toe shoes for Grand Palace'],
    gearTips: ['Mosquito repellent (DEET)', 'Dry bag for tuk-tuk rain'],
  },
  london: {
    country: 'GB', plugType: 'G', voltage: '230V',
    culturalItems: ['Umbrella (non-negotiable)', 'Layers for unpredictable weather'],
    gearTips: ['Oyster card or contactless payment', 'Compact umbrella'],
  },
  marrakech: {
    country: 'MA', plugType: 'C/E', voltage: '220V',
    culturalItems: ['Headscarf (women, for mosques)', 'Modest clothing (knees and shoulders)'],
    gearTips: ['Small bills for haggling', 'Dust mask for medina alleys'],
  },
  'new york': {
    country: 'US', plugType: 'A/B', voltage: '120V',
    culturalItems: ['Comfortable walking shoes (you will walk 15k+ steps)', 'Broadway-ready outfit'],
    gearTips: ['MetroCard or OMNY tap', 'Portable charger (long days)'],
  },
  rome: {
    country: 'IT', plugType: 'C/F/L', voltage: '230V',
    culturalItems: ['Covered shoulders for churches', 'No shorts in Vatican'],
    gearTips: ['Refillable bottle (free fountains everywhere)', 'Comfortable cobblestone shoes'],
  },
  dubai: {
    country: 'AE', plugType: 'G', voltage: '220V',
    culturalItems: ['Modest swimwear for public beaches', 'Scarf for mosque visits'],
    gearTips: ['SPF 50+ (desert UV is extreme)', 'Light cardigan for over-AC indoors'],
  },
  seoul: {
    country: 'KR', plugType: 'C/F', voltage: '220V',
    culturalItems: ['Slip-on shoes (frequent shoe removal)', 'Socks without holes'],
    gearTips: ['T-money card for transit', 'Portable Wi-Fi egg rental'],
  },
};

// ---------------------------------------------------------------------------
// Plug type lookup (broader country coverage)
// ---------------------------------------------------------------------------
const COUNTRY_PLUG_MAP: Record<string, PlugInfo> = {
  US: { plugType: 'A/B', voltage: '120V', adapterNeeded: false, notes: 'Standard US plugs' },
  GB: { plugType: 'G', voltage: '230V', adapterNeeded: true, notes: 'UK 3-pin required' },
  EU: { plugType: 'C/F', voltage: '230V', adapterNeeded: true, notes: 'Standard Euro round pins' },
  JP: { plugType: 'A/B', voltage: '100V', adapterNeeded: false, notes: 'US plugs fit but voltage is 100V' },
  AU: { plugType: 'I', voltage: '230V', adapterNeeded: true, notes: 'Australian angled pins' },
  IN: { plugType: 'C/D/M', voltage: '230V', adapterNeeded: true, notes: 'Multiple plug types in use' },
  CN: { plugType: 'A/C/I', voltage: '220V', adapterNeeded: true, notes: 'Universal adapter recommended' },
  BR: { plugType: 'N', voltage: '127/220V', adapterNeeded: true, notes: 'Unique Brazilian standard' },
  TH: { plugType: 'A/B/C/O', voltage: '220V', adapterNeeded: true, notes: 'Mixed plug types' },
  ZA: { plugType: 'M/N', voltage: '230V', adapterNeeded: true, notes: 'South African round 3-pin' },
};

const DEST_TO_REGION: Record<string, string> = {
  tokyo: 'JP', kyoto: 'JP', osaka: 'JP',
  london: 'GB', edinburgh: 'GB',
  paris: 'FR', barcelona: 'EU', rome: 'EU', amsterdam: 'EU', lisbon: 'EU',
  berlin: 'EU', prague: 'EU', budapest: 'EU', dubrovnik: 'EU', porto: 'EU',
  bangkok: 'TH', 'chiang mai': 'TH',
  bali: 'EU', 'new york': 'US', 'mexico city': 'US',
  sydney: 'AU', melbourne: 'AU', queenstown: 'AU',
  jaipur: 'IN', delhi: 'IN', mumbai: 'IN',
  dubai: 'GB', seoul: 'EU', 'buenos aires': 'EU',
  marrakech: 'EU', 'cape town': 'ZA', istanbul: 'EU',
  'sao paulo': 'BR', rio: 'BR',
  beijing: 'CN', shanghai: 'CN',
};

// ---------------------------------------------------------------------------
// getPlugType
// ---------------------------------------------------------------------------
export function getPlugType(destination: string): PlugInfo {
  const lower = destination.toLowerCase();
  const destData = DESTINATION_DB[lower];
  if (destData) {
    const region = DEST_TO_REGION[lower] ?? 'EU';
    const countryInfo = COUNTRY_PLUG_MAP[region];
    return {
      plugType: destData.plugType,
      voltage: destData.voltage,
      adapterNeeded: region !== 'US',
      notes: countryInfo?.notes ?? `Plug type ${destData.plugType}, ${destData.voltage}`,
    };
  }
  const region = DEST_TO_REGION[lower];
  if (region && COUNTRY_PLUG_MAP[region]) {
    return COUNTRY_PLUG_MAP[region];
  }
  return { plugType: 'Unknown', voltage: 'Unknown', adapterNeeded: true, notes: 'Check adapter before travel' };
}

// ---------------------------------------------------------------------------
// getDestinationEssentials
// ---------------------------------------------------------------------------
export function getDestinationEssentials(destination: string): readonly PackingItem[] {
  const lower = destination.toLowerCase();
  const data = DESTINATION_DB[lower];
  if (!data) return [];

  const items: PackingItem[] = [];
  for (const cultural of data.culturalItems) {
    items.push({
      name: cultural,
      category: 'destination_specific',
      quantity: 1,
      reason: `Cultural norm in ${destination}`,
      priority: 'must_have',
      packed: false,
    });
  }
  for (const tip of data.gearTips) {
    items.push({
      name: tip,
      category: 'destination_specific',
      quantity: 1,
      reason: `Recommended for ${destination}`,
      priority: 'recommended',
      packed: false,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// getWeatherClothing
// ---------------------------------------------------------------------------
export function getWeatherClothing(
  forecast: WeatherIntel | null
): readonly PackingItem[] {
  if (!forecast?.days?.length) return [];

  const items: PackingItem[] = [];
  const temps = forecast.days.map((d) => d.tempHigh);
  const lows = forecast.days.map((d) => d.tempLow);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...lows);
  const rainyDays = forecast.days.filter((d) => d.rainChance > 40);
  const humidDays = forecast.days.filter((d) => d.humidity > 70);

  if (minTemp < 5) {
    items.push({
      name: 'Heavy winter coat', category: 'clothing', quantity: 1,
      reason: `Low of ${Math.round(minTemp)}C expected`, priority: 'must_have', packed: false,
    });
    items.push({
      name: 'Thermal base layer', category: 'clothing', quantity: 2,
      reason: 'Near-freezing temperatures', priority: 'must_have', packed: false,
    });
    items.push({
      name: 'Warm hat + gloves', category: 'clothing', quantity: 1,
      reason: 'Cold weather protection', priority: 'must_have', packed: false,
    });
  } else if (minTemp < 15) {
    items.push({
      name: 'Warm jacket or fleece', category: 'clothing', quantity: 1,
      reason: `Temps drop to ${Math.round(minTemp)}C`, priority: 'must_have', packed: false,
    });
    items.push({
      name: 'Long-sleeve layers', category: 'clothing', quantity: 2,
      reason: 'Layering for cool mornings/evenings', priority: 'recommended', packed: false,
    });
  }

  if (maxTemp > 30) {
    items.push({
      name: 'Light breathable shirts', category: 'clothing', quantity: 3,
      reason: `Highs of ${Math.round(maxTemp)}C`, priority: 'must_have', packed: false,
    });
    items.push({
      name: 'Sun hat', category: 'clothing', quantity: 1,
      reason: 'UV protection in hot weather', priority: 'recommended', packed: false,
    });
    items.push({
      name: 'Sunscreen SPF 50+', category: 'toiletries', quantity: 1,
      reason: `Intense sun expected (${Math.round(maxTemp)}C highs)`, priority: 'must_have', packed: false,
    });
  }

  if (rainyDays.length >= 2) {
    const rainDayNums = rainyDays.map((_, i) => i + 1);
    items.push({
      name: 'Rain jacket or packable umbrella', category: 'clothing', quantity: 1,
      reason: `Rain expected on Day ${rainDayNums.join(', ')}`, priority: 'must_have', packed: false,
    });
  }

  if (humidDays.length >= 3) {
    items.push({
      name: 'Quick-dry fabric clothing', category: 'clothing', quantity: 2,
      reason: 'High humidity — cotton dries slowly', priority: 'recommended', packed: false,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Activity-based items
// ---------------------------------------------------------------------------
function getActivityItems(activities: readonly string[]): readonly PackingItem[] {
  const items: PackingItem[] = [];
  const lower = activities.map((a) => a.toLowerCase());
  const joined = lower.join(' ');

  if (joined.includes('hik') || joined.includes('trek')) {
    items.push(
      { name: 'Hiking boots', category: 'clothing', quantity: 1, reason: 'Hiking in itinerary', priority: 'must_have', packed: false },
      { name: 'Daypack (20-30L)', category: 'essentials', quantity: 1, reason: 'Carry water and snacks on trails', priority: 'must_have', packed: false },
      { name: 'Blister pads', category: 'toiletries', quantity: 1, reason: 'Trail foot care', priority: 'recommended', packed: false },
    );
  }

  if (joined.includes('beach') || joined.includes('surf') || joined.includes('swim') || joined.includes('snorkel')) {
    items.push(
      { name: 'Swimsuit', category: 'clothing', quantity: 2, reason: 'Water activities planned', priority: 'must_have', packed: false },
      { name: 'Quick-dry beach towel', category: 'essentials', quantity: 1, reason: 'Beach / pool days', priority: 'recommended', packed: false },
      { name: 'Waterproof phone pouch', category: 'tech', quantity: 1, reason: 'Protect phone near water', priority: 'recommended', packed: false },
    );
  }

  if (joined.includes('dinner') || joined.includes('fine dining') || joined.includes('fancy')) {
    items.push(
      { name: 'Smart outfit (dinner-ready)', category: 'clothing', quantity: 1, reason: 'Fine dining reservations', priority: 'must_have', packed: false },
      { name: 'Dress shoes or nice flats', category: 'clothing', quantity: 1, reason: 'Restaurant dress codes', priority: 'recommended', packed: false },
    );
  }

  if (joined.includes('temple') || joined.includes('shrine') || joined.includes('mosque')) {
    items.push(
      { name: 'Modest clothing (covers shoulders + knees)', category: 'clothing', quantity: 1, reason: 'Required for religious sites', priority: 'must_have', packed: false },
    );
  }

  if (joined.includes('photo')) {
    items.push(
      { name: 'Camera + charger', category: 'tech', quantity: 1, reason: 'Photography activities', priority: 'recommended', packed: false },
      { name: 'Lens cleaning cloth', category: 'tech', quantity: 1, reason: 'Keep optics clean', priority: 'nice_to_have', packed: false },
    );
  }

  if (joined.includes('ski') || joined.includes('snow')) {
    items.push(
      { name: 'Ski jacket', category: 'clothing', quantity: 1, reason: 'Snow sports', priority: 'must_have', packed: false },
      { name: 'Ski goggles', category: 'essentials', quantity: 1, reason: 'Snow glare protection', priority: 'must_have', packed: false },
    );
  }

  return items;
}

// ---------------------------------------------------------------------------
// Duration-scaled clothing
// ---------------------------------------------------------------------------
function getDurationClothing(days: number, style: TravelStyle): readonly PackingItem[] {
  const isLight = style === 'backpacker';
  const topsCount = isLight ? Math.min(days, 4) : Math.min(days, 7);
  const bottomsCount = isLight ? Math.min(Math.ceil(days / 3), 3) : Math.min(Math.ceil(days / 2), 5);
  const underwearCount = Math.min(days + 1, 8);
  const socksCount = Math.min(days, 7);

  const items: PackingItem[] = [
    { name: 'T-shirts / tops', category: 'clothing', quantity: topsCount, reason: `${days}-day trip`, priority: 'must_have', packed: false },
    { name: 'Pants / shorts', category: 'clothing', quantity: bottomsCount, reason: `${days}-day trip`, priority: 'must_have', packed: false },
    { name: 'Underwear', category: 'clothing', quantity: underwearCount, reason: `${days} days + 1 spare`, priority: 'must_have', packed: false },
    { name: 'Socks', category: 'clothing', quantity: socksCount, reason: `${days}-day trip`, priority: 'must_have', packed: false },
    { name: 'Sleepwear', category: 'clothing', quantity: 1, reason: 'Nightly comfort', priority: 'recommended', packed: false },
  ];

  if (days >= 7) {
    items.push({
      name: 'Laundry bag + detergent sheets', category: 'essentials', quantity: 1,
      reason: `${days} days — do laundry mid-trip instead of overpacking`, priority: 'recommended', packed: false,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Style-based items
// ---------------------------------------------------------------------------
function getStyleItems(style: TravelStyle): readonly PackingItem[] {
  const items: PackingItem[] = [];

  if (style === 'backpacker') {
    items.push(
      { name: 'Packing cubes (compression)', category: 'essentials', quantity: 1, reason: 'Maximize pack space', priority: 'recommended', packed: false },
      { name: 'Microfiber towel', category: 'essentials', quantity: 1, reason: 'Hostels may not provide towels', priority: 'recommended', packed: false },
      { name: 'Padlock for hostel lockers', category: 'essentials', quantity: 1, reason: 'Secure your belongings', priority: 'must_have', packed: false },
    );
  }

  if (style === 'luxury') {
    items.push(
      { name: 'Garment bag or packing folder', category: 'essentials', quantity: 1, reason: 'Keep formal wear wrinkle-free', priority: 'recommended', packed: false },
      { name: 'Noise-cancelling headphones', category: 'tech', quantity: 1, reason: 'Premium travel comfort', priority: 'recommended', packed: false },
    );
  }

  return items;
}

// ---------------------------------------------------------------------------
// Universal essentials
// ---------------------------------------------------------------------------
function getUniversalEssentials(): readonly PackingItem[] {
  return [
    { name: 'Passport / ID', category: 'documents', quantity: 1, reason: 'Required for travel', priority: 'must_have', packed: false },
    { name: 'Travel insurance details', category: 'documents', quantity: 1, reason: 'Keep accessible offline', priority: 'must_have', packed: false },
    { name: 'Flight confirmation (offline)', category: 'documents', quantity: 1, reason: 'Airport check-in backup', priority: 'must_have', packed: false },
    { name: 'Hotel booking confirmation', category: 'documents', quantity: 1, reason: 'Offline access', priority: 'must_have', packed: false },
    { name: 'Phone charger', category: 'tech', quantity: 1, reason: 'Daily essential', priority: 'must_have', packed: false },
    { name: 'Portable battery pack', category: 'tech', quantity: 1, reason: 'Long days exploring', priority: 'must_have', packed: false },
    { name: 'Earbuds', category: 'tech', quantity: 1, reason: 'Flights and transit', priority: 'recommended', packed: false },
    { name: 'Toothbrush + toothpaste', category: 'toiletries', quantity: 1, reason: 'Daily hygiene', priority: 'must_have', packed: false },
    { name: 'Deodorant', category: 'toiletries', quantity: 1, reason: 'Daily hygiene', priority: 'must_have', packed: false },
    { name: 'Reusable water bottle', category: 'essentials', quantity: 1, reason: 'Stay hydrated, reduce waste', priority: 'must_have', packed: false },
    { name: 'Walking shoes', category: 'clothing', quantity: 1, reason: 'Primary footwear', priority: 'must_have', packed: false },
    { name: 'Personal medications', category: 'essentials', quantity: 1, reason: 'Health essentials', priority: 'must_have', packed: false },
    { name: 'Earplugs + sleep mask', category: 'essentials', quantity: 1, reason: 'Better sleep anywhere', priority: 'nice_to_have', packed: false },
  ];
}

// ---------------------------------------------------------------------------
// Deduplicate by name (keeps first occurrence)
// ---------------------------------------------------------------------------
function deduplicateItems(items: readonly PackingItem[]): readonly PackingItem[] {
  const seen = new Set<string>();
  const result: PackingItem[] = [];
  for (const item of items) {
    const key = item.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// generatePackingList — main export
// ---------------------------------------------------------------------------
export function generatePackingList(
  destination: string,
  days: number,
  weather?: WeatherIntel | null,
  activities?: readonly string[],
  style?: TravelStyle,
): readonly PackingItem[] {
  const travelStyle = style ?? 'comfort';
  const acts = activities ?? [];

  const allItems: PackingItem[] = [
    ...getUniversalEssentials(),
    ...getDurationClothing(days, travelStyle),
    ...getWeatherClothing(weather ?? null),
    ...getActivityItems(acts),
    ...getStyleItems(travelStyle),
    ...getDestinationEssentials(destination),
  ];

  const plug = getPlugType(destination);
  if (plug.adapterNeeded) {
    allItems.push({
      name: `Power adapter (${plug.plugType})`,
      category: 'tech',
      quantity: 1,
      reason: `${destination} uses ${plug.plugType} at ${plug.voltage}`,
      priority: 'must_have',
      packed: false,
    });
  }

  return deduplicateItems(allItems);
}
