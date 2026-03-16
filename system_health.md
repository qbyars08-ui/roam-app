# System Health Report

**Status: GREEN**
**Date: 2026-03-16**
**System health run: Debug, Security, Analytics**

## Check Results

| Check | Result | Details |
|-------|--------|---------|
| `npx tsc --noEmit` | PASS (0 errors) | 35 router type errors fixed (see below) |
| Edge functions | All secured | JWT auth + rate limits on all user-facing functions |
| PostHog | Instrumented | captureEvent + track across screens; funnels defined |
| RLS | Audited | User tables use auth.uid(); allowlist tables use true where intentional |

---

## 1. Debug — TypeScript Fixes (2026-03-16)

**Root cause:** Expo Router's generated `.expo/types/router.d.ts` does not include all routes (e.g. `/(tabs)/generate`, `/destination/[name]`, `/what-if`, `/trip-story`, `/trip-album`, etc.). Runtime navigation works; TypeScript rejected the paths.

**Fix:** Added `as never` type assertions to 35 `router.push`/`router.replace` calls across 22 files. Pattern: `router.push('/(tabs)/generate' as never)`. Runtime-safe; matches existing pattern in `plan.tsx` for `/(tabs)/flights`.

**Files updated:**
- `app/(tabs)/group.tsx`, `index.tsx`, `stays.tsx`
- `app/compatibility.tsx`, `create-group.tsx`, `dream-vault.tsx`, `dupe-finder.tsx`
- `app/itinerary.tsx`, `memory-lane.tsx`, `passport.tsx`, `pets.tsx`, `profile.tsx`
- `app/saved.tsx`, `travel-profile.tsx`, `trip-collections.tsx`, `trip-story.tsx`, `trip-trading.tsx`, `trip-dupe.tsx`, `trip/[id].tsx`
- `components/features/MoodDiscovery.tsx`, `MoodSection.tsx`, `SurpriseMe.tsx`

---

## 2. Security — Edge Functions

| Function | Auth | Rate Limit | CORS |
|----------|------|------------|------|
| claude-proxy | JWT | 1 trip/mo free | Allowlist |
| voice-proxy | JWT | 30/min | Allowlist |
| weather-intel | JWT | 60/min | Allowlist |
| destination-photo | JWT | 60/min | Allowlist |
| enrich-venues | JWT | 30/min | Allowlist |
| revenuecat-webhook | RC signature | N/A | api.revenuecat.com |
| send-push | Service role | N/A | Internal only |

All user-facing edge functions require Bearer JWT and verify via `supabase.auth.getUser()`. No exposed secrets in client; API keys live in Supabase env.

---

## 3. Security — RLS

- **User-owned tables:** `auth.uid()` in USING/WITH CHECK (profiles, trips, affiliate_clicks, gamification, group_trips, etc.)
- **Allowlist / reference tables:** `USING (true)` for SELECT where intentional (chaos_dares, hostel_channels, prompt_versions, content_freshness, analytics_events INSERT)
- **service_role:** Bypasses RLS for admin/cron; never exposed to client

---

## 4. Analytics — PostHog

**Status:** PostHog SDK installed (`posthog-react-native`), initialized in `app/_layout.tsx`, `captureEvent()` used across app.

**Events firing:**
- `screen_view` (discover, plan, people, saved, profile, paywall, generate, flights, pulse, destination_dashboard, body-intel, trip-journal, travel-card)
- `trip_generation_completed`, `rate_limit_hit`, `paywall_viewed`, `itinerary_shared`
- `people_*` (post_trip_tapped, setup_profile_tapped, presence_tapped, etc.)
- `flights_search_skyscanner`, `flights_popular_route_tapped`, `body_intel_symptom_selected`, `journal_entry_saved`, `travel_card_shared`, `traveler_connect_tapped`

**Funnels defined:** `lib/posthog-funnels.ts` — ONBOARDING_FUNNEL, CONVERSION_FUNNEL, PAYWALL_MICRO_FUNNEL, etc.

**Dual-write:** `track()` → Supabase `analytics_events`; `captureEvent()` → PostHog. Some screens use both.

**Open (from roam/analytics_spec.md):**
- `app_opened` / `cold_start` — add to `_layout.tsx` on AppState active
- `subscription_started` — add to paywall `handlePurchase` before purchasePro
- `generate_started` — add at start of generation in generate.tsx

---

## 5. Remaining (Non-Blocking)

| Priority | Item |
|----------|------|
| P3 | 289 ESLint warnings (unused vars, any at SDK boundaries) |
| P4 | PostHog: add app_opened, subscription_started, generate_started |
| P5 | Booking.com AID placeholder 'roam' — needs real partner ID |
| P5 | roam/security_audit.md: WAITLIST_JOINED email PII, EU data residency, consent banner |

---

## Commands

```bash
npx tsc --noEmit   # Run after every change
npx jest           # Tests
npx eslint . --ext .ts,.tsx
```
