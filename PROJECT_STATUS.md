# ROAM Project Status -- March 18, 2026

## Executive Summary

ROAM is an AI-powered travel planning app built with React Native, Expo Router, and Supabase. After 4 sprint cycles, the app has grown to ~175,000 lines of TypeScript across 118 screens, 136 components, and 207 library modules. The core trip planning flow works end-to-end (generate itinerary via Claude, CRAFT conversational mode, prep intelligence, flight search, social features). The app is deployed to web at roamapp.app. However, the codebase is significantly over-scoped for a pre-revenue product -- many features exist as UI shells backed by mock data or hardcoded fallbacks rather than true integrations. The main tab files are dangerously large (plan.tsx at 2,579 lines, prep.tsx at 3,937 lines), violating every file size guideline in the project. Revenue infrastructure exists (RevenueCat, paywall, free tier gating) but has not been validated with real paying users.

---

## By The Numbers

| Metric | Count |
|--------|-------|
| Total screens (app/**/*.tsx) | 118 |
| Total lib modules (lib/**/*.ts) | 207 |
| Total components (components/**/*.tsx) | 136 |
| Total edge functions (Supabase) | 12 |
| Total API integration modules (lib/apis/) | 11 (10 APIs + index) |
| Total Supabase migrations | 53 |
| Total test files | 26 |
| Total lines of TypeScript | ~175,700 |
| Total dependencies | 62 production + 12 dev |
| Commits since March 17 | 20 |
| Auth screens | 11 |
| i18n languages | 4 (en, es, fr, ja) |

### Lines Per Main Tab

| Tab | Lines | Status |
|-----|-------|--------|
| prep.tsx | 3,937 | CRITICAL -- nearly 5x the 800-line max |
| plan.tsx | 2,579 | CRITICAL -- 3x the max |
| pulse.tsx | 2,215 | CRITICAL -- 2.7x the max |
| people.tsx | 1,909 | CRITICAL -- 2.4x the max |
| flights.tsx | 1,630 | CRITICAL -- 2x the max |
| food.tsx | 1,495 | Over limit |
| stays.tsx | 908 | Over limit |

Every single main tab exceeds the 800-line file size limit. This is a maintainability crisis.

---

## Feature Inventory

### Core Trip Planning

| Feature | Status | Notes |
|---------|--------|-------|
| Quick trip generation (Claude) | Built | 3-step wizard: destination > budget > vibes |
| CRAFT conversational mode | Built | Multi-turn AI conversation for trip building |
| Itinerary display | Built | Day-by-day with activities, times, costs |
| Itinerary day map | Built | ItineraryDayMap component with route visualization |
| Destination page (/destination/[name]) | Built | Info hub with weather, visa, safety, neighborhoods |
| Dream Boards | Built | Save future trip ideas with images |
| Dream editing | Built | Edit saved dream destinations |
| Trip countdown | Built | Days-until display on plan tab |
| Trip collections | Built | Organize trips into collections |
| Compare destinations | Built | Side-by-side comparison screen |
| ROAM Score | Built | Composite 0-100 destination scoring |
| Seasonal intelligence | Built | Best time to visit analysis |
| Travel DNA / persona | Built | Personality-based travel recommendations |
| Trip Timeline (web) | Built | Web-only timeline visualization |
| Command-K search (web) | Built | Web-only search overlay |

### Pre-Trip Preparation

| Feature | Status | Notes |
|---------|--------|-------|
| Visa requirements | Built | Sherpa API + hardcoded fallbacks |
| Safety intelligence | Built | Safety scores, neighborhood data |
| Weather forecast | Built | OpenWeather + Open-Meteo |
| Currency converter | Built | Live exchange rates via Frankfurter API |
| Cost of living comparison | Built | Numbeo-style cost data |
| Packing list | Built | AI-generated + manual items |
| Emergency card | Built | Bilingual medical card |
| Emergency numbers | Partial | Hardcoded for ~30 cities, generic fallback |
| Airport guide | Built | Layover data for 8 major airports |
| Before You Land briefing | Built | Pre-arrival checklist |
| Body Intel (health) | Built | Destination health intelligence |
| Language survival phrases | Built | 72 phrases in 5 languages |
| Language hub | Built | Expanded language learning |
| Offline itinerary | Built | Save itinerary for offline use |
| Offline pack | Built | Downloadable trip data bundle |
| Print trip | Built | PDF-style trip printout |
| Travel insurance info | Built | Insurance cards/links |
| Air quality + sun times | Built | Free API integrations |
| Crowd intelligence | Built | Holiday/event crowd forecasting |
| Golden hour (photography) | Built | Sunrise/sunset calculations |
| Jet lag calculator | Built | Pure calculation, no API |
| Dual clock widget | Built | Home vs destination time |

