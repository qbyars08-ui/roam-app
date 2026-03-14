/**
 * Unit tests for lib/smart-triggers.ts
 * Covers evaluateTrigger() priority logic, session tracking helpers,
 * cooldown gating, and trigger action/context correctness.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../lib/store';
import {
  evaluateTrigger,
  resetSessionTracking,
  trackScreenView,
  getSessionDepth,
} from '../lib/smart-triggers';

// ---------------------------------------------------------------------------
// Module mocks — isolate smart-triggers from its dependencies
// ---------------------------------------------------------------------------

jest.mock('../lib/streaks', () => ({
  getCurrentStreak: jest.fn().mockResolvedValue(0),
}));

jest.mock('../lib/analytics', () => ({
  track: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../lib/growth-hooks', () => ({
  canShowGrowthPrompt: jest.fn().mockResolvedValue(true),
  markGrowthPromptShown: jest.fn().mockResolvedValue(undefined),
  getEngagementScore: jest.fn().mockResolvedValue(0),
  recordGrowthEvent: jest.fn().mockResolvedValue(undefined),
}));

import { getCurrentStreak } from '../lib/streaks';
import { canShowGrowthPrompt, getEngagementScore } from '../lib/growth-hooks';
const mockGetStreak = getCurrentStreak as jest.Mock;
const mockCanShow = canShowGrowthPrompt as jest.Mock;
const mockEngagement = getEngagementScore as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStore(overrides: { isPro?: boolean; trips?: unknown[]; tripsThisMonth?: number }) {
  useAppStore.setState({
    isPro: overrides.isPro ?? false,
    trips: (overrides.trips ?? []) as ReturnType<typeof useAppStore.getState>['trips'],
    tripsThisMonth: overrides.tripsThisMonth ?? 0,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  mockCanShow.mockResolvedValue(true);
  mockGetStreak.mockResolvedValue(0);
  mockEngagement.mockResolvedValue(0);
  setStore({ isPro: false, trips: [], tripsThisMonth: 0 });
  resetSessionTracking();
});

// ---------------------------------------------------------------------------
// Cooldown gating
// ---------------------------------------------------------------------------

describe('evaluateTrigger — cooldown', () => {
  it('returns action=none with reason=cooldown when prompt is on cooldown', async () => {
    mockCanShow.mockResolvedValueOnce(false);
    const result = await evaluateTrigger('app_open');
    expect(result.action).toBe('none');
    expect(result.reason).toBe('cooldown');
  });
});

// ---------------------------------------------------------------------------
// post_generation event
// ---------------------------------------------------------------------------

describe('evaluateTrigger — post_generation', () => {
  it('returns upgrade/trip_limit when not Pro and has used ≥1 trip this month', async () => {
    setStore({ isPro: false, trips: [{ id: '1' }], tripsThisMonth: 1 });
    const result = await evaluateTrigger('post_generation');
    expect(result.action).toBe('upgrade');
    expect(result.context).toBe('trip_limit');
  });

  it('returns share/post_trip when Pro (no upgrade trigger)', async () => {
    setStore({ isPro: true, trips: [{ id: '1' }], tripsThisMonth: 1 });
    const result = await evaluateTrigger('post_generation');
    expect(result.action).toBe('share');
    expect(result.context).toBe('post_trip');
  });

  it('returns share/post_trip when not Pro but trips=0 this month', async () => {
    setStore({ isPro: false, trips: [{ id: '1' }], tripsThisMonth: 0 });
    const result = await evaluateTrigger('post_generation');
    expect(result.action).toBe('share');
  });

  it('upgrade/trip_limit has priority 95 — beats share (60)', async () => {
    setStore({ isPro: false, trips: [{ id: '1' }], tripsThisMonth: 1 });
    const result = await evaluateTrigger('post_generation');
    expect(result.priority).toBe(95);
  });

  it('returns none when no trips and not at limit', async () => {
    setStore({ isPro: false, trips: [], tripsThisMonth: 0 });
    const result = await evaluateTrigger('post_generation');
    expect(result.action).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// feature_tap event
// ---------------------------------------------------------------------------

describe('evaluateTrigger — feature_tap', () => {
  it('returns upgrade/feature_locked when not Pro', async () => {
    setStore({ isPro: false });
    const result = await evaluateTrigger('feature_tap');
    expect(result.action).toBe('upgrade');
    expect(result.context).toBe('feature_locked');
    expect(result.priority).toBe(90);
  });

  it('returns none when already Pro', async () => {
    setStore({ isPro: true });
    const result = await evaluateTrigger('feature_tap');
    expect(result.action).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// app_open event
// ---------------------------------------------------------------------------

describe('evaluateTrigger — app_open', () => {
  it('returns none for a new user with low engagement', async () => {
    mockEngagement.mockResolvedValueOnce(20);
    mockGetStreak.mockResolvedValueOnce(1);
    setStore({ isPro: false });
    const result = await evaluateTrigger('app_open');
    expect(result.action).toBe('none');
  });

  it('returns upgrade/high_engagement when engagement >= 60 and not Pro', async () => {
    mockEngagement.mockResolvedValueOnce(70);
    mockGetStreak.mockResolvedValueOnce(0);
    setStore({ isPro: false });
    const result = await evaluateTrigger('app_open');
    expect(result.action).toBe('upgrade');
    expect(result.context).toBe('high_engagement');
  });

  it('returns upgrade/streak_momentum when streak >= 5 and not Pro', async () => {
    mockEngagement.mockResolvedValueOnce(10);
    mockGetStreak.mockResolvedValueOnce(7);
    setStore({ isPro: false });
    const result = await evaluateTrigger('app_open');
    expect(result.action).toBe('upgrade');
    expect(result.context).toBe('streak_momentum');
  });

  it('high_engagement (70) beats streak_momentum (65) on priority', async () => {
    mockEngagement.mockResolvedValueOnce(70);
    mockGetStreak.mockResolvedValueOnce(7);
    setStore({ isPro: false });
    const result = await evaluateTrigger('app_open');
    expect(result.context).toBe('high_engagement');
    expect(result.priority).toBe(70);
  });

  it('does not show engagement/streak upgrade when Pro', async () => {
    mockEngagement.mockResolvedValueOnce(90);
    mockGetStreak.mockResolvedValueOnce(30);
    setStore({ isPro: true });
    const result = await evaluateTrigger('app_open');
    expect(result.action).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// post_share event
// ---------------------------------------------------------------------------

describe('evaluateTrigger — post_share', () => {
  it('returns refer/post_trip after sharing', async () => {
    const result = await evaluateTrigger('post_share');
    expect(result.action).toBe('refer');
    expect(result.context).toBe('post_trip');
    expect(result.priority).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// itinerary_view event
// ---------------------------------------------------------------------------

describe('evaluateTrigger — itinerary_view', () => {
  it('returns none for users with < 2 trips', async () => {
    setStore({ trips: [{ id: '1' }] });
    const result = await evaluateTrigger('itinerary_view');
    expect(result.action).toBe('none');
  });

  it('may return rate trigger for returning users with 2+ trips', async () => {
    setStore({ trips: [{ id: '1' }, { id: '2' }] });
    // No prior rate prompts in history → shouldPromptRating returns true
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const result = await evaluateTrigger('itinerary_view');
    expect(result.action).toBe('rate');
    expect(result.priority).toBe(40);
  });

  it('returns none when rate prompt was shown twice already', async () => {
    setStore({ trips: [{ id: '1' }, { id: '2' }] });
    const history = [
      { action: 'rate', context: 'default', ts: Date.now() - 10000 },
      { action: 'rate', context: 'default', ts: Date.now() - 5000 },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(history));
    const result = await evaluateTrigger('itinerary_view');
    expect(result.action).toBe('none');
  });

  it('returns none when rate prompt was shown within the last 7 days', async () => {
    setStore({ trips: [{ id: '1' }, { id: '2' }] });
    const history = [
      { action: 'rate', context: 'default', ts: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    ];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(history));
    const result = await evaluateTrigger('itinerary_view');
    expect(result.action).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// SmartTrigger shape validation
// ---------------------------------------------------------------------------

describe('evaluateTrigger — result shape', () => {
  it('every non-none trigger has action, context, priority > 0, reason', async () => {
    setStore({ isPro: false, trips: [{ id: '1' }], tripsThisMonth: 1 });
    const result = await evaluateTrigger('post_generation');
    expect(result.action).not.toBe('none');
    expect(result.priority).toBeGreaterThan(0);
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('none trigger has priority 0', async () => {
    mockCanShow.mockResolvedValueOnce(false);
    const result = await evaluateTrigger('app_open');
    expect(result.priority).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Session tracking — resetSessionTracking, trackScreenView, getSessionDepth
// ---------------------------------------------------------------------------

describe('resetSessionTracking', () => {
  it('resets screen count to 0', () => {
    trackScreenView();
    trackScreenView();
    resetSessionTracking();
    const depth = getSessionDepth();
    expect(depth.screens).toBe(0);
  });

  it('resets session start time (durationMs is near 0)', () => {
    resetSessionTracking();
    const depth = getSessionDepth();
    expect(depth.durationMs).toBeLessThan(50);
  });
});

describe('trackScreenView', () => {
  it('increments screen count', () => {
    resetSessionTracking();
    trackScreenView();
    trackScreenView();
    trackScreenView();
    expect(getSessionDepth().screens).toBe(3);
  });

  it('calls recordGrowthEvent("screen_view")', () => {
    const { recordGrowthEvent } = require('../lib/growth-hooks');
    trackScreenView();
    expect(recordGrowthEvent).toHaveBeenCalledWith('screen_view');
  });
});

describe('getSessionDepth', () => {
  it('returns an object with durationMs and screens', () => {
    resetSessionTracking();
    const depth = getSessionDepth();
    expect(typeof depth.durationMs).toBe('number');
    expect(typeof depth.screens).toBe('number');
  });

  it('durationMs increases over time', async () => {
    resetSessionTracking();
    await new Promise((r) => setTimeout(r, 20));
    const depth = getSessionDepth();
    expect(depth.durationMs).toBeGreaterThan(0);
  });
});
