# AGENT BOARD

Central status board for all AI agents working on ROAM.
Cap reads this file to coordinate work. Each agent maintains their own section.

*Last updated: 2026-03-13 18:00 UTC*

---

## Daily Standup — 2026-03-13 (Friday)

### What happened today

- **Forge** completed a design audit across 20 files, eliminated all `COLORS` alpha-modifier anti-patterns, and ran 100/100 tests passing across 8 suites. Fixed a bug where `getDestinationAirport('')` returned `'NRT'` due to empty-string partial match.
- **Guardian** scanned for secrets and removed `EXPO_PUBLIC_ANTHROPIC_API_KEY` from `.env.example`. Confirmed no hardcoded secrets (`sk-ant`, `sk-proj`, `AKIA`, etc.) in source. Two items deferred: Amadeus client secret (test-env only) and jest-expo vuln chain (dev-only).
- **Shield** completed a full security audit: created `amadeus-proxy` edge function (Amadeus keys now server-side), added JWT verification to `voice-proxy` and `weather-intel`, restricted CORS, added UUID validation to sharing, and added input length limits to `claude-proxy`.
- **Launch (Deployer)** diagnosed the deploy pipeline: web build passes locally, but Netlify is paused due to billing limits. `deploy.yml` does not create `_redirects` (SPA routing would break). GitHub secrets need verification.
- **Scout** completed codebase orientation: identified free API whitespace (Open-Meteo, WorldTimeAPI, Nager.Date) not yet integrated, flagged static visa data, and noted 35 destination theme palettes as expansion opportunity.
- **Spark** created Feature Lab screen (`app/spark.tsx`) with Spark idea generation via `claude-proxy`. Gated behind feature flags for native.
- **Bridge** created `AGENTS.md`, `DAILY_BRIEF.md`, `DECISIONS_LOG.md`. Flagged 39/59 screens unaudited in polish checklist, duplicate RevenueCat modules, and stale group-trips spec.
- **Polish agent** audited and fixed multiple batches of routes (back buttons, emojis, haptics, copy, contractions). All 59 routes now marked as audited in `docs/polish-checklist.md`.
- **ShipIt** ran a gate check: TypeScript compilation PASS, web build PASS, zero errors.

### Open blockers

1. **Netlify is offline** — billing limit hit. No user-facing web app until resolved.
2. **deploy.yml missing `_redirects`** — SPA routing would break even after billing is fixed.
3. **EXPO_PUBLIC_AMADEUS_SECRET** still in client bundle on some branches — proxy exists but env vars not deployed.
4. **Duplicate RevenueCat modules** (`lib/revenuecat.ts` + `lib/revenue-cat.ts`) — dead code, needs cleanup decision.

---

## Top 3 Priority Tasks

### Priority 1: Unblock Netlify Deploy

| Field | Value |
|-------|-------|
| Impact | 5/5 — App is offline; blocks all user testing, demos, and App Store review |
| Effort | 1/5 — Billing fix is dashboard-only; `_redirects` fix is a 2-line change |
| Score | **5.0** (highest) |
| Owner | Launch (Deployer) |
| Status | BLOCKED on billing action |

