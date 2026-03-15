# Monetization Model — 2026-03-15

> Agent 07 — MONETIZATION ARCHITECT output
> Post-restructure update: 5-tab navigation (Plan, Discover, People, Flights, Prep)
> Aligned with: `roam/dach_strategy.md`, `roam/growth_dashboard.md`, `roam/AGENT_BOARD.md`

---

## Revenue Streams

| Stream | Status | Monthly Estimate | Notes |
|--------|--------|-----------------|-------|
| RevenueCat Pro (monthly) | Live | $125–$300 | 5% free-to-paid conversion |
| RevenueCat Pro (yearly) | Live | $80–$200 | Lower volume, higher LTV |
| Skyscanner affiliate | Live + PostHog fixed | $30–$80 | ~2% click-to-book rate |
| Booking.com affiliate | Live | $20–$60 | AID placeholder — needs real AID |
| GetYourGuide affiliate | Live | $15–$40 | Experiences are high-margin |
| Creator revenue share (Micro tier) | Planned Month 1 | $0 | 10% of attributed Pro MRR |
| Creator revenue share (Partner tier) | Planned Month 2+ | $0 | 15% of attributed Pro MRR |
| **Total** | | **$270–$680** | Pre-DACH scale |

---

## People Tab Monetization

### The Paywall Structure

The People tab is ROAM's viral differentiator and the highest-leverage monetization surface.
Every interaction that creates real value is Pro-gated; the free tier is designed to create
FOMO and urgency, not to satisfy.

#### Free Tier — People Tab
- See first **3 matched travelers** per session (cards 4+ are dimmed with a Pro gate overlay)
- Browse all open group trips (visible, but join is limited)
- **Join 1 group trip** (groups 2+ show a Pro lock badge; tapping → paywall)
- "Connect" button on any traveler → paywall (DM is Pro-only)
- View traveler profiles (destination, dates, vibes, bio, match score)
- See hero stats (active travelers, destinations, groups forming)

#### Pro Tier — People Tab
- **Unlimited matched travelers** — see all matches for every destination
- **Direct messages** — Connect button opens messaging thread
- **Join unlimited groups** — no cap on group membership
- **Create groups** — start a new group trip (Pro-only creation flow)
- **Live presence** — "Who's in [destination] right now" feature (future release)
- First-mover positioning: "ROAM is the only travel app with real traveler matching"

### Paywall Trigger Design

The paywall fires at the moment of highest intent — not on tab load, but on action:

| Trigger | Condition | Paywall Reason | Headline |
|---------|-----------|----------------|----------|
| "Connect" button tapped | Any traveler, any tier | `feature` / `people-dm` | "Direct messages are a Pro feature. Connect for real." |
| Traveler card 4+ tapped | Free user | `feature` / `people-unlimited-matches` | "See every traveler going where you're going." |
| Pro gate banner tapped | Free user, between card 3 and 4 | `feature` / `people-unlimited-matches` | "Unlock all travelers" |
| Group join tapped (group 2+) | Free user | `feature` / `people-groups` | "Join every group. Pro unlocks unlimited groups." |

**Why Connect always requires Pro:** Direct messaging is the action that creates real social value.
Letting free users browse travelers without connecting creates curiosity and FOMO — then the moment they
find someone they want to meet, the paywall converts at maximum intent.

### PostHog Events for People Tab

| Event | Properties | Purpose |
|-------|-----------|---------|
| `pro_gate_shown` | `feature: people-dm` | Track Connect block |
| `pro_gate_shown` | `feature: people-unlimited-matches` | Track match limit hits |
| `pro_gate_shown` | `feature: people-groups` | Track group join blocks |
| `paywall_viewed` | `reason: feature, feature: people-*` | Funnel entry |
| `purchase_success` | — | Conversion |

---

## Plan Tab Monetization

### Free vs. Pro on Plan Tab

| Feature | Free | Pro |
|---------|------|-----|
| Generate trips | 1/month | Unlimited |
| Trip cards view | All trips visible | All trips visible |
| AI re-generation | Locked (Pro gate) | Re-generate with new options |
| Hotel alternatives | Locked (Pro gate) | Swap stays inline |
| Food alternatives | Locked (Pro gate) | Swap restaurants inline |
| Conversation mode | Available | Priority AI (faster) |
| Quick mode | Available | Available |

