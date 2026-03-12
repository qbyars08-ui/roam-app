# ROAM — Unbuilt Features Audit

> Generated from docs audit. Cross-referenced with codebase. **Do not implement** — documentation only.

---

## Doc Status Summary

| Doc | Notes |
|-----|-------|
| `ADVANCED_FEATURES_SPEC.md` | Source for 40+ features. Several marked "Not built" or "Partial" are now built (e.g. Safety, Visa, Insurance, Currency). |
| `group-trips-spec.md` | **Spec outdated.** Group trips ARE built: `app/group-trip.tsx`, `app/create-group.tsx`, `app/join-group.tsx`, `lib/group-trips.ts`, migration `20260316_group_trips.sql`. Deferred signup via `signInAnonymously` in `join-group.tsx`. |
| `APP_STORE_SCREENSHOTS.md` | Spec exists; no screenshot assets in repo. Checklist unchecked. |
| `referral-flow.md` | **Built.** `lib/referral.ts`, `app/referral.tsx`, migration `20260317_referral_flow.sql`. |

---

## 1. ADVANCED_FEATURES_SPEC.md

### 1A. Real-Time Travel Safety Scores

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §1. Live Data Feeds |
| Status | Partial |
| Priority | P1 |
| Why | SafetyScoreCard exists (US State Dept via `lib/travel-advisory.ts`), SafetyBadge uses Teleport for neighborhood scores. Spec wanted multi-source (Tugo, CISA, UK FCDO) with 1–5 score and breakdown modal. Current: level 1–4, single source. |
| Key files | `components/features/SafetyScoreCard.tsx`, `lib/travel-advisory.ts`, `lib/teleport-safety.ts` |

---

### 1C. Live Flight Prices

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §1. Live Data Feeds |
| Status | Partial |
| Priority | P0 |
| Why | Affiliate links exist (`lib/affiliate-tracking.ts`). No live price display or `FlightPriceCard`. High revenue potential. |
| Key files | `lib/affiliate-tracking.ts`; new: `components/features/FlightPriceCard.tsx`, `supabase/functions/flight-prices/` |

---

### 1D. Live Currency Exchange Rates

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §1. Live Data Feeds |
| Status | Partial |
| Priority | P2 |
| Why | `lib/currency.ts` and `CurrencyToggle` exist; exchange rates used on itinerary. Spec wanted dedicated `CurrencyCard` with "1 USD = X" and quick-convert input. Current: toggle + inline conversion. |
| Key files | `lib/currency.ts`, `components/features/CurrencyToggle.tsx`, `app/itinerary.tsx` |

---

### 1E. Live Destination Webcams

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §1. Live Data Feeds |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. Windy Webcams API. |
| Key files | New: `components/features/DestinationCam.tsx`; Discover + itinerary integration |

---

### 1F. Travel News Feed

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §1. Live Data Feeds |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. NewsAPI/GNews/RSS. |
| Key files | New: `components/features/TravelNewsFeed.tsx`; Discover screen section; edge function for caching |

---

### 2A. Seasonal Recommendations

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §2. Smart Personalization |
| Status | Not started |
| Priority | P0 |
| Why | Must-have per spec. SeasonalBadge on Discover cards, feed into Claude. |
| Key files | New: `lib/seasonal-data.ts`, `components/features/SeasonalBadge.tsx`; `lib/claude.ts` system prompt |

---

### 2B. Budget-Based Filtering

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §2. Smart Personalization |
| Status | Partial |
| Priority | P0 |
| Why | Plan wizard has budget tiers. No Discover screen range slider; no `estimatedDailyCost` on DESTINATIONS. |
| Key files | `app/(tabs)/index.tsx` (Discover), `lib/constants.ts` (DESTINATIONS); `lib/store.ts` (budgetFilter) |

---

### 2C. Weather Preference Matching

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §2. Smart Personalization |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. Profile weather prefs + match score on Discover. |
| Key files | New: `lib/weather-match.ts`; profile settings; Supabase `profiles` fields |

---

### 2D. Profile-Based AI That Learns

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §2. Smart Personalization |
| Status | Not started |
| Priority | P2 |
| Why | Future. Requires user base for signal. |
| Key files | New: `user_preferences` table, `supabase/functions/preference-learner/`; `lib/claude.ts` |

---

