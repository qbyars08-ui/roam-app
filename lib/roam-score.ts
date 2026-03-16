// =============================================================================
// ROAM — Composite destination score (0–100)
// Computed from safety, value, weather, crowd, uniqueness, and timing signals.
// All inputs are deterministic given destination + month so scores are stable
// across re-renders — no random state leaks.
// =============================================================================

import { COLORS, DESTINATIONS, HIDDEN_DESTINATIONS, type Destination } from './constants';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ROAMScore {
  overall: number;       // 0–100 weighted composite
  safety: number;        // regional baseline
  value: number;         // inverse of dailyCost vs median
  weather: number;       // current month in bestMonths?
  crowdLevel: number;    // lower crowd = higher score
  uniqueness: number;    // seeded per destination
  timing: number;        // composite of weather + crowd + seasonal bonus
  label: string;         // human-readable verdict
  color: string;         // sage | gold | creamMuted
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const ALL_DESTINATIONS: Destination[] = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];

// Weights must sum to 1.0
const WEIGHTS = {
  safety:      0.20,
  value:       0.20,
  weather:     0.20,
  crowdLevel:  0.15,
  uniqueness:  0.10,
  timing:      0.15,
} as const;

// Regional safety baselines: keyed by ISO country code prefix / grouping
const REGION_SAFETY: Record<string, [number, number]> = {
  // Western Europe
  FR: [88, 94], DE: [88, 94], GB: [87, 93], NL: [88, 94], AT: [89, 95],
  PT: [86, 93], ES: [84, 92], IT: [83, 91], HR: [84, 91], HU: [83, 91],
  SI: [88, 94], IS: [91, 97], GR: [83, 91],
  // Eastern Europe / Caucasus
  GE: [72, 82], TR: [68, 78],
  // East Asia
  JP: [88, 95], KR: [85, 92], TW: [85, 92],
  // Southeast Asia
  TH: [70, 82], ID: [68, 80], VN: [71, 82], KH: [68, 79], MY: [70, 82],
  // South Asia
  IN: [62, 74],
  // Oceania
  AU: [86, 93], NZ: [88, 95],
  // Americas
  US: [76, 86], MX: [60, 72], AR: [66, 78], CO: [62, 74],
  // Middle East / North Africa
  AE: [82, 91], MA: [70, 81],
  // Africa
  ZA: [58, 70],
};

const DEFAULT_SAFETY_RANGE: [number, number] = [65, 78];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp value to [0, 100] integer */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Deterministic pseudo-random float in [0,1] seeded by a string */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // convert to 32-bit int
  }
  // Map int32 to [0,1]
  return ((hash >>> 0) % 10_000) / 10_000;
}

/** Linear interpolate within [lo, hi] using t in [0,1] */
function lerp(lo: number, hi: number, t: number): number {
  return lo + (hi - lo) * t;
}

/** Find destination record by label (case-insensitive) */
function findDestination(name: string): Destination | undefined {
  const normalised = name.trim().toLowerCase();
  return ALL_DESTINATIONS.find((d) => d.label.toLowerCase() === normalised);
}

/** Compute median daily cost across all destinations */
function computeMedianCost(): number {
  const costs = ALL_DESTINATIONS.map((d) => d.dailyCost).sort((a, b) => a - b);
  const mid = Math.floor(costs.length / 2);
  return costs.length % 2 === 0
    ? (costs[mid - 1] + costs[mid]) / 2
    : costs[mid];
}

const MEDIAN_COST = computeMedianCost();
const MAX_COST = Math.max(...ALL_DESTINATIONS.map((d) => d.dailyCost));
const MIN_COST = Math.min(...ALL_DESTINATIONS.map((d) => d.dailyCost));

// ---------------------------------------------------------------------------
// Sub-score computations
// ---------------------------------------------------------------------------

function computeSafety(countryCode: string): number {
  const range = REGION_SAFETY[countryCode] ?? DEFAULT_SAFETY_RANGE;
  // Use the midpoint as the representative score
  return clamp((range[0] + range[1]) / 2);
}

