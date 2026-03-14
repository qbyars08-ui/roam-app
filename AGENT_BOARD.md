# ROAM AGENT BOARD

Last updated: 2026-03-13

## Agent Registry

| # | Agent | Model | Rule File | Cursor Cloud Name | Output File | Status |
|---|-------|-------|-----------|-------------------|-------------|--------|
| 01 | Tester | sonnet | agent-01-tester.mdc | Medic | /test_results.md, /bugs_found.md | RUNNING |
| 02 | Researcher | sonnet | agent-02-researcher.mdc | Research | /research_report.md | RUNNING |
| 03 | Design Enforcer | sonnet | agent-03-design-enforcer.mdc | UI | /design_audit.md | RUNNING |
| 04 | Builder | opus | agent-04-builder.mdc | Ideas | PRs + /analytics_spec.md | RUNNING |
| 05 | Debugger | sonnet | agent-05-debugger.mdc | deployer | /system_health.md, /incidents.md | RUNNING |
| 06 | Growth Hacker | sonnet | agent-06-growth.mdc | Office ops procedures | /growth_dashboard.md | RUNNING |
| 07 | Monetization | sonnet | agent-07-monetization.mdc | Office documentation p... | /monetization_model.md | RUNNING |
| 08 | Security | sonnet | agent-08-security.mdc | Scanguard | /security_audit.md | RUNNING |
| 09 | Localization | sonnet | agent-09-localization.mdc | Dev environment set... | /localization_audit.md | RUNNING |
| 10 | Analytics | sonnet | agent-10-analytics.mdc | communications | /analytics_spec.md | RUNNING |
| 11 | Content | sonnet | agent-11-content.mdc | Security audit scan | /copy_library.md | RUNNING |
| 12 | Investor | opus | agent-12-investor.mdc | Office innovate document | /investor_narrative.md, /weekly_memo.md | RUNNING |
| CP | Captain | opus | captain.mdc | cap | /captain_status.md | ACTIVE |
| -- | Orchestrator | opus | orchestrator.mdc | (Claude Code) | /AGENT_BOARD.md | ACTIVE |

## Reporting Protocol (ALL AGENTS)

Every agent MUST follow this after completing any task:
1. Write findings to your designated output .md file in roam/
2. Include date, status, key findings, and action items
3. Captain reads all output files and compiles roam/captain_status.md
4. Quinn asks Captain for status — Captain gives instant briefing
5. If your work is blocked, write BLOCKED + reason in your output file

**Flow: Agent does work → writes to output .md → Captain reads all → Quinn asks Captain**

## Cursor Cloud Mapping

| Cursor Sidebar Name | Assigned Role | Archive? |
|---------------------|--------------|----------|
| Medic | Agent 01 — Tester | NO |
| Scanguard | Agent 08 — Security | NO |
| UI | Agent 03 — Design Enforcer | NO |
| Ideas | Agent 04 — Builder | NO |
| Research | Agent 02 — Researcher | NO |
| deployer | Agent 05 — Debugger | NO |
| Office ops procedures | Agent 06 — Growth Hacker | NO |
| Office documentation p... | Agent 07 — Monetization | NO |
| Dev environment set... | Agent 09 — Localization | NO |
| communications | Agent 10 — Analytics | NO |
| Security audit scan | Agent 11 — Content | NO |
| Office innovate document | Agent 12 — Investor | NO |
| cap | Captain — Intelligence Hub | NO |
| Shipit document guid... | -- | ARCHIVE |
| Office guardian documentation | -- | ARCHIVE |

## File Ownership

