// =============================================================================
// ROAM — Trip Photo Types
// Photo journal system for trip memories, social sharing, and profiles
// =============================================================================

export interface TripPhoto {
  id: string;
  tripId: string;
  userId: string;
  /** Local URI or remote URL */
  uri: string;
  /** User caption */
  caption: string;
  /** Day of trip (1-indexed) */
  dayNumber: number;
  /** Activity time slot this photo is from */
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'other';
  /** Destination name */
  destination: string;
  /** Location label (neighborhood, venue, etc.) */
  locationLabel: string;
  /** Timestamp */
  createdAt: string;
  /** Number of likes (social) */
  likesCount: number;
  /** Whether current user has liked */
  isLiked: boolean;
  /** Photo dimensions for layout */
  width: number;
  height: number;
}

export interface TripAlbum {
  tripId: string;
  destination: string;
  days: number;
  photos: TripPhoto[];
  coverPhotoId: string | null;
  createdAt: string;
  /** Whether this album is publicly visible on profile */
  isPublic: boolean;
}

export interface PhotoFeedItem {
  type: 'photo' | 'trip_summary' | 'milestone';
  photo?: TripPhoto;
  /** Profile info of the photo owner */
  authorName: string;
  authorEmoji: string;
  tripDestination: string;
  tripDays: number;
  /** Timestamp for feed ordering */
  timestamp: string;
}

export interface ProfileGallery {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  albums: TripAlbum[];
  totalPhotos: number;
  countriesCount: number;
  /** Featured photos selected by user */
  featuredPhotoIds: string[];
}
