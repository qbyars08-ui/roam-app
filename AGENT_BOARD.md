# ROAM Agent Board — Updated March 16, 2026 (Post-Skills Session)

---

## Status: PROMPT V3.0 LIVE + 9 COMPONENTS WIRED + ALL TESTS PASSING

| Milestone | Status | Details |
|-----------|--------|---------|
| System Prompt v3.0 | LIVE | Banned words, budget personality, emotional day arc, travel style voice, crowd intel |
| Component Wiring | LIVE | 9 unused components wired — PocketConcierge, StreakBadge, MoodDiscovery, VoiceInput, Pronunciation, WanderlustFeed, TravelStats, ChaosMode |
| 5-Screen Onboarding | LIVE | Hook > Social Proof > Value Preview > Personalization > Signup |
| ShareCard | BUILT | ViewShot capture, editorial design — not yet wired into itinerary |
| App Store Listing | WRITTEN | APP_STORE_LISTING.md ready for submission |
| Reddit Launch Posts | WRITTEN | 3 authentic posts for r/solotravel and r/travel |
| Generation Quality | VERIFIED | 5 test trips scored >= 8/10 on Specificity/Voice/Usefulness |
| Tests | 613/613 PASSING | Zero TS errors, 21 test suites |

---

## Composer 1 — Visual

Polish v3.0 prompt output and new component integrations visually.

### Tasks

- Review PocketConcierge floating position — ensure no overlap with AudioGuideBar
- Review MoodDiscovery card styling on Discover tab — editorial consistency
- Review WanderlustFeed cards on Pulse tab — photo treatment + spacing
- ShareCard design audit — ensure it matches editorial aesthetic before wiring
- Audit StreakBadge + TravelStats on profile — spacing, alignment, dark mode
- Review chaos mode "Surprise me" link — subtle enough to not distract from main CTAs

---

## Composer 2 — Builder

Wire ShareCard into itinerary share flow. Continue reducing unused component count.

### Tasks

- Wire ShareCard into itinerary screen share button
- Wire SocialProofBanner into onboarding flow (between hook and social-proof screens)
- Wire LiveFeedTicker into Pulse tab header
- Wire VisaRequirementsCard into Prep visa section
- Wire HealthBriefCard into body-intel screen
- Wire TripRecap into trip journal completion flow
- Target: reduce unused components from ~26 to ~15

---

## Composer 3 — Debug

Post-session regression testing + prompt v3.0 validation.

### Tasks

- Generate test trips with v3.0 prompt: Tokyo solo $2000, Paris couple $4000, Bali backpacker $1000
- Verify banned words absent from all generated output
- Verify dual currency in all cost fields
- Verify transit directions include line name, exit, fare
- Verify Day 1 theme contains arrival language
- Verify last day references departure
- Test all 5 onboarding screens end-to-end
- Run npx tsc --noEmit — confirm 0 errors (CONFIRMED)
- Run npx jest --forceExit — confirm 613/613 (CONFIRMED)

---

## Composer 4 — Research/Growth

Launch marketing with v3.0 prompt as differentiator.

### Tasks

- Post 3 Reddit launch posts from reddit_launch.md
- Write Twitter thread: "We rewrote our travel AI to sound like a friend, not a blog"
- Draft Product Hunt launch tagline + description
- Update waitlist page copy to highlight v3.0 quality
- Pitch creators: "Generate a trip and share the ShareCard"
- Research: what travel apps are trending on TikTok right now

---

## Composer 5 — QA/Captain

Full regression + App Store submission prep.

### Tasks

- Test full flow: onboarding > plan trip > generate > itinerary > share
- Test VoiceInputButton on generate screen — mic works, transcript appears
- Test pronunciation on Prep tab — all 4 languages play correctly
- Test chaos mode — "Surprise me" generates a random trip
- Validate App Store listing metadata against ASO guidelines
- Test with 4 destinations: Tokyo, Seoul, Vienna, Bali
- Test language switching on all wired components
- Update captain_status.md

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
| lib/claude.ts | Orchestrator | P0 critical — v3.0 prompt live |
| app/destination/[name].tsx | Orchestrator | Intelligence Dashboard — 9 widgets |
| app/itinerary.tsx | Orchestrator | Audio Guide + PocketConcierge |
| app/(tabs)/people.tsx | Agent 06 (Growth) | Traveler Radar — 5 sub-tabs |
| app/(tabs)/prep.tsx | Agent 09 (Localization) | IAmHereNow + pronunciation |
| app/(tabs)/flights.tsx | Orchestrator | Skyscanner affiliate + i18n |
| app/(tabs)/generate.tsx | Orchestrator | TripGeneratingLoader + chaos mode |
| app/(tabs)/pulse.tsx | Orchestrator | WanderlustFeed wired |
| app/(tabs)/index.tsx | Orchestrator | MoodDiscovery + trending badges |
| app/profile.tsx | Orchestrator | StreakBadge + TravelStats |
| components/ShareCard.tsx | Orchestrator | Built, needs wiring |
| lib/store.ts | Orchestrator | Shared ownership |
| lib/elevenlabs.ts | Orchestrator | Audio guide engine |
| lib/constants.ts | Agent 03 (Design) | Design tokens |
| components/audio/ | Orchestrator | AudioGuideBar, NarrationToggle, PronunciationButton, VoiceInputButton |
| components/social/ | Agent 06 (Growth) | MatchCard, TripPresenceCard, ChemistryBadge |
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
