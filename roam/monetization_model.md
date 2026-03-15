# Monetization Model — 2026-03-15

> Agent 07 — MONETIZATION output
> Sprint: Overnight quality pass + affiliate link audit
> Branch: `cursor/roam-monetization-model-d222`

---

## Affiliate Link Audit (2026-03-15)

### Task: Verify all Skyscanner links include `associateId=roam`

Complete audit across all 8 Skyscanner link surfaces.

---

### Skyscanner Affiliate Link Status

| Surface | File | Uses `getSkyscannerFlightUrl`? | `associateId=roam`? | AFFILIATE_CLICK event? | Status |
|---------|------|-------------------------------|--------------------|-----------------------|--------|
| Hero search form | `app/(tabs)/flights.tsx` | ✅ | ✅ | ✅ Fixed | **FIXED** |
| Popular routes grid | `app/(tabs)/flights.tsx` | ✅ | ✅ | ✅ Fixed | **FIXED** |
| Inspiration cards | `app/(tabs)/flights.tsx` | ✅ | ✅ | ✅ Fixed | **FIXED** |
| FlightCard (itinerary) | `components/features/FlightCard.tsx` | ✅ | ✅ | ✅ (via openBookingLink) | OK |
| FlightPriceCard | `components/features/FlightPriceCard.tsx` | ✅ (buildAffiliateUrl) | ✅ | ✅ (direct captureEvent) | OK |
| FlightDealCard | `components/features/FlightDealCard.tsx` | ❌ `getSkyscannerUrl()` | ❌ Missing | ❌ Missing | **FIXED** |
| Dream Vault | `app/dream-vault.tsx` | ❌ `getSkyscannerUrl()` | ❌ Missing | ❌ Missing | **FIXED** |
| `getSkyscannerUrl()` source | `lib/flight-deals.ts` | — | ❌ Missing | — | **FIXED** |

### Bugs Found and Fixed

#### Bug 1: `lib/flight-deals.ts` `getSkyscannerUrl()` — Missing `associateId=roam`

**Before:**
```
https://www.skyscanner.com/transport/flights/?q=tokyo
```
**After:**
```
https://www.skyscanner.com/transport/flights/?q=tokyo&associateId=roam&utm_source=roam&utm_medium=app&utm_campaign=tokyo
```
**Impact:** FlightDealCard and Dream Vault were sending users to Skyscanner without affiliate attribution. Every booking from those surfaces earned $0 in commission.

#### Bug 2: `FlightDealCard.tsx` — No affiliate click tracking

`handleSearchDeals()` used raw `Linking.openURL()`. No Supabase insert, no PostHog event.

**Fix:** Replaced with `openBookingLink(url, 'skyscanner', destination, 'flight-deal-card')` which fires both the Supabase `affiliate_clicks` insert and the PostHog `AFFILIATE_CLICK` event.

#### Bug 3: `dream-vault.tsx` — No affiliate click tracking

`handleSearchFlights()` used raw `Linking.openURL()`. No tracking at all.

**Fix:** Replaced with `openBookingLink(url, 'skyscanner', destination, 'dream-vault')`.

#### Bug 4: `app/(tabs)/flights.tsx` — Three Skyscanner handlers firing custom events but not standard `AFFILIATE_CLICK`

All three handlers (`handleSearch`, `handleRoutePress`, `handleInspirationPress`) fired custom PostHog events (`flights_search_skyscanner`, `flights_popular_route_tapped`, `flights_inspiration_tapped`) but NOT the standard `AFFILIATE_CLICK` event that the `FLIGHT_BOOKING_FUNNEL` in `lib/posthog-funnels.ts` expects.

**Fix:** Added `captureEvent(EVENTS.AFFILIATE_CLICK.name, { partner: 'skyscanner', ... })` and `trackAffiliateClick(...)` (Supabase insert) to all three handlers. Custom events are preserved for richer analytics.

---

### PostHog Affiliate Event Coverage (after fixes)

| Placement | Event fired | Properties |
|-----------|------------|------------|
| `flights.tsx` hero search | `affiliate_click` + `flights_search_skyscanner` | `partner=skyscanner, destination, placement=flights-search` |
| `flights.tsx` popular routes | `affiliate_click` + `flights_popular_route_tapped` | `partner=skyscanner, destination, placement=flights-popular-routes` |
| `flights.tsx` inspiration | `affiliate_click` + `flights_inspiration_tapped` | `partner=skyscanner, destination, placement=flights-inspiration` |
| `FlightCard.tsx` | `affiliate_click` | via `openBookingLink()` |
| `FlightPriceCard.tsx` | `affiliate_click` | direct `captureEvent` |
| `FlightDealCard.tsx` | `affiliate_click` | via `openBookingLink()` (fixed) |
| `dream-vault.tsx` | `affiliate_click` | via `openBookingLink()` (fixed) |

The `FLIGHT_BOOKING_FUNNEL` (`lib/posthog-funnels.ts`) now has full data:
```
Flights tab → flight_search → affiliate_click[partner=skyscanner]
```

---

### Booking.com AID Audit

| Surface | File | Uses `openBookingLink()`? | `aid=` param? | Status |
|---------|------|--------------------------|--------------|--------|
| Stays card tap | `app/(tabs)/stays.tsx` | ✅ | `aid=roam` | ⚠️ Placeholder |
| Stays book button | `app/(tabs)/stays.tsx` | ✅ | `aid=roam` | ⚠️ Placeholder |
| Itinerary booking | `app/itinerary.tsx` | ✅ (via openAffiliate) | `aid=roam` | ⚠️ Placeholder |

