# ROAM — Free API Research (Agent 02)

> Research date: 2026-03-13
> Goal: Identify free, no-API-key APIs to enrich ROAM's travel data layer

---

## Existing Modules (Already Implemented)

| Module | API Source | Key | Cache TTL | Data |
|--------|-----------|-----|-----------|------|
| `lib/air-quality.ts` | Open-Meteo Air Quality | None | 2h | AQI, PM2.5, PM10, advice |
| `lib/sun-times.ts` | sunrise-sunset.org | None | 6h | Sunrise, sunset, golden hour, day length |
| `lib/timezone.ts` | WorldTimeAPI | None | 24h | Timezone, abbreviation, UTC offset, DST |
| `lib/public-holidays.ts` | Nager.Date | None | 7d | Holidays by country + trip overlap filter |
| `lib/cost-of-living.ts` | Offline data | N/A | N/A | Budget/comfort/luxury daily costs, tipping, bargaining |

All modules follow a consistent pattern: AsyncStorage cache with TTL, `fetchedAt` timestamp, silent cache failures, return `null` or `[]` on error.

---

## Recommended New APIs (Priority Order)

### 1. Weather Forecast — Open-Meteo Weather API

**Priority: HIGH** — Weather is the #1 factor travelers check. Already using Open-Meteo for AQI.

- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Auth:** None required
- **Rate limit:** 10,000 calls/day (free tier)
- **Data:** Daily temp min/max, precipitation probability, weather code, UV index, wind speed, sunrise/sunset
- **Params:** `latitude`, `longitude`, `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,uv_index_max,wind_speed_10m_max`, `forecast_days=16`, `timezone=auto`
- **Cache strategy:** 3h TTL (weather changes frequently)
- **Module file:** `lib/weather-forecast.ts`
- **JSON response shape:**
```json
{
  "daily": {
    "time": ["2026-03-13", "2026-03-14"],
    "temperature_2m_max": [25.1, 26.3],
    "temperature_2m_min": [18.2, 19.0],
    "precipitation_probability_max": [20, 45],
    "weathercode": [1, 3],
    "uv_index_max": [7.2, 8.1],
    "wind_speed_10m_max": [15.3, 12.1]
  }
}
```
- **WMO Weather codes:** 0=Clear, 1=Mainly clear, 2=Partly cloudy, 3=Overcast, 45/48=Fog, 51/53/55=Drizzle, 61/63/65=Rain, 71/73/75=Snow, 80/81/82=Showers, 95/96/99=Thunderstorm
- **Value to ROAM:** Powers packing suggestions, day planning, rain alternatives, UV warnings

---

### 2. Currency Exchange Rates — Frankfurter API

**Priority: HIGH** — Direct budget relevance. App already tracks `homeCurrency` in Zustand store.

- **URL:** `https://api.frankfurter.dev/v1/latest`
- **Auth:** None required
- **Rate limit:** No cap (fair use)
- **Data:** ECB exchange rates, updated daily ~16:00 CET
- **Params:** `base=USD` (or any currency), `symbols=EUR,GBP,JPY,...`
- **Cache strategy:** 24h TTL (rates update daily)
- **Module file:** `lib/exchange-rates.ts`
- **JSON response shape:**
```json
{
  "base": "USD",
  "date": "2026-03-13",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 149.5
  }
}
```
- **Value to ROAM:** Real-time budget conversion, cost comparison in home currency
- **Note:** Already have `exchangeRates` in Zustand store — this would replace/enhance the existing data source

---

### 3. Country Info — REST Countries API v3.1

**Priority: HIGH** — Rich travel-relevant metadata in a single call.

