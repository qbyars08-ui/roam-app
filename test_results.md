# Test Results

**Status: GREEN**
**Date: 2026-03-14**
**Total: 558 tests, 18 suites — all passing**

---

## Test Suites

| File | Tests | Status | Coverage target |
|---|---|---|---|
| `__tests__/parseItinerary.test.ts` | 17 | PASS | `lib/types/itinerary.ts` — parseItinerary() |
| `__tests__/itinerary.test.ts` | 67 | PASS | `lib/types/itinerary.ts` — extended coverage |
| `__tests__/claude.test.ts` | 56 | PASS | `lib/claude.ts` — buildTripPrompt() + edge cases |
| `__tests__/store.test.ts` | 36 | PASS | `lib/store.ts` — Zustand state + edge cases |
| `__tests__/guest.test.ts` | 4 | PASS | `lib/guest.ts` |
| `__tests__/proGate.test.ts` | 5 | PASS | `lib/pro-gate.ts` |
| `__tests__/waitlist.test.ts` | 3 | PASS | `lib/waitlist-guest.ts` — getRefFromUrl, getStoredRef |
| `__tests__/analytics.test.ts` | 22 | PASS | `lib/analytics.ts` |
| `__tests__/growth-hooks.test.ts` | 43 | PASS | `lib/growth-hooks.ts` |
| `__tests__/smart-triggers.test.ts` | 27 | PASS | `lib/smart-triggers.ts` |
| `__tests__/waitlist-guest.test.ts` | 21 | PASS | `lib/waitlist-guest.ts` — joinWaitlist, generateCodeFromEmail |
| `__tests__/referral.test.ts` | 57 | PASS | `lib/referral.ts` |
| `__tests__/affiliates.test.ts` | 47 | PASS | `lib/affiliates.ts` |
| `__tests__/sharing.test.ts` | 38 | PASS | `lib/sharing.ts` |
| `__tests__/destination-image-fallback.test.tsx` | 24 | PASS | `components/ui/DestinationImageFallback.tsx` |
| `__tests__/destination-theme-overlay.test.tsx` | 45 | PASS | `components/ui/DestinationThemeOverlay.tsx` |
| `__tests__/destination-intel.test.ts` | 54 | PASS | DestinationIntelCard deps (timezone, geocoding, weather, exchange-rates, public-holidays) |
| `__tests__/claude-proxy-admin.test.ts` | 34 | PASS | `supabase/functions/claude-proxy` admin bypass logic |

---

## New Coverage (2026-03-14, this PR)

### `lib/referral.ts` (57 tests)
- `getReferralCode()` — deterministic, 6-char safe-alphabet, handles empty/long input
- `getReferralUrl()` — URL format, base URL, code preservation
- `generateReferralCode()` — email normalisation (trim + lowercase), same algo as seededHash, unique per email
- `proMonthsFromCount` (via stats) — 0→0, 3→1, 6→2, 9→3, 10+→12 (1 year)
- `nextMilestoneMessage` (via stats) — all boundary values (0,1,2,3,9,10+), null at goal
- `getReferralStats()` — DB-first, AsyncStorage fallback, zero-default, null code fallback
- `recordReferral()` — local increment, Supabase update with referrerId, no-op without, silent fail
- `trackReferral()` — rejects sentinel codes (empty, 'direct', 'share', 'twitter'), normalises to lowercase, returns false/true correctly
- `getWaitlistReferralStats()` — `referralsToNextReward` at 0,1,2,3,10; fallback on DB null; email normalisation
- `getWaitlistPosition()` — count from DB, 0 on miss/error
- `ensureReferralCode()` — returns correct code, silent on DB error
- `shareReferralLink()` — Share.share called with URL

### `lib/affiliates.ts` (47 tests)
- `AFFILIATE_PARTNERS` — 4 entries, correct structure, one per category
- Skyscanner `buildUrl` — IATA city code, roam tracking param, 3-char fallback for unknown cities
- Booking.com `buildUrl` — lowercase + hyphenated city, `aid=roam`; `estimateLabel` with/without days (days×45)
- GetYourGuide `buildUrl` — `partner_id=roam`; `estimateLabel` always same
- Rentalcars `buildUrl` — `affiliateCode=roam`; `estimateLabel` with/without days (days×25)
- `getCityCode` fallback — known/unknown destinations, short destinations no crash
- `trackAffiliateClick()` — inserts to correct table, truncates fields (50/200/64 chars), correct user_id, null tripId, silent fail
- `openAffiliateLink()` — `canOpenURL` called, `openURL` when true, fallback when false, silent fail
- `CATEGORY_LABELS` / `CATEGORY_ICONS` — all 4 categories present

### `lib/sharing.ts` (38 tests)
- `getSharedTrip()` UUID validation — empty, non-UUID, wrong version digit, incomplete, uppercase (valid), whitespace trimmed; DB called only for valid UUIDs
- `getSharedTrip()` DB fetch — returns typed object, null on no data, null on error, null on throw; queries correct table
- `shareTrip()` authentication — null/no return + Alert when unauthenticated; no DB call
- `shareTrip()` success — returns share ID, inserts with correct fields, calls Share.share with destination + days
- `shareTrip()` DB failure — null return + Alert when insert fails, when data null
- `copyShareableLink()` signed-in — returns true, clipboard contains trip URL + share ID, fallback when no insert data
- `copyShareableLink()` guest — returns true with fallback text, no DB call
- `copyShareableLink()` errors — false on Clipboard throw, false on auth throw

