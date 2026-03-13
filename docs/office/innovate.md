# ROAM — Innovation Blueprint

> Strategic innovation roadmap for ROAM's next phase. Prioritized by user impact, revenue potential, and competitive moat.

*Last updated: 2026-03-13*

---

## Current State

ROAM ships a working AI travel planner with itinerary generation, chat, globe, passport gamification, group trips, chaos mode, trip dupes, travel personas, and pro subscriptions via RevenueCat. v1.0 native gates non-core features behind "Coming Soon"; web is fully unlocked.

**What works well:**
- Opinionated, specific AI voice (the #1 differentiator)
- 60-second itinerary generation
- Viral mechanics: Spin the Globe, Chaos Mode, Trip Wrapped, shareable cards
- Guest mode with deferred signup
- Group trip planning (fully built, spec outdated)

**Where we're exposed:**
- No live pricing data (flights, hotels, currency)
- Onboarding asks for commitment before delivering value
- No social layer beyond group trips
- Gamification is stamp-based only; no progression system
- No offline-first architecture for in-trip usage

---

## Innovation Priorities

### Phase 1 — Revenue & Retention (0-8 weeks)

These features directly drive subscription conversions and daily active usage.

#### 1. Live Flight Prices

**Why:** Highest revenue-impact unbuilt feature. Affiliate links exist but show no prices. Users leave the app to check Skyscanner.

**Approach:**
- Edge function `supabase/functions/flight-prices/` proxying Amadeus (2K free/month) with Kiwi Tequila fallback
- New `FlightPriceCard` component on itinerary screen below weather
- Add `homeAirport` to Zustand store and Supabase `profiles`
- "See flights" CTA opens Skyscanner affiliate deep link
- Cache results 6 hours in Supabase

**Metrics:** Affiliate click-through rate, revenue per itinerary view

---

#### 2. Seasonal Recommendations Engine

**Why:** Users don't know when to go. Seasonal data makes every recommendation 10x more relevant and drives repeat opens.

**Approach:**
- `lib/seasonal-data.ts` mapping destinations to optimal months, events, weather windows
- `SeasonalBadge` component on Discover cards: "Peak season", "Hidden gem window", "Shoulder season deal"
- Feed season context into Claude system prompt for itinerary generation
- Supabase table `destination_seasons` with monthly scores

**Metrics:** Discover engagement rate, plan starts per session

---

#### 3. Budget Range Filter on Discover

**Why:** Plan wizard has budget tiers but Discover has no filtering. Users see Bora Bora when they can afford Bali.

**Approach:**
- Add `estimatedDailyCost` to `DESTINATIONS` in constants
- Range slider component on Discover screen
- `budgetFilter` already stubbed in Zustand store
- Sort/filter destinations client-side

**Metrics:** Plan conversion from Discover, time to first plan

---

#### 4. Voice Input for Trip Chat (STT)

**Why:** TTS exists via ElevenLabs/expo-speech. Missing STT makes chat feel one-directional. Voice input is table stakes for Gen Z.

**Approach:**
- `expo-speech` recognition or Whisper via edge function
- Floating mic FAB on chat screen
- Transcribed text feeds into existing chat flow
- Pro-gate for extended voice sessions

**Metrics:** Chat messages per session, Pro conversion from chat users

---

### Phase 2 — Viral & Social (8-16 weeks)

Features that generate organic acquisition through sharing and social mechanics.

#### 5. Photo-to-Destination (Claude Vision)

**Why:** Bridges the TikTok-to-boarding-pass gap. User screenshots a travel video, ROAM identifies the location and generates a plan.

**Approach:**
- Camera icon in Discover search bar
- Image picker sends photo to `claude-proxy` with vision model
- Claude identifies location, returns destination match
- Pre-fill plan wizard with identified destination
- Pro feature

**Metrics:** Plans started via photo, share rate of "identified" destinations

---

#### 6. World Map Visualization

**Why:** Passport tracks stamps by country but has no visual map. SVG world map is the most shareable asset in gamification.

**Approach:**
- `react-native-svg` with simplified GeoJSON world outline
- Color visited countries in sage, highlight next trip in coral
- Stats overlay: countries visited, continents, travel score
- Share button generates branded map card
- Progressive unlock animations

**Metrics:** Share rate from passport screen, return visits to passport

---

#### 7. Creator Itineraries

**Why:** Curated content from real travelers gives ROAM editorial credibility. Strong marketing channel.

**Approach:**
- `creator_itineraries` Supabase table with RLS
- Special card style on Discover with creator avatar and bio
- Manual curation initially; open submissions in Phase 3
- Affiliate links embedded in creator itineraries

**Metrics:** Creator itinerary view rate, affiliate revenue from creator content

---

#### 8. Trip Shield (Proactive Travel Alerts)

**Why:** Competitive research shows refunds and cancellations are the #1 pain point across ALL travel apps. Nobody advocates for the traveler.

**Approach:**
- Monitor booked flight status via Amadeus Flight Status API
- Push notification if flight changes, gate changes, delays
- Suggest backup accommodations if cancellation detected
- Emergency SOS already exists; Trip Shield wraps it in proactive monitoring
- Premium feature (strong Pro conversion driver)

**Metrics:** Pro conversion from Trip Shield users, NPS among Trip Shield activations

---

### Phase 3 — Platform & Moat (16-24 weeks)

Features that create defensible competitive advantages.

#### 9. Onboarding Overhaul (Duolingo Model)

**Why:** Current flow is 7 screens before value. Best-in-class apps deliver value before asking for commitment. ROAM should show a real itinerary before signup.

**Approach:**
- Cut flow to 3 screens: Hook -> Quick profile (2 questions) -> Instant itinerary
- Merge onboarding questions into trip wizard
- Guest users see full itinerary, hit paywall at export/save
- "Surprise Me" zero-decision path for fastest time-to-value

**Metrics:** Onboarding completion rate, Day-1 retention, time to first plan

---

#### 10. AI That Learns Your Preferences

**Why:** Every plan starts from scratch. Returning users should get better recommendations over time.

**Approach:**
- `user_preferences` Supabase table tracking: liked activities, cuisine preferences, budget patterns, pace preference
- Implicit signals: which itinerary sections users expand, edit, or skip
- Feed preference summary into Claude system prompt
- Display "Personalized for you" badge on tailored recommendations

**Metrics:** Plan edit rate (lower is better), repeat plan rate, Pro retention

---

#### 11. Offline-First Trip Mode

**Why:** Users need their itinerary most when they have the worst connectivity: in transit, abroad, in remote areas.

**Approach:**
- Cache active trip itinerary, maps tiles, and key data in AsyncStorage
- `lib/offline.ts` already exists; extend with structured trip data sync
- Offline indicator banner with last-sync timestamp
- Background sync when connectivity returns
- Essential for international travelers (ROAM's core audience)

**Metrics:** In-trip app opens, itinerary views during trip dates

---

#### 12. Destination Companions ("Who Else Is Going?")

**Why:** Social proof and connection opportunity. Knowing others are visiting the same destination at the same time creates community.

**Approach:**
- `travel_intents` Supabase table (user, destination, date range, visibility)
- Opt-in badge on itinerary: "3 others heading to Lisbon in April"
- Anonymous until mutual opt-in
- Requires friends/follow system (build minimal version first)

**Metrics:** Travel intent creation rate, mutual connection rate

---

## Innovation Principles

1. **Opinionated over comprehensive.** ROAM recommends; it does not aggregate. Every feature should make a specific recommendation, not present options.

2. **Share-first design.** Every new feature must answer: what does the user screenshot or send to a group chat? If nothing, reconsider.

3. **Value before commitment.** Users should experience the product's core value before hitting any gate (signup, paywall, onboarding).

4. **Gen Z native.** Features should feel like they belong on TikTok: visual, fast, personality-driven, slightly chaotic.

5. **AI as voice, not tool.** The AI is a character with opinions, not a search engine. Every AI-powered feature should feel like talking to a well-traveled friend.

---

## Technical Guardrails

- All new AI features route through `supabase/functions/claude-proxy/`
- No new `EXPO_PUBLIC_` secrets; API keys stay server-side in edge functions
- Every new Supabase table must have RLS policies using `auth.uid()`
- Web compatibility required for all features (use `lib/haptics.ts` and `lib/view-shot.ts` shims)
- New screens gated via `lib/feature-flags.ts` on native; unlocked on web
- Design tokens from `lib/constants.ts` only; dark-mode-only UI
- Files under 800 lines; functions under 50 lines

---

## Competitive Moat Summary

| Dimension | Current | After Phase 1-3 |
|-----------|---------|-----------------|
| AI quality | Opinionated itineraries | Personalized + learning |
| Live data | Weather only | Flights, currency, safety, events |
| Viral mechanics | Globe, Chaos, Wrapped | World Map, Photo-to-Trip, Creator content |
| Revenue streams | Subscriptions only | Subscriptions + affiliate + creator marketplace |
| Retention | Single-use risk | Trip Shield + offline mode + preference learning |
| Social | Group trips | Companions, creator community, sharing |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-13 | Phase 1 starts with live flight prices | Highest revenue impact; Amadeus integration partially stubbed |
| 2026-03-13 | Defer social features to Phase 2 | Need user base before social layer has value |
| 2026-03-13 | Onboarding overhaul in Phase 3 | High impact but high risk; ship revenue features first |

---

*This document is maintained by the innovation function. Update after each phase review.*
