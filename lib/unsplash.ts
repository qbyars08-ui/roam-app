// =============================================================================
// ROAM — Unsplash helpers (client-side, with graceful fallbacks)
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
   * A guaranteed-working fallback image URL. Prefer using:
   * - https://source.unsplash.com/<id>/<w>x<h>
   * so it works without an API key.
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

