// =============================================================================
// ROAM — Flight Intelligence
// Deal scoring and "Go Now" intelligence feed.
// All prices are illustrative estimates — no live API calls.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHomeAirport, getDestinationAirport, getSkyscannerFlightUrl } from './flights';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlightDeal {
  id: string;
  destination: string;
  origin: string;
  originCode: string;
  destinationCode: string;
  estimatedPrice: number;
  historicalAvgPrice: number;
  dealScore: number; // 0-100, higher = better deal
  savingsPercent: number;
  savingsAmount: number;
  bestWeek: string; // e.g. "Mar 28 - Apr 4"
  currency: string;
  skyscannerUrl: string;
  updatedAt: string;
}

export interface FlightCalendarDay {
  date: string; // ISO
  dayOfWeek: string;
  estimatedPrice: number;
  priceLevel: 'low' | 'average' | 'high';
  savingsVsAvg: number; // positive = savings
}

export interface GoNowFeedItem {
  deal: FlightDeal;
  destinationPhoto?: string;
  hook: string; // e.g. "23% below average" or "Lowest in 3 months"
}

export interface RouteIntelligence {
  route: string; // e.g. "PDX → TYO"
  avgPrice: number;
  bestMonth: string;
  cheapestDayOfWeek: string;
  tips: string[]; // 2-3 actionable tips
}

// ---------------------------------------------------------------------------
// Historical price database
// Format: `${originCode}-${destCode}` → { avg, low, high }
// All prices are round-trip USD estimates based on typical market rates.
// ---------------------------------------------------------------------------

interface PriceRange {
  avg: number;
  low: number;
  high: number;
}

export const HISTORICAL_PRICES: Record<string, PriceRange> = {
  // JFK routes
  'JFK-NRT': { avg: 1050, low: 720, high: 1600 },
  'JFK-DPS': { avg: 1300, low: 950, high: 1900 },
  'JFK-BKK': { avg: 980, low: 680, high: 1450 },
  'JFK-BCN': { avg: 580, low: 380, high: 950 },
  'JFK-CDG': { avg: 520, low: 320, high: 880 },
  'JFK-FCO': { avg: 560, low: 360, high: 920 },
  'JFK-LHR': { avg: 480, low: 280, high: 820 },
  'JFK-IST': { avg: 620, low: 410, high: 1050 },
  'JFK-SIN': { avg: 1100, low: 780, high: 1700 },
  'JFK-HKG': { avg: 980, low: 680, high: 1480 },

  // LAX routes
  'LAX-NRT': { avg: 860, low: 580, high: 1350 },
  'LAX-DPS': { avg: 1050, low: 720, high: 1600 },
  'LAX-BKK': { avg: 820, low: 550, high: 1280 },
  'LAX-CDG': { avg: 680, low: 440, high: 1100 },
  'LAX-BCN': { avg: 720, low: 480, high: 1150 },
  'LAX-LHR': { avg: 640, low: 410, high: 1020 },
  'LAX-SYD': { avg: 1180, low: 820, high: 1800 },
  'LAX-MEX': { avg: 320, low: 180, high: 580 },
  'LAX-SIN': { avg: 920, low: 640, high: 1450 },
  'LAX-HKG': { avg: 850, low: 580, high: 1350 },

  // SFO routes
  'SFO-NRT': { avg: 820, low: 560, high: 1300 },
  'SFO-DPS': { avg: 1100, low: 780, high: 1650 },
  'SFO-BKK': { avg: 880, low: 600, high: 1380 },
  'SFO-CDG': { avg: 720, low: 480, high: 1150 },
  'SFO-LHR': { avg: 660, low: 420, high: 1050 },
  'SFO-SIN': { avg: 880, low: 620, high: 1400 },

  // ORD routes
  'ORD-NRT': { avg: 980, low: 680, high: 1520 },
  'ORD-CDG': { avg: 580, low: 360, high: 960 },
  'ORD-LHR': { avg: 540, low: 340, high: 880 },
  'ORD-FCO': { avg: 620, low: 400, high: 1000 },
  'ORD-BCN': { avg: 640, low: 420, high: 1020 },

  // ATL routes
  'ATL-CDG': { avg: 620, low: 400, high: 1000 },
  'ATL-LHR': { avg: 580, low: 360, high: 950 },
  'ATL-FCO': { avg: 660, low: 440, high: 1060 },
  'ATL-NRT': { avg: 1100, low: 780, high: 1700 },
  'ATL-BKK': { avg: 1050, low: 730, high: 1620 },

  // SEA routes
  'SEA-NRT': { avg: 780, low: 520, high: 1250 },
  'SEA-DPS': { avg: 980, low: 680, high: 1520 },
  'SEA-BKK': { avg: 850, low: 580, high: 1320 },
  'SEA-CDG': { avg: 720, low: 480, high: 1160 },
  'SEA-LHR': { avg: 680, low: 440, high: 1080 },
  'SEA-SIN': { avg: 860, low: 600, high: 1380 },

  // MIA routes
  'MIA-CDG': { avg: 680, low: 440, high: 1080 },
  'MIA-BCN': { avg: 640, low: 420, high: 1020 },
  'MIA-LHR': { avg: 620, low: 400, high: 1000 },
  'MIA-FCO': { avg: 680, low: 450, high: 1100 },
  'MIA-MEX': { avg: 280, low: 160, high: 520 },

  // PDX routes
  'PDX-NRT': { avg: 850, low: 580, high: 1340 },
  'PDX-DPS': { avg: 1050, low: 730, high: 1620 },
  'PDX-BKK': { avg: 900, low: 620, high: 1420 },
  'PDX-CDG': { avg: 780, low: 520, high: 1260 },
  'PDX-LHR': { avg: 720, low: 480, high: 1160 },
  'PDX-BCN': { avg: 800, low: 540, high: 1280 },
};

