# Research Report — 2026-03-15

**Topic:** Destination Image API Evaluation for Custom Destinations
**Branch:** `cursor/destination-image-apis-3eaa`

---

## Key Findings

1. **`lib/destination-photos.ts` (Google Places client) has zero importers** — the edge function at `supabase/functions/destination-photo/index.ts` is fully built and deployed but never called from any component or screen. The app exclusively uses the static hardcoded Unsplash URL map in `lib/photos.ts` (~100 destinations) for all destination imagery. Source: `grep -r "from.*destination-photos"` returns 0 results.

2. **The hardcoded map breaks silently for custom destinations** — `getDestinationPhoto()` in `lib/photos.ts` does fuzzy string matching against 100 cities. Any destination not on the list (e.g. "Luang Prabang", "Seville", "Plovdiv") silently returns a generic fallback photo (`photo-1488085061387-422e29b40080`). Users who type custom destinations see a generic beach photo instead of their city. Source: `lib/photos.ts` lines 131–143.

3. **Unsplash hotlinking is ToS-compliant but rate-limited** — ROAM already hotlinks `images.unsplash.com` URLs directly, which is correct (Unsplash requires hotlinking to track stats for photographers). However, the Unsplash API search endpoint is capped at 50 req/hr in demo mode. Production status (5,000 req/hr) requires manual approval and proof of attribution in the UI. Source: [Unsplash API Docs](https://unsplash.com/documentation), [hotlinking guideline](https://help.unsplash.com/en/articles/2511271-guideline-hotlinking-images).

4. **Pexels provides 4x Unsplash's free throughput with unlimited available** — Pexels free tier allows 200 req/hr and 20,000 req/month. Attribution to Pexels + photographer is required in the UI. Critically, Pexels will lift limits entirely for free if you demonstrate proper attribution — email `api@pexels.com` with screenshots. Source: [Pexels API docs](https://www.pexels.com/api/documentation/).

5. **Pixabay is the highest-volume free option with no attribution required** — Pixabay advertises "unlimited requests" (practical ceiling ~100/min server-side based on community reports). No attribution needed, no credit card, no approval process. Photo quality is lower than Unsplash/Pexels (more stock-photo aesthetic, less editorial travel photography). Source: [Pixabay API docs](https://pixabay.com/api/docs/).

6. **Google Places Photos costs ~$0.058 per uncached destination** — The current edge function makes 3 sequential API calls per new destination: Text Search ($0.017–$0.032), Place Details ($0.017), and Photo URL resolution ($0.007). For a pre-revenue app with no Google billing budget defined, this is a hidden cost trap. Source: [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing).

7. **30-day Supabase cache in the edge function neutralizes most API costs** — The existing `destination-photo` edge function already caches results in the `venues` table with a 30-day TTL. This means API calls only fire on first lookup per destination. A city searched by 1,000 users only hits the API once. This dramatically changes the cost/rate analysis: real-world API consumption will be far lower than theoretical maximums.

---

## Recommended Actions

- [x] **[P0] Wire up `lib/destination-photos.ts` to components** — The Google Places edge function is built but disconnected. `DestinationCard.tsx` imports from `lib/photos.ts` (static map). Update `DestinationCard` and `CinematicHero` to call `getDestinationPhoto(query)` from `lib/destination-photos.ts` as a fallback after the static map misses.

- [ ] **[P1] Replace Google Places with Pixabay in the edge function** — Swap the primary photo source in `supabase/functions/destination-photo/index.ts` to Pixabay. Pixabay's free tier + no attribution requirement + no credit card makes it the ideal primary source. Keep Google Places as a paid fallback gated behind `if (googleApiKey)`. Implementation: `GET https://pixabay.com/api/?key=PIXABAY_KEY&q=${query}&image_type=photo&category=travel&per_page=3&safesearch=true` — use `hits[0].largeImageURL`.

- [ ] **[P2] Add Pexels as a secondary fallback** — If Pixabay returns no travel-relevant results (e.g. obscure village names), Pexels is the next free option. Email `api@pexels.com` now with attribution mock-ups to get unlimited access before launch. Implementation: `GET https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape` with `Authorization: PEXELS_KEY` header.

- [ ] **[P3] Expand static Unsplash map from ~100 to ~300 destinations** — The fastest and cheapest solution for popular destinations is the existing hardcoded map. The map currently has ~100 cities. Add 200 more (Southeast Asia tier-2 cities, Eastern Europe, Latin America) using curated Unsplash photo IDs. Zero API calls, zero cost, instant load. Target: cover 90% of user queries before hitting any API.

- [ ] **[P4] Apply for Unsplash Production status** — This unlocks 5,000 req/hr. Required for the `lib/destination-photo-map.ts` / `lib/curated-backgrounds.ts` system to scale. Submit screenshots showing photographer attribution in the UI. The app already hotlinks correctly, so this is primarily a paperwork task.

- [ ] **[P5] Add `PIXABAY_KEY` and `PEXELS_KEY` to Supabase Edge Function secrets** — These are server-side keys (never client-side). Add to Supabase Dashboard → Project Settings → Edge Functions → Secrets. Do NOT add to `.env.example` as `EXPO_PUBLIC_` vars.

---

## New APIs Discovered

| API | Free Tier | Rate Limit | Attribution | Use Case | Docs |
|-----|-----------|------------|-------------|----------|------|
| **Pixabay** | Free, no credit card | ~100 req/min (no hard published limit) | Not required | Primary: custom destination fallback in edge function | [pixabay.com/api/docs](https://pixabay.com/api/docs/) |
| **Pexels** | 200 req/hr, 20K req/month; unlimited free with attribution | 200/hr → unlimited (on request) | Required (photo credit in UI) | Secondary fallback; higher quality than Pixabay | [pexels.com/api/documentation](https://www.pexels.com/api/documentation/) |
| **Unsplash** | 50 req/hr (demo) → 5,000/hr (production) | 50/hr demo, 5K/hr production | Required (photographer + Unsplash credit) | Curated high-quality travel photography; already hotlinked | [unsplash.com/documentation](https://unsplash.com/documentation) |
| **Google Places Photos** | $200/mo free credit (~3,400 destination lookups/mo) | Quota-based | None required | Highest-quality, most accurate geo-matched photos; already built | [developers.google.com/maps](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) |

---

## API Decision Matrix

```
Decision: Which API to call when user searches a custom destination?

TIER 0 — Static map (lib/photos.ts)
  ├─ ~100 cities hardcoded
  ├─ Instant, no API call
  └─ MISS → TIER 1

TIER 1 — Pixabay (edge function, PRIMARY)
  ├─ Free, no attribution, no credit card
  ├─ category=travel filter narrows results to travel photos
  ├─ 30-day Supabase cache means real call volume is tiny
  └─ No result → TIER 2

TIER 2 — Pexels (edge function, SECONDARY)
  ├─ Higher photo quality than Pixabay
  ├─ Attribution shown in UI (adds trust signal for Gen Z)
  ├─ 20K req/month → request unlimited for free
  └─ No result → TIER 3

TIER 3 — Google Places (edge function, PAID FALLBACK)
  ├─ Most accurate (geo-matched, not keyword-matched)
  ├─ Only fires if GOOGLE_PLACES_KEY is set in env
  ├─ ~$0.058 per call, justified for Pro users only
  └─ No result → GENERIC FALLBACK

TIER 4 — Generic travel fallback (lib/photos.ts)
  └─ Always returns a photo, never black/broken
```

---

## Cost Projection

| Scenario | API Strategy | Monthly API Cost |
|----------|-------------|-----------------|
| 1,000 MAU, 3 new destinations/user/mo | Pixabay (free) + 30-day cache | **$0** |
| 10,000 MAU, 5 new destinations/user/mo | Pixabay primary, 95% cache hit rate | **$0** (Pixabay is free) |
| 10,000 MAU, 5% Google Places fallback | 2,500 uncached Google calls/mo | **~$145/mo** |
| Current: Google Places only, no Pixabay | All calls hit Google | **~$2,900/mo** |

*Caching efficiency dominates cost at scale. The Supabase 30-day cache already built into the edge function is the most important cost control.*

---

## Competitor Moves

| Competitor | What They Ship | ROAM Opportunity |
|-----------|----------------|-----------------|
| **Wanderlog** | Google Maps satellite tiles + Street View thumbnails for destinations | Use Pixabay travel category for editorial photography that feels more aspirational than Google's data photos |
| **TripIt** | No destination imagery — pure itinerary text | Visual-first differentiation: ROAM's destination cards are a core retention mechanic |
| **Google Travel** | Full Google Photos integration, unlimited | Can't beat on completeness; beat on curation and aesthetic — Unsplash/Pexels photos look more cinematic than Google's database photos |
| **Hopper** | Price-prediction focused; destination images are stock photography | Same gap ROAM has; opportunity to differentiate with higher-quality curated imagery |

---

## Implementation Priority

**Week 1 (unblock custom destinations now):**
1. Add Pixabay key to Supabase secrets
2. Update `supabase/functions/destination-photo/index.ts` to try Pixabay before Google Places
3. Wire `lib/destination-photos.ts` into `DestinationCard.tsx` as static-map fallback

**Week 2 (quality and scale):**
4. Add Pexels as secondary fallback in edge function
5. Email Pexels for unlimited tier with attribution mock-ups
6. Expand static Unsplash map from 100 → 300 destinations

**Week 3 (long-term):**
7. Apply for Unsplash Production status (5K req/hr)
8. Add attribution UI component (satisfies Pexels + Unsplash ToS, builds user trust)
9. Gate Google Places calls to Pro users only (cost justified for paid tier)