| File/Directory | Owner Agent | Notes |
|----------------|-------------|-------|
| lib/claude.ts | Orchestrator | P0 critical — generate flow |
| lib/store.ts | Orchestrator | Shared ownership |
| lib/types/itinerary.ts | Orchestrator | Runtime validator |
| app/(tabs)/generate.tsx | Orchestrator | Generate flow entry point |
| supabase/functions/claude-proxy/ | Agent 08 (Security) | Rate limiting + JWT |
| supabase/functions/*/ | Agent 08 (Security) | All edge functions |
| supabase/migrations/ | Agent 08 (Security) | RLS policies |
| lib/flights.ts | Agent 07 (Monetization) | Skyscanner affiliate |
| lib/booking-links.ts | Agent 07 (Monetization) | All affiliate links |
| lib/affiliate-tracking.ts | Agent 07 (Monetization) | Click tracking |
| lib/revenue-cat.ts | Agent 07 (Monetization) | Subscriptions |
| lib/pro-gate.ts | Agent 07 (Monetization) | Feature gating |
| app/paywall.tsx | Agent 07 (Monetization) | Paywall UI |
| lib/constants.ts | Agent 03 (Design) | Design tokens |
| components/ui/ | Agent 03 (Design) | UI primitives |
| components/premium/ | Agent 03 (Design) | Premium components |
| lib/analytics.ts | Agent 10 (Analytics) | Event tracking |
| lib/ab-test.ts | Agent 10 (Analytics) | A/B tests |
| lib/prep/ | Agent 09 (Localization) | Offline prep data |
| lib/emergency-data.ts | Agent 09 (Localization) | Emergency numbers |
| lib/language-data.ts | Agent 09 (Localization) | Language phrases |
| lib/currency.ts | Agent 09 (Localization) | Currency conversion |
| app/(tabs)/index.tsx | Agent 06 (Growth) | Discover/acquisition |
| app/referral.tsx | Agent 06 (Growth) | Referral program |
| .github/workflows/ | Agent 05 (Debugger) | CI pipeline |
| .eslintrc.js | Agent 05 (Debugger) | Lint config |
| roam/captain_status.md | Captain | Live status board |
| roam/*.md (all reports) | Captain (read), Individual agents (write) | Captain reads everything |

## Current Sprint — REWORK PASS (2026-03-13)

| Priority | Task | Owner | Status |
|----------|------|-------|--------|
| P0 | Best free image API research | Agent 02 (Researcher) | ASSIGNED |
| P0 | Full anti-AI-slop audit — fix 20 violations | Agent 03 (Design Enforcer) | ASSIGNED |
| P0 | Image loading + Flights/Stays/Food rework | Agent 04 (Builder) | ASSIGNED |
| P1 | Post-merge verification | Agent 05 (Debugger) | ASSIGNED |
| P1 | First-time UX audit → growth_dashboard.md | Agent 06 (Growth) | ASSIGNED |
| P1 | Admin test bypass for rate limiting | Agent 08 (Security) | ASSIGNED |
| P1 | Prep tab live data (weather, time, phrases) | Agent 09 (Localization) | ASSIGNED |
| P1 | Full copy audit → copy_library.md | Agent 11 (Content) | ASSIGNED |
| P5 | Booking.com real AID | BLOCKED — Quinn manual | BLOCKED |

### Agent 02 — RESEARCHER: Free Image API
Find best free image API for travel destinations. Evaluate: Unsplash (50 req/hr), Pexels (200 req/hr), Pixabay. READ `supabase/functions/destination-photo/index.ts` first — edge function already exists. Deliverable: `research_report.md` with API choice, rate limits, implementation plan.

### Agent 03 — DESIGN ENFORCER: Anti-AI-Slop Audit
Hunt and fix: generic placeholder text, missing image grey boxes, template-y screens, inconsistent card heights, non-skeleton loading states. Generate tab should feel conversational not form-like. Flights and Stays tabs need full visual rework. Fix top 20 violations. Open PR.

### Agent 04 — BUILDER: Four Major Builds
1. **Image loading system** — fix edge function integration, add destination gradient fallbacks, add caching
2. **Flights tab rework** — remove broken APIs/map, add hero search + popular routes + Skyscanner deep links
3. **Stays tab rework** — remove broken elements, add curated sections + Booking.com deep links
4. **Food tab live data** — wire enrich-venues edge function, add Overpass API for trending restaurants

### Agent 05 — DEBUGGER: Post-Merge Verification
After Builder PRs: run tsc, verify images on Tokyo/Paris/Bali/NYC/Barcelona, verify flights/stays/food tabs load clean. Update system_health.md.

### Agent 06 — GROWTH: First-Time UX Audit
Audit tryroam.netlify.app as a first-time Gen Z user. Does discover communicate value? Do cards make you tap? Does generate empty state guide you? Is the share moment obvious? Write recommendations to growth_dashboard.md. Focus: what makes a user screenshot and post this?

### Agent 08 — SECURITY: Admin Test Bypass
Add admin email whitelist to `supabase/functions/claude-proxy/index.ts`. Read `ADMIN_TEST_EMAILS` env var, skip rate limit for matching emails. Add `qbyars08@gmail.com` to Supabase secrets. Not visible to regular users.

### Agent 09 — LOCALIZATION: Prep Tab Live Data
Wire weather-intel edge function into prep header. Add "Right now in [destination]" section (time, weather, date). Verify emergency numbers for top 20 destinations. Add "Useful phrases" section with pronunciation placeholder.

### Agent 11 — CONTENT: Full Copy Audit
Keep "Travel like you know someone there". Every destination needs specific non-generic hook line. Generate empty state = invitation not form. All error messages: human, specific, actionable. Remove any AI-sounding copy. Write to copy_library.md.

## In Progress

| Task | Agent | Notes |
|------|-------|-------|
| Image API research | Agent 02 (Research) | Evaluating Unsplash/Pexels/Pixabay |
| Anti-slop audit | Agent 03 (UI) | Hunting 20 violations across all screens |
| Major builds x4 | Agent 04 (Ideas) | Image system → Flights → Stays → Food |
| Admin bypass | Agent 08 (Scanguard) | claude-proxy rate limit whitelist |

## Completed This Session

| Task | What Shipped |
|------|-------------|
| P0: Generate flow integrity | 44 failure points traced, 4 critical fixes |
| P1: Kill Amadeus | Edge function deleted, 8 files updated, affiliate links wired |
| P2: CI pipeline | .eslintrc.js + .github/workflows/ci.yml created |
| Agent system | 15 .mdc rule files (12 agents + orchestrator + captain + roam base) |
| Captain system | captain.mdc + captain_status.md — central intelligence hub |

## Blocked

| Task | Blocker | Owner |
|------|---------|-------|
| P5: Booking.com AID | Quinn needs to sign up at partners.booking.com | Quinn |
| Amadeus env cleanup | Remove AMADEUS_KEY + AMADEUS_SECRET from Supabase Dashboard | Quinn |

## Agent Communication Protocol

- Agents write findings to their output .md file in roam/
- Captain reads ALL output files and compiles captain_status.md
- Quinn asks Captain for status — gets instant briefing
- Agents do NOT open GitHub comments to ask questions
- Agents DO open PRs with direct fixes
- Conflicts: security > infra > features > polish
- Orchestrator reviews all PRs before merge
- File ownership in table above — agent with ownership has priority
- When multiple agents need the same file: coordinate via AGENT_BOARD.md, security wins
