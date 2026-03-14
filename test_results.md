# Test Results

**Status: GREEN**
**Date: 2026-03-14**
**Total: 262 tests, 11 suites — all passing**

---

## Test Suites

| File | Tests | Status | Coverage target |
|---|---|---|---|
| `__tests__/parseItinerary.test.ts` | 17 | PASS | `lib/types/itinerary.ts` — parseItinerary() |
| `__tests__/itinerary.test.ts` | 67 | PASS | `lib/types/itinerary.ts` — extended coverage |
| `__tests__/claude.test.ts` | 38 | PASS | `lib/claude.ts` — buildTripPrompt() |
| `__tests__/store.test.ts` | 15 | PASS | `lib/store.ts` — Zustand state |
| `__tests__/guest.test.ts` | 4 | PASS | `lib/guest.ts` — guest session helpers |
| `__tests__/proGate.test.ts` | 5 | PASS | `lib/pro-gate.ts` — feature gating |
| `__tests__/waitlist.test.ts` | 3 | PASS | `lib/waitlist-guest.ts` — getRefFromUrl, getStoredRef |
| `__tests__/analytics.test.ts` | 22 | PASS | `lib/analytics.ts` — track(), trackEvent() |
| `__tests__/growth-hooks.test.ts` | 43 | PASS | `lib/growth-hooks.ts` — milestones, engagement, cooldown |
| `__tests__/smart-triggers.test.ts` | 27 | PASS | `lib/smart-triggers.ts` — evaluateTrigger(), session tracking |
| `__tests__/waitlist-guest.test.ts` | 21 | PASS | `lib/waitlist-guest.ts` — joinWaitlist(), generateCodeFromEmail() |

---

## New Coverage (2026-03-14)

### `lib/analytics.ts` (22 tests)
- `trackEvent()`: inserts correct event_type, payload, session_id; silent failure on DB/auth errors
- `track()`: all 8 event types (tap, screen_view, flow_step, flow_abandon, feature_use, error, session_start, session_end)
- Each type sets the correct row fields (screen, action, payload shape)
- user_id is null without session; uses real ID when session present
- Never throws on DB or auth failure

### `lib/growth-hooks.ts` (43 tests)
- `getUpgradeMessage()`: all 6 contexts, correct copy
- `getPaywallSocialProof()`: shape, content, determinism
- `canShowGrowthPrompt()`: returns true when no timestamp, false < 4h, true > 4h, true on error
- `markGrowthPromptShown()`: writes correct key with current timestamp
- `recordGrowthEvent()`: stores event, appends to existing, prunes >30 days, caps at 200
- `checkMilestones()`: first_trip, third_trip, fifth_trip, streak_3, streak_7, streak_30; Pro gating; seen deduplication; all milestone fields present
- `dismissMilestone()`: marks seen, preserves existing, deduplicates
- `getEngagementScore()`: 10pts/trip (cap 50), 5pts/streak (cap 35), +15 Pro, recent 7-day events, cap 100

### `lib/smart-triggers.ts` (27 tests)
- `evaluateTrigger('post_generation')`: upgrade/trip_limit (priority 95) when at limit; share/post_trip otherwise; Pro bypass
- `evaluateTrigger('feature_tap')`: upgrade/feature_locked for non-Pro; none for Pro
- `evaluateTrigger('app_open')`: high_engagement (70) beats streak_momentum (65); both require !isPro
- `evaluateTrigger('post_share')`: refer/post_trip (priority 50)
- `evaluateTrigger('itinerary_view')`: rate trigger for 2+ trips; suppressed after 2 prompts or within 7 days
- Cooldown: returns none/cooldown when canShowGrowthPrompt returns false
- `resetSessionTracking()`, `trackScreenView()`, `getSessionDepth()`

### `lib/waitlist-guest.ts` (21 tests)
- `joinWaitlist('')` / `joinWaitlist('  ')`: throws 'Email required'
- Email normalization: trim + lowercase before insert
- Successful insert: returns WaitlistResult, position = count+1, clears stored ref
- `generateCodeFromEmail` fallback: 6-char code, valid charset, deterministic, unique per email
- Duplicate (23505): returns existing referral_code; falls back to generated code if null
- Non-23505 error: re-throws
- Referral source: included from AsyncStorage; defaults to 'direct'
- `getGuestReferralUrl()`, `getWaitlistReferralUrl()`, `getTryAppUrl()` URL formats
- `getStoredRef()`, `clearStoredRef()` AsyncStorage operations

---

## Run Command

```bash
npx jest --forceExit
```

## Previous Baseline (before 2026-03-14)
151 tests, 7 suites