// Fallback price ranges by destination region for unknown routes
const REGION_FALLBACK: Record<string, PriceRange> = {
  europe:   { avg: 700, low: 420, high: 1100 },
  asia:     { avg: 950, low: 650, high: 1550 },
  oceania:  { avg: 1250, low: 880, high: 1900 },
  latam:    { avg: 400, low: 220, high: 700 },
  default:  { avg: 750, low: 480, high: 1200 },
};

// Airport → region mapping for fallback pricing
const AIRPORT_REGION: Record<string, keyof typeof REGION_FALLBACK> = {
  CDG: 'europe', LHR: 'europe', FCO: 'europe', BCN: 'europe',
  AMS: 'europe', BER: 'europe', VIE: 'europe', PRG: 'europe',
  IST: 'europe', ATH: 'europe', LIS: 'europe', BUD: 'europe',
  OPO: 'europe', DBV: 'europe', KEF: 'europe', MXP: 'europe',
  MUC: 'europe', RAK: 'europe',
  NRT: 'asia', KIX: 'asia', DPS: 'asia', BKK: 'asia', SIN: 'asia',
  HKG: 'asia', ICN: 'asia', TPE: 'asia', HAN: 'asia', SGN: 'asia',
  KUL: 'asia', DAD: 'asia', REP: 'asia', CNX: 'asia', TBS: 'asia',
  DXB: 'asia', JAI: 'asia', CAI: 'asia',
  SYD: 'oceania', ZQN: 'oceania',
  MEX: 'latam', EZE: 'latam', CTG: 'latam', MDE: 'latam', OAX: 'latam',
};

// Month index → name
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Day of week names
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Best travel months by destination region (0-indexed)
const BEST_MONTHS_BY_REGION: Record<string, number> = {
  europe:  3,  // April
  asia:    9,  // October
  oceania: 3,  // April (Southern Hemisphere spring)
  latam:   7,  // August
  default: 4,  // May
};

// Cache TTL: 4 hours
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const FEED_CACHE_KEY = 'roam_go_now_feed_v1';