### 3A. Travel Partner Matching

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §3. Social & Community |
| Status | Not started |
| Priority | P2 |
| Why | Future. Needs critical mass. Swipe UI, matching algorithm. |
| Key files | New: `travel_intents`, `partner_matches` tables; `app/(tabs)/connect.tsx` or modal |

---

### 3C. Community Trip Reviews

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §3. Social & Community |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. Depends on social layer. |
| Key files | New: `trip_reviews`, `review_likes` tables; `components/features/ReviewCard.tsx`; `app/destination.tsx` |

---

### 3D. Destination Companions ("Who Else Is Going?")

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §3. Social & Community |
| Status | Not started |
| Priority | P2 |
| Why | Future. Requires travel_intents. |
| Key files | New: badge on itinerary; `travel_intents` query |

---

### 3E. Local Meetups

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §3. Social & Community |
| Status | Not started |
| Priority | P2 |
| Why | Future. Location tracking, safety. |
| Key files | New: location permissions; proximity matching |

---

### 3F. Verified Traveler Badges (Enhancement)

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §3. Social & Community |
| Status | Partial |
| Priority | P2 |
| Why | Badge system exists in `lib/passport.ts`. Missing: photo verification (upload at destination, GPS-tagged). |
| Key files | `lib/passport.ts`; new: photo upload + verification flow |

---

### 4A. Vertical Video Feed

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §4. Media & Content |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. YouTube Shorts curation. |
| Key files | New: `app/(tabs)/explore-video.tsx` or modal; edge function; `destination_videos` table |

---

### 4B. User-Generated Content

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §4. Media & Content |
| Status | Not started |
| Priority | P2 |
| Why | Future. Depends on 3C Community Reviews. |
| Key files | Moderation pipeline; storage bucket |

---

### 4C. Trending on Social Destination Cards

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §4. Media & Content |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. SerpAPI or social listening. |
| Key files | New: `trending_destinations` table; edge function; Discover horizontal row |

---

### 4D. Creator Itineraries

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §4. Media & Content |
| Status | Not started |
| Priority | P1 |
| Why | Strong for marketing. Manual curation initially. |
| Key files | New: `creator_itineraries` table; special card style on Discover |

---

### 4E. Hidden Gem Submissions

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §4. Media & Content |
| Status | Not started |
| Priority | P2 |
| Why | Future. Depends on community layer. |
| Key files | Community submission flow |

---

### 5E. Visa Requirement Checker (Enhancement)

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §5. Safety & Practical |
| Status | Partial |
| Priority | P1 |
| Why | `VisaRequirementsCard`, `visa-intel.ts`, `visa-requirements.ts` exist. Spec wanted dedicated `VisaChecker` with passport selector; Claude generates visa in itinerary. Data is curated/RapidAPI — Sherpa API not integrated. |
| Key files | `components/features/VisaRequirementsCard.tsx`, `lib/visa-intel.ts`, `lib/visa-requirements.ts`, `app/travel-profile.tsx` |

---

### 5F. Vaccination Requirements

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §5. Safety & Practical |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. CDC/WHO data. |
| Key files | New: `VaccinationCard.tsx` or section in VisaChecker; itinerary practical info |

---

### 6A. World Map Visualization

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §6. Gamification 2.0 |
| Status | Partial |
| Priority | P0 |
| Why | Passport tracks stamps by country with flags. No SVG world map. High shareability. |
| Key files | `app/(tabs)/passport.tsx`, `lib/passport.ts`; new: `components/features/WorldMap.tsx` (react-native-svg, GeoJSON) |

---

### 6E. Leaderboard

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §6. Gamification 2.0 |
| Status | Not started |
| Priority | P2 |
| Why | Future. Needs friends/follow system. |
| Key files | New: `leaderboard_view`; `components/features/Leaderboard.tsx`; Passport screen |

---

### 6F. Trip Challenges

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §6. Gamification 2.0 |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. Challenge criteria + reward badges. |
| Key files | New: `challenges` table; `components/features/ChallengeCard.tsx`; edge function for completion eval |

---

### 7A. Voice Trip Planning (Speech-to-Text)

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §7. AI Superpowers |
| Status | Partial |
| Priority | P0 |
| Why | TTS exists (elevenlabs, expo-speech). No STT for chat input. expo-speech used for language survival only. |
| Key files | `app/(tabs)/chat.tsx`; `lib/elevenlabs.ts`; new: expo-speech recognition or Whisper; floating mic FAB |

