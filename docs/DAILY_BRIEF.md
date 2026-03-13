# ROAM Daily Brief — March 13, 2026

> Maintained by Bridge. Overwrite at each session start.

---

## Priority Actions (do today)

1. **Polish audit: clear the 39 unaudited screens** — App Store submission is blocked until the checklist is complete. 20 of 59 screens done. The unaudited ones include high-visibility surfaces: `/paywall`, `/trip/[id]`, `/group-trip`, `/dream-vault`, `/referral`, `/chaos-dare`. — **Owner: FORGE**

2. **App Store screenshots: capture all 6 PNGs** — 1290×2796px, no assets exist in repo. Screens: Discover, Plan wizard, Itinerary, Group Trips, Prep, Share Card. Blocks submission regardless of code quality. — **Owner: FORGE**

3. **Audit `lib/revenuecat.ts` vs `lib/revenue-cat.ts` — resolve the duplicate** — Two RevenueCat modules exist. One is likely dead code. Leaving both increases bundle size and creates maintenance confusion. Determine which is canonical, delete the other. — **Owner: FORGE**

---

## Insights Worth Noting

- **Session race condition fixed** (`89d65bf`) — the plan screen's anon limit logic and waitlist hash overflow were causing silent trip generation failures for guest users on web. This was a conversion-critical bug. Monitor for regression in the guest → email-capture flow.

- **Performance audit is 100% complete** — lazy screens, memoization, webp images, Supabase indexes, AsyncStorage versioning — all done. No perf debt. Build on this foundation, don't break it.

- **WorldMap.tsx exists but UNBUILT_FEATURES.md calls it P0 unbuilt** — `components/features/WorldMap.tsx` is present. Either the doc is stale or the component is built but not wired to a screen. FORGE should verify and SCOUT should update the doc.

- **ROAM's #1 differentiator per competitive research:** opinionated, specific AI output (real restaurants, real prices, real dishes). This must stay central to every AI prompt change. Don't let generic language creep into the system prompt.

- **Group trips spec is outdated** — `docs/group-trips-spec.md` still says "not built." It's fully built. Update the doc to reflect reality so new agents don't waste time re-implementing.

---

## Priority Scoring (P0 unbuilt features)

| Feature | User | Revenue | Effort | Urgency | Score |
|---------|------|---------|--------|---------|-------|
| App Store Screenshots | 5 | 5 | 4 | 5 | **4.75** |
| Polish audit (remaining 39 screens) | 4 | 4 | 3 | 5 | **4.00** |
| Live Flight Prices (1C) | 4 | 5 | 3 | 3 | **3.75** |
| Voice STT for chat (7A) | 3 | 3 | 3 | 2 | **2.75** |
| Budget Filtering on Discover (2B) | 3 | 2 | 4 | 2 | **2.75** |
| Photo-to-Destination (7B) | 3 | 3 | 2 | 2 | **2.50** |

*Screenshots and polish audit own the top two slots — they are the App Store submission gate.*

---

## Blockers

- **App Store screenshots require a configured simulator or device** — no automated path. FORGE needs to capture these manually. iOS simulator at 1290×2796 (iPhone 15 Pro Max) is the standard.
- **Live Flight Prices requires Amadeus API key** — `lib/flights-amadeus.ts` exists but the edge function for live price display doesn't. Key needs to be in Supabase env before SPARK can spec the UI.
- **group-trips-spec.md stale doc** — could mislead a new SPARK agent into re-speccing something already built. Update before onboarding new agents.

---

## This Week's Focus

**Ship the App Store submission gate:** complete the polish audit and capture all 6 screenshots. Everything else is secondary until those two boxes are checked.

---

*Next: Update `docs/DECISIONS_LOG.md` with any decisions made this session.*
