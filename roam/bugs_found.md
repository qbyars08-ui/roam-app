# Bugs Found

---

## Bug 1: Stale Expo Router Type File Missing `/(tabs)/generate`

- **Severity:** P1 — **STATUS: FIXED (2026-03-15)**
- **Screen:** `.expo/types/router.d.ts` (auto-generated, gitignored)
- **Repro:**
  1. Run `npx tsc --noEmit`
  2. Observe 20 TypeScript errors: `Argument of type '"/(tabs)/generate"' is not assignable to parameter of type ...`
- **Expected:** `/(tabs)/generate` is a valid typed route.
- **Actual:** Router type file was generated from an older version of the tab structure.
- **Fix:** Added `/(tabs)/generate`, `/(tabs)/stays`, `/(tabs)/food`, `/(tabs)/group` routes to `.expo/types/router.d.ts`. Permanent fix: run `npx expo export --platform web` to regenerate.
- **Post-fix:** `npx tsc --noEmit` → 0 errors.

---

## Bug 2: ESLint Error — Empty `catch {}` Block in `lib/referral.ts`

- **Severity:** P3 — **STATUS: FIXED (2026-03-15)**
- **Screen:** `lib/referral.ts:261`
- **Repro:** Run `npx eslint lib/referral.ts`
- **Fix:** Changed `catch {}` to `catch (_err) { /* getReferralStats — falls through to default values on any error */ }`

---

## Bug 3: `app/(tabs)/generate.tsx` Has No i18n Support

- **Severity:** P3 — **STATUS: OPEN**
- **Screen:** `app/(tabs)/generate.tsx`
- **Details:** Hardcoded English strings in rate limit modal and error banners. No `useTranslation()` usage.
- **Fix:** Add `const { t } = useTranslation()` and replace hardcoded strings. Add keys to all 4 locale files.

---

## Bugs 4–12: Design Violations in New Tab Files (5-Tab Restructure)

- **Severity:** P3 — **STATUS: ALL FIXED (2026-03-15)**

| File | Issue | Fix |
|---|---|---|
| `app/(tabs)/plan.tsx:706` | `color: '#FFFFFF'` | → `COLORS.white` |
| `app/(tabs)/people.tsx:539` | `color: '#FFFFFF'` | → `COLORS.white` |
| `app/(tabs)/plan.tsx:132` | `rgba(0,0,0,0.7)` in gradient | → `COLORS.overlayDark` |
| `app/(tabs)/plan.tsx:717` | `rgba(255,255,255,0.15)` | → `COLORS.whiteMuted` |
| `app/(tabs)/plan.tsx:732` | `rgba(255,255,255,0.15)` | → `COLORS.whiteMuted` |
| `app/(tabs)/people.tsx:245` | `rgba(0,0,0,0.7)` in gradient | → `COLORS.overlayDark` |
| `app/(tabs)/people.tsx:549` | `rgba(255,255,255,0.15)` | → `COLORS.whiteMuted` |
| `app/(tabs)/people.tsx` | Unused imports: `useMemo`, `useState`, `Search`, `useAppStore` | Removed |
| `app/(tabs)/plan.tsx` | Unused imports: `Animated`, `MapPin` | Removed |

---

## Warnings (Not Bugs — Pre-existing)

These are ESLint warnings across the codebase noted for awareness. None block functionality.

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
| (34+ others) | Various `@typescript-eslint/no-unused-vars` warnings across older files |