// ---------------------------------------------------------------------------
// Seeded pseudo-random (mulberry32 — deterministic from uint32 seed)
// ---------------------------------------------------------------------------

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function routeSeed(origin: string, dest: string, dateSuffix: string = ''): number {
  const str = `${origin}-${dest}-${dateSuffix}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Price lookup helpers
// ---------------------------------------------------------------------------

function getPriceRange(originCode: string, destCode: string): PriceRange {
  const key = `${originCode}-${destCode}`;
  if (HISTORICAL_PRICES[key]) return HISTORICAL_PRICES[key];

  // Try reverse route with slightly higher avg (positioning asymmetry)
  const reverseKey = `${destCode}-${originCode}`;
  if (HISTORICAL_PRICES[reverseKey]) {
    const r = HISTORICAL_PRICES[reverseKey];
    return { avg: Math.round(r.avg * 1.05), low: Math.round(r.low * 1.05), high: Math.round(r.high * 1.05) };
  }

  // Region-based fallback
  const region = AIRPORT_REGION[destCode] ?? 'default';
  return REGION_FALLBACK[region];
}

// ---------------------------------------------------------------------------
// Day-of-week price multiplier
// ---------------------------------------------------------------------------

function dowMultiplier(dayOfWeek: number): number {
  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const multipliers = [1.15, 1.05, 0.88, 0.90, 1.00, 1.22, 1.20];
  return multipliers[dayOfWeek] ?? 1.0;
}

// ---------------------------------------------------------------------------
// Advance-purchase multiplier
// days = days from today the flight departs
// ---------------------------------------------------------------------------

function advancePurchaseMultiplier(days: number): number {
  if (days < 7)   return 1.55; // last-minute surge
  if (days < 14)  return 1.35;
  if (days < 21)  return 1.15;
  if (days < 35)  return 1.00; // neutral
  if (days < 49)  return 0.92; // sweet spot: 5-7 weeks out
  if (days < 70)  return 0.88; // best window: 7-10 weeks out
  if (days < 100) return 0.93;
  if (days < 150) return 0.98;
  return 1.05; // too far out, prices stabilize high
}

// ---------------------------------------------------------------------------
// Holiday-week detection (approximate US holidays)
// Returns true if the date falls within a known expensive travel window.
// ---------------------------------------------------------------------------

function isHolidayWeek(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // Thanksgiving week (late November)
  if (month === 10 && day >= 20 && day <= 30) return true;
  // Christmas / New Year's
  if (month === 11 && day >= 20) return true;
  if (month === 0 && day <= 5) return true;
  // Spring break (mid-March to mid-April is approximate)
  if (month === 2 && day >= 10 && day <= 25) return true;
  if (month === 3 && day >= 1 && day <= 15) return true;
  // July 4th week
  if (month === 6 && day >= 1 && day <= 10) return true;
  // Labor Day weekend
  if (month === 7 && day >= 29) return true;
  if (month === 8 && day <= 5) return true;

  return false;
}

function holidayMultiplier(date: Date): number {
  return isHolidayWeek(date) ? 1.0 + 0.4 + Math.random() * 0.2 : 1.0;
}

// ---------------------------------------------------------------------------
// Core: estimate a single flight price for a given date
// ---------------------------------------------------------------------------

function estimatePrice(
  originCode: string,
  destCode: string,
  departureDate: Date,
  referenceDate: Date = new Date(),
): number {
  const range = getPriceRange(originCode, destCode);
  const daysOut = Math.max(0, Math.floor(
    (departureDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
  ));

  const dateSuffix = departureDate.toISOString().slice(0, 10);
  const rng = seededRandom(routeSeed(originCode, destCode, dateSuffix));

  // Base price with small seeded noise (+/- 8%)
  const noise = 0.92 + rng() * 0.16;
  const base = range.avg * noise;

  const dow = departureDate.getDay();
  const price = base
    * dowMultiplier(dow)
    * advancePurchaseMultiplier(daysOut)
    * (isHolidayWeek(departureDate) ? 1.0 + 0.4 + rng() * 0.2 : 1.0);

  // Clamp to [low * 0.85, high * 1.15]
  return Math.round(Math.max(range.low * 0.85, Math.min(range.high * 1.15, price)));
}

// ---------------------------------------------------------------------------
// 1. computeDealScore
// ---------------------------------------------------------------------------

/**
 * Score a current price against a historical average.
 * Returns 0-100 where 100 is an exceptional deal.
 *   >= 30% below avg  → 90-100
 *   20-29% below avg  → 75-89
 *   10-19% below avg  → 55-74
 *   0-9%  below avg   → 35-54
 *   at or above avg   → 0-34
 */
export function computeDealScore(currentPrice: number, historicalAvg: number): number {
  if (historicalAvg <= 0) return 0;
  const ratio = currentPrice / historicalAvg; // 1.0 = at avg, <1.0 = below avg (better deal)
  const savingsFraction = 1 - ratio;

  if (savingsFraction >= 0.30) return Math.min(100, Math.round(90 + savingsFraction * 33));
  if (savingsFraction >= 0.20) return Math.round(75 + (savingsFraction - 0.20) * 140);
  if (savingsFraction >= 0.10) return Math.round(55 + (savingsFraction - 0.10) * 200);
  if (savingsFraction >= 0.00) return Math.round(35 + savingsFraction * 200);
  // Price is above average
  const overFraction = Math.min(0.5, -savingsFraction);
  return Math.max(0, Math.round(35 - overFraction * 70));
}

// ---------------------------------------------------------------------------
// 2. getFlightCalendar
// ---------------------------------------------------------------------------

/**
 * Generate a 42-day price calendar (6 weeks) starting from startDate.
 * Prices are seeded-deterministic so they are consistent across renders.
 */
export function getFlightCalendar(
  origin: string,
  destination: string,
  startDate: Date,
): FlightCalendarDay[] {
  const originCode = (origin.length === 3 ? origin.toUpperCase() : null)
    ?? getDestinationAirport(origin)
    ?? 'JFK';
  const destCode = (destination.length === 3 ? destination.toUpperCase() : null)
    ?? getDestinationAirport(destination)
    ?? 'NRT';

  const range = getPriceRange(originCode, destCode);
  const today = new Date();
  const calendar: FlightCalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const price = estimatePrice(originCode, destCode, date, today);
    const savingsVsAvg = Math.round(range.avg - price);

    let priceLevel: FlightCalendarDay['priceLevel'];
    if (price <= range.low * 1.1) {
      priceLevel = 'low';
    } else if (price >= range.avg * 1.12) {
      priceLevel = 'high';
    } else {
      priceLevel = 'average';
    }

    calendar.push({
      date: date.toISOString().slice(0, 10),
      dayOfWeek: DOW_NAMES[date.getDay()],
      estimatedPrice: price,
      priceLevel,
      savingsVsAvg,
    });
  }

  return calendar;
}

// ---------------------------------------------------------------------------
// 3. getBestDaysToFly
// ---------------------------------------------------------------------------

/**
 * Returns the top 3 cheapest days of the week to fly this route,
 * with estimated savings vs. the weekly average.
 */
export function getBestDaysToFly(
  origin: string,
  destination: string,
): { day: string; savings: string }[] {
  const originCode = (origin.length === 3 ? origin.toUpperCase() : null)
    ?? getDestinationAirport(origin)
    ?? 'JFK';
  const destCode = (destination.length === 3 ? destination.toUpperCase() : null)
    ?? getDestinationAirport(destination)
    ?? 'NRT';

  const range = getPriceRange(originCode, destCode);

  // Compute representative average price for each DOW using the 6-week advance window
  const today = new Date();
  const pricesByDow: number[][] = Array.from({ length: 7 }, () => []);

  for (let i = 35; i < 77; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const price = estimatePrice(originCode, destCode, date, today);
    pricesByDow[date.getDay()].push(price);
  }

  const avgByDow = pricesByDow.map((prices) => {
    if (prices.length === 0) return range.avg;
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  });

  const weeklyAvg = Math.round(avgByDow.reduce((a, b) => a + b, 0) / 7);

  const ranked = avgByDow
    .map((avg, dow) => ({ dow, avg, savings: weeklyAvg - avg }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3);

  return ranked.map(({ dow, savings }) => ({
    day: DOW_NAMES[dow],
    savings: savings > 0 ? `$${savings} cheaper` : 'Similar to average',
  }));
}

// ---------------------------------------------------------------------------
// 4. getRouteIntelligence
// ---------------------------------------------------------------------------

export function getRouteIntelligence(
  origin: string,
  destination: string,
): RouteIntelligence {
  const originCode = (origin.length === 3 ? origin.toUpperCase() : null)
    ?? getDestinationAirport(origin)
    ?? 'JFK';
  const destCode = (destination.length === 3 ? destination.toUpperCase() : null)
    ?? getDestinationAirport(destination)
    ?? 'NRT';

  const range = getPriceRange(originCode, destCode);
  const region = AIRPORT_REGION[destCode] ?? 'default';
  const bestMonthIndex = BEST_MONTHS_BY_REGION[region] ?? 4;

  const bestDays = getBestDaysToFly(originCode, destCode);
  const cheapestDow = bestDays[0]?.day ?? 'Tuesday';

  const routeLabel = `${originCode} → ${destCode}`;

  const tips: string[] = [
    `Book 6-8 weeks in advance for the best prices on this route`,
    `${cheapestDow} departures average 12-18% cheaper than weekend flights`,
  ];

  if (range.avg > 900) {
    tips.push(`Consider a positioning flight to a major hub — fares drop significantly from connecting cities`);
  } else {
    tips.push(`Setting price alerts 10+ weeks out catches early-bird inventory`);
  }

  return {
    route: routeLabel,
    avgPrice: range.avg,
    bestMonth: MONTH_NAMES[bestMonthIndex],
    cheapestDayOfWeek: cheapestDow,
    tips,
  };
}

// ---------------------------------------------------------------------------
// Hook text generation
// ---------------------------------------------------------------------------

function buildHookText(deal: FlightDeal): string {
  const { savingsPercent, savingsAmount, dealScore } = deal;

  if (dealScore >= 90) {
    return `Lowest price this quarter — $${savingsAmount} off`;
  }
  if (dealScore >= 75) {
    return `${savingsPercent}% below average — rare window`;
  }
  if (dealScore >= 55) {
    return `$${savingsAmount} cheaper than last month`;
  }
  if (dealScore >= 35) {
    return `${savingsPercent}% below the seasonal average`;
  }
  return `Prices holding steady — watch for a drop`;
}

// ---------------------------------------------------------------------------
// Best departure week finder (looks 12 weeks ahead)
// ---------------------------------------------------------------------------

function findBestDepartureWeek(
  originCode: string,
  destCode: string,
  today: Date,
): { bestWeek: string; bestPrice: number } {
  let bestPrice = Infinity;
  let bestStart = today;

  for (let weekOffset = 2; weekOffset < 12; weekOffset++) {
    // Pick the cheapest day within each week window
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + weekOffset * 7 + d);
      const price = estimatePrice(originCode, destCode, date, today);
      if (price < bestPrice) {
        bestPrice = price;
        bestStart = date;
      }
    }
  }

  const end = new Date(bestStart);
  end.setDate(bestStart.getDate() + 7);

  const fmt = (d: Date): string =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return { bestWeek: `${fmt(bestStart)} - ${fmt(end)}`, bestPrice };
}

// ---------------------------------------------------------------------------
// 5. getGoNowFeed
// ---------------------------------------------------------------------------

interface FeedCache {
  items: GoNowFeedItem[];
  cachedAt: number;
}

/**
 * Generate the "Go Now" deal feed for a list of saved destinations.
 * Results are sorted by deal score descending.
 * Caches in AsyncStorage for 4 hours to avoid recalculation on every render.
 */
export async function getGoNowFeed(
  savedDestinations: string[],
): Promise<GoNowFeedItem[]> {
  // Check cache
  try {
    const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
    if (cached) {
      const parsed: FeedCache = JSON.parse(cached);
      if (Date.now() - parsed.cachedAt < CACHE_TTL_MS && parsed.items.length > 0) {
        return parsed.items;
      }
    }
  } catch {
    // Cache miss is fine
  }

  const today = new Date();
  const originCode = await getHomeAirport();

  const deals: FlightDeal[] = savedDestinations
    .map((destination) => {
      const destCode = getDestinationAirport(destination);
      if (!destCode) return null;

      const range = getPriceRange(originCode, destCode);
      const { bestWeek, bestPrice } = findBestDepartureWeek(originCode, destCode, today);

      const savingsAmount = Math.max(0, Math.round(range.avg - bestPrice));
      const savingsPercent = range.avg > 0
        ? Math.max(0, Math.round(((range.avg - bestPrice) / range.avg) * 100))
        : 0;
      const dealScore = computeDealScore(bestPrice, range.avg);

      const skyscannerUrl = getSkyscannerFlightUrl({
        origin: originCode,
        destination,
      });

      const deal: FlightDeal = {
        id: `${originCode}-${destCode}-${today.toISOString().slice(0, 10)}`,
        destination,
        origin: originCode,
        originCode,
        destinationCode: destCode,
        estimatedPrice: bestPrice,
        historicalAvgPrice: range.avg,
        dealScore,
        savingsPercent,
        savingsAmount,
        bestWeek,
        currency: 'USD',
        skyscannerUrl,
        updatedAt: today.toISOString(),
      };

      return deal;
    })
    .filter((d): d is FlightDeal => d !== null);

  deals.sort((a, b) => b.dealScore - a.dealScore);

  const feedItems: GoNowFeedItem[] = deals.map((deal) => ({
    deal,
    hook: buildHookText(deal),
  }));

  // Write cache
  try {
    const cachePayload: FeedCache = { items: feedItems, cachedAt: Date.now() };
    await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(cachePayload));
  } catch {
    // Non-fatal
  }

  return feedItems;
}

// =============================================================================
// Saved Destinations & Price Tracking (merged from flight-deals.ts)
// =============================================================================

const SAVED_DEST_STORAGE_KEY = 'roam_flight_deals';

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
    const raw = await AsyncStorage.getItem(SAVED_DEST_STORAGE_KEY);
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
  await AsyncStorage.setItem(SAVED_DEST_STORAGE_KEY, JSON.stringify(destinations));
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
  if (price < oldPrice) dest.baselinePrice = price;
  await saveDestinations(list);

  return alert;
}

/** Returns true if baseline price is below $500 */
export function isPricesLow(dest: SavedDestination): boolean {
  return dest.baselinePrice != null && dest.baselinePrice < 500;
}

/** Build Skyscanner search URL for destination (simple query version) */
export function getSkyscannerUrl(destination: string): string {
  const encoded = encodeURIComponent(destination);
  return `https://www.skyscanner.com/transport/flights/?q=${encoded}`;
}
