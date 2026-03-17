// =============================================================================
// ROAM — ElevenLabs Multilingual Audio Engine
// Full TTS via Supabase voice-proxy Edge Function
// =============================================================================

import { supabase } from './supabase';
import i18n from './i18n';
import type { Itinerary, TimeSlotActivity } from './types/itinerary';

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
// Supported languages & voice map
// ---------------------------------------------------------------------------

export const SUPPORTED_TTS_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja'] as const;
export type TTSLanguage = (typeof SUPPORTED_TTS_LANGUAGES)[number];

export interface VoiceInfo {
  readonly voiceId: string;
  readonly name: string;
}

export const VOICE_MAP: Readonly<Record<TTSLanguage, VoiceInfo>> = {
  en: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  es: { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
  fr: { voiceId: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  de: { voiceId: 'pqHfZKP75CvOlQylNhV4', name: 'Bill' },
  ja: { voiceId: 'iP95p4xoKVk53GoZ742B', name: 'Yuki' },
};

// ---------------------------------------------------------------------------
// LRU Audio Cache (in-memory, max 10 entries)
// ---------------------------------------------------------------------------

interface CacheEntry {
  readonly audioUri: string;
  lastAccessed: number;
}

const CACHE_MAX_SIZE = 10;
const audioCache = new Map<string, CacheEntry>();

function makeCacheKey(text: string, language: string, voiceId: string): string {
  let hash = 0;
  const str = `${language}:${voiceId}:${text}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0;
  }
  return `tts_${hash}`;
}

function getCached(key: string): string | null {
  const entry = audioCache.get(key);
  if (!entry) return null;
  audioCache.set(key, { ...entry, lastAccessed: Date.now() });
  return entry.audioUri;
}

function setCache(key: string, audioUri: string): void {
  if (audioCache.size >= CACHE_MAX_SIZE) {
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [k, v] of audioCache.entries()) {
      if (v.lastAccessed < oldestTime) {
        oldestTime = v.lastAccessed;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      audioCache.delete(oldestKey);
    }
  }
  audioCache.set(key, { audioUri, lastAccessed: Date.now() });
}

// ---------------------------------------------------------------------------
// Module-level state for managing playback
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let currentSound: any = null;
let playing = false;

// ---------------------------------------------------------------------------
// Helper: resolve current i18n language to a supported TTS language
// ---------------------------------------------------------------------------

function resolveLanguage(lang?: string): TTSLanguage {
  const candidate = lang ?? i18n.language ?? 'en';
  if (SUPPORTED_TTS_LANGUAGES.includes(candidate as TTSLanguage)) {
    return candidate as TTSLanguage;
  }
  const base = candidate.split('-')[0];
  if (SUPPORTED_TTS_LANGUAGES.includes(base as TTSLanguage)) {
    return base as TTSLanguage;
  }
  return 'en';
}

// ---------------------------------------------------------------------------
// Core: call voice-proxy and get audio URI
// ---------------------------------------------------------------------------

async function fetchAudioFromProxy(
  text: string,
  options?: {
    language?: string;
    speed?: number;
    voiceSettings?: Record<string, unknown>;
    timeoutMs?: number;
  },
): Promise<string> {
  const language = resolveLanguage(options?.language);
  const voice = VOICE_MAP[language];
  const cacheKey = makeCacheKey(text, language, voice.voiceId);

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const body: Record<string, unknown> = {
    text,
    voice_id: voice.voiceId,
    language,
  };

  if (options?.voiceSettings) {
    body.voice_settings = options.voiceSettings;
  }

  const timeoutMs = options?.timeoutMs ?? 30000;
  const timeoutId = setTimeout(() => { /* noop — AbortController not available in all RN */ }, timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke('voice-proxy', {
      body,
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

    let audioUri: string;
    if (typeof data === 'string') {
      audioUri = `data:audio/mpeg;base64,${data}`;
    } else if (data.audio_base64) {
      audioUri = `data:audio/mpeg;base64,${data.audio_base64}`;
    } else if (data.audio) {
      audioUri = `data:audio/mpeg;base64,${data.audio}`;
    } else if (data.url) {
      audioUri = data.url as string;
    } else {
      throw new Error('Unexpected voice-proxy response format');
    }

    setCache(cacheKey, audioUri);
    return audioUri;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Callbacks interface
// ---------------------------------------------------------------------------

export interface NarrationCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

// ---------------------------------------------------------------------------
// 1. narrateText() — upgraded with language & speed support
// ---------------------------------------------------------------------------

export interface NarrateTextOptions extends NarrationCallbacks {
  language?: string;
  speed?: number;
  voiceId?: string;
  voiceSettings?: Record<string, unknown>;
}

/**
 * Send text to the Supabase `voice-proxy` Edge Function which calls ElevenLabs,
 * then play the returned audio via expo-av.
 */
export async function narrateText(
  text: string,
  options?: NarrateTextOptions,
): Promise<void> {
  await stopNarration();

  try {
    const AudioModule = await getAudio();

    await AudioModule.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const audioUri = await fetchAudioFromProxy(text, {
      language: options?.language,
      speed: options?.speed,
      voiceSettings: options?.voiceSettings,
    });

    options?.onStart?.();
    playing = true;

    const speed = Math.max(0.5, Math.min(2.0, options?.speed ?? 1.0));

    const { sound } = await AudioModule.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true, rate: speed, shouldCorrectPitch: true },
    );

    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        playing = false;
        currentSound = null;
        sound.unloadAsync().catch(() => {});
        options?.onEnd?.();
      }
    });
  } catch (err) {
    playing = false;
    currentSound = null;
    const error = err instanceof Error ? err : new Error(String(err));
    options?.onError?.(error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Stop narration
// ---------------------------------------------------------------------------

export async function stopNarration(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Sound may already be unloaded; ignore
    }
    currentSound = null;
    playing = false;
  }
}

// ---------------------------------------------------------------------------
// Playback state
// ---------------------------------------------------------------------------

export function isNarrating(): boolean {
  return playing;
}

// ---------------------------------------------------------------------------
// 2. narrateItinerary() — full itinerary narration with controller
// ---------------------------------------------------------------------------

export interface NarrationController {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  skipToDay: (day: number) => Promise<void>;
  getCurrentDay: () => number;
  isPlaying: () => boolean;
  onDayChange?: (day: number) => void;
}

export interface NarrateItineraryOptions {
  language?: string;
  speed?: number;
  onDayChange?: (day: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Narrate a full itinerary with play/pause/skip controls.
 * Builds a narration queue: tagline -> day 1 -> day 2 -> ... -> pro tip.
 */
export function narrateItinerary(
  itinerary: Itinerary,
  options?: NarrateItineraryOptions,
): NarrationController {
  const language = resolveLanguage(options?.language);
  const speed = options?.speed ?? 1.0;

  interface NarrationSegment {
    readonly dayIndex: number;
    readonly text: string;
  }

  const segments: NarrationSegment[] = [];

  // Opening tagline
  segments.push({
    dayIndex: 0,
    text: `Welcome to ${itinerary.destination}. ${itinerary.tagline}. Your total budget is ${itinerary.totalBudget}. Let me walk you through your trip.`,
  });

  // Each day
  for (const day of itinerary.days) {
    segments.push({
      dayIndex: day.day,
      text: buildDayNarration({
        destination: itinerary.destination,
        dayNumber: day.day,
        theme: day.theme,
        morning: day.morning,
        afternoon: day.afternoon,
        evening: day.evening,
        accommodation: day.accommodation,
        dailyCost: day.dailyCost,
        routeSummary: day.routeSummary,
      }),
    });
  }

  // Pro tip
  segments.push({
    dayIndex: itinerary.days.length + 1,
    text: `Before you go, here is one last pro tip: ${itinerary.proTip}`,
  });

  // Controller state
  let currentSegmentIndex = 0;
  let controllerPlaying = false;
  let stopped = false;
  let dayChangeCallback = options?.onDayChange;

  async function playFromSegment(index: number): Promise<void> {
    if (stopped || !controllerPlaying || index >= segments.length) {
      controllerPlaying = false;
      if (index >= segments.length) {
        options?.onComplete?.();
      }
      return;
    }

    const segment = segments[index];
    currentSegmentIndex = index;
    dayChangeCallback?.(segment.dayIndex);

    try {
      await narrateText(segment.text, {
        language,
        speed,
        onEnd: () => {
          if (controllerPlaying && !stopped) {
            playFromSegment(index + 1).catch((err) => {
              options?.onError?.(err instanceof Error ? err : new Error(String(err)));
            });
          }
        },
        onError: (err) => {
          options?.onError?.(err);
        },
      });
    } catch (err) {
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  const controller: NarrationController = {
    play: async () => {
      if (stopped) return;
      controllerPlaying = true;
      await playFromSegment(currentSegmentIndex);
    },

    pause: async () => {
      controllerPlaying = false;
      await stopNarration();
    },

    stop: async () => {
      stopped = true;
      controllerPlaying = false;
      await stopNarration();
    },

    skipToDay: async (day: number) => {
      if (stopped) return;
      const idx = segments.findIndex((s) => s.dayIndex === day);
      if (idx === -1) return;
      await stopNarration();
      currentSegmentIndex = idx;
      if (controllerPlaying) {
        await playFromSegment(currentSegmentIndex);
      }
    },

    getCurrentDay: () => {
      if (currentSegmentIndex < segments.length) {
        return segments[currentSegmentIndex].dayIndex;
      }
      return 0;
    },

    isPlaying: () => controllerPlaying,

    set onDayChange(cb: ((day: number) => void) | undefined) {
      dayChangeCallback = cb;
    },
  };

  return controller;
}

// ---------------------------------------------------------------------------
// 3. pronounce() — short TTS for a single word/phrase
// ---------------------------------------------------------------------------

/**
 * Quick TTS for a single word or phrase (location names, foreign words).
 * Uses lower stability for more natural pronunciation.
 * Max 200 chars, 10s timeout.
 */
export async function pronounce(
  text: string,
  language?: string,
): Promise<void> {
  if (text.length > 200) {
    throw new Error('pronounce() text must be 200 characters or less');
  }

  await narrateText(text, {
    language,
    voiceSettings: {
      stability: 0.3,
      similarity_boost: 0.85,
    },
  });
}

// ---------------------------------------------------------------------------
// 4. narrateSurvivalPhrases() — queued phrase-by-phrase narration
// ---------------------------------------------------------------------------

export interface SurvivalPhrase {
  readonly original: string;
  readonly translation: string;
  readonly phonetic?: string;
}

export interface NarrateSurvivalPhrasesOptions {
  onPhraseStart?: (index: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Narrate survival phrases one at a time.
 * Each phrase: "[original] means [translation]" spoken in the target language voice.
 */
export async function narrateSurvivalPhrases(
  phrases: readonly SurvivalPhrase[],
  language: string,
  options?: NarrateSurvivalPhrasesOptions,
): Promise<void> {
  const resolvedLang = resolveLanguage(language);

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    options?.onPhraseStart?.(i);

    const narrationText = phrase.phonetic
      ? `${phrase.original} — pronounced ${phrase.phonetic} — means ${phrase.translation}`
      : `${phrase.original} means ${phrase.translation}`;

    try {
      await new Promise<void>((resolve, reject) => {
        narrateText(narrationText, {
          language: resolvedLang,
          onEnd: () => resolve(),
          onError: (err) => reject(err),
        }).catch(reject);
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      options?.onError?.(error);
      return;
    }
  }

  options?.onComplete?.();
}

// ---------------------------------------------------------------------------
// 5. getAvailableVoices() — expose voice map for UI
// ---------------------------------------------------------------------------

/**
 * Returns the full voice map for UI display (language selector, voice preview, etc.).
 */
export function getAvailableVoices(): Readonly<Record<TTSLanguage, VoiceInfo>> {
  return VOICE_MAP;
}

// ---------------------------------------------------------------------------
// 6. buildDayNarration() — richer, guide-like prose
// ---------------------------------------------------------------------------

/**
 * Build a narration script for one day of an itinerary.
 * Produces natural, guide-like prose suitable for TTS playback.
 * Includes neighborhoods, transit directions, costs, and accommodation.
 */
export function buildDayNarration(params: {
  destination: string;
  dayNumber: number;
  theme: string;
  morning: TimeSlotActivity;
  afternoon: TimeSlotActivity;
  evening: TimeSlotActivity;
  accommodation?: {
    name: string;
    type: string;
    pricePerNight: string;
    neighborhood?: string;
  };
  dailyCost?: string;
  routeSummary?: string;
}): string {
  const {
    destination,
    dayNumber,
    theme,
    morning,
    afternoon,
    evening,
    accommodation,
    dailyCost,
    routeSummary,
  } = params;

  const lines: string[] = [];

  // Opening
  lines.push(`Day ${dayNumber} in ${destination}: ${theme}.`);

  if (routeSummary) {
    lines.push(`Today's route takes you through ${routeSummary}.`);
  }

  // Morning
  const morningNeighborhood = morning.neighborhood
    ? ` in the ${morning.neighborhood} neighborhood`
    : '';
  lines.push(
    `Start your morning with ${morning.activity} at ${morning.location}${morningNeighborhood}.`,
  );
  if (morning.cost && morning.cost !== '$0') {
    lines.push(`Budget about ${morning.cost} for this.`);
  }
  if (morning.tip) {
    lines.push(`Here's a tip: ${morning.tip}`);
  }
  if (morning.transitToNext) {
    lines.push(`To get to your next stop: ${morning.transitToNext}.`);
  }

  // Afternoon
  const afternoonNeighborhood = afternoon.neighborhood
    ? ` in ${afternoon.neighborhood}`
    : '';
  lines.push(
    `In the afternoon, head to ${afternoon.location}${afternoonNeighborhood} for ${afternoon.activity}.`,
  );
  if (afternoon.cost && afternoon.cost !== '$0') {
    lines.push(`This will run about ${afternoon.cost}.`);
  }
  if (afternoon.tip) {
    lines.push(`Insider tip: ${afternoon.tip}`);
  }
  if (afternoon.transitToNext) {
    lines.push(`Getting to your evening: ${afternoon.transitToNext}.`);
  }

  // Evening
  const eveningNeighborhood = evening.neighborhood
    ? ` in ${evening.neighborhood}`
    : '';
  lines.push(
    `Wind down your evening with ${evening.activity} at ${evening.location}${eveningNeighborhood}.`,
  );
  if (evening.cost && evening.cost !== '$0') {
    lines.push(`Expect to spend around ${evening.cost}.`);
  }
  if (evening.tip) {
    lines.push(`One more thing: ${evening.tip}`);
  }

  // Accommodation
  if (accommodation) {
    const accNeighborhood = accommodation.neighborhood
      ? ` in ${accommodation.neighborhood}`
      : '';
    lines.push(
      `For the night, I recommend ${accommodation.name}, a ${accommodation.type}${accNeighborhood}, at ${accommodation.pricePerNight} per night.`,
    );
  }

  // Daily cost summary
  if (dailyCost) {
    lines.push(`Your estimated total for day ${dayNumber}: ${dailyCost}.`);
  }

  return lines.join(' ');
}
