# AGENT BOARD

Cap reads this file to track agent activity. Each agent maintains their own section.  
Format: status, date, findings (max 10 bullets), action needed flag.

---

## Forge — QA Tester

**Status:** IDLE  
**Last Updated:** 2026-03-13  
**Action Needed:** NO

### Latest Findings (Design Audit)
- **Discover tab** `app/(tabs)/index.tsx`: category/budget pills → frosted glass (whiteSoft border, bgGlass fill, goldHighlight active); price badge → glassmorphic (goldSubtle + goldBorder); error banner borderColor anti-pattern fixed
- **Flights tab** `app/(tabs)/flights.tsx`: search input → pill-shaped; status badges use `statusBgColor()` helper returning proper COLORS tokens; `placeholderTextColor` anti-pattern fixed
- **Prep tab** `app/(tabs)/prep.tsx`: `Section` component `iconColor+'20'` prop refactored to `iconBg` accepting explicit tokens; trip card gradient anti-patterns fixed; packing checkbox styled with sageBorder/sageFaint
- **Itinerary** `app/itinerary.tsx`: active day tab uses `destTheme.glowColor`; action card gradients use `[glowColor, COLORS.transparent]`
- **All COLORS alpha-modifier anti-patterns eliminated** across 14 files — `COLORS.x + 'hex'` and `` `${COLORS.x}hex` `` patterns replaced with proper COLORS tokens
- `npx tsc --noEmit` — zero errors after all changes
- `npx jest` — 100/100 tests passing (8 suites)
- **Files changed**: `index.tsx`, `flights.tsx`, `prep.tsx`, `itinerary.tsx`, `profile.tsx`, `arrival-mode.tsx`, `language-survival.tsx`, `roam-for-dates.tsx`, `people-met.tsx`, `visited-map.tsx`, `chaos-mode.tsx`, `chaos-dare.tsx`, `plan.tsx`, `chat.tsx`, `signin.tsx`, `dupe-finder.tsx`, `trip-receipt.tsx`, `trip-wrapped.tsx`, `LiveCompanionFAB.tsx`, `ReturnTripSection.tsx`

### Previous Findings (Test Suite)
- Created `lib/__tests__/claude.test.ts`, `flights-amadeus.test.ts`, `store.test.ts` — 54 tests total
- **Bug fixed**: `getDestinationAirport('')` returned `'NRT'` due to empty-string partial match bug in `lib/flights-amadeus.ts`

### Notes
_Awaiting next assignment from Cap._

---

## Guardian — Security Auditor

**Status:** IDLE  
**Last Updated:** 2026-03-13  
**Action Needed:** NO

### Latest Findings (Security Audit — 2026-03-13)

**PHASE 1 — SCAN**

- **[FIXED] `.env.example` exposed `EXPO_PUBLIC_ANTHROPIC_API_KEY`** — This variable violates `.cursorrules` (all Claude calls must route through `claude-proxy`). Removed the line; replaced with a server-side-only comment directing devs to set `ANTHROPIC_API_KEY` in Supabase project secrets.
- **[ACCEPTED RISK] `EXPO_PUBLIC_AMADEUS_SECRET`** in `lib/flights-amadeus.ts:42` — Amadeus OAuth client secret exposed via `EXPO_PUBLIC_` prefix (bundled into client). Affects test environment only (`test.api.amadeus.com`); no PII or financial data exposed. Proper fix is a Supabase edge function proxy — deferred as major refactor.
- **[ACCEPTED RISK] 5 low-severity npm vulnerabilities** — All in `jest-expo` chain (`jest-expo`, `jest-environment-jsdom`, `jsdom`, `http-proxy-agent`, `@tootallnate/once`). Dev/test dependencies only; zero production impact. Fix requires `jest-expo` downgrade from 55 → 47 (major breaking change, incompatible with Expo 55). Deferred.
- **No hardcoded secrets found** — Scanned for `sk-ant`, `sk-proj`, `AKIA`, `AIza`, `ghp_` patterns; zero hits in source files.
- **No direct Anthropic API calls in client code** — `lib/claude.ts` correctly routes all calls through `supabase.functions.invoke('claude-proxy')`.
- **`.env` correctly in `.gitignore`** — Actual secret files cannot be committed.
- **`npx tsc --noEmit` — zero errors** — TypeScript strict check passes after all fixes.

**PHASE 2 — FIXES APPLIED**

- Removed `EXPO_PUBLIC_ANTHROPIC_API_KEY=` from `.env.example` (architecture violation + secret leak risk)
- Added clarifying comment in `.env.example` directing devs to use Supabase project secrets for `ANTHROPIC_API_KEY`
- Created `docs/office/guardian.md` — operational runbook for this agent

**PHASE 3 — VERIFY**

- `npx tsc --noEmit` — ✓ zero errors

### Deferred Items
| Item | Severity | Reason |
|------|----------|--------|
| `EXPO_PUBLIC_AMADEUS_SECRET` client exposure | Medium | Test-env only; proxy refactor needed |
| jest-expo vulnerability chain (5 deps) | Low | Fix = major downgrade; test-only |

### Notes
_Next run: 2026-03-14 16:00 UTC_

---

<!-- Add new agent sections below this line -->
