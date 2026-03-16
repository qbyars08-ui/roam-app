# Bugs Found — ROAM

---

## OPEN BUGS

### BUG-01: P2 — CSP Blocks Live Widget APIs for Destination Intelligence Dashboard

- **Severity:** P2 — Feature degraded (widgets show empty data)
- **Found:** 2026-03-16 (Sprint 4 smoke test)
- **Status:** FIXED IN THIS PR (netlify.toml updated)
- **File:** `netlify.toml` — Content-Security-Policy header
- **Repro:** Navigate to any destination detail screen (e.g., /destination/Tokyo) → weather, golden hour, air quality, local time all show empty/loading
- **Root cause:** New destination intelligence widgets use APIs not in the CSP `connect-src`:
  - `worldtimeapi.org`, `api.sunrise-sunset.org`, `api.open-meteo.com`, `date.nager.at`, `emergencynumberapi.com`, `restcountries.com`, `www.travel-advisory.info`
- **Fix:** Added all 10 missing domains to `netlify.toml` Content-Security-Policy

### BUG-02: P3 — `enrich-venues` Edge Function CORS Error

- **Severity:** P3 — Secondary feature degraded (venue hours/ratings not enriched)
- **Found:** 2026-03-16 (Sprint 4 smoke test)
- **Status:** OPEN
- **Repro:** Generate any trip → open itinerary → venue enrichment fails in console
- **Error:** `FunctionsFetchError: Failed to send a request to the Edge Function` for `enrich-venues`
- **Impact:** Trip itineraries show without venue hours/ratings enrichment. Core trip data (activities, hotels, restaurants) still shows correctly.
- **Fix:** Verify CORS configuration in `supabase/functions/enrich-venues/index.ts`, ensure `Access-Control-Allow-Origin: https://tryroam.netlify.app` is set

### BUG-03: P3 — Travel Advisory API CORS Blocked (Third-Party Constraint)

- **Severity:** P3 — Non-critical (Prep tab shows fallback data)
- **Found:** 2026-03-16
- **Status:** OPEN — no fix possible on ROAM side
- **Error:** `Access to fetch at cadataapi.state.gov from origin 'https://tryroam.netlify.app' has been blocked by CORS policy`
- **Impact:** Travel safety advisories in Prep tab may show fallback/cached data
- **Fix:** Use a proxy (Supabase edge function to fetch travel advisories server-side, then pass to client)

---

## FIXED BUGS (This Run)

### BUG-04: P1 — Missing `/destination/[name]` Route in Router Types

- **Severity:** P1 — TypeScript error, deployment would warn
- **Found & Fixed:** 2026-03-16 (Sprint 4)
- **File:** `.expo/types/router.d.ts` (auto-generated, gitignored)
- **Error:** `app/(tabs)/index.tsx(290,19): error TS2345: Argument of type '/destination/${string}' is not assignable...`
- **Fix:** Added `/destination/[name]` route to `.expo/types/router.d.ts`

---

## PREVIOUSLY FIXED BUGS

| Bug | Sprint | Notes |
|---|---|---|
| P0: Netlify deployment using placeholder.supabase.co | Sprint 3→4 | Real Supabase URL now confirmed in prod |
| P2: Duplicate German (`de`) in SUPPORTED_LANGUAGES | Sprint 2 | Deduped |
| P2: 3 hardcoded English strings in GenerateModeSelect | Sprint 2 | i18n keys added to all 5 locales |
| P2: Plan tab missing 3 PostHog analytics events | Sprint 2 | plan_new_trip_tapped, plan_quick_action_tapped, plan_trip_card_tapped |
| P0-CRITICAL: squad_matches INSERT RLS auth bypass | Pre-Sprint 1 | Wrong column names in policy (migration fix) |
| P1: social_profiles missing input constraints | Pre-Sprint 1 | bio/display_name length limits, vibe_tags count |
| P1: Stale router.d.ts missing /(tabs)/generate | Sprint 1 | Route added |
| P3: Unused useTranslation in flights.tsx | Sprint 3 | Import removed |
| P3: Stale waitlist-guest test | Sprint 3 | Updated for resilient fallback |
| P3×9: plan.tsx/people.tsx hardcoded hex/rgba | Sprint 1 | All replaced with COLORS tokens |
| P3: referral.ts empty catch{} | Sprint 1 | ESLint no-empty fixed |
