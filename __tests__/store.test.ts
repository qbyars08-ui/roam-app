/**
 * Test Suite 2: Zustand Store — Core app state
 * If this breaks, Pro gating, trip limits, and session management all fail.
 */
import { useAppStore } from '../lib/store';

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
    const mockSession = { user: { id: 'user-123', email: 'test@roam.app' } } as any;
    useAppStore.getState().setSession(mockSession);
    expect(useAppStore.getState().session).toEqual(mockSession);
  });

  it('clears session on logout', () => {
    const mockSession = { user: { id: 'user-123' } } as any;
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
    const trip = {
      id: 'trip-1',
      destination: 'Tokyo',
      itinerary: {} as any,
      createdAt: new Date().toISOString(),
    };
    useAppStore.getState().addTrip(trip as any);
    expect(useAppStore.getState().trips).toHaveLength(1);
    expect(useAppStore.getState().trips[0].destination).toBe('Tokyo');
  });

  it('does not mutate existing trips array when adding', () => {
    const trip1 = { id: 'trip-1', destination: 'Tokyo', itinerary: {} as any, createdAt: new Date().toISOString() };
    const trip2 = { id: 'trip-2', destination: 'Paris', itinerary: {} as any, createdAt: new Date().toISOString() };
    useAppStore.getState().addTrip(trip1 as any);
    const firstTrips = useAppStore.getState().trips;
    useAppStore.getState().addTrip(trip2 as any);
    // Original reference should be unchanged (immutability)
    expect(firstTrips).toHaveLength(1);
    expect(useAppStore.getState().trips).toHaveLength(2);
  });

  it('sets active trip', () => {
    useAppStore.getState().setActiveTripId('trip-1');
    expect(useAppStore.getState().activeTripId).toBe('trip-1');
  });
});

// ---------------------------------------------------------------------------
// Extended edge cases — removeTrip, updateTrip, updateTravelProfile, currency
// ---------------------------------------------------------------------------

function makeTrip(id: string, dest = 'Tokyo') {
  return { id, destination: dest, days: 3, budget: 'mid', vibes: [], itinerary: '{}', createdAt: new Date().toISOString() };
}

describe('Zustand Store — removeTrip', () => {
  beforeEach(() => {
    useAppStore.setState({ trips: [makeTrip('t1'), makeTrip('t2'), makeTrip('t3')] });
  });

  it('removes the trip with the given id', () => {
    useAppStore.getState().removeTrip('t2');
    const ids = useAppStore.getState().trips.map((t) => t.id);
    expect(ids).toEqual(['t1', 't3']);
  });

  it('is a no-op when id does not exist', () => {
    useAppStore.getState().removeTrip('nonexistent');
    expect(useAppStore.getState().trips).toHaveLength(3);
  });

  it('results in an empty array when the only trip is removed', () => {
    useAppStore.setState({ trips: [makeTrip('only')] });
    useAppStore.getState().removeTrip('only');
    expect(useAppStore.getState().trips).toHaveLength(0);
  });

  it('does not mutate the reference before the operation', () => {
    const before = useAppStore.getState().trips;
    useAppStore.getState().removeTrip('t1');
    expect(before).toHaveLength(3);
  });
});

describe('Zustand Store — updateTrip', () => {
  beforeEach(() => {
    useAppStore.setState({ trips: [makeTrip('u1', 'Paris'), makeTrip('u2', 'Rome')] });
  });

  it('updates only the matching trip', () => {
    useAppStore.getState().updateTrip('u1', { destination: 'Lisbon' });
    const trips = useAppStore.getState().trips;
    expect(trips.find((t) => t.id === 'u1')?.destination).toBe('Lisbon');
    expect(trips.find((t) => t.id === 'u2')?.destination).toBe('Rome');
  });

  it('merges partial update without losing other fields', () => {
    useAppStore.getState().updateTrip('u2', { days: 10 });
    const trip = useAppStore.getState().trips.find((t) => t.id === 'u2')!;
    expect(trip.days).toBe(10);
    expect(trip.destination).toBe('Rome');
  });

  it('is a no-op when id does not match any trip', () => {
    const before = useAppStore.getState().trips.map((t) => t.destination);
    useAppStore.getState().updateTrip('nope', { destination: 'Nowhere' });
    expect(useAppStore.getState().trips.map((t) => t.destination)).toEqual(before);
  });
});

describe('Zustand Store — setActiveTripId', () => {
  it('clears active trip id when set to null', () => {
    useAppStore.getState().setActiveTripId('trip-x');
    useAppStore.getState().setActiveTripId(null);
    expect(useAppStore.getState().activeTripId).toBeNull();
  });

  it('overwrites a previous active trip id', () => {
    useAppStore.getState().setActiveTripId('trip-1');
    useAppStore.getState().setActiveTripId('trip-2');
    expect(useAppStore.getState().activeTripId).toBe('trip-2');
  });
});

describe('Zustand Store — travel profile', () => {
  it('starts with a default travel profile', () => {
    const profile = useAppStore.getState().travelProfile;
    expect(typeof profile).toBe('object');
    expect(typeof profile.pace).toBe('number');
  });

  it('setTravelProfile replaces the full profile', () => {
    const newProfile = { ...useAppStore.getState().travelProfile, pace: 9 };
    useAppStore.getState().setTravelProfile(newProfile);
    expect(useAppStore.getState().travelProfile.pace).toBe(9);
  });

  it('updateTravelProfile merges partial changes', () => {
    useAppStore.getState().setTravelProfile({ ...useAppStore.getState().travelProfile, pace: 3 });
    useAppStore.getState().updateTravelProfile({ budgetStyle: 8 });
    expect(useAppStore.getState().travelProfile.pace).toBe(3);
    expect(useAppStore.getState().travelProfile.budgetStyle).toBe(8);
  });

  it('setHasCompletedProfile updates the flag', () => {
    useAppStore.getState().setHasCompletedProfile(true);
    expect(useAppStore.getState().hasCompletedProfile).toBe(true);
    useAppStore.getState().setHasCompletedProfile(false);
    expect(useAppStore.getState().hasCompletedProfile).toBe(false);
  });
});

describe('Zustand Store — currency', () => {
  it('starts with USD home currency', () => {
    expect(useAppStore.getState().homeCurrency).toBe('USD');
  });

  it('exchangeRates starts as null', () => {
    expect(useAppStore.getState().exchangeRates).toBeNull();
  });

  it('setExchangeRates updates the rates', () => {
    const rates = { base: 'USD', rates: { EUR: 0.92, JPY: 149.5 }, updatedAt: '2026-01-01' };
    useAppStore.getState().setExchangeRates(rates);
    expect(useAppStore.getState().exchangeRates?.rates.EUR).toBe(0.92);
  });

  it('setExchangeRates accepts null (reset)', () => {
    useAppStore.getState().setExchangeRates(null);
    expect(useAppStore.getState().exchangeRates).toBeNull();
  });
});

describe('Zustand Store — setTrips bulk replace', () => {
  it('replaces all trips at once', () => {
    useAppStore.setState({ trips: [makeTrip('old-1'), makeTrip('old-2')] });
    useAppStore.getState().setTrips([makeTrip('new-1')]);
    expect(useAppStore.getState().trips).toHaveLength(1);
    expect(useAppStore.getState().trips[0].id).toBe('new-1');
  });

  it('setTrips with empty array clears all trips', () => {
    useAppStore.setState({ trips: [makeTrip('t1'), makeTrip('t2')] });
    useAppStore.getState().setTrips([]);
    expect(useAppStore.getState().trips).toHaveLength(0);
  });
});
