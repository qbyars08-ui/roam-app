# ROAM — Image API Research Report

> Research date: 2026-03-13
> Author: Agent 02 (Researcher)

---

## Executive Summary

**Recommendation: Use Pexels API as the primary image source**, with the existing curated Unsplash `images.unsplash.com` direct URLs as the offline fallback layer.

Pexels wins because it offers 4x the rate limit of Unsplash's free tier (200/hr vs 50/hr), requires no payment or production approval process, includes photographer metadata for attribution, and returns multiple pre-sized image URLs per photo. The edge function should be updated to call Pexels as a fallback when the Google Places photo lookup misses, and as a replacement for the broken `source.unsplash.com` fallback URLs throughout the client codebase.

---

## Current State Analysis

### Edge Function: `supabase/functions/destination-photo/index.ts`

The existing edge function uses **Google Places API** with a `GOOGLE_PLACES_KEY`:

1. **Text Search** — `maps.googleapis.com/maps/api/place/textsearch/json` (find place by query)
2. **Place Details** — `maps.googleapis.com/maps/api/place/details/json` (get photo reference)
3. **Photo URL** — `maps.googleapis.com/maps/api/place/photo` (resolve CDN URL via redirect)

**Problems:**
- **3 API calls per photo** — expensive at Google Places pricing ($2.83–$5/1000 after free tier)
- **Requires `GOOGLE_PLACES_KEY`** — secret management overhead
- **No fallback** — returns `null` if Google fails; UI shows nothing
- **Cache in `venues` table** — works but tightly coupled to Google's `place_id`

### Client-Side Photo Layer (Multiple Files)

| File | What It Does | Status |
|------|-------------|--------|
| `lib/photos.ts` | 100+ hardcoded `images.unsplash.com` URLs | Working — direct CDN links are valid |
| `lib/heroPhotos.ts` | Wraps `photos.ts` with w=1200 for hero images | Working |
| `lib/destination-photo-map.ts` | 28 Unsplash photo IDs with `source.unsplash.com` fallbacks | BROKEN — `source.unsplash.com` shut down June 2024 |
| `lib/curated-backgrounds.ts` | 15 daily background photos with `source.unsplash.com` fallbacks | BROKEN — same issue |
| `lib/unsplash.ts` | API client with `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` | Works only if key is set |
| `lib/destination-photos.ts` | Edge function client (`getDestinationPhoto()`) | Works but depends on Google Places key |
| `lib/mood-photos.ts` | 7 mood card photos with `images.unsplash.com` URLs | Working |
| `app/(tabs)/index.tsx` | `getUnsplashUrl()` helper using `source.unsplash.com` | BROKEN |

### Critical Issue: `source.unsplash.com` is Dead

Three files use `source.unsplash.com` URLs which were **deprecated in November 2021** and **completely shut down in June 2024**. These return errors/nothing:

- `lib/destination-photo-map.ts` — all 28 `fallbackUrl` entries
- `lib/curated-backgrounds.ts` — all 15 `fallbackUrl` entries  
- `app/(tabs)/index.tsx` — `getUnsplashUrl()` function

---

## API Comparison

### Rate Limits & Access

| Feature | Unsplash | Pexels | Pixabay |
|---------|----------|--------|---------|
| **API Key Required** | Yes (free registration) | Yes (free registration) | Yes (free registration) |
| **Free Tier Rate Limit** | 50 req/hr (demo) | 200 req/hr, 20K/month | ~100 req/min (undocumented) |
| **Production Tier** | 5,000 req/hr (approval required) | Unlimited (free, with attribution) | Same as free |
| **Approval Process** | Manual review + screenshots | Email with attribution proof | None |
| **Cost** | Free | Free | Free |
| **Total Free Photos** | 5M+ | 3M+ | 5.6M+ |

### Photo Quality & Travel Coverage

| Feature | Unsplash | Pexels | Pixabay |
|---------|----------|--------|---------|
| **Photo Quality** | Excellent (professional) | Very Good (curated daily) | Mixed (community uploads) |
| **Travel/Destination Coverage** | Excellent | Very Good | Good |
| **Curation** | Community + editorial | Hand-selected by team | Community + Editor's Choice |
| **Image Sizes Returned** | raw, full, regular, small, thumb | original, large2x, large, medium, small, portrait, landscape, tiny | preview (150px), webformat (640px), largeImage (requires approval) |
| **Photographer Info** | Yes (name, profile) | Yes (name, profile, URL) | Yes (username, URL) |
| **Average Color** | blur_hash | avg_color (hex) | N/A |
| **Dominant Color for Placeholder** | blur_hash (better) | avg_color (simpler) | None |

