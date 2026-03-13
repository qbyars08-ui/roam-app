# ROAM — PostHog Analytics Spec

**Status:** Implemented
**Agent:** 04 BUILDER
**Priority:** P3
**Date:** 2026-03-13

---

## Overview

PostHog analytics layer for ROAM. Tracks core user behavior to measure retention, conversion, and feature adoption. All events route through a thin `lib/analytics.ts` wrapper so the PostHog SDK never leaks into feature code.

## Architecture

```
lib/analytics.ts          ← centralized SDK wrapper (init, track, identify, screen)
    ↓
posthog-react-native      ← PostHog React Native SDK
    ↓
PostHog cloud (us.i.posthog.com)
```

### Configuration

| Env Var | Purpose |
|---------|---------|
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog project API key |
| `EXPO_PUBLIC_POSTHOG_HOST` | PostHog ingest host (default: `https://us.i.posthog.com`) |

When `EXPO_PUBLIC_POSTHOG_KEY` is not set, all tracking calls are no-ops. Zero runtime cost in dev unless configured.

### Provider

`PostHogProvider` wraps the app in `app/_layout.tsx`, inside `ErrorBoundary` and around `GestureHandlerRootView`. Autocapture is disabled — all events are explicit.

### Identity

- `identifyUser(userId, traits)` called after session bootstrap in `app/_layout.tsx`
- `resetUser()` called on sign-out to clear anonymous ID linkage
- Guest users (`guest-*` IDs) are identified but flagged with `isGuest: true` in future iterations

---

## Tracked Events

### 1. `trip_generated`

Fires when a trip is successfully generated and added to the store.

| Property | Type | Example |
|----------|------|---------|
| `destination` | string | `"Tokyo"` |
| `days` | number | `5` |
| `budget` | string | `"comfort"` |
| `vibes` | string[] | `["local-eats", "hidden-gems"]` |
| `mode` | string | `"quick"` or `"conversation"` |

**Files:** `app/(tabs)/generate.tsx` — both `handleQuickSubmit` and `handleConversationGenerate`

### 2. `trip_viewed`

Fires when a user views an itinerary (own trip or shared trip).

| Property | Type | Example |
|----------|------|---------|
| `tripId` | string | `"gen-1710345600"` |
| `destination` | string | `"Lisbon"` |
| `isShared` | boolean | `true` |

**Files:** `app/itinerary.tsx` — trip resolve `useEffect`

### 3. `flight_search`

Fires when a flight search completes.

| Property | Type | Example |
|----------|------|---------|
| `from` | string | `"JFK"` |
| `to` | string | `"NRT"` |
| `resultCount` | number | `8` |

**Files:** `app/(tabs)/flights.tsx` — `handleSearch`

### 4. `booking_link_clicked`

Fires when a user taps any affiliate/booking link.

| Property | Type | Example |
|----------|------|---------|
| `partner` | string | `"booking"` |
| `destination` | string | `"Bali"` |
| `placement` | string | `"itinerary_card"` |
| `url` | string | full affiliate URL |

**Files:**
- `lib/booking-links.ts` — `openBookingLink()`
- `lib/affiliates.ts` — `openAffiliateLink()`

### 5. `paywall_shown`

Fires when the paywall screen mounts.

| Property | Type | Example |
|----------|------|---------|
| `reason` | string? | `"limit"` |
| `destination` | string? | `"Tokyo"` |

**Files:** `app/paywall.tsx` — `useEffect` on mount

### 6. `subscription_started`

Fires when a purchase succeeds.

| Property | Type | Example |
|----------|------|---------|
| `tier` | string | `"pro"` or `"global"` |
| `source` | string | `"paywall"` |

**Files:** `app/paywall.tsx` — inside `handlePurchase` success block

---

## Screen Tracking

Every tab screen fires a `$screen` event via `trackScreen()` on focus.

| Screen | Tab | File |
|--------|-----|------|
| `Discover` | index | `app/(tabs)/index.tsx` |
| `Generate` | generate | `app/(tabs)/generate.tsx` |
| `Flights` | flights | `app/(tabs)/flights.tsx` |
| `Stays` | stays | `app/(tabs)/stays.tsx` |
| `Food` | food | `app/(tabs)/food.tsx` |
| `Prep` | prep | `app/(tabs)/prep.tsx` |

Screen tracking uses `useFocusEffect` from `@react-navigation/native` to fire on every tab focus, not just initial mount.

---

## Files Modified

| File | Change |
|------|--------|
| `lib/analytics.ts` | **New** — PostHog wrapper (init, track, identify, screen, typed event helpers) |
| `app/_layout.tsx` | PostHogProvider, initAnalytics, identifyUser, resetUser |
| `app/(tabs)/generate.tsx` | `trackTripGenerated` in both generate flows |
| `app/itinerary.tsx` | `trackTripViewed` on trip resolve |
| `app/(tabs)/flights.tsx` | `trackFlightSearch` after search completes |
| `lib/booking-links.ts` | `trackBookingLinkClicked` in `openBookingLink` |
| `lib/affiliates.ts` | `trackBookingLinkClicked` in `openAffiliateLink` |
| `app/paywall.tsx` | `trackPaywallShown` on mount, `trackSubscriptionStarted` on purchase |
| `app/(tabs)/index.tsx` | `trackScreen('Discover')` on focus |
| `app/(tabs)/stays.tsx` | `trackScreen('Stays')` on focus |
| `app/(tabs)/food.tsx` | `trackScreen('Food')` on focus |
| `app/(tabs)/prep.tsx` | `trackScreen('Prep')` on focus |
| `package.json` | Added `posthog-react-native` |

---

## Future Enhancements

- Add `$feature_flag` evaluation for A/B testing via PostHog feature flags
- Track `chat_message_sent` in the Chat tab
- Track `dream_saved` in Dream Vault
- Add revenue tracking by passing price data in `subscription_started`
- Session replay on web builds
- Group analytics for group trips
