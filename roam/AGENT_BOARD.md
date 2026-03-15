# ROAM Agent Board

Updated: 2026-03-15 (post-restructure)

---

## System Status: GREEN

- TypeScript: 0 errors
- Live URL: https://tryroam.netlify.app
- **NEW 5-TAB STRUCTURE SHIPPED:** Plan → Discover → People → Flights → Prep
- PR #37 merged: `feat: 5-tab navigation`
- Old tabs (stays, food, generate) hidden via `href: null`, not deleted
- All 37 destination images loading (200 OK)
- 10/11 APIs working (emergencynumberapi CORS fail on web only — fallback data covers it)

---

## CRITICAL CONTEXT FOR ALL AGENTS

**The app just went through a major product pivot.** Read this before doing anything.

### New Tab Structure (5 tabs)
| Tab | File | What it does |
|-----|------|-------------|
| **Plan** | `app/(tabs)/plan.tsx` | Unified trip planning. Generate flow + trip cards + quick actions (stays/food/flights). This is the core product. |
| **Discover** | `app/(tabs)/index.tsx` | Destination grid with trending badges, photo cards, category filters |
| **People** | `app/(tabs)/people.tsx` | NEW. Social layer — traveler matching, group trips, companion profiles |
| **Flights** | `app/(tabs)/flights.tsx` | Flight search with popular routes, price calendar, Skyscanner links |
| **Prep** | `app/(tabs)/prep.tsx` | Safety, visa, weather, emergency numbers, currency, language guide |

### Hidden tabs (still routable, NOT in tab bar)
- `app/(tabs)/generate.tsx` — old generate tab, superseded by Plan
- `app/(tabs)/stays.tsx` — old stays tab, content migrated to Plan
- `app/(tabs)/food.tsx` — old food tab, content migrated to Plan
- `app/(tabs)/group.tsx` — group/currency screen

### Key Files Changed
- `app/(tabs)/_layout.tsx` — 5 visible tabs
- `components/ui/ROAMTabBar.tsx` — new TAB_ORDER, new icons
- `components/ui/TabIcons.tsx` — added `IconPeople`
- `lib/i18n/locales/{en,es,fr,ja}.ts` — added `plan` + `people` keys

---

## PR Merge Priority

| Priority | PR | Title | Action |
|----------|-----|-------|--------|
| P0 | #37 | 5-tab restructure | MERGED ✅ |
| P0 | #36 | Design audit violations | REVIEW — may conflict with restructure |
| P0 | #33 | German localization | REVIEW — needs plan/people keys added |
| P1 | #32 | App copy and store text | REVIEW |
| P1 | #27 | Application health check | MERGE |
| P1 | #24 | CAPTAIN | MERGE |
| P2 | #31, #29, #26, #25, #30, #28 | Docs PRs | MERGE when ready |
| P3 | #35, #34, #23 | Research/test PRs | MERGE when ready |

---

## Agent Assignments (Current Sprint — Post-Restructure)

### 01 — ROAM Tester
**STATUS:** ASSIGNED — URGENT
**TASK:** Full regression test on new 5-tab structure.
- Plan tab: no trips → shows generate mode select (Quick / Conversation)
- Plan tab: generate trip → TripGeneratingLoader → navigates to /itinerary
- Plan tab: with trips → shows trip cards with photos, metadata chips, "LATEST" badge
- Plan tab: "Plan a new trip" button → returns to generate flow
- Plan tab: quick actions (Find stays, Find food, Book flights) → correct navigation
- People tab: renders hero stats, group trip cards, traveler cards with avatars
- People tab: "Connect" and save buttons have haptic feedback
- People tab: group cards scroll horizontally
- Discover tab: unchanged, all 37 destinations load
- Flights tab: popular routes show, price calendar works
- Prep tab: all live data sections render (weather, safety, currency, holidays)
- Tab bar: exactly 5 tabs visible (Plan, Discover, People, Flights, Prep)
- Old routes: `/stays`, `/food`, `/generate` still accessible via deep link
**OUTPUT:** roam/test_results.md
**PRIORITY:** P0

