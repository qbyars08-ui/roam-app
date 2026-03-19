// =============================================================================
// ROAM — Public Share Utilities
// Fetch trips without auth, generate OG meta, copy link with haptic
// =============================================================================
import * as Clipboard from 'expo-clipboard';
import { supabase } from './supabase';
import { parseItinerary, type Itinerary } from './types/itinerary';
import { notificationAsync, NotificationFeedbackType } from './haptics';
import { DESTINATION_HERO_PHOTOS } from './constants';

const ROAM_URL = 'https://roamapp.app';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShareableTrip {
  id: string;
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  createdAt: string;
  itinerary: Itinerary | null;
  heroImageUrl: string;
}

export interface OGMetaTags {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Fetch a shareable trip (public, anon key, no auth)
// ---------------------------------------------------------------------------

export async function getShareableTrip(tripId: string): Promise<ShareableTrip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('id, destination, days, budget, vibes, itinerary, created_at')
    .eq('id', tripId)
    .single();

  if (error || !data) return null;

  let itinerary: Itinerary | null = null;
  try {
    if (data.itinerary) {
      itinerary = parseItinerary(data.itinerary as string);
    }
  } catch {
    // Itinerary parse failure is non-fatal
  }

  return {
    id: data.id as string,
    destination: data.destination as string,
    days: data.days as number,
    budget: data.budget as string,
    vibes: (data.vibes as string[]) ?? [],
    createdAt: data.created_at as string,
    itinerary,
    heroImageUrl: resolveHeroImage(data.destination as string),
  };
}

// ---------------------------------------------------------------------------
// Generate OpenGraph meta tags for link previews
// ---------------------------------------------------------------------------

export function generateOGMetaTags(trip: ShareableTrip): OGMetaTags {
  const activityCount = trip.itinerary
    ? trip.itinerary.days.length * 3
    : trip.days * 3;

  const description = trip.itinerary?.tagline
    ? trip.itinerary.tagline
    : `${trip.days} days, ${activityCount} activities. Plan yours free.`;

  return {
    title: `${trip.destination} in ${trip.days} days \u2014 ROAM`,
    description,
    image: trip.heroImageUrl,
    url: `${ROAM_URL}/shared-trip/${trip.id}`,
    siteName: 'ROAM',
    type: 'article',
  };
}

// ---------------------------------------------------------------------------
// Copy trip link to clipboard with haptic feedback
// ---------------------------------------------------------------------------

export async function copyTripLink(tripId: string): Promise<void> {
  const url = `${ROAM_URL}/shared-trip/${tripId}`;
  await Clipboard.setStringAsync(url);
  await notificationAsync(NotificationFeedbackType.Success);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveHeroImage(destination: string): string {
  const key = Object.keys(DESTINATION_HERO_PHOTOS).find(
    (k) =>
      destination.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(destination.toLowerCase().split(',')[0]),
  );
  if (key) return DESTINATION_HERO_PHOTOS[key] + '&w=1200&q=90';
  return 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=90';
}
