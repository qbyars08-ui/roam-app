# Test Results

**Status: GREEN**
**Date: 2026-03-14**
**Total: 423 tests, 14 suites — all passing**

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