- **URL:** `https://restcountries.com/v3.1/alpha/{code}`
- **Auth:** None required
- **Rate limit:** 2,000 requests/hour
- **Data:** Languages, currencies, capital, region, population, calling codes (IDD), flag, car driving side, timezones, demonyms
- **Params:** `?fields=name,languages,currencies,capital,region,subregion,population,idd,car,flags,timezones,demonyms`
- **Cache strategy:** 30d TTL (country data rarely changes)
- **Module file:** `lib/country-info.ts`
- **JSON response shape (key fields):**
```json
{
  "name": { "common": "Japan", "official": "Japan" },
  "languages": { "jpn": "Japanese" },
  "currencies": { "JPY": { "name": "Japanese yen", "symbol": "¥" } },
  "capital": ["Tokyo"],
  "car": { "signs": ["J"], "side": "left" },
  "idd": { "root": "+8", "suffixes": ["1"] },
  "population": 125836021,
  "flags": { "png": "...", "svg": "...", "alt": "..." }
}
```
- **Value to ROAM:** Driving side (critical for renters), official languages, calling code, flag display, population context
- **Reuses:** `DESTINATION_COUNTRY_CODES` from `public-holidays.ts`

---

### 4. Travel Safety Advisory — travel-advisory.info

**Priority: MEDIUM** — Safety is a top concern, especially for solo/female travelers.

- **URL:** `https://www.travel-advisory.info/api?countrycode={CC}`
- **Auth:** None required
- **Rate limit:** Light traffic recommended; cache heavily
- **Data:** Risk score (0-5), risk label, advisory sources
- **Cache strategy:** 24h TTL (advisories update daily)
- **Module file:** `lib/travel-safety.ts`
- **Risk scale:**
  - 0-2.5: Low risk (safe for travelers)
  - 2.5-3.5: Medium risk (exercise caution)
  - 3.5-4.5: High risk (minimize travel)
  - 4.5-5.0: Extreme warning (avoid)
- **JSON response shape:**
```json
{
  "api_status": { "request": { "item": "AU" } },
  "data": {
    "AU": {
      "iso_alpha2": "AU",
      "name": "Australia",
      "continent": "OC",
      "advisory": {
        "score": 2.1,
        "sources_active": 7,
        "message": "",
        "updated": "2026-03-13 07:30:18",
        "source": "https://www.travel-advisory.info/australia"
      }
    }
  }
}
```
- **Value to ROAM:** Safety badge on itinerary, alerts for high-risk destinations, SafetyScoreCard enhancement
- **Attribution required:** Must link to travel-advisory.info
- **Reuses:** `DESTINATION_COUNTRY_CODES` from `public-holidays.ts`

---

### 5. Emergency Numbers — emergencynumberapi.com

**Priority: MEDIUM** — Critical safety info, pairs perfectly with travel advisory.

- **URL:** `https://emergencynumberapi.com/api/country/{CC}`
- **Auth:** None required
- **Rate limit:** 5 req/sec
- **Data:** Police, fire, ambulance numbers by country
- **Cache strategy:** 30d TTL (emergency numbers rarely change)
- **Module file:** `lib/emergency-numbers.ts`
- **JSON response shape:**
```json
{
  "data": {
    "country": { "name": "Japan", "ISOCode": "JP" },
    "ambulance": { "all": ["119"], "gsm": null, "fixed": null },
    "fire": { "all": ["119"], "gsm": null, "fixed": null },
    "police": { "all": ["110"], "gsm": null, "fixed": null },
    "dispatch": { "all": [], "gsm": null, "fixed": null },
    "member_112": false,
    "localOnly": false,
    "nodata": false
  }
}
```
- **Value to ROAM:** Emergency SOS card, prep screen safety section, offline reference
- **Reuses:** `DESTINATION_COUNTRY_CODES` from `public-holidays.ts`

---

### 6. Geocoding — Open-Meteo Geocoding API

**Priority: MEDIUM** — Replace hardcoded `DESTINATION_COORDS` with dynamic lookup.

