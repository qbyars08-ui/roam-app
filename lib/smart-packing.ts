// =============================================================================
// ROAM — Smart Packing Engine
// Context-aware packing lists: weather, duration, activities, destination
// gear, plug types, and travel style.
// =============================================================================
import type { WeatherIntel } from './apis/openweather';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type PackingCategory =
  | 'essentials' | 'clothing' | 'toiletries' | 'tech' | 'documents' | 'destination_specific';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type P = 'must_have' | 'recommended' | 'nice_to_have';
const item = (name: string, cat: PackingCategory, qty: number, reason: string, pri: P): PackingItem =>
  ({ name, category: cat, quantity: qty, reason, priority: pri, packed: false });

// ---------------------------------------------------------------------------
// Curated destination data (10 destinations)
// ---------------------------------------------------------------------------
interface DestData { plug: string; volt: string; cultural: string[]; gear: string[] }

const DEST_DB: Record<string, DestData> = {
  tokyo:      { plug: 'A/B',     volt: '100V', cultural: ['Indoor slippers (ryokan stays)', 'Coin purse (cash-heavy culture)'], gear: ['IC card for trains (Suica/Pasmo)', 'Pocket Wi-Fi or eSIM'] },
  bali:       { plug: 'C/F',     volt: '230V', cultural: ['Sarong for temple visits', 'Modest top (shoulders covered)'], gear: ['Reef-safe sunscreen', 'Waterproof phone pouch'] },
  paris:      { plug: 'C/E',     volt: '230V', cultural: ['Smart-casual outfit for restaurants', 'Scarf (Parisians never skip it)'], gear: ['Museum pass printout', 'Reusable tote for boulangerie runs'] },
  bangkok:    { plug: 'A/B/C/O', volt: '220V', cultural: ['Sarong or shawl for temples', 'Closed-toe shoes for Grand Palace'], gear: ['Mosquito repellent (DEET)', 'Dry bag for tuk-tuk rain'] },
  london:     { plug: 'G',       volt: '230V', cultural: ['Umbrella (non-negotiable)', 'Layers for unpredictable weather'], gear: ['Oyster card or contactless payment', 'Compact umbrella'] },
  marrakech:  { plug: 'C/E',     volt: '220V', cultural: ['Headscarf (women, for mosques)', 'Modest clothing (knees and shoulders)'], gear: ['Small bills for haggling', 'Dust mask for medina alleys'] },
  'new york': { plug: 'A/B',     volt: '120V', cultural: ['Comfortable walking shoes (15k+ steps/day)', 'Broadway-ready outfit'], gear: ['MetroCard or OMNY tap', 'Portable charger (long days)'] },
  rome:       { plug: 'C/F/L',   volt: '230V', cultural: ['Covered shoulders for churches', 'No shorts in Vatican'], gear: ['Refillable bottle (free fountains)', 'Comfortable cobblestone shoes'] },
  dubai:      { plug: 'G',       volt: '220V', cultural: ['Modest swimwear for public beaches', 'Scarf for mosque visits'], gear: ['SPF 50+ (desert UV is extreme)', 'Light cardigan for over-AC indoors'] },
  seoul:      { plug: 'C/F',     volt: '220V', cultural: ['Slip-on shoes (frequent shoe removal)', 'Socks without holes'], gear: ['T-money card for transit', 'Portable Wi-Fi egg rental'] },
};

