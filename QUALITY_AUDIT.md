# ROAM Quality Audit — Every User-Reachable Screen

**Date**: 2026-03-18
**Auditor**: Claude (Opus 4.6)
**Verdict**: ROAM has strong bones but 30+ rough edges that telegraph "side project" to anyone who looks closely. The biggest systemic issues are (1) hardcoded English strings that bypass i18n, (2) inconsistent empty/loading states, and (3) several developer-facing labels that leaked into production UI.

---

## 1. Plan Tab (`app/(tabs)/plan.tsx` + `components/plan/*`)

### A. Empty States
- **DREAMING (no trips)**: Good. `DreamingHero` renders a typewriter animation with rotating city names and two clear CTAs. No blank screen.
- **No user signed in**: Craft sessions fetch silently fails and sets empty array. No broken UI, but no nudge to sign in either.
- **API failure during generation**: Error banner with human-readable copy ("Couldn't reach our servers -- probably a WiFi thing"). Dismiss button present. GOOD.
- **Rate limit**: Dedicated `RateLimitModal` with upgrade CTA. GOOD.

### B. Loading States
- Full-screen `TripGeneratingLoader` with compass animation during generation. GOOD.
- `streamingProgress` shows status text overlay. GOOD.
- **ISSUE**: No skeleton/loading state for collaborator counts -- they pop in after the trip cards render.

### C. Dead Taps
- None found. All visible elements use `Pressable` with `accessibilityRole="button"`.

### D. Developer Placeholders
- **P1**: Line 305 -- hardcoded English `"Flights"` and `"Deals and search"` section headers bypass `t()`.
- **P1**: Line 307 -- hardcoded `"Search all flights"` button text bypasses `t()`.
- **P2**: Line 262 -- `"Continue a trip you were planning"` label is hardcoded English.

### E. Copy Quality
- GOOD overall. Hooks on destinations are sharp ("More to do per block than most cities have total").
- Error messages are conversational and human ("Couldn't reach our servers -- probably a WiFi thing").
- No "vibrant", "bustling", "hidden gem" cliches found on this screen.

### F. Visual Consistency
- All styles use `COLORS`, `FONTS`, `SPACING`, `RADIUS` from constants. No hardcoded colors.
- Padding values (20) are hardcoded in `scrollContent` instead of using `SPACING.lg` (24) or `MAGAZINE.padding` (20). Minor inconsistency.

### G. Connection to Other Features
- Links to: Flights tab, Stays tab, Food tab, Craft session, Itinerary, Dream board, Budget tracker, Trip journal, Split expenses, People tab, Paywall. EXCELLENT connectivity.

---

## 2. Pulse Tab (`app/(tabs)/pulse.tsx` + `components/pulse/*`)

### A. Empty States
- **No trips**: Renders a CTA card ("Plan a trip to unlock live features") with navigation to Plan tab. GOOD.
- **No Sonar data**: Shows skeleton cards during loading, then either data or an empty state with Clock icon and text. GOOD.
- **No time recs for destination**: Falls through to empty state only if Sonar also returns nothing. Acceptable.

### B. Loading States
- Sonar loading shows skeleton cards in `sonarSkeletonStack`. GOOD.
- **ISSUE**: Eventbrite events (`liveEvents`), TripAdvisor (`taAttractions`), GetYourGuide (`gygActivities`), and Foursquare (`fsqPlaces`) all use `null` initial state and simply don't render sections while loading. No skeleton placeholders -- content pops in jarringly as each API resolves.

### C. Dead Taps
- None found. All cards are wrapped in `Pressable`.

### D. Developer Placeholders
- **P2**: Line 265 -- inline style with hardcoded `fontFamily: 'Inter_500Medium'` instead of `FONTS.bodyMedium`. Will break if font loading fails.
- **P2**: Line 352 -- inline style with hardcoded `fontFamily: 'DMMono_400Regular'` instead of `FONTS.mono`.

### E. Copy Quality
- Section headers are strong ("What they won't tell you", "Worth going now").
- **ISSUE**: Pulse `emptyState` text uses template literal inside `t()` defaultValue with `${selectedDest.label}` -- this works but means translation files can't customize per-destination empty states.

### F. Visual Consistency
- Multiple inline style objects (lines 212, 229, 236, 246, 283, 392, 495) instead of extracting to StyleSheet. Not a bug but signals rushed implementation.
- Hardcoded fontFamily strings in two places (noted above).

