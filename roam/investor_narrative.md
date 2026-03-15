# ROAM — Investor Narrative

Last updated: 2026-03-15

## One-Liner
ROAM is an AI travel planner that generates complete trip itineraries in 30 seconds and gives you live destination intelligence — weather, safety, language, currency — so you travel like you know someone there.

## The Problem
Planning a trip takes 8-12 hours of research across 15+ tabs. Google, Reddit, travel blogs, booking sites, weather apps, currency converters, visa checkers, phrase books. Gen Z travelers (18-28) want to go everywhere but hate the planning process. The information exists — it's just scattered across the entire internet.

## The Solution
One input. One tap. Complete trip.

Type a destination, pick your budget and vibe, and ROAM generates a day-by-day itinerary with:
- Where to go, what to eat, what to see — hour by hour
- Live weather and 10-day forecast for your destination
- Cost of living breakdown (budget/comfort/luxury daily totals)
- Emergency numbers, hospital quality, pharmacy info
- Currency converter with live exchange rates
- Local phrases with pronunciation
- Visa requirements and travel advisories
- Flight and hotel affiliate links (Skyscanner + Booking.com)

All in a dark-mode, mobile-native UI designed for the same generation that uses TikTok and Instagram for travel inspiration.

## Why Now

Five forces are converging right now that make ROAM possible — and inevitable:

1. **AI quality threshold crossed** — Claude Sonnet produces specific, local, genuinely useful itineraries. This wasn't possible 18 months ago. The $0.003/1K token cost makes 85%+ gross margins achievable at launch.

2. **Free data infrastructure matures** — Open-Meteo, Frankfurter, REST Countries, emergencynumberapi.com now provide real-time weather, currency, safety, and cultural data at zero marginal cost. Competitors would pay $5-50/user/month for equivalent data.

3. **TikTok is the new travel search engine** — 77% of TikTok users say the platform influenced their last trip purchase. Travel videos are up 410% since 2021. 83% of users say TikTok sparked curiosity about destinations they'd never considered. Gen Z doesn't Google trips — they TikTok them.

4. **Gen Z is the biggest travel generation in history** — 69% of Gen Z and millennials find travel inspiration on social media. 80% of young travelers rely on mobile apps for trip planning. Post-COVID revenge travel + digital nomad culture = the largest, most mobile, most spend-ready travel cohort ever assembled.

5. **AI travel planning is an exploding market** — The AI trip planner market was $1.74B in 2024, growing at 18.9% CAGR to $9.13B by 2033. No dominant player has emerged. The category is wide open.

## Market

### TAM
- Global travel market: $1.9T (2025, WTTC)
- Online travel booking: $820B
- AI travel planning tools: $1.74B (2024) → $9.13B by 2033 at 18.9% CAGR

### SAM
- Gen Z + millennial mobile-first travel app users: ~400M globally
- Willing to pay $5-15/month for tools that save significant time and money

### Beachhead: DACH (Germany, Austria, Switzerland)

**Why DACH is the right first market:**
- Germany alone: **$70B+ in annual outbound travel** — Europe's #1 outbound tourism market
- DACH combined (100M+ German speakers): estimated **$104B+ in annual outbound travel expenditure**
- Highest travel spend per capita in the world — travel is culturally embedded, not aspirational
- Zero dominant AI travel app in the German-speaking market today
- DACH Gen Z already plans trips on TikTok — they search in German, not English
- Quinn has Austrian citizenship (EU founder status, not a US tourist trying to break in)
- English app + German marketing = no direct competition in the DACH discovery layer

### Expansion Path
DACH → Western Europe → UK → North America

## Competitive Landscape

| Competitor | Their Position | Core Weakness | ROAM's Edge |
|---|---|---|---|
| **Wanderlog** | Collaborative trip planning | No AI generation — users build itineraries manually. App crashes on large trips. Desktop-first UX. No destination prep (weather, safety, currency). | AI-native: one input → complete trip. Mobile-first. Full prep intel. |
| **TripIt** (SAP Concur) | Business travel organizer | Organizes bookings you *already made*. No planning. Enterprise UI. Zero AI. Locked in legacy SAP stack. | Plans the trip before you book. Built for leisure. Gen Z design. |
| **Google Travel** | Broad travel search | Generic results, no personalization, no itinerary generation, no cultural prep. A search engine, not a planner. | Travel profile + vibe matching + complete prep intelligence. |
| **Hopper** | Flight price prediction | Flights only. No destination itinerary. No cultural prep. No trip planning whatsoever. $700M raised, still just price alerts. | Complete trip: itinerary + prep + affiliate booking all in one. |
| **ChatGPT / Claude Direct** | General AI assistant | No travel-specific UX. No live weather, safety, or currency data. No affiliate integration. No offline access. No revenue model. | Purpose-built travel UX + 10 live APIs + affiliate revenue built in. |
| **Tineo / Wonderplan** | Newer AI trip planners | No offline prep, no group trips, no cultural intelligence, no destination-specific design themes. Generic AI wrapper. | Offline-first prep tab, group collaboration, 60+ curated destinations. |

