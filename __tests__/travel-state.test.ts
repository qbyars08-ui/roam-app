/**
 * Test Suite: travel-state — getTravelStage, getActiveTripForStage,
 * getDaysUntilDeparture, getDaysSinceReturn
 *
 * These are pure functions, so no mocking is needed.
 * Trip.createdAt is used as the departure date; duration via Trip.days.
 */

import {
  getTravelStage,
  getActiveTripForStage,
  getDaysUntilDeparture,
  getDaysSinceReturn,
  type TravelStage,
} from '../lib/travel-state';
import type { Trip } from '../lib/store';

// ---------------------------------------------------------------------------
// Helper: build a Trip with createdAt offset from today
// offsetDays > 0 = future, offsetDays < 0 = past
// ---------------------------------------------------------------------------

function makeTrip(params: {
  id?: string;
  destination?: string;
  offsetDays: number;   // departure = today + offsetDays
  days: number;         // trip duration
}): Trip {
  const departure = new Date();
  departure.setHours(0, 0, 0, 0);
  departure.setDate(departure.getDate() + params.offsetDays);

  return {
    id: params.id ?? 'trip-test',
    destination: params.destination ?? 'Paris',
    days: params.days,
    budget: 'mid',
    vibes: ['culture'],
    itinerary: '{}',
    createdAt: departure.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// getTravelStage — all 5 states
// ---------------------------------------------------------------------------

describe('getTravelStage', () => {
  it('returns DREAMING when trips array is empty', () => {
    expect(getTravelStage([])).toBe('DREAMING');
  });

  it('returns DREAMING when all trips returned more than 30 days ago', () => {
    // Trip ended 35 days ago: departed 35+5=40 days ago, 5-day trip
    const oldTrip = makeTrip({ offsetDays: -40, days: 5 });
    expect(getTravelStage([oldTrip])).toBe('DREAMING');
  });

  it('returns PLANNING when departure is more than 7 days away', () => {
    // Departs in 30 days — clearly in planning stage
    const trip = makeTrip({ offsetDays: 30, days: 7 });
    expect(getTravelStage([trip])).toBe('PLANNING');
  });

  it('returns IMMINENT when departure is 3 days from now', () => {
    const trip = makeTrip({ offsetDays: 3, days: 7 });
    expect(getTravelStage([trip])).toBe('IMMINENT');
  });

  it('returns IMMINENT when departure is 1 day from now', () => {
    const trip = makeTrip({ offsetDays: 1, days: 7 });
    expect(getTravelStage([trip])).toBe('IMMINENT');
  });

  it('returns IMMINENT when departure is 7 days from now (boundary)', () => {
    const trip = makeTrip({ offsetDays: 7, days: 7 });
    expect(getTravelStage([trip])).toBe('IMMINENT');
  });

  it('returns TRAVELING when trip started 2 days ago and has 5 days total', () => {
    // offsetDays: -2 (started 2 days ago), days: 5 → end is +3 days from now
    const trip = makeTrip({ offsetDays: -2, days: 5 });
    expect(getTravelStage([trip])).toBe('TRAVELING');
  });

  it('returns TRAVELING when trip started today', () => {
    // offsetDays: 0, days: 7 → started today, ends in 7 days
    const trip = makeTrip({ offsetDays: 0, days: 7 });
    expect(getTravelStage([trip])).toBe('TRAVELING');
  });

  it('returns RETURNED when trip ended 5 days ago', () => {
    // Trip was 3 days, departed 8 days ago → ended 5 days ago
    const trip = makeTrip({ offsetDays: -8, days: 3 });
    expect(getTravelStage([trip])).toBe('RETURNED');
  });

  it('returns RETURNED when trip ended 1 day ago', () => {
    const trip = makeTrip({ offsetDays: -8, days: 7 });
    expect(getTravelStage([trip])).toBe('RETURNED');
  });
});

// ---------------------------------------------------------------------------
// getActiveTripForStage — priority ordering
// ---------------------------------------------------------------------------

describe('getActiveTripForStage', () => {
  it('returns null when trips is empty', () => {
    expect(getActiveTripForStage([])).toBeNull();
  });

  it('returns the TRAVELING trip when one exists', () => {
    const traveling = makeTrip({ id: 'active', offsetDays: -1, days: 5 });
    const planning = makeTrip({ id: 'plan', offsetDays: 30, days: 7 });
    const result = getActiveTripForStage([planning, traveling]);
    expect(result?.id).toBe('active');
  });

  it('returns the IMMINENT trip when no TRAVELING trip exists', () => {
    const imminent = makeTrip({ id: 'soon', offsetDays: 3, days: 7 });
    const planning = makeTrip({ id: 'plan', offsetDays: 30, days: 7 });
    const result = getActiveTripForStage([planning, imminent]);
    expect(result?.id).toBe('soon');
  });

  it('returns the PLANNING trip when no TRAVELING or IMMINENT exists', () => {
    const planning = makeTrip({ id: 'plan', offsetDays: 20, days: 7 });
    const result = getActiveTripForStage([planning]);
    expect(result?.id).toBe('plan');
  });

  it('returns the RETURNED trip when that is the best available', () => {
    const returned = makeTrip({ id: 'back', offsetDays: -10, days: 3 });
    const result = getActiveTripForStage([returned]);
    expect(result?.id).toBe('back');
  });

  it('returns null when only DREAMING-stage trips exist (very old)', () => {
    const oldTrip = makeTrip({ id: 'old', offsetDays: -60, days: 3 });
    expect(getActiveTripForStage([oldTrip])).toBeNull();
  });

  it('prefers TRAVELING over IMMINENT when both exist', () => {
    const traveling = makeTrip({ id: 'traveling', offsetDays: -1, days: 5 });
    const imminent = makeTrip({ id: 'imminent', offsetDays: 2, days: 7 });
    const result = getActiveTripForStage([imminent, traveling]);
    expect(result?.id).toBe('traveling');
  });
});

// ---------------------------------------------------------------------------
// getDaysUntilDeparture
// ---------------------------------------------------------------------------

describe('getDaysUntilDeparture', () => {
  it('returns a positive number when departure is in the future', () => {
    const trip = makeTrip({ offsetDays: 10, days: 7 });
    const result = getDaysUntilDeparture(trip);
    expect(result).toBe(10);
  });

  it('returns 0 when departure is today', () => {
    const trip = makeTrip({ offsetDays: 0, days: 7 });
    const result = getDaysUntilDeparture(trip);
    expect(result).toBe(0);
  });

  it('returns a negative number when departure was in the past', () => {
    const trip = makeTrip({ offsetDays: -5, days: 7 });
    const result = getDaysUntilDeparture(trip);
    expect(result).toBe(-5);
  });

  it('returns the correct number for a trip departing in 30 days', () => {
    const trip = makeTrip({ offsetDays: 30, days: 7 });
    expect(getDaysUntilDeparture(trip)).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// getDaysSinceReturn
// ---------------------------------------------------------------------------

describe('getDaysSinceReturn', () => {
  it('returns a positive number when trip already ended', () => {
    // Departed 10 days ago, 3-day trip → ended 7 days ago
    const trip = makeTrip({ offsetDays: -10, days: 3 });
    const result = getDaysSinceReturn(trip);
    expect(result).toBe(7);
  });

  it('returns a non-positive number when trip is still ongoing', () => {
    // Departed 1 day ago, 7-day trip → ends in 6 days
    const trip = makeTrip({ offsetDays: -1, days: 7 });
    const result = getDaysSinceReturn(trip);
    expect(result).toBeLessThanOrEqual(0);
  });

  it('returns a non-positive number when trip has not started yet', () => {
    const trip = makeTrip({ offsetDays: 5, days: 7 });
    const result = getDaysSinceReturn(trip);
    expect(result).toBeLessThan(0);
  });

  it('returns correct days for a trip that ended exactly 1 day ago', () => {
    // departed 8 days ago, 7-day trip → ended 1 day ago
    const trip = makeTrip({ offsetDays: -8, days: 7 });
    const result = getDaysSinceReturn(trip);
    expect(result).toBe(1);
  });
});
