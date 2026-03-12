// =============================================================================
// ROAM — AI self-improvement loop
// =============================================================================

import { supabase } from './supabase';

export async function trackItineraryOutcome(
  tripId: string,
  destination: string,
  saved: boolean,
  promptVersion?: number
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_type: saved ? 'itinerary_saved' : 'itinerary_abandoned',
      payload: { tripId, destination, promptVersion },
    });
  } catch {
    // Silently fail
  }
}

export async function getActivePrompt(promptType: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('prompt_versions')
      .select('content')
      .eq('prompt_type', promptType)
      .eq('is_active', true)
      .single();
    return data?.content ?? null;
  } catch {
    return null;
  }
}
