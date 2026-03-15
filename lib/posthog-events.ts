// =============================================================================
// ROAM — PostHog Event Taxonomy (typed event definitions)
// Single source of truth for every trackable user action.
// Import EVENTS from here whenever firing a PostHog event.
// =============================================================================

// ---------------------------------------------------------------------------
// Property interfaces — keep payloads typed at the call site
// ---------------------------------------------------------------------------

export interface DestinationProps {
  destination: string;
}

export interface TripProps {
  trip_id: string;
  destination: string;
  days: number;
  budget: string;
}

export interface ScreenProps {
  screen: string;
}

export interface AffiliateProps {
  partner: string;
  destination: string;
  placement: string;
}

export interface GroupProps {
  group_id: string;
}

// ---------------------------------------------------------------------------
// Event definition helper
// ---------------------------------------------------------------------------

interface EventDef<P = Record<string, never>> {
  /** PostHog event name — lowercase snake_case, no prefix */
  name: string;
  /** Human-readable description for docs / PostHog annotations */
  description: string;
  /** Expected property shape (compile-time only) */
  _phantom?: P;
}

function def<P = Record<string, never>>(
  name: string,
  description: string,
): EventDef<P> {
  return { name, description };
}

// ---------------------------------------------------------------------------
// EVENTS — the canonical typed registry
// ---------------------------------------------------------------------------

