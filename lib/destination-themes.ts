// =============================================================================
// ROAM — Destination-Specific Color Themes
// Each destination gets a unique accent palette that shifts the UI feel
// =============================================================================
import { COLORS, DESTINATION_THEME_PALETTES } from './constants';

export type DestinationTheme = {
  primary: string;       // Main accent color
  secondary: string;     // Supporting accent
  gradient: [string, string, string]; // 3-stop gradient
  glowColor: string;     // For animated glows/pulses
  emoji: string;         // Destination emoji
};

const DESTINATION_EMOJIS: Record<string, string> = {
  Tokyo: '\u{1F5FC}',
  Kyoto: '\u{26E9}\uFE0F',
  Seoul: '\u{1F1F0}\u{1F1F7}',
  Bangkok: '\u{1F6D5}',
  'Chiang Mai': '\u{1F3EF}',
  Bali: '\u{1F33A}',
  'Hoi An': '\u{1F3EE}',
  Jaipur: '\u{1F54C}',
  Paris: '\u{1F5FC}',
  Barcelona: '\u{2600}\uFE0F',
  Rome: '\u{1F3DB}\uFE0F',
  London: '\u{1F327}\uFE0F',
  Lisbon: '\u{1F68B}',
  Amsterdam: '\u{1F6B2}',
  Porto: '\u{1F377}',
  Dubrovnik: '\u{1F3F0}',
  Budapest: '\u{2668}\uFE0F',
  Reykjavik: '\u{1F9CA}',
  Istanbul: '\u{1F54C}',
  Tbilisi: '\u{1F3F0}',
  'New York': '\u{1F5FD}',
  'Mexico City': '\u{1F32E}',
  Oaxaca: '\u{1F336}\uFE0F',
  'Buenos Aires': '\u{1F4D6}',
  Cartagena: '\u{1F3D6}\uFE0F',
  'Medellín': '\u{1F338}',
  Marrakech: '\u{1F54C}',
  'Cape Town': '\u{1F981}',
  Dubai: '\u{1F3D9}\uFE0F',
  Sydney: '\u{1F3C4}',
  Queenstown: '\u{26F0}\uFE0F',
  Azores: '\u{1F30B}',
  Ljubljana: '\u{1F409}',
  "Colombia's Coffee Axis": '\u{2615}',
  Santorini: '\u{1F3D6}\uFE0F',
  'Siem Reap': '\u{1F6D5}',
};

export const DESTINATION_THEMES: Record<string, DestinationTheme> = Object.fromEntries(
  Object.entries(DESTINATION_THEME_PALETTES).map(([key, p]) => [
    key,
    { ...p, emoji: DESTINATION_EMOJIS[key] ?? '\u{2708}\uFE0F' },
  ])
);

// ---------------------------------------------------------------------------
// Lookup — returns the app's default sage theme for unknown destinations
// ---------------------------------------------------------------------------
export function getDestinationTheme(destination: string): DestinationTheme {
  return (
    DESTINATION_THEMES[destination] ?? {
      primary: COLORS.primary,
      secondary: COLORS.themeDefaultSecondary,
      gradient: [COLORS.themeDefaultGradientStart, COLORS.themeDefaultGradientMid, COLORS.themeDefaultGradientEnd] as [string, string, string],
      glowColor: COLORS.sageStrong,
      emoji: '\u{2708}\uFE0F',
    }
  );
}
