// =============================================================================
// ROAM — Image URL Cache
// AsyncStorage-backed cache for destination image URLs.
// Prevents re-fetching across sessions. TTL: 30 days.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@roam/img/';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry {
  url: string;
  cachedAt: number;
}

const memCache = new Map<string, string>();

/** Read a cached image URL for a given key. Returns null on miss or expiry. */
export async function getCachedImageUrl(key: string): Promise<string | null> {
  const mem = memCache.get(key);
  if (mem) return mem;

  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > TTL_MS) {
      await AsyncStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    memCache.set(key, entry.url);
    return entry.url;
  } catch {
    return null;
  }
}

/** Store an image URL in the cache. */
export async function setCachedImageUrl(key: string, url: string): Promise<void> {
  memCache.set(key, url);
  try {
    const entry: CacheEntry = { url, cachedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Cache write failure is non-critical
  }
}

/**
 * Get or set: returns cached URL if available, otherwise calls `fetch`,
 * stores the result, and returns it.
 */
export async function getOrFetchImageUrl(
  key: string,
  fetch: () => Promise<string | null>,
): Promise<string | null> {
  const cached = await getCachedImageUrl(key);
  if (cached) return cached;

  const url = await fetch();
  if (url) await setCachedImageUrl(key, url);
  return url;
}

/**
 * Optimise an Unsplash URL with standard ROAM params.
 * Adds w, q, fm=webp if not already set. No-ops on non-Unsplash URLs.
 */
export function optimizeUrl(url: string, w = 800): string {
  if (!url.includes('images.unsplash.com')) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('w')) u.searchParams.set('w', String(w));
    if (!u.searchParams.has('q')) u.searchParams.set('q', '85');
    if (!u.searchParams.has('fm')) u.searchParams.set('fm', 'webp');
    return u.toString();
  } catch {
    return url;
  }
}

/** Clear the in-memory cache (e.g. on logout or low-memory warning). */
export function clearMemCache(): void {
  memCache.clear();
}
