# ROAM AGENT BOARD

Last updated: 2026-03-14

## Agent Registry

| # | Agent | Model | Rule File | Cursor Cloud Name | Output File | Status |
|---|-------|-------|-----------|-------------------|-------------|--------|
| 01 | Tester | claude-sonnet-4-5 | agent-01-tester.mdc | ROAM — 01 Tester | /test_results.md, /bugs_found.md | REBUILD |
| 02 | Researcher | claude-sonnet-4-5 | agent-02-researcher.mdc | ROAM — 02 Researcher | /research_report.md | REBUILD |
| 03 | Design | claude-sonnet-4-5 | agent-03-design-enforcer.mdc | ROAM — 03 Design | /design_audit.md | REBUILD |
| 04 | Builder | claude-opus-4-5 | agent-04-builder.mdc | Ideas | PRs + /analytics_spec.md | KEEP |
| 05 | Debugger | claude-sonnet-4-5 | agent-05-debugger.mdc | ROAM — 05 Debugger | /system_health.md, /incidents.md | REBUILD |
| 06 | Growth | claude-sonnet-4-5 | agent-06-growth.mdc | ROAM — 06 Growth | /growth_dashboard.md | REBUILD |
| 07 | Monetization | claude-sonnet-4-5 | agent-07-monetization.mdc | ROAM — 07 Monetization | /monetization_model.md | REBUILD |
| 08 | Security | claude-sonnet-4-5 | agent-08-security.mdc | ROAM — 08 Security | /security_audit.md | REBUILD |
| 09 | Localization | claude-sonnet-4-5 | agent-09-localization.mdc | ROAM — 09 Localization | /localization_audit.md | REBUILD |
| 10 | Analytics | claude-sonnet-4-5 | agent-10-analytics.mdc | ROAM — 10 Analytics | /analytics_spec.md | REBUILD |
| 11 | Content | claude-sonnet-4-5 | agent-11-content.mdc | ROAM — 11 Content | /copy_library.md | REBUILD |
| 12 | Investor | claude-sonnet-4-5 | agent-12-investor.mdc | ROAM — 12 Investor | /investor_narrative.md, /weekly_memo.md | REBUILD |
| 13 | DACH Growth | claude-sonnet-4-5 | (new) | ROAM — 13 DACH Growth | /dach_influencers.md, /dach_scripts.md, /ugc_research.md | NEW |
| 14 | UGC Engine | claude-sonnet-4-5 | (new) | ROAM — 14 UGC Engine | /creator_outreach.md, /ambassador_program.md | NEW |
| CP | Captain | claude-sonnet-4-5 | captain.mdc | ROAM — Captain | /captain_status.md | REBUILD |
| -- | Orchestrator | claude-opus-4-5 | orchestrator.mdc | (Claude Code) | /AGENT_BOARD.md | ACTIVE |

## Reporting Protocol (ALL AGENTS)

Every agent MUST follow this after completing any task:
1. Write findings to your designated output .md file in roam/
2. Include date, status, key findings, and action items
3. Captain reads all output files and compiles roam/captain_status.md
4. Quinn asks Captain for status — Captain gives instant briefing
5. If your work is blocked, write BLOCKED + reason in your output file

**Flow: Agent does work → writes to output .md → Captain reads all → Quinn asks Captain**

## Cursor Cloud Mapping (POST-REBUILD)

| Cursor Sidebar Name | Assigned Role | Model | Status |
|---------------------|--------------|-------|--------|
| Ideas | Agent 04 — Builder | claude-opus-4-5 | KEEP |
| ROAM — 01 Tester | Agent 01 — Tester | claude-sonnet-4-5 | CREATE |
| ROAM — 02 Researcher | Agent 02 — Researcher | claude-sonnet-4-5 | CREATE |
| ROAM — 03 Design | Agent 03 — Design | claude-sonnet-4-5 | CREATE |
| ROAM — 05 Debugger | Agent 05 — Debugger | claude-sonnet-4-5 | CREATE |
| ROAM — 06 Growth | Agent 06 — Growth | claude-sonnet-4-5 | CREATE |
| ROAM — 07 Monetization | Agent 07 — Monetization | claude-sonnet-4-5 | CREATE |
| ROAM — 08 Security | Agent 08 — Security | claude-sonnet-4-5 | CREATE |
| ROAM — 09 Localization | Agent 09 — Localization | claude-sonnet-4-5 | CREATE |
| ROAM — 10 Analytics | Agent 10 — Analytics | claude-sonnet-4-5 | CREATE |
| ROAM — 11 Content | Agent 11 — Content | claude-sonnet-4-5 | CREATE |
| ROAM — 12 Investor | Agent 12 — Investor | claude-sonnet-4-5 | CREATE |
| ROAM — 13 DACH Growth | Agent 13 — DACH Growth | claude-sonnet-4-5 | CREATE |
| ROAM — 14 UGC Engine | Agent 14 — UGC Engine | claude-sonnet-4-5 | CREATE |
| ROAM — Captain | Captain — Intelligence Hub | claude-sonnet-4-5 | CREATE |

### Old agents to DELETE
Medic, Scanguard, UI, Research, deployer, Office ops procedures, Office documentation p..., Dev environment set..., communications, Security audit scan, Office innovate document, cap, Shipit document guid..., Office guardian documentation

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
| roam/dach_strategy.md | Agent 13 (DACH Growth) | DACH go-to-market plan |
| roam/dach_influencers.md | Agent 13 (DACH Growth) | DACH creator database |
| roam/dach_scripts.md | Agent 13 (DACH Growth) | German TikTok scripts |
| roam/ugc_research.md | Agent 13 + 14 (shared) | UGC platform research |
| roam/creator_outreach.md | Agent 14 (UGC Engine) | Creator outreach system |
| roam/ambassador_program.md | Agent 14 (UGC Engine) | Ambassador program spec |
| app/admin.tsx | Agent 14 (UGC Engine) | Content generator tool |

## Current Sprint — AGENT REBUILD + DACH LAUNCH (2026-03-14)

| Priority | Task | Owner | Status |
|----------|------|-------|--------|
| P0 | Agent system rebuild (delete old, create new) | Quinn manual | PENDING |
| P0 | DACH go-to-market strategy | Orchestrator | DONE |
| P0 | Test new prep components | Agent 01 (Tester) | PENDING REBUILD |
| P0 | Design audit new prep cards | Agent 03 (Design) | PENDING REBUILD |
| P1 | German localization (de.ts) | Agent 09 (Localization) | PENDING REBUILD |
| P1 | German App Store copy | Agent 11 (Content) | PENDING REBUILD |
| P1 | DACH influencer research | Agent 13 (DACH Growth) | NEW |
| P1 | German TikTok scripts x10 | Agent 13 (DACH Growth) | NEW |
| P1 | Creator outreach system | Agent 14 (UGC Engine) | NEW |
| P1 | Ambassador program spec | Agent 14 (UGC Engine) | NEW |
| P2 | GDPR compliance audit | Agent 08 (Security) | PENDING REBUILD |
| P2 | DACH analytics + UTM tracking | Agent 10 (Analytics) | PENDING REBUILD |
| P2 | Creator payment model | Agent 07 (Monetization) | PENDING REBUILD |
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
