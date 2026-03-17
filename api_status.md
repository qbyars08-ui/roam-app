# ROAM API Integration Status
_Audited: 2026-03-17_

---

## Summary Table

| API | Secret Configured | Edge Function | Wired to Screen | Cached in Supabase | Action Name Bug | Status |
|-----|:-----------------:|:-------------:|:---------------:|:-----------------:|:---------------:|--------|
| Amadeus (flights) | NO | `flights-proxy` | YES — `app/(tabs)/flights.tsx` | YES (`sonar_cache`, `query_type: "flights"`) | YES — client sends camelCase, edge expects snake_case | BLOCKED |
| Foursquare | YES | `travel-proxy` | YES — `app/(tabs)/food.tsx` | YES (`sonar_cache`, `query_type: "foursquare"`) | YES — client sends camelCase, edge expects snake_case | BLOCKED (bug) |
| TripAdvisor | YES | `travel-proxy` | NO — client module exists but no tab screen imports it | YES (`sonar_cache`, `query_type: "tripadvisor"`) | YES — client sends camelCase, edge expects snake_case | BLOCKED (not wired + bug) |
| Sherpa | NO | `travel-proxy` | YES — `app/(tabs)/prep.tsx` | YES (`sonar_cache`, `query_type: "sherpa"`) | YES — client sends camelCase, edge expects snake_case | BLOCKED |
| OpenWeather | YES | `weather-intel` | YES — `app/(tabs)/prep.tsx` | NO — weather-intel does not use `sonar_cache` | N/A — weather-intel uses `destination` param, not `action` | BLOCKED (likely working key, but no cache + no `current`/`forecast` response shape match) |
| Eventbrite | NO | `travel-proxy` | YES — `app/(tabs)/pulse.tsx` | YES (`sonar_cache`, `query_type: "eventbrite"`) | YES — client sends camelCase, edge expects snake_case | BLOCKED |
| Rome2Rio | NO | `travel-proxy` | YES — `app/(tabs)/prep.tsx` | YES (`sonar_cache`, `query_type: "rome2rio"`) | YES — client sends camelCase, edge expects snake_case | BLOCKED |
| GetYourGuide | NO | `travel-proxy` | NO — client module exists, only affiliate links used in `app/itinerary.tsx` | YES (`sonar_cache`, `query_type: "getyourguide"`) | YES — client sends camelCase, edge expects snake_case | BLOCKED |

---

## Secrets Present in Supabase

```
FOURSQUARE_API_KEY        ✓ configured
GOOGLE_PLACES_KEY         ✓ configured
OPENWEATHERMAP_KEY        ✓ configured
TRIPADVISOR_API_KEY       ✓ configured
ANTHROPIC_API_KEY         ✓ configured
PERPLEXITY_API_KEY        ✓ configured
SUPABASE_ANON_KEY         ✓ configured
SUPABASE_DB_URL           ✓ configured
SUPABASE_SERVICE_ROLE_KEY ✓ configured
SUPABASE_URL              ✓ configured
ADMIN_TEST_EMAILS         ✓ configured

AMADEUS_CLIENT_ID         ✗ MISSING
AMADEUS_CLIENT_SECRET     ✗ MISSING
SHERPA_API_KEY            ✗ MISSING
EVENTBRITE_API_KEY        ✗ MISSING
ROME2RIO_API_KEY          ✗ MISSING
GETYOURGUIDE_API_KEY      ✗ MISSING
```

---

## Critical Bug: Action Name Mismatch (affects ALL client modules)

Every client module in `lib/apis/` sends **camelCase** action strings. The edge functions
(`flights-proxy` and `travel-proxy`) validate against **snake_case** strings. This means
every API call will fail with "Invalid action" or silently fall through, even when keys
are present.

### Amadeus (`flights-proxy`)
| Client sends | Edge expects |
|---|---|
| `searchFlights` | `search_flights` |
| `priceCalendar` | `price_calendar` |
| `cheapestDates` | `cheapest_dates` |

