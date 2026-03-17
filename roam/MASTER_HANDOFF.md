# ROAM Master Handoff

Generated: 2026-03-15 (overnight session)

---

## System Status

| Check | Status |
|-------|--------|
| TypeScript | 0 errors |
| Web export | 6.7MB, 3898 modules |
| Live URL | https://roamapp.app |
| Latest commit | `85c9f6e` feat: latest build deployed — demo ready |
| Agent system | 15 agents defined in .mdc files, pending Cursor Cloud rebuild |
| Model config | All Sonnet except Builder (Opus) |

---

## Every Agent — Status, Completed Work, Resume Task

### Agent 01 — TESTER
- **Status:** PENDING REBUILD
- **Completed:** Test matrix defined (5 tiers), 423 tests passing per system_health.md
- **Resume task:** Run 5-tier test matrix against live app. Start with Tier 1 smoke tests (app boots, all 6 tabs load, auth flow). Then Tier 2 core flow (generate trip for Tokyo, verify itinerary renders). Test 10 destinations: Tokyo, Marrakech, Buenos Aires, Reykjavik, Bali, Cape Town, Oaxaca, Tbilisi, Queenstown, Seoul. Write results to roam/test_results.md. Run `npx tsc --noEmit` as part of Tier 1.

### Agent 02 — RESEARCHER
- **Status:** PENDING REBUILD (was evaluating image APIs)
- **Completed:** Was researching Unsplash vs Pexels vs Pixabay
- **Resume task:** Read `supabase/functions/destination-photo/index.ts` — edge function uses Google Places API (requires GOOGLE_PLACES_KEY). Evaluate: keep Google Places (paid, high quality) vs switch to free API (Unsplash direct URLs already added to all destinations in constants.ts). Research Pexels API (200 req/hr, free, good travel content). Write recommendation to roam/research_report.md with: API choice, rate limits, implementation plan, cost comparison.

### Agent 03 — DESIGN ENFORCER
- **Status:** ACTIVE (design_audit.md has 299 lines of findings)
- **Completed:** Two PRs merged. Top 10 violations fixed. 22 additional alpha sweep fixes. New tokens added (sageAlpha80, goldAlpha80, warningBorder).
- **Resume task:** Continue anti-AI-slop audit. Focus areas: (1) Flights tab — needs full visual rework, static skeleton loading, (2) Stays tab — needs curated sections not broken elements, (3) Generate empty state — should feel conversational not form-like, (4) Any remaining hardcoded hex colors or non-Lucide icons. Fix top 20 remaining violations. Open PR. Write findings to roam/design_audit.md.

### Agent 04 — BUILDER
- **Status:** KEEP (stays on Opus, Cursor agent "Ideas")
- **Completed:** Generate flow integrity (44 failure points traced, 4 critical fixes), TripGeneratingLoader wired into generate.tsx
- **Resume task:** Four major builds remaining: (1) Image loading system — edge function integration fix, destination gradient fallbacks (NOTE: direct Unsplash URLs now added to all 37 destinations in constants.ts), add caching. (2) Flights tab rework — remove broken APIs/map, add hero search + popular routes + Skyscanner deep links. (3) Stays tab rework — remove broken elements, add curated sections + Booking.com deep links. (4) Food tab live data — wire enrich-venues edge function, add Overpass API for trending restaurants.

### Agent 05 — DEBUGGER
- **Status:** PENDING REBUILD
- **Completed:** CI pipeline created (.eslintrc.js + .github/workflows/ci.yml), system_health.md maintained
- **Resume task:** Post-merge verification. Run `npx tsc --noEmit`. Verify images load on discover tab for: Tokyo, Paris, Bali, NYC, Barcelona, Rome, London, Bangkok, Lisbon, Seoul (all now have direct Unsplash URLs). Verify flights/stays/food tabs load without crashes. Check console for errors. Update roam/system_health.md with findings.

### Agent 06 — GROWTH
- **Status:** ACTIVE (growth_dashboard.md has 269 lines)
- **Completed:** ASO keywords, 5 TikTok concepts, 3 A/B tests designed, waitlist referral system with DB schema, hooks engine, smart triggers, enhanced paywall
- **Resume task:** First-time UX audit of roamapp.app. Open it as a brand new Gen Z user. Answer: Does discover communicate value? Do cards make you tap? Does generate empty state guide you? Is the share moment obvious? What makes a user screenshot and share this? Write actionable recommendations to roam/growth_dashboard.md.