### G. Connection to Other Features
- Links to: Destination page, Compare page, I Am Here Now, Live Narrator, Nearby Travelers, Local Eats Radar, Plan tab. GOOD connectivity.

---

## 3. Prep Tab (`app/(tabs)/prep.tsx` + `components/prep/*`)

### A. Empty States
- **No data for destination**: Shows a `noDataWrap` with "Data not available for this destination" + suggestion to try a nearby major city. GOOD.
- **No safety data for overview/health tabs**: Shows "No overview data available for this destination." or similar. GOOD.
- **Offline mode**: Shows coral banner "Everything you need, no signal required". GOOD.
- **No Sonar data**: Shows `SonarFallback` with "Live conditions unavailable". GOOD.

### B. Loading States
- `WeatherLoadingSkeleton` component for weather data. GOOD.
- Sonar cards show nothing during loading (no skeleton). Acceptable since fallback appears after.
- **ISSUE**: Entry requirements, visa, and geocode fetches have no loading indicators. Content simply appears.

### C. Dead Taps
- None found.

### D. Developer Placeholders
- **P1**: Line 172 -- template literal `No intel for ${selectedDest} yet. Try a nearby major city.` is hardcoded English, not wrapped in `t()`.
- **P1**: Line 205 -- `SonarFallback` label `"Live conditions unavailable"` is hardcoded English.
- **P1**: Line 223 -- `"No overview data available for this destination."` hardcoded English.
- **P1**: Line 229 -- Same template literal issue as line 172.

### E. Copy Quality
- Urgent banner is well-done (Flame icon + first sentence of Sonar intel + LiveBadge).
- Safety score labels are good ("Safe for travelers", "Use caution", "High risk").
- Section pill labels are clean and functional.

### F. Visual Consistency
- Uses `COLORS`, `FONTS`, `SPACING`, `RADIUS` consistently.
- Multiple `{ paddingHorizontal: 20 }` inline styles instead of extracting to a shared style.

### G. Connection to Other Features
- Links to: Body Intel, Offline Pack, all 11 prep sub-sections. GOOD.
- Destination picker at bottom lets user switch between 12 popular destinations. GOOD.

---

## 4. Flights Tab (`app/(tabs)/flights.tsx` + `components/flights/*`)

### A. Empty States
- **No search entered**: Shows hero, airport guide CTA, GoNowFeed deals, search form, popular routes, and inspiration. GOOD -- not blank.
- **Amadeus returns no flights**: Section simply doesn't render. No "no results" message. ACCEPTABLE since Skyscanner CTA is always visible.
- **Sonar unavailable**: Shows `SonarFallback` with "Live flight intel unavailable". GOOD.
- **Alternative routes empty**: Shows `SonarFallback` with "Couldn't load alternative routes". GOOD.

### B. Loading States
- Amadeus: animated skeleton pulse cards (3 cards with opacity animation). GOOD.
- Safety timeout (8s) ensures skeleton never shows forever. GOOD.
- **ISSUE**: Rome2Rio alternative routes have no loading indicator.

### C. Dead Taps
- None found.

### D. Developer Placeholders
- **P1**: Line 584 -- `"ALTERNATIVE ROUTES"` and `"Other ways to get there"` are hardcoded English, not using `t()`.

### E. Copy Quality
- Hero copy: "Where are you flying?" -- clean.
- Sub copy: "We search Skyscanner so you don't have to open 14 tabs." -- good, personality without cringe.
- "Timing is everything" / "Go when it actually matters" -- strong.
- Affiliate disclaimer is honest and transparent. GOOD.

### F. Visual Consistency
- Styles extracted to `components/flights/flights-styles.ts`. GOOD.
- All tokens from constants.

### G. Connection to Other Features
- Links to: Airport Guide, Layover Optimizer, Skyscanner (external), Rome2Rio (external). GOOD.

---

## 5. Food Tab (`app/(tabs)/food.tsx`)

