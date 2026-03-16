// =============================================================================
// ROAM — Ambient Audio
// One ambient sound. 3 seconds. Then fades.
// Optional. Off by default. In settings: "Morning sounds" toggle.
// The users who turn it on will never turn it off.
// They will tell everyone about it.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AmbientSoundKey =
  | 'temple-bell'     // Tokyo/Kyoto at dawn — distant temple bell
  | 'gamelan'         // Bali midday — single gamelan note
  | 'souk-evening'    // Marrakech evening — distant call to prayer
  | 'wind'            // Iceland — just wind
  | 'rain-cafe'       // Paris — nothing needed, but gentle rain
  | 'waves'           // Cape Town / Bali — ocean waves
  | 'birds-morning'   // General morning — birdsong
  | 'cicadas'         // Tokyo/Bangkok summer — cicada hum
  | 'cafe-murmur';    // Buenos Aires / Barcelona — distant cafe

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------
const SETTINGS_KEY = '@roam/ambient-audio';

interface AmbientSettings {
  enabled: boolean;
  lastPlayedDate?: string; // ISO date string — only play once per day
}

/**
 * Check if ambient audio is enabled.
 */
export async function isAmbientEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return false;
    const settings: AmbientSettings = JSON.parse(raw);
    return settings.enabled;
  } catch {
    return false;
  }
}

/**
 * Toggle ambient audio on/off.
 */
export async function setAmbientEnabled(enabled: boolean): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings: AmbientSettings = raw ? JSON.parse(raw) : { enabled: false };
    settings.enabled = enabled;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Non-critical
  }
}

/**
 * Check if we've already played audio today (only play once per day).
 */
export async function hasPlayedToday(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return false;
    const settings: AmbientSettings = JSON.parse(raw);
    if (!settings.lastPlayedDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return settings.lastPlayedDate === today;
  } catch {
    return false;
  }
}

/**
 * Mark today as played.
 */
export async function markPlayedToday(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings: AmbientSettings = raw ? JSON.parse(raw) : { enabled: true };
    settings.lastPlayedDate = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Non-critical
  }
}

/**
 * Check if ambient should play right now.
 * Returns true only if enabled AND hasn't played today.
 */
export async function shouldPlayAmbient(): Promise<boolean> {
  const enabled = await isAmbientEnabled();
  if (!enabled) return false;
  const played = await hasPlayedToday();
  return !played;
}

// ---------------------------------------------------------------------------
// Sound mapping — maps a DailyMoment ambientSound key to audio behavior
// Actual audio playback would use expo-av Audio.Sound
// For now, this module defines the contract; audio files TBD
// ---------------------------------------------------------------------------

interface SoundConfig {
  /** Duration in ms before fade-out */
  duration: number;
  /** Fade-out duration in ms */
  fadeOut: number;
  /** Volume 0-1 */
  volume: number;
  /** Description for accessibility */
  description: string;
}

const SOUND_CONFIGS: Record<AmbientSoundKey, SoundConfig> = {
  'temple-bell': {
    duration: 3000,
    fadeOut: 1500,
    volume: 0.4,
    description: 'Distant temple bell',
  },
  'gamelan': {
    duration: 3000,
    fadeOut: 1200,
    volume: 0.35,
    description: 'Single gamelan note',
  },
  'souk-evening': {
    duration: 3500,
    fadeOut: 1500,
    volume: 0.3,
    description: 'Distant evening ambiance',
  },
  'wind': {
    duration: 3000,
    fadeOut: 2000,
    volume: 0.5,
    description: 'Arctic wind',
  },
  'rain-cafe': {
    duration: 3000,
    fadeOut: 1500,
    volume: 0.3,
    description: 'Gentle rain on café window',
  },
  'waves': {
    duration: 3500,
    fadeOut: 1500,
    volume: 0.4,
    description: 'Ocean waves',
  },
  'birds-morning': {
    duration: 3000,
    fadeOut: 1200,
    volume: 0.35,
    description: 'Morning birdsong',
  },
  'cicadas': {
    duration: 3000,
    fadeOut: 1500,
    volume: 0.3,
    description: 'Summer cicadas',
  },
  'cafe-murmur': {
    duration: 3000,
    fadeOut: 1500,
    volume: 0.25,
    description: 'Distant café conversation',
  },
};

/**
 * Get the sound configuration for a given key.
 */
export function getSoundConfig(key: AmbientSoundKey): SoundConfig {
  return SOUND_CONFIGS[key];
}

/**
 * Get all available sound keys and their descriptions.
 * Useful for settings UI.
 */
export function getAllSounds(): Array<{ key: AmbientSoundKey; description: string }> {
  return Object.entries(SOUND_CONFIGS).map(([key, config]) => ({
    key: key as AmbientSoundKey,
    description: config.description,
  }));
}

