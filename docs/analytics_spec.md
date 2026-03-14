# ROAM Analytics Spec — PostHog Migration

> Single source of truth for event taxonomy, funnels, user properties, and migration plan.
> Code references: `lib/posthog-events.ts`, `lib/posthog-funnels.ts`

---

## 1. Event Taxonomy

Every event uses lowercase `snake_case`. No prefix — PostHog groups by project.

### 1.1 Session & Navigation

| Event | Properties | Trigger |
|-------|-----------|---------|
| `session_start` | — | App launched / foregrounded |
| `session_end` | `duration_seconds` | App backgrounded / closed |
| `app_opened` | — | Every app open (incl. re-engagement) |
| `screen_view` | `screen`, `reason?` | Screen mounted |

### 1.2 Onboarding

| Event | Properties | Trigger |
|-------|-----------|---------|
| `onboarding_started` | — | Splash/hook screen rendered |
| `onboarding_destination_selected` | `destination`, `method` (manual / surprise_me) | Destination picker |
| `onboarding_signup_method` | `provider` (apple / google / email / guest) | Signup button tap |
| `onboarding_skipped` | `step` | "View my trip first" |
| `onboarding_completed` | `variant?` | Onboarding flow finished |
| `travel_profile_completed` | — | Profile questionnaire done |

### 1.3 Auth

| Event | Properties | Trigger |
|-------|-----------|---------|
| `auth_sign_up` | `provider` | Account created |
| `auth_sign_in` | `provider` | Returning user logged in |
| `auth_sign_out` | — | User signed out |
| `guest_mode_entered` | — | Anonymous browse mode |
| `guest_converted` | `provider` | Guest created a real account |

### 1.4 Trip Lifecycle

| Event | Properties | Trigger |
|-------|-----------|---------|
| `trip_created` | `trip_id`, `destination`, `days`, `budget`, `vibes`, `source` | Trip added to list |
| `trip_generated` | `destination`, `days`, `mode`, `budget` | AI generation completed |
| `trip_deleted` | `trip_id`, `destination` | Trip removed |
| `trip_updated` | `trip_id`, `fields[]` | Trip metadata edited |
| `trip_limit_reached` | `trips_this_month` | Free cap hit |
| `generate_mode_selected` | `mode` (quick / conversation) | Mode picker |

### 1.5 Itinerary Engagement

| Event | Properties | Trigger |
|-------|-----------|---------|
| `itinerary_viewed` | `trip_id`, `destination`, `days` | Itinerary screen opened |
| `itinerary_saved` | `trip_id`, `destination` | Itinerary kept |
| `itinerary_abandoned` | `trip_id`, `destination` | Itinerary discarded |
| `itinerary_saved_offline` | `trip_id` | Offline cache written |
| `activity_edited` | `trip_id`, `day`, `slot` | Activity edit modal saved |
| `calendar_exported` | `trip_id`, `destination` | Calendar export tapped |

### 1.6 Weather & Prep

| Event | Properties | Trigger |
|-------|-----------|---------|
| `weather_check` | `destination` | Forecast loaded |
| `packing_list_generated` | `destination` | AI packing list built |

### 1.7 Flights

| Event | Properties | Trigger |
|-------|-----------|---------|
| `flight_search` | `from`, `to`, `results` | Search performed |
| `flight_card_clicked` | `partner`, `destination`, `placement` | Flight deal tapped |

### 1.8 Voice Guide

| Event | Properties | Trigger |
|-------|-----------|---------|
| `voice_guide_played` | `destination`, `day?` | Voice narration started |

### 1.9 Sharing & Social

| Event | Properties | Trigger |
|-------|-----------|---------|
| `share_card_generated` | `destination`, `platform` | Share poster created |
| `trip_shared` | `trip_id`, `destination`, `method` | Native share / link |
| `share_link_copied` | `trip_id` | Link copied |
| `trip_stolen` | `trip_id`, `destination` | Recipient added shared trip |

### 1.10 Group Trips

| Event | Properties | Trigger |
|-------|-----------|---------|
| `group_trip_created` | `group_id`, `destination` | Group created |
| `group_joined` | `group_id`, `invite_code` | User joined via invite |
| `group_invite_shared` | `group_id`, `invite_code` | Invite link shared |
| `expense_added` | `group_id`, `amount`, `category` | Expense logged |
| `group_vote_cast` | `group_id`, `day`, `slot`, `vote` | Itinerary vote |
| `group_message_sent` | `group_id` | Chat message sent |

### 1.11 Monetization

| Event | Properties | Trigger |
|-------|-----------|---------|
| `paywall_viewed` | `reason`, `destination?` | Paywall screen mounted |
| `paywall_dismissed` | `reason` | Paywall closed without purchase |
| `purchase_started` | `tier`, `price?` | Purchase initiated |
| `purchase_success` | `tier`, `product_id?` | Purchase completed |
| `purchase_cancelled` | `tier` | User cancelled IAP |
| `restore_started` | — | Restore tapped |
| `restore_success` | — | Active sub found |
| `restore_failed` | — | Nothing found |
| `pro_gate_shown` | `feature` | Pro-gated feature hit |