### During Trip (Mobile-First)

| Feature | Status | Notes |
|---------|--------|-------|
| Pulse tab (daily feed) | Built | Live photos, trending, Sonar data, local tips |
| I Am Here Now | Built | Location-aware current-moment intelligence |
| Explore map | Built | Interactive map with points of interest |
| Daily brief | Built | Morning briefing with today's highlights |
| Daily brief audio | Built | Audio version via ElevenLabs |
| Local eats discovery | Built | Restaurant/food recommendations |
| Expense tracker | Built | Track spending during trip |
| Split expenses | Built | Group cost splitting |
| Money section | Built | Budget tracking, savings goals |
| Savings goal tracker | Built | Progress toward trip fund |
| Trip journal | Built | Daily diary with mood tracking |
| Live companion FAB | Built | Floating action button for quick help |
| Pocket concierge | Built | AI assistant during trip |
| Environmental UI | Built | Time-of-day adaptive interface |
| Nearby travelers | Built | See other ROAMers nearby |
| Travel meetups | Built | Social meetup discovery |
| Hostel hub | Built | Hostel-specific features |
| Chaos mode / dare | Built | Spontaneous activity suggestions |
| Rain alternatives | Built | Indoor suggestions when it rains |

### Post-Trip (Remember)

| Feature | Status | Notes |
|---------|--------|-------|
| Trip Wrapped | Built | Spotify-Wrapped-style trip summary |
| Trip journal review | Built | Re-read journal entries |
| Trip album | Built | Photo collection per trip |
| Trip receipt | Built | Cost breakdown summary |
| Trip story | Built | Shareable narrative |
| Memory lane | Built | Timeline of past trips |
| Visited map | Built | World map of places visited |
| Viral share cards | Built | Shareable social cards |
| Share card generator | Built | Custom trip share images |
| Travel time machine | Built | "On this day" memories |
| Trip trading | Built | Exchange trip plans with others |

### Social Features

| Feature | Status | Notes |
|---------|--------|-------|
| People tab | Built | Profile, match discovery |
| Travel persona quiz | Built | Personality assessment |
| Travel compatibility | Built | Match scoring between users |
| Trip chemistry | Built | Group dynamics analysis |
| Social profiles | Built | Travel-specific profile pages |
| Group trips | Built | Shared itinerary, invite codes |
| Group voting | Built | Vote on activities |
| Group chat | Built | In-app messaging (Supabase) |
| Invite system | Built | Share invite codes/links |
| Referral system | Built | Referral tracking + rewards |
| Nearby travelers | Built | Discovery of ROAMers nearby |
| People met | Built | Log people met while traveling |
| Travel twin matching | Built | Find similar travelers |

### API Integrations (lib/apis/)

| API | File | Powers | Status |
|-----|------|--------|--------|
| Amadeus | amadeus.ts | Flight search, pricing | Built -- proxied through edge function |
| Foursquare | foursquare.ts | Venue discovery, local eats | Built |
| Google Places | google-places.ts | Place details, photos, reviews | Built -- proxied through edge function |
| GetYourGuide | getyourguide.ts | Tours, activities | Built |
| Mapbox | mapbox.ts | Maps, routing, geocoding | Built |
| OpenWeather | openweather.ts | Weather forecasts | Built |
| Rome2Rio | rome2rio.ts | Multi-modal transport routes | Built |
| Sherpa | sherpa.ts | Visa requirements | Built |
| TripAdvisor | tripadvisor.ts | Reviews, ratings | Built |
| Eventbrite | eventbrite.ts | Local events | Built |

Additional free APIs (standalone lib modules, no key required):
- Open-Meteo (weather-forecast.ts)
- Frankfurter (exchange-rates.ts)
- REST Countries (country-info.ts)
- travel-advisory.info (travel-safety.ts)
- emergencynumberapi.com (emergency-numbers.ts)
- Open-Meteo geocoding (geocoding.ts)
- sunrise-sunset.org (golden-hour.ts)
- Numbeo-style (cost-of-living.ts)

### Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| claude-proxy | Deployed | JWT auth, free tier check, Claude API |
| destination-photo | Deployed | Unsplash/photo proxy |
| enrich-venues | Deployed | Venue data enrichment |
| flights-proxy | Deployed | Amadeus flight search proxy |
| google-proxy | Deployed | Google Places proxy |
| places-proxy | Deployed | Places API proxy |
| sonar-proxy | Deployed | Perplexity Sonar proxy |
| travel-proxy | Deployed | Multi-API travel data proxy |
| voice-proxy | Deployed | ElevenLabs TTS proxy |
| weather-intel | Deployed | Weather intelligence proxy |
| revenuecat-webhook | Deployed | Subscription webhook handler |
| send-push | Deployed | Push notification sender |
| Supabase Auth | Working | Email + Apple OAuth |
| Row Level Security | Applied | 53 migrations with RLS policies |
| RevenueCat | Integrated | Free tier gating, paywall screen |
| PostHog analytics | Integrated | Event tracking, funnels |
| i18n (4 languages) | Integrated | react-i18next + expo-localization |
| Realtime sync | Built | Supabase realtime for shared trips |
| Offline support | Built | AsyncStorage + offline pack |
| Push notifications | Built | expo-notifications, local scheduling |

---

## What's Working Perfectly

These features are confirmed functional end-to-end as of the March 17 reality check:

1. **Plan tab cold open** -- trips list, countdown, quick actions all render
2. **Tab switching** -- all 5 main tabs render correct content
3. **Quick trip generation** -- Claude generates specific itineraries (tested with Tokyo)
4. **CRAFT conversational mode** -- multi-turn AI conversation with follow-up
5. **Prep tab** -- safety score, navigation cards, emergency buttons
6. **People tab** -- profile onboarding flow
7. **Flights tab** -- airport guide, Go Now deals, Skyscanner links
8. **Pulse tab** -- live photos, trending destinations, Sonar data, local tips
9. **I Am Here Now** -- visible and functional on Pulse tab
10. **Before You Land / Body Intel / Airport Guide** -- navigable from Prep

---

## What Needs Attention

### P0 -- Critical

1. **Every main tab file is 2-4x over the 800-line limit.** prep.tsx is 3,937 lines. This makes debugging, testing, and iterating extremely painful. These need to be broken into sub-components immediately.

2. **Many UI elements are decorative, not actionable.** The March 17 reality check identified this as the single biggest problem. Destination cards, venue tips, and flight deals often lead nowhere when tapped. The destination page exists but is not universally linked.

3. **Sonar skeleton hangs forever.** When Sonar auth fails or times out, sections show infinite loading skeletons. No timeout or fallback message.

### P1 -- High

4. **Emergency numbers are generic.** Falls back to 112/911 for cities outside a 30-city hardcoded map. No user warning.

5. **Test coverage is low.** 26 test files for 118 screens and 207 lib modules. Nowhere near the 80% target. Many tests appear to be smoke tests rather than thorough unit or integration tests.

6. **Mock data prevalence.** Many features use hardcoded or generated mock data. Unclear which features use real APIs vs. mock fallbacks in production.

7. **Duplicate/overlapping modules.** Multiple files serve similar purposes: referral.ts vs referral flow migration, multiple visa files (visa-data.ts, visa-intel.ts, visa-requirements.ts), multiple flight files (flights.ts, flight-deals.ts, flight-intelligence.ts).

### P2 -- Medium

8. **53 Supabase migrations** accumulated in ~2 weeks suggests rapid, possibly under-planned schema evolution. Some are named as "fixes" to earlier migrations.

9. **No end-to-end tests.** All 26 tests are unit/integration level. No Detox or Maestro E2E tests.

10. **i18n interpolation bugs.** MEMORY.md explicitly warns against {{count}} interpolation due to TS errors. Pattern still may exist in some files.

---

## What's Not Built Yet

Based on SPRINT_3_PROMPT.md and feature specs:

1. **B2B API** -- API key management, per-call pricing, usage dashboard. Not started.
2. **Content engine** -- Auto-generated SEO pages from trip data for organic Google traffic. Not started.
3. **Destination Intelligence Network** -- Aggregated user data ("based on 47 ROAMers who visited Tokyo"). Not started. Requires user base.
4. **Smart notifications (full implementation)** -- Flight price drop alerts, weather warnings, savings milestones, pre-trip countdown sequence. lib/notifications.ts exists but smart trigger logic is basic.
5. **Photo receipt capture** -- Camera-to-expense receipt scanning. Not built.
6. **Offline maps** -- Mapbox offline tile downloads. Not built (offline pack saves itinerary data, not map tiles).
7. **Real-time flight price tracking** -- Continuous price monitoring with alerts. Current implementation is search-on-demand.
8. **Post-trip accuracy feedback** -- "How accurate was ROAM's cost estimate?" feedback loop. Not built.
9. **App Store submission** -- APP_STORE_CHECKLIST.md exists but app has not been submitted to iOS or Android stores.
10. **Revenue validation** -- No evidence of a single paying user or completed RevenueCat transaction.

