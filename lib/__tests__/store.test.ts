/**
 * Test Suite: lib/store.ts — Zustand global state
 * Critical path: trips, session, pro status, and pets all live here.
 * Every screen in ROAM reads from this store.
 */
import { useAppStore } from '../store';
import type { Trip, Pet } from '../store';

// Silence AsyncStorage persistence calls — they're fire-and-forget in the store
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Prevent addTrip's dynamic import of streaks from loading real modules
jest.mock('../streaks', () => ({
  recordTripPlanned: jest.fn().mockResolvedValue(undefined),
  recordStreakOpen: jest.fn().mockResolvedValue(undefined),
}));

// Prevent currency fetch calls during initCurrency
jest.mock('../currency', () => ({
  getHomeCurrency: jest.fn().mockResolvedValue('USD'),
  setHomeCurrency: jest.fn().mockResolvedValue(undefined),
  fetchExchangeRates: jest.fn().mockResolvedValue({ base: 'USD', rates: {}, updatedAt: '' }),
}));

// Reset relevant state before each test — keeps tests isolated
beforeEach(() => {
  useAppStore.setState({
    session: null,
    trips: [],
    tripsThisMonth: 0,
    isPro: false,
    pets: [],
    petRemindersEnabled: false,
    activeTripId: null,
    isGenerating: false,
    chatMessages: [],
  });
});

// ── Initial state ──────────────────────────────────────────────────────────

describe('Initial state', () => {
  it('trips is an empty array', () => {
    expect(useAppStore.getState().trips).toEqual([]);
  });

  it('isPro is false', () => {
    expect(useAppStore.getState().isPro).toBe(false);
  });

  it('session is null', () => {
    expect(useAppStore.getState().session).toBeNull();
  });

  it('tripsThisMonth is 0', () => {
    expect(useAppStore.getState().tripsThisMonth).toBe(0);
  });

  it('pets is an empty array', () => {
    expect(useAppStore.getState().pets).toEqual([]);
  });

  it('isGenerating is false', () => {
    expect(useAppStore.getState().isGenerating).toBe(false);
  });
});

// ── addTrip ────────────────────────────────────────────────────────────────

describe('addTrip', () => {
  const makeTrip = (id: string, destination: string): Trip => ({
    id,
    destination,
    days: 5,
    budget: 'moderate',
    vibes: ['culture'],
    itinerary: '{}',
    createdAt: new Date().toISOString(),
  });

  it('adds a trip to the store', () => {
    useAppStore.getState().addTrip(makeTrip('trip-1', 'Tokyo'));
    expect(useAppStore.getState().trips).toHaveLength(1);
    expect(useAppStore.getState().trips[0].id).toBe('trip-1');
    expect(useAppStore.getState().trips[0].destination).toBe('Tokyo');
  });

  it('prepends new trips (most recent first)', () => {
    useAppStore.getState().addTrip(makeTrip('trip-1', 'Tokyo'));
    useAppStore.getState().addTrip(makeTrip('trip-2', 'Paris'));
    const { trips } = useAppStore.getState();
    expect(trips[0].id).toBe('trip-2');
    expect(trips[1].id).toBe('trip-1');
  });

  it('does not mutate the previous trips array (immutability)', () => {
    useAppStore.getState().addTrip(makeTrip('trip-1', 'Tokyo'));
    const snapshotAfterFirst = useAppStore.getState().trips;
    useAppStore.getState().addTrip(makeTrip('trip-2', 'Paris'));
    expect(snapshotAfterFirst).toHaveLength(1);
    expect(useAppStore.getState().trips).toHaveLength(2);
  });

  it('setTripsThisMonth tracks the monthly trip count (call alongside addTrip in production)', () => {
    const { addTrip, setTripsThisMonth } = useAppStore.getState();
    addTrip(makeTrip('trip-1', 'Bangkok'));
    setTripsThisMonth(1);
    expect(useAppStore.getState().trips).toHaveLength(1);
    expect(useAppStore.getState().tripsThisMonth).toBe(1);
  });
});

// ── setSession / clearSession ──────────────────────────────────────────────

describe('setSession / clearSession', () => {
  const mockSession = {
    user: { id: 'user-abc', email: 'test@roam.app' },
  } as any;

  it('sets a session', () => {
    useAppStore.getState().setSession(mockSession);
    expect(useAppStore.getState().session).toEqual(mockSession);
  });

  it('clears a session by setting null', () => {
    useAppStore.getState().setSession(mockSession);
    useAppStore.getState().setSession(null);
    expect(useAppStore.getState().session).toBeNull();
  });

  it('does not affect trips or isPro when session changes', () => {
    useAppStore.getState().setIsPro(true);
    useAppStore.getState().addTrip({
      id: 'trip-1',
      destination: 'Tokyo',
      days: 5,
      budget: 'moderate',
      vibes: [],
      itinerary: '{}',
      createdAt: new Date().toISOString(),
    });
    useAppStore.getState().setSession(mockSession);
    useAppStore.getState().setSession(null);
    expect(useAppStore.getState().isPro).toBe(true);
    expect(useAppStore.getState().trips).toHaveLength(1);
  });
});

// ── Pet management ─────────────────────────────────────────────────────────

describe('Pet management', () => {
  const petPayload: Omit<Pet, 'id'> = {
    name: 'Biscuit',
    type: 'dog',
    emoji: '',
    breed: 'Golden Retriever',
  };

  it('addPet adds a pet with a generated id', () => {
    useAppStore.getState().addPet(petPayload);
    const { pets } = useAppStore.getState();
    expect(pets).toHaveLength(1);
    expect(pets[0].name).toBe('Biscuit');
    expect(pets[0].type).toBe('dog');
    expect(typeof pets[0].id).toBe('string');
    expect(pets[0].id.length).toBeGreaterThan(0);
  });

  it('each added pet gets a unique id', () => {
    useAppStore.getState().addPet(petPayload);
    useAppStore.getState().addPet({ ...petPayload, name: 'Churro' });
    const { pets } = useAppStore.getState();
    expect(pets).toHaveLength(2);
    expect(pets[0].id).not.toBe(pets[1].id);
  });

  it('removePet removes the correct pet by id', () => {
    useAppStore.getState().addPet(petPayload);
    useAppStore.getState().addPet({ ...petPayload, name: 'Churro' });
    const idToRemove = useAppStore.getState().pets[0].id;
    useAppStore.getState().removePet(idToRemove);
    const { pets } = useAppStore.getState();
    expect(pets).toHaveLength(1);
    expect(pets.find((p) => p.id === idToRemove)).toBeUndefined();
  });

  it('removePet on a non-existent id leaves the list unchanged', () => {
    useAppStore.getState().addPet(petPayload);
    useAppStore.getState().removePet('non-existent-id');
    expect(useAppStore.getState().pets).toHaveLength(1);
  });

  it('setPets replaces the entire pets array', () => {
    useAppStore.getState().addPet(petPayload);
    const replacement: Pet[] = [
      { id: 'pet-x', name: 'Mochi', type: 'cat', emoji: '', breed: 'Siamese' },
    ];
    useAppStore.getState().setPets(replacement);
    expect(useAppStore.getState().pets).toEqual(replacement);
  });

  it('setPetRemindersEnabled toggles the reminder flag', () => {
    expect(useAppStore.getState().petRemindersEnabled).toBe(false);
    useAppStore.getState().setPetRemindersEnabled(true);
    expect(useAppStore.getState().petRemindersEnabled).toBe(true);
    useAppStore.getState().setPetRemindersEnabled(false);
    expect(useAppStore.getState().petRemindersEnabled).toBe(false);
  });
});
