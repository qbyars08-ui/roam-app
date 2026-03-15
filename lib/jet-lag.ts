/**
 * ROAM — Jet Lag Calculator
 * Pure calculation module (no API calls)
 * Calculates jet lag severity, recovery time, and personalized adjustment strategies
 */

import { getTimezoneByDestination } from './timezone';

// =============================================================================
// TYPES
// =============================================================================

export type JetLagSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export interface JetLagPlan {
  hoursDifference: number; // Absolute hours offset
  direction: 'east' | 'west' | 'none'; // Eastbound harder than westbound
  severity: JetLagSeverity;
  recoveryDays: number; // Rule of thumb: ~1 day per 1.5 hours offset
  tips: string[]; // 3-5 actionable tips
  preFlightAdvice: string; // What to do 2-3 days before
  arrivalStrategy: string; // What to do on landing
  melatoninWindow: string | null; // When to take melatonin, if applicable
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get UTC offset in minutes for a given IANA timezone at a specific date
 * Uses Intl.DateTimeFormat to handle DST correctly
 */
function getTimezoneOffsetMinutes(timezone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const hours = parseInt(
      parts.find((p) => p.type === 'hour')?.value ?? '0',
      10
    );
    const minutes = parseInt(
      parts.find((p) => p.type === 'minute')?.value ?? '0',
      10
    );
    const seconds = parseInt(
      parts.find((p) => p.type === 'second')?.value ?? '0',
      10
    );

    const destTime = hours * 3600 + minutes * 60 + seconds;
    const utcTime =
      date.getUTCHours() * 3600 +
      date.getUTCMinutes() * 60 +
      date.getUTCSeconds();

    let offset = destTime - utcTime;

    // Handle day boundary wrap-around
    if (offset > 43200) {
      offset -= 86400;
    } else if (offset < -43200) {
      offset += 86400;
    }

    return offset / 60; // Convert to minutes
  } catch {
    // Fallback: return 0 if timezone parsing fails
    return 0;
  }
}

/**
 * Determine travel direction and calculate hour difference
 */
function calculateTimezoneOffset(
  destinationTimezone: string
): { hoursDifference: number; direction: 'east' | 'west' | 'none' } {
  const now = new Date();
  const localOffsetMinutes = -now.getTimezoneOffset();
  const destOffsetMinutes = getTimezoneOffsetMinutes(destinationTimezone, now);

  const diffMinutes = destOffsetMinutes - localOffsetMinutes;
  const hoursDifference = Math.abs(Math.round(diffMinutes / 60));

  // Positive diff = destination is ahead (eastbound)
  // Negative diff = destination is behind (westbound)
  const direction =
    diffMinutes > 0 ? 'east' : diffMinutes < 0 ? 'west' : 'none';

  return { hoursDifference, direction };
}

/**
 * Classify jet lag severity
 */
function classifySeverity(hoursDifference: number): JetLagSeverity {
  if (hoursDifference === 0) return 'none';
  if (hoursDifference <= 2) return 'none';
  if (hoursDifference <= 5) return 'mild';
  if (hoursDifference <= 9) return 'moderate';
  return 'severe';
}

/**
 * Calculate recovery time using rule of thumb: ~1 day per 1.5 hours
 */
function calculateRecoveryDays(hoursDifference: number, direction: 'east' | 'west' | 'none'): number {
  if (hoursDifference === 0) return 0;

  // Eastbound is ~50% harder to adjust
  const multiplier = direction === 'east' ? 1.5 : 1;
  const baseDays = Math.ceil(hoursDifference / 1.5);

  return Math.ceil(baseDays * multiplier);
}

/**
 * Generate direction-specific tips
 */
function generateTips(
  hoursDifference: number,
  direction: 'east' | 'west' | 'none'
): string[] {
  const tips: string[] = [];

  if (direction === 'east') {
    // Eastbound: body needs to advance clock (harder)
    tips.push(
      'Start sleeping 30 min earlier each night, 3 days before departure'
    );
    tips.push('Seek morning sunlight on arrival to reset your circadian clock');
    tips.push('Stay hydrated during flight and avoid heavy meals');

    if (hoursDifference >= 6) {
      tips.push(
        'Consider a 20-min power nap on arrival day, but avoid long naps'
      );
    }

    if (hoursDifference >= 8) {
      tips.push('Schedule light exercise in morning sunlight for 3-5 days');
    }
  } else if (direction === 'west') {
    // Westbound: body needs to delay clock (easier)
    tips.push('Stay up 1-2 hours later the 2 nights before you fly');
    tips.push(
      'Get afternoon sunlight on arrival to help your body stay awake'
    );
    tips.push('Have a large meal in early afternoon on arrival day');

    if (hoursDifference >= 6) {
      tips.push('Napping is less harmful westbound - 1-2 hours helps');
    }

    if (hoursDifference >= 8) {
      tips.push('Eat breakfast very early for 2-3 days to anchor your rhythm');
    }
  } else {
    // No jet lag
    tips.push('No significant jet lag - enjoy your trip!');
  }

  return tips;
}

