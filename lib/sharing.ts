// =============================================================================
// ROAM — Trip Sharing (Deep Links)
// Share trips via roam://trip/<uuid> deep links
// =============================================================================
import { Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from './supabase';
import type { Trip } from './store';

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
// Fetch a shared trip by UUID
// ---------------------------------------------------------------------------

/**
 * Retrieve a shared trip from the shared_trips table by its UUID.
 */
export async function getSharedTrip(
  shareId: string
): Promise<SharedTrip | null> {
  try {
    const { data, error } = await supabase
      .from('shared_trips')
      .select('*')
      .eq('id', shareId)
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