### A. Empty States
- **No destination**: Renders hero ("Eat like a local"), popular food cities scroll, and CTA to plan a trip. GOOD -- not blank.
- **No restaurants for category filter**: Shows UtensilsCrossed icon + "Try another filter". GOOD.
- **Foursquare loading**: Shows skeleton cards. GOOD.
- **Google Places failed**: Shows `SonarFallback` with "Couldn't load nearby restaurants". GOOD.
- **TripAdvisor failed**: Shows `SonarFallback` with "Couldn't load top restaurants". GOOD.
- **Sonar unavailable**: Shows `SonarFallback` with "Live food intel unavailable". GOOD.

### B. Loading States
- 500ms artificial loading delay for perceived quality with skeleton cards. GOOD.
- Foursquare skeleton cards during loading. GOOD.
- **ISSUE**: Line 434 -- `"Loading..."` text shown during Foursquare fetch is a developer-facing label that should be replaced with a skeleton or removed.

### C. Dead Taps
- None found.

### D. Developer Placeholders
- **P1**: Line 434 -- `"Loading..."` exposed to users.
- **P1**: Lines 301, 357-358 -- hardcoded English hero/sub text ("Eat like a local", "Pick a destination and we will find the spots only locals know about", "AI-curated picks in {destination}") not using `t()`.
- **P2**: Lines 496-497, 514, 522-523 -- hardcoded English section labels ("GOOGLE PLACES", "Highly rated nearby", "TRIPADVISOR", "Top reviewed restaurants").

### E. Copy Quality
- "Eat like a local" -- clean but generic. Every food app says this.
- "AI-curated picks" -- signals AI which may not resonate with all users.
- "AI Pick" badge on hero card is acceptable for the premium/smart positioning.

### F. Visual Consistency
- Styles extracted to `components/food/food-styles.ts`. GOOD.
- All tokens from constants.

### G. Connection to Other Features
- Links to: Local Eats Radar, Google Maps (external), TripAdvisor (external). GOOD.

---

## 6. Stays Tab (`app/(tabs)/stays.tsx`)

### A. Empty States
- **No destination entered**: Shows "Plan a trip first to get personalized stays" CTA. GOOD.
- **Google Places empty**: Shows `SonarFallback`. GOOD.
- **TripAdvisor empty**: Shows `SonarFallback`. GOOD.
- **Sonar unavailable**: Shows `SonarFallback`. GOOD.

### B. Loading States
- Fade-in animation on mount. GOOD.
- **ISSUE**: No loading skeletons for Google Places or TripAdvisor hotel searches. Content pops in.
- **ISSUE**: No loading state for Sonar query.

### C. Dead Taps
- **P2**: Guest counter buttons lack `accessibilityLabel` and `accessibilityRole`.

### D. Developer Placeholders
- **P1**: Line 332 -- `"Where are you staying?"` placeholder hardcoded English.
- **P1**: Lines 338-339 -- `"CHECK-IN"`, `"CHECK-OUT"` labels hardcoded English.
- **P1**: Line 352 -- `"Guests"` label hardcoded English.
- **P1**: Line 388 -- `"Search on Booking.com"` button text hardcoded English.
- **P1**: Line 399 -- `"Plan a trip first to get personalized stays"` hardcoded English.
- **P1**: Lines 405, 407, 449, 501, 503, 524 -- many hardcoded English strings.

### E. Copy Quality
- "Find your stay." -- clean, minimal.
- "We search Booking.com so you get the best price, every time." -- conversational.
- Inspiration cards have good vibes ("Riads with courtyards and rooftop terraces").

### F. Visual Consistency
- **ISSUE**: Styles are defined inline at the bottom of the file rather than extracted to a separate styles file like other tabs. 797 lines total -- at the limit.
- All tokens from constants.

### G. Connection to Other Features
- Links to: Booking.com (external), Google Maps (external), TripAdvisor (external), Generate tab. GOOD.

---

## 7. People Tab (`app/(tabs)/people.tsx`)

### A. Empty States
- **Loading profile**: Shows "LOADING" text. GOOD enough but could use a skeleton.
- **No profile**: Full 6-step profile creation wizard inline. GOOD -- no blank screen.
- **Profile but no trip**: Shows destination chips, "Roaming this month", and Add Trip CTA. GOOD.
- **Profile + trip but no matches**: `EmptyMatchState` component renders. GOOD.

### B. Loading States
- **P2**: Line 327 -- Loading state is just plain text "LOADING" with no animation or skeleton. Feels unfinished.

### C. Dead Taps
- None found.