### Agent 07 — MONETIZATION
- **Status:** PENDING REBUILD
- **Completed:** Skyscanner affiliate links wired, Booking.com deep links added, RevenueCat integrated, paywall designed, pro gate implemented
- **Resume task:** Creator payment model for DACH UGC campaign. Design: (1) Barter tier (free Pro account), (2) Micro-payment tier ($20-50/video), (3) Revenue share model (% of signups from creator's UTM link). Read roam/dach_strategy.md for context. Also: verify Skyscanner affiliate links are generating click events in PostHog. Write to roam/monetization_model.md.

### Agent 08 — SECURITY
- **Status:** ACTIVE (admin bypass was being implemented)
- **Completed:** Rate limiting on claude-proxy, JWT verification, CORS restrictions, input length limits, security audit
- **Resume task:** Admin bypass is ALREADY IMPLEMENTED in claude-proxy/index.ts (reads ADMIN_TEST_EMAILS env var, skips rate limit for matching emails). Verify the implementation is secure: (1) Confirm admin emails are only read from env var, never hardcoded, (2) Confirm admin bypass only skips rate limit, not auth, (3) Run GDPR compliance audit for DACH launch — check data collection, storage, deletion capability. Document in roam/security_audit.md. NOTE: Quinn still needs to add ADMIN_TEST_EMAILS=qbyars08@gmail.com to Supabase secrets manually.

### Agent 09 — LOCALIZATION
- **Status:** PENDING REBUILD
- **Completed:** i18n system (i18next + react-i18next + expo-localization), 4 languages (en, es, fr, ja), language-data.ts with survival phrases
- **Resume task:** (1) German localization — create lib/i18n/locales/de.ts for DACH launch, (2) Verify emergency numbers for top 20 destinations (lib/emergency-numbers.ts + lib/prep/emergency-data.ts), (3) Verify prep tab shows correct data for DACH destinations (Vienna, Munich, Zurich, Berlin). Write findings to roam/localization_audit.md.

### Agent 10 — ANALYTICS
- **Status:** PENDING REBUILD
- **Completed:** PostHog instrumented, event tracking across screens, analytics_spec.md outline
- **Resume task:** DACH analytics setup: (1) UTM tracking for all creator links (utm_source=tiktok, utm_medium=ugc, utm_campaign=dach_launch, utm_content=script_XX), (2) Verify PostHog captures: app_open, generate_started, generate_completed, paywall_seen, subscription_started, (3) Create DACH-specific dashboard view in PostHog. Write event taxonomy to roam/analytics_spec.md.

### Agent 11 — CONTENT
- **Status:** ACTIVE (copy_library.md has 282 lines)
- **Completed:** Full waitlist funnel copy, 5-email sequence, voice audit, brand voice rules established
- **Resume task:** Full in-app copy audit. Rules: (1) Keep "Travel like you know someone there", (2) Every destination needs specific non-generic hook line (check constants.ts — hooks are already written, verify quality), (3) Generate empty state should be invitation not form, (4) All error messages: human, specific, actionable, (5) Remove any AI-sounding copy. Also: write German App Store copy for DACH launch (title, subtitle, description, keywords). Write to roam/copy_library.md.

### Agent 12 — INVESTOR
- **Status:** PENDING REBUILD
- **Completed:** Was maintaining investor narrative
- **Resume task:** Read roam/investor_narrative.md and roam/weekly_memo.md (both just created with current data). Review and refine: (1) Verify all numbers are accurate, (2) Strengthen the "Why Now" section, (3) Add DACH market size data, (4) Draft 30-second elevator pitch version. Write updates to existing files.

### Agent 13 — DACH GROWTH (NEW)
- **Status:** NEW — first activation
- **Completed:** dach_strategy.md (277 lines), dach_scripts.md (10 German TikTok scripts), ugc_research.md (platform comparison)
- **Resume task:** (1) Research 20 German travel micro-influencers (5K-50K followers) on TikTok/Instagram. For each: handle, follower count, engagement rate, content style, contact method. Write to roam/dach_influencers.md. (2) Draft DM outreach templates in German (see ugc_research.md for template). (3) Identify top 10 German travel hashtags by volume. Read roam/dach_strategy.md for full context.

### Agent 14 — UGC ENGINE (NEW)
- **Status:** NEW — first activation
- **Completed:** ugc_research.md (platform comparison: Billo, Insense, Trend.io, Minisocial)
- **Resume task:** (1) Design creator outreach system — DM sequence (first contact → follow-up day 3 → follow-up day 7), tracking spreadsheet columns, response rate targets. Write to roam/creator_outreach.md. (2) Design ambassador program — 3 tiers (Seed/Growth/Partner), requirements per tier, rewards, escalation criteria, contract template outline. Write to roam/ambassador_program.md. Read roam/dach_strategy.md and roam/ugc_research.md for context.

### Captain — INTELLIGENCE HUB
- **Status:** PENDING REBUILD
- **Completed:** captain_status.md maintained, feature visibility audit compiled
- **Resume task:** Read ALL agent output files (every .md in roam/). Compile fresh captain_status.md with: system status (GREEN/YELLOW/RED), each agent's last output date, blockers, conflicts, PRs pending. Give Quinn's morning briefing.

---

## Open PRs and Status
No open PRs currently. All previous PRs merged to main.

---

## Blocked on Quinn

| Item | Action Required |
|------|----------------|
| Cursor agent rebuild | Delete old agents, create new ones per AGENT_REBUILD.md (15 min) |
| ADMIN_TEST_EMAILS | Add `qbyars08@gmail.com` to Supabase edge function secrets |
| Booking.com AID | Sign up at partners.booking.com for real affiliate ID |
| Amadeus cleanup | Remove AMADEUS_KEY + AMADEUS_SECRET from Supabase Dashboard |
| RevenueCat products | Create Pro subscription products in RC dashboard |
| PostHog project key | Verify PostHog key is set in environment |

---

## File Ownership Map

| File/Directory | Owner | Notes |
|----------------|-------|-------|
| lib/claude.ts | Orchestrator | P0 — generate flow |
| lib/store.ts | Orchestrator | Shared state |
| lib/types/itinerary.ts | Orchestrator | Runtime validator |
| app/(tabs)/generate.tsx | Orchestrator | Generate entry point |
| supabase/functions/claude-proxy/ | Agent 08 | Rate limiting + JWT + admin bypass |
| supabase/functions/*/ | Agent 08 | All edge functions |
| supabase/migrations/ | Agent 08 | RLS policies |
| lib/flights.ts | Agent 07 | Skyscanner affiliate |
| lib/booking-links.ts | Agent 07 | Affiliate links |
| lib/affiliate-tracking.ts | Agent 07 | Click tracking |
| lib/revenue-cat.ts | Agent 07 | Subscriptions |
| lib/pro-gate.ts | Agent 07 | Feature gating |
| app/paywall.tsx | Agent 07 | Paywall UI |
| lib/constants.ts | Agent 03 | Design tokens + destinations |
| components/ui/ | Agent 03 | UI primitives |
| components/premium/ | Agent 03 | Premium components |
| lib/analytics.ts | Agent 10 | Event tracking |
| lib/ab-test.ts | Agent 10 | A/B tests |
| lib/prep/ | Agent 09 | Offline prep data |
| lib/emergency-data.ts | Agent 09 | Emergency numbers |
| lib/language-data.ts | Agent 09 | Language phrases |
| lib/currency.ts | Agent 09 | Currency conversion |
| lib/i18n/ | Agent 09 | Translation files |
| app/(tabs)/index.tsx | Agent 06 | Discover/acquisition |
| app/referral.tsx | Agent 06 | Referral program |
| .github/workflows/ | Agent 05 | CI pipeline |
| .eslintrc.js | Agent 05 | Lint config |
| roam/captain_status.md | Captain | Live status board |
| roam/*.md | Captain (read) | Captain reads everything |
| roam/dach_strategy.md | Agent 13 | DACH go-to-market |
| roam/dach_influencers.md | Agent 13 | Creator database |
| roam/dach_scripts.md | Agent 13 | German TikTok scripts |
| roam/ugc_research.md | Agent 13 + 14 | UGC platform research |
| roam/creator_outreach.md | Agent 14 | Outreach system |
| roam/ambassador_program.md | Agent 14 | Ambassador program |

---

## Current Sprint Priorities (in order)

1. **P0** Agent system rebuild (Quinn manual — delete old, create new Sonnet agents)
2. **P0** Image system fix (all destinations now have direct Unsplash URLs)
3. **P0** Test all 6 tabs load clean with real data
4. **P1** German localization (de.ts) for DACH launch
5. **P1** DACH influencer research (20 creators identified)
6. **P1** German TikTok scripts x10 (DONE — roam/dach_scripts.md)
7. **P1** Creator outreach system design
8. **P1** Ambassador program spec
9. **P2** GDPR compliance audit
10. **P2** DACH analytics + UTM tracking
11. **P2** Creator payment model
12. **P2** Flights tab visual rework
13. **P2** Stays tab visual rework
14. **P3** Food tab live data
15. **P5** Booking.com real AID (blocked on Quinn)