/**
 * Generate pre-flight advice
 */
function generatePreFlightAdvice(
  hoursDifference: number,
  direction: 'east' | 'west' | 'none'
): string {
  if (direction === 'none') {
    return "You're staying in the same timezone - no jet lag prep needed.";
  }

  if (direction === 'east') {
    return `Prepare for eastbound travel: Go to bed 30 minutes earlier each night, starting 3 days before your flight. Avoid bright light in the evening. Stay hydrated. This gives your body time to gradually shift forward by ${hoursDifference} hours.`;
  }

  return `Prepare for westbound travel: Stay up later for 1-2 hours the 2 nights before flying. This is easier than eastbound travel since you're delaying, not advancing, your clock. Expect to gain back ${hoursDifference} hours of wakefulness.`;
}

/**
 * Generate arrival strategy
 */
function generateArrivalStrategy(
  hoursDifference: number,
  direction: 'east' | 'west' | 'none'
): string {
  if (direction === 'none') {
    return 'No adjustment needed.';
  }

  if (direction === 'east') {
    return `On arrival: Get out into morning sunlight for 20-30 minutes as soon as possible (even if it's early). This is the single most powerful way to shift your clock forward by ${hoursDifference} hours. Eat breakfast at local time. Avoid napping unless very necessary. Stay active outdoors in daylight hours.`;
  }

  return `On arrival: Get afternoon sunlight and stay active. Your body naturally wants to stay awake (since it's "earlier" than you expect), so use that to your advantage. Eat a large meal in early afternoon. If you need rest, limit naps to 20-40 minutes. Get sunlight again in late afternoon to reinforce the local schedule.`;
}

/**
 * Generate melatonin window (if applicable)
 */
function generateMelatoninWindow(
  hoursDifference: number,
  direction: 'east' | 'west' | 'none'
): string | null {
  // Only recommend for eastbound with significant lag
  if (direction !== 'east' || hoursDifference < 5) {
    return null;
  }

  // Suggest taking melatonin in early evening at destination time
  // This helps you fall asleep at the new "bedtime"
  return `Take 0.5-1 mg melatonin at 9 PM destination time, starting 3 days before departure. Stop taking it once you've landed and adjusted (usually 3-5 days in). Consult a doctor if you take other medications.`;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Calculate jet lag plan from a destination timezone (IANA format)
 * @param destinationTimezone IANA timezone string (e.g., "Asia/Tokyo")
 * @returns JetLagPlan with severity, recovery time, and personalized tips
 */
export function calculateJetLag(destinationTimezone: string): JetLagPlan {
  const { hoursDifference, direction } = calculateTimezoneOffset(
    destinationTimezone
  );
  const severity = classifySeverity(hoursDifference);
  const recoveryDays = calculateRecoveryDays(hoursDifference, direction);
  const tips = generateTips(hoursDifference, direction);
  const preFlightAdvice = generatePreFlightAdvice(
    hoursDifference,
    direction
  );
  const arrivalStrategy = generateArrivalStrategy(
    hoursDifference,
    direction
  );
  const melatoninWindow = generateMelatoninWindow(
    hoursDifference,
    direction
  );

  return {
    hoursDifference,
    direction,
    severity,
    recoveryDays,
    tips,
    preFlightAdvice,
    arrivalStrategy,
    melatoninWindow,
  };
}

/**
 * Calculate jet lag plan from a destination name
 * Uses the DESTINATION_TIMEZONES lookup table
 * @param destination Destination city name (e.g., "tokyo")
 * @returns JetLagPlan or null if destination not found
 */
export function getJetLagForDestination(
  destination: unknown
): JetLagPlan | null {
  // Type guard: ensure destination is a string
  if (typeof destination !== 'string') {
    return null;
  }

  const timezone = getTimezoneByDestination(destination);
  if (!timezone) {
    return null;
  }

  return calculateJetLag(timezone);
}