### D. Developer Placeholders
- **P2**: Line 327 -- "LOADING" is developer-level text. Should be a skeleton or at minimum a spinner.
- **P2**: Multiple `console.log` statements left in production code (lines 177, 178, 183, 201, 204, 221, 231, 253, 262, 283).

### E. Copy Quality
- Profile creation questions are conversational and good ("What do you go by?", "How do you travel?").
- "You're on the map." for post-profile state -- nice.
- "Who's Going" header -- clean.

### F. Visual Consistency
- Styles extracted to `components/people/people-styles.ts`. GOOD.
- Some inline styles on lines 617-628 for the edit profile button.

### G. Connection to Other Features
- Links to: Social profile edit, Nearby travelers, Travel meetups, Share profile. GOOD.
- **ISSUE**: `handleDestinationChipPress` (line 287-288) is a no-op. Dead tap on destination chips in State 2.

---

## 8. Craft Session (`app/craft-session.tsx`)

### A. Empty States
- **No session to resume**: Starts fresh with question flow. GOOD.
- **Welcome back**: Shows green-accented card with personalized message if returning user. GOOD.
- **Parse error on itinerary**: Shows error in `errorBanner`. GOOD.
- **Rate limit**: Redirects to paywall. GOOD.

### B. Loading States
- Building state: `ActivityIndicator` + `CRAFT_BUILDING_MESSAGE`. GOOD.
- Follow-up loading: Small `ActivityIndicator` aligned left. GOOD.
- Streaming text renders progressively. GOOD.
- **ISSUE**: No skeleton for session resume (loading from Supabase). Screen shows empty chat while data loads.

### C. Dead Taps
- None found.

### D. Developer Placeholders
- None found. Error messages are user-friendly.

### E. Copy Quality
- "Plan together" header -- good.
- "Save trip" button -- clear.
- Input placeholder "Ask anything about your trip -- changes, more details, alternatives..." -- helpful.

### F. Visual Consistency
- All styles from constants. GOOD.
- `sendBtn` uses `COLORS.gold` -- this is gold for premium, appropriate for the craft experience.

### G. Connection to Other Features
- Links to: Itinerary (after save), Paywall (if over limit). GOOD.
- **ISSUE**: No way to navigate to Prep or Flights from within craft session.

---

## 9. Itinerary (`app/itinerary.tsx`)

### A. Empty States
- **Trip not found**: Shows error message "Couldn't find that trip. It may have been removed -- head back and try again." GOOD.
- **Parse failure**: Attempts offline fallback first, then shows error. GOOD.
- **No weather data**: `setWeather(null)` -- weather section simply won't render. Acceptable.

### B. Loading States
- `SkeletonCard` from premium LoadingStates for various sections. GOOD.
- Venue enrichment loads async without skeleton -- content pops in. ACCEPTABLE given the screen already has itinerary content.

### C. Dead Taps
- Cannot fully audit due to file size (31,627 tokens). Partial read suggests all interactive elements use `Pressable`.

### D. Developer Placeholders
- Error messages are human-readable ("Something went sideways loading your trip. Give it another shot."). GOOD.
- `MockDataBadge` component imported -- this should NOT show in production. NEEDS VERIFICATION.

### E. Copy Quality
- Cannot fully audit. Partial read shows strong patterns.

### F. Visual Consistency
- Styles extracted to `components/itinerary/itinerary-styles.ts`. GOOD.
- Uses `useDestinationTheme` for per-destination accent colors. GOOD.

### G. Connection to Other Features
- EXCELLENT connectivity: Weather, flights, packing, sharing, calendar export, offline save, budget chart, safety, visa, events, booking, emergency SOS, language survival, currency toggle, collaborators, map view, voice guide, narration, trip soundtrack, carbon footprint, insurance, return trip, concierge. This is the most connected screen in the app.

---

## 10. Destination Page (`app/destination/[name].tsx` + `_components.tsx`)

### A. Empty States
- **No Sonar data**: "No intel available." italic text. GOOD.
- **No routes**: "No route data available." GOOD.
- **No cost data**: "No data available for this destination." GOOD.
- **No safety data**: "No safety data available." GOOD.
- **No visa data**: "No visa data available." GOOD.
- **No attractions**: "No attraction data available." GOOD.
- **No restaurants**: "No restaurant data available." GOOD.
- **Not signed in**: "Sign in to see live updates." for Sonar section. GOOD.

