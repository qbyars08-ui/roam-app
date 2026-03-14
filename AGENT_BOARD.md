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

## Current Sprint

| Priority | Task | Owner | Status |
|----------|------|-------|--------|
| P3 | PostHog analytics instrumentation | Agent 04 (Builder) | IN PROGRESS |
| P4 | Rate limiting on 4 edge functions | Agent 08 (Security) | IN PROGRESS |
| P5 | Booking.com real AID | BLOCKED — Quinn manual | BLOCKED |
| -- | Design system audit | Agent 03 (Design Enforcer) | IN PROGRESS |
| -- | Unit test coverage | Agent 01 (Tester) | IN PROGRESS |
| -- | Competitor + API research | Agent 02 (Researcher) | STARTING |
| -- | CI + performance audit | Agent 05 (Debugger) | STARTING |
| -- | Growth strategy + ASO | Agent 06 (Growth) | STARTING |
| -- | Affiliate optimization | Agent 07 (Monetization) | STARTING |
| -- | Prep data coverage audit | Agent 09 (Localization) | STARTING |
| -- | Event taxonomy review | Agent 10 (Analytics) | STARTING |
| -- | Copy audit + App Store listing | Agent 11 (Content) | STARTING |
| -- | Weekly memo + pitch doc | Agent 12 (Investor) | STARTING |

## In Progress

| Task | Agent | Notes |
|------|-------|-------|
| PostHog analytics | Agent 04 (Ideas) | Installing SDK, creating lib/analytics.ts |
| Rate limiting | Agent 08 (Scanguard) | Adding to voice-proxy, weather-intel, destination-photo, enrich-venues |
| Design audit | Agent 03 (UI) | Scanning for hardcoded values |
| Unit tests | Agent 01 (Medic) | parseItinerary + buildTripPrompt |

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
