# ROAM Research Intelligence

Last updated: 2026-03-16

## 1. Competitor Analysis

### Trip Planning Segment

| Competitor | Position | Fatal Weakness | ROAM Edge |
|------------|----------|----------------|-----------|
| **Wanderlog** | Collaborative trip planning | No AI generation. Manual build. Crashes on large trips. Desktop-first. | One input → complete AI trip. Mobile-native. |
| **TripIt** (SAP Concur) | Business travel organizer | Organizes bookings you already made. Zero AI. Enterprise UI. | Plans before you book. Leisure-first. Gen Z design. |
| **Google Travel** | Travel search | Generic, no personalization, no itinerary generation. Search engine, not planner. | Vibe matching + day-by-day plan + live intel. |
| **Hopper** | Flight price prediction | $700M raised, still just price alerts. No itinerary, no destination prep. | Complete trip: itinerary + weather + safety + affiliate. |
| **ChatGPT / Claude Direct** | General AI | No live data. No travel UX. No offline. No affiliate revenue. No app. | Purpose-built UI + 10 live APIs + offline prep + Pro. |

### Traveler Matching Segment (The Real Opportunity)

| Competitor | What They Built | Why They Failed | ROAM Advantage |
|------------|-----------------|-----------------|----------------|
| **Couchsurfing** | Hospitality + social | Went pay-to-play 2020. Trust destroyed. Never recovered. | Free-first. Trust via trip generation, not hosting strangers. |
| **Tourlina** | Solo female travel app | Hyper-niche. No AI. No trip planning. Just messaging. | Full-stack: planning + matching + prep. All genders. |
| **Trespot** | Travel dating + AI planner | Requires booking verification. Friction. | Match instant — destination from generated itinerary. |
| **Pigeon** | Question deck compatibility | No trip planning. Manual destination input. | ROAM knows destination already. Zero friction. |

**Gap in one sentence:** No product combines AI trip generation with traveler matching. ROAM is the first to do both.

### Major OTA Pain Points (User Reviews)

| App | Top 1-Star Complaints | ROAM Opportunity |
|-----|----------------------|------------------|
| Booking.com | Refunds never processed, overbookings | Advocate for traveler; Trip Shield |
| Airbnb | Credits not cash, property mismatch | Verified conditions, backup suggestions |
| Expedia | Double charges, hidden fees | Price transparency, proactive alerts |
| Hopper | Bait-and-switch, no human support | Honest pricing, affiliate links to source |
| Skyscanner | Prices higher than airline sites | Affiliate disclosure, end-to-end ownership |

---

## 2. API Options & Data Sources

### Current ROAM Stack (Free, No API Key)

| Module | Source | Cache | Data |
|--------|--------|-------|------|
| Air Quality | Open-Meteo AQI | 2h | AQI, PM2.5, PM10 |
| Sun Times | sunrise-sunset.org | 6h | Sunrise, sunset, golden hour |
| Timezone | WorldTimeAPI | 24h | Timezone, DST |
| Public Holidays | Nager.Date | 7d | Holidays by country |
| Cost of Living | Offline data | N/A | Budget/comfort/luxury daily costs |
| Weather | Open-Meteo | 3h | 10-day forecast |
| Currency | Frankfurter | 24h | ECB exchange rates |
| Country Info | REST Countries | 30d | Languages, driving side, calling code |
| Safety | travel-advisory.info | 24h | Risk score 0-5 |
| Emergency | emergencynumberapi.com | 30d | Police, fire, ambulance |
| Geocoding | Open-Meteo | 30d | Lat/lng for any city |

**Total marginal data cost: $0.** Competitors pay $5-50/user/month for equivalent data.

### Alternative APIs (Free Tier)

| API | Free Tier | Use Case | Notes |
|-----|-----------|----------|-------|
| ExchangeRate-API | 1,500/mo | Currency backup | No key required |
| Travel Visa API | Free tier | Visa requirements | 200+ passports, eVisa links |
| US State Dept | Unlimited | Travel advisories | Official source |
| Passport Index | MIT license | Visa requirements | Offline dataset |

### APIs Considered, Not Used

| API | Reason |
|-----|--------|
| Amadeus | Requires API key, rate limits |
| Google Places | 10K/mo free but key required |
| OpenTripMap | Requires free key registration |
| WeatherAPI.com | Requires signup |

---

## 3. What Travelers Actually Need

### Gen Z Research (2025-2026)

- **72% of Gen Z** confident using AI to plan 2026 trips (Skyscanner)
- **60%+ of Gen Z/Millennials** use AI for travel inspiration and itinerary planning (eMarketer)
- **55%+** influenced by social media and influencer content when choosing destinations
- **58%** value AI for time savings; **56%** for faster planning
- **52%** concerned about inaccurate AI responses; **47%** about impersonal recommendations

**ROAM answer:** Opinionated, specific, named places. "Order the pad see ew at Jay Fai" not "explore local dining."

### Top Pain Points (Traveler Surveys)

1. **Planning takes 8-12 hours** — 15+ tabs, scattered information
2. **Generic AI output** — "Consider exploring" is useless
3. **No live data** — Weather, currency, safety go stale in ChatGPT
4. **Solo travel is lonely** — 80% of trips involve 2+ people; no app helps find the second person
5. **Refugee status when things go wrong** — OTAs don't advocate for travelers

### What Travelers Trust

- **Specific recommendations** — named restaurants, real dishes, real prices
- **Live data** — weather, currency, safety updated in real time
- **Offline access** — emergency numbers, phrases when no signal
- **Privacy-first matching** — opt-in visibility, no real photos until match

---

## 4. Market Signals

| Signal | Source | Implication |
|--------|--------|-------------|
| AI travel planning market $904M (2024) → $2.36B (2031) at 14.7% CAGR | QY Research | Category growing; no dominant player |
| 60% of Gen Z took 2+ holidays in 2025; 2/3 plan to increase 2026 budget | Simon-Kucher | Highest spend cohort; ready to pay |
| Travel content up 410% on TikTok since 2021 | TikTok | Discovery happens on social, not search |
| 30M+ monthly TikTok users in DACH (25.7M DE, 2.5M AT, 2.2M CH) | Bayern Tourism | German TikTok is unclaimed for AI travel |
| 69% use Instagram, TikTok, YouTube for holiday planning | TUI survey | UGC-first distribution is the channel |

---

## 5. Strategic Recommendations

1. **Own the opinionated voice** — Generic AI is the #1 complaint. ROAM's specificity is the moat.
2. **Ship People tab first** — Traveler matching is the defensible moat; planning is table stakes.
3. **Stay free-API** — Zero marginal data cost = 85%+ gross margin at scale.
4. **DACH first** — $70B+ Germany outbound; zero dominant AI travel app; Quinn has Austrian passport.
5. **UGC over paid ads** — CAC $3-5 via creators vs $15-25 for travel ads. Travel content is inherently shareable.