### 02 — ROAM Researcher
**STATUS:** ASSIGNED
**TASK:** People tab backend architecture.
- Research: real-time traveler matching systems (how do apps like Bumble/Couchsurfing match?)
- Evaluate: Supabase Realtime for presence ("who's online in Tokyo right now")
- Design: traveler profile schema for Supabase (where_been, where_going, vibes, dates, avatar)
- Research: privacy-safe location sharing for "who else is here" feature
- Recommend: MVP implementation that works without backend (local mock data → Supabase)
**OUTPUT:** roam/research_report.md
**PRIORITY:** P0

### 03 — ROAM Design
**STATUS:** ASSIGNED
**TASK:** Design audit on new tab structure.
- Plan tab: verify trip cards look premium (photo quality, gradient overlay, typography)
- Plan tab: verify generate flow embedded correctly (no layout jank on mode switch)
- Plan tab: quick action cards — do they look balanced? spacing? icon sizes?
- People tab: verify traveler cards are scannable (name, dest, dates visible at glance)
- People tab: verify group cards look compelling in horizontal scroll
- People tab: hero section — does it feel welcoming or corporate?
- Tab bar: verify 5 icons are visually balanced, correct spacing
- Hunt: any hardcoded hex, broken images, missing loading states in new tabs
**OUTPUT:** roam/design_audit.md + PR
**PRIORITY:** P0

### 04 — ROAM Builder (Opus)
**STATUS:** ASSIGNED
**TASK:** Plan tab — make the itinerary editable inline.
1. After generating a trip, the itinerary screen (`app/itinerary.tsx`) should allow:
   - Tap hotel section → modal with 3-5 alternative stays (mock for now)
   - Tap restaurant → browse alternatives, swap selection
   - Tap activity → edit, replace, or remove
   - Reorder days via drag
2. Budget tracker: show running total that updates as user edits choices
3. "Generate for me" vs "I'll customize" toggle at top of Plan
4. Make the trip cards on Plan tab tappable → opens full itinerary with editing
**OUTPUT:** PRs to main
**PRIORITY:** P0

### 05 — ROAM Debugger
**STATUS:** ASSIGNED
**TASK:** Post-restructure health check.
- `npx tsc --noEmit` = 0 errors ✅ (verified)
- Verify no console errors on Plan tab (new component)
- Verify no console errors on People tab (new component)
- Verify old tab routes still work when accessed directly
- Bundle size: did the restructure increase it? By how much?
- Check for memory leaks: Plan tab stores trips in Zustand — verify cleanup
- Test rapid tab switching between all 5 tabs
**OUTPUT:** roam/system_health.md
**PRIORITY:** P0

### 06 — ROAM Growth
**STATUS:** ASSIGNED
**TASK:** People tab is the viral feature. Design the growth loop.
1. "Invite a travel buddy" share flow — what does the invite link look like?
2. "X people are going to [destination] this month" — social proof messaging
3. Group trip formation → "Share this trip" → viral loop
4. Write 3 TikTok scripts that showcase the People tab ("find your travel squad")
5. Design the "travel profile" that users complete → what data do we collect?
**OUTPUT:** roam/growth_dashboard.md
**PRIORITY:** P0

### 07 — ROAM Monetization
**STATUS:** ASSIGNED
**TASK:** People tab monetization + Plan tab premium features.
- Free: see 3 matched travelers per destination, join 1 group
- Pro: unlimited matches, create groups, see who's there now, direct messages
- Plan tab Pro: unlimited trips, AI re-generation, custom hotel/food alternatives
- Design the paywall moment for People tab (when does it trigger?)
- Map affiliate revenue from Plan tab booking links
**OUTPUT:** roam/monetization_model.md
**PRIORITY:** P1

### 08 — ROAM Security
**STATUS:** ASSIGNED
**TASK:** Security review of People tab.
- User profiles: what data is stored? Is it RLS-protected?
- Avatar uploads: verify no XSS via image URLs
- Traveler matching: no PII leakage in match results
- Group trip sharing: verify share links don't expose private trip data
- Rate limiting on profile creation/updates
**OUTPUT:** roam/security_audit.md
**PRIORITY:** P1

