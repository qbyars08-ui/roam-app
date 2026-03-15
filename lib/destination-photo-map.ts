// =============================================================================
// ROAM — Destination photo map (hardcoded Unsplash IDs + working fallback URLs)
// source.unsplash.com was deprecated in 2021 and died in 2024 — use images.unsplash.com
// =============================================================================
import type { UnsplashPhotoRef } from './unsplash';

/** Convert an Unsplash photo ID to a direct, reliable CDN URL */
function unsplashUrl(id: string, w = 1600, q = 85): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=${q}&fm=webp&fit=crop`;
}

/**
 * Map of destination label → best photo for that city.
 * Requirements:
 * - Always return a real photo (never null/placeholder).
 * - Use Unsplash photo IDs (curated).
 * - Fallback URL must work even if API is unavailable.
 */
export const DESTINATION_PHOTO_MAP: Record<string, UnsplashPhotoRef> = {
  Tokyo: { id: 'h2v6ZV4C8pU', fallbackUrl: unsplashUrl('h2v6ZV4C8pU') },
  Bali: { id: 'gREquCUXQLI', fallbackUrl: unsplashUrl('gREquCUXQLI') },
  Bangkok: { id: 'jFCViYFYcus', fallbackUrl: unsplashUrl('jFCViYFYcus') },
  Lisbon: { id: 'mOEqOtmuPG8', fallbackUrl: unsplashUrl('mOEqOtmuPG8') },
  Paris: { id: 'Q0-fOL2nqZc', fallbackUrl: unsplashUrl('Q0-fOL2nqZc') },
  Barcelona: { id: 'hTVR5TzvxSY', fallbackUrl: unsplashUrl('hTVR5TzvxSY') },
  Rome: { id: 'c46mCqZp4js', fallbackUrl: unsplashUrl('c46mCqZp4js') },
  Amsterdam: { id: 'L8-0sa5qZfU', fallbackUrl: unsplashUrl('L8-0sa5qZfU') },
  Prague: { id: 'fJpG5ZV8OQw', fallbackUrl: unsplashUrl('fJpG5ZV8OQw') },
  Budapest: { id: 'eOcyhe5-9sQ', fallbackUrl: unsplashUrl('eOcyhe5-9sQ') },
  Vienna: { id: '2fYbV6QyF0Y', fallbackUrl: unsplashUrl('2fYbV6QyF0Y') },
  Berlin: { id: 'QG4I2yVtYxE', fallbackUrl: unsplashUrl('QG4I2yVtYxE') },
  Sydney: { id: 'Yh2Y8avvPec', fallbackUrl: unsplashUrl('Yh2Y8avvPec') },
  'New York': { id: 'y0_vFxOHayg', fallbackUrl: unsplashUrl('y0_vFxOHayg') },
  'Mexico City': { id: 'jV1E1B0nQmI', fallbackUrl: unsplashUrl('jV1E1B0nQmI') },
  Medellín: { id: 'VtVw8EoLJ1Y', fallbackUrl: unsplashUrl('VtVw8EoLJ1Y') },
  Tbilisi: { id: 'xVptEzXvO3A', fallbackUrl: unsplashUrl('xVptEzXvO3A') },
  'Chiang Mai': { id: '9GdI1YxgWgk', fallbackUrl: unsplashUrl('9GdI1YxgWgk') },
  Porto: { id: '6VhPY27jdps', fallbackUrl: unsplashUrl('6VhPY27jdps') },
  Kyoto: { id: 'pFI2ZVnJv9Q', fallbackUrl: unsplashUrl('pFI2ZVnJv9Q') },
  Seoul: { id: 'sYffw0LNr7s', fallbackUrl: unsplashUrl('sYffw0LNr7s') },
  Singapore: { id: 'V7B4Q-4yY8w', fallbackUrl: unsplashUrl('V7B4Q-4yY8w') },
  Dubai: { id: 'n0bS1uQxG9Q', fallbackUrl: unsplashUrl('n0bS1uQxG9Q') },
  Istanbul: { id: 'Kk8mEQAoIpI', fallbackUrl: unsplashUrl('Kk8mEQAoIpI') },
  Cairo: { id: 'f0aV4VbqK5I', fallbackUrl: unsplashUrl('f0aV4VbqK5I') },
  'Cape Town': { id: 'X7j8P9yJ2bE', fallbackUrl: unsplashUrl('X7j8P9yJ2bE') },
  Marrakech: { id: 'WcV2ZJ4w8yM', fallbackUrl: unsplashUrl('WcV2ZJ4w8yM') },
  'Buenos Aires': { id: 'uYfF3sHn2sE', fallbackUrl: unsplashUrl('uYfF3sHn2sE') },
  Havana: { id: 'tOYiQxF9-Ys', fallbackUrl: unsplashUrl('tOYiQxF9-Ys') },
  Reykjavik: { id: '1Q8k0pVhBqk', fallbackUrl: unsplashUrl('1Q8k0pVhBqk') },
};

/** A gorgeous, always-valid photo used if a destination isn't mapped yet. */
export const GENERIC_TRAVEL_FALLBACK: UnsplashPhotoRef = {
  id: 'eOpewngf68w',
  fallbackUrl: unsplashUrl('eOpewngf68w'),
};