### 1.12 Affiliates & Booking

| Event | Properties | Trigger |
|-------|-----------|---------|
| `affiliate_click` | `partner`, `destination`, `placement`, `url` | Booking link tapped |

### 1.13 Referrals

| Event | Properties | Trigger |
|-------|-----------|---------|
| `referral_link_shared` | `referral_code` | Referral link shared |
| `referral_link_copied` | `referral_code` | Referral link copied |
| `referral_credited` | `referral_code`, `referee_id` | Referee signed up (server) |

### 1.14 Growth & Milestones

| Event | Properties | Trigger |
|-------|-----------|---------|
| `milestone_shown` | `milestone`, `cta` | Milestone card displayed |
| `milestone_cta_tapped` | `milestone`, `cta` | CTA tapped |
| `milestone_dismissed` | `milestone` | Card dismissed |

### 1.15 Notifications

| Event | Properties | Trigger |
|-------|-----------|---------|
| `notification_permission_requested` | — | Permission dialog shown |
| `notification_permission_granted` | — | Permission granted |
| `push_received` | `type` | Push notification delivered |

### 1.16 NPS & Ratings

| Event | Properties | Trigger |
|-------|-----------|---------|
| `nps_shown` | `trip_count` | NPS survey displayed |
| `nps_submitted` | `score`, `routed_to` | NPS score submitted |
| `nps_dismissed` | — | NPS prompt dismissed |
| `rating_prompt_shown` | — | App Store rating dialog |
| `rating_prompt_accepted` | — | User tapped "Rate ROAM" |

### 1.17 Bookmarks

| Event | Properties | Trigger |
|-------|-----------|---------|
| `restaurant_bookmarked` | `restaurant_id`, `destination` | Bookmark added |
| `restaurant_unbookmarked` | `restaurant_id` | Bookmark removed |

### 1.18 Errors

| Event | Properties | Trigger |
|-------|-----------|---------|
| `error` | `error_type`, `screen`, `message` | Client error captured |

### 1.19 Waitlist

| Event | Properties | Trigger |
|-------|-----------|---------|
| `waitlist_joined` | `email`, `destination?` | User submitted waitlist |

---

## 2. User Properties (PostHog Person Properties)

Set via `posthog.identify()` or `$set` / `$set_once`.

| Property | Type | Set When | Update Cadence |
|----------|------|----------|----------------|
| `user_id` | string | Auth | Once |
| `email` | string | Signup | Once |
| `subscription_tier` | `'free' \| 'pro' \| 'global'` | Auth / purchase | On change |
| `is_pro` | boolean | Auth / purchase | On change |
| `trips_generated_total` | number | Trip created | Increment |
| `trips_this_month` | number | Trip created / monthly reset | On change |
| `onboarding_variant` | string | A/B assignment | Once |
| `onboarding_completed` | boolean | Onboarding end | Once |
| `has_travel_profile` | boolean | Profile completion | Once |
| `signup_provider` | `'apple' \| 'google' \| 'email'` | Signup | Once |
| `first_trip_date` | ISO string | First trip | Once |
| `current_streak` | number | Session start | On change |
| `engagement_score` | number (0-100) | Session start | On change |
| `home_currency` | string | Settings | On change |
| `platform` | `'ios' \| 'android' \| 'web'` | Session start | Once |
| `app_version` | string | Session start | On change |
| `referral_code` | string | Signup | Once |
| `referred_by` | string | Signup via referral | Once |
| `countries_visited` | number | Trip created | Increment |
| `is_guest` | boolean | Guest mode entered | On change |

---

## 3. Funnel Definitions

All funnels are defined in `lib/posthog-funnels.ts` and map directly to PostHog Funnels.

### 3.1 Onboarding Funnel

```
onboarding_started
  → onboarding_destination_selected
    → screen_view (signup)
      → auth_sign_up
        → trip_generated
          → itinerary_viewed
```

**Window:** 7 days | **Goal:** 60%+ completion to `trip_generated`

### 3.2 Free → Pro Conversion

```
trip_limit_reached
  → paywall_viewed
    → purchase_started
      → purchase_success
```

**Window:** 30 days | **Goal:** 5-8% paywall→purchase | **Segment by:** `reason`

### 3.3 Paywall Micro-Funnel

```
paywall_viewed → purchase_started → purchase_success
```

**Window:** 1 hour | **Goal:** Optimize tier selection, CTA copy, pricing

### 3.4 Day 1 Retention

```
session_start (D0) → session_start (D1)
```

**Window:** 2 days | **Goal:** 40%+ D1 retention

### 3.5 Week 1 Activation

```
session_start → trip_generated → itinerary_viewed → share_card_generated
```

**Window:** 7 days | **Goal:** 30%+ reach share step

### 3.6 Trip Repeat (1st → 2nd)

```
trip_created (1st) → trip_created (2nd)
```

