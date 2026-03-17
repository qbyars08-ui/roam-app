# ROAM Reality Check — March 17, 2026

Brutally honest assessment of what works, what's broken, and what's fake.

---

## 1. WORKING END-TO-END

These features have real code wired from UI to API to display.

### Trip Generation (Quick Mode + CRAFT Mode)
- **Plan tab**: User picks destination/budget/vibes, calls `generateItineraryStreaming()` which hits the `claude-proxy` Supabase edge function, streams back JSON, parses it with `parseItinerary()`, saves to Zustand store. Actually works.
- **CRAFT mode** (`app/craft-session.tsx`): Multi-step conversation, builds context block, calls `generateCraftItineraryStreaming()`, parses result, saves to Supabase `craft_sessions` table. Session resume from `sessionId` param works. Follow-up conversation calls `callClaudeWithMessages()` and displays responses. Profile learning persists via `updateProfileFromCraft()`. This is legit end-to-end.
- **Trip limit enforcement**: Free tier (1/month) checked on both client and edge function. Paywall redirect works.

### Itinerary Display (`app/itinerary.tsx`)
- Parses saved JSON, renders day-by-day with morning/afternoon/evening slots.
- **Google Maps links**: Tapping a venue opens Google Maps with place ID or search query. Both `handleGetDirections` (uses place_id) and `openMapsForPlace` (uses search query) are wired to `Linking.openURL`. Works.
- **Activity editing**: Modal lets you edit activities, saves back to itinerary JSON and persists offline. Works.
- **Calendar export, share, share-as-card**: All wired and calling real functions.
- **Venue enrichment**: Calls `enrichVenuesViaPlacesProxy()` to get Google Places data for venues. Real API.
- **Weather on itinerary**: Calls `getWeatherForecast()` and displays via `WeatherCard`/`WeatherDayStrip`.

### Flights Tab (`app/(tabs)/flights.tsx`)
- **Skyscanner affiliate links**: `getSkyscannerFlightUrl()` builds a real Skyscanner deep link with origin, destination, dates. `Linking.openURL()` opens it. Works for search, popular routes, and inspiration cards.
- **Sonar flight intelligence**: `useSonarQuery(destination, 'flights')` fetches live data via `sonar-proxy` edge function. Displays when available.

### Sonar Integration (`lib/sonar.ts`)
- Calls `sonar-proxy` Supabase edge function (exists at `supabase/functions/sonar-proxy/index.ts`).
- 6-hour AsyncStorage cache with TTL.
- Auth handled via `ensureValidSession()` (refreshes or creates anonymous session).
- Used in: Pulse tab (pulse + local queries), Flights tab (flights query), I Am Here Now (pulse query), Daily Brief (events query), Prep tab.

### I Am Here Now (`app/i-am-here-now.tsx`)
- **Weather**: Calls `getCurrentWeather(destination)` (OpenWeather API), displays temp/condition/humidity pill. Real data.
- **Context messages**: `getContextualMessage()` generates time-of-day-aware greetings and suggestions, pulling from itinerary day data when available. Pure function, actually uses weather + itinerary + hour. Works.
- **Emergency numbers**: `getEmergencyNumbers()` API call with hardcoded fallback map for ~30 destinations. Shows police/ambulance/fire with tap-to-call via `Linking.openURL('tel:...')`.
- **Hotel driver modal**: `getHotelForDriver()` shows hotel name in local script. Data comes from local lib.
- **Sonar "right now"**: Live Sonar pulse query for destination. Displays answer + citations.
- **Moment capture**: Saves text notes to Supabase `trip_moments` table. Works.

### People Tab (`app/(tabs)/people.tsx`)
- **Profile creation**: `useSocialProfile()` hook with `upsert()` saves to Supabase. Has fallback to AsyncStorage for guest mode. Profile data (display name, avatar letter, bio, travel style, dietary, budget) all wired.
- **Trip presence**: `useTripPresence()` hook posts current trip destination.

