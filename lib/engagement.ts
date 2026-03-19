// =============================================================================
// ROAM — Engagement tracking system
// Tracks daily opens, streaks, and engagement levels
// =============================================================================
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STREAK_LAST_OPEN,
  STREAK_DAILY_OPENS,
} from './storage-keys';
import { trackEvent } from './analytics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type EngagementLevel = 'new' | 'casual' | 'engaged' | 'power';

export interface StreakData {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalOpens: number;
  readonly lastOpenDate: string;
}

// ---------------------------------------------------------------------------
// Storage keys (extending STREAK_* from storage-keys.ts)
// ---------------------------------------------------------------------------
const LONGEST_STREAK_KEY = '@roam/streak_longest';
const TOTAL_OPENS_KEY = '@roam/streak_total_opens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function readInt(key: string, fallback: number = 0): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// recordDailyOpen — call on every app open
// ---------------------------------------------------------------------------
export async function recordDailyOpen(): Promise<StreakData> {
  const today = todayString();
  const yesterday = yesterdayString();

  const [lastOpen, currentStreak, longestStreak, totalOpens] = await Promise.all([
    AsyncStorage.getItem(STREAK_LAST_OPEN),
    readInt(STREAK_DAILY_OPENS, 0),
    readInt(LONGEST_STREAK_KEY, 0),
    readInt(TOTAL_OPENS_KEY, 0),
  ]);

  const lastDate = lastOpen ?? '';
  let nextStreak = currentStreak;
  let nextTotal = totalOpens;

  if (lastDate === today) {
    // Already opened today — no streak change, but still count total
    nextTotal = totalOpens + 1;
  } else if (lastDate === yesterday) {
    // Consecutive day — increment streak
    nextStreak = currentStreak + 1;
    nextTotal = totalOpens + 1;
  } else {
    // Missed a day (or first open ever) — reset streak
    nextStreak = 1;
    nextTotal = totalOpens + 1;
  }

  const nextLongest = Math.max(longestStreak, nextStreak);

  await AsyncStorage.multiSet([
    [STREAK_LAST_OPEN, today],
    [STREAK_DAILY_OPENS, String(nextStreak)],
    [LONGEST_STREAK_KEY, String(nextLongest)],
    [TOTAL_OPENS_KEY, String(nextTotal)],
  ]);

  // Fire analytics (non-blocking)
  trackEvent('daily_open', {
    streak: nextStreak,
    longest: nextLongest,
    total: nextTotal,
  }).catch(() => {});

  return {
    currentStreak: nextStreak,
    longestStreak: nextLongest,
    totalOpens: nextTotal,
    lastOpenDate: today,
  };
}

// ---------------------------------------------------------------------------
// getStreakData — read current streak data from storage
// ---------------------------------------------------------------------------
export async function getStreakData(): Promise<StreakData> {
  const [lastOpen, currentStreak, longestStreak, totalOpens] = await Promise.all([
    AsyncStorage.getItem(STREAK_LAST_OPEN),
    readInt(STREAK_DAILY_OPENS, 0),
    readInt(LONGEST_STREAK_KEY, 0),
    readInt(TOTAL_OPENS_KEY, 0),
  ]);

  // If the last open wasn't today or yesterday, streak is effectively 0
  const today = todayString();
  const yesterday = yesterdayString();
  const lastDate = lastOpen ?? '';
  const isActive = lastDate === today || lastDate === yesterday;

  return {
    currentStreak: isActive ? currentStreak : 0,
    longestStreak,
    totalOpens,
    lastOpenDate: lastDate,
  };
}

// ---------------------------------------------------------------------------
// useStreak — React hook that loads streak data on mount
// ---------------------------------------------------------------------------
export function useStreak(): StreakData & { loading: boolean } {
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalOpens: 0,
    lastOpenDate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStreakData()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { ...data, loading };
}

// ---------------------------------------------------------------------------
// getEngagementLevel — classify user engagement from streak data
// ---------------------------------------------------------------------------
export function getEngagementLevel(streakData: StreakData): EngagementLevel {
  const { currentStreak } = streakData;
  if (currentStreak >= 15) return 'power';
  if (currentStreak >= 8) return 'engaged';
  if (currentStreak >= 3) return 'casual';
  return 'new';
}
