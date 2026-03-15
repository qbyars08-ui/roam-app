# Research Report — 2026-03-15

**Topic:** People Tab Backend Architecture — Real-time Traveler Matching
**Agent:** 02 — ROAM Researcher
**Priority:** P0
**Branch:** `cursor/destination-image-apis-3eaa`

---

## Phase 1 Implementation Status: SHIPPED

**What was implemented (2026-03-15):**
- `lib/people-tab.ts` — data layer: `fetchMatchedTravelers`, `fetchOpenGroups`, `fetchPresenceCount`, `postTripPresenceForTrip`
- `app/(tabs)/people.tsx` — wired to Supabase: real matches from `findSquadCandidates()`, real groups from `public_trips`, live traveler count via Presence, "Connect" button wired to `swipeCandidate()`
- `lib/store.ts` — `addTrip` now auto-posts `trip_presence` for authenticated users
- Mock data retained as graceful fallback (shown with "Generate a trip to see real matches" banner)

---

## Executive Summary

The People tab backend is **90% already built**. ROAM has a complete social layer schema (`social_profiles`, `trip_presence`, `squad_swipes`, `squad_matches`), a working matching algorithm in `lib/social.ts`, Supabase Realtime already enabled on all key tables, and a full type system in `lib/types/social.ts`. The `app/(tabs)/people.tsx` screen is running on mock data when it could connect to live Supabase data **today**. This report documents the architecture, identifies the wiring gap, and provides the exact implementation path.

---

## Key Findings

1. **The social backend is fully designed and deployed** — `supabase/migrations/20260311000005_social_layer.sql` contains 7 features: Squad Finder, Breakfast Club, Hostel Social, Nightlife Crew, Group Trip Builder, Local Connect, Safety Circle. All tables exist. All RLS policies exist. Supabase Realtime is enabled on `social_chat_messages`, `location_checkins`, `squad_matches`, `breakfast_listings`, `hostel_events`, `nightlife_groups`. Source: `supabase/migrations/20260311000005_social_layer.sql`.

2. **The matching algorithm is already built** — `lib/social.ts:findSquadCandidates()` queries `trip_presence` for date-overlapping travelers at the same destination, fetches their `social_profiles`, excludes already-swiped profiles, and computes a 0–100 `compatibilityScore` = `vibeScore (0–60)` + `overlapScore (0–30)` + `styleBonus (0–10)`. This is a solid Day 1 algorithm. Source: `lib/social.ts` lines 91–165.

3. **`people.tsx` is entirely disconnected from the backend** — The tab renders `MOCK_TRAVELERS` and `MOCK_GROUPS` (hardcoded arrays), never calls `lib/social.ts`, never subscribes to Supabase Realtime. The "Set up profile" button routes to `/profile`. The "Connect" button has no action. Source: `app/(tabs)/people.tsx` lines 53–150, 203–218.

4. **The AGENT_BOARD's "Blocked on Quinn: Create `traveler_profiles` table" is mislabeled** — `social_profiles` + `trip_presence` already covers traveler profiles with the correct schema. The board may be referring to a unified `traveler_profiles` view (a JOIN of both tables) which could be created as a Postgres VIEW without Quinn's involvement. No new table is needed.

