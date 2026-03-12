// =============================================================================
// ROAM — Chaos "Dare" share
// Save chaotic trip, shareable link, CTA to open ROAM
// =============================================================================
import { supabase } from './supabase';

export interface ChaosDare {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  itinerary_snapshot: string | null;
  created_at: string;
}

/** Save a chaos result for sharing */
export async function saveChaosDare(params: {
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  itinerarySnapshot?: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('chaos_dares')
    .insert({
      destination: params.destination,
      days: params.days,
      budget: params.budget,
      vibes: params.vibes,
      itinerary_snapshot: params.itinerarySnapshot ?? null,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id;
}

/** Fetch a dare by ID */
export async function getChaosDare(id: string): Promise<ChaosDare | null> {
  const { data, error } = await supabase
    .from('chaos_dares')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as ChaosDare;
}

export function getDareShareUrl(dareId: string): string {
  return `https://roamappwait.netlify.app/chaos-dare/${dareId}`;
}

export function getDareShareMessage(dare: ChaosDare): string {
  return `Dare you to do this trip: ${dare.destination} for ${dare.days} days. ${dare.budget} budget. Open ROAM to claim it.`;
}