// ---------------------------------------------------------------------------
// Plug type lookup
// ---------------------------------------------------------------------------
const PLUG_MAP: Record<string, PlugInfo> = {
  US: { plugType: 'A/B',   voltage: '120V',     adapterNeeded: false, notes: 'Standard US plugs' },
  GB: { plugType: 'G',     voltage: '230V',     adapterNeeded: true,  notes: 'UK 3-pin required' },
  EU: { plugType: 'C/F',   voltage: '230V',     adapterNeeded: true,  notes: 'Standard Euro round pins' },
  JP: { plugType: 'A/B',   voltage: '100V',     adapterNeeded: false, notes: 'US plugs fit but voltage is 100V' },
  AU: { plugType: 'I',     voltage: '230V',     adapterNeeded: true,  notes: 'Australian angled pins' },
  IN: { plugType: 'C/D/M', voltage: '230V',     adapterNeeded: true,  notes: 'Multiple plug types in use' },
  CN: { plugType: 'A/C/I', voltage: '220V',     adapterNeeded: true,  notes: 'Universal adapter recommended' },
  BR: { plugType: 'N',     voltage: '127/220V', adapterNeeded: true,  notes: 'Unique Brazilian standard' },
  TH: { plugType: 'A/B/C/O', voltage: '220V',  adapterNeeded: true,  notes: 'Mixed plug types' },
  ZA: { plugType: 'M/N',   voltage: '230V',     adapterNeeded: true,  notes: 'South African round 3-pin' },
};

const DEST_REGION: Record<string, string> = {
  tokyo: 'JP', kyoto: 'JP', osaka: 'JP', london: 'GB', edinburgh: 'GB',
  paris: 'EU', barcelona: 'EU', rome: 'EU', amsterdam: 'EU', lisbon: 'EU',
  berlin: 'EU', prague: 'EU', budapest: 'EU', dubrovnik: 'EU', porto: 'EU',
  bangkok: 'TH', 'chiang mai': 'TH', bali: 'EU',
  'new york': 'US', 'mexico city': 'US',
  sydney: 'AU', melbourne: 'AU', queenstown: 'AU',
  jaipur: 'IN', delhi: 'IN', mumbai: 'IN',
  dubai: 'GB', seoul: 'EU', 'buenos aires': 'EU',
  marrakech: 'EU', 'cape town': 'ZA', istanbul: 'EU',
  'sao paulo': 'BR', rio: 'BR', beijing: 'CN', shanghai: 'CN',
};

export function getPlugType(destination: string): PlugInfo {
  const lower = destination.toLowerCase();
  const destData = DEST_DB[lower];
  if (destData) {
    const region = DEST_REGION[lower] ?? 'EU';
    return {
      plugType: destData.plug, voltage: destData.volt,
      adapterNeeded: region !== 'US',
      notes: PLUG_MAP[region]?.notes ?? `Plug ${destData.plug}, ${destData.volt}`,
    };
  }
  const region = DEST_REGION[lower];
  if (region && PLUG_MAP[region]) return PLUG_MAP[region];
  return { plugType: 'Unknown', voltage: 'Unknown', adapterNeeded: true, notes: 'Check adapter before travel' };
}

// ---------------------------------------------------------------------------
// getDestinationEssentials
// ---------------------------------------------------------------------------
export function getDestinationEssentials(destination: string): readonly PackingItem[] {
  const data = DEST_DB[destination.toLowerCase()];
  if (!data) return [];
  return [
    ...data.cultural.map((c) => item(c, 'destination_specific', 1, `Cultural norm in ${destination}`, 'must_have')),
    ...data.gear.map((g) => item(g, 'destination_specific', 1, `Recommended for ${destination}`, 'recommended')),
  ];
}