**Window:** 30 days | **Goal:** 25%+ repeat rate

### 3.7 Share Feature Adoption

```
itinerary_viewed → share_card_generated → trip_stolen
```

**Window:** 14 days | **Goal:** Track virality coefficient

### 3.8 Group Trip Adoption

```
group_trip_created → group_invite_shared → group_joined → group_vote_cast → expense_added
```

**Window:** 30 days | **Goal:** 50%+ invite→join

### 3.9 Flight Search → Affiliate Click

```
screen_view (flights) → flight_search → affiliate_click (skyscanner)
```

**Window:** 1 day | **Goal:** Maximize affiliate revenue per search

### 3.10 Voice Guide Adoption

```
itinerary_viewed → voice_guide_played
```

**Window:** 1 day | **Goal:** Track voice feature stickiness

### 3.11 Referral Loop

```
milestone_cta_tapped (refer) → referral_link_shared → referral_credited
```

**Window:** 30 days | **Goal:** Track viral k-factor

---

## 4. Key Dashboards to Build

| Dashboard | Metrics | Primary Funnel |
|-----------|---------|----------------|
| **Growth Overview** | DAU/WAU/MAU, sessions, new users, D1/D7/D30 retention | Onboarding, D1 Retention |
| **Trip Analytics** | Trips/day, top destinations, generate mode split, repeat rate | Trip Repeat |
| **Monetization** | MRR, conversion rate, paywall views, RPU, LTV | Free→Pro, Paywall Micro |
| **Feature Adoption** | Feature use counts, share rate, voice guide %, group usage | All adoption funnels |
| **Affiliate Revenue** | Clicks by partner, CTR by placement, revenue estimate | Flight Booking |
| **Engagement** | Streak distribution, engagement score histogram, NPS | Week 1 Activation |

---

## 5. Migration Plan

### Phase 1: SDK Install + Dual-Write (Week 1)

1. Install `posthog-react-native` SDK.
2. Initialize PostHog in `app/_layout.tsx` alongside existing Supabase analytics.
3. Create `lib/posthog.ts` wrapper that calls both `trackEvent()` (Supabase) and `posthog.capture()`.
4. Implement `posthog.identify()` on auth state change with user properties from Section 2.
5. Wire `$screen` autocapture via PostHog's React Navigation integration or manual `screen_view`.

### Phase 2: Event Instrumentation (Week 2)

6. Replace all `trackEvent()` / `track()` call sites to use the typed `EVENTS` object from `lib/posthog-events.ts`.
7. Add missing events (Section 1 events not yet tracked — see "gaps" column in exploration).
8. Ensure every event carries the properties listed in the taxonomy.
9. Validate events in PostHog Live Events view.

### Phase 3: Funnels & Dashboards (Week 3)

10. Create PostHog funnels matching the definitions in `lib/posthog-funnels.ts`.
11. Build the 6 dashboards from Section 4.
12. Set up PostHog Cohorts for: `free_users`, `pro_users`, `guest_users`, `high_engagement`, `churn_risk`.
13. Configure PostHog Actions for key composite events (e.g., "activated user" = trip_generated + itinerary_viewed within 7 days).

### Phase 4: Remove Supabase Analytics (Week 4)

14. Verify PostHog data completeness by comparing Supabase `analytics_events` counts with PostHog for 7 days.
15. Remove dual-write: stop inserting into `analytics_events` table.
16. Update admin dashboard (`app/admin.tsx`) to read from PostHog API instead of Supabase.
17. Keep `affiliate_clicks` and `error_logs` tables (separate concern, not analytics).
18. Archive `analytics_events` table (don't drop — keep historical data).

### Phase 5: Advanced (Week 5+)

19. Enable PostHog Session Recording for web.
20. Set up PostHog Feature Flags to replace `lib/ab-test.ts`.
21. Configure PostHog Experiments for paywall A/B tests.
22. Set up PostHog Surveys to replace NPS via `lib/nps.ts`.
23. Build retention cohort analysis (D1/D7/D30) using PostHog Lifecycle.

---

## 6. Naming Conventions

| Rule | Example |
|------|---------|
| All lowercase snake_case | `trip_created`, not `TripCreated` |
| Noun first for entities | `trip_created`, `group_joined` |
| Past tense for completed actions | `purchase_success`, not `purchase` |
| No prefix — project-scoped in PostHog | `trip_created`, not `roam_trip_created` |
| Boolean props: `is_*` | `is_pro`, `is_guest` |
| Counts: `*_total` or `*_count` | `trips_generated_total` |
| IDs: `*_id` | `trip_id`, `group_id` |

---

## 7. Privacy & Compliance

- PostHog is self-hostable; can run EU instance for GDPR.
- No PII in event properties (no email in events; only in person properties via `$set`).
- Respect opt-out: check PostHog's `opt_out_capturing()` before sending.
- Guest users get anonymous `distinct_id`; merge on signup via `posthog.alias()`.
- Exclude internal/test users via PostHog person property `is_internal: true`.
