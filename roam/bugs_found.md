# Bugs Found — 2026-03-15

---

## Bug 1: Stale Expo Router Type File Missing `/(tabs)/generate`

- **Severity:** P1
- **Screen:** `.expo/types/router.d.ts` (auto-generated, gitignored)
- **Repro:**
  1. Run `npx tsc --noEmit`
  2. Observe 20 TypeScript errors: `Argument of type '"/(tabs)/generate"' is not assignable to parameter of type ...`
- **Expected:** `/(tabs)/generate` is a valid typed route (file exists at `app/(tabs)/generate.tsx`).
- **Actual:** Router type file was generated from an older version of the tab structure. Lists `/(tabs)/chat`, `/(tabs)/globe`, `/(tabs)/plan`, etc. as tabs, but is missing `/(tabs)/generate`, `/(tabs)/stays`, `/(tabs)/food`, `/(tabs)/group`.
- **Affected files (20):**
  - `app/(tabs)/group.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/stays.tsx`
  - `app/create-group.tsx`, `app/dream-vault.tsx`, `app/dupe-finder.tsx`
  - `app/memory-lane.tsx`, `app/passport.tsx`, `app/pets.tsx`, `app/saved.tsx`
  - `app/travel-profile.tsx`, `app/trip-collections.tsx`, `app/trip-dupe.tsx`
  - `app/trip-trading.tsx`, `app/trip/[id].tsx`
  - `components/features/MoodDiscovery.tsx`, `components/features/MoodSection.tsx`
  - `components/features/SurpriseMe.tsx`
- **Fix applied:** Added `/(tabs)/generate`, `/(tabs)/stays`, `/(tabs)/food`, `/(tabs)/group` routes to `.expo/types/router.d.ts`. To permanently fix, run `npx expo export --platform web` (or start the dev server) to regenerate the file fully, then commit it or add it to `.gitignore` so stale types don't reappear.
- **Status:** FIXED (types patched manually in this run)

---

## Bug 2: ESLint Error — Empty `catch {}` Block in `lib/referral.ts`

- **Severity:** P3
- **Screen:** `lib/referral.ts:261`
- **Repro:**
  1. Run `npx eslint lib/referral.ts`
  2. Observe: `261:11 error Empty block statement no-empty`
- **Expected:** Catch blocks should either handle the error or use `catch (_err) { /* intentionally swallowed */ }` with an eslint-disable comment.
- **Actual:** `catch {}` with no comment — ESLint `no-empty` rule violation.
- **Code:**
  ```ts
  } catch {}  // line 261 — empty, no comment
  ```
- **Fix:** Change to `catch (_err) { /* getReferralStats — fallback to defaults on any error */ }` or add `// eslint-disable-next-line no-empty` with a comment explaining intent.
- **Status:** OPEN

---

## Bug 3: `app/(tabs)/generate.tsx` Has No i18n Support

- **Severity:** P3
- **Screen:** `app/(tabs)/generate.tsx`
- **Repro:**
  1. Change device language to Spanish/French/Japanese.
  2. Open Generate tab.
  3. Observe all text is hardcoded English.
- **Expected:** All user-facing strings use `useTranslation()` / `t('...')` per project conventions.
- **Actual:** `generate.tsx` does not import `useTranslation`. Error banners ("Dismiss"), rate limit modals ("You hit your free limit", "unlimited trips and the full ROAM experience") are hardcoded English strings.
- **Affected strings (examples):**
  - `"You hit your free limit"` (line ~283)
  - `"unlimited trips and the full ROAM experience."` (line ~286)
  - `"Dismiss"` (error banner dismissal, lines 234, 250)
  - `"Upgrade to Pro"` (rate limit modal button)
- **Fix:** Add `const { t } = useTranslation()` and replace hardcoded strings with `t('generate.errorBannerDismiss')`, `t('generate.rateLimitTitle')`, etc. Add keys to all 4 locale files.
- **Status:** OPEN

---

## Warnings (Not Bugs)

These are ESLint warnings (not errors) noted for awareness. None block functionality.

| File | Warning |
|---|---|
| `lib/couples-overlap.ts:12` | `DEFAULT_TRAVEL_PROFILE` is defined but never used |
| `lib/local-events.ts:19` | `EB_TOKEN` is assigned but never used |
| `lib/location-sharing.ts:6` | `Platform` is defined but never used |
| `lib/mapbox.ts:138` | `coords` is assigned but never used |
| `lib/neighborhood-safety.ts:43` | `i` is defined but never used |
| `lib/push-notifications.ts:169` | `checkInType` is defined but never used |
| `lib/visa-intel.ts:145` | `countryCode` is defined but never used |
| `lib/weather.ts:195` | `today` is assigned but never used |
| (26 others) | Various `@typescript-eslint/no-unused-vars` warnings |
