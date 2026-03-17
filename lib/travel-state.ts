// =============================================================================
// ROAM — Travel state detection
// Determines which stage the user is in based on their trips.
// =============================================================================
import { useMemo } from 'react';
import type { Trip } from './store';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type TravelStage = 'DREAMING' | 'PLANNING' | 'IMMINENT' | 'TRAVELING' | 'RETURNED';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Days from now until the trip's departure. Uses startDate when set, falls back to createdAt. */
export function getDaysUntilDeparture(trip: Trip): number {
  const departure = new Date(trip.startDate ?? trip.createdAt);
  departure.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((departure.getTime() - today.getTime()) / MS_PER_DAY);
}

/** Days since the trip ended (departure + days). Negative = trip hasn't ended yet. */
export function getDaysSinceReturn(trip: Trip): number {
  const departure = new Date(trip.startDate ?? trip.createdAt);
  departure.setHours(0, 0, 0, 0);
  const end = new Date(departure.getTime() + trip.days * MS_PER_DAY);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((today.getTime() - end.getTime()) / MS_PER_DAY);
}

/** Stage for a single trip. */
function stageForTrip(trip: Trip): TravelStage {
  const daysUntil = getDaysUntilDeparture(trip);
  const daysSince = getDaysSinceReturn(trip);

  if (daysUntil > 7) return 'PLANNING';
  if (daysUntil >= 1 && daysUntil <= 7) return 'IMMINENT';
  if (daysUntil <= 0 && daysSince <= 0) return 'TRAVELING';
  if (daysSince > 0 && daysSince <= 30) return 'RETURNED';
  return 'DREAMING';
}

// ---------------------------------------------------------------------------
// Exported pure functions
// ---------------------------------------------------------------------------

/**
 * Returns the trip that most meaningfully drives the current stage.
 * Priority: TRAVELING > IMMINENT > PLANNING > RETURNED > null
 */
export function getActiveTripForStage(trips: Trip[]): Trip | null {
  if (trips.length === 0) return null;

  const priority: TravelStage[] = ['TRAVELING', 'IMMINENT', 'PLANNING', 'RETURNED'];

  for (const stage of priority) {
    const match = trips.find((t) => stageForTrip(t) === stage);
    if (match) return match;
  }

  return null;
}

/**
 * Pure function — determines the user's current travel stage from their trips.
 */
export function getTravelStage(trips: Trip[]): TravelStage {
  if (trips.length === 0) return 'DREAMING';

  const active = getActiveTripForStage(trips);
  if (!active) return 'DREAMING';

  return stageForTrip(active);
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------
export type UseTravelStageResult = {
  stage: TravelStage;
  activeTrip: Trip | null;
  /** Days until departure. null when no active trip or trip already started. */
  daysUntil: number | null;
  /** Days since return. null when no active trip or trip not yet ended. */
  daysSince: number | null;
};

export function useTravelStage(): UseTravelStageResult {
  const trips = useAppStore((s: { trips: Trip[] }) => s.trips);

  return useMemo(() => {
    const stage = getTravelStage(trips);
    const activeTrip = getActiveTripForStage(trips);

    const daysUntil =
      activeTrip && getDaysUntilDeparture(activeTrip) > 0
        ? getDaysUntilDeparture(activeTrip)
        : null;

    const daysSince =
      activeTrip && getDaysSinceReturn(activeTrip) > 0
        ? getDaysSinceReturn(activeTrip)
        : null;

    return { stage, activeTrip, daysUntil, daysSince };
  }, [trips]);
}