### Prep Tab (`app/(tabs)/prep.tsx`)
- **Weather**: Geocodes destination via `geocodeCity()`, then calls `getWeatherForecast()` for 7-day forecast. Displayed via `WeatherDayStrip`. Also calls `getCurrentWeather()` for live temp in editorial header.
- **Emergency data**: `getEmergencyForDestination()` loads offline emergency numbers.
- **Language pack**: `getLanguagePackForDestination()` loads survival phrases with pronunciation via `pronounce()` (ElevenLabs TTS).
- **Safety data**: `getSafetyForDestination()` displays safety score.
- **Visa info, medical guide, exchange rates, air quality, timezone, cost of living**: All wired from their respective lib modules to UI components.
- **Sonar**: Integrated for live intelligence overlay.

### Trip Wrapped (`app/trip-wrapped.tsx`)
- 5-slide horizontal scroll experience. Pulls data from parsed itinerary (neighborhoods, activities, behavioral insights). Fetches moment from Supabase `trip_moments`.
- Share via SMS text and share-as-image via `expo-sharing` + `ViewShot`.
- "Where next?" recommendations are hardcoded per-destination (SIMILAR map).

### Daily Brief (`lib/daily-brief.ts`)
- Deterministic seed-based template selection (stable per destination + day of year).
- Phase-aware filtering (30+ days = prep/excitement, 7-13 = tip/weather, etc.).
- Sonar overlay: When Sonar returns events data within 14 days, replaces headline with live data. Actually wired via `useDailyBrief()` hook.
- Checklist items filtered by `daysUntil` range. Real data, not placeholder.

---

## 2. BUILT BUT BROKEN

### Travel State Detection Uses Wrong Date (`lib/travel-state.ts`)
**This is the biggest bug in the app.** The `getDaysUntilDeparture()` function uses `trip.createdAt` as the departure date. The `Trip` type has an optional `startDate` field (ISO date string for when the user actually departs), but `travel-state.ts` completely ignores it. This means:
- Every trip is immediately in "TRAVELING" state the moment it's created (daysUntil = 0).
- The PLANNING/IMMINENT/TRAVELING/RETURNED state machine is meaningless for most users.
- Daily briefs, checklist items, and any stage-dependent UI all get wrong data.
- The only way this accidentally works is if the user generates a trip and immediately travels.

### Pulse Tab Sonar — No Graceful Degradation
- If Sonar fails (network error, rate limit, edge function down), the Pulse tab shows a skeleton card forever or empty space. No cached fallback content, no offline message. The `useSonarQuery` hook sets `error` state but the Pulse tab UI doesn't check `sonarPulse.error` — it only checks `isLoading` and `data`.

### Trip Wrapped — Zero Accessibility
- No `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint` on any element. The close button is a raw "x" text character with no label. Screen readers see nothing useful. Activity cards, share buttons, slide dots — all unlabeled.

### Country Code Guessing (`i-am-here-now.tsx`)
- Emergency numbers use `guessCountryCode()` which is a hardcoded map of ~30 cities. Any destination not in that map (hundreds of supported destinations) returns `null`, meaning emergency numbers silently fall back to generic 112/911. A user in Bogota, Nairobi, or Kuala Lumpur gets wrong emergency numbers with no indication they're generic fallbacks.

---

## 3. BUILT BUT NOT WIRED

### Amadeus Flight Search (`lib/apis/amadeus.ts`)
- Imported in `flights.tsx` (`searchFlights`, `FlightOffer`) but never called in any handler. All flight actions go through Skyscanner affiliate links. The Amadeus integration is dead code — the search results screen that would display `FlightOffer` data doesn't exist.

### Rome2Rio Routes (`lib/apis/rome2rio.ts`)
- Imported in both `flights.tsx` and `prep.tsx` (`getRoutes`, `RouteResult`) but grep shows no actual call to `getRoutes()` in any handler or effect in these files. Dead import.

