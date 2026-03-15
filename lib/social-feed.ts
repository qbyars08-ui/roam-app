// =============================================================================
// Social Feed — Deterministic "live" event generator for social proof
// =============================================================================

import { DESTINATIONS } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type FeedEventType = 'trip_planned' | 'flight_searched' | 'destination_trending';

export type FeedEvent = {
  readonly id: string;
  readonly type: FeedEventType;
  readonly name: string;
  readonly destination: string;
  readonly detail: string;
  readonly minutesAgo: number;
};

type TrendDirection = 'up' | 'down' | 'flat';

export type DestinationTrend = {
  readonly weeklyChange: number;
  readonly direction: TrendDirection;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const NAMES: readonly string[] = [
  'Maya', 'Kai', 'Sofia', 'Liam', 'Rina', 'Marco', 'Aya', 'Noah',
  'Priya', 'Ethan', 'Yuki', 'Zara', 'Leo', 'Amara', 'Mateo', 'Isla',
  'Ravi', 'Chloe', 'Amir', 'Luna', 'Jin', 'Freya', 'Omar', 'Mila',
  'Davi', 'Ines', 'Soren', 'Hana', 'Felix', 'Leila', 'Tomas', 'Noa',
] as const;

const EVENT_TYPES: readonly FeedEventType[] = [
  'trip_planned', 'flight_searched', 'destination_trending',
] as const;

const TRIP_DURATIONS = [3, 4, 5, 7, 10, 14] as const;

// ---------------------------------------------------------------------------
// Deterministic seed — same output for same date+hour window
// ---------------------------------------------------------------------------
function deterministicSeed(index: number): number {
  const now = new Date();
  const dateHourKey = now.getFullYear() * 1_000_000
    + (now.getMonth() + 1) * 10_000
    + now.getDate() * 100
    + now.getHours();
  const raw = ((dateHourKey * 2654435761 + index * 40503) >>> 0) % 2147483647;
  return raw;
}

function seededMod(seed: number, mod: number): number {
  return ((seed >>> 0) % mod + mod) % mod;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function generateLiveFeedEvents(count: number): readonly FeedEvent[] {
  const destinations = DESTINATIONS.map((d) => d.label);

  return Array.from({ length: count }, (_, i) => {
    const seed = deterministicSeed(i);
    const nameIndex = seededMod(seed, NAMES.length);
    const destIndex = seededMod(seed * 31 + 7, destinations.length);
    const typeIndex = seededMod(seed * 13 + 3, EVENT_TYPES.length);
    const durationIndex = seededMod(seed * 17 + 11, TRIP_DURATIONS.length);

    const name = NAMES[nameIndex];
    const destination = destinations[destIndex];
    const type = EVENT_TYPES[typeIndex];
    const duration = TRIP_DURATIONS[durationIndex];

    const minutesAgo = seededMod(seed * 23 + 5, 45) + 1;

    const detail = buildDetail(type, destination, duration, seed);

    return Object.freeze({
      id: `feed-${seed}`,
      type,
      name,
      destination,
      detail,
      minutesAgo,
    });
  });
}

function buildDetail(
  type: FeedEventType,
  destination: string,
  duration: number,
  seed: number,
): string {
  switch (type) {
    case 'trip_planned':
      return `${duration} days in ${destination}`;
    case 'flight_searched':
      return `flights to ${destination}`;
    case 'destination_trending': {
      const change = seededMod(seed * 41 + 19, 30) + 5;
      return `trending +${change}%`;
    }
  }
}

export function getDestinationTrend(destination: string): DestinationTrend {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / 86_400_000,
  );
  const weekNumber = Math.floor(dayOfYear / 7);

  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    hash = ((hash << 5) - hash + destination.charCodeAt(i)) >>> 0;
  }
  const combined = ((hash * 2654435761 + weekNumber * 40503) >>> 0) % 2147483647;
  const rawChange = (combined % 51) - 15; // range: -15 to +35

  const direction: TrendDirection =
    rawChange > 2 ? 'up' : rawChange < -2 ? 'down' : 'flat';

  return Object.freeze({ weeklyChange: rawChange, direction });
}
