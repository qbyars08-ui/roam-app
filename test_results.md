# Test Results — 2026-03-15 (Post-Deploy Smoke Test)

**Agent:** 01 — ROAM Tester
**Date:** 2026-03-15
**Target:** https://tryroam.netlify.app (incognito Chrome)
**Build:** Overnight quality pass (flights rework, polish, P0 fixes)

---

## Summary

| Category | Pass | Fail | Blocked |
|---|---|---|---|
| Visual / UI Rendering | 7 | 0 | 0 |
| Core Functionality | 0 | 2 | 0 |
| Code Quality | 3 | 2 | 0 |
| **TOTAL** | **10** | **4** | **0** |

**Overall status: ❌ FAIL — Trip generation and chat broken in live deployment**

---

## P0 Bugs Found

### BUG-01: Live deployment uses `placeholder.supabase.co` — ALL backend calls fail

- **Severity:** P0 — Core functionality broken
- **Repro:** Open https://tryroam.netlify.app → DevTools → Console → observe all Supabase calls
- **Expected:** Calls go to real Supabase project (e.g. `<project>.supabase.co`)
- **Actual:** All POST/GET requests hit `https://placeholder.supabase.co` → `net::ERR_NAME_NOT_RESOLVED`
- **Impact:**
  - Auth (`supabase.auth.signInAnonymously()`) fails → no JWT → no edge function calls
  - Trip generation: "Claude proxy error: Failed to send a request to the Edge Function"
  - Analytics events: all fail silently
  - Chat mode: would fail with same error (not tested, same root cause)
- **Root cause:** `EXPO_PUBLIC_SUPABASE_URL` env var not set in Netlify build environment. The fallback `'https://placeholder.supabase.co'` in `lib/supabase.ts:28` is used.
- **Evidence:** Browser console shows `POST https://placeholder.supabase.co/rest/v1/analytics_events net::ERR_NAME_NOT_RESOLVED` and `POST https://placeholder.supabase.co/functions/v1/claude-proxy net::ERR_NAME_NOT_RESOLVED`
- **Note:** Local `dist/` bundle correctly uses `<project>.supabase.co` — the issue is the **Netlify build** environment, not the code.
- **Fix:** Quinn must add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to Netlify dashboard environment variables and trigger a redeploy.

### BUG-02: Trip generation FAILS — "Claude proxy error: Failed to send a request to the Edge Function"

- **Severity:** P0 — Core feature broken
- **Repro:** Plan tab → Quick → enter "Tokyo" → click "Generate My Trip"
- **Expected:** TripGeneratingLoader → navigates to /itinerary
- **Actual:** Error banner: "Claude proxy error: Failed to send a request to the Edge Function"
- **Root cause:** Downstream of BUG-01 — `ensureValidSession()` calls `signInAnonymously()` which fails because `placeholder.supabase.co` can't be resolved.
- **Fix:** Resolve BUG-01 (set real Supabase URL in Netlify env vars)

---

## Smoke Test Results (7 Steps)

### Step 1 — App Loads: ✅ PASS
- Splash screen renders with gold logo and "Go somewhere that changes you."
- "Browse first" link accessible
- URL: `tryroam.netlify.app/splash`

### Step 2 — Discover Tab: ✅ PASS
- Destination grid renders with real Unsplash images
- 31 destinations visible (Tokyo, Paris, Bali, New York, Barcelona, Rome, etc.)
- Search bar functional
- Category filters render (Beaches, Mountains, Cities, Food, Adventure, Budget, Couples)
- Header rotating: "Tell us where. We'll tell you everything." (matches new polish pass copy)

### Step 3 — Plan Tab — Mode Select: ✅ PASS
- "No trips yet." heading with subtitle
- Quick and Chat options render with icons
- Both options tappable (verified Quick mode opens form)
- i18n fix confirmed: "No trips yet." / "Pick somewhere. 30 seconds." visible ✅

### Step 4 — Flights Tab: ✅ PASS
- **Hero search form** renders: From/To inputs, depart/return date pickers, passenger selector
- **"Search on Skyscanner"** button visible in sage green
- **Popular routes** grid: New York→London (~$425), LA→Tokyo (~$628), Chicago→Paris (~$545), Miami→Cancun (~$190)
- Each route card has photo, price estimate, and "Search" button
- Affiliate note visible: "We search Skyscanner so you get the best price, every time."

### Step 5 — People Tab: ✅ PASS
- Hero: "Travel is better together" with stats (2.4k active travelers / 47 destinations / 128 groups forming)
- Open groups section: Bali, Tokyo, Barcelona cards with member counts
- Matched travelers: Maya (94% match, Tokyo, Apr 12–19), cards with avatars
- **"Connect" button** present in sage green (haptics web-shimmed)
- Heart/save button present