// ---------------------------------------------------------------------------
// getWeatherClothing
// ---------------------------------------------------------------------------
export function getWeatherClothing(forecast: WeatherIntel | null): readonly PackingItem[] {
  if (!forecast?.days?.length) return [];
  const items: PackingItem[] = [];
  const maxTemp = Math.max(...forecast.days.map((d) => d.tempHigh));
  const minTemp = Math.min(...forecast.days.map((d) => d.tempLow));
  const rainyDays = forecast.days.filter((d) => d.rainChance > 40);
  const humidDays = forecast.days.filter((d) => d.humidity > 70);

  if (minTemp < 5) {
    items.push(
      item('Heavy winter coat', 'clothing', 1, `Low of ${Math.round(minTemp)}C expected`, 'must_have'),
      item('Thermal base layer', 'clothing', 2, 'Near-freezing temperatures', 'must_have'),
      item('Warm hat + gloves', 'clothing', 1, 'Cold weather protection', 'must_have'),
    );
  } else if (minTemp < 15) {
    items.push(
      item('Warm jacket or fleece', 'clothing', 1, `Temps drop to ${Math.round(minTemp)}C`, 'must_have'),
      item('Long-sleeve layers', 'clothing', 2, 'Layering for cool mornings/evenings', 'recommended'),
    );
  }
  if (maxTemp > 30) {
    items.push(
      item('Light breathable shirts', 'clothing', 3, `Highs of ${Math.round(maxTemp)}C`, 'must_have'),
      item('Sun hat', 'clothing', 1, 'UV protection in hot weather', 'recommended'),
      item('Sunscreen SPF 50+', 'toiletries', 1, `Intense sun (${Math.round(maxTemp)}C highs)`, 'must_have'),
    );
  }
  if (rainyDays.length >= 2) {
    items.push(item('Rain jacket or packable umbrella', 'clothing', 1,
      `Rain expected on Day ${rainyDays.map((_, i) => i + 1).join(', ')}`, 'must_have'));
  }
  if (humidDays.length >= 3) {
    items.push(item('Quick-dry fabric clothing', 'clothing', 2, 'High humidity — cotton dries slowly', 'recommended'));
  }
  return items;
}

// ---------------------------------------------------------------------------
// Activity-based items
// ---------------------------------------------------------------------------
function getActivityItems(activities: readonly string[]): readonly PackingItem[] {
  const items: PackingItem[] = [];
  const j = activities.map((a) => a.toLowerCase()).join(' ');

  if (j.includes('hik') || j.includes('trek')) {
    items.push(
      item('Hiking boots', 'clothing', 1, 'Hiking in itinerary', 'must_have'),
      item('Daypack (20-30L)', 'essentials', 1, 'Carry water and snacks on trails', 'must_have'),
      item('Blister pads', 'toiletries', 1, 'Trail foot care', 'recommended'),
    );
  }
  if (j.includes('beach') || j.includes('surf') || j.includes('swim') || j.includes('snorkel')) {
    items.push(
      item('Swimsuit', 'clothing', 2, 'Water activities planned', 'must_have'),
      item('Quick-dry beach towel', 'essentials', 1, 'Beach / pool days', 'recommended'),
      item('Waterproof phone pouch', 'tech', 1, 'Protect phone near water', 'recommended'),
    );
  }
  if (j.includes('dinner') || j.includes('fine dining') || j.includes('fancy')) {
    items.push(
      item('Smart outfit (dinner-ready)', 'clothing', 1, 'Fine dining reservations', 'must_have'),
      item('Dress shoes or nice flats', 'clothing', 1, 'Restaurant dress codes', 'recommended'),
    );
  }
  if (j.includes('temple') || j.includes('shrine') || j.includes('mosque')) {
    items.push(item('Modest clothing (covers shoulders + knees)', 'clothing', 1, 'Required for religious sites', 'must_have'));
  }
  if (j.includes('photo')) {
    items.push(
      item('Camera + charger', 'tech', 1, 'Photography activities', 'recommended'),
      item('Lens cleaning cloth', 'tech', 1, 'Keep optics clean', 'nice_to_have'),
    );
  }
  if (j.includes('ski') || j.includes('snow')) {
    items.push(
      item('Ski jacket', 'clothing', 1, 'Snow sports', 'must_have'),
      item('Ski goggles', 'essentials', 1, 'Snow glare protection', 'must_have'),
    );
  }
  return items;
}

