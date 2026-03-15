# ROAM AGENT BOARD

Last updated: 2026-03-15 (overnight quality pass)

## Agent Registry

| # | Agent | Model | Rule File | Cursor Cloud Name | Output File | Status |
|---|-------|-------|-----------|-------------------|-------------|--------|
| 01 | Tester | claude-sonnet-4-5 | agent-01-tester.mdc | ROAM — 01 Tester | /test_results.md, /bugs_found.md | ACTIVE |
| 02 | Researcher | claude-sonnet-4-5 | agent-02-researcher.mdc | ROAM — 02 Researcher | /research_report.md | ACTIVE |
| 03 | Design | claude-sonnet-4-5 | agent-03-design-enforcer.mdc | ROAM — 03 Design | /design_audit.md | ACTIVE |
| 04 | Builder | claude-opus-4-5 | agent-04-builder.mdc | Ideas | PRs + /analytics_spec.md | ACTIVE |
| 05 | Debugger | claude-sonnet-4-5 | agent-05-debugger.mdc | ROAM — 05 Debugger | /system_health.md, /incidents.md | ACTIVE |
| 06 | Growth | claude-sonnet-4-5 | agent-06-growth.mdc | ROAM — 06 Growth | /growth_dashboard.md | ACTIVE |
| 07 | Monetization | claude-sonnet-4-5 | agent-07-monetization.mdc | ROAM — 07 Monetization | /monetization_model.md | ACTIVE |
| 08 | Security | claude-sonnet-4-5 | agent-08-security.mdc | ROAM — 08 Security | /security_audit.md | ACTIVE |
| 09 | Localization | claude-sonnet-4-5 | agent-09-localization.mdc | ROAM — 09 Localization | /localization_audit.md | ACTIVE |
| 10 | Analytics | claude-sonnet-4-5 | agent-10-analytics.mdc | ROAM — 10 Analytics | /analytics_spec.md | ACTIVE |
| 11 | Content | claude-sonnet-4-5 | agent-11-content.mdc | ROAM — 11 Content | /copy_library.md | ACTIVE |
| 12 | Investor | claude-sonnet-4-5 | agent-12-investor.mdc | ROAM — 12 Investor | /investor_narrative.md, /weekly_memo.md | ACTIVE |
| 13 | DACH Growth | claude-sonnet-4-5 | (new) | ROAM — 13 DACH Growth | /dach_influencers.md, /dach_scripts.md, /ugc_research.md | ACTIVE |
| 14 | UGC Engine | claude-sonnet-4-5 | (new) | ROAM — 14 UGC Engine | /creator_outreach.md, /ambassador_program.md | ACTIVE |
| CP | Captain | claude-sonnet-4-5 | captain.mdc | ROAM — Captain | /captain_status.md | ACTIVE |
| -- | Orchestrator | claude-opus-4-5 | orchestrator.mdc | (Claude Code) | /AGENT_BOARD.md | ACTIVE |

## Current Sprint — OVERNIGHT QUALITY PASS (2026-03-15)

### What Just Shipped (Claude Code Orchestrator)
- Flights tab complete rework: hero search, Skyscanner deep links, popular routes grid, inspiration cards
- General polish pass across all screens (copy, empty states, loading states)
- Performance: lazy loading 3 heaviest screens
- P0 Bug fixes: AI chat + sign-in flow + deploy with real Supabase credentials
- netlify.toml: build.ignore for smart rebuilds

### What's Live
- **tryroam.netlify.app** — deployed with real Supabase credentials (verified in bundle)
- Chat works (guest auto-upgrades to anonymous auth)
- Sign-in shows real auth (Apple/Google/Email), not waitlist
- Flights tab: hero search + 6 popular routes + 4 inspiration cards + Skyscanner affiliate links

---

## AGENT TASKS (Pick up immediately)

### Agent 01 — TESTER: Post-Deploy Smoke Test
1. Open tryroam.netlify.app in incognito
2. Test: Discover tab loads destinations with images
3. Test: Plan tab — tap "Quick" → enter "Tokyo" → verify form works
4. Test: Flights tab — verify hero renders, popular routes clickable, Skyscanner links open
5. Test: People tab — verify cards render, Connect button has haptic
6. Test: Prep tab — pick a destination, verify safety score + emergency numbers render
7. Test: Chat mode — type a message → verify response comes back (not "Something went wrong")
8. Write findings to `/test_results.md`

