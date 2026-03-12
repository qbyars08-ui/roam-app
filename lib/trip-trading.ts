// =============================================================================
// ROAM — Trip Trading
// Browse public trips, one-tap claim
// =============================================================================
import { supabase } from './supabase';
import type { Trip } from './store';

export interface TradableTrip {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  itinerary: string;
  claim_count: number;
  created_at: string;
}

/** Fetch trips that are public and allow claim */
export async function fetchTradableTrips(): Promise<TradableTrip[]> {
  const { data, error } = await supabase
    .from('shared_trips')
    .select('id, destination, days, budget, vibes, itinerary, claim_count, created_at')
    .eq('allow_claim', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return (data ?? []) as TradableTrip[];
}

/** Publish a trip for trading (others can claim) */
export async function publishForTrading(trip: Trip): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('shared_trips')
    .insert({
      user_id: userId,
      destination: trip.destination,
      days: trip.days,
      budget: trip.budget,
      vibes: trip.vibes,
      itinerary: trip.itinerary,
      is_public: true,
      allow_claim: true,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return data.id;
}

/** Claim a trip — copy to user's trips and record claim */
export async function claimTrip(
  sharedTripId: string,
  tradable: TradableTrip
): Promise<Trip | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { error } = await supabase.from('trip_claims').insert({
    shared_trip_id: sharedTripId,
    claimant_id: userId,
  });
  if (error) return null;

  await supabase
    .from('shared_trips')
    .update({ claim_count: (tradable.claim_count ?? 0) + 1 })
    .eq('id', sharedTripId);

  const trip: Trip = {
    id: `claimed-${sharedTripId}-${Date.now()}`,
    destination: tradable.destination,
    days: tradable.days,
    budget: tradable.budget,
    vibes: tradable.vibes ?? [],
    itinerary: tradable.itinerary,
    createdAt: new Date().toISOString(),
  };
  return trip;
}
