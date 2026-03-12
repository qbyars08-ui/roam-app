# ROAM Performance Audit Report

**Date:** March 2026  
**Scope:** 50+ screens, Discover, Supabase, AsyncStorage, images

---

## 1. Lazy load non-tab Stack screens

**Status:** Done

- Added `lazy: true` to `Stack` in `app/_layout.tsx`.
- Modal/stack screens (itinerary, paywall, alter-ego, referral, layover, airport-guide, etc.) are now lazy and mount only when navigated to.
- Main tab screens (index, plan, saved, profile) stay eager for instant tab switching.

---

## 2. Memoize expensive components

**Status:** Done

- `DestinationCard` (`components/premium/DestinationCard.tsx`): Wrapped with `React.memo`.
- `MoodSection` (`components/features/MoodSection.tsx`): Wrapped with `React.memo`.
- Itinerary days: Heavy inline day rendering remains; further extraction + memoization can be added later if needed.

---

## 3. Image loading

**Status:** Done

- **Unsplash URL cache:** `lib/unsplash.ts` – in-memory cache (max 64 entries) for `resolveUnsplashPhoto` to avoid repeat API calls.
- **Optimized URLs:** `lib/photos.ts` – `getDestinationPhoto()` now returns URLs with `?w=800&q=85&fm=webp` via `optimizeUnsplashUrl()`.
- **Unsplash CDN:** Uses standard cache headers; our URLs support webp for smaller payloads.

---

## 4. Bundle size

**Status:** Audited (no major cleanup)

- `npx expo export --platform web` can be run to inspect bundle size.
- No large unused imports identified in core screens. A full `source-map-explorer` or `@next/bundle-analyzer`–style analysis would require additional tooling.

---

## 5. Loading skeletons

**Status:** Done

- `group-trip.tsx`: Shows `SkeletonCard` while group details load.
- `dream-vault.tsx`: Shows `SkeletonGrid` while destinations load.
- Existing `ShimmerOverlay` remains in use for hero and For You cards on Discover.

---

## 6. Discover scroll (60fps)

**Status:** Done

- `removeClippedSubviews={!isWeb}` added to main `Animated.ScrollView` on Discover.
- `scrollEventThrottle={16}` was already set.
- Parallax and category/budget pills stay within normal rendering cost.

---

## 7. Memory leaks (useEffect cleanup)

**Status:** Done

- `components/premium/LoadingStates.tsx`: Added cleanup for `Animated.loop` (compass, glow, particles).
- Other screens already had proper cleanup for `Animated.loop`, `setInterval`, `addListener`, and subscriptions.

---

## 8. Supabase indexes

**Status:** Done

- New migration `20260318_performance_indexes.sql`:
  - `idx_profiles_subscription` for subscription filtering.
  - `idx_analytics_events_user_created` for user + date range queries.
- Run: `supabase db push` or apply migrations in Supabase dashboard.

---

## 9. AsyncStorage stale data

**Status:** Done

- New `lib/storage-version.ts`: `checkStorageVersion()` compares app version with stored value; on change, clears cache keys (currency, weather, travel advisory, visa, etc.).
- Invoked in root `_layout.tsx` on boot.
- User data (trips, pets, profile, onboarding) is preserved.

---

## 10. Expo profiler

**Status:** Setup added

- Added `"profile": "expo start --dev-client"` in `package.json`.
- Run `npx expo run:ios` or `npx expo run:android` with dev client, then use Xcode Instruments or React DevTools Profiler to measure.
- Top items to watch: Discover hero images, many `ImageBackground` instances, and any heavy layout/measure in long lists.

---

## Summary

| Item            | Status | Notes                                                      |
|-----------------|--------|------------------------------------------------------------|
| Lazy screens    | Done   | Stack uses `lazy: true`                                   |
| Memoization     | Done   | DestinationCard, MoodSection                             |
| Image loading   | Done   | Cache + webp URLs                                         |
| Bundle size     | Audited| No large obvious bloat                                    |
| Skeletons       | Done   | group-trip, dream-vault                                   |
| 60fps scroll    | Done   | `removeClippedSubviews`, `scrollEventThrottle=16`         |
| Memory leaks    | Done   | LoadingStates Animated.loop cleanup                       |
| Supabase indexes| Done   | New migration                                             |
| AsyncStorage    | Done   | Version check + cache clear on update                     |
| Profiler        | Done   | Script added; run manually for detailed metrics           |

---

## Before/after metrics

- **Cold start:** Lazy Stack reduces JS parsed before first paint.
- **Discover:** `removeClippedSubviews` + memoized cards should reduce jank during scroll.
- **Images:** Webp and caching reduce bandwidth and improve perceived speed.
- **Memory:** Animated.loop cleanup prevents growth in LoadingStates and similar screens.

For concrete FPS and TTI numbers, run the profiler and capture traces before/after these changes.