export const EVENTS = {

  // =========================================================================
  // Session
  // =========================================================================
  SESSION_START: def(
    'session_start',
    'App launched or foregrounded with a valid session',
  ),
  SESSION_END: def<{ duration_seconds: number }>(
    'session_end',
    'App backgrounded or closed',
  ),
  APP_OPENED: def(
    'app_opened',
    'App opened (includes re-engagement returns)',
  ),

  // =========================================================================
  // Screen views
  // =========================================================================
  SCREEN_VIEW: def<ScreenProps & { reason?: string }>(
    'screen_view',
    'User navigated to a screen',
  ),

  // =========================================================================
  // Onboarding
  // =========================================================================
  ONBOARDING_STARTED: def(
    'onboarding_started',
    'User reached the splash/hook screen',
  ),
  ONBOARDING_DESTINATION_SELECTED: def<DestinationProps & { method: 'manual' | 'surprise_me' }>(
    'onboarding_destination_selected',
    'User picked or randomized a destination during onboarding',
  ),
  ONBOARDING_SIGNUP_METHOD: def<{ provider: 'apple' | 'google' | 'email' | 'guest' }>(
    'onboarding_signup_method',
    'User tapped a sign-up option',
  ),
  ONBOARDING_SKIPPED: def<{ step: number }>(
    'onboarding_skipped',
    'User tapped "view my trip first" / skipped signup',
  ),
  ONBOARDING_COMPLETED: def<{ variant?: string }>(
    'onboarding_completed',
    'User finished the full onboarding flow',
  ),
  TRAVEL_PROFILE_COMPLETED: def(
    'travel_profile_completed',
    'User completed the travel profile questionnaire',
  ),

  // =========================================================================
  // Auth
  // =========================================================================
  AUTH_SIGN_UP: def<{ provider: 'apple' | 'google' | 'email' }>(
    'auth_sign_up',
    'Account created successfully',
  ),
  AUTH_SIGN_IN: def<{ provider: 'apple' | 'google' | 'email' }>(
    'auth_sign_in',
    'Existing user signed in',
  ),
  AUTH_SIGN_OUT: def(
    'auth_sign_out',
    'User signed out',
  ),
  GUEST_MODE_ENTERED: def(
    'guest_mode_entered',
    'User entered guest / anonymous browse mode',
  ),
  GUEST_CONVERTED: def<{ provider: 'apple' | 'google' | 'email' }>(
    'guest_converted',
    'Guest user created a real account',
  ),

  // =========================================================================
  // Trip lifecycle
  // =========================================================================
  TRIP_CREATED: def<TripProps & { vibes: string[]; source: string }>(
    'trip_created',
    'New trip added to the user\'s list (any source)',
  ),
  TRIP_GENERATED: def<DestinationProps & { days: number; mode: 'quick' | 'conversation'; budget: string }>(
    'trip_generated',
    'AI itinerary generation completed',
  ),
  TRIP_DELETED: def<{ trip_id: string; destination: string }>(
    'trip_deleted',
    'User removed a trip',
  ),
  TRIP_UPDATED: def<{ trip_id: string; fields: string[] }>(
    'trip_updated',
    'User edited trip metadata or itinerary',
  ),
  TRIP_LIMIT_REACHED: def<{ trips_this_month: number }>(
    'trip_limit_reached',
    'Free user hit monthly trip cap',
  ),
  GENERATE_MODE_SELECTED: def<{ mode: 'quick' | 'conversation' }>(
    'generate_mode_selected',
    'User picked quick or conversation generation mode',
  ),

  // =========================================================================
  // Itinerary engagement
  // =========================================================================
  ITINERARY_VIEWED: def<{ trip_id: string; destination: string; days: number }>(
    'itinerary_viewed',
    'User opened an itinerary screen',
  ),
  ITINERARY_SAVED: def<{ trip_id: string; destination: string }>(
    'itinerary_saved',
    'User kept the generated itinerary',
  ),
  ITINERARY_ABANDONED: def<{ trip_id: string; destination: string }>(
    'itinerary_abandoned',
    'User discarded the generated itinerary',
  ),
  ITINERARY_SAVED_OFFLINE: def<{ trip_id: string }>(
    'itinerary_saved_offline',
    'Itinerary persisted for offline access',
  ),
  ACTIVITY_EDITED: def<{ trip_id: string; day: number; slot: string }>(
    'activity_edited',
    'User edited an activity within an itinerary day',
  ),
  CALENDAR_EXPORTED: def<{ trip_id: string; destination: string }>(
    'calendar_exported',
    'User exported itinerary to device calendar',
  ),

  // =========================================================================
  // Weather & Prep
  // =========================================================================
  WEATHER_CHECK: def<DestinationProps>(
    'weather_check',
    'Weather forecast loaded for a destination',
  ),
  PACKING_LIST_GENERATED: def<DestinationProps>(
    'packing_list_generated',
    'AI packing list generated from itinerary + weather',
  ),

  // =========================================================================
  // Flights
  // =========================================================================
  FLIGHT_SEARCH: def<{ from: string; to: string; results: number }>(
    'flight_search',
    'User searched for flights',
  ),
  FLIGHT_CARD_CLICKED: def<AffiliateProps>(
    'flight_card_clicked',
    'User tapped a flight deal / booking card',
  ),

  // =========================================================================
  // Voice guide
  // =========================================================================
  VOICE_GUIDE_PLAYED: def<DestinationProps & { day?: number }>(
    'voice_guide_played',
    'User started AI voice narration for a day',
  ),

  // =========================================================================
  // Sharing & social
  // =========================================================================
  SHARE_CARD_GENERATED: def<DestinationProps & { platform: 'web' | 'native' }>(
    'share_card_generated',
    'User generated and shared a trip poster card',
  ),
  TRIP_SHARED: def<{ trip_id: string; destination: string; method: string }>(
    'trip_shared',
    'User shared a trip via native share sheet or link',
  ),
  SHARE_LINK_COPIED: def<{ trip_id: string }>(
    'share_link_copied',
    'User copied a shareable trip link',
  ),
  TRIP_STOLEN: def<{ trip_id: string; destination: string }>(
    'trip_stolen',
    'User "stole" a shared trip into their own list',
  ),

  // =========================================================================
  // Group trips
  // =========================================================================
  GROUP_TRIP_CREATED: def<GroupProps & DestinationProps>(
    'group_trip_created',
    'User created a group trip',
  ),
  GROUP_JOINED: def<GroupProps & { invite_code: string }>(
    'group_joined',
    'User joined a group trip via invite',
  ),
  GROUP_INVITE_SHARED: def<GroupProps & { invite_code: string }>(
    'group_invite_shared',
    'User shared a group invite link',
  ),
  EXPENSE_ADDED: def<GroupProps & { amount: number; category: string }>(
    'expense_added',
    'User added an expense to a group trip',
  ),
  GROUP_VOTE_CAST: def<GroupProps & { day: number; slot: string; vote: string }>(
    'group_vote_cast',
    'User voted on a group itinerary option',
  ),
  GROUP_MESSAGE_SENT: def<GroupProps>(
    'group_message_sent',
    'User sent a message in group chat',
  ),

  // =========================================================================
  // Monetization
  // =========================================================================
  PAYWALL_VIEWED: def<{ reason: string; destination?: string }>(
    'paywall_viewed',
    'User saw the paywall screen',
  ),
  PAYWALL_DISMISSED: def<{ reason: string | null; billing_cycle_seen: 'annual' | 'monthly' }>(
    'paywall_dismissed',
    'User closed paywall without purchasing (X button or Maybe Later)',
  ),
  PURCHASE_STARTED: def<{ tier: 'pro' | 'global'; price?: string }>(
    'purchase_started',
    'User initiated an in-app purchase',
  ),
  PURCHASE_SUCCESS: def<{ tier: 'pro' | 'global'; product_id?: string }>(
    'purchase_success',
    'In-app purchase completed',
  ),
  PURCHASE_CANCELLED: def<{ tier: 'pro' | 'global' }>(
    'purchase_cancelled',
    'User cancelled during purchase flow',
  ),
  RESTORE_STARTED: def(
    'restore_started',
    'User tapped Restore Purchases',
  ),
  RESTORE_SUCCESS: def(
    'restore_success',
    'Restore purchases found an active subscription',
  ),
  RESTORE_FAILED: def(
    'restore_failed',
    'Restore purchases found nothing',
  ),
  PRO_GATE_SHOWN: def<{ feature: string }>(
    'pro_gate_shown',
    'User hit a pro-gated feature lock',
  ),

  // =========================================================================
  // Affiliates & booking
  // =========================================================================
  AFFILIATE_CLICK: def<AffiliateProps & { url: string }>(
    'affiliate_click',
    'User clicked an affiliate booking link',
  ),

  // =========================================================================
  // Referrals
  // =========================================================================
  REFERRAL_LINK_SHARED: def<{ referral_code: string }>(
    'referral_link_shared',
    'User shared their referral link',
  ),
  REFERRAL_LINK_COPIED: def<{ referral_code: string }>(
    'referral_link_copied',
    'User copied their referral link',
  ),
  REFERRAL_CREDITED: def<{ referral_code: string; referee_id: string }>(
    'referral_credited',
    'Referral resulted in a new signup (server-side)',
  ),

  // =========================================================================
  // Growth milestones
  // =========================================================================
  MILESTONE_SHOWN: def<{ milestone: string; cta: string }>(
    'milestone_shown',
    'A growth milestone celebration was displayed',
  ),
  MILESTONE_CTA_TAPPED: def<{ milestone: string; cta: string }>(
    'milestone_cta_tapped',
    'User tapped the CTA on a milestone card',
  ),
  MILESTONE_DISMISSED: def<{ milestone: string }>(
    'milestone_dismissed',
    'User dismissed a milestone card',
  ),

  // =========================================================================
  // Notifications
  // =========================================================================
  NOTIFICATION_PERMISSION_REQUESTED: def(
    'notification_permission_requested',
    'App requested push notification permission',
  ),
  NOTIFICATION_PERMISSION_GRANTED: def(
    'notification_permission_granted',
    'User granted push notification permission',
  ),
  PUSH_RECEIVED: def<{ type: string }>(
    'push_received',
    'User received a push notification',
  ),

  // =========================================================================
  // NPS & ratings
  // =========================================================================
  NPS_SHOWN: def<{ trip_count: number }>(
    'nps_shown',
    'NPS survey was displayed',
  ),
  NPS_SUBMITTED: def<{ score: number; routed_to: string }>(
    'nps_submitted',
    'User submitted an NPS score',
  ),
  NPS_DISMISSED: def(
    'nps_dismissed',
    'User dismissed the NPS prompt',
  ),
  RATING_PROMPT_SHOWN: def(
    'rating_prompt_shown',
    'App Store rating prompt was shown',
  ),
  RATING_PROMPT_ACCEPTED: def(
    'rating_prompt_accepted',
    'User tapped "Rate ROAM"',
  ),

  // =========================================================================
  // Bookmarks
  // =========================================================================
  RESTAURANT_BOOKMARKED: def<{ restaurant_id: string; destination: string }>(
    'restaurant_bookmarked',
    'User bookmarked a restaurant',
  ),
  RESTAURANT_UNBOOKMARKED: def<{ restaurant_id: string }>(
    'restaurant_unbookmarked',
    'User removed a restaurant bookmark',
  ),

  // =========================================================================
  // Errors
  // =========================================================================
  ERROR: def<{ error_type: string; screen: string; message: string }>(
    'error',
    'Client-side error captured by error tracking',
  ),

  // =========================================================================
  // Waitlist
  // =========================================================================
  WAITLIST_JOINED: def<{ email: string; destination?: string }>(
    'waitlist_joined',
    'User joined the waitlist',
  ),

  // =========================================================================
  // Plan tab engagement
  // =========================================================================
  PLAN_NEW_TRIP_TAPPED: def<{ trips_existing: number }>(
    'plan_new_trip_tapped',
    'User tapped "Plan a new trip" button on the Plan tab',
  ),
  PLAN_QUICK_ACTION_TAPPED: def<{ action: 'hotels' | 'food' | 'flights' }>(
    'plan_quick_action_tapped',
    'User tapped a quick action card on the Plan tab (Find stays / Find food / Book flights)',
  ),
  PLAN_TRIP_CARD_TAPPED: def<{ trip_id: string; destination: string; days: number }>(
    'plan_trip_card_tapped',
    'User tapped a trip card to open the itinerary from the Plan tab',
  ),

  // =========================================================================
  // People tab engagement
  // =========================================================================
  PEOPLE_TRAVELER_VIEWED: def<{ traveler_id: string; destination: string; match_score: number }>(
    'people_traveler_viewed',
    'User tapped a traveler card to view their profile',
  ),
  PEOPLE_CONNECT_TAPPED: def<{ traveler_id: string; destination: string; match_score: number }>(
    'people_connect_tapped',
    'User tapped "Connect" on a traveler card',
  ),
  PEOPLE_TRAVELER_SAVED: def<{ traveler_id: string; destination: string }>(
    'people_traveler_saved',
    'User tapped the heart/save button on a traveler card',
  ),
  PEOPLE_GROUP_TAPPED: def<{ group_id: string; destination: string; member_count: number }>(
    'people_group_tapped',
    'User tapped a group trip card',
  ),
  PEOPLE_SETUP_PROFILE_TAPPED: def<{ source: string }>(
    'people_setup_profile_tapped',
    'User tapped "Set up profile" CTA on the People tab',
  ),

  // =========================================================================
  // Tab navigation
  // =========================================================================
  TAB_SWITCHED: def<{ from_tab: string; to_tab: string; time_spent_ms: number }>(
    'tab_switched',
    'User switched from one tab to another; carries time spent on the previous tab',
  ),

  // =========================================================================
  // Paywall funnel (conversion-critical missing events)
  // =========================================================================
  PAYWALL_BILLING_CYCLE_TOGGLED: def<{ cycle: 'annual' | 'monthly'; reason: string | null }>(
    'paywall_billing_cycle_toggled',
    'User toggled between annual and monthly billing on the paywall',
  ),
  PAYWALL_PURCHASE_INITIATED: def<{ billing_cycle: 'annual' | 'monthly'; reason: string | null }>(
    'paywall_purchase_initiated',
    'User tapped the primary purchase CTA on the paywall (fires before RevenueCat purchase begins)',
  ),
  PAYWALL_RESTORE_TAPPED: def<{ reason: string | null }>(
    'paywall_restore_tapped',
    'User tapped Restore Purchases on the paywall',
  ),

  // =========================================================================
  // Plan tab — social proof nudge banner and rate limit modal
  // =========================================================================
  PLAN_PEOPLE_NUDGE_TAPPED: def<{ destination: string }>(
    'plan_people_nudge_tapped',
    'User tapped the People social proof nudge banner on the Plan tab',
  ),
  PLAN_PEOPLE_NUDGE_DISMISSED: def<{ destination: string }>(
    'plan_people_nudge_dismissed',
    'User dismissed the People social proof nudge banner on the Plan tab',
  ),
  PLAN_RATE_LIMIT_UPGRADE_TAPPED: def<{ destination: string }>(
    'plan_rate_limit_upgrade_tapped',
    'User tapped "See Pro Plans" inside the rate-limit modal on the Plan tab',
  ),
  PLAN_RATE_LIMIT_DISMISSED: def<{ destination: string }>(
    'plan_rate_limit_dismissed',
    'User dismissed the rate-limit modal on the Plan tab without upgrading',
  ),

  // =========================================================================
  // Trip Chemistry feature
  // =========================================================================
  TRIP_CHEMISTRY_VIEWED: def(
    'trip_chemistry_viewed',
    'User opened the Trip Chemistry screen (after Pro gate passes)',
  ),
  TRIP_CHEMISTRY_COMPANION_ADDED: def<{ total_travelers: number }>(
    'trip_chemistry_companion_added',
    'User added a travel companion in Trip Chemistry',
  ),
  TRIP_CHEMISTRY_CALCULATED: def<{ traveler_count: number; overall_score: number; chemistry_label: string }>(
    'trip_chemistry_calculated',
    'User triggered the Trip Chemistry calculation and received a result',
  ),
  TRIP_CHEMISTRY_SHARED: def<{ overall_score: number; chemistry_label: string; traveler_count: number }>(
    'trip_chemistry_shared',
    'User shared Trip Chemistry results',
  ),
  TRIP_CHEMISTRY_RESET: def<{ had_result: boolean }>(
    'trip_chemistry_reset',
    'User reset the Trip Chemistry form',
  ),

  // =========================================================================
  // Travel Twin feature
  // =========================================================================
  TRAVEL_TWIN_VIEWED: def<{ archetype_name: string }>(
    'travel_twin_viewed',
    'User viewed their Travel Twin archetype reveal screen',
  ),
  TRAVEL_TWIN_DESTINATION_TAPPED: def<{ destination: string; archetype_name: string }>(
    'travel_twin_destination_tapped',
    'User tapped a recommended destination pill on the Travel Twin screen',
  ),
  TRAVEL_TWIN_SHARED: def<{ archetype_name: string }>(
    'travel_twin_shared',
    'User shared their Travel Twin result to clipboard',
  ),
  TRAVEL_TWIN_RETAKE_TAPPED: def<{ archetype_name: string }>(
    'travel_twin_retake_tapped',
    'User tapped "Retake Profile" on the Travel Twin screen',
  ),
  TRAVEL_TWIN_BUILD_PROFILE_TAPPED: def(
    'travel_twin_build_profile_tapped',
    'User tapped "Build Your Profile" on the Travel Twin empty state',
  ),
} as const;

// ---------------------------------------------------------------------------
// Type helper — extract the event name union
// ---------------------------------------------------------------------------
export type PostHogEventName = (typeof EVENTS)[keyof typeof EVENTS]['name'];
