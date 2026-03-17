# ROAM Reachability Audit

Date: 2026-03-17

---

## 1. Tab Bar Structure

**File:** `app/(tabs)/_layout.tsx`

### Visible tabs (5) — shown in FloatingPillNav:
| Tab | Screen file | Icon |
|-----|-------------|------|
| Plan | `plan.tsx` | Map |
| Pulse | `pulse.tsx` | Radio |
| Flights | `flights.tsx` | Plane |
| People | `people.tsx` | Users |
| Prep | `prep.tsx` | Shield |

### Hidden tabs (7) — `href: null`, not in nav pill but still routable via `router.push`:
| Tab | Has inbound links? |
|-----|-------------------|
| `pets` | Yes (ExploreHub in profile.tsx) |
| `index` | No direct links from visible tabs; it is the hidden home screen |
| `body-intel` | Yes (prep.tsx, plan.tsx, itinerary.tsx) |
| `generate` | Yes (many screens use `router.push('/(tabs)/generate')`) |
| `stays` | Yes (ExploreHub in profile.tsx only) |
| `food` | Yes (ExploreHub in profile.tsx only) |
| `group` | No direct `router.push` to `/(tabs)/group` found |

---

## 2. Navigation Audit — Target Screens

### /i-am-here-now
- **Status: REACHABLE (conditionally)**
- **Linked from:** `plan.tsx` line 847 — `TravelingSection` `onHelpPress` callback
- **Condition:** Only visible when `stage === 'TRAVELING'` and `activeTrip` exists. This means the user must have a trip whose departure date is today or in the past, but whose end date hasn't passed yet. A new user with no trips will never see this.
- **Also reachable from:** ExploreHub (not listed, but the `IAmHereNow` component is imported into prep.tsx as a component, not as a route)

### /trip-wrapped
- **Status: REACHABLE (conditionally)**
- **Linked from:**
  - `plan.tsx` line 855 — `ReturnedSection` `onWrappedPress` (requires `stage === 'RETURNED'`)
  - `saved.tsx` line 455
  - `index.tsx` line 449 (hidden tab)
  - `profile.tsx` line 471
  - ExploreHub in profile.tsx
- **Condition for plan.tsx path:** User must have a trip that ended within the last 30 days. Otherwise only reachable via profile or saved screens.

### /trip-journal
- **Status: REACHABLE (conditionally)**
- **Linked from:**
  - `plan.tsx` line 848 — `TravelingSection` `onCapturePress` (requires `stage === 'TRAVELING'`)
  - `plan.tsx` line 856 — `ReturnedSection` `onJournalPress` (requires `stage === 'RETURNED'`)
  - `saved.tsx` line 360
  - `itinerary.tsx` line 1385
  - ExploreHub in profile.tsx
- **Condition:** Not reachable from plan tab for DREAMING, PLANNING, or IMMINENT users. Reachable from itinerary screen or saved screen if user has trips.

### /explore-map
- **Status: REACHABLE (conditionally)**
- **Linked from:**
  - `components/features/TripMapCard.tsx` line 171 — requires an active trip with itinerary
  - `itinerary.tsx` line 862
- **Condition:** Only reachable after a trip is generated and the user views the itinerary or sees the TripMapCard on the plan tab. Not discoverable for new users.

### /destination/[name]
- **Status: REACHABLE (from hidden tab only)**
- **Linked from:**
  - `index.tsx` lines 307, 337, 410, 568 — ALL from the hidden `index` tab
- **Problem:** The `index` tab has `href: null` in `_layout.tsx`, so it never appears in the nav pill. There is NO navigation from any of the 5 visible tabs to `/destination/[name]`. This screen is effectively unreachable for normal users.

### /craft-session
- **Status: REACHABLE**
- **Linked from:**
  - `plan.tsx` line 516 — conversation mode generate
  - `plan.tsx` line 730 — "Continue a trip you were planning" cards
  - `plan.tsx` line 826 — `DreamingSection` "Plan Together" button
- **Condition:** Accessible from the DREAMING state hero section or when the user has saved craft sessions. This is well-connected.

### /before-you-land
- **Status: REACHABLE**
- **Linked from:**
  - `plan.tsx` line 244 — `NextTripHero` component
  - `prep.tsx` line 2605 — button in prep tab
  - `itinerary.tsx` line 1801
  - ExploreHub in profile.tsx
- **Condition:** Requires a destination to be set (via trip or prep tab). Well-connected.