### Step 6 — Prep Tab: ✅ PASS
- Safety score renders: Japan = 95/100 (green ring indicator)
- "Right now in Tokyo" shows live local time (3:51 PM)
- Daily Budget breakdown: Budget ~$35-50 / Comfort ~$80-150 / Luxury ~$250+
- Tab navigation: Schedule, Overview, Emergency, Health, Language, Visa, Currency, SIM & WiFi, Culture
- Destination selector pill row: Bali, Mexico City, Tokyo, Seoul, Lisbon, Medellín, Paris, Oaxaca, Bangkok, Kyoto, New York, Tbilisi

### Step 7 — Plan Tab Quick Mode Form: ✅ PASS (form renders) / ❌ FAIL (generation)
- Quick form fully renders: destination input, date picker, duration (3/5/7/10/14/21 days), budget tiers, who's going, vibe chips, travel pace, day start time
- "Generate My Trip" button present
- **FAIL:** Clicking Generate shows: "Claude proxy error: Failed to send a request to the Edge Function" — caused by BUG-01

### Step 8 — Chat Mode: ⚠️ UNTESTED (same root cause as BUG-02, would fail identically)

---

## Console Error Analysis

### P0 Errors (functional blockers)

| Error | Count | Cause |
|---|---|---|
| `POST placeholder.supabase.co/rest/v1/analytics_events` → `ERR_NAME_NOT_RESOLVED` | 5+ | Missing Netlify env var |
| `POST placeholder.supabase.co/auth/v1/signup` → `ERR_NAME_NOT_RESOLVED` | 1 | Missing Netlify env var |
| `POST placeholder.supabase.co/functions/v1/claude-proxy` → `ERR_NAME_NOT_RESOLVED` | 1 | Missing Netlify env var |
| `TypeError: Failed to fetch` (in signInAnonymously) | 1 | Missing Netlify env var |

### P3 Warnings (non-blocking, expected on web)

| Warning | Impact |
|---|---|
| `[expo-notifications] push token changes not yet fully supported on web` | None — web limitation |
| `Animated: useNativeDriver not supported` | None — falls back to JS animation |
| `Fetch API cannot load: CSP violation` for geocoding, weather, exchange rate APIs | Weather/rates not loaded in prep tab |

---

## Code Quality Checks (run locally)

| Check | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | ✅ PASS | 0 errors |
| `npx jest --forceExit` | ✅ PASS | 453/453 tests |
| ESLint | ✅ 0 errors | 41 warnings (pre-existing) |
| Hardcoded hex/rgba | ✅ NONE found | All new files use COLORS tokens |
| Missing i18n keys | ✅ FIXED | `generate.noTrips` + `generate.noTripsSub` + `generate.howToPlan` added |
| Stale test | ✅ FIXED | `waitlist-guest.test.ts` updated for resilient fallback |
| Unused import in flights.tsx | ✅ FIXED | `useTranslation` import removed |

---

## What Works (Visual-only, no backend needed)

- ✅ App loads and splash renders
- ✅ All 5 tabs render correctly (Plan, Discover, People, Flights, Prep)
- ✅ Flights tab: hero form + popular routes + Skyscanner affiliate links wired correctly
- ✅ People tab: traveler cards + group cards + Connect button
- ✅ Prep tab: safety score + daily budget + tab navigation + destination picker
- ✅ Discover tab: 31 destination cards with images
- ✅ Quick mode form: all fields render

## What Fails (Backend required)

- ❌ Trip generation (Quick mode): "Claude proxy error: Failed to send a request to the Edge Function"
- ❌ Chat mode: would fail with same error
- ❌ Auth (guest session creation): `signInAnonymously()` → 500
- ❌ Analytics events: all silent failures
- ❌ All Supabase DB queries

---

## Action Required

| Action | Owner | Priority |
|---|---|---|
| Add `EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co` to Netlify env vars | Quinn | P0 |
| Add `EXPO_PUBLIC_SUPABASE_ANON_KEY=<real-key>` to Netlify env vars | Quinn | P0 |
| Trigger Netlify redeploy after env vars set | Quinn | P0 |
| Re-run smoke test after redeploy to confirm generation works | Agent 01 | P0 |

---

## Local Bundle Verification

The **local dist bundle** (`dist/_expo/static/js/web/entry-*.js`) correctly contains `<project>.supabase.co` — confirming the issue is the **Netlify CI build environment**, not the codebase.

To verify: `grep -o "[a-z0-9]*.supabase.co" dist/_expo/static/js/web/entry-*.js`

---

## History

| Date | Status | Notes |
|---|---|---|
| 2026-03-15 Sprint 3 (this run) | ❌ FAIL | P0: placeholder Supabase URL in Netlify deploy |
| 2026-03-15 Sprint 2 | ✅ PASS | Post-merge regression — 3 bugs fixed |
| 2026-03-15 Sprint 1 | ✅ PASS | 5-tab regression — 9 design violations fixed |
