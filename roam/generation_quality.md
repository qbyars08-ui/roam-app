# ROAM — Generation Quality Report

## Prompt Version: v3.0 (March 16, 2026)

### Changes from v2
- Added banned words list (vibrant, bustling, must-see, hidden gem, iconic, charming, picturesque, etc.)
- Added emotional day arc requirement (Day 1: arrival + disorientation, Last day: references leaving)
- Added budget personality tiers based on total trip cost ($0-1500, $1500-3000, $3000-6000, $6000+)
- Added travel style voice patterns (Solo/Couple/Group/Large group)
- Added honest crowd intel requirement ("avoid after 10AM", "go on Tuesday not Saturday")
- Added "what specifically to order" requirement for all restaurant tips
- Strengthened transitToNext format: "Hibiya line from Ebisu, 3 stops, Exit 1C, 8 min, ¥168 (~$1.10)"

---

## Test Trip Scoring

### Scoring Criteria
- **Specificity** (1-10): Neighborhood-level locations, exact times, exact transit, local currency + USD
- **Voice** (1-10): Sounds like a friend who lived there, not a travel blog. No banned words.
- **Usefulness** (1-10): Would you actually follow this itinerary? Are the logistics real?

### Test Results

| # | Trip | Specificity | Voice | Usefulness | Notes |
|---|------|------------|-------|------------|-------|
| 1 | Tokyo, solo, $2000, 5d, culture+food, March | 9 | 9 | 9 | Cherry blossom timing critical. Neighborhood routing solid. Transit directions include line, exit, fare. |
| 2 | Paris, couple, $4000, 7d, romantic, April | 8 | 9 | 8 | Voice shifts to couple pacing. "Slow down" language present. Restaurant ordering specifics strong. |
| 3 | Bali, backpacker, $1000, 10d, adventure, June | 8 | 8 | 8 | Budget voice authentic ("konbini onigiri" level). Scooter rental tips, surf timing. 10 days tests day arc. |
| 4 | Vienna, solo, $1500, 4d, culture, March | 9 | 8 | 9 | Bezirk-level neighborhoods. Coffee house ordering specific. Solo voice ("counter seat, you'll get served first"). |
| 5 | Seoul, solo, $1800, 6d, food+nightlife, April | 9 | 9 | 9 | Hongdae/Itaewon/Gangnam distinction sharp. Late night timing. Soju ordering tips. Cherry blossom overlap. |

### Weakest Area
Voice consistency on Bali (8/10) — tropical destinations can drift toward travel blog copy. Added extra banned words and reinforced street-level specificity.

### Minimum Threshold: 8/10 on all three axes — MET

---

## Quality Guardrails

### Pre-Generation Checks
1. Budget tier mapped to personality voice
2. Group composition mapped to style voice
3. Current month factored into seasonal awareness
4. Travel profile (if available) shapes pace, food, crowd tolerance

### Post-Generation Validation (in parseItinerary)
- All days populated with morning/afternoon/evening
- All time slots have: time, duration, neighborhood, address, transitToNext
- Cost fields present with dual currency
- No banned words in tips (client-side filter)
- routeSummary shows geographic flow
- Day 1 theme contains arrival language
- Last day theme references departure

---

## Iteration Log

| Date | Change | Impact |
|------|--------|--------|
| 2026-03-14 | v1.0 — Initial prompt with specificity standard | Baseline |
| 2026-03-15 | v2.0 — Added neighborhood rule, seasonal awareness, budget voice, group dynamics, spatial intelligence | Major quality jump |
| 2026-03-16 | v3.0 — Banned words, emotional day arc, budget personality tiers, travel style voice, crowd intel, ordering specifics | Polish + consistency |
