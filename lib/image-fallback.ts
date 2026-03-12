// =============================================================================
// ROAM — Image fallback (auto-swap on load failure)
// =============================================================================

import { GENERIC_TRAVEL_FALLBACK } from './photos';

export function getImageWithFallback(url: string | null | undefined, fallback?: string): string {
  if (!url) return fallback ?? GENERIC_TRAVEL_FALLBACK;
  return url;
}
