// =============================================================================
// ROAM — Timezone Meeting Planner
// Find overlapping work hours between home and destination timezones.
// Pure calculation — no API needed.
// =============================================================================

export interface TimeSlot {
  readonly hour: number; // 0-23 in destination local time
  readonly homeHour: number; // 0-23 in home local time
  readonly quality: 'ideal' | 'possible' | 'bad';
  readonly label: string; // e.g. "9am Tokyo / 8pm NYC"
}

export interface OverlapResult {
  readonly destinationTz: string;
  readonly homeTz: string;
  readonly offsetHours: number;
  readonly idealSlots: readonly TimeSlot[];
  readonly possibleSlots: readonly TimeSlot[];
  readonly summary: string;
  readonly tip: string;
}

// ---------------------------------------------------------------------------
// Timezone offsets (UTC) — covers common destinations
// ---------------------------------------------------------------------------

const TZ_OFFSETS: Record<string, number> = {
  // Asia
  tokyo: 9,
  seoul: 9,
  bangkok: 7,
  bali: 8,
  singapore: 8,
  'hong kong': 8,
  shanghai: 8,
  mumbai: 5.5,
  delhi: 5.5,
  dubai: 4,
  // Europe
  paris: 1,
  london: 0,
  rome: 1,
  barcelona: 1,
  berlin: 1,
  amsterdam: 1,
  lisbon: 0,
  athens: 2,
  istanbul: 3,
  // Americas
  'new york': -5,
  'los angeles': -8,
  chicago: -6,
  denver: -7,
  'mexico city': -6,
  'buenos aires': -3,
  'são paulo': -3,
  bogota: -5,
  lima: -5,
  // Oceania
  sydney: 11,
  melbourne: 11,
  auckland: 13,
  // Africa
  'cape town': 2,
  cairo: 2,
  nairobi: 3,
  marrakech: 1,
};

// Home timezone presets (US-centric default, expandable)
const HOME_TZ_OFFSETS: Record<string, number> = {
  'US Eastern': -5,
  'US Central': -6,
  'US Mountain': -7,
  'US Pacific': -8,
  'UK': 0,
  'Central Europe': 1,
  'India': 5.5,
  'Australia Eastern': 11,
  'Japan': 9,
};

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

function getOffset(destination: string): number | null {
  const key = destination.toLowerCase().trim();
  return TZ_OFFSETS[key] ?? null;
}

function formatHour(h: number): string {
  const normalized = ((h % 24) + 24) % 24;
  if (normalized === 0) return '12am';
  if (normalized === 12) return '12pm';
  if (normalized < 12) return `${normalized}am`;
  return `${normalized - 12}pm`;
}

function getSlotQuality(homeHour: number): 'ideal' | 'possible' | 'bad' {
  const h = ((homeHour % 24) + 24) % 24;
  // Ideal: 9am-6pm work hours at home
  if (h >= 9 && h <= 18) return 'ideal';
  // Possible: 7-9am or 6-10pm (early/late but doable)
  if ((h >= 7 && h < 9) || (h > 18 && h <= 22)) return 'possible';
  // Bad: sleeping hours
  return 'bad';
}

function generateTip(offsetDiff: number): string {
  const abs = Math.abs(offsetDiff);
  if (abs <= 3) return 'Easy overlap — schedule calls during your normal work hours.';
  if (abs <= 6) return 'Moderate offset. Morning meetings if ahead, evening if behind.';
  if (abs <= 9) return 'Tough overlap. Find the 2-hour window and protect it.';
  return 'Opposite schedules. Async communication is your best friend — use Loom and Slack.';
}

function generateSummary(
  destination: string,
  homeTz: string,
  offsetDiff: number,
  idealCount: number,
): string {
  const abs = Math.abs(offsetDiff);
  const direction = offsetDiff > 0 ? 'ahead of' : 'behind';

  if (abs === 0) return `${destination} is in the same timezone as ${homeTz}. No adjustment needed.`;
  if (idealCount >= 6) return `${destination} is ${abs}h ${direction} ${homeTz}. Great overlap — ${idealCount} shared work hours.`;
  if (idealCount >= 3) return `${destination} is ${abs}h ${direction} ${homeTz}. Decent overlap — ${idealCount} shared work hours.`;
  if (idealCount >= 1) return `${destination} is ${abs}h ${direction} ${homeTz}. Tight overlap — only ${idealCount} shared work hours.`;
  return `${destination} is ${abs}h ${direction} ${homeTz}. Almost no overlap — go fully async.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function calculateOverlap(
  destination: string,
  homeTz: string = 'US Eastern',
): OverlapResult | null {
  const destOffset = getOffset(destination);
  const homeOffset = HOME_TZ_OFFSETS[homeTz];

  if (destOffset === null || homeOffset === undefined) return null;

  const offsetDiff = destOffset - homeOffset;

  const slots: TimeSlot[] = [];
  // Generate slots for reasonable destination hours (7am-11pm)
  for (let destHour = 7; destHour <= 23; destHour++) {
    const homeHour = destHour - offsetDiff;
    const quality = getSlotQuality(homeHour);
    const normalizedHome = ((homeHour % 24) + 24) % 24;
    slots.push({
      hour: destHour,
      homeHour: normalizedHome,
      quality,
      label: `${formatHour(destHour)} ${destination} / ${formatHour(normalizedHome)} ${homeTz}`,
    });
  }

  const idealSlots = slots.filter((s) => s.quality === 'ideal');
  const possibleSlots = slots.filter((s) => s.quality === 'possible');

  return {
    destinationTz: destination,
    homeTz,
    offsetHours: offsetDiff,
    idealSlots,
    possibleSlots,
    summary: generateSummary(destination, homeTz, offsetDiff, idealSlots.length),
    tip: generateTip(offsetDiff),
  };
}

export function getAvailableHomeTimezones(): readonly string[] {
  return Object.keys(HOME_TZ_OFFSETS);
}

export function hasTimezoneData(destination: string): boolean {
  return getOffset(destination) !== null;
}

export function getTimezoneOffset(destination: string): number | null {
  return getOffset(destination);
}

export const SLOT_QUALITY_COLORS = {
  ideal: 'sage',
  possible: 'gold',
  bad: 'coral',
} as const;

export const SLOT_QUALITY_LABELS = {
  ideal: 'Work hours',
  possible: 'Stretch hours',
  bad: 'Sleeping',
} as const;
