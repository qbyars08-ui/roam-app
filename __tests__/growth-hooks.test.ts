/**
 * Unit tests for lib/growth-hooks.ts
 * Covers milestone evaluation, engagement scoring, upgrade messages,
 * growth prompt cooldown, and social proof copy.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../lib/store';
import {
  checkMilestones,
  dismissMilestone,
  recordGrowthEvent,
  canShowGrowthPrompt,
  markGrowthPromptShown,
  getEngagementScore,
  getPaywallSocialProof,
  getUpgradeMessage,
  type MilestoneType,
  type UpgradeContext,
} from '../lib/growth-hooks';

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock('../lib/streaks', () => ({
  getCurrentStreak: jest.fn().mockResolvedValue(0),
}));

jest.mock('../lib/analytics', () => ({
  track: jest.fn().mockResolvedValue(undefined),
}));

import { getCurrentStreak } from '../lib/streaks';
const mockGetCurrentStreak = getCurrentStreak as jest.Mock;

// ---------------------------------------------------------------------------
// Store reset helper
// ---------------------------------------------------------------------------
function setStoreState(overrides: { trips?: unknown[]; isPro?: boolean }) {
  useAppStore.setState({
    trips: (overrides.trips ?? []) as ReturnType<typeof useAppStore.getState>['trips'],
    isPro: overrides.isPro ?? false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  mockGetCurrentStreak.mockResolvedValue(0);
  setStoreState({ trips: [], isPro: false });
});

// ---------------------------------------------------------------------------
// getUpgradeMessage — pure switch, all 6 branches
// ---------------------------------------------------------------------------

describe('getUpgradeMessage', () => {
  const contexts: UpgradeContext[] = [
    'trip_limit', 'feature_locked', 'post_trip',
    'high_engagement', 'streak_momentum', 'default',
  ];

  for (const ctx of contexts) {
    it(`returns non-empty headline and subtext for "${ctx}"`, () => {
      const msg = getUpgradeMessage(ctx);
      expect(typeof msg.headline).toBe('string');
      expect(msg.headline.length).toBeGreaterThan(0);
      expect(typeof msg.subtext).toBe('string');
      expect(msg.subtext.length).toBeGreaterThan(0);
    });
  }

  it('trip_limit headline mentions unlimited', () => {
    expect(getUpgradeMessage('trip_limit').headline).toContain('Unlock unlimited');
  });

  it('streak_momentum headline mentions streak', () => {
    expect(getUpgradeMessage('streak_momentum').headline.toLowerCase()).toContain('roll');
  });

  it('default headline mentions planning for free', () => {
    expect(getUpgradeMessage('default').headline).toContain('planning for free');
  });
});

// ---------------------------------------------------------------------------
// getPaywallSocialProof — deterministic within same day
// ---------------------------------------------------------------------------

describe('getPaywallSocialProof', () => {
  it('returns an upgradeCount string and recentActivity string', () => {
    const proof = getPaywallSocialProof();
    expect(typeof proof.upgradeCount).toBe('string');
    expect(typeof proof.recentActivity).toBe('string');
  });

  it('upgradeCount mentions "upgraded this month"', () => {
    expect(getPaywallSocialProof().upgradeCount).toContain('upgraded this month');
  });

  it('recentActivity mentions "upgraded today"', () => {
    expect(getPaywallSocialProof().recentActivity).toContain('upgraded today');
  });

  it('is deterministic within the same day', () => {
    expect(getPaywallSocialProof()).toEqual(getPaywallSocialProof());
  });
});

// ---------------------------------------------------------------------------
// canShowGrowthPrompt / markGrowthPromptShown — cooldown logic
// ---------------------------------------------------------------------------

describe('canShowGrowthPrompt', () => {
  it('returns true when no timestamp is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    expect(await canShowGrowthPrompt()).toBe(true);
  });

  it('returns false when last prompt was < 4 hours ago', async () => {
    const recent = String(Date.now() - 60 * 60 * 1000); // 1 hour ago
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(recent);
    expect(await canShowGrowthPrompt()).toBe(false);
  });

  it('returns true when last prompt was > 4 hours ago', async () => {
    const old = String(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(old);
    expect(await canShowGrowthPrompt()).toBe(true);
  });

  it('returns true on AsyncStorage error (fail open)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('storage error'));
    expect(await canShowGrowthPrompt()).toBe(true);
  });
});

describe('markGrowthPromptShown', () => {
  it('writes current timestamp to AsyncStorage', async () => {
    const before = Date.now();
    await markGrowthPromptShown();
    const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(call[0]).toBe('@roam/last_growth_prompt');
    const written = parseInt(call[1] as string, 10);
    expect(written).toBeGreaterThanOrEqual(before);
    expect(written).toBeLessThanOrEqual(Date.now() + 10);
  });
});

// ---------------------------------------------------------------------------
// recordGrowthEvent
// ---------------------------------------------------------------------------

describe('recordGrowthEvent', () => {
  it('stores a new event in AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    await recordGrowthEvent('trip_generated');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(setCall[0]).toBe('@roam/growth_events');
    const stored = JSON.parse(setCall[1] as string) as { action: string; ts: number }[];
    expect(stored).toHaveLength(1);
    expect(stored[0].action).toBe('trip_generated');
    expect(typeof stored[0].ts).toBe('number');
  });

  it('appends to existing events', async () => {
    const existing = [{ action: 'app_open', ts: Date.now() - 1000 }];
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));
    await recordGrowthEvent('trip_generated');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const stored = JSON.parse(setCall[1] as string) as { action: string }[];
    expect(stored).toHaveLength(2);
    expect(stored[1].action).toBe('trip_generated');
  });

  it('prunes events older than 30 days', async () => {
    const OLD_TS = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const old = Array.from({ length: 10 }, (_, i) => ({ action: `old_${i}`, ts: OLD_TS }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(old));
    await recordGrowthEvent('new_event');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const stored = JSON.parse(setCall[1] as string) as { action: string }[];
    // All old events pruned, only the new one remains
    expect(stored).toHaveLength(1);
    expect(stored[0].action).toBe('new_event');
  });

  it('caps stored events at 200', async () => {
    const many = Array.from({ length: 201 }, (_, i) => ({ action: `evt_${i}`, ts: Date.now() }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(many));
    await recordGrowthEvent('overflow');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const stored = JSON.parse(setCall[1] as string) as unknown[];
    expect(stored.length).toBeLessThanOrEqual(200);
  });
});

// ---------------------------------------------------------------------------
// checkMilestones — trip count triggers
// ---------------------------------------------------------------------------

describe('checkMilestones — trip milestones', () => {
  it('returns null when no trips and no streak', async () => {
    setStoreState({ trips: [] });
    const result = await checkMilestones();
    expect(result).toBeNull();
  });

  it('returns first_trip milestone on first trip', async () => {
    setStoreState({ trips: [{ id: '1' }] });
    const result = await checkMilestones();
    expect(result?.type).toBe('first_trip');
    expect(result?.cta).toBe('share');
  });

  it('does not return first_trip if already seen', async () => {
    setStoreState({ trips: [{ id: '1' }] });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['first_trip']));
    const result = await checkMilestones();
    expect(result).toBeNull();
  });

  it('returns third_trip when 3+ trips and not pro', async () => {
    setStoreState({ trips: [{ id: '1' }, { id: '2' }, { id: '3' }], isPro: false });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['first_trip']));
    const result = await checkMilestones();
    expect(result?.type).toBe('third_trip');
    expect(result?.cta).toBe('upgrade');
  });

  it('does not return third_trip when user is already Pro', async () => {
    setStoreState({ trips: [{ id: '1' }, { id: '2' }, { id: '3' }], isPro: true });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['first_trip']));
    const result = await checkMilestones();
    // Pro users skip third_trip; first_trip already seen → null
    expect(result).toBeNull();
  });

  it('returns fifth_trip milestone at 5+ trips', async () => {
    const trips = Array.from({ length: 5 }, (_, i) => ({ id: String(i) }));
    setStoreState({ trips, isPro: false });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(['first_trip', 'third_trip'])
    );
    const result = await checkMilestones();
    expect(result?.type).toBe('fifth_trip');
    expect(result?.cta).toBe('refer');
  });

  it('returns milestone object with all required fields', async () => {
    setStoreState({ trips: [{ id: '1' }] });
    const result = await checkMilestones();
    expect(result).not.toBeNull();
    expect(typeof result!.title).toBe('string');
    expect(typeof result!.subtitle).toBe('string');
    expect(typeof result!.ctaLabel).toBe('string');
    expect(['share', 'refer', 'upgrade', 'continue']).toContain(result!.cta);
  });
});

// ---------------------------------------------------------------------------
// checkMilestones — streak triggers
// ---------------------------------------------------------------------------

describe('checkMilestones — streak milestones', () => {
  it('returns streak_3 at 3-day streak', async () => {
    setStoreState({ trips: [] });
    mockGetCurrentStreak.mockResolvedValueOnce(3);
    const result = await checkMilestones();
    expect(result?.type).toBe('streak_3');
    expect(result?.cta).toBe('continue');
  });

  it('returns streak_7 at 7-day streak (streak_3 already seen)', async () => {
    setStoreState({ trips: [] });
    mockGetCurrentStreak.mockResolvedValueOnce(7);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['streak_3']));
    const result = await checkMilestones();
    expect(result?.type).toBe('streak_7');
  });

  it('streak_14 requires !isPro', async () => {
    mockGetCurrentStreak.mockResolvedValueOnce(14);
    setStoreState({ trips: [], isPro: true });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(['streak_3', 'streak_7'])
    );
    // isPro=true: streak_14 is gated on !isPro → not a candidate
    const result = await checkMilestones();
    expect(result?.type).not.toBe('streak_14');
  });

  it('streak_30 fires for both Pro and non-Pro users', async () => {
    mockGetCurrentStreak.mockResolvedValueOnce(30);
    setStoreState({ trips: [], isPro: true });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(['streak_3', 'streak_7', 'streak_14'])
    );
    const result = await checkMilestones();
    expect(result?.type).toBe('streak_30');
    expect(result?.cta).toBe('refer');
  });
});

// ---------------------------------------------------------------------------
// dismissMilestone
// ---------------------------------------------------------------------------

describe('dismissMilestone', () => {
  it('writes the dismissed type to AsyncStorage', async () => {
    await dismissMilestone('first_trip');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    expect(setCall[0]).toBe('@roam/milestones_seen');
    const stored = JSON.parse(setCall[1] as string) as string[];
    expect(stored).toContain('first_trip');
  });

  it('preserves previously dismissed milestones', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['streak_3']));
    await dismissMilestone('first_trip');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const stored = JSON.parse(setCall[1] as string) as string[];
    expect(stored).toContain('streak_3');
    expect(stored).toContain('first_trip');
  });

  it('does not duplicate an already-dismissed type', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(['first_trip']));
    await dismissMilestone('first_trip');
    const setCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
    const stored = JSON.parse(setCall[1] as string) as string[];
    expect(stored.filter((s) => s === 'first_trip')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getEngagementScore
// ---------------------------------------------------------------------------

describe('getEngagementScore', () => {
  it('returns 0 for a brand new user with no data', async () => {
    setStoreState({ trips: [], isPro: false });
    mockGetCurrentStreak.mockResolvedValueOnce(0);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const score = await getEngagementScore();
    expect(score).toBe(0);
  });

  it('adds 10 points per trip, capped at 50', async () => {
    const trips = Array.from({ length: 6 }, (_, i) => ({ id: String(i) }));
    setStoreState({ trips, isPro: false });
    mockGetCurrentStreak.mockResolvedValueOnce(0);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const score = await getEngagementScore();
    // 6 trips × 10 = 60, but capped at 50
    expect(score).toBe(50);
  });

  it('adds 5 points per streak day, capped at 35', async () => {
    setStoreState({ trips: [], isPro: false });
    mockGetCurrentStreak.mockResolvedValueOnce(10); // 50 pts, but capped at 35
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const score = await getEngagementScore();
    expect(score).toBe(35);
  });

  it('adds 15 points for Pro users', async () => {
    setStoreState({ trips: [], isPro: true });
    mockGetCurrentStreak.mockResolvedValueOnce(0);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const score = await getEngagementScore();
    expect(score).toBe(15);
  });

  it('caps total score at 100', async () => {
    const trips = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
    setStoreState({ trips, isPro: true });
    mockGetCurrentStreak.mockResolvedValueOnce(10);
    // Many recent events
    const events = Array.from({ length: 100 }, () => ({ action: 'screen_view', ts: Date.now() }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(events));
    const score = await getEngagementScore();
    expect(score).toBeLessThanOrEqual(100);
  });

  it('counts only events from the last 7 days', async () => {
    setStoreState({ trips: [], isPro: false });
    mockGetCurrentStreak.mockResolvedValueOnce(0);
    const oldEvents = Array.from({ length: 50 }, () => ({
      action: 'old',
      ts: Date.now() - 8 * 24 * 60 * 60 * 1000,
    }));
    const recentEvents = Array.from({ length: 1 }, () => ({
      action: 'recent',
      ts: Date.now(),
    }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([...oldEvents, ...recentEvents])
    );
    const score = await getEngagementScore();
    // 1 recent event × 2 = 2
    expect(score).toBe(2);
  });
});