### Search Capabilities

| Feature | Unsplash | Pexels | Pixabay |
|---------|----------|--------|---------|
| **Keyword Search** | `GET /search/photos?query=` | `GET /v1/search?query=` | `GET /?q=&image_type=photo` |
| **Results Per Page** | 10 (max 30) | 15 (max 80) | 20 (max 200) |
| **Orientation Filter** | Yes | Yes | Yes |
| **Color Filter** | Yes | Yes | Yes |
| **Order By** | relevance, latest | N/A (relevance only) | popular, latest |
| **Language Support** | English | 28 languages | 25+ languages |

### Attribution Requirements

| Provider | Required? | Format |
|----------|-----------|--------|
| **Unsplash** | Yes (mandatory) | "Photo by [Name] on Unsplash" with links |
| **Pexels** | Encouraged (not mandatory) | "Photo by [Name] on Pexels" or Pexels logo |
| **Pixabay** | Not required | Optional credit to Pixabay |

### API Response Examples

**Pexels Search Response** (recommended):
```json
{
  "total_results": 8421,
  "page": 1,
  "per_page": 1,
  "photos": [
    {
      "id": 2166553,
      "width": 6000,
      "height": 4000,
      "url": "https://www.pexels.com/photo/...",
      "photographer": "Sabel Blanco",
      "photographer_url": "https://www.pexels.com/@sabel-blanco",
      "photographer_id": 123456,
      "avg_color": "#6E633A",
      "alt": "Brown concrete building during golden hour",
      "src": {
        "original": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg",
        "large2x": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "large": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
        "medium": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&h=350",
        "small": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&h=130",
        "portrait": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
        "landscape": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        "tiny": "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&dpr=1&fit=crop&h=200&w=280"
      }
    }
  ]
}
```

**Unsplash Search Response:**
```json
{
  "total": 10000,
  "total_pages": 1000,
  "results": [
    {
      "id": "eOcyhe5-9sQ",
      "width": 3456,
      "height": 2304,
      "blur_hash": "LgIY2oIU4nWB~qRjM{M{-;Rjt7ae",
      "urls": {
        "raw": "https://images.unsplash.com/photo-...",
        "full": "https://images.unsplash.com/photo-...?ixid=...&ixlib=...",
        "regular": "https://images.unsplash.com/photo-...?w=1080&q=80",
        "small": "https://images.unsplash.com/photo-...?w=400&q=80",
        "thumb": "https://images.unsplash.com/photo-...?w=200&q=80"
      },
      "user": {
        "name": "Photographer Name",
        "links": { "html": "https://unsplash.com/@photographer" }
      }
    }
  ]
}
```

---

## Recommendation: Pexels API

### Why Pexels Wins

1. **4x higher rate limit** — 200 req/hr vs Unsplash's 50/hr demo mode
2. **No approval process** — instant access, no manual review needed
3. **Free unlimited tier available** — just email attribution proof
4. **Pre-sized URLs** — 8 size variants per photo (`large2x`, `landscape`, `portrait`, etc.) eliminates client-side resizing logic
5. **`avg_color` field** — instant placeholder color while image loads (better UX than nothing)
6. **`alt` text included** — accessibility-ready from the API
7. **Photographer data** — name + URL for attribution built into response
8. **80 results per page** — fewer API calls for batch operations
9. **Attribution encouraged, not mandatory** — flexible for mobile UI constraints

### Why Not Unsplash

- 50 req/hr demo mode is too low for an app with many destinations
- Production approval requires manual review and screenshots
- Already using Unsplash direct URLs for curated photos (no need for API search on those)
- `source.unsplash.com` fallback URLs are dead — need migration regardless

### Why Not Pixabay

- Lower average photo quality (community-uploaded vs curated)
- `webformatURL` is only 640px (too small for hero images)
- `largeImageURL` requires special API approval
- No `avg_color` or placeholder data
- No `alt` text in response

---

## Implementation Plan

### Phase 1: Fix Broken `source.unsplash.com` URLs (Critical)

**Files to update:**

1. **`lib/destination-photo-map.ts`** — Replace `sourceUrl()` function to use `images.unsplash.com` direct URLs instead of dead `source.unsplash.com`. Pattern: `https://images.unsplash.com/photo-{id}?w={w}&h={h}&fit=crop&q=80`