// ---------------------------------------------------------------------------
// Duration-scaled clothing
// ---------------------------------------------------------------------------
function getDurationClothing(days: number, style: TravelStyle): readonly PackingItem[] {
  const light = style === 'backpacker';
  const tops = light ? Math.min(days, 4) : Math.min(days, 7);
  const bottoms = light ? Math.min(Math.ceil(days / 3), 3) : Math.min(Math.ceil(days / 2), 5);
  const items: PackingItem[] = [
    item('T-shirts / tops', 'clothing', tops, `${days}-day trip`, 'must_have'),
    item('Pants / shorts', 'clothing', bottoms, `${days}-day trip`, 'must_have'),
    item('Underwear', 'clothing', Math.min(days + 1, 8), `${days} days + 1 spare`, 'must_have'),
    item('Socks', 'clothing', Math.min(days, 7), `${days}-day trip`, 'must_have'),
    item('Sleepwear', 'clothing', 1, 'Nightly comfort', 'recommended'),
  ];
  if (days >= 7) {
    items.push(item('Laundry bag + detergent sheets', 'essentials', 1,
      `${days} days — do laundry mid-trip instead of overpacking`, 'recommended'));
  }
  return items;
}

// ---------------------------------------------------------------------------
// Style-based items
// ---------------------------------------------------------------------------
function getStyleItems(style: TravelStyle): readonly PackingItem[] {
  if (style === 'backpacker') return [
    item('Packing cubes (compression)', 'essentials', 1, 'Maximize pack space', 'recommended'),
    item('Microfiber towel', 'essentials', 1, 'Hostels may not provide towels', 'recommended'),
    item('Padlock for hostel lockers', 'essentials', 1, 'Secure your belongings', 'must_have'),
  ];
  if (style === 'luxury') return [
    item('Garment bag or packing folder', 'essentials', 1, 'Keep formal wear wrinkle-free', 'recommended'),
    item('Noise-cancelling headphones', 'tech', 1, 'Premium travel comfort', 'recommended'),
  ];
  return [];
}

// ---------------------------------------------------------------------------
// Universal essentials
// ---------------------------------------------------------------------------
function getUniversalEssentials(): readonly PackingItem[] {
  return [
    item('Passport / ID', 'documents', 1, 'Required for travel', 'must_have'),
    item('Travel insurance details', 'documents', 1, 'Keep accessible offline', 'must_have'),
    item('Flight confirmation (offline)', 'documents', 1, 'Airport check-in backup', 'must_have'),
    item('Hotel booking confirmation', 'documents', 1, 'Offline access', 'must_have'),
    item('Phone charger', 'tech', 1, 'Daily essential', 'must_have'),
    item('Portable battery pack', 'tech', 1, 'Long days exploring', 'must_have'),
    item('Earbuds', 'tech', 1, 'Flights and transit', 'recommended'),
    item('Toothbrush + toothpaste', 'toiletries', 1, 'Daily hygiene', 'must_have'),
    item('Deodorant', 'toiletries', 1, 'Daily hygiene', 'must_have'),
    item('Reusable water bottle', 'essentials', 1, 'Stay hydrated, reduce waste', 'must_have'),
    item('Walking shoes', 'clothing', 1, 'Primary footwear', 'must_have'),
    item('Personal medications', 'essentials', 1, 'Health essentials', 'must_have'),
    item('Earplugs + sleep mask', 'essentials', 1, 'Better sleep anywhere', 'nice_to_have'),
  ];
}

// ---------------------------------------------------------------------------
// Deduplicate by name (keeps first occurrence)
// ---------------------------------------------------------------------------
function deduplicateItems(items: readonly PackingItem[]): readonly PackingItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = i.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  const allItems: PackingItem[] = [
    ...getUniversalEssentials(),
    ...getDurationClothing(days, travelStyle),
    ...getWeatherClothing(weather ?? null),
    ...getActivityItems(activities ?? []),
    ...getStyleItems(travelStyle),
    ...getDestinationEssentials(destination),
  ];
  const plug = getPlugType(destination);
  if (plug.adapterNeeded) {
    allItems.push(item(`Power adapter (${plug.plugType})`, 'tech', 1,
      `${destination} uses ${plug.plugType} at ${plug.voltage}`, 'must_have'));
  }
  return deduplicateItems(allItems);
}
