# ROAM Weekly Investor Memo

Week of: 2026-03-10 to 2026-03-15

## What Shipped This Week

### Product
- 75+ screen React Native app live at **tryroam.netlify.app**
- Full AI trip generation flow operational (Claude Sonnet via Supabase Edge Function)
- Prep tab with live travel intelligence: weather forecast, air quality, sunrise/sunset, emergency numbers, currency converter, cost of living — all from free APIs, zero marginal cost
- Generate tab with premium compass animation loader
- Discover tab with 26 curated destinations, trending badges, seasonal recommendations
- Flights tab with Skyscanner affiliate deep links
- Stays tab with Booking.com affiliate deep links
- Food tab with venue enrichment pipeline

### Infrastructure
- 15 autonomous AI agents deployed for continuous development
- Agent system rebuilt: standardized naming, model optimization (Sonnet for all except Builder on Opus)
- TypeScript: 0 errors across entire codebase
- CI pipeline: ESLint + GitHub Actions workflow
- Supabase backend: JWT auth, RLS policies, rate limiting, edge function proxy
- PostHog analytics instrumented across all screens
- Full security audit completed

### Go-to-Market
- DACH (Germany/Austria/Switzerland) go-to-market strategy complete
- 10 German TikTok scripts written and ready for creator production
- UGC platform research done (Billo, Insense, Trend.io, Minisocial evaluated)
- Creator outreach system designed with 3-tier funnel
- Ambassador program spec with revenue share model

## Traction

| Metric | Status |
|--------|--------|
| App | Live and functional at tryroam.netlify.app |
| Waitlist | Form operational, collecting signups |
| Generate flow | Working end-to-end (destination in, full itinerary out) |
| Free tier | 1 trip/month, auto-resets, edge function enforced |
| Pro tier | RevenueCat integrated, paywall designed |
| Target market | DACH identified as beachhead (EU founder advantage) |

## What's Next (Week of 2026-03-15)

1. **Agent System Rebuild** — Migrate all Cursor agents to Sonnet (cost optimization, ~60% savings on AI compute)
2. **Image System Fix** — Wire destination photos end-to-end, gradient fallbacks for every card
3. **DACH Creator Outreach** — Begin DM campaign to 50 German travel micro-influencers
4. **RevenueCat Products** — Create Pro subscription products in RC dashboard
5. **Admin Testing Bypass** — Whitelist Quinn's email to skip rate limits during demos
6. **App Store Prep** — Begin submission checklist for TestFlight

## Competitive Landscape

| Competitor | Weakness ROAM Exploits |
|-----------|----------------------|
| Wanderlog | Desktop-first, not AI-native, no prep intelligence |
| TripIt | Enterprise-focused, no generation, dated UI |
| Google Travel | Generic, no personalization, no cultural intelligence |
| Hopper | Price-only, no itinerary, no destination prep |

ROAM is the only product that generates a complete trip plan AND provides live destination intelligence (weather, safety, language, currency) in a mobile-native, Gen Z-designed experience.

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Claude API costs at scale | Edge function rate limiting, caching, prompt optimization |
| User acquisition cost | UGC-first strategy, zero paid ads initially |
| App Store approval | Following checklist, TestFlight first, privacy policy ready |
| Competitor response | Speed — ship daily, iterate weekly, DACH niche first |

## Burn Rate

| Category | Monthly |
|----------|---------|
| Supabase | $25 (Pro plan) |
| Claude API | ~$50 (current usage) |
| Netlify | $0 (free tier) |
| PostHog | $0 (free tier) |
| RevenueCat | $0 (free under $2.5K MRR) |
| UGC Budget | $0 (barter phase) → $850 (Phase 1) |
| **Total** | **$75 pre-launch → $925 with UGC** |

## Founder Note

This week was about making invisible work visible. Six API integrations existed in the codebase but had zero UI. Now every one renders real data to real users. The agent system is being rebuilt for cost efficiency — same output, 60% less compute cost. DACH launch prep is complete: strategy, scripts, platform research, creator outreach templates all done. Next week is execution: first creator DMs go out, first German content gets filmed, first TestFlight build gets submitted.

The app is live. The strategy is written. The system is built. Now we ship.
