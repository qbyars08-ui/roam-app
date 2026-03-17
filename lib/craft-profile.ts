// =============================================================================
// ROAM — CRAFT learned preferences → profiles.travel_profile
// Persist and load for "ROAM remembers you" and welcome-back message
// =============================================================================

import { supabase } from './supabase';
import type { CraftPreferences } from './craft-engine';

const CRAFT_LEARNED_KEYS = [
  'budgetRange',
  'cabinClassPreference',
  'accommodationStyle',
  'dietaryRestrictions',
  'travelCompanions',
  'whatMattersMost',
] as const;

export type CraftLearnedPreferences = Partial<{
  budgetRange: string;
  cabinClassPreference: string;
  accommodationStyle: string;
  dietaryRestrictions: string;
  travelCompanions: string;
  whatMattersMost: string;
}>;

/** Map preferences_captured from CRAFT to the shape we store in profiles.travel_profile (craft_learned) */
export function craftPreferencesToLearned(p: CraftPreferences): CraftLearnedPreferences {
  const out: CraftLearnedPreferences = {};
  if (p.budget) out.budgetRange = p.budget;
  if (p.flying) out.cabinClassPreference = p.flying;
  if (p.accommodation) out.accommodationStyle = p.accommodation;
  if (p.dietaryHealth) out.dietaryRestrictions = p.dietaryHealth;
  if (p.travelParty) out.travelCompanions = p.travelParty;
  if (p.whatMatters) out.whatMattersMost = p.whatMatters;
  return out;
}

/** Update profiles.travel_profile with craft_learned (merge into existing JSONB) */
export async function updateProfileFromCraft(
  userId: string,
  learned: CraftLearnedPreferences
): Promise<void> {
  if (Object.keys(learned).length === 0) return;
  const { data: row } = await supabase
    .from('profiles')
    .select('travel_profile')
    .eq('id', userId)
    .single();
  const existing = (row?.travel_profile as Record<string, unknown> | null) ?? {};
  const merged = {
    ...existing,
    craft_learned: { ...(existing.craft_learned as Record<string, unknown> ?? {}), ...learned },
  };
  await supabase.from('profiles').update({ travel_profile: merged }).eq('id', userId);
}

/** Fetch craft_learned from profiles.travel_profile for welcome-back and pre-fill */
export async function getCraftLearnedPreferences(userId: string): Promise<CraftLearnedPreferences> {
  const { data: row } = await supabase
    .from('profiles')
    .select('travel_profile')
    .eq('id', userId)
    .single();
  const tp = row?.travel_profile as Record<string, unknown> | null;
  const craft = tp?.craft_learned as Record<string, unknown> | null | undefined;
  if (!craft || typeof craft !== 'object') return {};
  const out: CraftLearnedPreferences = {};
  for (const key of CRAFT_LEARNED_KEYS) {
    if (typeof craft[key] === 'string') out[key] = craft[key] as string;
  }
  return out;
}

/** One-line welcome back message using learned prefs (e.g. cabin class) */
export function getWelcomeBackMessage(learned: CraftLearnedPreferences): string | null {
  if (learned.cabinClassPreference?.toLowerCase().includes('business')) {
    return "Welcome back. Last time you mentioned you prefer business class for long haul. Should I factor that in for this trip?";
  }
  if (learned.budgetRange) {
    return "Welcome back. I have your budget and style from last time. Should I use that for this trip?";
  }
  if (learned.accommodationStyle || learned.whatMattersMost) {
    return "Welcome back. I remember your accommodation style and what matters to you. Want to use that again?";
  }
  return null;
}