### Extended coverage — `lib/claude.ts` edge cases (+18 tests)
- days=1 / days=30 boundary values
- groupSize=0 (not shown) / groupSize=10
- 10 vibes joined / single vibe no comma
- rain boundary: pop=0.31 shown, pop=0.30 not shown, pop=0 never shown
- Special chars in mustVisit/avoidList/specialRequests
- AT vs US passport in profile
- Empty transport/dietary arrays vs undefined

### Extended coverage — `lib/store.ts` edge cases (+21 tests)
- `removeTrip()` — removes correct trip, no-op for unknown, clears last trip, immutability
- `updateTrip()` — updates only matching trip, merges partial, no-op for unknown
- `setActiveTripId(null)` — clears, overwrites
- `setTravelProfile()`, `updateTravelProfile()`, `setHasCompletedProfile()`
- `exchangeRates` starts null, `setExchangeRates()` updates and accepts null
- `homeCurrency` starts USD
- `setTrips()` bulk replace and clear

---

## New Coverage (2026-03-14, Agent 01 — Component + Admin Bypass)

### `DestinationImageFallback` (24 tests — `destination-image-fallback.test.tsx`)
- Renders without crashing for known/unknown/empty destinations
- Correct destination name and optional country text rendered in tree
- Known destination gradient colors (8 cities): Tokyo cherry blossom, Paris lavender, Bali green, NY blue, Barcelona coral, Rome gold, London slate, Bangkok amber
- Unknown destination falls back to default sage `rgba(124,175,138,0.4)`
- Gradient has exactly 2 stops; first is `rgba(r,g,b,0.4)`, second is `COLORS.bg`
- Height prop: defaults to 200, custom height applied correctly

### `DestinationThemeOverlay` (45 tests — `destination-theme-overlay.test.tsx`)
- Pure `getThemeColor()` logic tested across all 19 known destination entries
- All known city → rgba mappings verified individually
- Kyoto has softer alpha (0.04) vs Tokyo (0.05) — regression guard
- Unknown destinations fall back to `rgba(124,175,138,0.03)` (default sage)
- Case normalisation: `TOKYO`, `tokyo`, `  Tokyo  ` all resolve identically
- Multi-word normalisation: `NEW YORK`, `CAPE TOWN`, `BUENOS AIRES`
- Structural: all 19 keys are lowercase; all values are valid rgba strings; all alphas ≤ 0.05

### `DestinationIntelCard` dependency pipeline (54 tests — `destination-intel.test.ts`)
- `getTimezoneByDestination()` — 11 cities, null for unknown, case-insensitive, trims whitespace
- `getCountryCode()` — 9 cities, null for unknown, case-insensitive, trims
- `getPublicHolidays()` — API fetch, cache hit, cache expiry, HTTP error, network throw
- `getHolidaysDuringTrip()` — in-range, out-of-range, empty result
- `geocodeCity()` — cache hit, API fetch, null on error, null on empty results, network throw, name normalisation
- `getWeatherForecast()` — API fetch (2 days), cache hit, null on error, null on missing daily data, WMO code 0 → 'Clear sky', WMO code 95 → 'Thunderstorm'
- `getExchangeRates()` — API fetch, cache hit, null on failure, null on missing rates, network throw
- `convertCurrency()` — USD→JPY, USD→EUR, same currency, unknown currency, cross-rate (JPY→EUR)

### Admin bypass in `supabase/functions/claude-proxy` (34 tests — `claude-proxy-admin.test.ts`)
- `parseAdminEmails()` — undefined, empty string, whitespace-only, single email, comma-separated list, uppercase normalised, whitespace trimmed, double commas filtered, documented admin email `qbyars08@gmail.com`
- `isAdminUser()` — known admin matches, non-admin rejects, case-insensitive, empty email, empty list, partial match rejected
- `shouldRateLimit()` — admin bypass with free tier + over limit, admin bypass over limit by 100×, non-admin at limit is limited, empty subscription treated as free, below limit not limited, Pro bypasses, chat (isTripGeneration=false) never limited
- End-to-end: `qbyars08@gmail.com` in env bypasses; same trip count limits a regular user; multiple admins all bypass; FREE_TIER_LIMIT = 1 boundary

## Infrastructure Fix
- `jest.setup.js` — fixed Share/Alert/Linking mocks: react-native 0.83 accesses these modules via `.default` on the subpath require; added `.default` export to all three so mocked modules are correctly resolved.

---

## Run Command

```bash
npx jest --forceExit
```

## History
| Date | Tests | Suites | Notes |
|---|---|---|---|
| 2026-03-14 (this PR) | 423 | 14 | referral, affiliates, sharing + edge cases |
| 2026-03-14 | 262 | 11 | analytics, growth-hooks, smart-triggers, waitlist-guest |
| 2026-03-14 | 151 | 7 | itinerary, claude, store, proGate, guest, waitlist, parseItinerary |
