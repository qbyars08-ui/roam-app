// =============================================================================
// ROAM — Unsplash helpers (client-side, with graceful fallbacks)
// NOTE: source.unsplash.com is DEAD (deprecated 2021, broke mid-2024).
// Always use images.unsplash.com/photo-{id} URLs.
// =============================================================================
type UnsplashPhoto = {
  id: string;
  urls?: { raw?: string; full?: string; regular?: string; small?: string };
};

const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY ?? '';

export type UnsplashPhotoRef = {
  /** Unsplash photo ID (not a slug). */
  id: string;
  /**
   * A reliable CDN URL for this photo.
   * Use images.unsplash.com/photo-{id}?w=800&q=85&fm=webp — NOT source.unsplash.com (dead).
   */
  fallbackUrl: string;
};

export async function fetchUnsplashPhotoUrl(
  photoId: string
): Promise<string | null> {
  if (!ACCESS_KEY) return null;
  try {
    const res = await fetch(`https://api.unsplash.com/photos/${photoId}`, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as UnsplashPhoto;
    return (
      data.urls?.regular ??
      data.urls?.full ??
      data.urls?.raw ??
      data.urls?.small ??
      null
    );
  } catch {
    return null;
  }
}

const urlCache = new Map<string, string>();
const CACHE_MAX = 64;

export async function resolveUnsplashPhoto(
  ref: UnsplashPhotoRef
): Promise<string> {
  const cached = urlCache.get(ref.id);
  if (cached) return cached;
  const apiUrl = await fetchUnsplashPhotoUrl(ref.id);
  const result = apiUrl ?? ref.fallbackUrl;
  if (urlCache.size >= CACHE_MAX) {
    const first = urlCache.keys().next().value;
    if (first) urlCache.delete(first);
  }
  urlCache.set(ref.id, result);
  return result;
}

/** Append optimal cache/quality params to images.unsplash.com URLs */
export function optimizeUnsplashUrl(url: string, w = 800): string {
  if (!url.includes('images.unsplash.com')) return url;
  const u = new URL(url);
  u.searchParams.set('w', String(w));
  if (!u.searchParams.has('q')) u.searchParams.set('q', '85');
  if (!u.searchParams.has('fm')) u.searchParams.set('fm', 'webp');
  return u.toString();
}

/**
 * Proxy an existing image URL through Cloudinary's CDN for global edge caching,
 * WebP conversion, and reliability insulation from Unsplash.
 *
 * Setup: add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME to your .env file.
 * Free tier: 25 GB bandwidth/month (~312K image serves at 80KB).
 *
 * If cloud name is not set, returns the original URL unchanged (graceful fallback).
 */
export function cloudinaryFetch(sourceUrl: string, w = 800): string {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || !sourceUrl) return sourceUrl;
  const params = `f_auto,q_auto,w_${w}`;
  return `https://res.cloudinary.com/${cloud}/image/fetch/${params}/${encodeURIComponent(sourceUrl)}`;
}

/**
 * Single entry point for all destination image URLs.
 *
 * Decision tree:
 * 1. EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME set → serve via Cloudinary CDN
 *    (200+ edge PoPs, WebP auto-conversion, 25GB free/month)
 * 2. Otherwise → serve directly from images.unsplash.com with optimal params
 *    (still works, no control over edge locations)
 *
 * Never use source.unsplash.com — it died mid-2024.
 */
export function getOptimizedImageUrl(url: string, w = 800): string {
  if (!url) return url;
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloud && url.includes('images.unsplash.com')) {
    return cloudinaryFetch(url, w);
  }
  return optimizeUnsplashUrl(url, w);
}
