// =============================================================================
// ROAM — Seasonal Recommendations
// Scores 1–10 per destination per month; "Best in Oct" / "Avoid Jul–Aug" badges
// =============================================================================
import { DESTINATIONS, HIDDEN_DESTINATIONS } from './constants';

/** Destination label -> month (1–12) -> score 1–10 */
export type SeasonalScoresMap = Record<string, Record<number, number>>;

/** Month names for display */
const MONTH_NAMES: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
  7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec',
};

/** Destinations with explicit avoid months (monsoon, extreme heat, etc.) */
const AVOID_MONTHS: Record<string, number[]> = {
  Bali: [1, 2, 12],
  Bangkok: [4, 5],
  'Chiang Mai': [3, 4, 5],
  'Hoi An': [9, 10, 11],
  Tokyo: [7, 8],
  'Mexico City': [5, 6],
  Dubai: [6, 7, 8],
  Marrakech: [7, 8],
  'Cape Town': [6, 7, 8],
  Sydney: [6, 7, 8],
  Lisbon: [1, 2, 8],
  Reykjavik: [12, 1, 2],
  Santorini: [1, 2, 11, 12],
};

function buildScores(): SeasonalScoresMap {
  const map: SeasonalScoresMap = {};
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];

  for (const d of all) {
    const scores: Record<number, number> = {};
    const best = d.bestMonths ?? [];
    const avoid = AVOID_MONTHS[d.label] ?? [];

    for (let m = 1; m <= 12; m++) {
      if (avoid.includes(m)) {
        scores[m] = 2;
      } else if (best.includes(m)) {
        scores[m] = 9;
      } else {
        const hasAdjacent = best.some((b) => Math.abs(b - m) <= 1 || (b === 1 && m === 12) || (b === 12 && m === 1));
        scores[m] = hasAdjacent ? 7 : 5;
      }
    }
    map[d.label] = scores;
  }

  return map;
}

export const SEASONAL_SCORES = buildScores();

/** Get score 1–10 for destination in month (1–12) */
export function getSeasonalScore(destination: string, month: number): number {
  const destScores = SEASONAL_SCORES[destination];
  if (!destScores) return 5;
  return destScores[month] ?? 5;
}

export interface SeasonalBadgeInfo {
  best: string | null;
  avoid: string | null;
  score: number;
}

/** Format month range for display (e.g. Jul–Aug) */
function formatMonthRange(months: number[]): string {
  if (months.length === 0) return '';
  const sorted = [...months].sort((a, b) => a - b);
  const names = sorted.map((m) => MONTH_NAMES[m]);
  return names.join('\u2013');
}

/** Get "Best in Oct" or "Avoid Jul–Aug" style labels for a destination */
export function getSeasonalBadgeInfo(
  destination: string,
  month: number
): SeasonalBadgeInfo {
  const score = getSeasonalScore(destination, month);
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const dest = all.find((d) => d.label === destination);
  const bestMonths = dest?.bestMonths ?? [];
  const avoidMonths = AVOID_MONTHS[destination] ?? [];

  let best: string | null = null;
  let avoid: string | null = null;

  if (bestMonths.length > 0) {
    const range = formatMonthRange([bestMonths[0], bestMonths[bestMonths.length - 1]]);
    best = bestMonths.length === 1
      ? `Best in ${MONTH_NAMES[bestMonths[0]]}`
      : `Best ${range}`;
  }

  if (avoidMonths.length > 0) {
    avoid = `Avoid ${formatMonthRange(avoidMonths)}`;
  }

  return { best, avoid, score };
}