5. **Supabase Realtime Presence is the correct tool for "who's in Tokyo right now"** — Presence uses a CRDT-backed in-memory store and auto-removes disconnected clients. Compared to `postgres_changes` (which reads from DB) or `broadcast` (ephemeral messaging), Presence maintains a live roster of online users and their metadata. Latency is <200ms. Source: [Supabase Presence docs](https://supabase.com/docs/guides/realtime/presence).

6. **Privacy defaults are already conservative** — `SocialProfile.visibility` defaults to `'invisible'` (opt-in visibility). `locationPrecision` defaults to `'neighborhood'` (never exact coordinates). `showRealName` defaults to `false`. `autoDeleteChats` defaults to `true`. `avatarEmoji` is used instead of real photos until mutual match. Source: `lib/types/social.ts:DEFAULT_PRIVACY`.

7. **Competitive landscape: 4 apps doing traveler matching in 2026** — Trespot (requires booking verification), Pigeon (question deck compatibility), TripMatches (15+ factor algorithm), Triper (encrypted MPC matching). None are part of a broader AI trip planner. ROAM's moat: matching is embedded inside the planning flow ("you generated a Tokyo trip → here's who else is going"). Source: [Trespot](https://trespot.com), [Pigeon](https://www.pigeon.travel), [TripMatches](https://tripmatches.com).

---

## Recommended Actions

- [x] **[P0] DO NOT create a new `traveler_profiles` table** — `social_profiles` + `trip_presence` already IS the traveler profile schema. Creating a redundant table creates inconsistency. If Quinn needs a consolidated view, create a Postgres VIEW: `CREATE VIEW traveler_profiles AS SELECT sp.*, tp.destination, tp.arrival_date, tp.departure_date FROM social_profiles sp LEFT JOIN trip_presence tp ON sp.user_id = tp.user_id WHERE tp.status = 'active';`

- [ ] **[P0] Wire `people.tsx` to `lib/social.ts`** — Replace `MOCK_TRAVELERS` with a `useEffect` that calls `findSquadCandidates()` using the user's most recent trip. Replace `MOCK_GROUPS` with a query to `public_trips` ordered by `current_members` count descending. ETA: 2–3 hours.

- [ ] **[P0] Add Supabase Realtime Presence for "who's in [city] right now"** — Track presence when user opens People tab. Payload: `{ userId, destination, neighborhood, status: 'browsing' }`. Show count in hero stats section. Replace hardcoded "2.4k Active travelers" with live count from presence roster.

- [ ] **[P1] Auto-post `trip_presence` on trip generation** — When `addTrip()` fires in Zustand, automatically upsert a `trip_presence` row with `destination`, `arrival_date` (from `startDate` if present, else `createdAt + 30 days`), `departure_date` (arrival + days). This is the key activation moment — user generates a trip → they become discoverable. Implementation: add side-effect in `lib/store.ts:addTrip`.

- [ ] **[P1] Swipe-to-connect UX in People tab** — The existing `swipeCandidate()` function handles mutual matching + chat channel creation. Wire the "Connect" button to `swipeCandidate(traveler.tripPresenceId, traveler.id, 'right')`. On match, show a modal and route to the new chat channel.

- [ ] **[P1] Create `traveler_profiles` Postgres VIEW** — Consolidate `social_profiles` + `trip_presence` for a single-query profile fetch. Add to a new migration file. Expose via RLS using `auth.uid()`.

- [ ] **[P2] Profile completeness gating for "Connect"** — Before showing connect button, check if `social_profiles.visibility = 'visible'`. If user hasn't set up their social profile, intercept and route to profile setup. Otherwise, matching is one-sided.

- [ ] **[P2] Implement presence-based "X people are going to [destination] this month"** — Use `trip_presence` count query per destination to power hero stats. Cache in Supabase with 1-hour TTL (cheaper than live query on every page load).

---

## Real-Time Traveler Matching Architecture

### How Bumble BFF / Couchsurfing Match (Pattern Analysis)

| Signal | Bumble BFF | Couchsurfing | ROAM Squad Finder |
|--------|-----------|--------------|-------------------|
| Location | City-level | City-level | Destination (future intent) |
| Intent | "Looking for friends" | "Open to host/meet" | "Going to X on dates Y–Z" |
| Temporal | Now (or soon) | Flexible | Specific trip dates |
| Compatibility | Interests, mutual friends | Vouches, reviews, references | Vibe tags, travel style, date overlap |
| Privacy | Real photo + first name | Full profile | Emoji avatar + alias until mutual match |
| Match gate | Mutual like | Message request | Mutual right-swipe |

**Key insight ROAM has that neither competitor does:** the destination and dates are already known from the generated itinerary. Couchsurfing requires manual "I'm traveling to X" posts. Bumble BFF doesn't understand travel intent at all. ROAM should **auto-populate trip presence from itinerary generation**, making matching frictionless.

### Compatibility Score Design (v2 Recommendation)

Current algorithm (from `lib/social.ts`):
```
compatibilityScore = min(sharedVibes × 20, 60)  // 0–60
                   + min(overlapDays × 5, 30)     // 0–30
                   + (travelStyle match ? 10 : 0) // 0–10
                   = 0–100
```

Recommended v2 additions (after `TravelProfile` data is available):
```
paceDelta       = abs(myPace - theirPace) → subtract 0–20 points
budgetDelta     = abs(myBudget - theirBudget) → subtract 0–20 points
accommodationMatch = same preference → add 10 points
languageOverlap = shared language → add 5 points
```

This makes the match score use the rich `TravelProfile` data that's already collected during onboarding (pace, budgetStyle, accommodation, tripPurposes).

---

## Supabase Realtime Evaluation

### Feature Comparison for People Tab

| Use Case | Tool | Latency | Scale | Recommendation |
|----------|------|---------|-------|----------------|
| "Who's online browsing People tab now" | Presence | <200ms | Up to ~1K per channel | Use `supabase.channel('people-tab').track()` |
| "Who's going to Tokyo this month" | `postgres_changes` or poll | ~100ms | Unlimited | Simple count query with 1h cache |
| "New chat message in squad match" | `postgres_changes` | <500ms | Good for MVP | Already implemented in `lib/social.ts` |
| "Someone matched with me" | `postgres_changes` | <500ms | Good for MVP | Enable on `squad_matches` (already in publication) |
| "Live traveler count on Discover tab" | Presence or DB count | Any | Good | DB count poll every 60s is cheaper |

### Presence Implementation (copy-ready)

```typescript
// In people.tsx — track user's presence while browsing
useEffect(() => {
  const channel = supabase.channel('people-presence', {
    config: { presence: { key: userId } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const count = Object.keys(state).length;
      setActiveTravelerCount(count);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId,
          destination: currentUserTrip?.destination ?? null,
          status: 'browsing',
          lastSeenAt: new Date().toISOString(),
        });
      }
    });

  return () => { supabase.removeChannel(channel); };
}, [userId, currentUserTrip]);
```

### Scaling Limits

- Supabase free tier: 500 concurrent Realtime connections
- Supabase Pro: 10,000 concurrent
- Presence channels: max ~1,000 users per channel (use destination-scoped channels at scale, e.g. `people-presence:tokyo`)
- `postgres_changes`: at 10K+ writes/min, switch to Broadcast via triggers (already recommended by Supabase for production)

---

## Traveler Profile Schema (Existing + Recommended Additions)

### Existing Schema (DO NOT RECREATE)

```sql
-- Already exists in Supabase (20260311000005_social_layer.sql)
social_profiles (
  user_id, display_name, age_range, travel_style, vibe_tags[],
  bio, avatar_emoji, languages[], verified,
  visibility, location_precision, show_real_name,
  show_age, open_to_meetups, auto_delete_chats
)

trip_presence (
  user_id, destination, arrival_date, departure_date,
  looking_for[], status
)
```

### Recommended Additions (new migration)

```sql
-- Add to social_profiles
ALTER TABLE social_profiles
  ADD COLUMN IF NOT EXISTS countries_visited int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS travel_frequency text CHECK (
    travel_frequency IN ('first-trip','once-a-year','few-times-year','constantly')
  ),
  ADD COLUMN IF NOT EXISTS pace_score int CHECK (pace_score BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS budget_score int CHECK (budget_score BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS accommodation_style text,
  ADD COLUMN IF NOT EXISTS avatar_url text,  -- unlocked after mutual match
  ADD COLUMN IF NOT EXISTS instagram_handle text,  -- optional, post-match reveal
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

-- Index for matching queries
CREATE INDEX IF NOT EXISTS idx_social_profiles_active
  ON social_profiles(last_active_at DESC)
  WHERE visibility = 'visible';

-- Unified view (no new table needed)
CREATE OR REPLACE VIEW traveler_profiles AS
  SELECT
    sp.*,
    tp.destination AS going_to,
    tp.arrival_date,
    tp.departure_date,
    tp.looking_for,
    tp.id AS presence_id
  FROM social_profiles sp
  LEFT JOIN trip_presence tp ON sp.user_id = tp.user_id
  WHERE tp.status = 'active' OR tp.status IS NULL;

-- RLS on view (inherits from underlying tables)
```

### Schema Mapping: `app/(tabs)/people.tsx` Mock → Real

| Mock field | Real column | Source table |
|-----------|-------------|--------------|
| `traveler.name` | `display_name` | `social_profiles` |
| `traveler.age` | Derived from `age_range` midpoint | `social_profiles` |
| `traveler.avatar` | `avatar_emoji` (or `avatar_url` post-match) | `social_profiles` |
| `traveler.destination` | `destination` | `trip_presence` |
| `traveler.dates` | `arrival_date` – `departure_date` | `trip_presence` |
| `traveler.vibes` | `vibe_tags[]` | `social_profiles` |
| `traveler.bio` | `bio` | `social_profiles` |
| `traveler.countries` | `countries_visited` (new) | `social_profiles` |
| `traveler.matchScore` | `compatibilityScore` | Computed in `findSquadCandidates()` |
| `group.destination` | `destination` | `public_trips` |
| `group.memberCount` | `array_length(current_members, 1)` | `public_trips` |
| `group.dateRange` | `start_date` – `end_date` | `public_trips` |
| `group.vibeMatch` | `vibes[]` joined as string | `public_trips` |

---

## Privacy-Safe Location Sharing Architecture

### Design Principles (from existing `lib/types/social.ts:DEFAULT_PRIVACY`)

1. **Opt-in visibility** — `visibility: 'invisible'` by default. Users must actively choose `'visible'` to appear in matching.
2. **Neighborhood-level only** — `locationPrecision: 'neighborhood'` prevents exact GPS coordinates from being stored or shared. Users share "Shibuya, Tokyo" not "35.6580, 139.7016".
3. **No real photos until mutual match** — `avatarEmoji` used in browsing; real photo URL unlocks only after both parties swipe right.
4. **Ephemeral chats** — `autoDeleteChats: true` purges chat history after trip end date.
5. **Display alias, not real name** — `showRealName: false` by default; `displayName` is a user-chosen alias.

### "Who's in Tokyo Right Now" — Safe Implementation

```
User opens People tab for Tokyo trip
  ↓
Track presence: { userId, destination: 'Tokyo', neighborhood: null, status: 'browsing' }
  (neighborhood only if user explicitly shares it)
  ↓
Show count: "47 travelers are in or heading to Tokyo"
  ↓
User taps "See who" → requires visibility = 'visible'
  ↓
Show social_profiles with visibility = 'visible' AND trip_presence.destination = 'Tokyo'
  (no real-time GPS — just trip intent data from generated itinerary)
```

### What NOT to do (privacy anti-patterns to avoid)

- Do NOT use `expo-location` GPS in People tab (only in group trip Safety Circle feature)
- Do NOT show last-active timestamp at < 1-hour granularity ("online 2 min ago" feels stalker-y)
- Do NOT allow searching by username (prevents reverse lookup of real identity)
- Do NOT store `avatar_url` server-side until mutual match (prevents harvesting profile photos)
- Do NOT expose `user_id` UUIDs in client-facing responses (use `social_profiles.id` instead)

---

## MVP Implementation Plan (Mock → Supabase)

### Phase 1: Static → Live (1 day, zero new backend code)

Wire `people.tsx` to existing `lib/social.ts` functions. No schema changes needed.

```
1. On mount: call getSocialProfile() → if null, show "set up profile" gate
2. On mount: call findSquadCandidates(myTrip.destination, arrival, departure)
   → populate TravelerCard list from results
3. On mount: query public_trips WHERE status = 'open' ORDER BY current_members DESC LIMIT 5
   → populate GroupCard list
4. "Connect" button: call swipeCandidate(presenceId, userId, 'right')
   → on matched: true, show match modal
5. Hero stats: query count of trip_presence WHERE destination = myDest AND status = 'active'
```

### Phase 2: Realtime (2 days)

```
1. Add Supabase Presence tracking (see implementation above)
2. Subscribe to squad_matches for live match notifications
3. Add real-time chat view for matched travelers
4. Auto-post trip_presence when trip is generated (addTrip side effect)
```

### Phase 3: Profile + Polish (3 days)

```
1. Build social profile setup screen (display name, vibe tags, travel style, bio)
2. Add avatar photo upload (to Supabase Storage) — only revealed after match
3. Add social_profiles.countries_visited + pace_score + budget_score columns
4. Upgrade compatibilityScore with TravelProfile data (pace, budget deltas)
5. Add report/block functionality on traveler cards
```

### Phase 4: Growth Loop (ongoing)

```
1. "Share your trip" → generates link to public_trips entry
2. Push notification on squad match
3. "X people are going to [destination] this month" in Discover tab cards
4. Auto-invite to People tab when generating a trip ("Find travel companions?")
```

---

## New APIs Discovered

| API | Free Tier | Use Case | Latency | Docs |
|-----|-----------|----------|---------|------|
| **Supabase Realtime Presence** | Included in Supabase (free tier: 500 concurrent) | "Who's browsing People tab / going to [city] right now" | <200ms | [supabase.com/docs/guides/realtime/presence](https://supabase.com/docs/guides/realtime/presence) |
| **Supabase Realtime postgres_changes** | Included | Live match notifications, chat messages | <500ms | [supabase.com/docs/guides/realtime/postgres-changes](https://supabase.com/docs/guides/realtime/postgres-changes) |

No new paid APIs are needed for Phase 1–2. The entire People tab backend runs on existing Supabase infrastructure.

---

## Competitor Moves

| Competitor | What They Ship | ROAM Opportunity |
|-----------|----------------|-----------------|
| **Trespot** | Travel dating + AI trip planner — exact ROAM overlap | Trespot requires ticket/booking verification (friction). ROAM's match is instant — destination data comes from the generated itinerary. Win on frictionlessness. |
| **Pigeon** | Question deck + compatibility for travelers | No trip planning layer. Travelers have to manually input where they're going. ROAM knows this already. |
| **Couchsurfing** | Location-based meetups, events, hosting | Perceived as sketchy / unsafe for young women (Reddit consensus). ROAM's privacy-first defaults (invisible by default, no real photos, alias names) directly address this. |
| **Bumble BFF** | Friend-finding in home city, not travel-oriented | No travel awareness. Users would have to manually filter for "travelers." Not a real competitor. |
| **Hostelworld MeetWorld** | In-hostel social features | Requires hostel booking. ROAM is booking-agnostic — works for Airbnb, apartments, hotels. |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Low initial `trip_presence` population (cold start) | High | Medium | Show MOCK_TRAVELERS as "traveler cards" with label "Example matches" until real data fills in. Seed 5–10 internal accounts. |
| Privacy incident (user feels stalked) | Low | High | Default visibility: invisible. Require explicit opt-in. Neighborhood-only location. |
| Spam / fake profiles | Medium | Medium | Require email verification (already Supabase auth). Rate-limit profile creation. Add report button from Day 1. |
| Supabase free tier Realtime limits (500 concurrent) | Medium | Low | At 500 MAU, fine. At 5K+ MAU, upgrade to Pro ($25/mo). Not a Day 1 concern. |
| `findSquadCandidates()` slow at scale | Low | Medium | Add composite index on `trip_presence(destination, arrival_date, departure_date, status)` — already exists in migration. |

---

## Implementation Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `app/(tabs)/people.tsx` | People tab UI | Needs wiring to Supabase |
| `lib/social.ts` | All social backend functions | Complete, battle-ready |
| `lib/types/social.ts` | Full type system | Complete |
| `supabase/migrations/20260311000005_social_layer.sql` | All social tables + RLS | Deployed |
| `lib/types/location-sharing.ts` | Location sharing types | Complete |
| `lib/store.ts` | Zustand state (needs `addTrip` side-effect) | Needs trip_presence auto-post |