**ROAM's moat in one sentence:** We are the only product that generates a complete trip plan AND provides live destination intelligence (weather, safety, language, currency) in a mobile-native, Gen Z-designed experience at zero marginal data cost.

### What's Hard to Replicate (Technical Moat)
- **Spatial intelligence** — activities scheduled under 30 minutes transit apart; not just a list
- **Weather-adaptive scheduling** — swap outdoor → indoor activities on rain forecast days
- **Travel profile personalization** — pace, budget level, crowd sensitivity, food preferences baked into every generation
- **60+ curated destinations** — custom color themes, local context, hand-tuned prompts per region
- **Offline-first prep tab** — safety data, emergency numbers, cultural context, currency all cached for no-signal use
- **Zero marginal data cost** — 10 free APIs eliminate the data costs competitors must pay

## Business Model

### Revenue Streams
1. **Pro Subscription** ($9.99/month) — Unlimited trip generation, offline access, priority support
2. **Affiliate Commissions** — Skyscanner flights (~$0.50-2.00/click), Booking.com stays (~$2-5/booking)
3. **Premium Destinations** — Curated local experiences, restaurant partnerships (Phase 2)

### Unit Economics (Target)
- CAC: $3-5 via UGC (vs $15-25 for paid travel ads)
- LTV: $60-120 (12-month Pro subscription)
- LTV/CAC: 12-24x
- Gross margin: 85%+ (AI generation costs ~$0.01/trip; free API data = $0 COGS on intelligence)

## Traction (as of 2026-03-15)

| Metric | Status |
|--------|--------|
| Product | Live at tryroam.netlify.app |
| Screens | 75+ unique screens/components |
| AI Generation | Working end-to-end |
| Free APIs Integrated | 10 (weather, AQI, sun times, holidays, cost of living, timezone, currency, emergency, transit, safety) |
| TypeScript Errors | 0 |
| Agent System | 15 autonomous AI development agents |
| DACH Strategy | Complete (scripts, platform research, creator outreach) |
| Revenue Integration | Skyscanner + Booking.com affiliate links live |
| Security | Full audit complete, RLS policies, JWT auth, rate limiting |
| Analytics | PostHog instrumented across all screens |

## Team
- **Quinn Byars** — Solo founder, Austrian citizen (EU advantage), German speaker
- **15 AI agents** handling development, testing, design, security, growth, content, and localization autonomously
- Claude (Sonnet) as orchestrator — coordinates all agents, manages deployments, writes strategy
- Shipping velocity: features ship daily; weekly strategy iteration; 0 salaries, 0 office, 0 overhead

## The Ask
Seeking pre-seed funding to:
1. Hire 1 React Native engineer (ship iOS + Android native builds)
2. Fund DACH creator campaign ($5K for first 30 UGC videos across TikTok + Instagram Reels)
3. Cover 6 months of infrastructure scaling (Supabase Pro, Claude API burst capacity)
4. **Total: $150K-250K pre-seed at $2M cap**

## Why ROAM Wins
1. **Zero marginal data cost** — 10 free APIs provide real-time travel intelligence; competitors pay for this data
2. **AI-native from day one** — Not a travel site with AI bolted on; AI IS the product
3. **UGC-first distribution** — 77% of TikTok users act on travel content; German TikTok is unclaimed territory
4. **EU founder advantage** — Austrian citizenship = EU entity, GDPR-native, DACH market access, German fluency
5. **15-agent development system** — Ship faster than teams 10x our size at a fraction of the burn rate
6. **Right market, right moment** — Germany is the #1 outbound travel market in Europe with zero AI travel app leadership

---

## 30-Second Elevator Pitch

Planning a trip takes 8 hours across 15 tabs. ROAM does it in 30 seconds.

Type a destination. Pick your vibe and budget. Get a full day-by-day itinerary — with live weather, safety intel, emergency numbers, currency rates, and local phrases. All from free APIs. No data licensing costs. 85% gross margins.

Our beachhead: Germany. $70B outbound travel market. No dominant AI travel app. A founder with EU citizenship, German fluency, and a 15-agent AI dev system that ships daily.

Pre-revenue. 75+ screens live. Raising $150-250K at a $2M cap.

One input. One tap. Complete trip.
