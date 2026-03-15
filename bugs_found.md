# Bugs Found — ROAM

---

## BUG-01: P0 — Live Deployment Uses `placeholder.supabase.co` (All Backend Calls Fail)

- **Severity:** P0 — Core functionality blocked
- **Found:** 2026-03-15 (post-deploy smoke test)
- **Status:** OPEN — blocked on Quinn
- **Screen:** All screens (auth required for trip generation, chat, analytics)
- **Repro:**
  1. Open https://tryroam.netlify.app in Chrome incognito
  2. Open DevTools → Console tab
  3. Observe: all POST requests go to `placeholder.supabase.co`
  4. Navigate to Plan → Quick → type "Tokyo" → click "Generate My Trip"
  5. Error banner: "Claude proxy error: Failed to send a request to the Edge Function"
- **Expected:** Supabase calls go to `<project>.supabase.co`
- **Actual:** All calls go to `https://placeholder.supabase.co` → `net::ERR_NAME_NOT_RESOLVED`
- **Root cause:** `EXPO_PUBLIC_SUPABASE_URL` env var not set in Netlify build environment. Fallback placeholder URL used.
- **Local bundle:** Correctly uses `<project>.supabase.co` — code is fine, deployment is misconfigured.
- **Fix (Quinn):**
  1. Go to Netlify Dashboard → Site Settings → Environment Variables
  2. Add: `EXPO_PUBLIC_SUPABASE_URL = https://<project>.supabase.co`
  3. Add: `EXPO_PUBLIC_SUPABASE_ANON_KEY = <real anon key>`
  4. Trigger redeploy

---

## BUG-02: P0 — Trip Generation Fails ("Claude proxy error: Failed to send a request to the Edge Function")

- **Severity:** P0 — Core feature broken
- **Found:** 2026-03-15 (live smoke test)
- **Status:** OPEN — downstream of BUG-01
- **Screen:** `app/(tabs)/plan.tsx` → Quick mode
- **Repro:**
  1. Navigate to https://tryroam.netlify.app/plan
  2. Click Quick → type "Tokyo" → Generate My Trip
  3. Error: "Claude proxy error: Failed to send a request to the Edge Function"
- **Root cause:** `ensureValidSession()` calls `supabase.auth.signInAnonymously()` which fails because `placeholder.supabase.co` doesn't resolve → no JWT → edge function call fails
- **Fix:** Resolve BUG-01

---

## BUG-03: P2 — Destination Field Shows Pre-filled Text But Has Empty Form State

- **Severity:** P2 — UX confusion
- **Found:** 2026-03-15 (live smoke test)
- **Status:** OPEN
- **Screen:** `app/(tabs)/plan.tsx` → Quick mode → destination input
- **Repro:**
  1. Navigate to Plan → Quick mode (with "Tokyo" suggested from Discover tap)
  2. The input SHOWS "Tokyo, Japan" but clicking Generate shows validation error "Where are you going?"
  3. Must manually tap and re-type destination for it to register in form state
- **Expected:** Pre-filled value from navigation params is properly set as form state
- **Actual:** Visual display shows destination but the underlying TextInput value is empty
- **Note:** May be a web-specific issue with React Native controlled inputs and navigation params

---

## Previously Fixed Bugs

| Bug | Fixed | Notes |
|---|---|---|
| Duplicate `de` in `SUPPORTED_LANGUAGES` (P1) | Sprint 2 (2026-03-15) | German appeared twice in language picker |
| 3 hardcoded English strings in GenerateModeSelect (P2) | Sprint 2 (2026-03-15) | noTrips, noTripsSub, howToPlan keys added to 5 locales |
| Plan tab missing analytics events (P2) | Sprint 2 (2026-03-15) | plan_new_trip_tapped, plan_quick_action_tapped, plan_trip_card_tapped |
| squad_matches INSERT RLS auth bypass (P0-CRITICAL) | Pre-Sprint 1 migration | Wrong column names in policy |
| social_profiles missing input constraints (P1) | Pre-Sprint 1 migration | bio/display_name length, vibe_tags count |
| Stale .expo/types/router.d.ts (P1) | Sprint 1 (2026-03-15) | /(tabs)/generate missing from typed routes |
| Unused useTranslation in flights.tsx (P3) | Sprint 3 (2026-03-15) | ESLint warning fixed |
| Stale waitlist-guest test (P3) | Sprint 3 (2026-03-15) | Test updated for resilient fallback behavior |
| plan.tsx/people.tsx hardcoded hex/rgba (P3 ×9) | Sprint 1 (2026-03-15) | All replaced with COLORS tokens |
| referral.ts empty catch{} (P3) | Sprint 1 (2026-03-15) | ESLint no-empty fixed |
