// =============================================================================
// ROAM — Destination Compare
// Pure aggregation layer: combines existing data modules into a unified
// ComparisonData snapshot. No new APIs — all sources are offline-first.
// =============================================================================

import {
  DESTINATIONS,
  HIDDEN_DESTINATIONS,
  DESTINATION_HERO_PHOTOS,
  type Destination,
} from './constants';
import { getCostOfLiving } from './cost-of-living';
import { computeROAMScore } from './roam-score';
import { getDestinationTips } from './destination-tips';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComparisonData {
  readonly destination: string;
  readonly costPerDay: number;          // USD estimate from DESTINATIONS
  readonly safetyScore: number;         // 1–10 from DESTINATIONS
  readonly roamScore: number;           // 0–100 composite
  readonly bestMonth: string;           // First best month label e.g. "Apr"
  readonly topTip: string;             // First curated tip or fallback
  readonly avgTemp: number | null;      // Celsius — from weather if available, else null
  readonly photoUrl: string | null;     // Unsplash hero photo URL
  readonly country: string;            // ISO country code
}

export interface CategoryWinner {
  readonly winner: 'a' | 'b' | 'tie';
  readonly aValue: string;
  readonly bValue: string;
  readonly pctDiff: number | null;     // |a - b| / max as percentage, null if not numeric
}

