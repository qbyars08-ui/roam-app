// =============================================================================
// ROAM — Crowd Intelligence
// Combines public holidays, seasonal patterns, and event data to predict
// crowd levels at destinations. No API key needed.
// =============================================================================
import { getPublicHolidays, getCountryCode, type PublicHoliday } from './public-holidays';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type CrowdLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface CrowdForecast {
  date: string;        // YYYY-MM-DD
  level: CrowdLevel;
  score: number;       // 0-100
  reasons: string[];   // Why it's crowded/empty
  holiday?: PublicHoliday;
  priceMultiplier: number; // 1.0 = normal, 2.0 = double
}

export interface CrowdSummary {
  destination: string;
  days: CrowdForecast[];
  avgScore: number;
  peakDay: CrowdForecast | null;
  quietestDay: CrowdForecast | null;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Seasonal crowd baselines (month index 0-11 → score 0-100)
// ---------------------------------------------------------------------------
const SEASONAL_BASELINES: Record<string, number[]> = {
  'tokyo':        [30, 25, 55, 70, 60, 45, 65, 50, 40, 55, 65, 55],
  'kyoto':        [25, 20, 60, 80, 55, 35, 50, 45, 35, 60, 75, 40],
  'bali':         [40, 35, 30, 45, 40, 55, 70, 75, 60, 45, 40, 60],
  'bangkok':      [50, 45, 40, 30, 25, 20, 25, 25, 20, 30, 55, 65],
  'paris':        [30, 30, 40, 55, 65, 75, 85, 80, 60, 50, 35, 45],
  'barcelona':    [25, 25, 35, 50, 65, 80, 90, 85, 70, 50, 30, 35],
  'rome':         [30, 25, 40, 60, 70, 80, 85, 80, 65, 55, 35, 40],
  'london':       [30, 30, 40, 50, 60, 70, 80, 75, 55, 45, 35, 45],
  'lisbon':       [25, 25, 35, 50, 60, 75, 85, 80, 65, 45, 30, 35],
  'new york':     [35, 30, 40, 55, 60, 70, 75, 70, 60, 55, 55, 75],
  'mexico city':  [35, 30, 45, 55, 40, 35, 45, 40, 40, 50, 60, 70],
  'marrakech':    [35, 30, 45, 55, 45, 30, 25, 25, 35, 55, 50, 55],
  'seoul':        [25, 20, 35, 60, 55, 45, 55, 45, 50, 65, 45, 30],
  'istanbul':     [25, 25, 35, 50, 60, 75, 80, 75, 60, 50, 35, 35],
  'budapest':     [20, 20, 30, 45, 55, 70, 80, 75, 55, 40, 30, 45],
  'amsterdam':    [30, 25, 35, 65, 55, 65, 75, 70, 55, 45, 30, 45],
  'cape town':    [75, 70, 55, 40, 30, 25, 25, 30, 35, 45, 55, 70],
  'dubai':        [60, 55, 50, 40, 25, 15, 15, 15, 20, 40, 60, 70],
  'sydney':       [70, 60, 50, 40, 35, 30, 35, 35, 40, 45, 55, 70],
  'buenos aires': [55, 50, 45, 40, 35, 30, 40, 35, 35, 45, 50, 55],
};

const DEFAULT_BASELINE = [40, 35, 40, 50, 55, 60, 70, 65, 55, 50, 40, 45];

// ---------------------------------------------------------------------------
// Major events/festivals that massively impact crowds
// ---------------------------------------------------------------------------
interface MajorEvent {
  destination: string;
  name: string;
  monthStart: number;  // 1-12
  dayStart: number;
  monthEnd: number;
  dayEnd: number;
  crowdBoost: number;  // Added to baseline score
  priceMultiplier: number;
}

const MAJOR_EVENTS: MajorEvent[] = [
  { destination: 'tokyo', name: 'Cherry Blossom Season', monthStart: 3, dayStart: 20, monthEnd: 4, dayEnd: 15, crowdBoost: 30, priceMultiplier: 1.8 },
  { destination: 'tokyo', name: 'Golden Week', monthStart: 4, dayStart: 29, monthEnd: 5, dayEnd: 5, crowdBoost: 40, priceMultiplier: 2.5 },
  { destination: 'barcelona', name: 'La Merce Festival', monthStart: 9, dayStart: 20, monthEnd: 9, dayEnd: 24, crowdBoost: 25, priceMultiplier: 1.5 },
  { destination: 'barcelona', name: 'MWC Tech Conference', monthStart: 2, dayStart: 24, monthEnd: 2, dayEnd: 27, crowdBoost: 20, priceMultiplier: 2.0 },
  { destination: 'new york', name: 'New Year\'s Eve', monthStart: 12, dayStart: 28, monthEnd: 1, dayEnd: 2, crowdBoost: 35, priceMultiplier: 2.5 },
  { destination: 'marrakech', name: 'Ramadan (varies)', monthStart: 3, dayStart: 1, monthEnd: 3, dayEnd: 30, crowdBoost: -15, priceMultiplier: 0.8 },
  { destination: 'bali', name: 'Nyepi (Day of Silence)', monthStart: 3, dayStart: 14, monthEnd: 3, dayEnd: 14, crowdBoost: -30, priceMultiplier: 0.7 },
  { destination: 'amsterdam', name: 'King\'s Day', monthStart: 4, dayStart: 26, monthEnd: 4, dayEnd: 27, crowdBoost: 35, priceMultiplier: 2.0 },
  { destination: 'budapest', name: 'Sziget Festival', monthStart: 8, dayStart: 10, monthEnd: 8, dayEnd: 16, crowdBoost: 30, priceMultiplier: 1.8 },
  { destination: 'seoul', name: 'Cherry Blossom Festival', monthStart: 4, dayStart: 1, monthEnd: 4, dayEnd: 15, crowdBoost: 25, priceMultiplier: 1.5 },
  { destination: 'lisbon', name: 'Santos Populares', monthStart: 6, dayStart: 12, monthEnd: 6, dayEnd: 13, crowdBoost: 25, priceMultiplier: 1.4 },
  { destination: 'rome', name: 'Easter Week', monthStart: 4, dayStart: 10, monthEnd: 4, dayEnd: 21, crowdBoost: 30, priceMultiplier: 1.8 },
  { destination: 'cape town', name: 'Cape Town Jazz Festival', monthStart: 3, dayStart: 27, monthEnd: 3, dayEnd: 28, crowdBoost: 20, priceMultiplier: 1.5 },
  { destination: 'dubai', name: 'Dubai Shopping Festival', monthStart: 12, dayStart: 15, monthEnd: 1, dayEnd: 29, crowdBoost: 30, priceMultiplier: 1.6 },
  { destination: 'mexico city', name: 'Day of the Dead', monthStart: 10, dayStart: 31, monthEnd: 11, dayEnd: 2, crowdBoost: 35, priceMultiplier: 2.0 },
  { destination: 'kyoto', name: 'Gion Matsuri', monthStart: 7, dayStart: 1, monthEnd: 7, dayEnd: 31, crowdBoost: 30, priceMultiplier: 1.8 },
  { destination: 'paris', name: 'Bastille Day', monthStart: 7, dayStart: 13, monthEnd: 7, dayEnd: 15, crowdBoost: 25, priceMultiplier: 1.5 },
  { destination: 'london', name: 'Notting Hill Carnival', monthStart: 8, dayStart: 24, monthEnd: 8, dayEnd: 25, crowdBoost: 25, priceMultiplier: 1.4 },
  { destination: 'istanbul', name: 'Istanbul Music Festival', monthStart: 6, dayStart: 1, monthEnd: 6, dayEnd: 25, crowdBoost: 15, priceMultiplier: 1.3 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isDateInRange(
  date: Date,
  mStart: number,
  dStart: number,
  mEnd: number,
  dEnd: number,
): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (mStart <= mEnd) {
    if (m < mStart || m > mEnd) return false;
    if (m === mStart && d < dStart) return false;
    if (m === mEnd && d > dEnd) return false;
    return true;
  }
  // Wraps around year (e.g., Dec 28 → Jan 2)
  if (m > mStart || (m === mStart && d >= dStart)) return true;
  if (m < mEnd || (m === mEnd && d <= dEnd)) return true;
  return false;
}

function scoreToCrowdLevel(score: number): CrowdLevel {
  if (score <= 30) return 'low';
  if (score <= 55) return 'moderate';
  if (score <= 75) return 'high';
  return 'extreme';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Main: get crowd forecast for a date range
// ---------------------------------------------------------------------------
export async function getCrowdForecast(
  destination: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): Promise<CrowdSummary> {
  const destKey = destination.toLowerCase().trim();
  const baselines = SEASONAL_BASELINES[destKey] ?? DEFAULT_BASELINE;

  // Fetch holidays
  const countryCode = getCountryCode(destination);
  let holidays: PublicHoliday[] = [];
  if (countryCode) {
    try {
      const year = new Date(startDate).getFullYear();
      holidays = await getPublicHolidays(countryCode, year);
    } catch {
      // Offline — skip holidays
    }
  }

  const holidayMap = new Map(holidays.map((h) => [h.date, h]));

  // Get relevant events
  const relevantEvents = MAJOR_EVENTS.filter(
    (e) => e.destination === destKey,
  );

  // Build daily forecasts
  const days: CrowdForecast[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const month = d.getMonth();
    const dayOfWeek = d.getDay();

    let score = baselines[month];
    const reasons: string[] = [];
    let priceMultiplier = 1.0;

    // Weekend boost
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      score += 8;
      reasons.push('Weekend');
    }

    // Holiday boost
    const holiday = holidayMap.get(dateStr);
    if (holiday) {
      score += 20;
      priceMultiplier = Math.max(priceMultiplier, 1.4);
      reasons.push(`Holiday: ${holiday.name}`);
    }

    // Major event boost
    for (const event of relevantEvents) {
      if (isDateInRange(d, event.monthStart, event.dayStart, event.monthEnd, event.dayEnd)) {
        score += event.crowdBoost;
        priceMultiplier = Math.max(priceMultiplier, event.priceMultiplier);
        reasons.push(event.name);
      }
    }

    score = clamp(score, 0, 100);

    days.push({
      date: dateStr,
      level: scoreToCrowdLevel(score),
      score,
      reasons,
      holiday,
      priceMultiplier,
    });
  }

  // Summary stats
  const avgScore = days.length > 0
    ? Math.round(days.reduce((s, d) => s + d.score, 0) / days.length)
    : 0;

  const peakDay = days.length > 0
    ? days.reduce((max, d) => d.score > max.score ? d : max, days[0])
    : null;

  const quietestDay = days.length > 0
    ? days.reduce((min, d) => d.score < min.score ? d : min, days[0])
    : null;

  // Generate warnings
  const warnings: string[] = [];
  const extremeDays = days.filter((d) => d.level === 'extreme');
  if (extremeDays.length > 0) {
    const eventNames = [...new Set(extremeDays.flatMap((d) => d.reasons))];
    warnings.push(`Expect extreme crowds${eventNames.length > 0 ? `: ${eventNames.join(', ')}` : ''}. Book accommodation now.`);
  }

  const highPriceDays = days.filter((d) => d.priceMultiplier >= 1.8);
  if (highPriceDays.length > 0) {
    const maxMultiplier = Math.max(...highPriceDays.map((d) => d.priceMultiplier));
    warnings.push(`Prices up to ${Math.round(maxMultiplier * 100 - 100)}% higher during this period.`);
  }

  return {
    destination,
    days,
    avgScore,
    peakDay,
    quietestDay,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Quick check: is this a good time to visit?
// ---------------------------------------------------------------------------
export function getVisitVerdict(avgScore: number): {
  verdict: 'great' | 'good' | 'okay' | 'avoid';
  label: string;
  detail: string;
} {
  if (avgScore <= 30) return {
    verdict: 'great',
    label: 'Perfect timing',
    detail: 'Low crowds, normal prices. This is when locals actually enjoy their city.',
  };
  if (avgScore <= 50) return {
    verdict: 'good',
    label: 'Good timing',
    detail: 'Moderate crowds. Manageable — just skip the main tourist sites between noon and 3pm.',
  };
  if (avgScore <= 70) return {
    verdict: 'okay',
    label: 'Peak season',
    detail: 'Busy and pricey. Book popular spots at least 3 days ahead and go early.',
  };
  return {
    verdict: 'avoid',
    label: 'Extreme crowds',
    detail: 'Major event or holiday. Prices are way up and everything is packed. Shift your dates if you can.',
  };
}
