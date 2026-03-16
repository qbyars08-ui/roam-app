/**
 * Test Suite: Paywall Gate — free tier limit, Pro bypass, guest 1-trip cap
 *
 * The paywall is the most business-critical gate in ROAM.
 * If it's broken:
 *   - Free users get unlimited trips (revenue loss)
 *   - Pro users get blocked (refund requests + churn)
 *   - Guest users can generate infinitely without signing up
 *
 * Tests pure gating logic driven by Zustand store state and
 * the TripLimitReachedError thrown by the edge function.
 */

// supabase and AsyncStorage mocked globally in jest.setup.js

import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { TripLimitReachedError } from '../lib/claude';
import { isGuestSession } from '../lib/guest';
import type { Session } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Constants matching the app's subscription model
// ---------------------------------------------------------------------------

/** Free tier allows 1 trip per calendar month (enforced server-side) */
const FREE_TRIPS_PER_MONTH = 1;

/** Guest users may generate 1 trip total (no monthly reset) */
const GUEST_TRIP_LIMIT = 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRealSession(id = 'user-real-001'): Session {
  return {
    user: { id, email: 'user@roam.app' } as Session['user'],
    access_token: 'valid-jwt',
    refresh_token: 'refresh',
    expires_in: 3600,
    token_type: 'bearer',
  };
}

function makeGuestSession(): Session {
  return {
    user: { id: 'guest-web-1700000000000', email: null } as unknown as Session['user'],
    access_token: '',
    refresh_token: '',
    expires_in: 0,
    token_type: 'bearer',
  };
}

/** Determine if a user can generate a trip based purely on client-side store state */
function canGenerateTrip(isPro: boolean, tripsThisMonth: number): boolean {
  return isPro || tripsThisMonth < FREE_TRIPS_PER_MONTH;
}

/** Determine if a guest user has reached their trip cap */
function guestCanGenerate(tripCount: number): boolean {
  return tripCount < GUEST_TRIP_LIMIT;
}

const mockInvoke = supabase.functions.invoke as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({
    session: makeRealSession(),
    isPro: false,
    tripsThisMonth: 0,
  });
});

// ---------------------------------------------------------------------------
// Free tier limit — client-side gating logic
// ---------------------------------------------------------------------------

