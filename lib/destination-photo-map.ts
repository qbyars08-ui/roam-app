// =============================================================================
// ROAM — Destination photo map (hardcoded Unsplash IDs + guaranteed fallbacks)
// Fallback URLs use images.unsplash.com direct CDN links (always work).
// source.unsplash.com was shut down June 2024 — never use it.
// =============================================================================
import type { UnsplashPhotoRef } from './unsplash';

/**
 * Map of destination label -> best photo for that city.
 * - `id`: Unsplash photo ID for API resolution via resolveUnsplashPhoto()
 * - `fallbackUrl`: Direct images.unsplash.com CDN URL (works without API key)
 */
export const DESTINATION_PHOTO_MAP: Record<string, UnsplashPhotoRef> = {
  Tokyo: { id: 'h2v6ZV4C8pU', fallbackUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80&fm=webp' },
  Bali: { id: 'gREquCUXQLI', fallbackUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80&fm=webp' },
  Bangkok: { id: 'jFCViYFYcus', fallbackUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&q=80&fm=webp' },
  Lisbon: { id: 'mOEqOtmuPG8', fallbackUrl: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&q=80&fm=webp' },
  Paris: { id: 'Q0-fOL2nqZc', fallbackUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80&fm=webp' },
  Barcelona: { id: 'hTVR5TzvxSY', fallbackUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=80&fm=webp' },
  Rome: { id: 'c46mCqZp4js', fallbackUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80&fm=webp' },
  Amsterdam: { id: 'L8-0sa5qZfU', fallbackUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80&fm=webp' },
  Prague: { id: 'fJpG5ZV8OQw', fallbackUrl: 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80&fm=webp' },
  Budapest: { id: 'eOcyhe5-9sQ', fallbackUrl: 'https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=1200&q=80&fm=webp' },
  Vienna: { id: '2fYbV6QyF0Y', fallbackUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&q=80&fm=webp' },
  Berlin: { id: 'QG4I2yVtYxE', fallbackUrl: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&q=80&fm=webp' },
  Sydney: { id: 'Yh2Y8avvPec', fallbackUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80&fm=webp' },
  'New York': { id: 'y0_vFxOHayg', fallbackUrl: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=1200&q=80&fm=webp' },
  'Mexico City': { id: 'jV1E1B0nQmI', fallbackUrl: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200&q=80&fm=webp' },
  Medellín: { id: 'VtVw8EoLJ1Y', fallbackUrl: 'https://images.unsplash.com/photo-1599413987323-b2b8c0d7d9c8?w=1200&q=80&fm=webp' },
  Tbilisi: { id: 'xVptEzXvO3A', fallbackUrl: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&q=80&fm=webp' },
  'Chiang Mai': { id: '9GdI1YxgWgk', fallbackUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&q=80&fm=webp' },
  Porto: { id: '6VhPY27jdps', fallbackUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=80&fm=webp' },
  Kyoto: { id: 'pFI2ZVnJv9Q', fallbackUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80&fm=webp' },
  Seoul: { id: 'sYffw0LNr7s', fallbackUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&q=80&fm=webp' },
  Singapore: { id: 'V7B4Q-4yY8w', fallbackUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80&fm=webp' },
  Dubai: { id: 'n0bS1uQxG9Q', fallbackUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&fm=webp' },
  Istanbul: { id: 'Kk8mEQAoIpI', fallbackUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80&fm=webp' },
  Cairo: { id: 'f0aV4VbqK5I', fallbackUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80&fm=webp' },
  'Cape Town': { id: 'X7j8P9yJ2bE', fallbackUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80&fm=webp' },
  Marrakech: { id: 'WcV2ZJ4w8yM', fallbackUrl: 'https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=1200&q=80&fm=webp' },
  'Buenos Aires': { id: 'uYfF3sHn2sE', fallbackUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&q=80&fm=webp' },
  Havana: { id: 'tOYiQxF9-Ys', fallbackUrl: 'https://images.unsplash.com/photo-1500759285222-a95626359a56?w=1200&q=80&fm=webp' },
  Reykjavik: { id: '1Q8k0pVhBqk', fallbackUrl: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&q=80&fm=webp' },
};

/** A gorgeous, always-valid photo used if a destination isn't mapped yet. */
export const GENERIC_TRAVEL_FALLBACK: UnsplashPhotoRef = {
  id: 'eOpewngf68w',
  fallbackUrl: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80&fm=webp',
};
