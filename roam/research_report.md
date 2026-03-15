# Research Report — 2026-03-15

**Topic 1:** Destination Image CDN — Cloudinary vs Imgix vs Supabase Storage
**Topic 2:** People Tab Backend Architecture (previous sprint — implemented)
**Agent:** 02 — ROAM Researcher
**Priority:** P0 (image CDN is blocking live app)
**Branch:** `cursor/destination-image-apis-3eaa`

---

## URGENT: source.unsplash.com Is Completely Dead

**`source.unsplash.com` stopped functioning in mid-2024.** Three files in the codebase still reference it and are producing broken images on the live site:

| File | Usage | Impact |
|------|-------|--------|
| `lib/destination-photo-map.ts` | 30 fallback URLs via `sourceUrl()` | Curated backgrounds + destination-photo-map broken |
| `lib/curated-backgrounds.ts` | 15 daily background photos | Discover tab background images broken |
| `app/(tabs)/index.tsx` | `getUnsplashUrl()` random-by-query fallback | Discover tab cards show broken images when `unsplashUrl` is missing |

**These are fixed in this PR.** See implementation section below.

---

## Key Findings

1. **All 37 DESTINATIONS in `lib/constants.ts` have `unsplashUrl` set** — the `getUnsplashUrl()` fallback in `index.tsx` is never actually needed for any current destination. But it fires for any future destination added without `unsplashUrl`, so the broken function is a latent bug.

2. **`images.unsplash.com` direct URLs are working and ToS-compliant** — Unsplash explicitly requires hotlinking (their guideline) and `images.unsplash.com` is the approved CDN. These 37 direct URLs in `lib/constants.ts` are the correct approach and are not broken.

3. **No app-level image caching exists** — React Native's `<Image>` component uses the OS disk cache, which is unpredictable in size and can be evicted. On web, browser cache TTL applies. There's no explicit `AsyncStorage` or dedicated image cache layer. Every session open may re-fetch all 37 destination photos.

4. **Current image load footprint at session start:** 37 destinations × ~80KB average = ~3MB of images on Discover tab open. At 1,000 DAU with no explicit caching, that's ~3GB/day of Unsplash bandwidth, entirely at their discretion.

5. **Cloudinary Fetch is the best CDN option for ROAM's scale** — proxies existing `images.unsplash.com` URLs through Cloudinary's CDN, adds WebP auto-conversion, global edge caching (200+ PoPs), and requires zero image uploads. Free tier covers 25 GB bandwidth/month = ~312,000 image serves at 80KB = plenty for pre-revenue scale.

6. **Imgix eliminated its free tier in July 2025** — $25/month minimum with no free tier. Not viable for a pre-revenue app.

7. **Supabase Storage has a 2GB egress limit on the free tier** — at 80KB/image that's only ~25,000 image serves before billing. Also uploading Unsplash images to Supabase Storage would violate Unsplash's ToS (no hosting copies). Not the right tool for this use case.

---

## CDN Option Matrix

