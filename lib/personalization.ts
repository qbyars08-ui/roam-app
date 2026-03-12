// =============================================================================
// ROAM — Personalization Engine
// Learns from trips, infers travel style, powers "ROAM knows you" moments
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PREFS_KEY = '@roam/user_prefs';

export interface UserPrefs {
  travelStyle: string[];
  budgetPreference: string | null;
  favoriteDestinations: string[];
  tripCount: number;
  inferredPersonality: string | null;
  lastInferredAt: string | null;
}

const DEFAULT: UserPrefs = {
  travelStyle: [],
  budgetPreference: null,
  favoriteDestinations: [],
  tripCount: 0,
  inferredPersonality: null,
  lastInferredAt: null,
};

export async function getLocalPrefs(): Promise<UserPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

export async function saveLocalPrefs(prefs: Partial<UserPrefs>): Promise<void> {
  const current = await getLocalPrefs();
  const merged = { ...current, ...prefs };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(merged));
}

/** Infer preferences from onboarding answers */
export function inferFromOnboarding(answers: {
  travelStyle?: string;
  priority?: string;
  budget?: string;
}): Partial<UserPrefs> {
  const travelStyle: string[] = [];
  if (answers.travelStyle) travelStyle.push(answers.travelStyle);
  if (answers.priority) travelStyle.push(answers.priority);
  return {
    travelStyle,
    budgetPreference: answers.budget ?? null,
    lastInferredAt: new Date().toISOString(),
  };
}

/** Infer from a single trip */
export function inferFromTrip(destination: string, vibes: string[], budget: string): Partial<UserPrefs> {
  return {
    favoriteDestinations: [destination],
    travelStyle: [...vibes],
    budgetPreference: budget || undefined,
    lastInferredAt: new Date().toISOString(),
  };
}

/** Merge inferred data into prefs (call after each trip) */
export async function learnFromTrip(
  destination: string,
  vibes: string[],
  budget: string
): Promise<UserPrefs> {
  const prefs = await getLocalPrefs();
  const favs = [...new Set([destination, ...prefs.favoriteDestinations])].slice(0, 10);
  const styles = [...new Set([...vibes, ...prefs.travelStyle])].slice(0, 8);
  const updated: UserPrefs = {
    ...prefs,
    favoriteDestinations: favs,
    travelStyle: styles,
    budgetPreference: budget || prefs.budgetPreference,
    tripCount: prefs.tripCount + 1,
    lastInferredAt: new Date().toISOString(),
  };
  await saveLocalPrefs(updated);
  return updated;
}

/** "We noticed you love X" — personalized message after 3+ trips */
export function getPersonalizedMessage(prefs: UserPrefs): string | null {
  if (prefs.tripCount < 3) return null;

  const topVibes = prefs.travelStyle.slice(0, 2);
  const topDests = prefs.favoriteDestinations.slice(0, 2);

  const foodIds = ['food', 'foodie', 'local-eats', 'market-hopper'];
  const cultureIds = ['culture', 'history', 'deep-history', 'art-design'];
  if (topVibes.some((v) => foodIds.includes(v))) {
    return `We noticed you love food-first cities — here's your next match`;
  }
  if (topVibes.some((v) => cultureIds.includes(v))) {
    return `Your taste for culture and history — we've got a perfect match`;
  }
  if (topDests.length >= 2) {
    return `Based on ${topDests[0]} and ${topDests[1]} — you'll love this`;
  }
  return `Based on your trips — we think you'll love this`;
}

/** Sync to Supabase user_preferences (when signed in) */
export async function syncPrefsToSupabase(userId: string): Promise<void> {
  const prefs = await getLocalPrefs();
  try {
    await supabase.from('user_preferences').upsert({
      user_id: userId,
      travel_style: prefs.travelStyle,
      budget_preference: prefs.budgetPreference,
      favorite_destinations: prefs.favoriteDestinations,
      trip_count: prefs.tripCount,
      last_inferred_at: prefs.lastInferredAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch {
    // Best-effort sync
  }
}
