# PHASE 1 AUDIT — Revenue-Critical Systems

**Date:** 2026-03-17
**Auditor:** Claude Code
**Scope:** Paywall flow, CRAFT mode default, venue enrichment

---

## 1. Paywall Flow

### What happens when a free user tries trip #2

**Pre-generation check (client-side):**
In `app/(tabs)/plan.tsx` lines 540-546, `handleQuickSubmit` checks BEFORE calling the API:

```
if (!isPro && !isGuestUser() && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
  router.push({ pathname: '/paywall', params: { reason: 'limit', destination: state.destination } });
  return;
}
```

This means: if `tripsThisMonth >= 1` (since `FREE_TRIPS_PER_MONTH = 1`), the user is immediately routed to `/paywall` with `reason=limit`. The API is never called. The same check exists for conversation mode at line 615.

**Server-side enforcement (backup):**
In `supabase/functions/claude-proxy/index.ts` lines 153-165, the edge function also enforces the limit. If `isTripGeneration && isFree && trips_generated_this_month >= 1`, it returns HTTP 429 with `code: "LIMIT_REACHED"`. The client in `lib/claude.ts` catches this and throws `TripLimitReachedError` (lines 398-399, 462-463, 544-545).

**What the user sees:**
If the client-side check catches it (the normal path), the user navigates to `app/paywall.tsx`. This is a fully built paywall screen with:
- Contextual headline referencing the destination (line 168-169): "You just planned {destination}. Unlock unlimited trips."
- Annual/Monthly billing toggle (lines 321-359)
- Live social proof counter (lines 311-319)
- Feature comparison (Free vs Pro) at lines 454-492
- Gold gradient CTA: "Start your 3-day free trial" (lines 422-448)
- RevenueCat integration: calls `purchaseGlobal()` (annual) or `purchasePro()` (monthly) from `lib/revenue-cat.ts`
- Restore purchases button (lines 494-503)
- "Maybe later" dismiss option (lines 506-508)
- Close button (X) at top-left (lines 281-289)

If the server-side check catches it (race condition / stale client state), plan.tsx catches `TripLimitReachedError` at lines 602-604 and shows a `RateLimitModal`, which has an "Upgrade" button that routes to the same paywall.

**RevenueCat integration is real and complete:**
- `lib/revenue-cat.ts` -- full purchase flow: `purchasePro()` (monthly $9.99), `purchaseGlobal()` (annual $49.99), restore, CustomerInfo listener
- `lib/revenuecat.ts` -- duplicate/earlier version with same functionality
- Product IDs: `roam_pro_monthly`, `roam_global_yearly` (revenue-cat.ts line 17-18)
- Entitlement: `pro` (line 15)
- On successful purchase: `setIsPro(true)` in Zustand + `syncProStatusToSupabase()` to update server

**Pro badge / upgrade button visibility:**
- `TripLimitBanner` component (`components/monetization/TripLimitBanner.tsx`) shows on the generate screen (plan.tsx lines 752, 774). It displays remaining trips ("1/1", "LIMIT REACHED") and an "Upgrade" link. It is hidden when user is Pro (line 68: `if (isPro) return null`).
- `ProGate` component (`components/monetization/ProGate.tsx`) wraps premium features with a lock icon + "Unlock with Pro" CTA.

**Monthly reset logic:**
In `claude-proxy/index.ts` lines 128-143:
```
const needsReset = now.getUTCFullYear() !== resetAt.getUTCFullYear() || now.getUTCMonth() !== resetAt.getUTCMonth();
```
This compares current UTC year+month against `month_reset_at`. If different, it resets `trips_generated_this_month` to 0 and updates `month_reset_at` to now. This is correct -- it resets at the start of each calendar month (UTC).

**ISSUE:** The client-side `tripsThisMonth` in Zustand (`lib/store.ts` line 59) is persisted to AsyncStorage (`TRIPS_MONTH_KEY`) but there is NO client-side monthly reset logic. If a user opens the app on a new month without making an API call, the stale count from AsyncStorage will block them client-side even though the server would allow it. The server resets the count only when a trip generation request is made. This means a free user returning in a new month might see "LIMIT REACHED" until they actually attempt a generation (which the client blocks before reaching the server).

**VERDICT:** Paywall flow is functional and well-built. One bug: stale client-side trip count on month rollover can falsely block users until they force a server round-trip.

---

## 2. CRAFT Mode Default

### What opens when user taps "Plan a new trip"

**Flow:**
1. User taps "Plan a new trip" button (plan.tsx line 893-898) which calls `handleNewTrip` (line 522-526).
2. `handleNewTrip` sets `showGenerator = true` and `generateMode = null`.
3. With `generateMode === null`, the mode selection screen renders: `GenerateModeSelect` (plan.tsx line 718).

**GenerateModeSelect (`components/generate/GenerateModeSelect.tsx`):**
This presents TWO cards side by side:
- **Quick Trip** (Zap icon) -- `mode='quick'`
- **CRAFT** (MessageCircle icon) -- `mode='conversation'`