### `useTravelStage` Hook — Barely Consumed
- Only used in `plan.tsx`. Not used in Pulse, Prep, or any screen that would actually benefit from stage-aware behavior. The Prep tab could show different content for DREAMING vs TRAVELING vs RETURNED but doesn't use it.

### Foursquare Tips + GetYourGuide Activities
- `getPlaceTips` and `searchActivities` are imported in `itinerary.tsx` but I found no evidence of them being called in effects or handlers within the visible portion of the file. These integrations appear to be imported but not wired.

---

## 4. SINGLE MOST IMPORTANT FIX

**Fix `travel-state.ts` to use `trip.startDate` when available, falling back to `createdAt`.**

This is a 3-line fix that unblocks the entire travel lifecycle. Right now every trip thinks it's already happening. Fix this and suddenly:
- Daily briefs show the right phase-appropriate tips (passport check 30 days out, packing list 7 days out, excitement 1 day out)
- Checklist items appear at the right time
- The app feels like it knows where you are in your journey
- Prep tab could use travel stage to prioritize content
- Pulse tab could shift from "dreaming" content to "you're there" content

The fix:
```typescript
export function getDaysUntilDeparture(trip: Trip): number {
  const departure = new Date(trip.startDate ?? trip.createdAt);
  // rest unchanged
}
```

---

## 5. BIGGEST DIFFERENCE FOR A REAL USER

**The CRAFT conversation flow is the best thing in this app and most users will never find it.**

Right now, the Plan tab defaults to Quick Mode (pick destination, budget, vibes from preset lists). CRAFT mode is behind a mode toggle that's easy to miss. But CRAFT is where the magic is: it asks you real questions, remembers your preferences across sessions, builds a personalized itinerary through conversation, and lets you refine it with follow-ups. It's the feature that makes ROAM feel like talking to a friend who's been everywhere.

The biggest impact for a real user would be making CRAFT the default (or only) trip creation flow, and moving Quick Mode to be the "skip" shortcut. The conversational approach is what differentiates ROAM from every other trip planner. Quick Mode makes ROAM feel like a template engine.

Second biggest: The Prep tab is genuinely useful (emergency numbers, language phrases with pronunciation, weather, visa info, packing lists, exchange rates) but it only shows data when you have a trip. A new user with zero trips sees an empty screen on 3 of 5 tabs. The empty states need to be useful — show "pick a destination to explore" or let people browse Prep data without committing to a trip.

---

## Summary Table

| Feature | Status | Notes |
|---------|--------|-------|
| Trip gen (Quick) | WORKS | Claude proxy, streaming, parse, save |
| Trip gen (CRAFT) | WORKS | Conversation, follow-up, profile learning, resume |
| Itinerary display | WORKS | Maps links, venue cards, editing, export |
| Flights (Skyscanner) | WORKS | Affiliate deep links, search + popular + inspiration |
| Sonar (Perplexity) | WORKS | Edge function, cache, used in 4+ screens |
| Weather (OpenWeather) | WORKS | Live current + 7-day forecast |
| I Am Here Now | WORKS | Weather, context, emergency, moments, Sonar |
| People (profiles) | WORKS | Supabase upsert + guest fallback |
| Prep tab | WORKS | 10+ data sources wired to UI |
| Trip Wrapped | WORKS | 5 slides, share, moments from DB |
| Daily Brief | WORKS | Deterministic + Sonar overlay |
| Travel state | BROKEN | Uses createdAt as departure date |
| Pulse error states | BROKEN | Sonar failure = infinite skeleton |
| Accessibility (Wrapped) | BROKEN | Zero a11y labels on anything |
| Emergency country codes | BROKEN | 30-city hardcoded map, silent fallback |
| Amadeus flights | NOT WIRED | Imported, never called |
| Rome2Rio routes | NOT WIRED | Imported, never called |
| Travel stage in UI | NOT WIRED | Only used in plan.tsx |
