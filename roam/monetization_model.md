# Monetization Model — 2026-03-15

> Agent 07 — MONETIZATION ARCHITECT output
> Aligned with: `roam/dach_strategy.md`, `roam/growth_dashboard.md`

---

## Revenue Streams

| Stream | Status | Monthly Estimate (Month 1) | Notes |
|--------|--------|---------------------------|-------|
| RevenueCat Pro (monthly) | Live | $125–$300 | 5% free-to-paid on DACH cohort |
| RevenueCat Pro (yearly) | Live | $80–$200 | Lower volume, higher LTV |
| Skyscanner affiliate | Live (PostHog fixed) | $30–$80 | ~2% click-to-book rate |
| Booking.com affiliate | Live | $20–$60 | AID placeholder — needs real AID |
| GetYourGuide affiliate | Live | $15–$40 | Experiences are high-margin |
| Creator revenue share (Micro tier) | Planned — Month 1 | $0 | 10% of attributed Pro revenue |
| Creator revenue share (Partner tier) | Planned — Month 2+ | $0 | 15% of attributed Pro revenue |
| **Total** | | **$270–$680** | Early stage; DACH traction dependent |

---

## 3-Tier Creator Payment Model

ROAM pays creators to drive installs and Pro subscriptions. Attribution is via PostHog UTM parameters tied to each creator's unique link. Payments are made monthly via Wise or direct transfer.

---

### Tier 1 — Barter

**For:** Nano creators (under 10K followers), university ambassadors, travel club members

**Compensation:**
- Free ROAM Pro (lifetime, not time-limited)
- Featured on ROAM website: `roamapp.co/creators` — name, handle, photo, and their best ROAM video embedded
- Optional: "ROAM Ambassador" badge in-app on their profile (table: `profiles.ambassador_badge = true`)

**Obligations:**
- 2 posts per month minimum (TikTok or Instagram Reels)
- Must use creator's personal referral code as bio link
- Content must include a screen recording of ROAM generating a real trip
- German-language captions preferred for DACH audience

**Tracking:**
- Unique referral code generated via `lib/referral.ts`'s `generateReferralCode(email)`
- Referral count tracked in `waitlist_emails.referral_count`
- Pro granted via `profiles.pro_referral_expires_at = NULL` (lifetime) on manual approval

**Target volume:** 20–40 ambassadors active in Month 1–2

---

### Tier 2 — Micro

**For:** Micro creators (10K–100K followers) with DACH audience, proven travel/lifestyle content, and engagement rate above 3%

**Compensation:**
- **$20–50 per video** (paid within 7 days of posting, verified via TikTok/Instagram Analytics screenshot)
  - $20 base for 10K–30K audience
  - $35 base for 30K–60K audience
  - $50 base for 60K–100K audience
- **10% revenue share** on Pro subscriptions attributed to their creator link for 90 days post-posting
  - Attribution: `utm_source=creator&utm_medium=ugc&utm_campaign={creator_slug}` in bio link
  - Tracked in PostHog creator dashboards; exported monthly for payment calculation

**Per-video requirements:**
- 30–60 second screen recording of ROAM generating a real trip
- German captions (or mixed German/English) for DACH posts
- Hook formula: controversial opener + ROAM demo + German CTA ("Kostenlos testen — Link in Bio")
- Creator receives a filming brief via the UGC automation system (Claude-generated from destination + traveler type)
- Minimum 10K views to qualify for full payment; 5K–10K views earns 50% of flat rate

**Upgrade path:**
- Creators who drive 15+ Pro subscriptions in a month are automatically offered Partner tier
- Creators who go viral (500K+ views) are escalated to Partner regardless of conversion count

**Payment logistics:**
- Wise transfer to creator's account (EUR for DACH, USD otherwise)
- Monthly payment batch, first business day of the following month
- Creators submit payment details via a Typeform after first post goes live

**Target volume:** 5–10 active creators in Month 1, scaling to 20–30 by Month 3

---

### Tier 3 — Partner

**For:** Mid-to-macro creators (100K–500K+ followers) with proven conversion track record, OR top-performing Micro creators who have been upgraded

**Compensation:**
- **$200–500 per video** (negotiated per creator based on audience size and past performance)
  - $200 base for 100K–200K audience
  - $350 base for 200K–350K audience
  - $500+ for 350K+ audience (negotiated)
