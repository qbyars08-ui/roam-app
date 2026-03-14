// =============================================================================
// ROAM — Growth Hooks Engine
// Centralized orchestrator for milestone celebrations, smart prompts,
// conversion triggers, and retention mechanics.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { track } from './analytics';
import { getCurrentStreak } from './streaks';
import { useAppStore } from './store';

const MILESTONES_KEY = '@roam/milestones_seen';
const GROWTH_EVENTS_KEY = '@roam/growth_events';
const LAST_PROMPT_KEY = '@roam/last_growth_prompt';

// ---------------------------------------------------------------------------
// Milestone definitions — trigger celebrations at key moments
// ---------------------------------------------------------------------------
export type MilestoneType =
  | 'first_trip'
  | 'third_trip'
  | 'fifth_trip'
  | 'tenth_trip'
  | 'first_share'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'first_country'
  | 'five_countries'
  | 'explorer_badge';

export interface Milestone {
  type: MilestoneType;
  title: string;
  subtitle: string;
  cta: 'share' | 'refer' | 'upgrade' | 'continue';
  ctaLabel: string;
}

const MILESTONE_DEFS: Record<MilestoneType, Omit<Milestone, 'type'>> = {
  first_trip: {
    title: 'Your first trip is live',
    subtitle: 'You just planned a trip with AI in under 30 seconds. Share it with someone who needs this.',
    cta: 'share',
    ctaLabel: 'Share this trip',
  },
  third_trip: {
    title: 'Three trips planned',
    subtitle: "You're officially hooked. Unlock unlimited trips and never hit a wall.",
    cta: 'upgrade',
    ctaLabel: 'Go Pro',
  },
  fifth_trip: {
    title: 'Five trips and counting',
    subtitle: 'Know someone who plans trips the hard way? Save them.',
    cta: 'refer',
    ctaLabel: 'Invite a friend',
  },
  tenth_trip: {
    title: 'Double digits',
    subtitle: "Ten trips planned. You're a power traveler. Time for the Global Pass.",
    cta: 'upgrade',
    ctaLabel: 'Upgrade to Global Pass',
  },
  first_share: {
    title: 'First trip shared',
    subtitle: 'Your trip is out in the world. Invite 3 friends to unlock a free month of Pro.',
    cta: 'refer',
    ctaLabel: 'Share your referral link',
  },
  streak_3: {
    title: '3-day streak',
    subtitle: "Three days in a row. You're building a travel habit.",
    cta: 'continue',
    ctaLabel: 'Keep exploring',
  },
  streak_7: {
    title: 'Week-long streak',
    subtitle: "Seven days straight. You're the kind of traveler who plans ahead.",
    cta: 'share',
    ctaLabel: 'Share your streak',
  },
  streak_14: {
    title: 'Two-week streak',
    subtitle: "14 days of exploring. You should probably go Pro at this point.",
    cta: 'upgrade',
    ctaLabel: 'Unlock Pro',
  },
  streak_30: {
    title: '30-day streak',
    subtitle: "A full month. You're a ROAM power user. This deserves a badge.",
    cta: 'refer',
    ctaLabel: 'Invite your travel crew',
  },
  first_country: {
    title: 'First destination explored',
    subtitle: "One country down, 194 to go. Share your progress.",
    cta: 'share',
    ctaLabel: 'Share your passport',
  },
  five_countries: {
    title: 'Five destinations explored',
    subtitle: "You've been around. Time to invite the crew.",
    cta: 'refer',
    ctaLabel: 'Invite friends',
  },
  explorer_badge: {
    title: 'Explorer Badge unlocked',
    subtitle: 'You earned it. Show it off.',
    cta: 'share',
    ctaLabel: 'Share your badge',
  },
};

// ---------------------------------------------------------------------------
// Milestone tracking
// ---------------------------------------------------------------------------
async function getSeenMilestones(): Promise<Set<MilestoneType>> {
  try {
    const raw = await AsyncStorage.getItem(MILESTONES_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as MilestoneType[]);
  } catch {
    return new Set();
  }
}

async function markMilestoneSeen(type: MilestoneType): Promise<void> {
  const seen = await getSeenMilestones();
  seen.add(type);
  await AsyncStorage.setItem(MILESTONES_KEY, JSON.stringify([...seen]));
}

/**
 * Check if any milestones should fire based on current user state.
 * Returns the highest-priority unseen milestone, or null.
 */
