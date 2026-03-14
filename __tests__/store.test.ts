/**
 * Test Suite 2: Zustand Store — Core app state
 * If this breaks, Pro gating, trip limits, and session management all fail.
 */
import type { Session } from '@supabase/supabase-js';
import { useAppStore, type Trip } from '../lib/store';

// Reset store between tests
beforeEach(() => {
  useAppStore.setState({
    session: null,
    isPro: false,
    tripsThisMonth: 0,
    trips: [],
    activeTripId: null,
  });
});

describe('Zustand Store', () => {
  // ── Session management ──────────────────────────────────────
  it('starts with no session', () => {
    expect(useAppStore.getState().session).toBeNull();
  });

  it('sets session', () => {
    const mockSession = { user: { id: 'user-123', email: 'test@roam.app' } } as Session;
    useAppStore.getState().setSession(mockSession);
    expect(useAppStore.getState().session).toEqual(mockSession);
  });

  it('clears session on logout', () => {
    const mockSession = { user: { id: 'user-123' } } as Session;
    useAppStore.getState().setSession(mockSession);
    useAppStore.getState().setSession(null);
    expect(useAppStore.getState().session).toBeNull();
  });

  // ── Pro status ──────────────────────────────────────────────
  it('starts as free tier', () => {
    expect(useAppStore.getState().isPro).toBe(false);
  });

  it('sets Pro status', () => {
    useAppStore.getState().setIsPro(true);
    expect(useAppStore.getState().isPro).toBe(true);
  });

  it('reverts Pro status', () => {
    useAppStore.getState().setIsPro(true);
    useAppStore.getState().setIsPro(false);
    expect(useAppStore.getState().isPro).toBe(false);
  });

  // ── Trip tracking ───────────────────────────────────────────
  it('starts with zero trips this month', () => {
    expect(useAppStore.getState().tripsThisMonth).toBe(0);
  });

  it('increments trip count', () => {
    useAppStore.getState().setTripsThisMonth(1);
    expect(useAppStore.getState().tripsThisMonth).toBe(1);
  });

  // ── Trip CRUD ───────────────────────────────────────────────
  it('adds a trip', () => {
    const trip: Trip = {
      id: 'trip-1',
      destination: 'Tokyo',
      itinerary: '{}',
      days: 1,
      budget: 'mid',
      vibes: [],
      createdAt: new Date().toISOString(),
    };
    useAppStore.getState().addTrip(trip);
    expect(useAppStore.getState().trips).toHaveLength(1);
    expect(useAppStore.getState().trips[0].destination).toBe('Tokyo');
  });

  it('does not mutate existing trips array when adding', () => {
    const trip1: Trip = { id: 'trip-1', destination: 'Tokyo', itinerary: '{}', days: 1, budget: 'mid', vibes: [], createdAt: new Date().toISOString() };
    const trip2: Trip = { id: 'trip-2', destination: 'Paris', itinerary: '{}', days: 1, budget: 'mid', vibes: [], createdAt: new Date().toISOString() };
    useAppStore.getState().addTrip(trip1);
    const firstTrips = useAppStore.getState().trips;
    useAppStore.getState().addTrip(trip2);
    // Original reference should be unchanged (immutability)
    expect(firstTrips).toHaveLength(1);
    expect(useAppStore.getState().trips).toHaveLength(2);
  });

  it('sets active trip', () => {
    useAppStore.getState().setActiveTripId('trip-1');
    expect(useAppStore.getState().activeTripId).toBe('trip-1');
  });
});
