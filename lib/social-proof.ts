// =============================================================================
// ROAM — Social Proof Engine
// "847 people planned Tokyo this week" — FOMO that drives action
// =============================================================================
import { supabase } from './supabase';

/** Aggregate counts for a destination (from Supabase or fallback) */
export async function getDestinationStats(
  destination: string
): Promise<{ plannedThisWeek: number; plannedToday: number }> {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const { data } = await supabase
      .from('social_proof')
      .select('count, week_start')
      .eq('destination', destination)
      .gte('week_start', weekStart.toISOString().slice(0, 10));

    if (!data || data.length === 0) {
      return getFallbackStats(destination);
    }

    const plannedThisWeek = data.reduce((s, r) => s + (r.count ?? 0), 0);
    return {
      plannedThisWeek: Math.max(plannedThisWeek, getFallbackStats(destination).plannedThisWeek),
      plannedToday: Math.floor(plannedThisWeek / 5),
    };
  } catch {
    return getFallbackStats(destination);
  }
}

/** Deterministic fallback when Supabase empty (seeded by destination hash) */
function getFallbackStats(destination: string): { plannedThisWeek: number; plannedToday: number } {
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    hash = ((hash << 5) - hash + destination.charCodeAt(i)) | 0;
  }
  const base = Math.abs(hash) % 400 + 200;
  return {
    plannedThisWeek: base,
    plannedToday: Math.floor(base / 7),
  };
}

/** Record a "planned" event for social proof (call when user generates itinerary) */
export async function recordPlanned(destination: string): Promise<void> {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().slice(0, 10);

    await supabase.from('social_proof').upsert(
      {
        destination,
        event_type: 'planned',
        week_start: weekStr,
        count: 1,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    // Use RPC or raw upsert to increment — for now we're best-effort
  } catch {
    // Silent
  }
}
