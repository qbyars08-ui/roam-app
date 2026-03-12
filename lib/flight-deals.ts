// =============================================================================
// ROAM — Flight Deal Hunter
// Monitor saved destinations, alert when price drops 20%
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DESTINATIONS, HIDDEN_DESTINATIONS, type Destination } from './constants';
import { getVisaInfo, type PassportNationality } from './visa-intel';

const STORAGE_KEY = 'roam_flight_deals';

/** Get best time, estimated cost, visa for a destination (for Dream Vault cards) */
export function getDreamVaultExtra(
  destination: string,
  passport: PassportNationality = 'US'
): { bestTimeToVisit: string; estimatedCost: number; visaLabel: string } {
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const d = all.find(
    (x) => x.label.toLowerCase() === destination.toLowerCase()
  ) as Destination | undefined;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bestTime = d?.bestMonths?.length
    ? d.bestMonths.map((m) => MONTHS[m - 1]).join(', ')
    : 'Year-round';
  const dailyCost = d?.dailyCost ?? 80;
  const estimatedCost = Math.round(dailyCost * 7 + 400); // 7 days + rough flight
  const visa = getVisaInfo(destination, passport);
  return {
    bestTimeToVisit: bestTime,
    estimatedCost,
    visaLabel: visa?.statusMessage ?? 'Check visa requirements',
  };
}

export interface SavedDestination {
  id: string;
  destination: string;
  baselinePrice: number | null;
  lastCheckedAt: string;
  homeAirport: string;
  /** Price history for sparkline (last 90 days of checks) */
  priceHistory: number[];
  /** Best time to visit (e.g. "Mar–May, Sep–Nov") */
  bestTimeToVisit?: string;
  /** Estimated 7-day trip cost in USD */
  estimatedCost?: number;
}

export interface PriceDropAlert {
  destination: string;
  oldPrice: number;
  newPrice: number;
  dropPercent: number;
}

export async function getSavedDestinations(): Promise<SavedDestination[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.map((d: Partial<SavedDestination>) => ({
      ...d,
      priceHistory: d.priceHistory ?? [],
    })) as SavedDestination[];
  } catch {
    return [];
  }
}

export async function saveDestinations(destinations: SavedDestination[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
}

export async function addSavedDestination(
  destination: string,
  homeAirport: string
): Promise<SavedDestination> {
  const list = await getSavedDestinations();
  const existing = list.find(
    (d) => d.destination.toLowerCase() === destination.toLowerCase()
  );
  if (existing) return existing;

  const newOne: SavedDestination = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    destination,
    baselinePrice: null,
    lastCheckedAt: new Date().toISOString(),
    homeAirport,
    priceHistory: [],
  };
  list.push(newOne);
  await saveDestinations(list);
  return newOne;
}

export async function removeSavedDestination(id: string): Promise<void> {
  const list = await getSavedDestinations().then((d) =>
    d.filter((x) => x.id !== id)
  );
  await saveDestinations(list);
}

export async function updateDestinationPrice(
  id: string,
  price: number
): Promise<PriceDropAlert | null> {
  const list = await getSavedDestinations();
  const idx = list.findIndex((d) => d.id === id);
  if (idx < 0) return null;

  const dest = list[idx];
  const oldPrice = dest.baselinePrice;
  dest.lastCheckedAt = new Date().toISOString();

  if (oldPrice == null) {
    dest.baselinePrice = price;
    dest.priceHistory = [price];
    await saveDestinations(list);
    return null;
  }

  const hist = dest.priceHistory ?? [];
  hist.push(price);
  dest.priceHistory = hist.slice(-90);

  const dropPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
  let alert: PriceDropAlert | null = null;

  if (dropPercent >= 20) {
    alert = {
      destination: dest.destination,
      oldPrice,
      newPrice: price,
      dropPercent,
    };
  }
  // Update baseline to lowest seen (current price if lower, else keep old)
  if (price < oldPrice) dest.baselinePrice = price;
  await saveDestinations(list);

  return alert;
}

/**
 * Check prices for all saved destinations. Returns any price-drop alerts (≥20%).
 */
export async function checkForDeals(): Promise<PriceDropAlert[]> {
  const { quickFlightSearch } = await import('./flights-amadeus');
  const { getHomeAirport } = await import('./flights-amadeus');
  const list = await getSavedDestinations();
  const homeAirport = await getHomeAirport();
  const alerts: PriceDropAlert[] = [];

  for (const dest of list) {
    try {
      const result = await quickFlightSearch(dest.destination, 7);
      if (!result?.cheapest?.price) continue;

      const price = result.cheapest.price;
      const alert = await updateDestinationPrice(dest.id, price);
      if (alert) alerts.push(alert);
    } catch {
      // Skip failed lookups
    }
  }

  return alerts;
}

/** Returns true if baseline price is below $500 (consider "low") */
export function isPricesLow(dest: SavedDestination): boolean {
  return dest.baselinePrice != null && dest.baselinePrice < 500;
}

/** Build Skyscanner search URL for destination */
export function getSkyscannerUrl(destination: string): string {
  const encoded = encodeURIComponent(destination);
  return `https://www.skyscanner.com/transport/flights/?q=${encoded}`;
}
