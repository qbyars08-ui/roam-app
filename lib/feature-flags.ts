// =============================================================================
// ROAM — Feature Flags
// v1.0 App Store: only core features are unlocked
// Web: everything is unlocked (tryroam.netlify.app stays full-featured)
// =============================================================================
import { Platform } from 'react-native';

/**
 * v1.0 core routes — these are always accessible on all platforms.
 * Everything NOT in this set gets a "Coming Soon" gate on native builds.
 */
const V1_CORE_ROUTES = new Set([
  // Auth flow
  'splash', 'hook', 'signin', 'signup', 'welcome', 'onboard', 'onboarding',
  'social-proof', 'value-preview', 'personalization',
  // Main tabs
  'index', 'plan', 'saved', 'profile', 'chat', 'prep', 'flights', 'generate', 'people',
  // Trip flow
  'itinerary',
  // Essential screens
  'paywall', 'privacy', 'terms', 'support', 'referral',
  // Dynamic routes
  'trip/[id]', 'destination/[name]', 'traveler/[id]', 'chat/[channelId]',
  // Social
  'social-profile-edit',
  // Viral & shareable experiences
  'passport', 'trip-wrapped', 'viral-cards', 'trip-story', 'trip-album', 'trip-countdown', 'expense-tracker', 'compatibility', 'travel-card', 'trip-journal', 'body-intel', 'before-you-land', 'emergency-card', 'layover',
  // Pet travel
  'pets',
  // Newly unlocked features
  'alter-ego', 'globe', 'dream-vault', 'arrival-mode', 'dupe-finder', 'anti-itinerary',
  'chaos-dare', 'language-survival', 'chaos-mode', 'budget-guardian',
  'honest-reviews', 'visited-map', 'airport-guide', 'memory-lane',
]);

/**
 * Returns true if a route should show the "Coming Soon" gate.
 * Web is always full-featured. Native gates non-core routes.
 */
export function isComingSoon(routeName: string): boolean {
  // Web: everything unlocked
  if (Platform.OS === 'web') return false;

  // Native: gate non-core routes
  return !V1_CORE_ROUTES.has(routeName);
}

/**
 * Returns true if we're in v1.0 stripped mode (native only).
 */
export function isV1Mode(): boolean {
  return Platform.OS !== 'web';
}