### B. Loading States
- `Skeleton` component used for routes, safety, visa, attractions, restaurants. GOOD.
- **ISSUE**: `_components.tsx` line 99 -- `"Loading..."` shown in Right Now section while data loads. Should be a skeleton.

### C. Dead Taps
- None found. Back, heart, share buttons all wired.

### D. Developer Placeholders
- **P2**: `_components.tsx` line 99 -- `"Loading..."` text exposed to users.

### E. Copy Quality
- Hero is clean -- big destination name, country code, right-now weather/time.
- Section headers are functional and clear.
- **ISSUE**: `DollarSign` icon used for "ROAMers planning" count -- confusing. Should be `Users` or `MapPin`.

### F. Visual Consistency
- All tokens from constants. Custom `CARD_BASE` object reused consistently. GOOD.

### G. Connection to Other Features
- Links to: Quick Trip, Plan Together, Start Saving (money goal), Google Maps (attractions/restaurants), Rome2Rio. GOOD.

---

## 11. I Am Here Now (`app/i-am-here-now.tsx`)

### A. Empty States
- **No destination/trip**: Context engine falls back to "your location". Greeting still renders ("You are here."). GOOD.
- **No weather**: Shows "Weather data unavailable" fallback. GOOD.
- **Sonar loading**: Shows "Reading the city..." GOOD.
- **Sonar error**: Shows "Live data unavailable". GOOD.
- **No emergency numbers**: Falls back to 112/911 universal numbers. GOOD.

### B. Loading States
- Card entrance spring animation. GOOD.
- FAB scale animation on press. GOOD.
- No jarring content pop-in.

### C. Dead Taps
- None found.

### D. Developer Placeholders
- None found. All strings wrapped in `t()` with sensible defaultValues.

### E. Copy Quality
- Contextual greetings based on time of day and weather. EXCELLENT.
- "Show driver my hotel" -- practical, not touristy.
- Emergency modal is no-nonsense with big numbers and call buttons. EXCELLENT.
- Moment capture ("What's happening?") is warm without being saccharine.

### F. Visual Consistency
- All tokens from constants. GOOD.
- Coral for emergency, sage for primary actions, gold for contextual overlays. Correct semantic usage.

### G. Connection to Other Features
- Links to: Live Narrator, Moment capture (Supabase), Emergency calls (tel: links). GOOD.

---

## 12. Onboarding (`app/onboarding.tsx`)

### A. Empty States
- N/A -- always shows 3 slides. GOOD.

### B. Loading States
- N/A -- all content is local. GOOD.

### C. Dead Taps
- None found.

### D. Developer Placeholders
- None found.

### E. Copy Quality
- "Where do you want to go?" -- clean, direct.
- "Your entire trip. 30 seconds." -- strong value prop.
- "Your first trip is free. No credit card. No signup. Just go." -- EXCELLENT conversion copy.
- "Not a template. Built for you." -- good differentiator.
- **MINOR**: Feature list is functional but could be more evocative ("Real restaurants with photos and ratings" vs something with more personality).

### F. Visual Consistency
- All tokens from constants. GOOD.
- Destination chips with photos add visual richness. GOOD.
- Page dots are properly styled.

### G. Connection to Other Features
- "Plan" CTA navigates to craft session with pre-filled destination. GOOD.
- "Skip" goes to Plan tab. GOOD.

---

# Priority-Ordered Fix List

## P0 -- Ship Blockers

| # | Screen | Issue | Effort |
|---|--------|-------|--------|
| 1 | People | `console.log` statements in production code (10+ instances) | 15 min |
| 2 | Itinerary | `MockDataBadge` component imported -- verify it never renders in production | 10 min |

## P1 -- Must Fix Before Launch

| # | Screen | Issue | Effort |
|---|--------|-------|--------|
| 3 | Plan | Hardcoded English: "Flights", "Deals and search", "Search all flights" (lines 305-307) | 10 min |
| 4 | Plan | Hardcoded English: "Continue a trip you were planning" (line 262) | 5 min |
| 5 | Stays | 15+ hardcoded English strings bypassing i18n -- entire screen needs i18n sweep | 30 min |
| 6 | Food | Hardcoded English hero/sub text, section labels ("Eat like a local", "GOOGLE PLACES", etc.) | 20 min |
| 7 | Prep | 4 hardcoded English strings in fallback states (lines 172, 205, 223, 229) | 10 min |
| 8 | Flights | Hardcoded English "ALTERNATIVE ROUTES" / "Other ways to get there" (line 584) | 5 min |
| 9 | Food | `"Loading..."` text shown to users (line 434) -- replace with skeleton | 10 min |
| 10 | Destination | `"Loading..."` text in Right Now section -- replace with skeleton | 10 min |

