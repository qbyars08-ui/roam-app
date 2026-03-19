// =============================================================================
// ROAM — Timeline Engine
// Flattens itineraries into ordered timelines, supports reordering & stats
// =============================================================================

import type { Itinerary, ItineraryDay, TimeSlotActivity } from './types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export type ActivityCategory =
  | 'food'
  | 'culture'
  | 'adventure'
  | 'transport'
  | 'relaxation';

export interface TimelineEvent {
  readonly dayIndex: number;
  readonly slot: TimeSlot;
  readonly activity: string;
  readonly location: string;
  readonly time: string;
  readonly cost: string;
  readonly category: ActivityCategory;
  readonly tip?: string;
  readonly neighborhood?: string;
  readonly address?: string;
  readonly transitToNext?: string;
  readonly duration?: string;
}

export interface TimelineStats {
  readonly totalActivities: number;
  readonly totalCost: number;
  readonly busiestDay: number;
  readonly mostCommonCategory: ActivityCategory;
}

// ---------------------------------------------------------------------------
// Category inference from activity text
// ---------------------------------------------------------------------------

const FOOD_KEYWORDS = [
  'eat', 'food', 'restaurant', 'breakfast', 'lunch', 'dinner', 'café',
  'cafe', 'ramen', 'sushi', 'tapas', 'market', 'street food', 'brunch',
  'bakery', 'bistro', 'taco', 'pizza', 'wine', 'cocktail', 'bar',
  'cooking', 'cuisine', 'dine', 'meal',
];

const CULTURE_KEYWORDS = [
  'museum', 'temple', 'shrine', 'palace', 'cathedral', 'gallery',
  'historic', 'heritage', 'monument', 'castle', 'church', 'mosque',
  'theater', 'theatre', 'opera', 'library', 'art',
];

const ADVENTURE_KEYWORDS = [
  'hike', 'trek', 'climb', 'surf', 'dive', 'snorkel', 'kayak',
  'bike', 'cycle', 'zip', 'bungee', 'raft', 'adventure', 'mountain',
  'trail', 'waterfall', 'volcano', 'safari', 'paraglid',
];

const TRANSPORT_KEYWORDS = [
  'transfer', 'airport', 'flight', 'train', 'bus', 'ferry', 'taxi',
  'uber', 'transit', 'drive', 'depart', 'arrive', 'check-in', 'check-out',
];

function inferCategory(activity: string): ActivityCategory {
  const lower = activity.toLowerCase();
  if (TRANSPORT_KEYWORDS.some((k) => lower.includes(k))) return 'transport';
  if (FOOD_KEYWORDS.some((k) => lower.includes(k))) return 'food';
  if (CULTURE_KEYWORDS.some((k) => lower.includes(k))) return 'culture';
  if (ADVENTURE_KEYWORDS.some((k) => lower.includes(k))) return 'adventure';
  return 'relaxation';
}

// ---------------------------------------------------------------------------
// Build timeline
// ---------------------------------------------------------------------------

function slotToEvent(
  dayIndex: number,
  slot: TimeSlot,
  ts: TimeSlotActivity,
): TimelineEvent {
  return {
    dayIndex,
    slot,
    activity: ts.activity,
    location: ts.location,
    time: ts.time ?? (slot === 'morning' ? '9:00 AM' : slot === 'afternoon' ? '1:00 PM' : '7:00 PM'),
    cost: ts.cost,
    category: inferCategory(ts.activity),
    tip: ts.tip,
    neighborhood: ts.neighborhood,
    address: ts.address,
    transitToNext: ts.transitToNext,
    duration: ts.duration,
  };
}

export function buildTimeline(itinerary: Itinerary): readonly TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const slots: TimeSlot[] = ['morning', 'afternoon', 'evening'];

  for (let i = 0; i < itinerary.days.length; i++) {
    const day = itinerary.days[i];
    for (const slot of slots) {
      events.push(slotToEvent(i, slot, day[slot]));
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Reorder days (immutable)
// ---------------------------------------------------------------------------

export function reorderDays(
  itinerary: Itinerary,
  fromIndex: number,
  toIndex: number,
): Itinerary {
  if (fromIndex === toIndex) return itinerary;

  const days = [...itinerary.days];
  const [moved] = days.splice(fromIndex, 1);
  days.splice(toIndex, 0, moved);

  const renumbered: ItineraryDay[] = days.map((d, i) => ({
    ...d,
    day: i + 1,
  }));

  return { ...itinerary, days: renumbered };
}

// ---------------------------------------------------------------------------
// Swap activities between two slots (immutable)
// ---------------------------------------------------------------------------

export function swapActivities(
  itinerary: Itinerary,
  day1: number,
  slot1: TimeSlot,
  day2: number,
  slot2: TimeSlot,
): Itinerary {
  if (day1 === day2 && slot1 === slot2) return itinerary;

  const days = itinerary.days.map((d) => ({ ...d }));
  const act1 = days[day1][slot1];
  const act2 = days[day2][slot2];

  days[day1] = { ...days[day1], [slot1]: act2 };
  days[day2] = { ...days[day2], [slot2]: act1 };

  return { ...itinerary, days };
}

// ---------------------------------------------------------------------------
// Timeline statistics
// ---------------------------------------------------------------------------

function parseCostNumber(cost: string): number {
  const match = cost.replace(/[^0-9.]/g, '');
  const num = parseFloat(match);
  return isNaN(num) ? 0 : num;
}

export function getTimelineStats(
  timeline: readonly TimelineEvent[],
): TimelineStats {
  const totalActivities = timeline.length;

  const totalCost = timeline.reduce(
    (sum, ev) => sum + parseCostNumber(ev.cost),
    0,
  );

  // Busiest day = day with most non-zero-cost activities
  const dayActivityCounts = new Map<number, number>();
  for (const ev of timeline) {
    dayActivityCounts.set(
      ev.dayIndex,
      (dayActivityCounts.get(ev.dayIndex) ?? 0) + 1,
    );
  }
  let busiestDay = 0;
  let maxCount = 0;
  for (const [dayIdx, count] of dayActivityCounts) {
    if (count > maxCount) {
      maxCount = count;
      busiestDay = dayIdx;
    }
  }

  // Most common category
  const categoryCounts = new Map<ActivityCategory, number>();
  for (const ev of timeline) {
    categoryCounts.set(ev.category, (categoryCounts.get(ev.category) ?? 0) + 1);
  }
  let mostCommonCategory: ActivityCategory = 'relaxation';
  let maxCatCount = 0;
  for (const [cat, count] of categoryCounts) {
    if (count > maxCatCount) {
      maxCatCount = count;
      mostCommonCategory = cat;
    }
  }

  return { totalActivities, totalCost, busiestDay, mostCommonCategory };
}
