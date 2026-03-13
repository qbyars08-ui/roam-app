// =============================================================================
// ROAM — Location Sharing Types (extracted to break circular dependency)
// Both store.ts and lib/location-sharing.ts import from here
// =============================================================================
import type * as Location from 'expo-location';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type SharingDuration = '1h' | '4h' | 'trip' | 'off';

export interface MemberLocation {
  memberId: string;
  memberName: string;
  memberInitials: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  expiresAt: string;
  isSharing: boolean;
}

export interface LocationSharingState {
  /** Current user's sharing status */
  isSharingLocation: boolean;
  /** When sharing auto-expires (ISO string) */
  sharingExpiresAt: string | null;
  /** Duration option selected */
  sharingDuration: SharingDuration;
  /** All group members' locations */
  memberLocations: MemberLocation[];
  /** Whether we have location permission */
  hasLocationPermission: boolean;
  /** Watch subscription ID */
  watchId: Location.LocationSubscription | null;
  /** Realtime channel */
  channel: RealtimeChannel | null;
}

export const DEFAULT_LOCATION_STATE: LocationSharingState = {
  isSharingLocation: false,
  sharingExpiresAt: null,
  sharingDuration: 'off',
  memberLocations: [],
  hasLocationPermission: false,
  watchId: null,
  channel: null,
};
