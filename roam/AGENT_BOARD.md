# ROAM Agent Board

Updated: 2026-03-15 (evening session)

---

## System Status: GREEN

- TypeScript: 0 errors
- Live URL: https://tryroam.netlify.app
- Open PRs: 14 (from overnight Cursor agents)
- All 6 tabs rendering with rich visual content
- All 37 destination images loading (200 OK)
- 10/11 APIs working (emergencynumberapi CORS fail on web only — fallback data covers it)
- Stays/Food/Flights empty states overhauled with Unsplash imagery
- TripGeneratingLoader wired into generate flow
- Trending + timing badges live on Discover cards
- DestinationIntel (timezone, AQI, holidays, cost) live on itinerary

---

## PR Merge Priority

| Priority | PR | Title | Files | +/- | Action |
|----------|-----|-------|-------|-----|--------|
| P0 | #36 | Design audit violations | 12 | +648/-199 | REVIEW — code changes, high impact |
| P0 | #33 | German localization | 7 | +722/-0 | REVIEW — needed for DACH launch |
| P1 | #32 | App copy and store text | 1 | +423/-1 | REVIEW — copy improvements |
| P1 | #27 | Application health check | 1 | +55/-32 | MERGE — system health update |
| P1 | #24 | CAPTAIN | 1 | +33/-38 | MERGE — captain status update |
| P2 | #31 | Agent 14 UGC | 2 | +629/-0 | REVIEW — creator programs (docs only) |
| P2 | #29 | Investor narrative enhancement | 2 | +102/-39 | MERGE — narrative update |
| P2 | #26 | ROAM monetization model | 4 | +268/-0 | REVIEW — monetization docs |
| P2 | #25 | Gen Z growth audit | 1 | +92/-0 | MERGE — growth insights |
| P2 | #30 | GDPR DACH compliance | 1 | +249/-0 | REVIEW — compliance audit |
| P2 | #28 | DACH analytics specification | 1 | +393/-0 | MERGE — analytics spec |
| P3 | #35 | DACH travel micro-influencers | 1 | +469/-0 | MERGE — influencer list |
| P3 | #34 | Live app test matrix | 3 | +383/-0 | MERGE — test results |
| P3 | #23 | Destination image APIs | 1 | +126/-0 | MERGE — research doc |

---

## Agent Assignments (Current Sprint)

### 01 — ROAM Tester
**STATUS:** ASSIGNED
**TASK:** Full regression test after visual overhaul.
- Stays tab: verify all 6 stay type images load, category cards render, neighborhood guide works
- Food tab: verify 3 food category cards render with images, empty state scrollable
- Flights tab: verify 4 popular route cards render with images, auto-fill on tap works
- Generate flow: verify TripGeneratingLoader shows full-screen on generate, then navigates to itinerary
- Discover tab: verify trending badges (flame icon) on destinations with trendScore >= 85
- Discover tab: verify "Perfect timing" badges when current month matches bestMonths
- All 6 tabs load without crash on web and native
**OUTPUT:** roam/test_results.md
**PRIORITY:** P0

### 02 — ROAM Researcher
**STATUS:** ASSIGNED
**TASK:** Find and evaluate real-time flight price APIs that are free or have generous free tiers.
- Google Flights scraping alternatives (Serpapi, Skyscanner API, Kiwi Tequila)
- Compare: rate limits, pricing, data freshness, coverage
- Recommend best option for replacing mock flight data
- Also research: live hotel price APIs (Booking.com Demand API, Tripadvisor, Kayak)
**OUTPUT:** roam/research_report.md
**PRIORITY:** P1

### 03 — ROAM Design
**STATUS:** ASSIGNED
**TASK:** Visual polish pass on remaining screens.
- Generate mode select screen: add destination photos behind the Quick/Chat cards
- Itinerary screen: verify DestinationIntel section renders cleanly with all 5 data sources
- Profile screen: add user stats (trips generated, countries visited, total days planned)
- Audit all empty states across app — every one should have imagery, not just icons
- Verify all animations are smooth (card press scales, fade-ins, skeleton shimmers)
- Hunt: any remaining hardcoded hex values, non-COLORS tokens, static grey blocks
**OUTPUT:** roam/design_audit.md + PR
**PRIORITY:** P0

### 04 — ROAM Builder (Ideas — Opus)
**STATUS:** ASSIGNED
**TASK:** Priority stack:
1. Replace mock flight data with real Skyscanner/Kiwi API integration (once Researcher delivers API recommendation)
2. Stays tab: wire Booking.com search API for real hotel results (currently empty state only)
3. Food tab: wire Google Places or Yelp Fusion for real restaurant data near trip destination
4. Add animated gradient backgrounds to key screens (generate loading, itinerary hero)
5. Implement pull-to-refresh on Discover tab
**OUTPUT:** PRs to main
**PRIORITY:** P0

### 05 — ROAM Debugger
**STATUS:** ASSIGNED
**TASK:** Performance + stability audit.
- Bundle size analysis: identify largest modules, suggest code splitting
- Memory leak check: long-running generate flow, rapid tab switching
- Image loading performance: are all Unsplash images loading within 2s?
- Edge function cold start times
- Verify offline graceful degradation for all new visual content
**OUTPUT:** roam/system_health.md (GREEN/YELLOW/RED)
**PRIORITY:** P0

### 06 — ROAM Growth
**STATUS:** ASSIGNED
**TASK:** Launch content creation.
1. Create 5 TikTok video scripts showing ROAM in action (screen recordings)
2. Write Instagram carousel copy: "How to plan a trip in 30 seconds"
3. Design referral share card — what users see when they share a trip
4. A/B test copy for the waitlist CTA on tryroam.netlify.app
**OUTPUT:** roam/growth_dashboard.md
**PRIORITY:** P1