## P2 -- Should Fix

| # | Screen | Issue | Effort |
|---|--------|-------|--------|
| 11 | Pulse | Hardcoded fontFamily strings (lines 265, 352) instead of FONTS tokens | 5 min |
| 12 | Pulse | No loading skeletons for Eventbrite, TripAdvisor, GetYourGuide, Foursquare sections | 30 min |
| 13 | Stays | No loading skeletons for Google Places / TripAdvisor hotel searches | 20 min |
| 14 | People | Loading state is plain "LOADING" text -- needs skeleton or spinner | 10 min |
| 15 | People | `handleDestinationChipPress` is a no-op -- dead tap on destination chips | 15 min |
| 16 | Craft | No skeleton for session resume from Supabase | 15 min |
| 17 | Plan | No loading state for collaborator counts -- pop in after render | 10 min |
| 18 | Stays | Styles not extracted to separate file (797-line file) | 20 min |
| 19 | Stays | Guest counter buttons lack accessibility labels | 5 min |
| 20 | Destination | DollarSign icon used for ROAMers count -- should be Users icon | 5 min |
| 21 | Pulse | 7+ inline style objects should be extracted to StyleSheet | 15 min |
| 22 | Prep | Multiple `{ paddingHorizontal: 20 }` inline styles | 10 min |

## P3 -- Nice to Have

| # | Screen | Issue | Effort |
|---|--------|-------|--------|
| 23 | Food | "Eat like a local" hero is generic -- consider more distinctive copy | 10 min |
| 24 | Onboarding | Feature list could have more personality | 10 min |
| 25 | Plan | No sign-in nudge for guests viewing trip management | 15 min |
| 26 | Craft | No navigation to Prep or Flights from within session | 20 min |
| 27 | Flights | Rome2Rio routes have no loading indicator | 10 min |

---

# Systemic Issues

### 1. i18n Inconsistency (HIGH)
Stays, Food, Plan, Prep, and Flights all have hardcoded English strings that bypass the translation system. This is the single biggest quality signal issue -- it means 4 of the 5 main tabs will partially break for non-English users.

**Recommendation**: Run a full grep for hardcoded string literals in all tab files and modal screens. Every user-facing string must use `t()`.

### 2. Loading State Gaps (MEDIUM)
Pulse, Stays, and Destination pages show API-driven sections that pop in without skeletons. The app has `SkeletonCard` available -- it just isn't used everywhere.

**Recommendation**: Every section that depends on an async API call should show a skeleton placeholder. The pattern already exists in Flights (Amadeus) and Food (Foursquare) -- replicate it.

### 3. Console Logs in Production (HIGH)
People tab has 10+ `console.log` statements. These are invisible to users but visible to anyone with a debugger attached (including App Store reviewers).

**Recommendation**: Replace all `console.log` with the analytics system or remove them entirely.

### 4. Inline Styles (LOW)
Multiple screens use inline style objects instead of `StyleSheet.create`. This is a performance concern on repeated renders and signals inconsistency.

**Recommendation**: Extract inline styles to StyleSheet objects, especially on Pulse and Prep tabs.

---

# Overall Verdict

**What works**: The core trip generation flow (Plan -> Craft -> Itinerary) is solid. Empty states are handled well on most screens. Error messages are human and conversational. The design system (colors, fonts, spacing) is consistently applied. Feature connectivity between screens is excellent -- this doesn't feel like isolated pages.

**What doesn't**: The i18n gaps, loading state inconsistencies, and developer artifacts (console.logs, "Loading..." text, MockDataBadge) collectively signal a codebase that was built fast and hasn't been fully polished for production. Any user who speaks Spanish, French, or Japanese will immediately see untranslated strings on multiple tabs.

**Ship decision**: Fix P0 and P1 items (estimated 2-3 hours total). That gets ROAM from "impressive side project" to "this feels like a real product." P2 items can ship as fast-follows in the first week.
