// =============================================================================
// ROAM — Shareable Trip Wrapped Image & Share Utilities
// Generates share text, URLs, and triggers native share sheet
// =============================================================================
import { Share } from 'react-native';
import type { Trip } from './store';
import type { Itinerary, TimeSlotActivity } from './types/itinerary';

const ROAM_BASE_URL = 'https://roamapp.app';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countNeighborhoods(itinerary: Itinerary): number {
  const seen = new Set<string>();
  for (const day of itinerary.days) {
    for (const slot of [day.morning, day.afternoon, day.evening] as TimeSlotActivity[]) {
      if (slot.neighborhood) seen.add(slot.neighborhood);
    }
    if (day.accommodation.neighborhood) seen.add(day.accommodation.neighborhood);
  }
  return seen.size;
}

function countActivities(itinerary: Itinerary): number {
  return itinerary.days.length * 3; // morning + afternoon + evening per day
}

// ---------------------------------------------------------------------------
// Generate wrapped share URL
// ---------------------------------------------------------------------------

export function generateWrappedUrl(tripId: string): string {
  return `${ROAM_BASE_URL}/wrapped/${tripId}`;
}

// ---------------------------------------------------------------------------
// Generate wrapped share text
// ---------------------------------------------------------------------------

export function generateWrappedText(trip: Trip, itinerary: Itinerary): string {
  const neighborhoods = countNeighborhoods(itinerary);
  const activities = countActivities(itinerary);
  return `${trip.days} days in ${trip.destination}. ${neighborhoods} neighborhoods. ${activities} activities. Plan yours → roamapp.app`;
}

// ---------------------------------------------------------------------------
// Share trip wrapped — opens native share sheet
// ---------------------------------------------------------------------------

export async function shareTripWrapped(trip: Trip, itinerary: Itinerary): Promise<void> {
  const message = generateWrappedText(trip, itinerary);
  const url = generateWrappedUrl(trip.id);

  await Share.share({
    title: `My ${trip.destination} trip — ROAM`,
    message,
    url,
  });
}

// ---------------------------------------------------------------------------
// Share itinerary link
// ---------------------------------------------------------------------------

export async function shareItineraryLink(trip: Trip): Promise<void> {
  const url = `${ROAM_BASE_URL}/trip/${trip.id}`;
  await Share.share({
    title: `My ${trip.destination} trip — ROAM`,
    message: `Check out my ${trip.destination} trip on ROAM`,
    url,
  });
}

// ---------------------------------------------------------------------------
// Share destination link
// ---------------------------------------------------------------------------

export async function shareDestination(destination: string): Promise<void> {
  const url = `${ROAM_BASE_URL}/destination/${encodeURIComponent(destination)}`;
  await Share.share({
    title: `${destination} — ROAM`,
    message: `${destination} — everything you need to know`,
    url,
  });
}