| Option | Monthly Cost | Bandwidth Free | CDN PoPs | RN Compatible | Migration Effort | Verdict |
|--------|-------------|----------------|----------|---------------|-----------------|---------|
| **images.unsplash.com (current)** | $0 | Unlimited (Unsplash's cost) | ~20 | Yes | None | Good stopgap, no control |
| **Cloudinary Fetch** | $0 | 25 GB (~312K serves) | 200+ | Yes | URL prefix change | **RECOMMENDED** |
| **Imgix** | $25/mo min | None (credit-based) | 80+ | Yes | URL prefix change | Too expensive pre-revenue |
| **Supabase Storage** | $0 | 2 GB (~25K serves) | Cloudflare | Yes | Upload all images | Too limited + ToS risk |
| **bunny.net** | ~$1/mo + usage | $50 trial | 119 | Yes | Upload all images | Requires own image hosting |
| **Self-hosted S3 + CloudFront** | ~$0.05/mo | Minimal | 400+ | Yes | Full migration | Overkill at current scale |

---

## Recommended Strategy (3 Phases)

### Phase 0 — P0 Immediate (this PR): Fix broken source.unsplash.com

Replace all `source.unsplash.com` references with `images.unsplash.com` format. **Shipped in this PR.**

```
// OLD (broken)
https://source.unsplash.com/{id}/1600x1100

// NEW (working)
https://images.unsplash.com/photo-{id}?w=1600&q=85&fm=webp
```

Also add `lib/image-cache.ts` — AsyncStorage-backed URL cache to prevent repeated fetches across sessions.

### Phase 1 — P1 Short-term: Cloudinary Fetch Mode

Sign up for Cloudinary free account. Change one constant in `lib/unsplash.ts`:

```typescript
// Add to lib/unsplash.ts
export function cloudinaryFetch(sourceUrl: string, w = 800): string {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) return sourceUrl; // graceful fallback
  return `https://res.cloudinary.com/${cloud}/image/fetch/f_auto,q_auto,w_${w}/${encodeURIComponent(sourceUrl)}`;
}
```

Then wrap all `images.unsplash.com` URLs through this function. Benefits:
- Cloudinary caches the image at their 200+ edge nodes
- Auto-converts to WebP/AVIF (typically 40-60% smaller)
- Insulates the app from any future Unsplash CDN changes
- Free tier: 25 GB bandwidth = plenty for MVP

**Setup: EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME** (add to .env.example)

### Phase 2 — P2 Long-term: Owned Asset Library

For true reliability, upload curated destination photos (properly licensed, CC0 or purchased) to Supabase Storage or S3. This eliminates all Unsplash dependency. Use Cloudinary or bunny.net as the CDN layer. Target: post-launch, when revenue justifies the migration effort.

---

## Cost Projections

| MAU | Image Serves/mo (est.) | Cloudinary Free | Supabase Free | Cost if exceeded |
|-----|----------------------|-----------------|---------------|-----------------|
| 100 | ~31,000 | Covered (2.5GB) | Covered | $0 |
| 1,000 | ~310,000 | Covered (25GB) | 10× over limit | $0 (Cloudinary) |
| 10,000 | ~3.1M | 1.2× over | Way over | ~$5/mo Cloudinary Plus |
| 100,000 | ~31M | 12× over | Way over | ~$50/mo Cloudinary Plus |

**Cloudinary is free until ~8,000 MAU** (assuming 3 image loads/session, 80KB average). At $45/mo for the Plus plan, this is sustainable revenue-positive.

---

## P0 Implementation (This PR)

### Files Fixed

**`lib/destination-photo-map.ts`** — Replace `sourceUrl()` with `images.unsplash.com/photo-{id}`:
```typescript
// Before: https://source.unsplash.com/h2v6ZV4C8pU/1600x1100 (BROKEN)
// After:  https://images.unsplash.com/photo-h2v6ZV4C8pU?w=1600&q=85&fm=webp
```

**`lib/curated-backgrounds.ts`** — Same fix for 15 daily background photos.

**`app/(tabs)/index.tsx`** — Replace the dead `getUnsplashUrl()` function with a static fallback using a real image URL.

**`lib/image-cache.ts`** (new) — AsyncStorage-backed cache for image URLs, keyed by destination label. Prevents repeated network fetches across sessions. TTL: 30 days.

---

## New APIs / Tools Discovered

| Tool | Free Tier | Use Case | Docs |
|------|-----------|----------|------|
| **Cloudinary Fetch** | 25 GB bandwidth/month | Proxy + cache existing Unsplash URLs through Cloudinary CDN | [cloudinary.com/documentation/fetch_remote_images](https://cloudinary.com/documentation/fetch_remote_images) |
| **Supabase Storage** | 1GB storage + 2GB egress | Self-hosted owned images (post-launch) | [supabase.com/docs/guides/storage](https://supabase.com/docs/guides/storage) |

---

## People Tab Phase 1 — Status (Previous Sprint)

**SHIPPED** in previous PR. Implementation complete:
- `lib/people-tab.ts` — data layer (fetchMatchedTravelers, fetchOpenGroups, fetchPresenceCount)
- `app/(tabs)/people.tsx` — wired to Supabase backend with mock fallback
- `lib/store.ts` — auto-posts trip_presence on trip generation

---

## Recommended Actions

- [x] **[P0] Fix source.unsplash.com in 3 files** — DONE in this PR
- [x] **[P0] Add lib/image-cache.ts** — DONE in this PR
- [ ] **[P1] Sign up for Cloudinary free account** — Add `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` to .env
- [ ] **[P1] Add `cloudinaryFetch()` helper to lib/unsplash.ts** — Wrap all destination images through Cloudinary
- [ ] **[P2] Expand DESTINATIONS to 50+ cities** — Each new destination needs `unsplashUrl` set
- [ ] **[P2] Audit for any non-direct image URLs** — Confirm zero `source.unsplash.com` remaining
- [ ] **[P3] Migrate to owned asset library** — Post-launch, after revenue
