// =============================================================================
// ROAM — ElevenLabs TTS (via Supabase voice-proxy Edge Function)
// =============================================================================

import { supabase } from './supabase';
import type { TimeSlotActivity } from './types/itinerary';

// ---------------------------------------------------------------------------
// Lazy-load expo-av — the native module is not available in Expo Go,
// so a top-level import crashes the entire module tree.
// ---------------------------------------------------------------------------

let Audio: typeof import('expo-av').Audio | null = null;

async function getAudio() {
  if (!Audio) {
    try {
      const mod = await import('expo-av');
      Audio = mod.Audio;
    } catch {
      throw new Error('expo-av is not available — use a development build for TTS.');
    }
  }
  return Audio;
}

// ---------------------------------------------------------------------------
// Module-level state for managing playback
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let currentSound: any = null;
let isPlaying = false;

// ---------------------------------------------------------------------------
// Core narration function
// ---------------------------------------------------------------------------

export interface NarrationCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Send text to the Supabase `voice-proxy` Edge Function which calls ElevenLabs,
 * then play the returned audio via expo-av.
 *
 * The edge function keeps the API key server-side so it never ships to the client.
 */
export async function narrateText(
  text: string,
  callbacks?: NarrationCallbacks
): Promise<void> {
  // Stop any existing playback first
  await stopNarration();

  try {
    const AudioModule = await getAudio();

    // Configure audio session for playback
    await AudioModule.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Call the edge function to get TTS audio
    const { data, error } = await supabase.functions.invoke('voice-proxy', {
      body: { text },
    });

    if (error) {
      throw new Error(
        `Voice proxy error: ${
          typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : String(error)
        }`
      );
    }

    if (!data) {
      throw new Error('Voice proxy returned no data');
    }

    // The edge function returns the audio as base64 or a URL depending on
    // implementation. Support both formats.
    let audioUri: string;

    if (typeof data === 'string') {
      // Raw base64 audio data
      audioUri = `data:audio/mpeg;base64,${data}`;
    } else if (data.audio) {
      // JSON response with base64 audio field
      audioUri = `data:audio/mpeg;base64,${data.audio}`;
    } else if (data.url) {
      // JSON response with a URL to the audio
      audioUri = data.url as string;
    } else {
      throw new Error('Unexpected voice-proxy response format');
    }

    callbacks?.onStart?.();
    isPlaying = true;

    const { sound } = await AudioModule.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true }
    );

    currentSound = sound;

    // Listen for playback completion
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        isPlaying = false;
        currentSound = null;
        sound.unloadAsync().catch(() => {});
        callbacks?.onEnd?.();
      }
    });
  } catch (err) {
    isPlaying = false;
    currentSound = null;
    const error = err instanceof Error ? err : new Error(String(err));
    callbacks?.onError?.(error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Stop narration
// ---------------------------------------------------------------------------

/**
 * Stop any currently playing narration and clean up resources.
 */
export async function stopNarration(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Sound may already be unloaded; ignore
    }
    currentSound = null;
    isPlaying = false;
  }
}

// ---------------------------------------------------------------------------
// Playback state
// ---------------------------------------------------------------------------

/**
 * Returns whether narration is currently playing.
 */
export function isNarrating(): boolean {
  return isPlaying;
}

// ---------------------------------------------------------------------------
// Day narration builder
// ---------------------------------------------------------------------------

/**
 * Build a narration script for one day of an itinerary.
 * Produces natural, guide-like prose suitable for TTS playback.
 */
export function buildDayNarration(params: {
  destination: string;
  dayNumber: number;
  theme: string;
  morning: TimeSlotActivity;
  afternoon: TimeSlotActivity;
  evening: TimeSlotActivity;
}): string {
  const { destination, dayNumber, theme, morning, afternoon, evening } = params;

  const lines: string[] = [
    `Day ${dayNumber} in ${destination}: ${theme}.`,
    '',
    `Start your morning with ${morning.activity} at ${morning.location}.`,
    morning.tip ? `Here's a tip: ${morning.tip}` : '',
    '',
    `In the afternoon, head to ${afternoon.location} for ${afternoon.activity}.`,
    afternoon.tip ? `Insider tip: ${afternoon.tip}` : '',
    '',
    `Wind down your evening with ${evening.activity} at ${evening.location}.`,
    evening.tip ? `One more thing: ${evening.tip}` : '',
  ];

  return lines.filter(Boolean).join(' ');
}