2. **`lib/curated-backgrounds.ts`** — Same fix as above.

3. **`app/(tabs)/index.tsx`** — Replace `getUnsplashUrl()` to use Pexels or the curated `images.unsplash.com` URLs from `lib/photos.ts`.

4. **`lib/unsplash.ts`** — Update comment referencing `source.unsplash.com`.

### Phase 2: Add Pexels API to Edge Function

**Update `supabase/functions/destination-photo/index.ts`:**

```
Current flow:
  Request → Auth → Cache check → Google Places (3 calls) → Cache write → Response

Proposed flow:
  Request → Auth → Cache check → Google Places (3 calls)
                                    ↓ (if null)
                                  Pexels search (1 call) → Cache write → Response
```

Add a `PEXELS_API_KEY` secret to the edge function environment. When Google Places returns no photo, fall back to Pexels:

```typescript
// Pexels fallback
const pexelsKey = Deno.env.get("PEXELS_API_KEY");
if (!photoUrl && pexelsKey) {
  const pexelsRes = await fetch(
    `https://api.pexels.com/v1/search?query=${encodedQuery}+travel&per_page=1&orientation=landscape`,
    { headers: { Authorization: pexelsKey } }
  );
  if (pexelsRes.ok) {
    const pexelsData = await pexelsRes.json();
    const photo = pexelsData.photos?.[0];
    if (photo) {
      photoUrl = photo.src.large; // 940x650
    }
  }
}
```

### Phase 3: Pexels-Only Mode (Optional)

For deployments without Google Places key, support Pexels as the sole image source:

```typescript
if (!googleApiKey && pexelsKey) {
  // Skip Google Places entirely, go straight to Pexels
}
```

This makes the edge function work in environments where `GOOGLE_PLACES_KEY` isn't configured.

### Phase 4: Client-Side Pexels Module

Create `lib/pexels.ts` for direct client-side photo search (bypassing edge function for non-destination photos):

```typescript
// lib/pexels.ts
// For mood cards, backgrounds, and non-destination photo needs
// Uses EXPO_PUBLIC_PEXELS_KEY (safe — Pexels keys are not secret)
```

Pexels API keys are explicitly designed to be used client-side (unlike Google API keys), so `EXPO_PUBLIC_PEXELS_KEY` is safe.

---

## Fallback Strategy

```
Layer 1: Supabase venues cache (30-day TTL)
   ↓ miss
Layer 2: Google Places API (if GOOGLE_PLACES_KEY set)
   ↓ miss or no key
Layer 3: Pexels API search (if PEXELS_API_KEY set)
   ↓ miss or no key
Layer 4: Curated Unsplash URLs from lib/photos.ts (100+ destinations, always works)
   ↓ miss (unknown destination)
Layer 5: GENERIC_TRAVEL_FALLBACK (hardcoded Unsplash URL, always works)
```

This ensures photos NEVER fail — the worst case is a beautiful generic travel photo.

---

## Environment Variables Needed

| Variable | Where | Required? | Notes |
|----------|-------|-----------|-------|
| `GOOGLE_PLACES_KEY` | Edge function env | Optional (existing) | Already configured for some deployments |
| `PEXELS_API_KEY` | Edge function env | Recommended | Free at pexels.com/api, never expires |
| `EXPO_PUBLIC_PEXELS_KEY` | Client `.env` | Optional | Only if using client-side Pexels module |

---

## Cost Analysis

| Approach | Monthly Cost | Rate Limit | Quality |
|----------|-------------|------------|---------|
| Google Places only (current) | $0–$15+ (after 10K free) | 10K/month free | Excellent (real place photos) |
| Pexels only | $0 forever | 20K/month (200/hr) | Very Good (curated stock) |
| Google + Pexels fallback (recommended) | $0–$5 | 10K Google + 20K Pexels | Best of both |
| Curated Unsplash URLs only | $0 forever | Unlimited (static URLs) | Good but limited to ~100 destinations |

---

## Action Items

- [ ] **Critical:** Fix broken `source.unsplash.com` URLs in 3 files
- [ ] Register for free Pexels API key at https://www.pexels.com/api/
- [ ] Add `PEXELS_API_KEY` to Supabase edge function secrets
- [ ] Update edge function with Pexels fallback
- [ ] Optionally add `EXPO_PUBLIC_PEXELS_KEY` to client env
- [ ] Create `lib/pexels.ts` client module
- [ ] Test edge function with and without Google Places key
