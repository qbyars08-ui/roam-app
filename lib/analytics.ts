// =============================================================================
// ROAM — PostHog Analytics
// Centralized analytics layer. All tracking calls go through this module.
// PostHog API key is read from EXPO_PUBLIC_POSTHOG_KEY at init time.
// Safe on web + native: PostHog React Native SDK handles both platforms.
// =============================================================================

import PostHog from 'posthog-react-native';

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

let posthog: PostHog | null = null;

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// ---------------------------------------------------------------------------
// Init — call once at app startup (idempotent)
// ---------------------------------------------------------------------------

export async function initAnalytics(): Promise<PostHog | null> {
  if (posthog) return posthog;
  if (!POSTHOG_API_KEY) {
    if (__DEV__) console.warn('[Analytics] EXPO_PUBLIC_POSTHOG_KEY not set — analytics disabled');
    return null;
  }

  try {
    posthog = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      enableSessionReplay: false,
    });
    return posthog;
  } catch {
    if (__DEV__) console.warn('[Analytics] PostHog init failed');
    return null;
  }
}

/** Expose instance for PostHogProvider (read-only). */
export function getPostHogClient(): PostHog | null {
  return posthog;
}

// ---------------------------------------------------------------------------
// Property type alias — matches PostHog's JsonType-based properties
// ---------------------------------------------------------------------------

type Props = Record<string, string | number | boolean | null>;

// ---------------------------------------------------------------------------
// Identify — link anonymous ID to a real user
// ---------------------------------------------------------------------------

export function identifyUser(
  userId: string,
  traits?: Props,
): void {
  if (!posthog || !userId) return;
  posthog.identify(userId, traits);
}

export function resetUser(): void {
  posthog?.reset();
}

// ---------------------------------------------------------------------------
// Track — fire a named event with optional properties
// ---------------------------------------------------------------------------

export function track(
  event: string,
  properties?: Props,
): void {
  posthog?.capture(event, properties);
}

// ---------------------------------------------------------------------------
// Screen — record a screen view
// ---------------------------------------------------------------------------

export function trackScreen(
  screenName: string,
  properties?: Props,
): void {
  posthog?.screen(screenName, properties);
}

// ---------------------------------------------------------------------------
// Pre-defined events — typed helpers for every instrumented event
// ---------------------------------------------------------------------------

export function trackTripGenerated(props: {
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  mode: 'quick' | 'conversation';
}): void {
  track('trip_generated', {
    destination: props.destination,
    days: props.days,
    budget: props.budget,
    vibes: props.vibes.join(', '),
    vibes_count: props.vibes.length,
    mode: props.mode,
  });
}

export function trackTripViewed(props: {
  tripId: string;
  destination: string;
  isShared: boolean;
}): void {
  track('trip_viewed', props);
}

export function trackFlightSearch(props: {
  from: string;
  to: string;
  resultCount: number;
}): void {
  track('flight_search', props);
}

export function trackBookingLinkClicked(props: {
  partner: string;
  destination: string;
  placement: string;
  url: string;
}): void {
  track('booking_link_clicked', props);
}

export function trackPaywallShown(props?: {
  reason?: string;
  destination?: string;
}): void {
  const clean: Props = {};
  if (props?.reason) clean.reason = props.reason;
  if (props?.destination) clean.destination = props.destination;
  track('paywall_shown', clean);
}

export function trackSubscriptionStarted(props: {
  tier: string;
  source: string;
}): void {
  track('subscription_started', props);
}
