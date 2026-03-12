// =============================================================================
// ROAM — Hero photos for destinations (cinematic, magazine-ready)
// Uses master photo library — never black, never placeholder
// =============================================================================

import { getDestinationPhoto } from './photos';

/**
 * Get high-quality hero photo for itinerary, share cards, etc.
 * Returns w=1200 for crisp display. Fallback always a real travel photo.
 */
export function getHeroPhotoUrl(destination: string): string {
  const base = getDestinationPhoto(destination);
  return base.replace('w=800', 'w=1200').replace('q=85', 'q=90') || base;
}