// ---------------------------------------------------------------------------
// TTS-based ambient sound descriptions — used to generate short ambient audio
// via ElevenLabs when no audio files are available
// ---------------------------------------------------------------------------

const AMBIENT_TTS_DESCRIPTIONS: Record<AmbientSoundKey, string> = {
  'temple-bell': 'A single, deep temple bell rings in the distance, resonating through the morning mist.',
  'gamelan': 'A single metallic gamelan note shimmers and fades into warm tropical air.',
  'souk-evening': 'Distant murmurs of an evening market, footsteps on stone, the faint scent of spice in the air.',
  'wind': 'Cold Arctic wind sweeps across an empty volcanic plain, steady and vast.',
  'rain-cafe': 'Gentle rain taps against a cafe window, muffled laughter inside, a spoon clinking against porcelain.',
  'waves': 'Ocean waves roll onto shore, exhale, and pull back in a steady, ancient rhythm.',
  'birds-morning': 'A chorus of morning birds fills the canopy, each voice layered into something hopeful.',
  'cicadas': 'Cicadas pulse in waves through the humid summer air, rising and falling like breath.',
  'cafe-murmur': 'Soft conversation drifts from a nearby cafe table, glasses clinking, distant acoustic guitar.',
};

// ---------------------------------------------------------------------------
// Lazy-load expo-av for ambient playback
// ---------------------------------------------------------------------------

let AmbientAudio: typeof import('expo-av').Audio | null = null;

async function getAmbientAudio() {
  if (!AmbientAudio) {
    try {
      const mod = await import('expo-av');
      AmbientAudio = mod.Audio;
    } catch {
      throw new Error('expo-av is not available — use a development build for ambient audio.');
    }
  }
  return AmbientAudio;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ambientSound: any = null;

// ---------------------------------------------------------------------------
// Volume fade-out using expo-av setVolumeAsync
// ---------------------------------------------------------------------------

async function fadeOutSound(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sound: any,
  startVolume: number,
  fadeDurationMs: number,
): Promise<void> {
  const steps = 10;
  const stepDuration = fadeDurationMs / steps;
  const volumeStep = startVolume / steps;

  for (let i = 1; i <= steps; i++) {
    const newVolume = Math.max(0, startVolume - volumeStep * i);
    try {
      await sound.setVolumeAsync(newVolume);
    } catch {
      // Sound may have been unloaded mid-fade
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, stepDuration));
  }

  try {
    await sound.stopAsync();
    await sound.unloadAsync();
  } catch {
    // Already cleaned up
  }
}

// ---------------------------------------------------------------------------
// playAmbientSound — generate ambient TTS and play with fade-out
// ---------------------------------------------------------------------------

/**
 * Play an ambient sound by generating a short TTS description via ElevenLabs,
 * then playing it at low volume with a smooth fade-out.
 *
 * Checks `shouldPlayAmbient()` before playing — no-ops if disabled or already
 * played today. Marks as played on success.
 */
export async function playAmbientSound(key: AmbientSoundKey): Promise<void> {
  const shouldPlay = await shouldPlayAmbient();
  if (!shouldPlay) return;

  const config = SOUND_CONFIGS[key];
  const description = AMBIENT_TTS_DESCRIPTIONS[key];

  if (!config || !description) return;

  try {
    const AudioModule = await getAmbientAudio();

    await AudioModule.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Import supabase and generate TTS via voice-proxy
    const { supabase } = await import('./supabase');

    const { data, error } = await supabase.functions.invoke('voice-proxy', {
      body: {
        text: description,
        voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah (English) for ambient descriptions
        language: 'en',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.5,
        },
      },
    });

    if (error || !data) return;

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
      return;
    }

    // Stop any existing ambient playback
    if (ambientSound) {
      try {
        await ambientSound.stopAsync();
        await ambientSound.unloadAsync();
      } catch {
        // ignore
      }
      ambientSound = null;
    }

    const { sound } = await AudioModule.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true, volume: config.volume },
    );

    ambientSound = sound;

    // Schedule fade-out after the configured duration
    setTimeout(() => {
      if (ambientSound === sound) {
        fadeOutSound(sound, config.volume, config.fadeOut).then(() => {
          if (ambientSound === sound) {
            ambientSound = null;
          }
        }).catch(() => {
          ambientSound = null;
        });
      }
    }, config.duration);

    // Mark as played today
    await markPlayedToday();
  } catch {
    // Ambient audio is non-critical — fail silently
  }
}

/**
 * Stop any currently playing ambient sound immediately.
 */
export async function stopAmbientSound(): Promise<void> {
  if (ambientSound) {
    try {
      await ambientSound.stopAsync();
      await ambientSound.unloadAsync();
    } catch {
      // ignore
    }
    ambientSound = null;
  }
}