### /body-intel
- **Status: REACHABLE**
- **Linked from:**
  - `prep.tsx` lines 870, 2579
  - `plan.tsx` line 249 — `NextTripHero` "Health Intel" action
  - `itinerary.tsx` line 1765
  - ExploreHub in profile.tsx
- **Note:** `plan.tsx` routes to `/(tabs)/body-intel` (hidden tab), while prep.tsx and itinerary.tsx route to `/body-intel` (modal). Both exist, but the tab version and modal version are different routes to the same screen file.

### /local-lens
- **Status: UNREACHABLE (screen exists, no real navigation)**
- **File exists:** `app/local-lens.tsx`
- **Zero `router.push('/local-lens')` calls anywhere in the codebase.**
- **ExploreHub entry:** The `local-lens` feature in ExploreHub routes to `/(tabs)/generate`, NOT to `/local-lens`. The actual screen file is never navigated to.
- **Fix needed:** Change ExploreHub route from `/(tabs)/generate` to `/local-lens`, OR add a button in pulse.tsx or prep.tsx that links to `/local-lens`.

### /honest-reviews
- **Status: UNREACHABLE (screen exists, no real navigation)**
- **File exists:** `app/honest-reviews.tsx`
- **Zero `router.push('/honest-reviews')` calls anywhere in the codebase.**
- **ExploreHub entry:** The `honest-reviews` feature in ExploreHub routes to `/(tabs)/generate`, NOT to `/honest-reviews`. The actual screen file is never navigated to.
- **Fix needed:** Change ExploreHub route from `/(tabs)/generate` to `/honest-reviews`, OR add navigation from pulse.tsx or itinerary.tsx.

### /airport-guide
- **Status: REACHABLE (via ExploreHub only)**
- **Linked from:**
  - ExploreHub in profile.tsx — route `/airport-guide`
- **Problem:** Only reachable through the ExploreHub grid buried in the profile screen. There is no contextual link from the flights tab, prep tab, or itinerary screen where a user would naturally look for airport information.
- **Fix needed:** Add a link in `flights.tsx` (e.g., "Airport Survival Guide" section) or in `prep.tsx` near the transit/travel section.

### /itinerary
- **Status: REACHABLE**
- **Linked from:**
  - `plan.tsx` lines 599, 670, 696 — after trip generation and trip card taps
  - `generate.tsx` lines 139, 222
  - `saved.tsx` line 289
  - `onboard.tsx` line 409
  - `roam-for-dates.tsx` line 120
  - `globe.tsx` line 215
  - `_layout.tsx` line 290 (deep link handler)
- **Well-connected.** This is a core screen.

---

## 3. API Data Visibility per Tab

### Plan tab (`plan.tsx`)
- **APIs used:** OpenWeather (`getCurrentWeather`), Eventbrite (`searchEvents`), Sonar (`useSonarQuery`)
- **Rendered in JSX:** Yes, in the "Destination Intel" section (lines 927-960)
- **Depends on destination:** Yes, `planDestination` is derived from `sortedTrips[0]?.destination`
- **New user sees:** NO API data. The destination intel section only renders when `planDestination && !showGenerator && (sonarDest.data || destWeather || destEvents)`. A new user has no trips, so `planDestination` is null.

### Pulse tab (`pulse.tsx`)
- **APIs used:** Sonar (pulse + local), Eventbrite, TripAdvisor, Foursquare, Google Places (via `searchActivities`)
- **Rendered in JSX:** Yes, all sections render (Sonar cards, events, trending venues, top rated, things to do)
- **Depends on destination:** Yes, `selectedDest` from `PULSE_DESTINATIONS` array
- **New user sees:** YES. Pulse defaults to `PULSE_DESTINATIONS[0]` (likely Tokyo) even with no trips. All API sections will load and render for the default destination. This is the best-performing tab for new users.

### Flights tab (`flights.tsx`)
- **APIs used:** Amadeus (`searchFlights`), Rome2Rio (`getRoutes`), Sonar
- **Rendered in JSX:** Yes, Amadeus results + Sonar intel sections
- **Depends on destination:** The hero search requires user input. Amadeus results appear only after a search is performed.
- **New user sees:** Static content (popular routes, Go Now feed, search UI). No live API data until they perform a search.

### People tab (`people.tsx`)
- **APIs used:** None external (social profile, trip presence are local)
- **Rendered in JSX:** Three states — no profile, profile + no trip, full experience
- **New user sees:** The "No Profile" onboarding state with travel persona creation flow.