### All `travel-proxy` providers (Foursquare, TripAdvisor, Sherpa, Eventbrite, Rome2Rio, GetYourGuide)
| Client sends | Edge expects |
|---|---|
| `searchPlaces` | `search_places` |
| `getPlaceDetails` | `place_details` |
| `getPlaceTips` | `place_tips` |
| `searchLocations` | `search_locations` |
| `getLocationDetails` | `location_details` |
| `getLocationReviews` | `location_reviews` |
| `getVisaRequirements` | `visa_requirements` |
| `getEntryRequirements` | `entry_requirements` |
| `searchEvents` | `search_events` |
| `getRoutes` | `get_routes` |
| `searchActivities` | `search_activities` |
| `getActivityDetails` | `activity_details` |

### OpenWeather (`weather-intel`) — separate issue
The edge function returns a `WeatherIntel` shape with `days[]`, `summary`, `packingAdvice`,
etc. The client module `lib/apis/openweather.ts` expects `data.current` or `data.forecast[]`
in the response. These shapes do not match — the client will always return `null`.

---

## Per-API Detail

### 1. Amadeus
- **Key**: MISSING (`AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET` not in Supabase secrets)
- **Edge function**: `supabase/functions/flights-proxy/index.ts` — fully implemented with OAuth token caching, rate limiting, 30-min/24-hr Supabase cache
- **Screen**: `app/(tabs)/flights.tsx` — imports `searchFlights` from `lib/apis/amadeus`
- **Cache**: YES — uses `sonar_cache` table with `query_type: "flights"`
- **Action bug**: YES — client sends `searchFlights`; edge expects `search_flights`
- **Fix needed**: Add Amadeus API credentials to Supabase secrets + fix action names in `lib/apis/amadeus.ts`

### 2. Foursquare
- **Key**: PRESENT (`FOURSQUARE_API_KEY` configured)
- **Edge function**: `supabase/functions/travel-proxy/index.ts` — implemented under provider `foursquare`
- **Screen**: `app/(tabs)/food.tsx` — imports `searchPlaces` from `lib/apis/foursquare`
- **Cache**: YES — uses `sonar_cache` table with `query_type: "foursquare"`
- **Action bug**: YES — client sends `searchPlaces`; edge expects `search_places`
- **Fix needed**: Normalize action names in `lib/apis/foursquare.ts` (3 actions to fix)

### 3. TripAdvisor
- **Key**: PRESENT (`TRIPADVISOR_API_KEY` configured)
- **Edge function**: `supabase/functions/travel-proxy/index.ts` — implemented under provider `tripadvisor`
- **Screen**: NOT WIRED — `lib/apis/tripadvisor.ts` exists but no tab screen imports it
- **Cache**: YES — uses `sonar_cache` table with `query_type: "tripadvisor"`
- **Action bug**: YES — client sends `searchLocations`; edge expects `search_locations`
- **Fix needed**: Wire to a screen (stays or food are natural fits) + fix action names

### 4. Sherpa
- **Key**: MISSING (`SHERPA_API_KEY` not configured)
- **Edge function**: `supabase/functions/travel-proxy/index.ts` — implemented under provider `sherpa`
- **Screen**: `app/(tabs)/prep.tsx` — imports `getEntryRequirements` from `lib/apis/sherpa`
- **Cache**: YES — uses `sonar_cache` table with `query_type: "sherpa"`
- **Action bug**: YES — client sends `getVisaRequirements`; edge expects `visa_requirements`
- **Fix needed**: Add `SHERPA_API_KEY` to Supabase secrets + fix action names

### 5. OpenWeather
- **Key**: PRESENT (`OPENWEATHERMAP_KEY` configured)
- **Edge function**: `supabase/functions/weather-intel/index.ts` — implemented, returns `WeatherIntel` shape
- **Screen**: `app/(tabs)/prep.tsx` — imports `getCurrentWeather` from `lib/apis/openweather`
- **Cache**: NO — `weather-intel` does not write to `sonar_cache` (responses built in-function only)
- **Action bug**: N/A for edge function, but **response shape mismatch**: edge returns `{ destination, days[], summary, packingAdvice, ... }`; client expects `data.current` or `data.forecast[]`
- **Fix needed**: Update `lib/apis/openweather.ts` to map the `WeatherIntel` response shape correctly