### Plan Tab Pro Features (Implemented as Gates)

Two Pro feature teaser cards appear in the trip list view (below Quick Actions) for free users:
- **Re-generate** (`plan-regenerate`) — regenerate the itinerary with fresh AI suggestions
- **Hotel alternatives** (`plan-hotel-alternatives`) — swap stays from 3–5 curated options

Both show a lock icon and `COLORS.gold` styling (premium signal). Tapping → paywall with
`reason: feature, feature: plan-regenerate` or `plan-hotel-alternatives`.

### Plan Tab Affiliate Revenue Map

The three Quick Action cards in the Plan tab's trip list view each drive affiliate revenue:

| Quick Action | Destination | Partner | Revenue Model |
|-------------|-------------|---------|---------------|
| Find stays (hotel icon) | Opens quick generate mode | Booking.com via itinerary | CPA per booking |
| Find food (fork icon) | Opens quick generate mode | GetYourGuide via itinerary | CPA per booking |
| Book flights (plane icon) | Navigates to Flights tab | Skyscanner via FlightCard | CPC/CPA per click |

**Revenue chain for Plan → Stays/Food:**
1. User taps "Find stays" → generate mode with hotel/food focus
2. AI generates itinerary with hotel recommendations
3. Itinerary screen shows Booking.com affiliate card
4. User taps → `openBookingLink()` fires `AFFILIATE_CLICK` PostHog event + Supabase insert
5. User books on Booking.com → affiliate commission to ROAM

**Revenue chain for Plan → Flights:**
1. User taps "Book flights" → Flights tab
2. Flights tab shows `FlightCard` with Skyscanner affiliate URL
3. User taps "Search flights" → `openBookingLink()` fires `AFFILIATE_CLICK`
4. User books on Skyscanner → affiliate commission to ROAM

**Estimated Plan tab affiliate revenue:**
- $25–60/month from hotel referrals (Booking.com needs real AID first)
- $30–80/month from flight referrals (Skyscanner `associateId=roam`)
- $15–40/month from experience referrals (GetYourGuide)

---

## RevenueCat Subscription Details

| Product ID | Plan | Price | Entitlement |
|-----------|------|-------|-------------|
| `roam_pro_monthly` | Pro Monthly | $4.99/month | `pro` |
| `roam_global_yearly` | Pro Yearly | $29.99/year | `pro` |

**Free tier:** 1 trip/month + 3 People matches + 1 group join  
**Guest tier:** 1 trip total, then paywall  
**Pro tier:** Unlimited trips, all gated features

### Full Pro Feature Gate Registry (`lib/pro-gate.ts`)

| Feature Key | Description |
|-------------|-------------|
| `unlimited-trips` | Unlimited AI trip generations |
| `offline-prep` | Offline PREP mode (safety, visa, currency) |
| `priority-ai` | Priority Claude responses |
| `travel-twin` | Travel personality matching |
| `trip-chemistry` | Group compatibility analysis |
| `memory-lane` | Travel memory journal |
| `people-dm` | Direct messages on People tab |
| `people-unlimited-matches` | See all matched travelers (>3) |
| `people-groups` | Join multiple groups |
| `people-create-group` | Create a new group trip |
| `people-live-presence` | Who's in a destination right now |
| `plan-regenerate` | Re-generate itinerary with AI |
| `plan-hotel-alternatives` | Swap hotels inline |
| `plan-food-alternatives` | Swap restaurants inline |

---

## 3-Tier Creator Payment Model

### Tier 1 — Barter
**For:** Nano creators (<10K), university ambassadors, travel club members  
**Cash:** $0  
**Perks:** Free ROAM Pro (lifetime) + featured on `roamapp.co/creators`  
**Obligations:** 2 posts/month, must use personal referral code as bio link  
**Tracking:** Referral code → `waitlist_emails.referral_count`

### Tier 2 — Micro
**For:** Micro creators (10K–100K followers), DACH audience, >3% engagement  
**Cash:** $20–50 per video (based on audience size)  
**Revenue share:** 10% of attributed Pro MRR for 90 days  
**Attribution:** `utm_source=creator&utm_medium=ugc&utm_campaign={creator_slug}`  
**Minimum views:** 10K for full payment; 5K–10K earns 50%  
**Upgrade trigger:** 15+ Pro conversions/month → auto-offered Partner tier

