# ROAM — Advanced Features Technical Spec

> Internal document. Each feature is specced for handoff to a developer.
> Features already shipped are marked. New features include API requirements, UI plan, integration points, priority, and complexity.

---

## Table of Contents

1. [Live Data Feeds](#1-live-data-feeds)
2. [Smart Personalization Engine](#2-smart-personalization-engine)
3. [Social & Community Layer](#3-social--community-layer)
4. [Media & Content](#4-media--content)
5. [Safety & Practical](#5-safety--practical)
6. [Gamification 2.0](#6-gamification-20)
7. [AI Superpowers](#7-ai-superpowers)
8. [Monetization Features](#8-monetization-features)

---

## 1. Live Data Feeds

### 1A. Real-Time Travel Safety Scores

**Status:** Not built

**APIs:**
- Travel Advisory API (tugo.com) — free tier, 100 req/day
- US State Department CISA feed (RSS, free, no key)
- UK FCDO travel advice API (free, JSON)

**UI Component:** `components/features/SafetyScore.tsx`
- Horizontal pill showing score 1–5 with color coding (green → red)
- Tapping opens a modal with breakdown: crime, health, political stability, natural disaster risk
- Source attribution line at bottom

**Integration:**
- Render on `app/itinerary.tsx` header, below destination name
- Also display in Discover cards as a small badge (top-right corner)
- Cache scores in Supabase `destination_safety` table, refresh weekly via cron edge function

**Priority:** Must-have
**Complexity:** Medium

---

### 1B. Live Weather at Destination

**Status:** Already shipped

`lib/weather.ts` — OpenWeatherMap integration
`components/features/WeatherCard.tsx` — current conditions + 5-day forecast + packing hints

No additional work needed.

---

### 1C. Live Flight Prices

**Status:** Affiliate links exist (`lib/affiliate-tracking.ts` with Skyscanner partner ID). No live price display.

**APIs:**
- Skyscanner Flights Live API — requires partner approval, free for affiliates
- Kiwi.com Tequila API — free tier (1000 req/month), good fallback
- Google Flights is not publicly available as an API

**UI Component:** `components/features/FlightPriceCard.tsx`
- Compact card: origin → destination, cheapest price, date range, airline logo
- "See flights" CTA opens Skyscanner affiliate deep link
- Price trend sparkline (optional, v2)

**Integration:**
- Show on itinerary screen below the weather card
- Requires user to set home airport in profile (new field: `homeAirport` in Zustand store + Supabase `profiles`)
- Edge function `supabase/functions/flight-prices/index.ts` proxies API calls, caches results 6 hours

**Priority:** Must-have (high revenue potential)
**Complexity:** High — partner approval process, airport code resolution, price caching

---

### 1D. Live Currency Exchange Rates

**Status:** Not built

**APIs:**
- ExchangeRate-API (free tier: 1500 req/month, 6 currencies)
- Open Exchange Rates (free tier: 1000 req/month, USD base only)
- Frankfurter API (free, no key, ECB data, unlimited) — recommended

**UI Component:** `components/features/CurrencyCard.tsx`
- Two-row card: "1 USD = X [local currency]" with flag emoji
- Quick-convert input: type a USD amount, see local equivalent
- Small "updated X min ago" timestamp

**Integration:**
- Show on itinerary screen in the practical info section
- Currency code derived from destination country (maintain a `COUNTRY_CURRENCY_MAP` in constants)
- Cache rates in AsyncStorage, refresh daily

**Priority:** Must-have
**Complexity:** Low

---

### 1E. Live Destination Webcams

**Status:** Not built

**APIs:**
- Windy Webcams API (free tier: 1000 req/day) — high quality, global coverage
- Skyline Webcams embed (free, iframe-based, limited destinations)

**UI Component:** `components/features/DestinationCam.tsx`
- Thumbnail card with "LIVE" badge, tapping opens full-screen WebView embed
- Horizontal ScrollView of 3–5 cams per destination

**Integration:**
- Show on Discover screen when a destination is long-pressed (bottom sheet)
- Also available on itinerary screen as an expandable section

**Priority:** Nice-to-have
**Complexity:** Medium — WebView embedding, handling stream failures gracefully

---

### 1F. Travel News Feed

**Status:** Not built

**APIs:**
- NewsAPI.org (free tier: 100 req/day, headlines only in free plan)
- GNews.io (free tier: 100 req/day)
- Google News RSS (free, no key, parse XML)

**UI Component:** `components/features/TravelNewsFeed.tsx`
- Vertical list of 5 headline cards, each with source icon, title, time ago
- Tapping opens in-app WebView browser
- Filter by destination keyword

**Integration:**
- New section on Discover screen (below categories, above photo grid) — collapsible
- Edge function fetches + caches headlines, keyed by destination

**Priority:** Nice-to-have
**Complexity:** Low

---

## 2. Smart Personalization Engine

### 2A. Seasonal Recommendations

**Status:** Not built (Claude prompt includes some seasonal awareness but no dedicated system)

**APIs:**
- None required — powered by a curated dataset + Claude

**Data Model:**
- New file `lib/seasonal-data.ts` with a `SEASONAL_SCORES` map:
  ```
  { "Bali": { jan: 4, feb: 3, ..., oct: 9, nov: 8, dec: 5 } }
  ```
  Score 1–10 per month. Factors: weather, crowds, price, events.

**UI Component:** `components/features/SeasonalBadge.tsx`
- Small badge on Discover cards: "Best in Oct" or "Avoid Jul–Aug"
- Color-coded: green (8+), yellow (5–7), red (1–4)
- Tapping opens tooltip with reason ("Dry season, fewer crowds, festival season")

**Integration:**
- Badge renders on each Discover grid card based on current month
- Also feed seasonal data into Claude system prompt for trip generation: "User is traveling in [month]. Prioritize seasonal activities."

**Priority:** Must-have
**Complexity:** Medium — curating accurate seasonal data for 32+ destinations

---

### 2B. Budget-Based Filtering

**Status:** Plan wizard has budget tiers (budget/mid/luxury). No real-time cost filtering.

**UI Component:** Budget slider on Discover screen
- Range slider: $30/day → $500/day
- Destinations dim/hide if estimated daily cost exceeds budget
- Estimated cost per destination stored in `DESTINATIONS` array as `estimatedDailyCost`

**Data Model:**
- Add `estimatedDailyCost: { budget: number; mid: number; luxury: number }` to each destination in `lib/constants.ts`

**Integration:**
- New filter row below category chips on Discover screen
- Persisted in Zustand as `budgetFilter: [min, max] | null`

**Priority:** Must-have
**Complexity:** Low

---

### 2C. Weather Preference Matching

**Status:** Not built

**Data Model:**
- New profile fields in Zustand + Supabase `profiles`:
  ```
  weatherPrefs: {
    tolerateHumidity: boolean;
    preferWarm: boolean;
    preferCold: boolean;
    avoidRain: boolean;
  }
  ```
- New file `lib/weather-match.ts` — scores each destination against user prefs using historical climate data

**UI Component:** Settings section in Profile screen
- 4 toggle switches under "Weather Preferences"
- Discover cards show a small match percentage badge

**Integration:**
- Feed weather prefs into Claude system prompt
- Filter/sort Discover grid by match score

**Priority:** Nice-to-have
**Complexity:** Medium — requires historical climate dataset per destination

---

### 2D. Profile-Based AI That Learns

**Status:** Not built (Claude calls are stateless per trip)

**Architecture:**
- New Supabase table `user_preferences`:
  ```sql
  id uuid PK, user_id uuid FK, preference_key text, preference_value text, confidence float, updated_at timestamptz
  ```
- After each trip generation, an edge function extracts implicit preferences from chat history and itinerary choices (e.g., user always picks food-heavy itineraries → increase foodie weight)
- Preferences are injected into Claude system prompt as a `userProfile` block

**UI Component:** None directly — manifests as better recommendations over time
- Optional: "Your Travel DNA" card on Profile screen showing top 3 inferred preferences

**Integration:**
- Edge function `supabase/functions/preference-learner/index.ts`
- Runs async after trip save, analyzes patterns across all user trips
- Feeds into `ITINERARY_SYSTEM_PROMPT` in `lib/claude.ts`

**Priority:** Future (requires meaningful user base for signal)
**Complexity:** High

---

### 2E. Vibe Matching

**Status:** Already shipped

Plan wizard step 3 (`app/(tabs)/plan.tsx`) has vibe selection (foodie, adventure, chill, nightlife, culture, nature, romantic, budget). Vibes feed directly into Claude prompt and influence itinerary generation.

No additional work needed.

---

## 3. Social & Community Layer

### 3A. Travel Partner Matching

**Status:** Not built

**Architecture:**
- New Supabase tables:
  ```sql
  travel_intents (id, user_id, destination, start_date, end_date, budget, vibes[], status)
  partner_matches (id, user_a, user_b, intent_a, intent_b, status, created_at)
  ```
- Matching algorithm: destination + date overlap + vibe overlap + budget tier
- RLS: users only see their own matches

**UI Component:** `app/(tabs)/connect.tsx` — new tab or modal
- Card stack (swipe UI) showing potential travel partners
- Each card: avatar, name, destination, dates, shared vibes, short bio
- Swipe right = interested, left = pass
- Mutual match opens chat

**APIs:**
- No external API — internal matching on Supabase
- Supabase Realtime for match notifications

**Integration:**
- New tab in bottom nav or accessible from Discover screen "Find travel partners" card
- Requires onboarding step for profile photo + short bio

**Priority:** Future (needs critical mass of users)
**Complexity:** High — matching logic, chat infrastructure, moderation, safety

---

### 3B. Group Trip Planning

**Status:** Not built

**Architecture:**
- New Supabase tables:
  ```sql
  trip_groups (id, name, owner_id, trip_id, invite_code, created_at)
  trip_group_members (id, group_id, user_id, role, joined_at)
  trip_votes (id, group_id, user_id, category, option, created_at)
  trip_expenses (id, group_id, payer_id, amount, description, split_type, created_at)
  trip_expense_splits (id, expense_id, user_id, amount, settled)
  ```

**UI Component:** `app/group-trip.tsx`
- Invite screen with shareable link/code
- Vote UI: destination poll, date poll, activity poll
- Expense tracker with split calculator
- Group chat (Supabase Realtime)

**Integration:**
- "Invite friends" button on saved trip card
- Share invite link via system share sheet
- Group itinerary view shows who added what

**Priority:** Nice-to-have (strong differentiator)
**Complexity:** High — real-time sync, expense splitting logic, invite system

---

### 3C. Community Trip Reviews

**Status:** Not built

**Architecture:**
- New Supabase tables:
  ```sql
  trip_reviews (id, user_id, destination, rating, title, body, photos[], tips[], created_at)
  review_likes (id, review_id, user_id)
  ```
- Storage bucket for review photos

**UI Component:** `components/features/ReviewCard.tsx`
- Star rating, photo carousel, review text, helpful count
- Shown on Discover destination detail (new screen: `app/destination.tsx`)

**Priority:** Nice-to-have
**Complexity:** Medium — photo upload, moderation pipeline

---

### 3D. Destination Companions ("Who Else Is Going?")

**Status:** Not built

**Architecture:**
- Query `travel_intents` table for same destination + overlapping dates
- Show count + anonymized profiles (first name + avatar only until mutual opt-in)

**UI Component:** Badge on itinerary screen: "3 other ROAM travelers in Tokyo this week"
- Tapping shows list with "Connect" button

**Priority:** Future
**Complexity:** Medium — privacy controls, opt-in/out flow

---

### 3E. Local Meetups

**Status:** Not built

Similar to 3D but focused on real-time proximity. Requires location permissions on device.

**Priority:** Future
**Complexity:** High — location tracking, safety, moderation

---

### 3F. Verified Traveler Badges

**Status:** Partially built — badge system exists in `lib/passport.ts`

**Enhancement needed:**
- Add photo verification for "actually traveled" stamps (user uploads photo at destination, GPS-tagged)
- Display verified badge on profile and reviews

**Priority:** Nice-to-have
**Complexity:** Low (photo + GPS metadata check)

---

## 4. Media & Content

### 4A. Vertical Video Feed

**Status:** Not built

**APIs:**
- YouTube Data API v3 (free tier: 10,000 units/day) — search travel shorts by destination
- No official TikTok content API for embedding (ToS issues)

**Architecture:**
- Edge function curates YouTube Shorts by destination keyword
- Cache video IDs in Supabase `destination_videos` table
- Refresh weekly

**UI Component:** `app/(tabs)/explore-video.tsx` or modal from Discover
- Full-screen vertical video player (expo-av)
- Swipe up for next video
- Destination tag overlay + "Plan this trip" CTA

**Integration:**
- Accessible from Discover screen via "Watch" tab or floating video icon
- "Plan this trip" deep links to plan wizard with destination pre-filled

**Priority:** Nice-to-have (high engagement potential)
**Complexity:** High — video playback, content curation, performance optimization

---

### 4B. User-Generated Content

**Status:** Not built (depends on 3C — Community Reviews)

Ship community reviews first, then layer in UGC photo/video upload.

**Priority:** Future
**Complexity:** High — moderation, storage costs, content policy

---

### 4C. "Trending on Social" Destination Cards

**Status:** Not built

**Architecture:**
- Edge function that queries social trends via SerpAPI or social listening tool
- Curated list refreshed weekly, stored in Supabase `trending_destinations`

**UI Component:** Horizontal card row on Discover screen with "Trending" label
- Each card: destination photo, trend reason ("Viral sunset spot"), source icon

**Priority:** Nice-to-have
**Complexity:** Medium — trend data sourcing, editorial curation

---

### 4D. Creator Itineraries

**Status:** Not built

**Architecture:**
- New Supabase table: `creator_itineraries (id, creator_name, handle, platform, destination, itinerary_json, featured, created_at)`
- Admin-curated initially, creator submission portal later

**UI Component:** Special card style on Discover with creator attribution
- "Curated by @creator" badge
- Full itinerary viewable in existing itinerary screen

**Priority:** Nice-to-have (strong for marketing)
**Complexity:** Low (manual curation) → Medium (creator portal)

---

### 4E. Hidden Gem Submissions

**Status:** Not built (depends on community layer)

**Priority:** Future
**Complexity:** Medium

---

## 5. Safety & Practical

### 5A. Real-Time Safety Alerts

**Status:** Not built (see 1A — Safety Scores covers this)

Spec covered under 1A. Safety scores + alert modal with live advisory data.

---

### 5B. US State Department Integration

**Status:** Not built

**APIs:**
- State Dept Travel Advisory RSS feed (free, no key): `https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html`
- Levels 1–4 mapping to UI colors

**Integration:**
- Parse RSS in edge function, store in `destination_safety` table
- Display as part of Safety Score (1A)

**Priority:** Must-have (bundled with 1A)
**Complexity:** Low

---

### 5C. Emergency Contact Storage

**Status:** Already shipped

`components/features/EmergencySOS.tsx` — long-press SOS with GPS SMS. Contact stored in AsyncStorage via Profile screen.

---

### 5D. Offline Mode

**Status:** Already shipped

`lib/offline.ts` — AsyncStorage persistence for trips + itineraries. Zustand store rehydrates from offline cache on app launch.

---

### 5E. Visa Requirement Checker

**Status:** Partial — Claude generates visa info as part of itinerary, but no dedicated checker.

**APIs:**
- Sherpa API (paid, $0.01/req) — comprehensive visa data
- Passport Index (free data, scraping required)
- VisaDB (free tier available)

**UI Component:** `components/features/VisaChecker.tsx`
- Input: passport nationality (stored in profile)
- Output: visa required / visa-free / e-visa / visa on arrival
- Duration, cost, processing time
- Link to embassy or application portal

**Integration:**
- Show on itinerary screen in practical info section
- Also accessible from Profile as "My Passport" settings (nationality selector)
- New profile field: `passportNationality: string` in Zustand + Supabase

**Priority:** Must-have
**Complexity:** Medium — data accuracy is critical, API cost consideration

---

### 5F. Vaccination Requirements

**Status:** Not built

**APIs:**
- CDC Traveler's Health API (free, limited)
- WHO vaccination recommendations (static data, manually maintained)

**UI Component:** Section within Visa Checker or standalone `VaccinationCard.tsx`
- List of required / recommended vaccinations
- Timeframe warnings ("Get yellow fever vaccine 10 days before travel")

**Integration:**
- Show on itinerary practical info section, below visa info

**Priority:** Nice-to-have
**Complexity:** Low (static dataset) → Medium (live CDC data)

---

### 5G. Travel Insurance Comparison

**Status:** Not built

**APIs:**
- Squaremouth API (affiliate, free to integrate)
- World Nomads affiliate program
- SafetyWing affiliate program

**UI Component:** `components/features/InsuranceCard.tsx`
- 2–3 plan comparison cards with price, coverage summary, CTA
- Sorted by price or coverage level

**Integration:**
- Show on itinerary screen as "Protect your trip" section
- Affiliate links tracked via existing `lib/affiliate-tracking.ts`

**Priority:** Nice-to-have (revenue opportunity)
**Complexity:** Low

---

## 6. Gamification 2.0

### 6A. World Map Visualization

**Status:** Partially built — `app/(tabs)/passport.tsx` tracks stamps by country with flag emojis. No actual map visualization.

**APIs:**
- `react-native-svg` for vector world map (already in dependencies check)
- GeoJSON country boundaries (free, public domain)

**UI Component:** `components/features/WorldMap.tsx`
- SVG world map, visited countries filled with sage green
- Tap a country to see trip details
- Stats overlay: "12 of 195 countries visited"

**Integration:**
- Replace or augment the stamps section in Passport screen
- Data source: existing `stamps` array in `lib/passport.ts`

**Priority:** Must-have (high shareability)
**Complexity:** Medium — SVG rendering performance, country boundary data

---

### 6B. Travel Personality Quiz

**Status:** Already shipped

`app/alter-ego.tsx` — full quiz flow with personality result + custom AI persona.

---

### 6C. Badge System

**Status:** Already shipped

`lib/passport.ts` — badges (First Flight, Explorer, Globetrotter, etc.) with unlock criteria. Rendered in Passport screen.

---

### 6E. Leaderboard

**Status:** Not built

**Architecture:**
- New Supabase view or function: `leaderboard_view` — ranks users by countries visited, trips completed, badges earned
- Scoped to friends (requires follow/friend system) or global

**UI Component:** `components/features/Leaderboard.tsx`
- Ranked list: position, avatar, name, score, top badge
- Tabs: "Friends" / "Global"
- Current user always visible at bottom if not in top 10

**Integration:**
- Accessible from Passport screen via "Leaderboard" button
- Requires friend/follow system (see Social layer) for friends tab

**Priority:** Future (needs user base + social layer)
**Complexity:** Medium

---

### 6F. Trip Challenges

**Status:** Not built

**Architecture:**
- New Supabase table: `challenges (id, title, description, criteria_json, badge_id, active)`
- Criteria examples: `{ type: "budget_under", value: 500 }`, `{ type: "solo_trip" }`, `{ type: "destination_count", value: 3, timeframe: "month" }`
- Edge function evaluates challenge completion after trip save

**UI Component:** `components/features/ChallengeCard.tsx`
- Card with challenge title, progress bar, reward badge preview
- Horizontal carousel on Discover or Passport screen

**Priority:** Nice-to-have
**Complexity:** Medium

---

## 7. AI Superpowers

### 7A. Voice Trip Planning

**Status:** Partial — `lib/elevenlabs.ts` has TTS (text-to-speech) for itinerary narration. No speech-to-text input.

**APIs:**
- Expo Speech Recognition (`expo-speech`) — free, on-device
- Whisper API via OpenAI ($0.006/min) — higher accuracy
- Deepgram (free tier: 12,000 min/year)

**UI Component:** Floating microphone FAB on Chat screen
- Tap to start recording, tap again to stop
- Transcribed text appears in chat input
- Visual feedback: pulsing ring animation during recording

**Integration:**
- Add to `app/(tabs)/chat.tsx`
- Transcribed text feeds into existing `handleSend()` flow
- On-device `expo-speech` for v1, Whisper for v2 if accuracy is insufficient

**Priority:** Must-have
**Complexity:** Low (expo-speech) → Medium (Whisper integration)

---

### 7B. Photo-to-Destination

**Status:** Not built

**APIs:**
- Google Cloud Vision API (free tier: 1000 req/month) — landmark detection
- Claude Vision (already have Claude integration) — describe image, identify location

**Architecture:**
- User uploads photo from camera roll
- Send to Claude with vision prompt: "Identify the location in this photo. Return city, country, and confidence level."
- If confident, pre-fill plan wizard with destination

**UI Component:** Camera icon button on Discover search bar
- Opens image picker
- Loading state while AI processes
- Result card: "This looks like Santorini, Greece" + "Plan a trip here" CTA

**Integration:**
- Add to Discover screen search bar (camera icon next to search input)
- Uses existing Claude edge function, extended with vision support
- New edge function route or parameter for image analysis

**Priority:** Nice-to-have (strong wow factor for demos)
**Complexity:** Medium — image upload to edge function, Claude vision prompt engineering

---

### 7C. "Surprise Me" Mode

**Status:** Already shipped

`app/(tabs)/globe.tsx` — Spin the Globe feature. AI picks a random destination and generates full itinerary.

---

### 7D. Price Prediction

**Status:** Not built

**APIs:**
- Hopper API (private, requires partnership)
- Google Flights QPX (deprecated)
- Skyscanner "Browse Quotes" endpoint — shows cheapest month
- AviationStack (free tier: 100 req/month)

**Architecture:**
- Difficult to do accurately without Hopper-level data
- Simpler v1: show historical price trends via Skyscanner month view
- "Best time to book" heuristic: general rules (6–8 weeks out for domestic, 2–3 months for international)

**UI Component:** `components/features/PriceTrend.tsx`
- Monthly price bar chart for flights to destination
- "Book now" vs "Wait" recommendation
- Caveat text about estimate accuracy

**Priority:** Future (data access is the bottleneck)
**Complexity:** High

---

### 7E. Packing List AI

**Status:** Already shipped

`lib/claude.ts` — system prompt generates packing list as part of itinerary JSON, factoring in destination, weather, trip length, and activities. Displayed in itinerary screen with Amazon affiliate links via `lib/affiliate-tracking.ts`.

---

### 7F. Real-Time Itinerary Adjustment

**Status:** Not built (Live Trip Mode exists but doesn't adjust for weather)

**Architecture:**
- When Live Trip Mode is active, check morning weather via existing `lib/weather.ts`
- If rain/storm detected, send itinerary + weather to Claude: "It's raining today in [destination]. Suggest indoor alternatives for these outdoor activities: [list]"
- Push notification with adjusted plan
- User accepts or dismisses

**UI Component:** Banner on Live Trip Mode Today's Plan card
- "Rain expected — here's your adjusted plan" with swap animation
- Toggle to revert to original

**Integration:**
- Background task via `expo-task-manager` checks weather at 7 AM local time
- Calls Claude edge function with adjustment prompt
- Updates Live Trip Mode card on Discover screen

**Priority:** Nice-to-have
**Complexity:** High — background tasks, notification timing, Claude call costs

---

## 8. Monetization Features

### 8A. Hotel/Flight Price Alerts

**Status:** Affiliate link infrastructure exists (`lib/affiliate-tracking.ts`). No price alerts.

**Architecture:**
- New Supabase table: `price_alerts (id, user_id, destination, alert_type, threshold, active, last_price, created_at)`
- Edge function cron job checks prices daily via Skyscanner/Booking.com API
- Push notification when price drops below threshold

**UI Component:** "Set price alert" button on Flight/Hotel cards
- Input: max price threshold
- Toggle on/off
- Alert history in Profile screen

**Priority:** Nice-to-have
**Complexity:** Medium — cron scheduling, push notification infrastructure

---

### 8B. ROAM Concierge (Premium Human + AI Planning)

**Status:** Not built

**Architecture:**
- New product in RevenueCat: `roam_concierge` ($49 one-time)
- After purchase, user fills detailed questionnaire (10–15 questions)
- Submission creates a Supabase record + triggers email to concierge team
- Concierge uses ROAM's AI tools + human expertise to build premium itinerary
- Delivered back into app as a special "Concierge" trip type with gold badge

**UI Component:** `app/concierge.tsx`
- Premium-styled intake form
- Status tracker: "Submitted → In Progress → Ready"
- Gold-accented itinerary card

**Integration:**
- Accessible from Plan screen as premium option
- Also promoted on Paywall screen

**Priority:** Nice-to-have (high-margin revenue)
**Complexity:** Medium (tech) + operational staffing requirement

---

### 8C. Sponsored Destination Cards

**Status:** Not built

**Architecture:**
- New Supabase table: `sponsored_destinations (id, destination, sponsor, cta_url, budget_remaining, impressions, clicks, active)`
- Render as Discover cards with subtle "Sponsored" label
- Track impressions and clicks for billing

**UI Component:** Standard Discover card with "Sponsored" micro-label (top-left, muted text)
- Same tap behavior → opens plan wizard or sponsor CTA URL

**Integration:**
- Insert 1 sponsored card per 8 organic cards in Discover grid
- Edge function serves active sponsorships based on targeting rules

**Priority:** Future (needs traffic volume)
**Complexity:** Low

---

### 8D. Creator Marketplace

**Status:** Not built (depends on 4D — Creator Itineraries)

Ship creator itineraries first (free/curated), then layer in paid marketplace.

**Priority:** Future
**Complexity:** High — payments, creator onboarding, revenue split

---

### 8E. Travel Insurance Affiliate

**Status:** Not built (see 5G)

Same spec as 5G. Revenue via affiliate commissions.

**Priority:** Nice-to-have
**Complexity:** Low

---

### 8F. Airport Lounge Access Affiliate

**Status:** Not built

**APIs:**
- LoungeBuddy affiliate program (or Priority Pass affiliate)
- DragonPass API

**UI Component:** `components/features/LoungeCard.tsx`
- Card shown on itinerary pre-departure section
- Airport name, lounge options, price, affiliate CTA

**Integration:**
- Show on itinerary screen day 1 (departure day) or in packing list section
- Affiliate link tracked via `lib/affiliate-tracking.ts`

**Priority:** Nice-to-have
**Complexity:** Low

---

## Implementation Priority Matrix

### Phase 1 — Ship Now (weeks 1–4)
| Feature | Complexity | Revenue Impact |
|---------|-----------|----------------|
| 1A Safety Scores | Medium | Retention |
| 1D Currency Exchange | Low | Retention |
| 2A Seasonal Recommendations | Medium | Conversion |
| 2B Budget Filtering | Low | Conversion |
| 5E Visa Checker | Medium | Retention |
| 6A World Map | Medium | Shareability |
| 7A Voice Planning (expo-speech) | Low | Engagement |

### Phase 2 — Next Quarter (weeks 5–12)
| Feature | Complexity | Revenue Impact |
|---------|-----------|----------------|
| 1C Flight Prices | High | Revenue |
| 5G Travel Insurance | Low | Revenue |
| 7B Photo-to-Destination | Medium | Virality |
| 8F Lounge Affiliate | Low | Revenue |
| 4D Creator Itineraries | Low | Marketing |
| 6F Trip Challenges | Medium | Retention |
| 5F Vaccination Requirements | Low | Retention |

### Phase 3 — Growth Features (quarter 2+)
| Feature | Complexity | Revenue Impact |
|---------|-----------|----------------|
| 3B Group Trip Planning | High | Retention |
| 4A Vertical Video Feed | High | Engagement |
| 8B ROAM Concierge | Medium | Revenue |
| 7F Real-Time Adjustment | High | Retention |
| 2D AI That Learns | High | Conversion |

### Phase 4 — Scale Features (requires user base)
| Feature | Complexity | Revenue Impact |
|---------|-----------|----------------|
| 3A Travel Partner Matching | High | Retention |
| 3D Destination Companions | Medium | Engagement |
| 6E Leaderboard | Medium | Retention |
| 8C Sponsored Destinations | Low | Revenue |
| 8D Creator Marketplace | High | Revenue |

---

## API Cost Summary

| API | Free Tier | Paid Tier | Used For |
|-----|-----------|-----------|----------|
| Frankfurter | Unlimited | N/A | Currency exchange |
| Windy Webcams | 1000/day | $0 | Webcam feeds |
| Travel Advisory (Tugo) | 100/day | N/A | Safety scores |
| State Dept RSS | Unlimited | N/A | Travel advisories |
| Skyscanner Affiliate | Partner approval | Rev share | Flight prices |
| Google Cloud Vision | 1000/mo | $1.50/1K | Photo recognition |
| NewsAPI | 100/day | $449/mo | Travel news |
| ExchangeRate-API | 1500/mo | $10/mo | Currency (backup) |
| Sherpa (Visa) | N/A | ~$0.01/req | Visa requirements |
| expo-speech | Free (on-device) | N/A | Voice input |

**Estimated monthly API costs at 10K MAU:** $50–$150 (mostly free tiers suffice at early scale)
