// =============================================================================
// ROAM — Photo Journal: Auto-Organized Trip Photos by Day, Location & Activity
// =============================================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAppStore } from './store';
import { parseItinerary, type Itinerary, type ItineraryDay } from './types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type JournalPhoto = {
  readonly id: string;
  readonly tripId: string;
  readonly uri: string;
  readonly dayIndex: number | null;
  readonly location: string | null;
  readonly caption: string | null;
  readonly createdAt: string;
  readonly isFavorite: boolean;
};

export type PhotosByDay = ReadonlyArray<{
  readonly dayIndex: number;
  readonly photos: readonly JournalPhoto[];
}>;

// ---------------------------------------------------------------------------
// Local cache key
// ---------------------------------------------------------------------------
const cacheKey = (tripId: string) => `@roam/journal_photos_${tripId}`;

async function getCachedPhotos(tripId: string): Promise<JournalPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(tripId));
    return raw ? (JSON.parse(raw) as JournalPhoto[]) : [];
  } catch {
    return [];
  }
}

async function setCachedPhotos(tripId: string, photos: readonly JournalPhoto[]): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(tripId), JSON.stringify(photos));
  } catch {
    // silent — cache miss is acceptable
  }
}

// ---------------------------------------------------------------------------
// Row mapper (Supabase snake_case -> camelCase)
// ---------------------------------------------------------------------------
function rowToPhoto(row: Record<string, unknown>): JournalPhoto {
  return {
    id: String(row.id ?? ''),
    tripId: String(row.trip_id ?? ''),
    uri: String(row.uri ?? ''),
    dayIndex: typeof row.day_index === 'number' ? row.day_index : null,
    location: typeof row.location === 'string' ? row.location : null,
    caption: typeof row.caption === 'string' ? row.caption : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    isFavorite: Boolean(row.is_favorite),
  };
}

// ---------------------------------------------------------------------------
// addPhoto — insert into Supabase + local cache
// ---------------------------------------------------------------------------
export async function addPhoto(
  tripId: string,
  uri: string,
  dayIndex?: number,
  location?: string,
): Promise<JournalPhoto | null> {
  const session = useAppStore.getState().session;
  if (!session?.user?.id) return null;

  const { data, error } = await supabase
    .from('journal_photos')
    .insert({
      user_id: session.user.id,
      trip_id: tripId,
      uri,
      day_index: dayIndex ?? null,
      location: location ?? null,
    })
    .select()
    .single();

  if (error || !data) return null;

  const photo = rowToPhoto(data as Record<string, unknown>);
  const cached = await getCachedPhotos(tripId);
  await setCachedPhotos(tripId, [...cached, photo]);
  return photo;
}

// ---------------------------------------------------------------------------
// getPhotos — fetch all photos grouped by day
// ---------------------------------------------------------------------------
export async function getPhotos(tripId: string): Promise<PhotosByDay> {
  const session = useAppStore.getState().session;
  let photos: JournalPhoto[] = [];

  if (session?.user?.id) {
    const { data } = await supabase
      .from('journal_photos')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (data && Array.isArray(data)) {
      photos = (data as Record<string, unknown>[]).map(rowToPhoto);
      await setCachedPhotos(tripId, photos);
    } else {
      photos = await getCachedPhotos(tripId);
    }
  } else {
    photos = await getCachedPhotos(tripId);
  }

  return groupByDay(photos);
}

function groupByDay(photos: readonly JournalPhoto[]): PhotosByDay {
  const map = new Map<number, JournalPhoto[]>();
  for (const p of photos) {
    const key = p.dayIndex ?? 0;
    const arr = map.get(key) ?? [];
    map.set(key, [...arr, p]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayIndex, dayPhotos]) => ({ dayIndex, photos: dayPhotos }));
}

// ---------------------------------------------------------------------------
// autoTagPhoto — guess activity from itinerary dayIndex + time
// ---------------------------------------------------------------------------
export function autoTagPhoto(
  uri: string,
  itinerary: Itinerary,
  dayIndex: number,
): { location: string; caption: string } {
  const day: ItineraryDay | undefined = itinerary.days[dayIndex];
  if (!day) {
    return { location: itinerary.destination, caption: generateCaption(itinerary.destination, dayIndex, null) };
  }

  const hour = new Date().getHours();
  const slot = hour < 12 ? day.morning : hour < 17 ? day.afternoon : day.evening;
  const activity = slot.activity || day.theme;
  const location = slot.location || slot.neighborhood || itinerary.destination;

  return { location, caption: generateCaption(itinerary.destination, dayIndex, activity) };
}

// ---------------------------------------------------------------------------
// generateCaption — "Day 3 in Tokyo — Shibuya Crossing at sunset"
// ---------------------------------------------------------------------------
export function generateCaption(
  destination: string,
  dayIndex: number,
  activity: string | null,
): string {
  const dayNum = dayIndex + 1;
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 20 ? 'at sunset' : 'at night';

  if (activity) {
    return `Day ${dayNum} in ${destination} — ${activity} ${timeOfDay}`;
  }
  return `Day ${dayNum} in ${destination}`;
}

// ---------------------------------------------------------------------------
// toggleFavorite — mark/unmark as favorite
// ---------------------------------------------------------------------------
export async function toggleFavorite(photoId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('journal_photos')
    .select('is_favorite')
    .eq('id', photoId)
    .single();

  if (!existing) return false;

  const newValue = !(existing as Record<string, unknown>).is_favorite;
  const { error } = await supabase
    .from('journal_photos')
    .update({ is_favorite: newValue })
    .eq('id', photoId);

  return !error;
}

// ---------------------------------------------------------------------------
// getFavorites — returns only favorites for Trip Wrapped
// ---------------------------------------------------------------------------
export async function getFavorites(tripId: string): Promise<readonly JournalPhoto[]> {
  const { data } = await supabase
    .from('journal_photos')
    .select('*')
    .eq('trip_id', tripId)
    .eq('is_favorite', true)
    .order('created_at', { ascending: true });

  if (!data || !Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(rowToPhoto);
}

// ---------------------------------------------------------------------------
// usePhotoJournal — React hook
// ---------------------------------------------------------------------------
export function usePhotoJournal(tripId: string | undefined) {
  const [photosByDay, setPhotosByDay] = useState<PhotosByDay>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tripId) { setLoading(false); return; }
    setLoading(true);
    const grouped = await getPhotos(tripId);
    setPhotosByDay(grouped);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (uri: string, dayIndex?: number, location?: string) => {
    if (!tripId) return null;
    const photo = await addPhoto(tripId, uri, dayIndex, location);
    if (photo) await load();
    return photo;
  }, [tripId, load]);

  const favorite = useCallback(async (photoId: string) => {
    const ok = await toggleFavorite(photoId);
    if (ok) await load();
    return ok;
  }, [load]);

  const allPhotos = useMemo(
    () => photosByDay.flatMap((g) => g.photos),
    [photosByDay],
  );

  return { photosByDay, allPhotos, loading, add, favorite, reload: load } as const;
}
