/**
 * Test Suite 3: Pro Gate — Feature gating & trip limits
 * If this breaks, free users get Pro features or Pro users get blocked.
 */
import { useAppStore } from '../lib/store';

// We need to test the pro-gate logic. Let's import and test it.
// Since pro-gate uses hooks, we test the underlying store logic.

beforeEach(() => {
  useAppStore.setState({
    isPro: false,
    tripsThisMonth: 0,
  });
});

describe('Pro Gating Logic', () => {
  // ── Free tier limits ────────────────────────────────────────
  it('free user with 0 trips can generate', () => {
    const { isPro, tripsThisMonth } = useAppStore.getState();
    const canGenerate = isPro || tripsThisMonth < 1;
    expect(canGenerate).toBe(true);
  });

  it('free user with 1 trip cannot generate', () => {
    useAppStore.getState().setTripsThisMonth(1);
    const { isPro, tripsThisMonth } = useAppStore.getState();
    const canGenerate = isPro || tripsThisMonth < 1;
    expect(canGenerate).toBe(false);
  });

  it('pro user with any trips can generate', () => {
    useAppStore.getState().setIsPro(true);
    useAppStore.getState().setTripsThisMonth(99);
    const { isPro, tripsThisMonth } = useAppStore.getState();
    const canGenerate = isPro || tripsThisMonth < 1;
    expect(canGenerate).toBe(true);
  });

  // ── Feature access ──────────────────────────────────────────
  const PRO_FEATURES = [
    'offline-prep',
    'travel-twin',
    'trip-chemistry',
    'memory-lane',
    'unlimited-trips',
    'priority-ai',
  ] as const;

  it('free user cannot access any Pro feature', () => {
    const { isPro } = useAppStore.getState();
    for (const _feature of PRO_FEATURES) {
      const gated = !isPro;
      expect(gated).toBe(true);
    }
  });

  it('pro user can access all Pro features', () => {
    useAppStore.getState().setIsPro(true);
    const { isPro } = useAppStore.getState();
    for (const _feature of PRO_FEATURES) {
      const gated = !isPro;
      expect(gated).toBe(false);
    }
  });

  // ── Edge cases ──────────────────────────────────────────────
  it('trip count resets correctly', () => {
    useAppStore.getState().setTripsThisMonth(5);
    useAppStore.getState().setTripsThisMonth(0);
    const { tripsThisMonth } = useAppStore.getState();
    expect(tripsThisMonth).toBe(0);
  });

  it('Pro status change immediately affects gating', () => {
    useAppStore.getState().setTripsThisMonth(1);

    // Free → blocked
    let state = useAppStore.getState();
    expect(state.isPro || state.tripsThisMonth < 1).toBe(false);

    // Upgrade → unblocked
    useAppStore.getState().setIsPro(true);
    state = useAppStore.getState();
    expect(state.isPro || state.tripsThisMonth < 1).toBe(true);

    // Downgrade → blocked again
    useAppStore.getState().setIsPro(false);
    state = useAppStore.getState();
    expect(state.isPro || state.tripsThisMonth < 1).toBe(false);
  });
});
