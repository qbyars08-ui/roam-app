# ROAM Weekly Investor Memo

Week of: 2026-03-15 (Overnight Quality Pass)

---

## What Shipped This Week

### Flights Tab — Complete Rebuild

The old flights tab was placeholder UI. The new one is production-ready:

- **Hero search** with origin/destination inputs and "Search on Skyscanner" CTA
- **6 popular routes** in a 2×3 grid (London–Barcelona, NYC–Miami, Tokyo–Bali, etc.) with real Skyscanner deep links that include `associateId=roam`
- **4 inspiration cards** (horizontal scroll) — seasonal recommendations with destination photo, month badge, and specific reason to visit
- **Affiliate disclosure** — transparent one-liner: "ROAM earns a small commission when you book through Skyscanner."
- **Zero broken APIs, zero mock data** — every button works, every link opens a real Skyscanner search
- PostHog events: `flights_popular_route_tapped`, `flights_skyscanner_opened`, `flights_inspiration_tapped` all instrumented

### P0 Bug Fixes (3 Critical, All Resolved)

**Bug 1: AI Chat was completely broken**
- Root cause: Conversation mode sent the assistant greeting as `messages[0]` before any user input. Anthropic's API requires `messages[0].role === 'user'`. Every chat request returned a 400 error.
- Fix: Filter out leading assistant messages before sending to the edge function. Added `console.error` logging for future diagnosis.

**Bug 2: Sign-in routed to waitlist instead of real auth**
- Root cause: `isGuestLike` check in `onboard.tsx` step 3 caught ALL anonymous auth users — including newly registered ones — and showed `WaitlistCaptureModal` instead of `StepSignup`.
- Fix: Removed the waitlist branch. All users at step 3 now see real Apple/Google/Email auth options.

**Bug 3: Guest sessions had invalid JWTs**
- Root cause: `enterGuestMode()` created sessions with `access_token: ''`. The edge function correctly rejected these as invalid JWTs (401). Chat didn't work at all for guest users.
- Fix: `ensureValidSession()` in `lib/claude.ts` runs before every edge function call. If a fake session is detected, it calls `signInAnonymously()` to get a real Supabase JWT before proceeding.

### Polish Pass (6 Screens)

Replaced all "Something went wrong" errors with human copy:
- Generate tab: `"We couldn't build your trip. Check your connection and try again."`
- Conversation mode: same human error + added itinerary validation before storing (no more empty itineraries reaching the trip list)
- Paywall, group, plan, and waitlist screens: matching human error copy
- Added 90s/30s client-side timeouts to conversation mode generation (prevents infinite loading states)
- Trending badges: repositioned to top-right corner with correct icon sizing

### Infrastructure

- **Smart rebuild** — `netlify.toml` now skips Netlify builds when only non-code files change (`git diff --quiet HEAD~1 HEAD -- app/ components/ lib/ supabase/functions/ package.json`). Saves deploy minutes on docs-only commits.
- **Lazy tab loading** — `lazy: true` in `_layout.tsx` for all tabs. Heaviest screens (Prep, People, Flights) don't load until first tap.
- **Waitlist migration** — `20260325000001_waitlist_comprehensive_fix.sql` created with idempotent RLS policies. Waitlist now falls back gracefully if migration hasn't been applied.
- **Real Supabase credentials** — Verified in deployed bundle. No more `placeholder.supabase.co`.

---

## Traction

| Metric | Status |
|--------|--------|
| App | Live at tryroam.netlify.app |
| Chat | Working end-to-end (guest → anonymous auth → Claude → response) |
| Auth | Sign-in shows real Apple/Google/Email auth (not waitlist gate) |
| Flights tab | Fully rebuilt — hero + 6 routes + 4 inspiration cards + Skyscanner affiliate |
| Skyscanner affiliate | `associateId=roam` on every flight link — revenue-ready |
| Booking.com affiliate | Live but `AID=roam` is placeholder — **earning $0** until Quinn creates real AID |
| Pro subscription | RevenueCat integrated but **products not yet created** — $0 revenue |
| TypeScript | 0 errors |
| Deploy | Smart rebuild live — saves CI minutes on doc/config changes |

---

## What's Next (Week of 2026-03-16)

**P0 — Unblock revenue (Quinn actions, each <15 minutes):**
1. Apply `20260325000001_waitlist_comprehensive_fix.sql` in Supabase SQL Editor → unblocks waitlist signups
2. Sign up at partners.booking.com → get real AID → unlock est. $20-60/month immediately
3. Create `roam_pro_monthly` ($4.99) and `roam_global_yearly` ($29.99) products in RevenueCat → enable paid subscriptions