Neither is pre-selected. The user MUST tap one to proceed. This is the mode selector and it is the first thing shown -- it is NOT buried.

**The "Quick Trip" shortcut in DREAMING state:**
In plan.tsx line 827, there is a shortcut in the DREAMING hero section:
```
onQuickTrip={() => { handleNewTrip(); setGenerateMode('quick'); }}
```
This bypasses mode selection and goes straight to Quick mode. There is also a "Plan together" button (line 828) that routes to `/craft-session` (CRAFT mode).

**What it would take to make CRAFT the default:**
Option A (simple): Change `handleNewTrip` at line 522-526 to route directly to `/craft-session` instead of showing the mode selector:
```
const handleNewTrip = useCallback(() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  router.push('/craft-session');
}, [router]);
```

Option B (keep selector but default to CRAFT): In `handleNewTrip`, set `generateMode` to `'conversation'` instead of `null`. But since `conversation` mode routes to `/craft-session` in `handleModeSelect` (line 515-516), this would skip the selector entirely.

Option C (swap visual emphasis): In `GenerateModeSelect.tsx`, make the CRAFT card visually primary (gold border, larger) and Quick secondary. Keep the selector but bias toward CRAFT.

**VERDICT:** Currently neither mode is the default -- users see a 50/50 mode picker. The DREAMING state hero has a "Quick Trip" shortcut that biases toward Quick. Making CRAFT default requires a one-line change in `handleNewTrip`.

---

## 3. Venue Enrichment After Generation

### Does enrichment run automatically? YES.

In `app/itinerary.tsx` lines 296-347, there is a `useEffect` that fires when `parsed` (the parsed itinerary) and `trip?.destination` are set. It:

1. Collects all unique activity names + accommodation names from every day/slot (lines 300-317).
2. Deduplicates by key (lines 319-325).
3. Calls BOTH enrichment functions in parallel (lines 328-331):
   - `enrichVenues()` -- calls the `enrich-venues` Supabase edge function
   - `enrichVenuesViaPlacesProxy()` -- calls Google Places API directly via `lib/apis/google-places.ts`
4. Merges results, preferring Places API data when available (lines 332-345).
5. Stores results in `venueData` state (Map of key -> EnrichedVenue).

### Do venues get real photos from Google Places? YES.

`EnrichedVenue` in `lib/venues.ts` line 21 has `photo_url: string | null`. The `enrichVenuesViaPlacesProxy` function at line 74 extracts `details.photos?.[0]` from Google Places responses. The `VenueCard` component accepts `photo_url` as a prop (line 32) and renders it as an Image.

### Do venues show ratings? YES.

`EnrichedVenue` has `rating: number | null` (line 22) and `user_ratings_total: number | null` (line 23). `VenueCard.tsx` renders star ratings at lines 161-164 using a `renderStars()` helper (lines 54-58) plus the numeric rating.

### Are venue cards tappable to Google Maps? YES.

`VenueCard.tsx` accepts `maps_url: string` (line 38). On tap, it opens the URL via `Linking.openURL(maps_url)` (line 119). The URL is constructed as either:
- `https://www.google.com/maps/dir/?api=1&destination_place_id={placeId}` (itinerary.tsx line 588) when a Place ID is available
- `https://www.google.com/maps/search/?api=1&query={name+address}` (itinerary.tsx line 658) as fallback

Hotels route to Booking.com, flights to Skyscanner (via tap target logic in VenueCard lines 72-89).

**VERDICT:** Venue enrichment is fully automatic, runs on every itinerary view, and provides real Google Places photos, ratings, and Maps deep links. No changes needed.

---

## Summary

| System | Status | Issues |
|--------|--------|--------|
| Paywall Flow | Functional | Client-side trip count not reset on month rollover; can falsely block free users |
| CRAFT Default | Neither mode is default | One-line change to make CRAFT default |
| Venue Enrichment | Fully automatic | No issues found |

### Key File Paths

- `lib/store.ts` -- Zustand store (trip count, isPro)
- `supabase/functions/claude-proxy/index.ts` -- Server-side rate limit + monthly reset
- `app/paywall.tsx` -- Full paywall screen with RevenueCat
- `lib/revenue-cat.ts` -- RevenueCat purchase flows
- `lib/revenuecat.ts` -- Duplicate RevenueCat module (should consolidate)
- `lib/pro-gate.ts` -- Feature gating + trip limit hooks
- `components/monetization/TripLimitBanner.tsx` -- Free tier banner
- `components/monetization/ProGate.tsx` -- Pro feature gate component
- `app/(tabs)/plan.tsx` -- Trip generation + mode selection
- `components/generate/GenerateModeSelect.tsx` -- Quick vs CRAFT picker
- `app/itinerary.tsx` -- Venue enrichment auto-runs here
- `lib/venues.ts` -- EnrichedVenue type + enrichment functions
- `components/features/VenueCard.tsx` -- Venue card with photos, ratings, Maps links
