// =============================================================================
// ROAM — Neighborhood Safety Overlay
// Color-coded by time of day for itinerary map
// =============================================================================
import { COLORS } from './constants';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export type SafetyLevel = 'safe' | 'moderate' | 'caution';

export interface SafetyZone {
  lat: number;
  lng: number;
  radiusMeters: number;
  slot: TimeOfDay;
  level: SafetyLevel;
  label: string;
}

/** Safety level to fill color (rgba) */
export const SAFETY_COLORS: Record<SafetyLevel, string> = {
  safe: COLORS.sageBorder,
  moderate: COLORS.safetyModerate,
  caution: COLORS.safetyCaution,
};

/** Default safety by slot — generic; can be overridden per destination */
export const DEFAULT_SAFETY_BY_SLOT: Record<TimeOfDay, SafetyLevel> = {
  morning: 'safe',
  afternoon: 'moderate',
  evening: 'caution',
};

/**
 * Build safety zones for map pins.
 * Each pin gets a circle; color by slot (morning=green, afternoon=yellow, evening=orange).
 */
export function buildSafetyZones(
  pins: Array<{ lat: number; lng: number; slot: TimeOfDay }>,
  overrides?: Partial<Record<TimeOfDay, SafetyLevel>>
): SafetyZone[] {
  const bySlot = { ...DEFAULT_SAFETY_BY_SLOT, ...overrides };
  return pins.map((p, _i) => ({
    lat: p.lat,
    lng: p.lng,
    radiusMeters: 400,
    slot: p.slot,
    level: bySlot[p.slot],
    label: `${p.slot}`,
  }));
}