**P0 — Engineering:**
4. **Stays tab rework** — same pattern as Flights: hero + curated stays grid + Booking.com deep links
5. **Food tab rework** — hero + curated restaurant sections + Google Maps deep links
6. **People tab: wire to live Supabase data** — replace mock travelers with `findSquadCandidates()` calls. 2-3 hours of engineering. Social backend already deployed.

**P1 — Growth:**
7. **DACH soft launch** — send first 10 creator DMs with German TikTok brief. Scripts are written, platform research is done. Just need to press send.
8. **Image CDN** — research Cloudinary vs Supabase Storage for reliable destination images. Unsplash rate limiting causes blank cards.

---

## Competitive Landscape

| Competitor | Their Claim | Fatal Weakness | ROAM's Answer |
|---|---|---|---|
| **Wanderlog** | Trip planning | No AI generation. Manual. Desktop-first. Crashes on large trips. | One input → AI-generated trip. Mobile-native. |
| **TripIt** (SAP Concur) | Business travel | Organizes bookings you already made. Zero AI. No planning. | Plans the trip before you book. |
| **Google Travel** | Travel search | Generic results. A search engine, not a planner. | Personalized itinerary + live prep intelligence. |
| **Hopper** | Flight prices | Flights only. $700M raised, still just price alerts. | Itinerary + weather + safety + booking — all in one. |
| **Trespot** | Travel dating + AI | Requires booking verification to appear in matching. | Auto-matched from itinerary. Zero friction. |
| **Couchsurfing** | Travel social | Went pay-to-play in 2020. Trust destroyed. Community left. | Free-first. Privacy-by-default. Trust through value. |

**Market signal:** AI trip planner market at $1.74B growing 18.9% CAGR. No dominant mobile-native player. Traveler matching is unsolved at scale. DACH has zero AI travel app. ROAM is the only product that does both.

---

## Key Risks

| Risk | Status | Mitigation |
|------|--------|-----------|
| Revenue = $0 today | Active — Booking.com AID + RevenueCat products blocked | Both Quinn-unblockable in <30 min total |
| Unsplash rate limiting → blank images | Active | Image CDN research queued for next sprint |
| People tab on mock data | Active | Social backend deployed, wiring is 2-3h engineering |
| Chat edge function costs at scale | Monitored | Rate limiting + caching in place |
| DACH creator launch delayed | Waiting on first send | Scripts written, outreach templates ready |

---

## Burn Rate

| Category | Monthly |
|----------|---------|
| Supabase | $25 (Pro plan) |
| Claude API | ~$50 (current usage) |
| Netlify | $0 (free tier) |
| PostHog | $0 (free tier) |
| RevenueCat | $0 (free under $2.5K MRR) |
| UGC Budget | $0 (barter phase) → $850 (Phase 1 launch) |
| **Total** | **$75 pre-launch → $925 with DACH UGC** |

---

## Founder Note

The overnight pass answered the most important question a pre-revenue product faces: does it actually work?

Three P0 bugs were breaking the core experience. Chat was returning 400 errors for every guest user because of a JWT issue. Sign-in was routing to the waitlist instead of real auth. The flights tab had zero functionality. All three are fixed. A first-time user landing on tryroam.netlify.app tonight gets real auth, real AI chat, a real flights affiliate flow, and a polished generate experience.

The Skyscanner affiliate integration is the first revenue-capable surface. Every popular route tap, every inspiration card tap, every flight search routes through `associateId=roam`. Booking.com is wired but needs a real AID — that's a 15-minute task that unlocks $20-60/month immediately. RevenueCat is integrated but needs products created — another 15-minute task that enables all paid subscriptions.

ROAM is not waiting on engineering. The blockers are all Quinn-only administrative tasks. The product is live, the bugs are fixed, the affiliate links are ready, and the DACH strategy is execution-ready. The only variable is when to press send on the first German creator DM.

This sprint proved the agent system works at production quality. P0 bugs diagnosed and patched same day. Flights tab rebuilt from scratch overnight. Infrastructure improved in parallel. 0 salaries, $75/month, and the app is better than it was 48 hours ago.

Next sprint is the first growth sprint. DACH launches. Stays and food tabs ship. People tab goes live. Revenue turns on.
