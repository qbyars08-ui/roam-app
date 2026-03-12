# ROAM — Affiliate Tracking Sheet

## Overview

ROAM earns affiliate commissions from three travel partners integrated into AI-generated itineraries. This document defines the tracking structure, UTM conventions, and reporting format.

---

## Partner Programs

| Partner | Commission | Cookie | Payout | Affiliate ID |
|---------|-----------|--------|--------|-------------|
| **Booking.com** | 25-40% of their commission (varies by property) | 30 days | Monthly, NET 60 | `aid=roam` |
| **GetYourGuide** | 8% of booking value | 30 days | Monthly, NET 30 | `partner_id=roam` |
| **Skyscanner** | CPC (cost per click) ~$0.15-0.65 | Session | Monthly, NET 45 | `associateId=roam` |

---

## Link Format

### Booking.com
```
https://www.booking.com/hotel/{slug}.html?aid=roam&utm_source=roam&utm_medium=app&utm_campaign={destination}&utm_content={placement}
```

### GetYourGuide
```
https://www.getyourguide.com/{activity-slug}?partner_id=roam&utm_source=roam&utm_medium=app&utm_campaign={destination}&utm_content={placement}
```

### Skyscanner
```
https://www.skyscanner.com/transport/flights/{origin}/{destination}?associateId=roam&utm_source=roam&utm_medium=app&utm_campaign={destination}&utm_content={placement}
```

### UTM Parameters

| Parameter | Value | Example |
|-----------|-------|---------|
| `utm_source` | Always `roam` | `roam` |
| `utm_medium` | `app` or `web` | `app` |
| `utm_campaign` | Destination (lowercase, hyphenated) | `tokyo`, `bali`, `mexico-city` |
| `utm_content` | Placement in app | `itinerary-hotel`, `itinerary-activity`, `packing-list`, `discover-card` |

---

## Tracking Sheet Structure

### Monthly Summary

| Month | Partner | Clicks | Bookings | Revenue | Commission | Conv Rate |
|-------|---------|--------|----------|---------|-----------|-----------|
| Mar 2026 | Booking.com | | | | | |
| Mar 2026 | GetYourGuide | | | | | |
| Mar 2026 | Skyscanner | | | | | |
| **Total** | | | | | | |

### Daily Click Log

| Date | Partner | Destination | Placement | Clicks | Device |
|------|---------|-------------|-----------|--------|--------|
| | | | | | |

### Revenue by Destination

| Destination | Booking Clicks | GYG Clicks | Sky Clicks | Total Revenue |
|-------------|---------------|------------|------------|---------------|
| Tokyo | | | | |
| Bali | | | | |
| Paris | | | | |
| Bangkok | | | | |
| Barcelona | | | | |
| (all destinations) | | | | |

### Revenue by Placement

| Placement | Description | Partner | Clicks | Revenue |
|-----------|-------------|---------|--------|---------|
| `itinerary-hotel` | Hotel name in day card | Booking.com | | |
| `itinerary-activity` | Activity in day card | GetYourGuide | | |
| `itinerary-transport` | "Book flights" link | Skyscanner | | |
| `packing-list` | Amazon items in packing list | Amazon | | |
| `discover-card` | Destination card CTA | Booking.com | | |

---

## Amazon Associates (Packing List)

| Parameter | Value |
|-----------|-------|
| **Associate Tag** | `roamapp-20` |
| **Commission** | 1-10% depending on category |
| **Cookie** | 24 hours (90 days if added to cart) |
| **Link Format** | `https://amazon.com/dp/{ASIN}?tag=roamapp-20` |

### Packing List Revenue Tracking

| Month | Category | Clicks | Orders | Items Shipped | Revenue | Commission |
|-------|----------|--------|--------|---------------|---------|-----------|
| | Travel accessories | | | | | |
| | Electronics | | | | | |
| | Clothing | | | | | |
| | Toiletries | | | | | |

---

## KPIs & Targets

### Month 1 Targets (Post-Launch)

| Metric | Target |
|--------|--------|
| App downloads | 1,000 |
| Itineraries generated | 500 |
| Affiliate link clicks | 200 |
| Affiliate bookings | 10-20 |
| Affiliate revenue | $50-200 |

### Month 6 Targets

| Metric | Target |
|--------|--------|
| Monthly active users | 10,000 |
| Itineraries generated | 5,000 |
| Affiliate link clicks | 2,000 |
| Affiliate bookings | 100-200 |
| Affiliate revenue | $500-2,000 |
| Subscription revenue | $3,000-5,000 |

### Year 1 Targets

| Metric | Target |
|--------|--------|
| Total downloads | 100,000 |
| Paid subscribers | 5,000-10,000 |
| Annual affiliate revenue | $10,000-50,000 |
| Annual subscription revenue | $50,000-100,000 |

---

## Implementation Notes

### Current Integration Points

1. **Itinerary screen** — Hotel names link to Booking.com, activity names link to GetYourGuide
2. **Packing list** — Product names link to Amazon with `roamapp-20` tag
3. **Discover screen** — "Book now" CTA links to Booking.com destination pages

### Future Integration Points

- Flight price comparison widget (Skyscanner API)
- "Book this hotel" button in itinerary cards
- Tour/activity booking directly from itinerary
- Travel insurance affiliate (World Nomads, SafetyWing)
- eSIM affiliate (Airalo, Holafly)

### Analytics Setup

Track all affiliate clicks with:
1. In-app event logging (Supabase `affiliate_clicks` table)
2. UTM parameters in outbound URLs
3. Partner dashboard reconciliation (monthly)

```sql
-- Affiliate clicks table
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  partner TEXT NOT NULL, -- 'booking', 'gyg', 'skyscanner', 'amazon'
  destination TEXT,
  placement TEXT, -- 'itinerary-hotel', 'packing-list', etc.
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT now()
);
```