### 09 — ROAM Localization
**STATUS:** ASSIGNED
**TASK:** Localize new tabs.
- Plan tab: "Your trips", "Plan a new trip", "Find stays", "Find food", "Book flights", "LATEST", trip metadata labels
- People tab: "People", "Find travelers going where you are going", "Travel is better together", "Active travelers", "Destinations", "Groups forming", "Open groups", "Matched travelers", "Connect", "Set up profile"
- Add all strings to en.ts, es.ts, fr.ts, ja.ts
- Verify tab names render correctly in all 4 languages
**OUTPUT:** Updated locale files + PR
**PRIORITY:** P1

### 10 — ROAM Analytics
**STATUS:** ASSIGNED
**TASK:** Track new tab engagement.
- Plan tab: track which quick action gets tapped most (stays/food/flights)
- Plan tab: track trip card tap-through rate
- Plan tab: track "Plan a new trip" button usage
- People tab: track traveler card views, "Connect" taps, group card taps
- People tab: track hero CTA ("Set up profile") click rate
- Tab switching: track which tab users spend the most time on
**OUTPUT:** roam/analytics_spec.md
**PRIORITY:** P1

### 11 — ROAM Content
**STATUS:** ASSIGNED
**TASK:** Write copy for People tab.
- Traveler bios: write 10 more diverse mock bios (different ages, travel styles, destinations)
- Group descriptions: write compelling group trip descriptions
- Hero section: test 3 headline variants for "Travel is better together"
- Plan tab: write copy for the "no trips yet" state — invitation, not instruction
- All copy: ROAM voice. Punchy. Specific. Never generic.
**OUTPUT:** roam/copy_library.md + PR
**PRIORITY:** P1

### 12 — ROAM Investor
**STATUS:** ASSIGNED
**TASK:** Update narrative with People tab as differentiator.
- "ROAM isn't just a trip planner — it's a travel social network"
- Competitive analysis: who else does traveler matching? (nobody does it well)
- TAM expansion: trip planning TAM vs. travel social TAM
- Updated metrics: 5 tabs, People tab as viral loop, group trip formation
- Write updated 30-second elevator pitch including social layer
**OUTPUT:** roam/investor_narrative.md
**PRIORITY:** P1

### 13 — ROAM DACH Growth
**STATUS:** ASSIGNED
**TASK:** Localize People tab for German market.
- Translate all People tab strings to German
- Write German mock traveler bios (German names, German destinations like München, Berlin, Hamburg)
- German group trips: "4 Reisende nach Bali im Mai"
- Identify German travel community platforms (alternative to Couchsurfing in DACH)
**OUTPUT:** roam/dach_growth.md
**PRIORITY:** P1

### 14 — ROAM UGC Engine
**STATUS:** ASSIGNED
**TASK:** Creator content around People tab.
- "Find your travel squad on ROAM" — 3 TikTok scripts
- "I matched with strangers on a travel app and we went to Bali" — story format
- Trip Card shareable template: now includes group members + shared vibe
- Instagram Reel concept: screen recording of People tab matching flow
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
| PR reviews | 14 open PRs need review/merge | P0 |
| Supabase: People table | Create `traveler_profiles` table with RLS | P0 |
| Booking.com AID | Sign up at partners.booking.com | P1 |
| ADMIN_TEST_EMAILS | Add to Supabase edge function secrets | P1 |
| RevenueCat products | Create Pro subscription in RC dashboard | P2 |
| PostHog project key | Verify key is set in environment | P2 |

---

## What Just Shipped

- [x] **5-tab restructure** — Plan, Discover, People, Flights, Prep (PR #37)
- [x] **Plan tab** — unified trip planning with trip cards, generate flow, quick actions
- [x] **People tab** — traveler matching, group trips, companion profiles with match scores
- [x] **IconPeople** SVG added to TabIcons
- [x] **4 locales updated** (en, es, fr, ja) with plan/people tab names
- [x] Flights tab: popular routes with Unsplash photos
- [x] Stays/Food tabs: visual overhaul (now hidden, content in Plan)
- [x] TypeScript: 0 errors
- [x] Deployed to https://tryroam.netlify.app
