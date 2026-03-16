// =============================================================================
// ROAM — Trip Anniversary
// One year after a saved trip date: "One year ago today you were in Tokyo."
// That's all. No CTA. No link. Just a reminder that you did something real.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface AnniversaryCheck {
  destination: string;
  daysSince: number;
  type: 'anniversary' | 'milestone' | 'dream-reminder';
  message: string;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
const LAST_SHOWN_KEY = '@roam/anniversary-last-shown';

async function getLastShown(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_SHOWN_KEY);
  } catch {
    return null;
  }
}

async function setLastShown(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SHOWN_KEY, date);
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Check for trip anniversaries
// ---------------------------------------------------------------------------

interface TripData {
  destination: string;
  createdAt: string;
}

/**
 * Check if any trips have anniversaries today or notable milestones.
 * Returns the most relevant anniversary, or null.
 */
export async function checkAnniversaries(
  trips: TripData[]
): Promise<AnniversaryCheck | null> {
  const today = new Date().toISOString().split('T')[0];
  const lastShown = await getLastShown();

  // Only show one anniversary per day
  if (lastShown === today) return null;

  const now = new Date();

  for (const trip of trips) {
    const created = new Date(trip.createdAt);
    const daysSince = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Exact anniversary: 365 days
    if (daysSince === 365) {
      await setLastShown(today);
      return {
        destination: trip.destination,
        daysSince,
        type: 'anniversary',
        message: `One year ago today you were in ${trip.destination}.`,
      };
    }

    // 6-month milestone
    if (daysSince === 182) {
      await setLastShown(today);
      return {
        destination: trip.destination,
        daysSince,
        type: 'milestone',
        message: `Six months since ${trip.destination}. Remember that?`,
      };
    }

    // 100-day milestone
    if (daysSince === 100) {
      await setLastShown(today);
      return {
        destination: trip.destination,
        daysSince,
        type: 'milestone',
        message: `100 days since ${trip.destination}. Feels like yesterday.`,
      };
    }

    // 2-year anniversary
    if (daysSince === 730) {
      await setLastShown(today);
      return {
        destination: trip.destination,
        daysSince,
        type: 'anniversary',
        message: `Two years ago you were in ${trip.destination}. Time to go back?`,
      };
    }
  }

  return null;
}

/**
 * Check dream vault items for milestone reminders.
 */
export function checkDreamMilestone(
  destination: string,
  savedAt: string
): AnniversaryCheck | null {
  const saved = new Date(savedAt);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - saved.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 365 days of dreaming
  if (daysSince === 365) {
    return {
      destination,
      daysSince,
      type: 'dream-reminder',
      message: `You saved ${destination} 365 days ago. It's still waiting.`,
    };
  }

  // 30 days
  if (daysSince === 30) {
    return {
      destination,
      daysSince,
      type: 'dream-reminder',
      message: `${destination} has been in your vault for a month. Getting closer?`,
    };
  }

  // 180 days
  if (daysSince === 180) {
    return {
      destination,
      daysSince,
      type: 'dream-reminder',
      message: `Half a year dreaming about ${destination}. What's stopping you?`,
    };
  }

  return null;
}

/**
 * Format days since into a human-readable string.
 * "847 days" for large numbers, "3 months" for smaller.
 */
export function formatDaysSince(days: number): string {
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  if (remainingMonths === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  return years === 1
    ? `1 year, ${remainingMonths} months`
    : `${years} years, ${remainingMonths} months`;
}
