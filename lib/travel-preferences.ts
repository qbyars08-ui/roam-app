// =============================================================================
// ROAM — Travel Preferences: learn from CRAFT sessions, persist to Supabase
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAppStore } from './store';
import type { CraftPreferences } from './craft-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreferenceSource = 'craft' | 'manual';

export type PreferenceKey =
  | 'budget_tier'
  | 'flight_class'
  | 'dietary_restrictions'
  | 'accommodation_type'
  | 'travel_style'
  | 'pace'
  | 'travel_companions'
  | 'morning_type'
  | 'transport_preference';

export type TravelPreference = {
  readonly key: PreferenceKey;
  readonly value: string;
  readonly source: PreferenceSource;
  readonly confidence: number;
  readonly createdAt: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREFERENCE_LABELS: Record<PreferenceKey, string> = {
  budget_tier: 'Budget',
  flight_class: 'Flight Class',
  dietary_restrictions: 'Diet',
  accommodation_type: 'Stays',
  travel_style: 'Style',
  pace: 'Pace',
  travel_companions: 'Traveling With',
  morning_type: 'Mornings',
  transport_preference: 'Transport',
};

// ---------------------------------------------------------------------------
// extractPreferences — parse a CRAFT conversation to extract preferences
// ---------------------------------------------------------------------------

export function extractPreferences(craftPrefs: CraftPreferences): readonly TravelPreference[] {
  const now = new Date().toISOString();
  const results: TravelPreference[] = [];

  if (craftPrefs.budget) {
    const budgetMap: Record<string, string> = {
      backpacker: 'budget',
      'budget-friendly': 'budget',
      comfort: 'mid-range',
      comfortable: 'mid-range',
      'treat-yourself': 'luxury',
      'no-budget': 'luxury',
      'no limits': 'luxury',
    };
    const normalized = budgetMap[craftPrefs.budget.toLowerCase()] ?? craftPrefs.budget;
    results.push({
      key: 'budget_tier',
      value: normalized,
      source: 'craft',
      confidence: 0.9,
      createdAt: now,
    });
  }

  if (craftPrefs.flying) {
    const val = craftPrefs.flying.toLowerCase();
    let flightClass = craftPrefs.flying;
    if (val.includes('business')) flightClass = 'business';
    else if (val.includes('first')) flightClass = 'first';
    else if (val.includes('premium') || val.includes('comfort')) flightClass = 'premium economy';
    else if (val.includes('economy') || val.includes('cheap')) flightClass = 'economy';

    results.push({
      key: 'flight_class',
      value: flightClass,
      source: 'craft',
      confidence: 0.85,
      createdAt: now,
    });
  }

  if (craftPrefs.dietaryHealth) {
    const val = craftPrefs.dietaryHealth.toLowerCase();
    // Skip vague responses
    if (!val.includes('none') && !val.includes('no restriction') && val.length > 2) {
      results.push({
        key: 'dietary_restrictions',
        value: craftPrefs.dietaryHealth,
        source: 'craft',
        confidence: 0.95,
        createdAt: now,
      });
    }
  }

  if (craftPrefs.accommodation) {
    const val = craftPrefs.accommodation.toLowerCase();
    let accomType = craftPrefs.accommodation;
    if (val.includes('hotel')) accomType = 'hotel';
    else if (val.includes('hostel')) accomType = 'hostel';
    else if (val.includes('airbnb') || val.includes('apartment') || val.includes('rental')) accomType = 'airbnb';
    else if (val.includes('resort')) accomType = 'resort';
    else if (val.includes('boutique')) accomType = 'boutique hotel';

    results.push({
      key: 'accommodation_type',
      value: accomType,
      source: 'craft',
      confidence: 0.9,
      createdAt: now,
    });
  }

  if (craftPrefs.whatMatters) {
    const val = craftPrefs.whatMatters.toLowerCase();
    let style = craftPrefs.whatMatters;
    if (val.includes('adventure') || val.includes('thrill')) style = 'adventure';
    else if (val.includes('relax') || val.includes('chill') || val.includes('spa')) style = 'relaxation';
    else if (val.includes('culture') || val.includes('museum') || val.includes('history')) style = 'culture';
    else if (val.includes('food') || val.includes('eat') || val.includes('cuisine')) style = 'food';
    else if (val.includes('nature') || val.includes('hike') || val.includes('outdoor')) style = 'nature';
    else if (val.includes('nightlife') || val.includes('party') || val.includes('bar')) style = 'nightlife';

    results.push({
      key: 'travel_style',
      value: style,
      source: 'craft',
      confidence: 0.8,
      createdAt: now,
    });
  }

  if (craftPrefs.travelParty) {
    results.push({
      key: 'travel_companions',
      value: craftPrefs.travelParty,
      source: 'craft',
      confidence: 0.9,
      createdAt: now,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// mergePreferences — merge new prefs into existing, keeping highest confidence
// ---------------------------------------------------------------------------

export function mergePreferences(
  existing: readonly TravelPreference[],
  incoming: readonly TravelPreference[],
): readonly TravelPreference[] {
  const byKey = new Map<PreferenceKey, TravelPreference>();

  // Add existing first
  for (const pref of existing) {
    byKey.set(pref.key, pref);
  }

  // Overwrite with incoming if higher confidence or newer
  for (const pref of incoming) {
    const current = byKey.get(pref.key);
    if (!current || pref.confidence >= current.confidence) {
      byKey.set(pref.key, pref);
    }
  }

  return Array.from(byKey.values());
}

// ---------------------------------------------------------------------------
// savePreferences — upsert to profiles.travel_preferences JSONB
// ---------------------------------------------------------------------------

export async function savePreferences(
  userId: string,
  prefs: readonly TravelPreference[],
): Promise<void> {
  if (prefs.length === 0) return;

  const { data: row } = await supabase
    .from('profiles')
    .select('travel_profile')
    .eq('id', userId)
    .single();

  const existing = (row?.travel_profile as Record<string, unknown> | null) ?? {};
  const existingPrefs = Array.isArray(existing.travel_preferences)
    ? (existing.travel_preferences as TravelPreference[])
    : [];

  const merged = mergePreferences(existingPrefs, prefs);

  const updated = {
    ...existing,
    travel_preferences: merged,
  };

  await supabase.from('profiles').update({ travel_profile: updated }).eq('id', userId);
}

// ---------------------------------------------------------------------------
// loadPreferences — read from profiles.travel_preferences
// ---------------------------------------------------------------------------

export async function loadPreferences(userId: string): Promise<readonly TravelPreference[]> {
  const { data: row } = await supabase
    .from('profiles')
    .select('travel_profile')
    .eq('id', userId)
    .single();

  const tp = row?.travel_profile as Record<string, unknown> | null;
  if (!tp || !Array.isArray(tp.travel_preferences)) return [];

  // Validate shape at runtime
  return (tp.travel_preferences as unknown[]).filter(
    (p): p is TravelPreference =>
      typeof p === 'object' &&
      p !== null &&
      'key' in p &&
      'value' in p &&
      'source' in p &&
      'confidence' in p &&
      'createdAt' in p,
  );
}

// ---------------------------------------------------------------------------
// deletePreference — remove a single preference by key
// ---------------------------------------------------------------------------

export async function deletePreference(
  userId: string,
  key: PreferenceKey,
): Promise<readonly TravelPreference[]> {
  const current = await loadPreferences(userId);
  const filtered = current.filter((p) => p.key !== key);

  const { data: row } = await supabase
    .from('profiles')
    .select('travel_profile')
    .eq('id', userId)
    .single();

  const existing = (row?.travel_profile as Record<string, unknown> | null) ?? {};
  const updated = { ...existing, travel_preferences: filtered };

  await supabase.from('profiles').update({ travel_profile: updated }).eq('id', userId);
  return filtered;
}

// ---------------------------------------------------------------------------
// getPreferencesSummary — natural language summary for Claude context
// ---------------------------------------------------------------------------

export function getPreferencesSummary(prefs: readonly TravelPreference[]): string | null {
  if (prefs.length === 0) return null;

  const parts: string[] = [];

  const get = (key: PreferenceKey): string | undefined =>
    prefs.find((p) => p.key === key)?.value;

  const budget = get('budget_tier');
  if (budget) parts.push(`prefers ${budget} budget`);

  const flight = get('flight_class');
  if (flight) parts.push(`flies ${flight}`);

  const diet = get('dietary_restrictions');
  if (diet) parts.push(`dietary: ${diet}`);

  const accom = get('accommodation_type');
  if (accom) parts.push(`stays in ${accom}s`);

  const style = get('travel_style');
  if (style) parts.push(`travel style: ${style}`);

  const pace = get('pace');
  if (pace) parts.push(`${pace} pace`);

  const companions = get('travel_companions');
  if (companions) parts.push(`usually travels ${companions}`);

  if (parts.length === 0) return null;

  return `Based on previous trips: ${parts.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// getPreferenceLabel — human-readable label for UI chips
// ---------------------------------------------------------------------------

export function getPreferenceLabel(key: PreferenceKey): string {
  return PREFERENCE_LABELS[key] ?? key;
}

// ---------------------------------------------------------------------------
// usePreferences — React hook for loading + managing preferences
// ---------------------------------------------------------------------------

export function usePreferences(): {
  preferences: readonly TravelPreference[];
  loading: boolean;
  refresh: () => Promise<void>;
  remove: (key: PreferenceKey) => Promise<void>;
} {
  const [preferences, setPreferences] = useState<readonly TravelPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAppStore((s) => s.session?.user?.id);

  const refresh = useCallback(async () => {
    if (!userId) {
      setPreferences([]);
      setLoading(false);
      return;
    }
    try {
      const prefs = await loadPreferences(userId);
      setPreferences(prefs);
    } catch {
      // silent — preferences are non-critical
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (key: PreferenceKey) => {
      if (!userId) return;
      try {
        const updated = await deletePreference(userId, key);
        setPreferences(updated);
      } catch {
        // silent
      }
    },
    [userId],
  );

  return { preferences, loading, refresh, remove };
}