export interface ComparisonResult {
  readonly a: ComparisonData;
  readonly b: ComparisonData;
  readonly categories: {
    readonly cost: CategoryWinner;
    readonly safety: CategoryWinner;
    readonly roamScore: CategoryWinner;
    readonly avgTemp: CategoryWinner;
    readonly bestMonth: CategoryWinner;
    readonly topTip: CategoryWinner;
  };
  readonly winnerName: string | null;   // destination name or null if tied
  readonly aWins: number;
  readonly bWins: number;
  readonly totalCategories: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const ALL_DESTINATIONS: readonly Destination[] = [
  ...DESTINATIONS,
  ...HIDDEN_DESTINATIONS,
];

const MONTH_LABELS: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function findDestination(name: string): Destination | null {
  const lower = name.toLowerCase().trim();
  return ALL_DESTINATIONS.find((d) => d.label.toLowerCase() === lower) ?? null;
}

function getBestMonthLabel(bestMonths: readonly number[]): string {
  if (bestMonths.length === 0) return 'Any';
  // Pick the best month nearest the current month
  const currentMonth = new Date().getMonth() + 1;
  const sorted = [...bestMonths].sort(
    (a, b) =>
      Math.abs(a - currentMonth) - Math.abs(b - currentMonth),
  );
  return MONTH_LABELS[(sorted[0] ?? 1) - 1] ?? 'Any';
}

function getTopTipText(destination: string): string {
  const tips = getDestinationTips(destination);
  if (tips.length > 0 && tips[0]) return tips[0].tip;
  // Fallback — check cost-of-living tipping note
  const col = getCostOfLiving(destination);
  if (col?.tipping) return col.tipping;
  return `Explore ${destination} like a local.`;
}

function pctDiff(a: number, b: number): number {
  const max = Math.max(Math.abs(a), Math.abs(b));
  if (max === 0) return 0;
  return Math.round((Math.abs(a - b) / max) * 100);
}

// ---------------------------------------------------------------------------
// getComparisonData
// ---------------------------------------------------------------------------

/**
 * Aggregate all available local data for a destination into a single snapshot.
 * Fully synchronous — no async APIs needed for the base fields.
 */
export function getComparisonData(destination: string): ComparisonData {
  const dest = findDestination(destination);
  const roam = computeROAMScore(destination);
  const tip = getTopTipText(destination);
  const photoUrl =
    DESTINATION_HERO_PHOTOS[destination] ??
    DESTINATION_HERO_PHOTOS[dest?.label ?? ''] ??
    null;

  // Use DESTINATIONS dailyCost as USD-equivalent daily estimate
  const costPerDay = dest?.dailyCost ?? 80;
  const safetyScore = dest?.safetyScore ?? 7;
  const bestMonth = getBestMonthLabel(dest?.bestMonths ?? []);
  const country = dest?.country ?? '';

  return {
    destination: dest?.label ?? destination,
    costPerDay,
    safetyScore,
    roamScore: roam.overall,
    bestMonth,
    topTip: tip,
    avgTemp: null,           // populated externally via weather if needed
    photoUrl,
    country,
  };
}

// ---------------------------------------------------------------------------
// buildCategoryWinner — pure comparison of two numeric values
// ---------------------------------------------------------------------------

function numericWinner(
  aVal: number,
  bVal: number,
  mode: 'lower' | 'higher',
  fmt: (v: number) => string,
): CategoryWinner {
  const diff = pctDiff(aVal, bVal);
  const aWins =
    mode === 'higher' ? aVal > bVal : aVal < bVal;
  const bWins =
    mode === 'higher' ? bVal > aVal : bVal < aVal;
  return {
    winner: aWins ? 'a' : bWins ? 'b' : 'tie',
    aValue: fmt(aVal),
    bValue: fmt(bVal),
    pctDiff: diff,
  };
}

function textWinner(aVal: string, bVal: string): CategoryWinner {
  return {
    winner: 'tie',
    aValue: aVal,
    bValue: bVal,
    pctDiff: null,
  };
}

// ---------------------------------------------------------------------------
// compareDestinations
// ---------------------------------------------------------------------------

/**
 * Compare two ComparisonData snapshots across all tracked categories.
 * Returns per-category winners and an overall verdict.
 */
export function compareDestinations(
  a: ComparisonData,
  b: ComparisonData,
): ComparisonResult {
  const cost = numericWinner(
    a.costPerDay,
    b.costPerDay,
    'lower',
    (v) => `$${v}/day`,
  );

  const safety = numericWinner(
    a.safetyScore,
    b.safetyScore,
    'higher',
    (v) => `${v}/10`,
  );

  const roamScore = numericWinner(
    a.roamScore,
    b.roamScore,
    'higher',
    (v) => `${v}`,
  );

  const avgTemp: CategoryWinner =
    a.avgTemp != null && b.avgTemp != null
      ? numericWinner(a.avgTemp, b.avgTemp, 'higher', (v) => `${Math.round(v)}°C`)
      : {
          winner: 'tie',
          aValue: a.avgTemp != null ? `${Math.round(a.avgTemp)}°C` : '--',
          bValue: b.avgTemp != null ? `${Math.round(b.avgTemp)}°C` : '--',
          pctDiff: null,
        };

  // Best month: award win if one is in-season and the other isn't
  const currentMonth = new Date().getMonth() + 1;
  const aInSeason = DESTINATIONS.find(
    (d) => d.label === a.destination,
  )?.bestMonths.includes(currentMonth) ?? false;
  const bInSeason = DESTINATIONS.find(
    (d) => d.label === b.destination,
  )?.bestMonths.includes(currentMonth) ?? false;

  const bestMonth: CategoryWinner = {
    winner: aInSeason && !bInSeason ? 'a' : bInSeason && !aInSeason ? 'b' : 'tie',
    aValue: a.bestMonth,
    bValue: b.bestMonth,
    pctDiff: null,
  };

  const topTip = textWinner(a.topTip, b.topTip);

  // Tally wins (ties count for neither)
  const cats = [cost, safety, roamScore, avgTemp, bestMonth] as const;
  let aWins = 0;
  let bWins = 0;
  for (const cat of cats) {
    if (cat.winner === 'a') aWins++;
    else if (cat.winner === 'b') bWins++;
  }

  const totalCategories = cats.length;
  const winnerName =
    aWins > bWins
      ? a.destination
      : bWins > aWins
        ? b.destination
        : null;

  return {
    a,
    b,
    categories: { cost, safety, roamScore, avgTemp, bestMonth, topTip },
    winnerName,
    aWins,
    bWins,
    totalCategories,
  };
}
