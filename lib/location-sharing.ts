// =============================================================================
// ROAM — Temporary Location Sharing
// Privacy-first: auto-expires, group-only, user-controlled
// =============================================================================
import * as Location from 'expo-location';
import { supabase } from './supabase';
import { useAppStore } from './store';

import type { RealtimeChannel } from '@supabase/supabase-js';

// Import + re-export types from shared module (breaks circular dependency with store.ts)
import type { SharingDuration, MemberLocation, LocationSharingState } from './types/location-sharing';
export type { SharingDuration, MemberLocation, LocationSharingState };
export { DEFAULT_LOCATION_STATE } from './types/location-sharing';

// ---------------------------------------------------------------------------
// Duration helpers
// ---------------------------------------------------------------------------
export function getExpiresAt(duration: SharingDuration, tripEndDate?: Date): Date {
  const now = new Date();
  switch (duration) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '4h':
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    case 'trip':
      return tripEndDate ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'off':
    default:
      return now;
  }
}

export function getRemainingTime(expiresAt: string): string {
  const now = new Date().getTime();
  const end = new Date(expiresAt).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function getLastUpdatedLabel(updatedAt: string): string {
  const now = new Date().getTime();
  const updated = new Date(updatedAt).getTime();
  const diff = now - updated;

  if (diff < 60 * 1000) return 'Just now';
  if (diff < 60 * 60 * 1000) {
    const mins = Math.floor(diff / (60 * 1000));
    return `${mins} min ago`;
  }
  const hours = Math.floor(diff / (60 * 60 * 1000));
  return `${hours}h ago`;
}

export function isLocationExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= new Date().getTime();
}

export function hasNotMovedRecently(
  memberLocation: MemberLocation,
  thresholdMinutes: number = 30
): boolean {
  const updatedAt = new Date(memberLocation.updatedAt).getTime();
  const now = new Date().getTime();
  return now - updatedAt > thresholdMinutes * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Location watching
// ---------------------------------------------------------------------------
export async function startLocationWatch(
  tripId: string,
  userId: string,
  userName: string,
  userInitials: string,
  onUpdate: (location: MemberLocation) => void
): Promise<Location.LocationSubscription | null> {
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 50, // 50 meters
      },
      (loc) => {
        const memberLocation: MemberLocation = {
          memberId: userId,
          memberName: userName,
          memberInitials: userInitials,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          updatedAt: new Date().toISOString(),
          expiresAt: useAppStore.getState().locationSharing.sharingExpiresAt ?? new Date().toISOString(),
          isSharing: true,
        };

        onUpdate(memberLocation);

        // Broadcast to Supabase realtime
        broadcastLocation(tripId, memberLocation).catch(() => {});
      }
    );

    return sub;
  } catch {
    return null;
  }
}

export function stopLocationWatch(sub: Location.LocationSubscription | null): void {
  if (sub) {
    sub.remove();
  }
}

// ---------------------------------------------------------------------------
// Supabase Realtime
// ---------------------------------------------------------------------------
async function broadcastLocation(
  tripId: string,
  location: MemberLocation
): Promise<void> {
  const channel = supabase.channel(`trip-location:${tripId}`);
  await channel.send({
    type: 'broadcast',
    event: 'location_update',
    payload: location,
  });
}

export function subscribeToLocationUpdates(
  tripId: string,
  onLocationUpdate: (location: MemberLocation) => void,
  onPresenceChange?: () => void
): RealtimeChannel {
  const channel = supabase
    .channel(`trip-location:${tripId}`)
    .on('broadcast', { event: 'location_update' }, (payload) => {
      const loc = payload.payload as MemberLocation;
      if (loc && loc.memberId) {
        onLocationUpdate(loc);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && onPresenceChange) {
        onPresenceChange();
      }
    });

  return channel;
}

export function unsubscribeFromLocationUpdates(
  channel: RealtimeChannel | null
): void {
  if (channel) {
    supabase.removeChannel(channel);
  }
}

// ---------------------------------------------------------------------------
// Duration labels
// ---------------------------------------------------------------------------
export const SHARING_DURATION_OPTIONS: Array<{
  value: SharingDuration;
  label: string;
  description: string;
}> = [
  { value: '1h', label: '1 Hour', description: 'Quick meetup' },
  { value: '4h', label: '4 Hours', description: 'Afternoon exploring' },
  { value: 'trip', label: 'Until Trip Ends', description: 'Full trip visibility' },
  { value: 'off', label: 'Turn Off', description: 'Stop sharing' },
];
