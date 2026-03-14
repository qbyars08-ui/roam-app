// =============================================================================
// ROAM — Growth Banner Selection Logic
// Determines which banner (if any) to show on a given screen based on
// user state, engagement history, and conversion probability.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './store';
import { getCurrentStreak } from './streaks';
import { getEngagementScore, canShowGrowthPrompt } from './growth-hooks';
import type { BannerVariant } from '../components/features/GrowthBanner';

const BANNER_DISMISSED_KEY = '@roam/banner_dismissed';
const BANNER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours per banner type

// ---------------------------------------------------------------------------
// Banner selection — picks the optimal banner for a given screen
// ---------------------------------------------------------------------------
export type ScreenContext = 'discover' | 'itinerary' | 'profile' | 'generate' | 'prep';

interface BannerDecision {
  show: boolean;
  variant?: BannerVariant;
}

/**
 * Determine which growth banner to show on the given screen.
 * Returns { show: false } if no banner should appear.
 * Respects per-variant cooldowns and user state.
 */
export async function selectBanner(screen: ScreenContext): Promise<BannerDecision> {
  const canShow = await canShowGrowthPrompt();
  if (!canShow) return { show: false };

  const { isPro, trips } = useAppStore.getState();
  const streak = await getCurrentStreak();
  const engagement = await getEngagementScore();

  const dismissed = await getDismissedBanners();
  const now = Date.now();

  const candidates: Array<{ variant: BannerVariant; score: number }> = [];

  if (!isPro && trips.length >= 1 && !isRecentlyDismissed(dismissed, 'upgrade', now)) {
    let score = 40;
    if (screen === 'itinerary') score += 20;
    if (engagement >= 50) score += 15;
    if (trips.length >= 3) score += 10;
    candidates.push({ variant: 'upgrade', score });
  }

  if (trips.length >= 1 && !isRecentlyDismissed(dismissed, 'refer', now)) {
    let score = 30;
    if (screen === 'profile') score += 15;
    if (trips.length >= 3) score += 10;
    if (streak >= 3) score += 5;
    candidates.push({ variant: 'refer', score });
  }

  if (trips.length >= 1 && !isRecentlyDismissed(dismissed, 'share', now)) {
    let score = 25;
    if (screen === 'itinerary') score += 20;
    candidates.push({ variant: 'share', score });
  }

  if (streak >= 2 && !isRecentlyDismissed(dismissed, 'streak', now)) {
    let score = 20;
    if (screen === 'discover') score += 10;
    candidates.push({ variant: 'streak', score });
  }

  if (candidates.length === 0) return { show: false };

  candidates.sort((a, b) => b.score - a.score);
  return { show: true, variant: candidates[0].variant };
}

/**
 * Record that a banner was dismissed. Prevents re-showing for 24 hours.
 */
export async function recordBannerDismiss(variant: BannerVariant): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
    const dismissed: Record<string, number> = raw ? JSON.parse(raw) : {};
    dismissed[variant] = Date.now();
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(dismissed));
  } catch {}
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------
async function getDismissedBanners(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(BANNER_DISMISSED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isRecentlyDismissed(
  dismissed: Record<string, number>,
  variant: string,
  now: number
): boolean {
  const ts = dismissed[variant];
  if (!ts) return false;
  return now - ts < BANNER_COOLDOWN_MS;
}