### Tier 3 — Partner
**For:** Mid-macro creators (100K–500K+) or upgraded Micro performers  
**Cash:** $200–500 per video (negotiated per creator)  
**Revenue share:** 15% of attributed Pro MRR for 180 days  
**Extras:** Custom itinerary package sent cold, 30-min onboarding call, exclusivity clause  
**Bonus:** $100 at 1M+ views; $150 at 50+ conversions per video

---

## Affiliate Performance

| Partner | Integration | PostHog | Est. CTR | Monthly Rev Est. |
|---------|-------------|---------|----------|-----------------|
| Skyscanner | FlightCard, FlightPriceCard, itinerary | Fixed | 8–12% | $30–80 |
| Booking.com | BookingCards, itinerary | Fixed | 6–10% | $20–60 |
| GetYourGuide | BookingCards, itinerary | Fixed | 5–9% | $15–40 |
| SafetyWing | booking-links.ts | Via openBookingLink | 2–4% | $5–15 |
| Airalo | booking-links.ts | Via openBookingLink | 3–6% | $8–20 |

---

## Optimization Opportunities

- [ ] **Fix Booking.com AID** — Current `aid=roam` is a placeholder. Sign up at `partners.booking.com`. Zero-cost revenue unlock — est. +$20–60/month immediately.
- [ ] **Plug itinerary.tsx `openAffiliate()` gap** — Raw `Linking.openURL()` bypasses tracking. Estimated 30–40% of affiliate clicks invisible.
- [ ] **People tab: Create Group flow** — Lock "Create Group" button behind Pro. Currently `pro-create-group` is gated in `lib/pro-gate.ts` but no UI exists yet. Add a "+" button to the groups section header.
- [ ] **People tab: Live presence** — "Who's in Tokyo right now" — Pro feature. Requires Supabase Realtime + `traveler_profiles` table (blocked on Quinn: schema creation needed).
- [ ] **Plan tab: AI re-generation** — Actually implement the re-generate flow (call Claude with same params + `regenerate: true`). Currently just a Pro gate teaser.
- [ ] **German landing page** — Dedicated `roamapp.co/de` for DACH creator links. Est. +15% DACH install conversion.
- [ ] **Paywall: People-specific headline** — Add `reason: 'people'` to paywall headlines. "Your travel squad is waiting. Go Pro to connect." 
- [ ] **Skyscanner Affiliate Partner Program** — Apply for live price data API. Live prices → 3–5x CTR on FlightCard.
- [ ] **A/B test People paywall trigger** — Test: gate fires on 3rd traveler vs. fires only when "Connect" is tapped. Hypothesis: action-based trigger converts 20% better than passive limit.
- [ ] **Revenue share automation** — By Month 3, build PostHog → Wise API payout script. Manual payments don't scale past 10 creators.

---

## Key Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Free → Pro conversion (People trigger) | 8% (higher-intent gate) | PostHog funnel |
| Free → Pro conversion (Plan limit) | 3–5% | PostHog funnel |
| People tab paywall view → purchase | 5% | RevenueCat + PostHog |
| Affiliate CTR (Skyscanner) | 10% of flight card views | PostHog `affiliate_click` |
| Creator CAC (flat + share ÷ installs) | Under $2 | Monthly spreadsheet |
| DACH paid users | 25 by Month 2, 100 by Month 4 | RevenueCat + PostHog geo |
| Churn (monthly) | Under 8% | RevenueCat |

---

## Referral Program

| Referrals | Reward |
|-----------|--------|
| 3 | 1 month Pro free |
| 6 | 2 months Pro free |
| 9 | 3 months Pro free |
| 10 | 1 year Pro free |

Tracked in `referral_codes` table; `pro_referral_expires_at` on profiles.

---

## DACH Creator Budget (Month 1)

| Line Item | Cost |
|-----------|------|
| Barter creators (20 × Pro lifetime) | $0 |
| Micro flat rate (20 posts × $25 avg) | $500 |
| Partner test (1 creator × $200) | $200 |
| UGC platform fee (Billo/Insense) | $150 |
| **Total cash** | **$850** |
| **Expected attributed MRR** | **$125–300** |