### Agent 02 — RESEARCHER: Destination Image CDN
Current: Unsplash source URLs (unreliable, rate limited, no caching).
Research: Cloudinary free tier vs Imgix vs self-hosted Supabase Storage.
Goal: Reliable, fast, cached destination images with fallback gradients.
Evaluate: latency, free tier limits, CDN edge locations, React Native Image compatibility.
Write to `/research_report.md`.

### Agent 03 — DESIGN ENFORCER: Post-Polish Audit
The overnight pass improved all screens. Now audit for:
1. Card height consistency across Discover, People, Flights tabs
2. Font size hierarchy (headers 28-40pt, body 13-15pt, labels 11-12pt)
3. Spacing rhythm (all gaps should be SPACING tokens, never magic numbers)
4. Icon consistency (all lucide, strokeWidth={2}, size={20} default)
5. Color token usage (grep for any remaining hardcoded hex/rgba)
6. Button press states (all should have haptic + scale/opacity feedback)
Write top 15 violations to `/design_audit.md`. Open PR for fixes.

### Agent 04 — BUILDER: Three Builds
1. **Stays tab rework** — same pattern as new Flights tab: hero + curated stays + Booking.com deep links (no broken APIs)
2. **Food tab rework** — hero + curated restaurant sections + Google Maps deep links
3. **Image loading resilience** — add gradient fallbacks when Unsplash fails, retry logic, skeleton during load
All three are independent. Can run in parallel or sequence.

### Agent 05 — DEBUGGER: TypeScript + Bundle Health
1. Run `npx tsc --noEmit` — must be 0 errors
2. Run `npx expo export --platform web` — verify clean build
3. Check bundle size: `ls -la dist/_expo/static/js/web/` — report entry point size
4. Verify no `placeholder.supabase.co` in deployed bundle
5. Check for unused imports across all tab screens
Write to `/system_health.md`.

### Agent 06 — GROWTH: Conversion Funnel Audit
Visit tryroam.netlify.app as a first-time user. Document:
1. Time from landing to first trip generated (target: <60 seconds)
2. Is the value prop clear within 3 seconds?
3. Does the Discover tab make you want to tap a destination?
4. After trip generation, is the share moment obvious?
5. Is the waitlist/signup friction appropriate?
6. Screenshot every screen, annotate what works and what doesn't
Write to `/growth_dashboard.md`.

### Agent 07 — MONETIZATION: Affiliate Link Audit
1. Verify all Skyscanner links include `associateId=roam`
2. Check Flights tab popular routes → each "Search" button opens correct Skyscanner URL
3. Verify FlightCard, FlightPriceCard, FlightDealCard all use `getSkyscannerFlightUrl()`
4. Check Booking.com links (stays tab) for AID parameter
5. Audit affiliate click tracking: are PostHog events firing?
Write to `/monetization_model.md`.

### Agent 08 — SECURITY: Auth + Edge Function Audit
1. Verify `ensureValidSession()` in `lib/claude.ts` upgrades guests correctly
2. Test: guest user → chat → verify anonymous auth JWT is created
3. Check edge function rate limiting still works for non-admin users
4. Audit RLS policies on trips, chat_messages, waitlist_emails tables
5. Check for any exposed API keys in client-side code
6. Add `ADMIN_TEST_EMAILS=qbyars08@gmail.com` to Supabase secrets (if not done)
Write to `/security_audit.md`.

### Agent 09 — LOCALIZATION: Translation Coverage
1. Grep for hardcoded English strings in all tab screens (index, plan, people, flights, prep)
2. Check all i18n keys exist in en.ts, es.ts, fr.ts, ja.ts
3. Verify new Flights tab copy has i18n keys (hero heading, popular routes, inspiration)
4. Add missing German (de.ts) translations for DACH launch
5. Verify prep tab emergency data for top 10 destinations
Write to `/localization_audit.md`.

