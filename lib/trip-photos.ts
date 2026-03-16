// =============================================================================
// ROAM — Trip Photo Journal (local-first)
// Stores trip photos locally with AsyncStorage. Ready for Supabase Storage
// when the backend bucket is configured.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripPhoto, TripAlbum } from './types/trip-photos';

const PHOTOS_KEY = 'roam_trip_photos';
const ALBUMS_KEY = 'roam_trip_albums';

// ---------------------------------------------------------------------------
// Photo CRUD
// ---------------------------------------------------------------------------

export async function getAllPhotos(): Promise<TripPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getPhotosForTrip(tripId: string): Promise<TripPhoto[]> {
  const all = await getAllPhotos();
  return all.filter((p) => p.tripId === tripId);
}

export async function addPhoto(photo: TripPhoto): Promise<void> {
  const all = await getAllPhotos();
  const updated = [...all, photo];
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(updated));
}

export async function removePhoto(photoId: string): Promise<void> {
  const all = await getAllPhotos();
  const filtered = all.filter((p) => p.id !== photoId);
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(filtered));
}

export async function updatePhotoCaption(
  photoId: string,
  caption: string
): Promise<void> {
  const all = await getAllPhotos();
  const updated = all.map((p) =>
    p.id === photoId ? { ...p, caption } : p
  );
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(updated));
}

export async function togglePhotoLike(photoId: string): Promise<void> {
  const all = await getAllPhotos();
  const updated = all.map((p) =>
    p.id === photoId
      ? {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked
            ? Math.max(0, p.likesCount - 1)
            : p.likesCount + 1,
        }
      : p
  );
  await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(updated));
}

// ---------------------------------------------------------------------------
// Album management
// ---------------------------------------------------------------------------

export async function getAllAlbums(): Promise<TripAlbum[]> {
  try {
    const raw = await AsyncStorage.getItem(ALBUMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getAlbumForTrip(
  tripId: string
): Promise<TripAlbum | null> {
  const albums = await getAllAlbums();
  return albums.find((a) => a.tripId === tripId) ?? null;
}

export async function createAlbum(album: TripAlbum): Promise<void> {
  const albums = await getAllAlbums();
  // Don't create duplicates
  if (albums.some((a) => a.tripId === album.tripId)) return;
  const updated = [...albums, album];
  await AsyncStorage.setItem(ALBUMS_KEY, JSON.stringify(updated));
}

export async function updateAlbumVisibility(
  tripId: string,
  isPublic: boolean
): Promise<void> {
  const albums = await getAllAlbums();
  const updated = albums.map((a) =>
    a.tripId === tripId ? { ...a, isPublic } : a
  );
  await AsyncStorage.setItem(ALBUMS_KEY, JSON.stringify(updated));
}

export async function setAlbumCover(
  tripId: string,
  photoId: string
): Promise<void> {
  const albums = await getAllAlbums();
  const updated = albums.map((a) =>
    a.tripId === tripId ? { ...a, coverPhotoId: photoId } : a
  );
  await AsyncStorage.setItem(ALBUMS_KEY, JSON.stringify(updated));
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getPhotoStats(): Promise<{
  totalPhotos: number;
  destinations: string[];
  tripCount: number;
}> {
  const photos = await getAllPhotos();
  const destinations = [...new Set(photos.map((p) => p.destination))];
  const tripIds = [...new Set(photos.map((p) => p.tripId))];
  return {
    totalPhotos: photos.length,
    destinations,
    tripCount: tripIds.length,
  };
}

// ---------------------------------------------------------------------------
// Create photo helper
// ---------------------------------------------------------------------------

export function createTripPhoto(params: {
  tripId: string;
  userId: string;
  uri: string;
  caption: string;
  dayNumber: number;
  timeSlot: TripPhoto['timeSlot'];
  destination: string;
  locationLabel: string;
  width: number;
  height: number;
}): TripPhoto {
  return {
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tripId: params.tripId,
    userId: params.userId,
    uri: params.uri,
    caption: params.caption,
    dayNumber: params.dayNumber,
    timeSlot: params.timeSlot,
    destination: params.destination,
    locationLabel: params.locationLabel,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    isLiked: false,
    width: params.width,
    height: params.height,
  };
}