- **15% revenue share** on Pro subscriptions attributed to their creator link for 180 days post-posting
  - Same UTM attribution as Micro tier
  - Monthly reconciliation and payout

**Per-video requirements:**
- Same content quality bar as Micro tier
- Minimum 2 posts per campaign (usually 1 organic + 1 paid boost)
- Creator approves itinerary content used in video — ROAM provides a custom trip generated for that creator's audience and travel style
- Exclusivity clause: creator cannot post for direct competitor AI travel apps for 30 days before and after posting

**Custom onboarding:**
- Quinn sends a cold outreach package: a custom ROAM-generated itinerary for the creator's dream destination, formatted as a beautiful printed PDF (mailed or sent as a high-res digital file)
- 30-minute video call to walk through the app, content expectations, and payment terms
- Custom creator UTM link provisioned and tested before posting

**Performance bonus:**
- Video hitting 1M+ views: +$100 bonus
- Video driving 50+ Pro subscriptions: +$150 bonus (on top of 15% share)
- These are one-time bonuses per video, not recurring

**Target volume:** 2–3 Partner creators active per quarter in Month 1–3; scale as ROI is proven

---

## Creator Attribution & Tracking Infrastructure

### UTM Link Structure

All creator links follow this format:
```
https://apps.apple.com/app/roam/[id]?utm_source=creator&utm_medium=ugc&utm_campaign={creator_slug}&utm_content={platform}
```

Example: `utm_campaign=hannalena_tiktok&utm_content=tiktok`

### PostHog Attribution Chain

1. User clicks creator's bio link → PostHog records UTM on app open via `captureEvent(EVENTS.APP_OPENED.name, { utm_campaign, utm_medium, utm_source })`
2. User generates a trip → `EVENTS.TRIP_GENERATED` records session attribution
3. User hits paywall → `EVENTS.PAYWALL_VIEWED` with attribution context
4. User purchases → `EVENTS.PURCHASE_SUCCESS` with attribution, tied back to creator slug
5. Monthly export: PostHog funnel query filtered by `utm_source=creator`, grouped by `utm_campaign`, to calculate attributed Pro conversions per creator

### Revenue Share Calculation

```
creator_attributed_mrr = COUNT(PURCHASE_SUCCESS WHERE utm_campaign = creator_slug AND within_attribution_window)
                         × avg_monthly_price ($4.99/month or $29.99/year prorated)
creator_payment = creator_attributed_mrr × tier_share_rate (10% or 15%)
```

---

## Affiliate Performance

| Partner | Integration Status | PostHog Tracking | Estimated CTR | Monthly Revenue Est. |
|---------|-------------------|-----------------|---------------|---------------------|
| Skyscanner | Live — `FlightCard`, `FlightPriceCard`, `itinerary.tsx` | Fixed (PostHog now fires) | 8–12% of flight card views | $30–80 |
| Booking.com | Live — `BookingCards`, `itinerary.tsx` | Fixed (via openAffiliateLink) | 6–10% of hotel card views | $20–60 |
| GetYourGuide | Live — `BookingCards`, `itinerary.tsx` | Fixed (via openAffiliateLink) | 5–9% of experience card views | $15–40 |
| SafetyWing | Live — `booking-links.ts` | Via openBookingLink | 2–4% | $5–15 |
| Airalo | Live — `booking-links.ts` | Via openBookingLink | 3–6% | $8–20 |

### PostHog Affiliate Funnel (now tracking)

Events now fire on every affiliate click path:
- `FlightCard` → `openBookingLink()` → fires `affiliate_click` with `partner=skyscanner`
- `FlightPriceCard` → direct `captureEvent` → fires `affiliate_click` with `partner=skyscanner`
- `BookingCards` → `openAffiliateLink()` → fires `affiliate_click` with correct partner ID
- `itinerary.tsx` `openAffiliate()` → raw `Linking.openURL` (no tracking — fix in v2)

The `FLIGHT_BOOKING_FUNNEL` in `lib/posthog-funnels.ts` will now have data:
```
Flights tab view → FLIGHT_SEARCH → AFFILIATE_CLICK (partner=skyscanner)
```

---

## Optimization Opportunities