function computeValue(dailyCost: number): number {
  // Cheaper than median → higher score. Scale so the cheapest destination
  // gets ~95 and the most expensive gets ~30.
  if (MAX_COST === MIN_COST) return 65;
  const normalised = (dailyCost - MIN_COST) / (MAX_COST - MIN_COST); // 0=cheap, 1=expensive
  return clamp(lerp(95, 30, normalised));
}

function computeWeather(bestMonths: number[], month: number): number {
  if (bestMonths.includes(month)) return 90;

  // Partial credit: months adjacent to best season get 60, others 35
  const adjacent = bestMonths.some(
    (m) =>
      Math.abs(m - month) === 1 ||
      // Handle year-wrap (Dec/Jan boundary)
      Math.abs(m - month) === 11
  );
  return adjacent ? 60 : 35;
}

function computeCrowdLevel(trendScore: number): number {
  // trendScore is 60–95 in the data. Higher trend → more crowded → lower crowd score.
  // Invert and rescale to 0–100.
  const minTrend = 60;
  const maxTrend = 95;
  const normalised = (trendScore - minTrend) / (maxTrend - minTrend); // 0=quiet, 1=crowded
  return clamp(lerp(90, 25, normalised));
}

function computeUniqueness(destinationLabel: string): number {
  // Deterministic per-destination "uniqueness" factor. Range 45–90.
  const t = seededRandom(destinationLabel + '__uniqueness');
  return clamp(lerp(45, 90, t));
}

function computeTiming(
  weather: number,
  crowdLevel: number,
  bestMonths: number[],
  month: number
): number {
  // Base: average of weather + crowd
  const base = (weather + crowdLevel) / 2;

  // Seasonal bonus: being in the exact best month window adds up to 8 pts
  const bonus = bestMonths.includes(month) ? 8 : 0;

  return clamp(base + bonus);
}

function computeOverall(scores: Omit<ROAMScore, 'overall' | 'label' | 'color'>): number {
  return clamp(
    scores.safety      * WEIGHTS.safety +
    scores.value       * WEIGHTS.value +
    scores.weather     * WEIGHTS.weather +
    scores.crowdLevel  * WEIGHTS.crowdLevel +
    scores.uniqueness  * WEIGHTS.uniqueness +
    scores.timing      * WEIGHTS.timing
  );
}

// ---------------------------------------------------------------------------
// Exported helpers
// ---------------------------------------------------------------------------

export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Perfect time to go';
  if (score >= 70) return 'Great time to visit';
  if (score >= 55) return 'Good — plan ahead';
  return 'Off-season — fewer crowds';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.gold;
  if (score >= 60) return COLORS.sage;
  return COLORS.creamMuted;
}

// ---------------------------------------------------------------------------
// Primary export
// ---------------------------------------------------------------------------

/**
 * Compute a composite ROAM Score for a destination.
 *
 * @param destination - Destination label matching DESTINATIONS (e.g. "Tokyo")
 * @param month       - 1-indexed month (1=Jan … 12=Dec). Defaults to current month.
 */
export function computeROAMScore(
  destination: string,
  month: number = new Date().getMonth() + 1
): ROAMScore {
  const dest = findDestination(destination);

  // Graceful fallback for unknown destinations
  const dailyCost  = dest?.dailyCost  ?? MEDIAN_COST;
  const trendScore = dest?.trendScore ?? 75;
  const bestMonths = dest?.bestMonths ?? [];
  const countryCode = dest?.country   ?? 'US';

  const safety      = computeSafety(countryCode);
  const value       = computeValue(dailyCost);
  const weather     = computeWeather(bestMonths, month);
  const crowdLevel  = computeCrowdLevel(trendScore);
  const uniqueness  = computeUniqueness(destination);
  const timing      = computeTiming(weather, crowdLevel, bestMonths, month);
  const overall     = computeOverall({ safety, value, weather, crowdLevel, uniqueness, timing });

  return {
    overall,
    safety,
    value,
    weather,
    crowdLevel,
    uniqueness,
    timing,
    label: getScoreLabel(overall),
    color: getScoreColor(overall),
  };
}
