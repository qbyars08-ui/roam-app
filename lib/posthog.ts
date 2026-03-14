// =============================================================================
// ROAM — PostHog Product Analytics
// Centralized wrapper. All PostHog calls go through this module.
// Key is read from EXPO_PUBLIC_POSTHOG_KEY; when absent, all calls no-op.
// =============================================================================

import PostHog from 'posthog-react-native';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let client: PostHog | null = null;

export async function initPostHog(): Promise<PostHog | null> {
  if (client) return client;
  if (!POSTHOG_API_KEY) {
    if (__DEV__) console.warn('[PostHog] EXPO_PUBLIC_POSTHOG_KEY not set — disabled');
    return null;
  }
  try {
    client = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      enableSessionReplay: false,
    });
    return client;
  } catch {
    if (__DEV__) console.warn('[PostHog] init failed');
    return null;
  }
}

export function getPostHogClient(): PostHog | undefined {
  return client ?? undefined;
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export function identifyUser(
  userId: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  if (!client || !userId) return;
  client.identify(userId, properties);
}

export function resetIdentity(): void {
  client?.reset();
}

// ---------------------------------------------------------------------------
// Capture — fire a named event
// ---------------------------------------------------------------------------

export function captureEvent(
  event: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  client?.capture(event, properties);
}

// ---------------------------------------------------------------------------
// Screen tracking
// ---------------------------------------------------------------------------

export function captureScreen(
  name: string,
  properties?: Record<string, string | number | boolean | null>,
): void {
  client?.screen(name, properties);
}
