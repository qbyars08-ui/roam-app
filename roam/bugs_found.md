# Bugs Found

---

## Bug 1: Duplicate German Entry in `SUPPORTED_LANGUAGES`

- **Severity:** P1 — **STATUS: FIXED (2026-03-15, Sprint 2)**
- **File:** `lib/i18n/index.ts:20-27`
- **Repro:** Open language picker in Profile screen — German appears twice
- **Expected:** 5 unique languages (en, de, es, fr, ja)
- **Actual:** German (`de`) listed twice at index 1 and 5
- **Root cause:** PR #33 (German localization) added `de` after the existing entry that was from a merge conflict
- **Fix:** Removed the duplicate entry on line 26

---

## Bug 2: Three Hardcoded English Strings in `GenerateModeSelect.tsx`

- **Severity:** P2 — **STATUS: FIXED (2026-03-15, Sprint 2)**
- **File:** `components/generate/GenerateModeSelect.tsx:49-52`
- **Repro:** Switch device language to German/Spanish/French/Japanese; open Plan tab with no trips
- **Expected:** First-time heading and subtitle in user's language
- **Actual:** Hardcoded: `'No trips yet.'`, `'Pick somewhere. 30 seconds…'`, `'How do you want to plan?'`
- **Fix:** Added `generate.noTrips`, `generate.noTripsSub`, `generate.howToPlan` keys to all 5 locales (en, es, fr, ja, de); wired `t()` calls

---

## Bug 3: Plan Tab Missing Analytics Events

- **Severity:** P2 — **STATUS: FIXED (2026-03-15, Sprint 2)**
- **File:** `app/(tabs)/plan.tsx`
- **Repro:** Tap "Plan a new trip", tap a quick action, tap a trip card — no PostHog events fire
- **Expected:** Events `plan_new_trip_tapped`, `plan_quick_action_tapped`, `plan_trip_card_tapped` fire (already defined in `posthog-events.ts`)
- **Actual:** Events defined but never called
- **Fix:** Added `captureEvent()` to `handleNewTrip`, `handleQuickAction`, `handleTripPress`

---

## Bug 4: CRITICAL — `squad_matches` Broken INSERT Policy (Auth Bypass)

- **Severity:** P0 — **STATUS: FIXED via migration (2026-03-15, pre-this-run)**
- **File:** `supabase/migrations/20260315000001_fix_squad_matches_rls.sql`
- **Repro:** Prior INSERT policy used `user_a`/`user_b` columns that don't exist on `squad_matches` (actual: `initiator_id`/`target_id`). This either silently failed (no policy = open insert) or errored at enforcement.
- **Impact:** Any authenticated user could insert arbitrary match records between any pair of users
- **Fix:** Migration drops broken policy, creates correct policy with `initiator_id` check + self-match prevention

---

## Bug 5: `social_profiles` Missing Input Constraints

- **Severity:** P1 — **STATUS: FIXED via migration (2026-03-15, pre-this-run)**
- **File:** `supabase/migrations/20260315000002_people_tab_security.sql`
- **Fix:** bio ≤ 300 chars, display_name ≤ 50 chars, vibe_tags ≤ 10, languages ≤ 10; trip_presence limited to 10 per user; shared_trips DELETE policy added; group preview restricted to auth

---

## Bug 6: `app/(tabs)/generate.tsx` (Old Tab) Has No i18n

- **Severity:** P3 — **STATUS: OPEN**
- **File:** `app/(tabs)/generate.tsx`
- **Impact:** LOW — tab is hidden (`href: null`), superseded by `plan.tsx` which is fully i18n-compliant
- **Fix:** Either localize all strings or delete the file (prefer delete once migration period ends)

---

## Previously Fixed (Earlier Runs)

| Bug | Fix Run | Notes |
|---|---|---|
| Stale `.expo/types/router.d.ts` missing `/(tabs)/generate` | Sprint 1 | Auto-generated file; patched manually |
| `lib/referral.ts:261` empty `catch {}` | Sprint 1 | `catch (_err)` with comment |
| `plan.tsx`/`people.tsx` hardcoded `#FFFFFF`, `rgba(0,0,0,0.7)`, `rgba(255,255,255,0.15)` | Sprint 1 | Replaced with COLORS tokens |
| `people.tsx` unused imports (useMemo, useState, Search, useAppStore) | Sprint 1 | Removed |
| `plan.tsx` unused imports (Animated, MapPin) | Sprint 1 | Removed |
