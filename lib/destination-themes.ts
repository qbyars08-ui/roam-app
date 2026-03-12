// =============================================================================
// ROAM — Destination-Specific Color Themes
// Each destination gets a unique accent palette that shifts the UI feel
// =============================================================================
import { COLORS } from './constants';

export type DestinationTheme = {
  primary: string;       // Main accent color
  secondary: string;     // Supporting accent
  gradient: [string, string, string]; // 3-stop gradient
  glowColor: string;     // For animated glows/pulses
  emoji: string;         // Destination emoji
};

// ---------------------------------------------------------------------------
// Main destinations (matches DESTINATIONS array in constants.ts)
// ---------------------------------------------------------------------------
export const DESTINATION_THEMES: Record<string, DestinationTheme> = {
  // --- Asia ---
  'Tokyo': {
    primary: '#FF6B8A',
    secondary: '#FF9EB5',
    gradient: ['#FF6B8A', '#C73866', '#2D1B2E'],
    glowColor: 'rgba(255,107,138,0.3)',
    emoji: '\u{1F5FC}',
  },
  'Kyoto': {
    primary: '#E8A0BF',
    secondary: '#F2C6DE',
    gradient: ['#E8A0BF', '#8B4570', '#2A1525'],
    glowColor: 'rgba(232,160,191,0.3)',
    emoji: '\u{26E9}\uFE0F',
  },
  'Seoul': {
    primary: '#8B5CF6',
    secondary: '#C4B5FD',
    gradient: ['#8B5CF6', '#5B21B6', '#1E0A3E'],
    glowColor: 'rgba(139,92,246,0.3)',
    emoji: '\u{1F1F0}\u{1F1F7}',
  },
  'Bangkok': {
    primary: '#FBBF24',
    secondary: '#FDE68A',
    gradient: ['#FBBF24', '#92400E', '#2E1B06'],
    glowColor: 'rgba(251,191,36,0.3)',
    emoji: '\u{1F6D5}',
  },
  'Chiang Mai': {
    primary: '#A3E635',
    secondary: '#D9F99D',
    gradient: ['#A3E635', '#4D7C0F', '#1A2E05'],
    glowColor: 'rgba(163,230,53,0.3)',
    emoji: '\u{1F3EF}',
  },
  'Bali': {
    primary: '#4ADE80',
    secondary: '#86EFAC',
    gradient: ['#4ADE80', '#166534', '#0B2E1A'],
    glowColor: 'rgba(74,222,128,0.3)',
    emoji: '\u{1F33A}',
  },
  'Hoi An': {
    primary: '#FB923C',
    secondary: '#FED7AA',
    gradient: ['#FB923C', '#9A3412', '#2E1006'],
    glowColor: 'rgba(251,146,60,0.3)',
    emoji: '\u{1F3EE}',
  },
  'Jaipur': {
    primary: '#F472B6',
    secondary: '#FBCFE8',
    gradient: ['#F472B6', '#9D174D', '#2E0719'],
    glowColor: 'rgba(244,114,182,0.3)',
    emoji: '\u{1F54C}',
  },

  // --- Europe ---
  'Paris': {
    primary: '#C4B5FD',
    secondary: '#DDD6FE',
    gradient: ['#C4B5FD', '#6D28D9', '#1E0A3E'],
    glowColor: 'rgba(196,181,253,0.3)',
    emoji: '\u{1F5FC}',
  },
  'Barcelona': {
    primary: '#F97316',
    secondary: '#FDBA74',
    gradient: ['#F97316', '#9A3412', '#2E1006'],
    glowColor: 'rgba(249,115,22,0.3)',
    emoji: '\u{2600}\uFE0F',
  },
  'Rome': {
    primary: '#D4A574',
    secondary: '#E8CDB0',
    gradient: ['#D4A574', '#7C4A2D', '#2E1A0E'],
    glowColor: 'rgba(212,165,116,0.3)',
    emoji: '\u{1F3DB}\uFE0F',
  },
  'London': {
    primary: '#94A3B8',
    secondary: '#CBD5E1',
    gradient: ['#94A3B8', '#334155', '#0F172A'],
    glowColor: 'rgba(148,163,184,0.3)',
    emoji: '\u{1F327}\uFE0F',
  },
  'Lisbon': {
    primary: '#F59E0B',
    secondary: '#FCD34D',
    gradient: ['#F59E0B', '#B45309', '#3B1F06'],
    glowColor: 'rgba(245,158,11,0.3)',
    emoji: '\u{1F68B}',
  },
  'Amsterdam': {
    primary: '#F97316',
    secondary: '#FB923C',
    gradient: ['#F97316', '#78350F', '#2E1B06'],
    glowColor: 'rgba(249,115,22,0.3)',
    emoji: '\u{1F6B2}',
  },
  'Porto': {
    primary: '#3B82F6',
    secondary: '#93C5FD',
    gradient: ['#3B82F6', '#1E3A8A', '#0C1A3E'],
    glowColor: 'rgba(59,130,246,0.3)',
    emoji: '\u{1F377}',
  },
  'Dubrovnik': {
    primary: '#F87171',
    secondary: '#FECACA',
    gradient: ['#F87171', '#991B1B', '#2D0808'],
    glowColor: 'rgba(248,113,113,0.3)',
    emoji: '\u{1F3F0}',
  },
  'Budapest': {
    primary: '#E879F9',
    secondary: '#F0ABFC',
    gradient: ['#E879F9', '#86198F', '#2E0A30'],
    glowColor: 'rgba(232,121,249,0.3)',
    emoji: '\u{2668}\uFE0F',
  },
  'Reykjavik': {
    primary: '#94A3B8',
    secondary: '#CBD5E1',
    gradient: ['#94A3B8', '#475569', '#1E293B'],
    glowColor: 'rgba(148,163,184,0.3)',
    emoji: '\u{1F9CA}',
  },
  'Istanbul': {
    primary: '#DC2626',
    secondary: '#FCA5A5',
    gradient: ['#DC2626', '#7F1D1D', '#2D0808'],
    glowColor: 'rgba(220,38,38,0.3)',
    emoji: '\u{1F54C}',
  },
  'Tbilisi': {
    primary: '#A78BFA',
    secondary: '#C4B5FD',
    gradient: ['#A78BFA', '#5B21B6', '#1E0A3E'],
    glowColor: 'rgba(167,139,250,0.3)',
    emoji: '\u{1F3F0}',
  },

  // --- Americas ---
  'New York': {
    primary: '#FBBF24',
    secondary: '#FDE68A',
    gradient: ['#FBBF24', '#78350F', '#2E1B06'],
    glowColor: 'rgba(251,191,36,0.3)',
    emoji: '\u{1F5FD}',
  },
  'Mexico City': {
    primary: '#EF4444',
    secondary: '#FCA5A5',
    gradient: ['#EF4444', '#991B1B', '#2D0808'],
    glowColor: 'rgba(239,68,68,0.3)',
    emoji: '\u{1F32E}',
  },
  'Oaxaca': {
    primary: '#A855F7',
    secondary: '#D8B4FE',
    gradient: ['#A855F7', '#6B21A8', '#1E0A3E'],
    glowColor: 'rgba(168,85,247,0.3)',
    emoji: '\u{1F336}\uFE0F',
  },
  'Buenos Aires': {
    primary: '#60A5FA',
    secondary: '#BFDBFE',
    gradient: ['#60A5FA', '#1E40AF', '#0C1A3E'],
    glowColor: 'rgba(96,165,250,0.3)',
    emoji: '\u{1F4D6}',
  },
  'Cartagena': {
    primary: '#2DD4BF',
    secondary: '#99F6E4',
    gradient: ['#2DD4BF', '#0F766E', '#062E2B'],
    glowColor: 'rgba(45,212,191,0.3)',
    emoji: '\u{1F3D6}\uFE0F',
  },
  'Medell\u00EDn': {
    primary: '#F97316',
    secondary: '#FDBA74',
    gradient: ['#F97316', '#9A3412', '#2E1006'],
    glowColor: 'rgba(249,115,22,0.3)',
    emoji: '\u{1F338}',
  },

  // --- Africa & Middle East ---
  'Marrakech': {
    primary: '#D97706',
    secondary: '#FDE68A',
    gradient: ['#D97706', '#78350F', '#2E1B06'],
    glowColor: 'rgba(217,119,6,0.3)',
    emoji: '\u{1F54C}',
  },
  'Cape Town': {
    primary: '#06B6D4',
    secondary: '#67E8F9',
    gradient: ['#06B6D4', '#0E7490', '#082F38'],
    glowColor: 'rgba(6,182,212,0.3)',
    emoji: '\u{1F981}',
  },
  'Dubai': {
    primary: '#C9A84C',
    secondary: '#E8D48B',
    gradient: ['#C9A84C', '#78591C', '#2E2008'],
    glowColor: 'rgba(201,168,76,0.3)',
    emoji: '\u{1F3D9}\uFE0F',
  },

  // --- Oceania ---
  'Sydney': {
    primary: '#38BDF8',
    secondary: '#7DD3FC',
    gradient: ['#38BDF8', '#0369A1', '#082F49'],
    glowColor: 'rgba(56,189,248,0.3)',
    emoji: '\u{1F3C4}',
  },
  'Queenstown': {
    primary: '#34D399',
    secondary: '#A7F3D0',
    gradient: ['#34D399', '#065F46', '#022C22'],
    glowColor: 'rgba(52,211,153,0.3)',
    emoji: '\u{26F0}\uFE0F',
  },

  // --- Hidden destinations ---
  'Azores': {
    primary: '#22D3EE',
    secondary: '#A5F3FC',
    gradient: ['#22D3EE', '#0E7490', '#082F38'],
    glowColor: 'rgba(34,211,238,0.3)',
    emoji: '\u{1F30B}',
  },
  'Ljubljana': {
    primary: '#4ADE80',
    secondary: '#BBF7D0',
    gradient: ['#4ADE80', '#15803D', '#052E16'],
    glowColor: 'rgba(74,222,128,0.3)',
    emoji: '\u{1F409}',
  },
  "Colombia's Coffee Axis": {
    primary: '#92400E',
    secondary: '#D4A574',
    gradient: ['#92400E', '#5C2D0A', '#2E1606'],
    glowColor: 'rgba(146,64,14,0.3)',
    emoji: '\u{2615}',
  },
  'Santorini': {
    primary: '#3B82F6',
    secondary: '#BFDBFE',
    gradient: ['#3B82F6', '#1E3A8A', '#0C1A3E'],
    glowColor: 'rgba(59,130,246,0.3)',
    emoji: '\u{1F3D6}\uFE0F',
  },
  'Siem Reap': {
    primary: '#D97706',
    secondary: '#FCD34D',
    gradient: ['#D97706', '#6B3A10', '#2E1B06'],
    glowColor: 'rgba(217,119,6,0.3)',
    emoji: '\u{1F6D5}',
  },
};

// ---------------------------------------------------------------------------
// Lookup — returns the app's default sage theme for unknown destinations
// ---------------------------------------------------------------------------
export function getDestinationTheme(destination: string): DestinationTheme {
  return (
    DESTINATION_THEMES[destination] ?? {
      primary: '#7CAF8A',
      secondary: '#A3D9B1',
      gradient: ['#7CAF8A', '#2D5F3B', '#0B2E1A'] as [string, string, string],
      glowColor: COLORS.sageStrong,
      emoji: '\u{2708}\uFE0F',
    }
  );
}
