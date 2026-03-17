// =============================================================================
// ROAM — Trip Sharing (Deep Links)
// Share trips via roam://trip/<uuid> deep links
// =============================================================================
import { Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from './supabase';
import type { Trip } from './store';
import type { Itinerary } from './types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SharedTrip {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  itinerary: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Share a trip — insert into shared_trips + open share sheet
// ---------------------------------------------------------------------------

const ROAM_APP_URL = 'roamapp.app';

/**
 * Build top 3 highlights from itinerary (first 3 slot activities across days).
 */
function getTopThreeActivities(itinerary: Itinerary): string[] {
  const out: string[] = [];
  for (const d of itinerary.days ?? []) {
    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      const s = d[slot];
      if (s?.activity && out.length < 3) out.push(s.activity);
    }
  }
  return out.slice(0, 3);
}

/**
 * Open native share sheet with card-style message: destination + top 3 + roamapp.app.
 * No sign-in or DB required. Use after generation for quick share.
 */
export async function shareTripAsCard(trip: Trip, parsed: Itinerary): Promise<void> {
  const top3 = getTopThreeActivities(parsed);
  const top3Line = top3.length > 0
    ? '\nTop 3: ' + top3.map((a, i) => `${i + 1}. ${a.slice(0, 60)}${a.length > 60 ? '…' : ''}`).join(' ')
    : '';
  const message = `My ${trip.days}-day trip to ${trip.destination}${top3Line}\n\n${ROAM_APP_URL}`;
  await Share.share({
    title: `My trip to ${trip.destination}`,
    message,
  });
}

/**
 * Publish a trip to the shared_trips table and open the native share sheet
 * with a deep link URL.
 */
export async function shareTrip(trip: Trip): Promise<string | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to share trips.');
      return null;
    }

    // Insert into shared_trips
    const { data, error } = await supabase
      .from('shared_trips')
      .insert({
        user_id: userId,
        destination: trip.destination,
        days: trip.days,
        budget: trip.budget,
        vibes: trip.vibes,
        itinerary: trip.itinerary,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[Sharing] Insert error:', error);
      Alert.alert('Error', 'Could not create share link.');
      return null;
    }

    const shareUrl = `https://roamappwait.netlify.app/trip/${data.id}`;
    const deepLink = `roam://trip/${data.id}`;

    await Share.share({
      title: `Check out my ${trip.destination} trip on ROAM`,
      message: `I planned an amazing ${trip.days}-day trip to ${trip.destination} with ROAM! Check it out: ${shareUrl}`,
      url: deepLink,
    });

    return data.id;
  } catch (err) {
    console.error('[Sharing] Error:', err);
    Alert.alert('Error', 'Could not share trip.');
    return null;
  }
}

// ---------------------------------------------------------------------------
// UUID validation (shared_trips uses UUID primary key)
// ---------------------------------------------------------------------------
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidShareId(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

// ---------------------------------------------------------------------------
// Fetch a shared trip by UUID
// ---------------------------------------------------------------------------

/**
 * Retrieve a shared trip from the shared_trips table by its UUID.
 */
export async function getSharedTrip(
  shareId: string
): Promise<SharedTrip | null> {
  if (!isValidShareId(shareId)) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('shared_trips')
      .select('*')
      .eq('id', shareId.trim())
      .single();

    if (error || !data) {
      console.error('[Sharing] Fetch error:', error);
      return null;
    }

    return data as SharedTrip;
  } catch (err) {
    console.error('[Sharing] Error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Copy shareable link — one-click copy, works without sign-in
// ---------------------------------------------------------------------------

export async function copyShareableLink(trip: Trip): Promise<boolean> {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (userId) {
      const { data } = await supabase
        .from('shared_trips')
        .insert({
          user_id: userId,
          destination: trip.destination,
          days: trip.days,
          budget: trip.budget,
          vibes: trip.vibes,
          itinerary: trip.itinerary,
        })
        .select('id')
        .single();

      if (data) {
        const url = `https://roamappwait.netlify.app/trip/${data.id}`;
        await Clipboard.setStringAsync(`My ${trip.days}-day trip to ${trip.destination} ${url}`);
        return true;
      }
    }

    const fallback = `My ${trip.days}-day trip to ${trip.destination} — planned with ROAM https://roamappwait.netlify.app`;
    await Clipboard.setStringAsync(fallback);
    return true;
  } catch {
    return false;
  }
}
