// ROAM — GetYourGuide Activities Client (via travel-proxy edge function)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GYGActivity {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  rating: number | null;
  reviewCount: number;
  photoUrl: string | null;
  category: string;
  bookingUrl: string; // includes affiliate param
}

export interface GYGActivityDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  rating: number | null;
  reviewCount: number;
  photos: string[];
  includes: string[];
  excludes: string[];
  meetingPoint: string | null;
  bookingUrl: string;
}

// ---------------------------------------------------------------------------
// Cache constants
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'roam_gyg_';
const TTL = 12 * 60 * 60 * 1000; // 12 hours

// ---------------------------------------------------------------------------
// Affiliate helper
// ---------------------------------------------------------------------------

function appendAffiliate(url: string): string {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}partner_id=ROAM`;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw) as { data: T; fetchedAt: number };
    if (Date.now() - fetchedAt > TTL) return null;
    return data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, fetchedAt: Date.now() }),
    );
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Session guard
// ---------------------------------------------------------------------------

async function ensureSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchActivities(
  destination: string,
  date?: string,
  category?: string,
): Promise<GYGActivity[] | null> {
  const cacheKey = `search_${destination}_${date ?? 'any'}_${category ?? 'all'}`;
  const cached = await readCache<GYGActivity[]>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: {
        provider: 'getyourguide',
        action: 'searchActivities',
        params: { destination, date, category },
      },
    });
    if (error || !data?.activities) return null;

    const activities = (data.activities as GYGActivity[]).map((a) => ({
      ...a,
      bookingUrl: appendAffiliate(a.bookingUrl),
    }));
    await writeCache(cacheKey, activities);
    return activities;
  } catch {
    return null;
  }
}

export async function getActivityDetails(
  activityId: string,
): Promise<GYGActivityDetails | null> {
  const cacheKey = `details_${activityId}`;
  const cached = await readCache<GYGActivityDetails>(cacheKey);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: {
        provider: 'getyourguide',
        action: 'getActivityDetails',
        params: { activityId },
      },
    });
    if (error || !data?.activity) return null;

    const activity: GYGActivityDetails = {
      ...(data.activity as GYGActivityDetails),
      bookingUrl: appendAffiliate((data.activity as GYGActivityDetails).bookingUrl),
    };
    await writeCache(cacheKey, activity);
    return activity;
  } catch {
    return null;
  }
}
