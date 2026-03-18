// =============================================================================
// ROAM — Daily Brief Audio
// Generates and plays the daily brief as spoken audio via ElevenLabs TTS.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDailyBrief } from './daily-brief';
import { narrateText } from './elevenlabs';

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

export const TRIP_SOUNDS_KEY = 'roam_trip_sounds';

// ---------------------------------------------------------------------------
// Preference helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the user has "Trip sounds" (morning brief audio) enabled.
 */
export async function getTripSoundsEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(TRIP_SOUNDS_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist the "Trip sounds" preference to AsyncStorage.
 */
export async function setTripSoundsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TRIP_SOUNDS_KEY, enabled ? 'true' : 'false');
  } catch {
    // Silently fail — the UI reflects local state independently
  }
}

// ---------------------------------------------------------------------------
// Core: build narration text from a daily brief
// ---------------------------------------------------------------------------

function buildBriefNarration(destination: string, daysUntil: number): string {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
  );

  const brief = getDailyBrief(destination, daysUntil, dayOfYear);

  const daysLabel =
    daysUntil === 0
      ? 'Today is the day.'
      : daysUntil === 1
        ? 'One day until your trip.'
        : `${daysUntil} days until ${destination}.`;

  return `Good morning. ${daysLabel} ${brief.headline}. ${brief.subtext}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DailyBriefAudioOptions {
  /** Override the narration language (defaults to app locale). */
  language?: string;
  /** Called when playback starts. */
  onStart?: () => void;
  /** Called when playback finishes. */
  onEnd?: () => void;
  /** Called on error. */
  onError?: (error: Error) => void;
}

/**
 * Generate and play the daily brief as spoken audio.
 *
 * Behaviour:
 * - Reads the brief text from getDailyBrief() (same source as the UI card).
 * - Converts to speech via narrateText() (ElevenLabs through Supabase voice-proxy).
 * - Plays via expo-av (handled internally by narrateText).
 *
 * @param destination  e.g. "Tokyo"
 * @param daysUntil    Days until departure (0 = day-of)
 * @param options      Optional callbacks and language override
 */
export async function playDailyBriefAudio(
  destination: string,
  daysUntil: number,
  options?: DailyBriefAudioOptions,
): Promise<void> {
  const text = buildBriefNarration(destination, daysUntil);

  await narrateText(text, {
    language: options?.language,
    onStart: options?.onStart,
    onEnd: options?.onEnd,
    onError: options?.onError,
  });
}

/**
 * Check preference then play. Skips silently if the user has sounds disabled.
 * Convenience wrapper for call-sites that want automatic preference gating.
 */
export async function playDailyBriefIfEnabled(
  destination: string,
  daysUntil: number,
  options?: DailyBriefAudioOptions,
): Promise<void> {
  const enabled = await getTripSoundsEnabled();
  if (!enabled) return;
  await playDailyBriefAudio(destination, daysUntil, options);
}
