// =============================================================================
// ROAM — Destination photo map (hardcoded Unsplash IDs + guaranteed fallbacks)
// =============================================================================
import type { UnsplashPhotoRef } from './unsplash';

function sourceUrl(id: string, w = 1600, h = 1100): string {
  return `https://source.unsplash.com/${id}/${w}x${h}`;
}

/**
 * Map of destination label → best photo for that city.
 * Requirements:
 * - Always return a real photo (never null/placeholder).
 * - Use Unsplash photo IDs (curated).
 * - Fallback URL must work even if API is unavailable.
 */
export const DESTINATION_PHOTO_MAP: Record<string, UnsplashPhotoRef> = {
  Tokyo: { id: 'h2v6ZV4C8pU', fallbackUrl: sourceUrl('h2v6ZV4C8pU') },
  Bali: { id: 'gREquCUXQLI', fallbackUrl: sourceUrl('gREquCUXQLI') },
  Bangkok: { id: 'jFCViYFYcus', fallbackUrl: sourceUrl('jFCViYFYcus') },
  Lisbon: { id: 'mOEqOtmuPG8', fallbackUrl: sourceUrl('mOEqOtmuPG8') },
  Paris: { id: 'Q0-fOL2nqZc', fallbackUrl: sourceUrl('Q0-fOL2nqZc') },
  Barcelona: { id: 'hTVR5TzvxSY', fallbackUrl: sourceUrl('hTVR5TzvxSY') },
  Rome: { id: 'c46mCqZp4js', fallbackUrl: sourceUrl('c46mCqZp4js') },
  Amsterdam: { id: 'L8-0sa5qZfU', fallbackUrl: sourceUrl('L8-0sa5qZfU') },
  Prague: { id: 'fJpG5ZV8OQw', fallbackUrl: sourceUrl('fJpG5ZV8OQw') },
  Budapest: { id: 'eOcyhe5-9sQ', fallbackUrl: sourceUrl('eOcyhe5-9sQ') },
  Vienna: { id: '2fYbV6QyF0Y', fallbackUrl: sourceUrl('2fYbV6QyF0Y') },
  Berlin: { id: 'QG4I2yVtYxE', fallbackUrl: sourceUrl('QG4I2yVtYxE') },
  Sydney: { id: 'Yh2Y8avvPec', fallbackUrl: sourceUrl('Yh2Y8avvPec') },
  'New York': { id: 'y0_vFxOHayg', fallbackUrl: sourceUrl('y0_vFxOHayg') },
  'Mexico City': { id: 'jV1E1B0nQmI', fallbackUrl: sourceUrl('jV1E1B0nQmI') },
  Medellín: { id: 'VtVw8EoLJ1Y', fallbackUrl: sourceUrl('VtVw8EoLJ1Y') },
  Tbilisi: { id: 'xVptEzXvO3A', fallbackUrl: sourceUrl('xVptEzXvO3A') },
  'Chiang Mai': { id: '9GdI1YxgWgk', fallbackUrl: sourceUrl('9GdI1YxgWgk') },
  Porto: { id: '6VhPY27jdps', fallbackUrl: sourceUrl('6VhPY27jdps') },
  Kyoto: { id: 'pFI2ZVnJv9Q', fallbackUrl: sourceUrl('pFI2ZVnJv9Q') },
  Seoul: { id: 'sYffw0LNr7s', fallbackUrl: sourceUrl('sYffw0LNr7s') },
  Singapore: { id: 'V7B4Q-4yY8w', fallbackUrl: sourceUrl('V7B4Q-4yY8w') },
  Dubai: { id: 'n0bS1uQxG9Q', fallbackUrl: sourceUrl('n0bS1uQxG9Q') },
  Istanbul: { id: 'Kk8mEQAoIpI', fallbackUrl: sourceUrl('Kk8mEQAoIpI') },
  Cairo: { id: 'f0aV4VbqK5I', fallbackUrl: sourceUrl('f0aV4VbqK5I') },
  'Cape Town': { id: 'X7j8P9yJ2bE', fallbackUrl: sourceUrl('X7j8P9yJ2bE') },
  Marrakech: { id: 'WcV2ZJ4w8yM', fallbackUrl: sourceUrl('WcV2ZJ4w8yM') },
  'Buenos Aires': { id: 'uYfF3sHn2sE', fallbackUrl: sourceUrl('uYfF3sHn2sE') },
  Havana: { id: 'tOYiQxF9-Ys', fallbackUrl: sourceUrl('tOYiQxF9-Ys') },
  Reykjavik: { id: '1Q8k0pVhBqk', fallbackUrl: sourceUrl('1Q8k0pVhBqk') },
};

/** A gorgeous, always-valid photo used if a destination isn't mapped yet. */
export const GENERIC_TRAVEL_FALLBACK: UnsplashPhotoRef = {
  id: 'eOpewngf68w',
  fallbackUrl: sourceUrl('eOpewngf68w'),
};

