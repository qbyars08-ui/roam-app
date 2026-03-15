// =============================================================================
// ROAM — Curated cinematic daily backgrounds (Unsplash photo IDs)
// source.unsplash.com is dead (deprecated 2021, broke mid-2024) — use images.unsplash.com
// =============================================================================
import type { UnsplashPhotoRef } from './unsplash';

/** Convert a photo ID to a reliable Unsplash CDN URL (portrait crop for backgrounds) */
function unsplashBg(id: string, w = 1800, h = 2400): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&q=85&fm=webp&fit=crop`;
}

/**
 * Curated, breathtaking travel photography for the Discover background.
 * Rotates daily (by day-of-year) so the app feels alive.
 */
export const CURATED_DAILY_BACKGROUNDS: UnsplashPhotoRef[] = [
  { id: '1p7Q3QqfQ6Q', fallbackUrl: unsplashBg('1p7Q3QqfQ6Q') },
  { id: 'DwxlhTvC16Q', fallbackUrl: unsplashBg('DwxlhTvC16Q') },
  { id: 'hD6C2pA5K8I', fallbackUrl: unsplashBg('hD6C2pA5K8I') },
  { id: '8manzosDSGM', fallbackUrl: unsplashBg('8manzosDSGM') },
  { id: 'eOpewngf68w', fallbackUrl: unsplashBg('eOpewngf68w') },
  { id: 'dRr5s4Y0nCw', fallbackUrl: unsplashBg('dRr5s4Y0nCw') },
  { id: 'vUNQaTtZeOo', fallbackUrl: unsplashBg('vUNQaTtZeOo') },
  { id: 'D6Tu_L3chLE', fallbackUrl: unsplashBg('D6Tu_L3chLE') },
  { id: 'd0B0o7t5ZgE', fallbackUrl: unsplashBg('d0B0o7t5ZgE') },
  { id: '7G8mV7dVnNQ', fallbackUrl: unsplashBg('7G8mV7dVnNQ') },
  { id: 'oMpAz-DN-9I', fallbackUrl: unsplashBg('oMpAz-DN-9I') },
  { id: 'u4m5VfV0c1w', fallbackUrl: unsplashBg('u4m5VfV0c1w') },
  { id: 'k0rVudBoB4c', fallbackUrl: unsplashBg('k0rVudBoB4c') },
  { id: 'pHANr-CpbYM', fallbackUrl: unsplashBg('pHANr-CpbYM') },
  { id: 'yQorCngxzwI', fallbackUrl: unsplashBg('yQorCngxzwI') },
];