---

### 7B. Photo-to-Destination

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §7. AI Superpowers |
| Status | Not started |
| Priority | P1 |
| Why | Nice-to-have. Claude Vision for location ID; plan wizard pre-fill. |
| Key files | Discover search bar (camera icon); Claude edge function with vision; image picker |

---

### 7D. Price Prediction

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §7. AI Superpowers |
| Status | Not started |
| Priority | P2 |
| Why | Future. Data access bottleneck (Hopper private). |
| Key files | New: `components/features/PriceTrend.tsx`; Skyscanner month view fallback |

---

### 7F. Real-Time Itinerary Adjustment

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §7. AI Superpowers |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. Live Trip Mode exists; no weather-triggered adjustments. |
| Key files | `expo-task-manager`; morning weather check; Claude adjustment prompt; Live Trip Mode card |

---

### 8A. Hotel/Flight Price Alerts

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §8. Monetization |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. Cron + push notifications. |
| Key files | New: `price_alerts` table; edge function cron; Flight/Hotel cards CTA |

---

### 8B. ROAM Concierge (Premium Planning)

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §8. Monetization |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. High-margin; needs ops staffing. |
| Key files | New: `app/concierge.tsx`; RevenueCat product; Supabase intake; email trigger |

---

### 8C. Sponsored Destination Cards

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §8. Monetization |
| Status | Not started |
| Priority | P2 |
| Why | Future. Needs traffic volume. |
| Key files | New: `sponsored_destinations` table; Discover grid insertion |

---

### 8D. Creator Marketplace

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §8. Monetization |
| Status | Not started |
| Priority | P2 |
| Why | Future. Depends on 4D Creator Itineraries. |
| Key files | Payments; creator onboarding; revenue split |

---

### 8F. Airport Lounge Access Affiliate

| Field | Value |
|-------|-------|
| Doc source | ADVANCED_FEATURES_SPEC §8. Monetization |
| Status | Not started |
| Priority | P2 |
| Why | Nice-to-have. Low complexity. LoungeBuddy/Priority Pass. |
| Key files | New: `components/features/LoungeCard.tsx`; itinerary pre-departure; `lib/affiliate-tracking.ts` |

---

## 2. group-trips-spec.md

| Feature | Status | Note |
|---------|--------|------|
| Group Trip Planning | **Built** | Spec says "Not built" — outdated. All flows implemented. |

No unbuilt items. Spec can be updated to reflect completion.

---

## 3. APP_STORE_SCREENSHOTS.md

### App Store Screenshot Deliverables

| Field | Value |
|-------|-------|
| Doc source | APP_STORE_SCREENSHOTS.md (Asset Checklist) |
| Status | Not started |
| Priority | P0 |
| Why | 6 screenshots required for App Store. No PNG assets in repo. Screens 1–6 specified (Discover, Plan, Itinerary, Group Trips, Prep, Share). Group trip screen exists — can be captured. |
| Key files | None. Deliverable: 6 PNGs at 1290×2796 px. Screens to capture: `(tabs)/index`, plan wizard, itinerary, group-trip, prep, share card. |

---

## 4. referral-flow.md

| Feature | Status | Note |
|---------|--------|------|
| Referral Flow | **Built** | Migration, lib, screen, bootstrap integration all present. |

No unbuilt items.

---

## Priority Matrix (Unbuilt Only)

| Priority | Features |
|----------|----------|
| **P0** | Live Flight Prices (1C), Seasonal Recommendations (2A), Budget Filtering (2B), World Map (6A), Voice STT (7A), App Store Screenshots |
| **P1** | Safety Scores enhancement (1A), Visa Checker enhancement (5E), Photo-to-Destination (7B), Creator Itineraries (4D) |
| **P2** | All other items listed above |

---

## Verification Notes

- **Safety**: `SafetyScoreCard` uses State Dept API; `SafetyBadge` uses Teleport. Both differ from spec’s multi-source 1–5 score.
- **Visa**: `visa-intel.ts` (curated), `visa-requirements.ts` (RapidAPI). No Sherpa.
- **Insurance**: `TripInsuranceCards` with Safetywing + World Nomads — built.
- **Currency**: `lib/currency.ts` + `CurrencyToggle` — built; spec’s dedicated card not implemented.
- **Group trips**: Fully built; spec doc outdated.