### 6. Eventbrite
- **Key**: MISSING (`EVENTBRITE_API_KEY` not configured)
- **Edge function**: `supabase/functions/travel-proxy/index.ts` — implemented under provider `eventbrite`
- **Screen**: `app/(tabs)/pulse.tsx` — imports `searchEvents` from `lib/apis/eventbrite`
- **Cache**: YES — uses `sonar_cache` table with `query_type: "eventbrite"`
- **Action bug**: YES — client sends `searchEvents`; edge expects `search_events`
- **Fix needed**: Add `EVENTBRITE_API_KEY` to Supabase secrets + fix action name

### 7. Rome2Rio
- **Key**: MISSING (`ROME2RIO_API_KEY` not configured)
- **Edge function**: `supabase/functions/travel-proxy/index.ts` — implemented under provider `rome2rio`
- **Screen**: `app/(tabs)/prep.tsx` — imports `getRoutes` from `lib/apis/rome2rio`
- **Cache**: YES — uses `sonar_cache` table with `query_type: "rome2rio"`
- **Action bug**: YES — client sends `getRoutes`; edge expects `get_routes`
- **Fix needed**: Add `ROME2RIO_API_KEY` to Supabase secrets + fix action name

### 8. GetYourGuide
- **Key**: MISSING (`GETYOURGUIDE_API_KEY` not configured)
- **Edge function**: `supabase/functions/travel-proxy/index.ts` — implemented under provider `getyourguide`
- **Screen**: NOT WIRED — `lib/apis/getyourguide.ts` exists but no tab screen imports it (only hardcoded affiliate links in `app/itinerary.tsx`)
- **Cache**: YES — uses `sonar_cache` table with `query_type: "getyourguide"`
- **Action bug**: YES — client sends `searchActivities`; edge expects `search_activities`
- **Fix needed**: Add `GETYOURGUIDE_API_KEY` + wire to a screen + fix action names

---

## FULLY WORKING vs BLOCKED

### FULLY WORKING
_None — no API is end-to-end functional due to the universal action name mismatch bug._

### PARTIALLY READY (key present, but blocked by bugs)
| API | Blocker |
|-----|---------|
| **Foursquare** | Action name mismatch in `lib/apis/foursquare.ts` |
| **TripAdvisor** | Action name mismatch + not wired to a screen |
| **OpenWeather** | Response shape mismatch between edge function and client |

### BLOCKED (missing key + bugs)
| API | Primary Blocker |
|-----|-----------------|
| **Amadeus** | Missing `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET` secrets |
| **Sherpa** | Missing `SHERPA_API_KEY` secret |
| **Eventbrite** | Missing `EVENTBRITE_API_KEY` secret |
| **Rome2Rio** | Missing `ROME2RIO_API_KEY` secret |
| **GetYourGuide** | Missing `GETYOURGUIDE_API_KEY` secret + not wired to screen |

---

## Recommended Fix Order

1. **Fix action name mismatch** — update all 8 client modules in `lib/apis/` to use snake_case action strings. This unblocks Foursquare and TripAdvisor immediately.
2. **Fix OpenWeather client** — update `lib/apis/openweather.ts` to read from the `WeatherIntel` response shape the edge function actually returns.
3. **Add missing secrets** — `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, `SHERPA_API_KEY`, `EVENTBRITE_API_KEY`, `ROME2RIO_API_KEY`, `GETYOURGUIDE_API_KEY`.
4. **Wire TripAdvisor** — import and use in `app/(tabs)/stays.tsx` or `app/(tabs)/food.tsx`.
5. **Wire GetYourGuide** — import and use in a dedicated activities screen or the itinerary detail view.
