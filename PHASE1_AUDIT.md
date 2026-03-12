# Phase 1 — Full Audit Report

## Codebase Map

### Routes & Screens
| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/(tabs)/index.tsx` | Discover — curated destinations |
| `/globe` | `app/(tabs)/globe.tsx` | Spin — random destination + itinerary |
| `/plan` | `app/(tabs)/plan.tsx` | Plan — 3-step wizard |
| `/chat` | `app/(tabs)/chat.tsx` | Ask — AI travel chat |
| `/saved` | `app/(tabs)/saved.tsx` | Trips — saved itineraries |
| `/flights` | `app/(tabs)/flights.tsx` | Flights — AviationStack lookup |
| `/passport` | `app/(tabs)/passport.tsx` | Passport stamps |
| `/pets` | `app/(tabs)/pets.tsx` | Pet travel hub |
| `/profile` | `app/(tabs)/profile.tsx` | You — settings |
| `/itinerary` | `app/itinerary.tsx` | Itinerary modal |
| `/paywall` | `app/paywall.tsx` | Pro paywall |
| `/alter-ego` | `app/alter-ego.tsx` | Travel quiz |
| `/trip-dupe` | `app/trip-dupe.tsx` | Budget dupe finder |
| `/referral` | `app/referral.tsx` | Referral codes |
| `/hype` | `app/hype.tsx` | Trip countdown |

### Critical Flows

**Claude/Anthropic**
- Client: `lib/claude.ts` → `callClaude(system, message, isTripGeneration)`
- Sends `{ system, message, isTripGeneration }` to `claude-proxy` edge function
- Edge function expected `{ systemPrompt, messages }` — **FIXED** to accept client format
- Anthropic returns `content` as array of blocks — **FIXED** to extract `content[0].text`
- Fallback: direct API call when edge function fails (requires EXPO_PUBLIC_ANTHROPIC_API_KEY)

**Profile/Rate Limit**
- Edge function needs `profiles` table
- Migration added: `20260309_create_profiles_table.sql`
- Edge function now creates profile on-the-fly if missing
- Rate limit applied only when `isTripGeneration=true` (chat does not consume trip limit)

**Skip Login (Dev)**
- Sets fake session in Zustand; Supabase auth has no session
- Edge function returns 401 (no valid JWT)
- Client catches and falls back to direct Anthropic API — **real AI works in dev**

## Issues Found & Fixed

1. **Edge function contract mismatch** — Client sent `system`/`message`, edge expected `systemPrompt`/`messages`. Fixed.
2. **Anthropic response parsing** — Content is `[{ type: "text", text: "..." }]`. Fixed extraction.
3. **Rate limit on chat** — Edge always incremented trip count. Now only increments when `isTripGeneration`.
4. **Missing profiles** — Added migration + graceful fallback when table missing.
5. **Direct API fallback** — Already in `lib/claude.ts`; uses EXPO_PUBLIC_ANTHROPIC_API_KEY.

## Manual Testing Checklist (Phase 4)

Run app at localhost:3000, then:

- [ ] Onboarding quiz → completes, goes to welcome
- [ ] Skip Login → goes to Discover
- [ ] Plan: Tokyo, 5 days, budget, vibes → Build → real itinerary
- [ ] Ask: "best street food in Bangkok under $5" → real AI response
- [ ] Spin → land on destination → Build trip → itinerary
- [ ] Saved trips → save/retrieve
- [ ] Flights → search AA 1004
- [ ] Passport, Pets, Profile → load

## Deploy Requirements

- Run `supabase login` then `supabase link --project-ref byetqukwnanrmupovzev`
- Run `supabase db push` to apply migrations (including profiles)
- Set `ANTHROPIC_API_KEY` in Supabase Dashboard → Edge Functions → Secrets
- Deploy: `supabase functions deploy claude-proxy`