- **URL:** `https://geocoding-api.open-meteo.com/v1/search`
- **Auth:** None required
- **Rate limit:** 10,000 calls/day
- **Data:** Lat/lng, elevation, timezone, country code, population
- **Params:** `name={city}&count=1&language=en`
- **Cache strategy:** 30d TTL (coordinates don't change)
- **Module file:** `lib/geocoding.ts`
- **JSON response shape:**
```json
{
  "results": [
    {
      "id": 1850147,
      "name": "Tokyo",
      "latitude": 35.6895,
      "longitude": 139.6917,
      "elevation": 44.0,
      "timezone": "Asia/Tokyo",
      "country_code": "JP",
      "country": "Japan",
      "population": 8336599
    }
  ]
}
```
- **Value to ROAM:** Dynamic coordinate resolution for ANY destination (not just hardcoded ones), enables AQI/sun/weather for all cities
- **Migration path:** Use as fallback when `DESTINATION_COORDS` doesn't have the city

---

### 7. Marine/Ocean Data — Open-Meteo Marine API

**Priority: LOW** — Niche but valuable for beach destinations.

- **URL:** `https://marine-api.open-meteo.com/v1/marine`
- **Auth:** None required
- **Rate limit:** Same as weather (10,000/day)
- **Data:** Wave height, sea surface temperature, swell data, ocean currents
- **Params:** `latitude`, `longitude`, `daily=wave_height_max,sea_surface_temperature`
- **Cache strategy:** 6h TTL
- **Value to ROAM:** Beach condition cards for Bali, Cape Town, Barcelona, etc.

---

### 8. UNESCO World Heritage Sites — UNESCO DataHub

**Priority: LOW** — Nice enrichment for cultural travelers.

- **URL:** `https://data.unesco.org/explore/dataset/whc001/api/`
- **Auth:** None required
- **Data:** Heritage site names, coordinates, categories, inscription dates
- **Cache strategy:** 30d TTL
- **Value to ROAM:** "Must-see heritage sites" section in itinerary

---

## APIs Considered But Not Recommended

| API | Reason Excluded |
|-----|----------------|
| OpenTripMap (POI) | Requires free API key registration |
| WeatherAPI.com | Requires API key signup |
| Travel Buddy Visa API | Limited free tier, data quality unclear |
| Passport Index API | Request-based access only |
| Nominatim Geocoding | 1 req/sec rate limit, non-commercial only, Open-Meteo geocoding is better |

---

## Implementation Plan

### Phase 1 (High Priority — Implement Now)
1. **`lib/weather-forecast.ts`** — Open-Meteo daily forecast (temp, rain, UV, wind, weather code)
2. **`lib/exchange-rates.ts`** — Frankfurter currency rates
3. **`lib/country-info.ts`** — REST Countries (languages, driving side, calling code, flag)

### Phase 2 (Medium Priority — Next Sprint)
4. **`lib/travel-safety.ts`** — Travel advisory risk scores
5. **`lib/emergency-numbers.ts`** — Emergency phone numbers
6. **`lib/geocoding.ts`** — Open-Meteo geocoding (dynamic coordinate resolution)

### Phase 3 (Low Priority — Backlog)
7. **`lib/marine-weather.ts`** — Ocean/beach conditions
8. **`lib/heritage-sites.ts`** — UNESCO World Heritage sites

---

## Integration Points

| New Module | Where Used |
|-----------|-----------|
| weather-forecast | `app/itinerary.tsx` (Destination Intel), `components/features/WeatherCard.tsx`, packing suggestions |
| exchange-rates | `lib/store.ts` (replace/enhance `exchangeRates`), `components/features/CurrencyToggle.tsx` |
| country-info | `app/itinerary.tsx` (Destination Intel), `app/prep.tsx`, new "Know Before You Go" section |
| travel-safety | `components/features/SafetyScoreCard.tsx`, `app/itinerary.tsx` |
| emergency-numbers | `components/features/EmergencySOS.tsx`, `app/prep.tsx` |
| geocoding | `lib/air-quality.ts` (fallback for unknown cities), `lib/weather-forecast.ts` |
