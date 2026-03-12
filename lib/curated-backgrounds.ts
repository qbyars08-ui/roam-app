// =============================================================================
// ROAM — Curated cinematic daily backgrounds (Unsplash photo IDs)
// =============================================================================
import type { UnsplashPhotoRef } from './unsplash';

function sourceUrl(id: string, w = 1800, h = 2400): string {
  return `https://source.unsplash.com/${id}/${w}x${h}`;
}

/**
 * Curated, breathtaking travel photography for the Discover background.
 * Rotates daily (by day-of-year) so the app feels alive.
 */
export const CURATED_DAILY_BACKGROUNDS: UnsplashPhotoRef[] = [
  { id: '1p7Q3QqfQ6Q', fallbackUrl: sourceUrl('1p7Q3QqfQ6Q') },
  { id: 'DwxlhTvC16Q', fallbackUrl: sourceUrl('DwxlhTvC16Q') },
  { id: 'hD6C2pA5K8I', fallbackUrl: sourceUrl('hD6C2pA5K8I') },
  { id: '8manzosDSGM', fallbackUrl: sourceUrl('8manzosDSGM') },
  { id: 'eOpewngf68w', fallbackUrl: sourceUrl('eOpewngf68w') },
  { id: 'dRr5s4Y0nCw', fallbackUrl: sourceUrl('dRr5s4Y0nCw') },
  { id: 'vUNQaTtZeOo', fallbackUrl: sourceUrl('vUNQaTtZeOo') },
  { id: 'D6Tu_L3chLE', fallbackUrl: sourceUrl('D6Tu_L3chLE') },
  { id: 'd0B0o7t5ZgE', fallbackUrl: sourceUrl('d0B0o7t5ZgE') },
  { id: '7G8mV7dVnNQ', fallbackUrl: sourceUrl('7G8mV7dVnNQ') },
  { id: 'oMpAz-DN-9I', fallbackUrl: sourceUrl('oMpAz-DN-9I') },
  { id: 'u4m5VfV0c1w', fallbackUrl: sourceUrl('u4m5VfV0c1w') },
  { id: 'k0rVudBoB4c', fallbackUrl: sourceUrl('k0rVudBoB4c') },
  { id: 'pHANr-CpbYM', fallbackUrl: sourceUrl('pHANr-CpbYM') },
  { id: 'yQorCngxzwI', fallbackUrl: sourceUrl('yQorCngxzwI') },
];

