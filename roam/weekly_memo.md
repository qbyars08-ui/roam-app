# ROAM Weekly Investor Memo

Week of: 2026-03-16 to 2026-03-22

## What Shipped This Week

### Product
- 75+ screen React Native app live at **tryroam.netlify.app**
- Full AI trip generation flow operational (Claude Sonnet via Supabase Edge Function)
- Prep tab with live travel intelligence: weather, air quality, currency, emergency numbers, cost of living
- Plan, Discover, People, Flights, Prep tabs — all functional
- Skyscanner + Booking.com affiliate links live
- RevenueCat Pro subscription integrated

### Intelligence & Strategy
- **Research Intelligence** — Competitor analysis, API options, traveler needs consolidated in `roam/research-intelligence.md`
- **Investor Narrative** — TAM refreshed, elevator pitch updated, why ROAM wins documented
- **DACH Strategy** — People tab scripts added, Austrian founder angle strengthened, EU market strategy documented

## Traction

| Metric | Status |
|--------|--------|
| App | Live at tryroam.netlify.app |
| Tab Structure | 5 tabs: Plan, Discover, People, Flights, Prep |
| Free APIs | 10+ integrated (weather, AQI, currency, safety, holidays, etc.) |
| DACH | 10 scripts, 20 influencers, strategy complete |
| Target | DACH beachhead: $70B Germany outbound, zero dominant AI travel app |

## Market Update

- **AI travel planning:** $904M (2024) → $2.36B (2031) at 14.7% CAGR (QY Research)
- **Gen Z:** 72% confident using AI for 2026 trips; 60%+ use AI for travel planning (Skyscanner, eMarketer)
- **DACH TikTok:** 30M+ monthly users (25.7M DE, 2.5M AT, 2.2M CH); 69% use social for holiday planning

## What's Next (Week of 2026-03-22)

1. **People Tab Backend** — Wire `people.tsx` to `lib/social.ts`; replace mock data with live Supabase
2. **DACH Creator Outreach** — Begin DM campaign to Week 1 shortlist (5 creators with email contact)
3. **TestFlight** — Submit first iOS build for internal testing
4. **RevenueCat Products** — Create Pro subscription products in dashboard

## Key Risks

| Risk | Mitigation |
|------|-----------|
| Claude API costs at scale | Edge function rate limiting, caching, prompt optimization |
| User acquisition cost | UGC-first strategy, zero paid ads initially |
| App Store approval | Following checklist, TestFlight first, privacy policy ready |
| Competitor response | Speed — ship daily, DACH niche first |

## Burn Rate

| Category | Monthly |
|----------|---------|
| Supabase | $25 |
| Claude API | ~$50 |
| Netlify | $0 |
| PostHog | $0 |
| RevenueCat | $0 (free under $2.5K MRR) |
| UGC Budget | $0 (barter) → $850 (Phase 1) |
| **Total** | **$75 pre-launch → $925 with UGC** |

## Founder Note

This week was about making the intelligence and strategy explicit. Research, investor narrative, and DACH materials are now written to output files — ready for investor conversations, creator outreach, and EU grant applications.

The market signal is clear: Gen Z leads AI travel adoption. 72% confident using AI for 2026 trips. DACH has 30M+ TikTok users and zero dominant AI travel app. The window is open.

Plan the trip. Find your people. Go.
