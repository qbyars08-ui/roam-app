// =============================================================================
// ROAM — Destination Photo Client (via Supabase Edge Function)
// =============================================================================

import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch a single destination photo URL via the destination-photo edge function.
 * Returns null on error (graceful degradation — emoji fallback).
 */
export async function getDestinationPhoto(
  query: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'destination-photo',
      { body: { query } }
    );

    if (error) {
      console.warn('[destination-photos] Failed:', error);
      return null;
    }

    return (data?.photo_url as string) ?? null;
  } catch (err) {
    console.warn('[destination-photos] Error:', err);
    return null;
  }
}

/**
 * Fetch photos for multiple destinations in parallel.
 * Returns a Map keyed by destination label → photo URL (or null).
 *
 * @param entries Array of { label, photoQuery } objects
 */
export async function getDestinationPhotos(
  entries: Array<{ label: string; photoQuery: string }>
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();

  if (entries.length === 0) return map;

  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const url = await getDestinationPhoto(entry.photoQuery);
      return { label: entry.label, url };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      map.set(result.value.label, result.value.url);
    }
  }

  return map;
}