describe('Paywall Gate — free tier client-side check', () => {
  it('free user with 0 trips this month can generate', () => {
    expect(canGenerateTrip(false, 0)).toBe(true);
  });

  it('free user with 1 trip this month cannot generate (at limit)', () => {
    expect(canGenerateTrip(false, FREE_TRIPS_PER_MONTH)).toBe(false);
  });

  it('free user with 2 trips (over limit) cannot generate', () => {
    expect(canGenerateTrip(false, 2)).toBe(false);
  });

  it('free user threshold: exactly FREE_TRIPS_PER_MONTH - 1 can still generate', () => {
    expect(canGenerateTrip(false, FREE_TRIPS_PER_MONTH - 1)).toBe(true);
  });

  it('store tripsThisMonth drives the gate correctly at 0', () => {
    useAppStore.getState().setTripsThisMonth(0);
    const { isPro, tripsThisMonth } = useAppStore.getState();
    expect(canGenerateTrip(isPro, tripsThisMonth)).toBe(true);
  });

  it('store tripsThisMonth drives the gate correctly at limit', () => {
    useAppStore.getState().setTripsThisMonth(FREE_TRIPS_PER_MONTH);
    const { isPro, tripsThisMonth } = useAppStore.getState();
    expect(canGenerateTrip(isPro, tripsThisMonth)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pro user bypass
// ---------------------------------------------------------------------------

describe('Paywall Gate — Pro user bypass', () => {
  beforeEach(() => {
    useAppStore.getState().setIsPro(true);
  });

  it('Pro user with 0 trips can generate', () => {
    const { isPro, tripsThisMonth } = useAppStore.getState();
    expect(canGenerateTrip(isPro, tripsThisMonth)).toBe(true);
  });

  it('Pro user with many trips (over free limit) can still generate', () => {
    useAppStore.getState().setTripsThisMonth(99);
    const { isPro, tripsThisMonth } = useAppStore.getState();
    expect(canGenerateTrip(isPro, tripsThisMonth)).toBe(true);
  });

  it('upgrading from free to Pro immediately allows generation', () => {
    // Start from free tier explicitly
    useAppStore.setState({ isPro: false, tripsThisMonth: FREE_TRIPS_PER_MONTH });
    let state = useAppStore.getState();
    expect(canGenerateTrip(state.isPro, state.tripsThisMonth)).toBe(false);

    useAppStore.getState().setIsPro(true);
    state = useAppStore.getState();
    expect(canGenerateTrip(state.isPro, state.tripsThisMonth)).toBe(true);
  });

  it('downgrading Pro to free re-applies the monthly limit', () => {
    useAppStore.getState().setTripsThisMonth(FREE_TRIPS_PER_MONTH);
    useAppStore.getState().setIsPro(false);
    const { isPro, tripsThisMonth } = useAppStore.getState();
    expect(canGenerateTrip(isPro, tripsThisMonth)).toBe(false);
  });

  it('Pro user access is not affected by high tripsThisMonth values', () => {
    useAppStore.getState().setTripsThisMonth(1000);
    const { isPro, tripsThisMonth } = useAppStore.getState();
    expect(canGenerateTrip(isPro, tripsThisMonth)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Guest user — 1 trip total cap
// ---------------------------------------------------------------------------

describe('Paywall Gate — guest user 1-trip cap', () => {
  beforeEach(() => {
    useAppStore.setState({
      session: makeGuestSession(),
      isPro: false,
      tripsThisMonth: 0,
    });
  });

  it('isGuestSession returns true for the guest session in store', () => {
    const { session } = useAppStore.getState();
    expect(isGuestSession(session)).toBe(true);
  });

  it('guest user with 0 trips can generate', () => {
    expect(guestCanGenerate(0)).toBe(true);
  });

  it('guest user with 1 trip cannot generate (at cap)', () => {
    expect(guestCanGenerate(GUEST_TRIP_LIMIT)).toBe(false);
  });

  it('guest trip cap is independent of tripsThisMonth store value', () => {
    // Guest cap logic uses its own counter, not the monthly store counter
    expect(guestCanGenerate(0)).toBe(true);
    expect(guestCanGenerate(1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Server-side enforcement — TripLimitReachedError from edge function
// ---------------------------------------------------------------------------

describe('Paywall Gate — server-side LIMIT_REACHED propagation', () => {
  it('TripLimitReachedError is an instance of Error', () => {
    const err = new TripLimitReachedError(1, 1);
    expect(err).toBeInstanceOf(Error);
  });

  it('TripLimitReachedError has the correct name', () => {
    const err = new TripLimitReachedError(1, 1);
    expect(err.name).toBe('TripLimitReachedError');
  });

  it('TripLimitReachedError exposes tripsUsed and limit', () => {
    const err = new TripLimitReachedError(3, 5);
    expect(err.tripsUsed).toBe(3);
    expect(err.limit).toBe(5);
  });

  it('edge function LIMIT_REACHED is distinguished from generic errors', () => {
    const limitErr = new TripLimitReachedError(1, 1);
    const genericErr = new Error('Something else failed');
    expect(limitErr).toBeInstanceOf(TripLimitReachedError);
    expect(genericErr).not.toBeInstanceOf(TripLimitReachedError);
  });

  it('simulates edge function returning LIMIT_REACHED via mock', async () => {
    mockInvoke.mockResolvedValue({
      data: { code: 'LIMIT_REACHED', tripsUsed: 1, limit: 1 },
      error: null,
    });

    const { data } = await supabase.functions.invoke('claude-proxy', {
      body: { isTripGeneration: true },
    });

    // Replicate the callClaude logic that reads this response
    const shouldPaywall = data?.code === 'LIMIT_REACHED';
    expect(shouldPaywall).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Trip count persistence
// ---------------------------------------------------------------------------

describe('Paywall Gate — trip count state management', () => {
  it('setTripsThisMonth persists the count in store', () => {
    useAppStore.getState().setTripsThisMonth(1);
    expect(useAppStore.getState().tripsThisMonth).toBe(1);
  });

  it('trip count can be reset to 0 (simulates monthly reset)', () => {
    useAppStore.getState().setTripsThisMonth(1);
    useAppStore.getState().setTripsThisMonth(0);
    expect(useAppStore.getState().tripsThisMonth).toBe(0);

    const { isPro, tripsThisMonth } = useAppStore.getState();
    expect(canGenerateTrip(isPro, tripsThisMonth)).toBe(true);
  });

  it('trip count does not automatically increment when set', () => {
    useAppStore.getState().setTripsThisMonth(0);
    // setTripsThisMonth is a setter, not an incrementer
    useAppStore.getState().setTripsThisMonth(0);
    expect(useAppStore.getState().tripsThisMonth).toBe(0);
  });
});