- [ ] **Fix Booking.com AID** — Current `aid=roam` is a placeholder. Register at `partners.booking.com` to get a real AID. This is a zero-cost revenue unlock.
- [ ] **Plug itinerary.tsx openAffiliate() tracking gap** — Raw `Linking.openURL` calls bypass all tracking. Replace with `openBookingLink()` calls. Estimated 30–40% of affiliate clicks are currently invisible.
- [ ] **Creator dashboard in-app or Notion** — Build a simple creator performance tracker: views, installs attributed, Pro conversions, payment due. Reduces creator churn from payment confusion.
- [ ] **Add affiliate clicks to Pro gate nudge** — When a free user taps a Skyscanner flight card, show a subtle upgrade message: "Pro users see better flight insights and save trips to plan around." Estimated +0.3pp conversion.
- [ ] **German landing page for creator links** — Instead of sending DACH creators to the English App Store, build a `roamapp.co/de` landing page that auto-detects German and shows German screenshots. Estimated +15% install conversion from DACH traffic.
- [ ] **Skyscanner partner API** — Apply for Skyscanner Affiliate Partner Program to access live price data. Currently showing "Search flights" without prices. Live prices → 3–5x higher CTR. Requires formal affiliate application.
- [ ] **Revenue share automation** — Manual monthly Wise transfers don't scale. By Month 3, build a simple payout dashboard: query PostHog for attributed conversions, calculate payment, trigger Wise API transfer. Keeps creators paid on time without manual spreadsheet work.
- [ ] **A/B test affiliate placement** — FlightCard currently appears at bottom of itinerary. Test: above Day 1 header vs. between Day 2 and Day 3. Hypothesis: mid-itinerary placement when user is most engaged will increase CTR by 20%.

---

## RevenueCat Subscription Details

| Product ID | Plan | Price | Entitlement |
|-----------|------|-------|-------------|
| `roam_pro_monthly` | Pro Monthly | $4.99/month | `pro` |
| `roam_global_yearly` | Pro Yearly | $29.99/year | `pro` |

**Free tier limit:** 1 trip/month (reset monthly via Supabase edge function)  
**Guest tier limit:** 1 trip total, then paywall  
**Pro tier:** Unlimited trips + all gated features

### Gated Pro Features
`dream-vault`, `budget-guardian`, `memory-lane`, `trip-wrapped`, `hype`, `arrival-mode`, `local-lens`, `travel-twin`, `trip-chemistry`

---

## Referral Program

| Referrals | Reward |
|-----------|--------|
| 3 | 1 month Pro free |
| 6 | 2 months Pro free |
| 9 | 3 months Pro free |
| 10 | 1 year Pro free |

Referral codes tracked in `referral_codes` table. `pro_referral_expires_at` on profiles.  
Waitlist referrals tracked in `waitlist_emails.referral_count` via Supabase trigger `trg_credit_referrer_on_waitlist`.

---

## Key Metrics to Track

| Metric | Target | Tracking |
|--------|--------|----------|
| Free → Pro conversion rate | 5% | RevenueCat + PostHog |
| Affiliate CTR (Skyscanner) | 10% of flight card views | PostHog `affiliate_click` |
| Creator attributed installs per video | 50–200 | PostHog UTM |
| Creator CAC (flat rate ÷ installs) | Under $2 | Spreadsheet |
| Creator revenue share payable | Under 30% of attributed MRR | PostHog export |
| Paywall view → purchase rate | 3–5% | PostHog funnel |
| Churn rate (monthly) | Under 8% | RevenueCat |
| DACH paid users | 25 by Month 2, 100 by Month 4 | RevenueCat + PostHog geo |

---

## DACH Creator Budget (Month 1)

| Line Item | Unit Cost | Volume | Total |
|-----------|-----------|--------|-------|
| Barter creators (Pro lifetime) | $0 cash | 20 | $0 |
| Micro creators (flat rate) | $20–35/video | 20 posts | $500 |
| Micro creators (revenue share) | 10% of attributable MRR | — | ~$13 (estimated) |
| Partner creator test (1 creator) | $200/video | 1 | $200 |
| UGC platform fee (Billo/Insense) | $100–200 flat | 1 platform | $150 |
| **Total cash out** | | | **$850–1,050** |
| **Expected attributed MRR** | | | **$125–300** |
| **Payback period** | | | **3–8 months** |