export async function checkMilestones(): Promise<Milestone | null> {
  const seen = await getSeenMilestones();
  const { trips, isPro } = useAppStore.getState();
  const streak = await getCurrentStreak();
  const tripCount = trips.length;

  const candidates: MilestoneType[] = [];

  if (tripCount >= 1 && !seen.has('first_trip')) candidates.push('first_trip');
  if (tripCount >= 3 && !seen.has('third_trip') && !isPro) candidates.push('third_trip');
  if (tripCount >= 5 && !seen.has('fifth_trip')) candidates.push('fifth_trip');
  if (tripCount >= 10 && !seen.has('tenth_trip') && !isPro) candidates.push('tenth_trip');

  if (streak >= 3 && !seen.has('streak_3')) candidates.push('streak_3');
  if (streak >= 7 && !seen.has('streak_7')) candidates.push('streak_7');
  if (streak >= 14 && !seen.has('streak_14') && !isPro) candidates.push('streak_14');
  if (streak >= 30 && !seen.has('streak_30')) candidates.push('streak_30');

  if (candidates.length === 0) return null;

  const type = candidates[candidates.length - 1];
  const def = MILESTONE_DEFS[type];

  track({ type: 'feature_use', feature: `milestone_${type}` }).catch(() => {});

  return { type, ...def };
}

/** Mark a milestone as seen so it doesn't fire again */
export async function dismissMilestone(type: MilestoneType): Promise<void> {
  await markMilestoneSeen(type);
}

// ---------------------------------------------------------------------------
// Growth event recording — tracks user actions for smart triggers
// ---------------------------------------------------------------------------
export interface GrowthEvent {
  action: string;
  ts: number;
}

async function getGrowthEvents(): Promise<GrowthEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(GROWTH_EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GrowthEvent[];
  } catch {
    return [];
  }
}

const MAX_ACTION_LENGTH = 64;

export async function recordGrowthEvent(action: string): Promise<void> {
  const safeAction = String(action).slice(0, MAX_ACTION_LENGTH);
  const events = await getGrowthEvents();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => e.ts > cutoff);
  recent.push({ action: safeAction, ts: Date.now() });
  await AsyncStorage.setItem(GROWTH_EVENTS_KEY, JSON.stringify(recent.slice(-200)));
}

// ---------------------------------------------------------------------------
// Growth prompt cooldown — prevent spamming the user
// ---------------------------------------------------------------------------
const PROMPT_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function canShowGrowthPrompt(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LAST_PROMPT_KEY);
    if (!raw) return true;
    return Date.now() - parseInt(raw, 10) > PROMPT_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export async function markGrowthPromptShown(): Promise<void> {
  await AsyncStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
}

// ---------------------------------------------------------------------------
// Engagement score — simple heuristic for user engagement level
// ---------------------------------------------------------------------------
export async function getEngagementScore(): Promise<number> {
  const events = await getGrowthEvents();
  const { trips, isPro } = useAppStore.getState();
  const streak = await getCurrentStreak();

  let score = 0;
  score += Math.min(trips.length * 10, 50);
  score += Math.min(streak * 5, 35);
  score += isPro ? 15 : 0;

  const last7Days = events.filter((e) => e.ts > Date.now() - 7 * 24 * 60 * 60 * 1000);
  score += Math.min(last7Days.length * 2, 30);

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Social proof data for paywall / upgrade prompts
// ---------------------------------------------------------------------------
export function getPaywallSocialProof(): {
  upgradeCount: string;
  recentActivity: string;
} {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const base = 1247 + dayOfYear * 3;
  const todayCount = 12 + (dayOfYear % 15);

  return {
    upgradeCount: `${base.toLocaleString()} travelers upgraded this month`,
    recentActivity: `${todayCount} people upgraded today`,
  };
}

// ---------------------------------------------------------------------------
// Contextual upgrade prompts — different messages based on context
// ---------------------------------------------------------------------------
export type UpgradeContext =
  | 'trip_limit'
  | 'feature_locked'
  | 'post_trip'
  | 'high_engagement'
  | 'streak_momentum'
  | 'default';

export function getUpgradeMessage(context: UpgradeContext): {
  headline: string;
  subtext: string;
} {
  switch (context) {
    case 'trip_limit':
      return {
        headline: 'You just built a real trip.\nUnlock unlimited and keep the momentum.',
        subtext: 'Pro travelers generate 4x more trips per month',
      };
    case 'feature_locked':
      return {
        headline: 'This feature is Pro-only.\nUpgrade to unlock everything.',
        subtext: 'Join thousands of travelers who went Pro this month',
      };
    case 'post_trip':
      return {
        headline: "That trip looks incredible.\nImagine planning one every week.",
        subtext: 'Unlimited trips, offline prep, and priority AI',
      };
    case 'high_engagement':
      return {
        headline: "You use ROAM more than most.\nPro was made for travelers like you.",
        subtext: "You've earned a spot in the inner circle",
      };
    case 'streak_momentum':
      return {
        headline: "You're on a roll.\nDon't let your streak go to waste.",
        subtext: 'Pro users keep 3x longer streaks',
      };
    default:
      return {
        headline: "You've been planning for free.\nStart traveling for real.",
        subtext: 'Built for people who travel with intention',
      };
  }
}
