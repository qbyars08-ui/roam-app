// =============================================================================
// ROAM — PostHog Funnel Definitions
// Declarative funnel specs that map directly to PostHog Funnels.
// Import these when configuring PostHog dashboards or validating
// instrumentation coverage.
// =============================================================================

import { EVENTS } from './posthog-events';

// ---------------------------------------------------------------------------
// Funnel step type
// ---------------------------------------------------------------------------

export interface FunnelStep {
  /** PostHog event name (must match EVENTS[].name) */
  event: string;
  /** Human label shown in PostHog UI */
  label: string;
  /** Optional property filter — e.g. { provider: 'apple' } */
  filter?: Record<string, unknown>;
}

export interface FunnelDefinition {
  /** Unique slug used as the PostHog saved-funnel id */
  id: string;
  /** Dashboard display name */
  name: string;
  /** Why this funnel matters */
  description: string;
  /** Ordered list of steps (PostHog evaluates in sequence) */
  steps: FunnelStep[];
  /** Max time window between first and last step */
  conversionWindow: { value: number; unit: 'day' | 'hour' | 'minute' };
}

// =============================================================================
// 1. ONBOARDING FUNNEL
//    Measures drop-off from first app open → first trip created.
// =============================================================================

export const ONBOARDING_FUNNEL: FunnelDefinition = {
  id: 'onboarding',
  name: 'Onboarding → First Trip',
  description:
    'Tracks new users from app launch through signup to their first generated trip. ' +
    'Key levers: hook screen copy, destination picker friction, signup method conversion.',
  steps: [
    { event: EVENTS.ONBOARDING_STARTED.name, label: 'Splash / hook viewed' },
    { event: EVENTS.ONBOARDING_DESTINATION_SELECTED.name, label: 'Destination picked' },
    { event: EVENTS.SCREEN_VIEW.name, label: 'Signup screen', filter: { screen: 'signup' } },
    { event: EVENTS.AUTH_SIGN_UP.name, label: 'Account created' },
    { event: EVENTS.TRIP_GENERATED.name, label: 'First trip generated' },
    { event: EVENTS.ITINERARY_VIEWED.name, label: 'Itinerary viewed' },
  ],
  conversionWindow: { value: 7, unit: 'day' },
};

// =============================================================================
// 2. CONVERSION FUNNEL (Free → Pro)
//    Measures the path from free usage to paid subscription.
// =============================================================================

export const CONVERSION_FUNNEL: FunnelDefinition = {
  id: 'free_to_pro',
  name: 'Free → Pro Conversion',
  description:
    'Tracks free users from hitting a conversion trigger (trip limit, pro gate, ' +
    'milestone) through the paywall to a successful purchase. ' +
    'Segment by trigger reason to find the highest-converting entry point.',
  steps: [
    { event: EVENTS.TRIP_LIMIT_REACHED.name, label: 'Trip limit hit / pro gate shown' },
    { event: EVENTS.PAYWALL_VIEWED.name, label: 'Paywall viewed' },
    { event: EVENTS.PURCHASE_STARTED.name, label: 'Purchase started' },
    { event: EVENTS.PURCHASE_SUCCESS.name, label: 'Purchase completed' },
  ],
  conversionWindow: { value: 30, unit: 'day' },
};

export const PAYWALL_MICRO_FUNNEL: FunnelDefinition = {
  id: 'paywall_micro',
  name: 'Paywall Micro-Funnel',
  description:
    'Zooms into the paywall screen itself. Measures tier selection, ' +
    'purchase initiation, and completion vs. dismissal.',
  steps: [
    { event: EVENTS.PAYWALL_VIEWED.name, label: 'Paywall viewed' },
    { event: EVENTS.PURCHASE_STARTED.name, label: 'Purchase tapped' },
    { event: EVENTS.PURCHASE_SUCCESS.name, label: 'Purchase success' },
  ],
  conversionWindow: { value: 1, unit: 'hour' },
};

// =============================================================================
// 3. RETENTION FUNNELS
//    Measures whether users return and build habits.
// =============================================================================

export const DAY_1_RETENTION_FUNNEL: FunnelDefinition = {
  id: 'day_1_retention',
  name: 'Day 1 Retention',
  description:
    'Did the user come back the day after their first session? ' +
    'Proxy: session_start on day 0 → session_start on day 1.',
  steps: [
    { event: EVENTS.SESSION_START.name, label: 'First session' },
    { event: EVENTS.SESSION_START.name, label: 'Return session (D1)' },
  ],
  conversionWindow: { value: 2, unit: 'day' },
};

export const WEEK_1_ACTIVATION_FUNNEL: FunnelDefinition = {
  id: 'week_1_activation',
  name: 'Week 1 Activation',
  description:
    'Tracks key activation events in the first 7 days: ' +
    'trip generated, itinerary viewed, share or affiliate click.',
  steps: [
    { event: EVENTS.SESSION_START.name, label: 'First session' },
    { event: EVENTS.TRIP_GENERATED.name, label: 'Trip generated' },
    { event: EVENTS.ITINERARY_VIEWED.name, label: 'Itinerary viewed' },
    { event: EVENTS.SHARE_CARD_GENERATED.name, label: 'Trip shared' },
  ],
  conversionWindow: { value: 7, unit: 'day' },
};