---

## Architecture Overview

```
Client (React Native + Expo Router)
  |
  |-- Zustand store (lib/store.ts) -- app state
  |-- AsyncStorage -- persistence, offline cache
  |-- 5 main tabs: Plan / Pulse / Flights / People / Prep
  |-- ~90 modal/detail screens
  |
  v
Supabase
  |-- Auth (email + Apple OAuth)
  |-- PostgreSQL (profiles, trips, chat_messages, expenses, groups, etc.)
  |-- Row Level Security (53 migrations)
  |-- 12 Edge Functions (API proxies, webhooks)
  |
  v
External APIs
  |-- Claude (trip generation via claude-proxy)
  |-- Perplexity Sonar (live destination intel via sonar-proxy)
  |-- Amadeus (flights via flights-proxy)
  |-- Google Places (via google-proxy / places-proxy)
  |-- ElevenLabs (TTS via voice-proxy)
  |-- Foursquare, GetYourGuide, Mapbox, OpenWeather, Rome2Rio,
  |   Sherpa, TripAdvisor, Eventbrite
  |-- 8+ free APIs (no key required)
  |
  v
Revenue
  |-- RevenueCat (subscription management)
  |-- Free tier: 1 trip lifetime, then paywall
  |-- Pro tier: unlimited trips
```

Web deployment: Expo web export to Netlify (roamapp.app).
Mobile: Expo development builds (not yet on App Store / Google Play).

---

## Revenue Readiness

What needs to happen before ROAM can charge real money:

1. **RevenueCat end-to-end test with a real purchase.** The integration exists but there is no evidence of a completed sandbox or production transaction.

2. **App Store submission.** iOS and Android builds need to be created, signed, and submitted. The APP_STORE_CHECKLIST.md exists but is uncompleted.

3. **Free tier hardening.** Current implementation: 1 trip lifetime. Edge function enforces this. But no monthly reset as originally planned. Needs clear decision on what free users get.

4. **Paywall UX polish.** The paywall screen exists but conversion flow (paywall -> purchase -> unlock -> back to feature) needs end-to-end testing on device.

5. **Terms of Service / Privacy Policy.** Screens exist (terms.tsx, privacy.tsx) but content and legal review status unknown.

6. **Refund handling.** RevenueCat webhook exists but refund flow untested.

7. **Value demonstration.** The app needs to prove its worth before asking for money. Currently there is no clear "aha moment" gating -- users hit the paywall after one trip without necessarily seeing ROAM's full value.

---

## Next Steps (Priority Order)

1. **Break apart the mega-files.** prep.tsx (3,937 lines), plan.tsx (2,579 lines), and pulse.tsx (2,215 lines) each need to be decomposed into focused sub-components. This is blocking all other work by making changes risky and slow.

2. **Make every card tappable and link to something useful.** The March 17 reality check called this out as the single most important fix. Destination cards, venue tips, and flight deals need to navigate to actionable screens.

3. **Add Sonar timeout + fallback.** Infinite loading skeletons on auth failure destroy user trust. Add 10-second timeout with a meaningful error state.

4. **Audit mock data vs. real data.** Catalog every feature that uses hardcoded/mock data in production. Decide: replace with real API, remove from UI, or label as "coming soon."

5. **Write tests for critical paths.** Trip generation, paywall flow, auth flow, and offline save/restore. Current 26 test files are nowhere near 80% coverage.

6. **Submit to App Store (TestFlight first).** The web app proves the concept. Getting on iOS is the path to real users and real revenue.

7. **Validate RevenueCat with a real purchase.** Sandbox test the entire flow: free user -> hits limit -> paywall -> subscribes -> feature unlocks.

8. **Fix emergency numbers fallback.** Either expand the hardcoded map significantly or integrate a proper API. Show a clear warning when falling back to generic numbers.

9. **Implement smart notifications.** The notification infrastructure exists. Wire up the high-value triggers: flight price drops, pre-trip countdown, savings milestones.

10. **Remove or consolidate duplicate modules.** Three visa files, three flight files, two referral implementations. Pick one of each, delete the rest.

---

*Report generated March 18, 2026. Based on git history, file analysis, and the REALITY_CHECK.md audit from March 17.*