### Prep tab (`prep.tsx`)
- **APIs used:** Sonar (urgent, prep, safety), OpenWeather, Rome2Rio, Mapbox geocode, Sherpa (visa/entry)
- **Rendered in JSX:** Yes, all sections render when a destination is selected
- **Depends on destination:** Yes, `selectedDest` defaults to `activeTrip?.destination ?? DESTINATIONS[0]?.label ?? 'Tokyo'`
- **New user sees:** YES. Falls back to the first destination in the DESTINATIONS array (Tokyo). Prep data will load for Tokyo even with no trips.

### Food tab (`food.tsx`) — HIDDEN
- **APIs used:** Foursquare, Google Places, Mapbox geocode, TripAdvisor, Sonar
- **Rendered in JSX:** Yes
- **Depends on destination:** Yes, from active trip
- **New user sees:** N/A — hidden tab. Only reachable through ExploreHub in profile. When opened without a trip, behavior depends on whether a fallback destination is set.

### Stays tab (`stays.tsx`) — HIDDEN
- **APIs used:** Google Places, TripAdvisor, Mapbox geocode, Sonar
- **Rendered in JSX:** Yes
- **Depends on destination:** Yes, from active trip or search input
- **New user sees:** N/A — hidden tab. Only reachable through ExploreHub in profile. Static popular stays content is always visible.

---

## 4. Plan Tab — Adaptive States (DREAMING analysis)

**File:** `plan.tsx` uses `useTravelStage()` from `lib/travel-state.ts`

### State machine:
| Stage | Condition | What renders |
|-------|-----------|-------------|
| DREAMING | No trips, OR all trips ended >30 days ago | `DreamingSection` — typewriter city names + "Quick Trip" + "Plan Together" buttons |
| PLANNING | Active trip with departure >7 days away | `PlanningSection` — countdown, daily brief, checklist |
| IMMINENT | Active trip with departure 1-7 days away | `PlanningSection` with pulse animation |
| TRAVELING | Active trip currently in progress | `TravelingSection` — "I Need Help" + "Capture Moment" buttons |
| RETURNED | Active trip ended within 30 days | `ReturnedSection` — "Trip Wrapped" + "Journal" buttons |

### Is DREAMING rendering?
**YES.** Line 822: `{stage === 'DREAMING' && !showGenerator && (` renders `DreamingSection`. The guard works correctly:
- `showGenerator` is false by default
- `stage === 'DREAMING'` is true when a user has no trips

**However**, there is a path issue: When `!hasTrips` (line 700), the code enters the generator flow BEFORE reaching the DREAMING section. The DREAMING section only renders in the "Trip management mode" block (line 806+), which requires `hasTrips` to be true.

**This means:** A brand-new user with zero trips will NEVER see the DREAMING hero. They go straight to `GenerateModeSelect`. The DREAMING section only shows for users who have trips but none are active (all ended >30 days ago).

---

## 5. Fully Orphaned Screens (No Navigation Path)

These screens exist as files in `app/` but have ZERO inbound `router.push` or navigation references from any other file:

| Screen | File | What it does | Suggested fix |
|--------|------|-------------|---------------|
| `/admin` | `app/admin.tsx` | Admin panel | Intentionally hidden (OK) |
| `/alter-ego` | `app/alter-ego.tsx` | Travel alter ego quiz | ExploreHub lists it as live but has no route match. Add route `/alter-ego` to ExploreHub |
| `/arrival-mode` | `app/arrival-mode.tsx` | First-day city survival | ExploreHub routes to `/(tabs)/prep` instead. Change to `/arrival-mode` |
| `/honest-reviews` | `app/honest-reviews.tsx` | Real traveler feedback | ExploreHub routes to `/(tabs)/generate` instead. Change to `/honest-reviews` |
| `/investor` | `app/investor.tsx` | Investor pitch deck | Intentionally hidden (OK) |
| `/invite` | `app/invite.tsx` | Invite friends | No links. Add to people.tsx or profile.tsx |
| `/local-lens` | `app/local-lens.tsx` | See destinations like a local | ExploreHub routes to `/(tabs)/generate` instead. Change to `/local-lens` |
| `/made-for-you` | `app/made-for-you.tsx` | Personalized recommendations | No links. Add to pulse.tsx or plan.tsx |
| `/prep-detail` | `app/prep-detail.tsx` | Detailed prep info | No links. Add to prep.tsx as a "See more" from prep sections |
| `/support` | `app/support.tsx` | Support/help screen | No links. Add to profile.tsx settings section |
| `/trip-dupe` | `app/trip-dupe.tsx` | Duplicate trip | Referenced in `_layout.tsx` and ExploreHub via `dupe-finder` feature but the route is `/dupe-finder`, not `/trip-dupe`. Likely dead code. |