export const TRIP_REPEAT_FUNNEL: FunnelDefinition = {
  id: 'trip_repeat',
  name: 'Trip Repeat (1st → 2nd)',
  description:
    'Measures the gap between a user\'s first and second trip. ' +
    'Leading indicator for long-term retention.',
  steps: [
    { event: EVENTS.TRIP_CREATED.name, label: 'First trip created' },
    { event: EVENTS.TRIP_CREATED.name, label: 'Second trip created' },
  ],
  conversionWindow: { value: 30, unit: 'day' },
};

// =============================================================================
// 4. FEATURE ADOPTION FUNNELS
//    Measures usage depth of key product features.
// =============================================================================

export const SHARE_ADOPTION_FUNNEL: FunnelDefinition = {
  id: 'share_adoption',
  name: 'Share Feature Adoption',
  description:
    'From itinerary view to share card generation. ' +
    'Measures virality potential per trip.',
  steps: [
    { event: EVENTS.ITINERARY_VIEWED.name, label: 'Itinerary viewed' },
    { event: EVENTS.SHARE_CARD_GENERATED.name, label: 'Share card generated' },
    { event: EVENTS.TRIP_STOLEN.name, label: 'Recipient stole trip' },
  ],
  conversionWindow: { value: 14, unit: 'day' },
};

export const GROUP_TRIP_ADOPTION_FUNNEL: FunnelDefinition = {
  id: 'group_trip_adoption',
  name: 'Group Trip Adoption',
  description:
    'From group creation to active group engagement (expenses, votes, chat).',
  steps: [
    { event: EVENTS.GROUP_TRIP_CREATED.name, label: 'Group created' },
    { event: EVENTS.GROUP_INVITE_SHARED.name, label: 'Invite shared' },
    { event: EVENTS.GROUP_JOINED.name, label: 'Member joined' },
    { event: EVENTS.GROUP_VOTE_CAST.name, label: 'Vote cast' },
    { event: EVENTS.EXPENSE_ADDED.name, label: 'Expense logged' },
  ],
  conversionWindow: { value: 30, unit: 'day' },
};

export const FLIGHT_BOOKING_FUNNEL: FunnelDefinition = {
  id: 'flight_booking',
  name: 'Flight Search → Affiliate Click',
  description:
    'From flight search to clicking an affiliate booking link. ' +
    'Measures monetization potential of the flights tab.',
  steps: [
    { event: EVENTS.SCREEN_VIEW.name, label: 'Flights tab', filter: { screen: 'flights' } },
    { event: EVENTS.FLIGHT_SEARCH.name, label: 'Search performed' },
    { event: EVENTS.AFFILIATE_CLICK.name, label: 'Booking link clicked', filter: { partner: 'skyscanner' } },
  ],
  conversionWindow: { value: 1, unit: 'day' },
};

export const VOICE_GUIDE_ADOPTION_FUNNEL: FunnelDefinition = {
  id: 'voice_guide_adoption',
  name: 'Voice Guide Adoption',
  description:
    'From viewing an itinerary to playing the AI voice narration.',
  steps: [
    { event: EVENTS.ITINERARY_VIEWED.name, label: 'Itinerary viewed' },
    { event: EVENTS.VOICE_GUIDE_PLAYED.name, label: 'Voice guide played' },
  ],
  conversionWindow: { value: 1, unit: 'day' },
};

export const REFERRAL_FUNNEL: FunnelDefinition = {
  id: 'referral',
  name: 'Referral Loop',
  description:
    'From milestone / growth prompt → referral link share → new signup.',
  steps: [
    { event: EVENTS.MILESTONE_CTA_TAPPED.name, label: 'Referral CTA tapped', filter: { cta: 'refer' } },
    { event: EVENTS.REFERRAL_LINK_SHARED.name, label: 'Referral link shared' },
    { event: EVENTS.REFERRAL_CREDITED.name, label: 'Referral converted' },
  ],
  conversionWindow: { value: 30, unit: 'day' },
};

// ---------------------------------------------------------------------------
// All funnels exported as a single array for programmatic iteration
// ---------------------------------------------------------------------------

export const ALL_FUNNELS: FunnelDefinition[] = [
  ONBOARDING_FUNNEL,
  CONVERSION_FUNNEL,
  PAYWALL_MICRO_FUNNEL,
  DAY_1_RETENTION_FUNNEL,
  WEEK_1_ACTIVATION_FUNNEL,
  TRIP_REPEAT_FUNNEL,
  SHARE_ADOPTION_FUNNEL,
  GROUP_TRIP_ADOPTION_FUNNEL,
  FLIGHT_BOOKING_FUNNEL,
  VOICE_GUIDE_ADOPTION_FUNNEL,
  REFERRAL_FUNNEL,
];
