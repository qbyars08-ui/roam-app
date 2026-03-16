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