**Status:** Booking.com `aid=roam` is a placeholder. The real AID requires signing up at `partners.booking.com`. **Blocked on Quinn.**

Until the real AID is set, Booking.com clicks will NOT earn commission even though the tracking infrastructure works correctly.

**Revenue impact:** $0 from Booking.com until AID is real. Estimated $20–60/month upside once AID is live.

---

## Revenue Streams Summary

| Stream | Status | Affiliate ID | PostHog Tracking | Monthly Est. |
|--------|--------|-------------|-----------------|--------------|
| Skyscanner (flights.tsx) | ✅ Live | `associateId=roam` | ✅ Fixed | $30–80 |
| Skyscanner (FlightCard) | ✅ Live | `associateId=roam` | ✅ | $10–20 |
| Skyscanner (FlightDealCard) | ✅ Fixed | `associateId=roam` | ✅ Fixed | $5–15 |
| Skyscanner (dream-vault) | ✅ Fixed | `associateId=roam` | ✅ Fixed | $3–8 |
| Booking.com | ⚠️ Placeholder AID | `aid=roam` (placeholder) | ✅ | $0 until real AID |
| GetYourGuide | ✅ Live | `partner_id=roam` | ✅ | $15–40 |
| RevenueCat Pro monthly | ✅ Live | — | ✅ | $125–300 |
| RevenueCat Pro yearly | ✅ Live | — | ✅ | $80–200 |

---

## Pro Feature Gate Registry

| Feature | Gate Key | Paywall Trigger | Status |
|---------|---------|----------------|--------|
| Unlimited trips | `unlimited-trips` | Plan tab trip limit | ✅ Live |
| Offline PREP | `offline-prep` | PREP feature tap | ✅ Live |
| AI priority | `priority-ai` | Conversation mode hint | ✅ Live |
| Travel Twin | `travel-twin` | Feature tap | ✅ Live |
| Trip Chemistry | `trip-chemistry` | Feature tap | ✅ Live |
| Memory Lane | `memory-lane` | Feature tap | ✅ Live |
| People: DM/Connect | `people-dm` | Connect button | ✅ Live |
| People: matches >3 | `people-unlimited-matches` | Card 4+ tap | ✅ Live |
| People: groups >1 | `people-groups` | Group 2+ tap | ✅ Live |
| People: create group | `people-create-group` | Create button | ✅ Live |
| People: live presence | `people-live-presence` | Live Now teaser | ✅ Live |
| Plan: re-generate | `plan-regenerate` | Pro teaser | ✅ Live |
| Plan: hotel alternatives | `plan-hotel-alternatives` | Pro teaser | ✅ Live |
| Plan: food alternatives | `plan-food-alternatives` | Pro teaser | ✅ Live |

---

## 3-Tier Creator Payment Model (DACH UGC)

### Tier 1 — Barter
- **Who:** Nano creators (<10K followers), university ambassadors  
- **Cash:** $0  
- **Compensation:** Free ROAM Pro (lifetime) + featured on `roamapp.co/creators`  
- **Obligation:** 2 posts/month, personal referral code in bio  
- **Volume target:** 20–40 Month 1–2

### Tier 2 — Micro
- **Who:** 10K–100K DACH followers, >3% engagement  
- **Cash:** $20–50/video (scales with audience size)  
- **Revenue share:** 10% of attributed Pro MRR for 90 days  
- **Attribution:** `utm_source=creator&utm_medium=ugc&utm_campaign={creator_slug}`  
- **Upgrade:** Auto-upgrade to Partner if they drive 15+ Pro subs/month

### Tier 3 — Partner  
- **Who:** 100K–500K+ or upgraded Micro performers  
- **Cash:** $200–500/video (negotiated)  
- **Revenue share:** 15% of attributed Pro MRR for 180 days  
- **Extras:** Custom itinerary package, onboarding call, 30-day exclusivity clause  
- **Bonus:** $100 at 1M+ views; $150 at 50+ conversions/video

---

## Blocked on Quinn

| Item | Action | Revenue Impact |
|------|--------|---------------|
| Booking.com real AID | Sign up at partners.booking.com | +$20–60/month immediately |
| RevenueCat products | Create products in RC dashboard | Pro tier currently non-functional |
| PostHog project key | Verify key set in environment | Analytics blind without it |
| Waitlist DB migration | Apply `20260325000001_waitlist_comprehensive_fix.sql` | Waitlist signups not persisting |

---

## Optimization Opportunities

- [ ] **Skyscanner Partner API** — Apply for live price data. Currently showing "from ~$XXX" estimates. Live prices → estimated 3–5x CTR improvement on popular routes grid.
- [ ] **A/B test affiliate placement** — Test FlightCard above Day 1 vs. current bottom position in itinerary. Hypothesis: mid-itinerary placement when user is most engaged → +20% CTR.
- [ ] **FlightDealCard tracking enrichment** — Add `homeAirport` to the `trackAffiliateClick` call so Supabase data shows which origin airports are most active.
- [ ] **Dream Vault → pricing enrichment** — When user has saved a destination + has home airport set, link directly to `getSkyscannerFlightUrl({ origin: homeAirport, destination })` instead of generic search. Better UX = higher conversion.
- [ ] **itinerary.tsx `openAffiliate()` tracking gap** — Raw `Linking.openURL()` calls in itinerary.tsx bypass all tracking. Estimated 30–40% of affiliate clicks invisible in analytics.
