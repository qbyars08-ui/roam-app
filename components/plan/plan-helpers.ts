// =============================================================================
// ROAM — Plan tab shared helpers and constants
// =============================================================================
import { DESTINATIONS, type Destination } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Destination images for trip cards
// ---------------------------------------------------------------------------
export const DEST_IMAGES: Record<string, string> = {
  Tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  Bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  Lisbon: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  Barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  Paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  London: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  Bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
  'Mexico City': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&q=80',
  Kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  Marrakech: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&q=80',
  Budapest: 'https://images.unsplash.com/photo-1549285509-8fe27c27302b?w=600&q=80',
};

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80';

// ---------------------------------------------------------------------------
// Destination lookup for trending/timing badges
// ---------------------------------------------------------------------------
const DEST_LOOKUP = new Map(DESTINATIONS.map((d) => [d.label.toLowerCase(), d]));

export function getDestinationMeta(name: string): Destination | undefined {
  return DEST_LOOKUP.get(name.toLowerCase());
}

export function isPerfectTiming(bestMonths: number[]): boolean {
  const currentMonth = new Date().getMonth() + 1;
  return bestMonths.includes(currentMonth);
}