### 07 — ROAM Monetization
**STATUS:** ASSIGNED
**TASK:** Conversion funnel optimization.
- Analyze: where do free users hit the paywall? Is the UX smooth?
- Design "Pro preview" — show one locked premium feature per free trip (tease value)
- Write paywall copy variants (3 versions) for A/B testing
- Map affiliate revenue potential: Booking.com, Skyscanner, GetYourGuide commission rates
**OUTPUT:** roam/monetization_model.md
**PRIORITY:** P1

### 08 — ROAM Security
**STATUS:** ASSIGNED
**TASK:** Pre-launch security hardening.
- Verify all edge functions validate JWT before processing
- Check for exposed API keys in client bundle (run `npx expo export` and search dist/)
- Rate limiting on claude-proxy edge function
- Input sanitization on all user text fields (destination, must-visit, special requests)
- GDPR: verify data deletion endpoint works end-to-end
**OUTPUT:** roam/security_audit.md
**PRIORITY:** P1

### 09 — ROAM Localization
**STATUS:** ASSIGNED
**TASK:** Localization quality check.
- Verify German (de.ts) covers all new UI strings added in visual overhaul
- Add missing keys: popular routes labels, food category names, stay type names
- Verify Spanish (es.ts), French (fr.ts), Japanese (ja.ts) have same coverage
- Test: switch language in Profile → verify every screen renders correctly
**OUTPUT:** Updated locale files + PR
**PRIORITY:** P1

### 10 — ROAM Analytics
**STATUS:** ASSIGNED
**TASK:** Event tracking for new visual features.
- Track: which popular flight routes get tapped most
- Track: which food/stay categories get tapped
- Track: trending badge click-through rate on Discover
- Track: TripGeneratingLoader completion vs. abandonment
- Verify PostHog events are firing correctly
**OUTPUT:** roam/analytics_spec.md
**PRIORITY:** P2

### 11 — ROAM Content
**STATUS:** ASSIGNED
**TASK:** Write copy for all new visual elements.
- Popular flight routes: write compelling tag lines (not just "Most Popular")
- Food categories: write sub-copy for each category card
- Stay categories: write sub-copy for each stay type card
- Neighborhood guide: write descriptions for sample neighborhoods
- All copy must be ROAM voice: punchy, specific, zero filler
**OUTPUT:** roam/copy_library.md + PR
**PRIORITY:** P1

### 12 — ROAM Investor
**STATUS:** ASSIGNED
**TASK:** Update investor narrative with visual overhaul wins.
- Before/after screenshots of Stays, Food, Flights tabs
- Metrics: 37 destinations, 11 APIs, 6 tabs, 15 agents
- Highlight: "Every screen is production-quality, not a prototype"
- Update weekly memo with deployment timeline
**OUTPUT:** roam/investor_narrative.md
**PRIORITY:** P2

### 13 — ROAM DACH Growth
**STATUS:** ASSIGNED
**TASK:** Localized content for German market.
- Translate all 4 popular flight route cards to German equivalents (FRA→Tokyo, MUC→Barcelona, etc.)
- Write German App Store description (full)
- Create German-language onboarding flow copy
- Identify top 5 German travel hashtags on TikTok/Instagram
**OUTPUT:** roam/dach_growth.md
**PRIORITY:** P1

### 14 — ROAM UGC Engine
**STATUS:** ASSIGNED
**TASK:** Creator kit for launch.
- Design "Trip Card" shareable image template (destination + dates + vibe)
- Write 5 creator scripts showing ROAM trip planning flow
- Create brand asset kit: logo, colors, fonts, approved screenshots
- Design Instagram Story template for trip sharing
**OUTPUT:** roam/creator_kit.md
**PRIORITY:** P1

### CP — Captain
**STATUS:** ACTIVE
**TASK:** Orchestrate all agents, maintain system health, coordinate deploys.
**OUTPUT:** roam/captain_status.md

---

## Blocked on Quinn

| Item | Action Required | Priority |
|------|----------------|----------|
| PR reviews | 14 open PRs need review/merge (see priority table above) | P0 |
| Booking.com AID | Sign up at partners.booking.com — replace placeholder 'roam' in booking-links.ts | P1 |
| ADMIN_TEST_EMAILS | Add qbyars08@gmail.com to Supabase edge function secrets | P1 |
| RevenueCat products | Create Pro subscription in RC dashboard | P2 |
| Amadeus cleanup | Remove AMADEUS_KEY + AMADEUS_SECRET from Supabase Dashboard | P3 |
| PostHog project key | Verify key is set in environment | P2 |

---

## Completed This Session

- [x] Stays tab: replaced gradient placeholders with Unsplash images, added neighborhood guide, rewrote empty state with curated category cards
- [x] Food tab: replaced bland icon+text empty state with rich food category cards (Street Food, Local Markets, Late Night Eats)
- [x] Flights tab: replaced bland plane icon empty state with popular routes cards featuring Unsplash destination photos
- [x] Verified TripGeneratingLoader already wired into generate flow
- [x] Verified trending + timing badges already live on Discover cards
- [x] Verified DestinationIntel (timezone, AQI, sun, holidays, cost) already wired into itinerary
- [x] Verified Discover headers already updated (no generic copy)
- [x] Verified flights skeleton already using animated SkeletonCard
- [x] TypeScript: 0 errors
- [x] Updated AGENT_BOARD.md with fresh tasks for all 14 agents
