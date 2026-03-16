# ROAM Agent Board — Updated March 16, 2026 (Post-3-Features)

---

## Status: ALL 3 GROUNDBREAKING FEATURES LIVE

| Feature | Status | Screen | Key Components |
|---------|--------|--------|----------------|
| ROAM Intelligence Dashboard | LIVE | app/destination/[name].tsx | ROAMScoreBadge, SeasonalIntel, HolidayCrowdCalendar, CurrencySparkline, GoldenHourCard, GoNowFeed, RouteIntelCard, DualClockWidget, CostComparisonWidget |
| Trip Audio Guide | LIVE | app/itinerary.tsx | AudioGuideBar (floating), NarrationToggle, narrateItinerary(), ElevenLabs voice proxy |
| Traveler Radar | LIVE | app/(tabs)/people.tsx | TripPresenceCard, MatchCard, ProfileCard, ChemistryBadge, social-feed, social-chemistry, 5 sub-tabs |
| Prep Tab (IAmHereNow) | LIVE | app/(tabs)/prep.tsx | IAmHereNow at top, IntelligenceCardsGrid, AirQualitySunCard, EmergencyQuickCard, CurrencyQuickCard |

### Merges Completed
- PR #38 (localization) — MERGED
- PR #39 (intelligence strategy) — MERGED
- 0 open PRs

---

## Composer 1 — Visual

Polish the 3 new features visually. Ensure editorial consistency across Intelligence Dashboard, Audio Guide Bar, and Traveler Radar.

### Tasks

- Visual audit of destination/[name].tsx — ensure all 9 widgets flow with proper spacing
- AudioGuideBar design review — ensure floating bar doesn't obscure content
- People tab 5-sub-tab design — ensure tab chips are scannable, active states clear
- IAmHereNow at top of Prep — ensure it's visually prominent, emergency buttons large
- GoNowFeed horizontal scroll — ensure deal cards are attractive with proper photo treatment
- Dark mode audit on all 3 features — no light backgrounds leaking

---

## Composer 2 — Builder

Wire remaining unused components. There are 33 unused components and 65 unused lib modules that could add value.

### Tasks

- Wire SocialProofBanner into onboarding flow
- Wire LiveFeedTicker into Pulse tab header
- Wire MoodDiscovery + MoodPrompt into trip generation flow
- Wire PocketConcierge into itinerary as floating helper
- Wire VisaRequirementsCard into Prep visa section
- Wire HealthBriefCard into body-intel screen
- Wire StreakBadge into profile screen
- Wire VoiceInputButton into chat/generate screens

---

## Composer 3 — Debug

Full regression test after 3-feature merge + 2 PR merges. Ensure nothing broke.

### Tasks

- Run npx tsc --noEmit — verify 0 errors (CONFIRMED ✅)
- Test destination dashboard: Tokyo, Bali, Paris — all widgets render
- Test itinerary audio: generate trip → tap NarrationToggle → AudioGuideBar appears
- Test People tab: create profile → all 5 sub-tabs functional
- Test Prep tab: IAmHereNow shows at top, emergency buttons tap-to-call
- Test offline mode: prep tab works with airplane mode
- Verify Netlify deploy at https://tryroam.netlify.app
- Report to system_health.md

---

## Composer 4 — Research/Growth

Post-feature launch marketing. These 3 features are differentiators — use them in outreach.

### Tasks

- Update Reddit launch post highlighting Intelligence Dashboard + Audio Guide
- Write Twitter thread: "We built a travel app that talks to you" (audio guide angle)
- Draft Product Hunt tagline featuring all 3 features
- Write DACH creator pitch emphasizing Traveler Radar social feature
- Update waitlist email with feature highlights
- Research TikTok trend: "my travel app just narrated my Tokyo trip"

---

## Composer 5 — QA/Captain

End-to-end testing of all user flows with the 3 new features integrated.

### Tasks

- Test full flow: plan trip → generate itinerary → listen to audio guide → view destination intel
- Test social flow: create profile → post trip → see matches → message
- Test prep flow: select destination → IAmHereNow → emergency numbers → currency calc
- Test with 4 destinations: Tokyo, Bali, Vienna, New York
- Test language switching on all new features (EN/ES/FR/DE/JA)
- Test share card with new features visible
- Update captain_status.md with overall status

---

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

---

## File Ownership

| File/Directory | Owner Agent | Notes |
|----------------|-------------|-------|
| app/destination/[name].tsx | Orchestrator | Intelligence Dashboard — 9 widgets wired |
| app/itinerary.tsx | Orchestrator | Audio Guide — AudioGuideBar + NarrationToggle |
| app/(tabs)/people.tsx | Agent 06 (Growth) | Traveler Radar — 5 sub-tabs, social chemistry |
| app/(tabs)/prep.tsx | Agent 09 (Localization) | IAmHereNow at top + full intel grid |
| app/(tabs)/flights.tsx | Orchestrator | Skyscanner affiliate + i18n |
| app/(tabs)/plan.tsx | Orchestrator | Generate flow |
| lib/claude.ts | Orchestrator | P0 critical — generate flow |
| lib/store.ts | Orchestrator | Shared ownership |
| lib/elevenlabs.ts | Orchestrator | Audio guide engine |
| lib/social-chemistry.ts | Agent 06 (Growth) | Traveler compatibility scoring |
| lib/social-feed.ts | Agent 06 (Growth) | Social feed queries |
| lib/constants.ts | Agent 03 (Design) | Design tokens |
| components/audio/ | Orchestrator | AudioGuideBar, NarrationToggle, PronunciationButton |
| components/social/ | Agent 06 (Growth) | MatchCard, TripPresenceCard, ChemistryBadge, ProfileCard |
| components/prep/ | Agent 09 (Localization) | IAmHereNow, EmergencyQuickCard, CurrencyQuickCard |
| supabase/functions/ | Agent 08 (Security) | Edge functions + RLS |
| lib/analytics.ts | Agent 10 (Analytics) | Event tracking |
| lib/i18n/ | Agent 09 (Localization) | Translations |

---

## Blocked

| Task | Blocker | Owner |
|------|---------|-------|
| Booking.com real AID | Quinn needs to sign up at partners.booking.com | Quinn |
| Waitlist DB writes | Apply migration 20260316_waitlist.sql in Supabase SQL Editor | Quinn |
| Admin rate limit bypass | Add ADMIN_TEST_EMAILS=qbyars08@gmail.com to Supabase secrets | Quinn |
| ElevenLabs voice proxy | Deploy voice-proxy edge function to Supabase | Quinn |

---

## Agent Communication Protocol

- Agents write findings to their output .md file in roam/
- Captain reads ALL output files and compiles captain_status.md
- Quinn asks Captain for status — gets instant briefing
- Agents do NOT open GitHub comments to ask questions
- Agents DO open PRs with direct fixes
- Conflicts: security > infra > features > polish
- Orchestrator reviews all PRs before merge
- File ownership in table above — agent with ownership has priority
