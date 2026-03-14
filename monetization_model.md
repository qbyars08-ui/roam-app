# ROAM — Revenue Projection Model

## Pricing

| Plan         | Price         | Billing     | Monthly equiv. |
|-------------|--------------|-------------|----------------|
| Free        | $0           | -           | $0             |
| ROAM Pro    | $9.99/mo     | Monthly     | $9.99          |
| Global Pass | $49.99/yr    | Annual      | $4.17          |

Annual savings vs monthly: **~58%** ($119.88/yr at monthly rate vs $49.99/yr).

## Conversion Funnel

```
Downloads → Free users → Trial starts → Trial converts → Retained subscriber
100%         85%           12-18%         55-65%           70-80% (M3)
```

### Assumptions (conservative / moderate / aggressive)

| Metric                            | Conservative | Moderate | Aggressive |
|----------------------------------|-------------|----------|------------|
| Monthly new free users           | 5,000       | 15,000   | 40,000     |
| Free → trial conversion          | 8%          | 14%      | 20%        |
| Trial → paid conversion          | 50%         | 60%      | 70%        |
| Annual plan mix (of paid)        | 40%         | 55%      | 65%        |
| Monthly churn (monthly subs)     | 8%          | 6%       | 4%         |
| Monthly churn (annual subs)      | 2%          | 1.5%     | 1%         |

### Paywall optimization levers (this PR)

| Feature                  | Expected lift | Rationale                                                    |
|-------------------------|--------------|--------------------------------------------------------------|
| Annual/monthly toggle   | +15-25% annual mix | Toggle with savings badge anchors on value; default annual   |
| Savings badge (SAVE 58%)| +8-12% annual mix  | Loss aversion — users see what they miss monthly             |
| Social proof counter    | +5-10% trial start | Bandwagon effect — "1,300+ upgraded this month"              |
| 3-day free trial CTA    | +20-35% trial start| Removes commitment friction; "try before you buy"            |
| Contextual headlines    | +5-8% conversion   | Destination/feature-aware copy increases relevance           |
| Compare table           | +3-5% conversion   | Side-by-side makes Pro value obvious at a glance             |

**Combined expected lift**: 30-50% improvement in free-to-paid conversion rate.

## Monthly Revenue Projections

### Month 6 (moderate scenario, 15K monthly new users)

```
New free users:       15,000
Trial starts:          2,100  (14% conversion)
Trial → paid:          1,260  (60% of trials)
  - Monthly subs:        567  (45% of paid)
  - Annual subs:         693  (55% of paid)

New MRR from monthly:   $5,664  (567 × $9.99)
New MRR from annual:    $2,889  (693 × $49.99 / 12)
New MRR total:          $8,553

Cumulative active monthly subs (6mo, 6% churn):   ~2,400
Cumulative active annual subs (6mo, 1.5% churn):  ~3,900

Recurring MRR:
  Monthly:   2,400 × $9.99          = $23,976
  Annual:    3,900 × $49.99 / 12    = $16,247
  Total MRR:                          $40,223
  ARR:                                $482,676
```

### Month 12 (moderate scenario)

```
Cumulative active monthly subs:  ~4,100
Cumulative active annual subs:   ~7,200

  Monthly MRR:  4,100 × $9.99       = $40,959
  Annual MRR:   7,200 × $49.99 / 12 = $29,994
  Total MRR:                          $70,953
  ARR:                                $851,436
```

### Month 12 (aggressive scenario, 40K monthly new users)

```
  Total MRR:                         $198,400
  ARR:                               $2,380,800
```

## Affiliate Revenue (incremental)

| Source          | Est. RPM  | Monthly impressions | Monthly rev  |
|----------------|-----------|-------------------|--------------|
| Booking.com    | $0.15     | 50,000            | $7,500       |
| Skyscanner     | $0.08     | 40,000            | $3,200       |
| GetYourGuide   | $0.12     | 30,000            | $3,600       |
| Rentalcars     | $0.10     | 15,000            | $1,500       |
| **Total**      |           |                   | **$15,800**  |

## Referral Program Impact

- 3 referrals = 1 month Pro free (costs ~$4.17 in foregone revenue)
- 10 referrals = 1 year Pro free (costs ~$49.99 in foregone revenue)
- Average referral CAC: ~$1.39/user (vs $8-15 paid UA)
- Expected K-factor: 0.15-0.25 (each user brings 0.15-0.25 new users)
- Viral lift on growth: 15-25% additional organic users

## Key Metrics to Track

| Metric                       | Target (Month 6)  |
|------------------------------|-------------------|
| Paywall view → trial start   | > 14%             |
| Trial → paid conversion      | > 55%             |
| Annual plan mix              | > 50%             |
| Monthly subscriber churn     | < 7%              |
| Annual subscriber churn      | < 2%              |
| LTV:CAC ratio                | > 3:1             |
| MRR                          | > $35K            |

## LTV Analysis

| Plan    | Avg lifetime | LTV       |
|---------|-------------|-----------|
| Monthly | 8.3 months  | $82.92    |
| Annual  | 2.1 years   | $104.98   |

Blended LTV (55% annual mix): **$95.05**

## Notes

- Trial mechanics configured in RevenueCat (3-day free trial on both plans)
- Social proof numbers are deterministic per day (seed from day-of-year) — no API needed
- Toggle defaults to Annual to anchor on value; monthly shown as opt-in
- All revenue projections exclude affiliate income
- Churn assumptions based on subscription app benchmarks for travel/lifestyle category