---

## 6. ExploreHub Routing Mismatches

ExploreHub (`components/features/ExploreHub.tsx`) in profile.tsx has several features that route to the WRONG destination:

| Feature ID | Expected route | Actual ExploreHub route | Impact |
|-----------|---------------|------------------------|--------|
| `local-lens` | `/local-lens` | `/(tabs)/generate` | Actual screen never reached |
| `honest-reviews` | `/honest-reviews` | `/(tabs)/generate` | Actual screen never reached |
| `arrival-mode` | `/arrival-mode` | `/(tabs)/prep` | Actual screen never reached |
| `visited-map` | `/visited-map` | `/globe` | Actual screen never reached |
| `alter-ego` | `/alter-ego` | Listed as live but no route verification | May work if route is correct in the feature array |

**Note:** `alter-ego` IS listed in the FEATURES array with route `/alter-ego`, so it IS reachable through ExploreHub. The orphan check earlier was a false positive caused by grep pattern matching. Confirmed: ExploreHub line does route to `/alter-ego` correctly. However, it is ONLY reachable through ExploreHub, not from any contextual location.

---

## 7. Summary of Required Fixes

### Critical (features built but unreachable):
1. **`/local-lens`** — Change ExploreHub route from `/(tabs)/generate` to `/local-lens`
2. **`/honest-reviews`** — Change ExploreHub route from `/(tabs)/generate` to `/honest-reviews`
3. **`/arrival-mode`** — Change ExploreHub route from `/(tabs)/prep` to `/arrival-mode`
4. **`/destination/[name]`** — Add navigation from a visible tab. Best candidate: add destination cards to pulse.tsx or a "Destination Dashboard" button on itinerary.tsx
5. **`/support`** — Add a "Help & Support" link in profile.tsx

### High (reachable but poorly discoverable):
6. **`/airport-guide`** — Add contextual link in flights.tsx or prep.tsx
7. **`/i-am-here-now`** — Only visible during TRAVELING state. Consider adding to prep.tsx as "Emergency Help" button
8. **`/trip-journal`** — Only visible during TRAVELING/RETURNED. Consider adding to itinerary screen or prep tab
9. **Food tab** — Only reachable through ExploreHub. Add as a quick action from plan.tsx that actually navigates to `/(tabs)/food` instead of opening the generator
10. **Stays tab** — Only reachable through ExploreHub. Same fix as food.

### Medium (design decisions):
11. **Plan tab quick actions** — "Find Stays" and "Find Food" buttons open the trip generator instead of navigating to the food/stays tabs. This is misleading.
12. **DREAMING state hero** — Never shows for zero-trip users because the generator takes over first. The wanderlust hero only appears for lapsed users.
13. **`/visited-map`** — ExploreHub routes to `/globe` instead. Either delete `visited-map.tsx` or fix the route.
14. **`/prep-detail`** — Built but no links anywhere. Wire it up from prep.tsx detail views.
15. **`/made-for-you`** — Built but no links anywhere. Wire it up from pulse.tsx or plan.tsx.

---

## 8. New User Experience Path

A brand-new user with zero trips follows this path:

1. Opens app -> lands on Plan tab
2. Sees `GenerateModeSelect` (NOT the DREAMING hero)
3. Can tap "Quick Trip" or "Conversation" to generate a trip
4. After generation -> `/itinerary` screen
5. Can switch to Pulse (shows data for default destination)
6. Can switch to Flights (sees search UI + Go Now deals)
7. Can switch to People (sees profile creation onboarding)
8. Can switch to Prep (shows data for default destination)

**What they CANNOT reach without a trip:**
- `/i-am-here-now` (requires TRAVELING state)
- `/trip-wrapped` (requires RETURNED state, or visit profile/saved)
- `/trip-journal` (requires TRAVELING/RETURNED state, or visit itinerary/saved)
- `/explore-map` (requires trip with itinerary)
- `/destination/[name]` (only linked from hidden index tab)
- `/before-you-land` (requires trip destination in plan.tsx NextTripHero)
- Plan tab destination intel (requires existing trip)
- Food and Stays tabs (only via ExploreHub in profile)