**Actions:**
1. Resolve Netlify billing: Dashboard > Usage & billing > upgrade or buy credits
2. Fix `.github/workflows/deploy.yml`: add `echo '/* /index.html 200' > dist/_redirects` before Netlify deploy step
3. Verify GitHub secrets: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` are set
4. Push to `main` and confirm https://tryroam.netlify.app loads

---

### Priority 2: Security Hardening — Deploy Edge Function Secrets

| Field | Value |
|-------|-------|
| Impact | 4/5 — Client secret exposure (Amadeus) and missing auth on chaos_dares |
| Effort | 2/5 — Proxy code exists; need to set env vars and tighten 2-3 RLS policies |
| Score | **2.0** |
| Owner | Shield |
| Status | Code done; env vars need deployment |

**Actions:**
1. Set `AMADEUS_KEY`, `AMADEUS_SECRET`, `SEND_PUSH_INTERNAL_SECRET` in Supabase edge function secrets
2. Tighten RLS on `prompt_versions` and `content_freshness` tables (restrict to authenticated/service role)
3. Add auth requirement or rate limit to `chaos_dares` insert
4. Remove `EXPO_PUBLIC_AMADEUS_SECRET` from client code once proxy is confirmed working
5. Verify with `npx tsc --noEmit` after changes

---

### Priority 3: App Store Submission Gate — Screenshots + Final QA

| Field | Value |
|-------|-------|
| Impact | 5/5 — Cannot submit to App Store without 6 screenshots and passing QA |
| Effort | 3/5 — Screenshots require device captures; QA is systematic but scoped |
| Score | **1.67** |
| Owner | Forge (QA) + manual screenshot capture |
| Status | NOT STARTED |

**Actions:**
1. Capture 6 App Store screenshots at 1290x2796px: Discover, Plan wizard, Itinerary, Group Trips, Prep, Share card (per `docs/APP_STORE_SCREENSHOTS.md`)
2. Run full regression: all auth flows (anonymous, email, OAuth), trip generation, subscription flow in sandbox
3. Verify all 59 polished screens render correctly with design system tokens
4. Confirm `npx tsc --noEmit` and `npx expo export --platform web` both pass
5. Check bundle size remains under 15MB limit

---

## Agent Status

### Forge — QA Tester

**Status:** IDLE
**Last Updated:** 2026-03-13
**Action Needed:** YES — assigned to Priority 3 (App Store QA)

- Design audit across 20 files complete
- 100/100 tests passing (8 suites)
- Bug fixed: `getDestinationAirport('')` empty-string match
- **Next:** App Store screenshot QA pass + regression testing

### Guardian — Security Auditor

**Status:** IDLE
**Last Updated:** 2026-03-13
**Action Needed:** NO

- Removed `EXPO_PUBLIC_ANTHROPIC_API_KEY` from `.env.example`
- Confirmed no hardcoded secrets in source
- Deferred: Amadeus client secret (test-env), jest-expo vulns (dev-only)
- **Next run:** 2026-03-14

### Shield — Security Engineer

**Status:** IDLE
**Last Updated:** 2026-03-13
**Action Needed:** YES — assigned to Priority 2 (deploy edge function secrets)

- Created `amadeus-proxy` edge function
- Added JWT verification to `voice-proxy`, `weather-intel`
- CORS restricted, input limits on `claude-proxy`
- **Next:** Deploy env vars, tighten RLS, lock down `chaos_dares`

### Launch — Deployer

**Status:** BLOCKED
**Last Updated:** 2026-03-13
**Action Needed:** YES — assigned to Priority 1 (unblock Netlify)

- Web build passes locally
- Netlify paused (billing)
- `deploy.yml` missing `_redirects` step
- **Next:** Fix billing, fix deploy workflow, verify full pipeline

### Scout — Research Analyst

**Status:** IDLE
**Last Updated:** 2026-03-13
**Action Needed:** NO

- Codebase orientation complete
- Identified free API whitespace (Open-Meteo, WorldTimeAPI, Nager.Date)
- Static visa data and destination expansion flagged
- **Next:** Awaiting research task from Cap

### Spark — Creative Director

**Status:** COMPLETE
**Last Updated:** 2026-03-13
**Action Needed:** NO

- Feature Lab screen created (`app/spark.tsx`)
- Spark idea generation via `claude-proxy` working
- Feature-flagged for native v1.0
- **Next:** Wire prompt versioning table

### Bridge — Coordinator

**Status:** IDLE
**Last Updated:** 2026-03-13
**Action Needed:** NO

- Created `AGENTS.md`, `DAILY_BRIEF.md`, `DECISIONS_LOG.md`
- Flagged: 39/59 screens unaudited (now resolved by polish agent), duplicate RevenueCat, stale group-trips spec
- **Next:** Coordinate next daily brief

---

## Priority Backlog (Scored)

Items below the top 3, ordered by impact/effort ratio:

| # | Issue | Impact | Effort | Ratio | Owner |
|---|-------|:------:|:------:|:-----:|-------|
| 4 | Remove duplicate RevenueCat module | 2 | 1 | 2.0 | Any |
| 5 | Claude proxy model fallback | 2 | 1 | 2.0 | Shield |
| 6 | Guest mode implementation | 4 | 3 | 1.33 | Forge/Scout |
| 7 | DOMPurify for innerHTML in outputs | 3 | 2 | 1.5 | Shield |
| 8 | Budget filtering on Discover | 3 | 2 | 1.5 | Forge |
| 9 | `document.write` → createElement in share-card | 3 | 2 | 1.5 | Any |
| 10 | Free API integrations (Open-Meteo, etc.) | 3 | 3 | 1.0 | Scout |
| 11 | Live Flight Prices (P0 revenue) | 4 | 4 | 1.0 | Scout + Forge |
| 12 | World Map visualization | 3 | 3 | 1.0 | Spark + Forge |
| 13 | Seasonal Recommendations | 3 | 3 | 1.0 | Scout |
| 14 | Bundle size reduction (6.1MB → 1.5MB target) | 3 | 4 | 0.75 | Forge |
| 15 | Voice STT for chat | 3 | 4 | 0.75 | Spark |

---

## Board Rules

- Each agent **overwrites** their own section after every task — this board shows current state, not history
- History lives in `docs/DECISIONS_LOG.md` or agent-specific docs
- `[CAP]` flags mean something needs a human or cross-agent decision
- Top 3 priorities are re-scored daily at 18:00 UTC by the ops standup
- Impact: 1 (cosmetic) to 5 (app broken / launch blocked)
- Effort: 1 (minutes) to 5 (days of work)
- Score = Impact / Effort — higher is more urgent
