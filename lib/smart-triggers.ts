// =============================================================================
// ROAM — Smart Conversion Triggers
// Context-aware prompts that fire at optimal moments for upgrade, share, refer
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './store';
import { track } from './analytics';
import { getCurrentStreak } from './streaks';
import {
  canShowGrowthPrompt,
  markGrowthPromptShown,
  getEngagementScore,
  recordGrowthEvent,
  type UpgradeContext,
} from './growth-hooks';

const TRIGGER_HISTORY_KEY = '@roam/trigger_history';

// ---------------------------------------------------------------------------
// Trigger types
// ---------------------------------------------------------------------------
export type TriggerAction = 'upgrade' | 'share' | 'refer' | 'rate' | 'none';

export interface SmartTrigger {
  action: TriggerAction;
  context: UpgradeContext;
  priority: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// Trigger evaluation — picks the best action for the current moment
// ---------------------------------------------------------------------------

/**
 * Evaluate what growth trigger (if any) should fire right now.
 * Respects cooldowns and avoids spamming. Call on key transition points:
 * - After itinerary generation
 * - After viewing itinerary for 60+ seconds
 * - On app open (if returning user with streak)
 * - After sharing a trip
 */
export async function evaluateTrigger(
  event: 'post_generation' | 'itinerary_view' | 'app_open' | 'post_share' | 'feature_tap'
): Promise<SmartTrigger> {
  const canShow = await canShowGrowthPrompt();
  if (!canShow) return { action: 'none', context: 'default', priority: 0, reason: 'cooldown' };

  const { isPro, trips, tripsThisMonth } = useAppStore.getState();
  const streak = await getCurrentStreak();
  const engagement = await getEngagementScore();

  const triggers: SmartTrigger[] = [];

  if (!isPro && tripsThisMonth >= 1 && event === 'post_generation') {
    triggers.push({
      action: 'upgrade',
      context: 'trip_limit',
      priority: 95,
      reason: 'User hit free trip limit after generation',
    });
  }

  if (!isPro && event === 'feature_tap') {
    triggers.push({
      action: 'upgrade',
      context: 'feature_locked',
      priority: 90,
      reason: 'User tapped a Pro-only feature',
    });
  }

  if (event === 'post_generation' && trips.length > 0) {
    triggers.push({
      action: 'share',
      context: 'post_trip',
      priority: 60,
      reason: 'Fresh trip just generated',
    });
  }

  if (!isPro && engagement >= 60 && event === 'app_open') {
    triggers.push({
      action: 'upgrade',
      context: 'high_engagement',
      priority: 70,
      reason: 'High engagement score on return',
    });
  }

  if (!isPro && streak >= 5 && event === 'app_open') {
    triggers.push({
      action: 'upgrade',
      context: 'streak_momentum',
      priority: 65,
      reason: 'Active streak on app open',
    });
  }

  if (event === 'post_share') {
    triggers.push({
      action: 'refer',
      context: 'post_trip',
      priority: 50,
      reason: 'Just shared a trip — good moment for referral',
    });
  }

  if (trips.length >= 2 && event === 'itinerary_view') {
    const shouldRate = await shouldPromptRating();
    if (shouldRate) {
      triggers.push({
        action: 'rate',
        context: 'default',
        priority: 40,
        reason: 'Returning user viewing itinerary',
      });
    }
  }

  if (triggers.length === 0) {
    return { action: 'none', context: 'default', priority: 0, reason: 'no_trigger' };
  }

  triggers.sort((a, b) => b.priority - a.priority);
  const winner = triggers[0];

  await markGrowthPromptShown();
  await recordTriggerFired(winner);

  track({
    type: 'feature_use',
    feature: `smart_trigger_${winner.action}`,
    payload: { context: winner.context, reason: winner.reason, event },
  }).catch(() => {});

  return winner;
}

// ---------------------------------------------------------------------------
// Trigger history — track what we've shown to avoid repetition
// ---------------------------------------------------------------------------
interface TriggerRecord {
  action: TriggerAction;
  context: string;
  ts: number;
}

async function recordTriggerFired(trigger: SmartTrigger): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TRIGGER_HISTORY_KEY);
    const history: TriggerRecord[] = raw ? JSON.parse(raw) : [];
    history.push({ action: trigger.action, context: trigger.context, ts: Date.now() });
    const recent = history.slice(-50);
    await AsyncStorage.setItem(TRIGGER_HISTORY_KEY, JSON.stringify(recent));
  } catch { /* silent */ }
}

async function shouldPromptRating(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(TRIGGER_HISTORY_KEY);
    if (!raw) return true;
    const history: TriggerRecord[] = JSON.parse(raw);
    const ratePrompts = history.filter((h) => h.action === 'rate');
    if (ratePrompts.length >= 2) return false;
    const last = ratePrompts[ratePrompts.length - 1];
    if (last && Date.now() - last.ts < 7 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session engagement tracking
// ---------------------------------------------------------------------------
let sessionStart = Date.now();
let screenViewCount = 0;

export function resetSessionTracking(): void {
  sessionStart = Date.now();
  screenViewCount = 0;
}

export function trackScreenView(): void {
  screenViewCount += 1;
  recordGrowthEvent('screen_view').catch(() => {});
}

export function getSessionDepth(): { durationMs: number; screens: number } {
  return {
    durationMs: Date.now() - sessionStart,
    screens: screenViewCount,
  };
}