### Agent 10 — ANALYTICS: Event Coverage
1. Verify screen_view events fire on all 5 tabs
2. Check: trip_generation_completed, flight_search, rate_limit_hit events
3. Add missing events: flights_popular_route_tapped, flights_skyscanner_opened, flights_inspiration_tapped
4. Verify PostHog is initialized and capturing events
5. Draft UTM tracking spec for all external links (Skyscanner, Booking, Google Maps)
Write to `/analytics_spec.md`.

### Agent 11 — CONTENT: Copy Polish Pass
All screens got polished overnight. Now do a final copy review:
1. Every destination hook line in DESTINATIONS array — is it specific, not generic?
2. Every empty state — does it invite action, not just describe emptiness?
3. Every error message — is it human, not technical?
4. Flights tab popular routes — do price estimates feel real?
5. People tab bios — do they sound like real Gen Z travelers?
6. Plan tab — does the empty state make a first-time user excited?
Write to `/copy_library.md`.

### Agent 12 — INVESTOR: Weekly Memo
Write weekly memo covering:
1. Overnight quality pass shipped (flights rework, polish, performance)
2. P0 bugs fixed (chat, auth, deploy pipeline)
3. User-facing improvements: 6 screens polished, Skyscanner affiliate flow live
4. Technical wins: lazy loading, bundle optimization, smart rebuild
5. Next week: stays/food tab rework, image CDN, DACH soft launch
Write to `/weekly_memo.md`.

### Agent 13 — DACH GROWTH: German Launch Prep
1. Audit German App Store listing copy (title, subtitle, keywords, description)
2. Write 5 German TikTok scripts for launch (15-30 seconds each)
3. Research top 10 German travel micro-influencers (10k-100k followers)
4. Draft German-language waitlist landing page copy
5. Identify 3 German travel subreddits/forums for organic seeding
Write to `/dach_scripts.md` and `/dach_influencers.md`.

### Agent 14 — UGC ENGINE: Creator Outreach
1. Draft 3 outreach email templates (micro, mid-tier, macro influencers)
2. Create ambassador program spec (tiers, rewards, tracking)
3. Design creator content brief template (what to show, brand guidelines, hashtags)
4. Research competitor creator programs (Hopper, Wanderlog, TripAdvisor)
Write to `/creator_outreach.md` and `/ambassador_program.md`.

---

## File Ownership

| File/Directory | Owner Agent | Notes |
|----------------|-------------|-------|
| app/(tabs)/flights.tsx | Orchestrator | Just rebuilt — hero + Skyscanner links |
| app/(tabs)/index.tsx | Agent 06 (Growth) | Discover/acquisition |
| app/(tabs)/plan.tsx | Orchestrator | Generate flow |
| app/(tabs)/people.tsx | Agent 06 (Growth) | Social layer |
| app/(tabs)/prep.tsx | Agent 09 (Localization) | Offline prep data |
| lib/claude.ts | Orchestrator | P0 critical — generate flow |
| lib/store.ts | Orchestrator | Shared ownership |
| lib/flights.ts | Agent 07 (Monetization) | Skyscanner affiliate |
| lib/constants.ts | Agent 03 (Design) | Design tokens |
| components/ui/ | Agent 03 (Design) | UI primitives |
| components/premium/ | Agent 03 (Design) | Premium components |
| supabase/functions/ | Agent 08 (Security) | Edge functions + RLS |
| lib/analytics.ts | Agent 10 (Analytics) | Event tracking |
| lib/i18n/ | Agent 09 (Localization) | Translations |

## Blocked

| Task | Blocker | Owner |
|------|---------|-------|
| Booking.com real AID | Quinn needs to sign up at partners.booking.com | Quinn |
| Waitlist DB writes | Apply migration `20260325000001_waitlist_comprehensive_fix.sql` in Supabase SQL Editor | Quinn |
| Admin rate limit bypass | Add `ADMIN_TEST_EMAILS=qbyars08@gmail.com` to Supabase secrets | Quinn |

## Agent Communication Protocol

- Agents write findings to their output .md file in roam/
- Captain reads ALL output files and compiles captain_status.md
- Quinn asks Captain for status — gets instant briefing
- Agents do NOT open GitHub comments to ask questions
- Agents DO open PRs with direct fixes
- Conflicts: security > infra > features > polish
- Orchestrator reviews all PRs before merge
- File ownership in table above — agent with ownership has priority
