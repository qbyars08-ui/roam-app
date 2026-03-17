# Analytics Event Taxonomy — 2026-03-15
## ROAM Analytics: New Tab Engagement + DACH Launch UTM Schema + PostHog Audit

---

## 1. UTM Schema — DACH Creator Campaign

### Design Principles
- One canonical campaign name for the entire DACH launch: `dach_launch`
- Source distinguishes platform (where the viewer is): `tiktok` | `instagram`
- Medium distinguishes content type (how it was created): `ugc` (paid creator) | `organic` (owned channel)
- Content maps 1:1 to script ID so every download can be traced back to a specific script

### Parameter Definitions

| Parameter | Allowed Values | Notes |
|-----------|---------------|-------|
| `utm_source` | `tiktok` \| `instagram` | Platform where the link appears |
| `utm_medium` | `ugc` \| `organic` | `ugc` = paid creator post; `organic` = ROAM's own account |
| `utm_campaign` | `dach_launch` | Constant for entire DACH launch phase |
| `utm_content` | `script_01` … `script_10` | Maps directly to the 10 DACH scripts in `roam/dach_scripts.md` |

### URL Template

```
https://roamapp.app?utm_source={SOURCE}&utm_medium={MEDIUM}&utm_campaign=dach_launch&utm_content={CONTENT_ID}
```

### Full URL Matrix — All 40 Combinations

| Script | Destination | TikTok UGC | TikTok Organic | Instagram UGC | Instagram Organic |
|--------|-------------|------------|----------------|---------------|-------------------|
| script_01 | Tokyo | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_01` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_01` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_01` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_01` |
| script_02 | Bali | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_02` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_02` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_02` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_02` |
| script_03 | New York | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_03` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_03` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_03` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_03` |
| script_04 | Barcelona | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_04` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_04` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_04` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_04` |
| script_05 | Lisbon | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_05` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_05` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_05` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_05` |
| script_06 | Thailand | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_06` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_06` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_06` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_06` |
| script_07 | Japan | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_07` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_07` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_07` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_07` |
| script_08 | Skiurlaub | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_08` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_08` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_08` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_08` |
| script_09 | Interrail | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_09` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_09` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_09` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_09` |
| script_10 | Städtetrip | `?utm_source=tiktok&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_10` | `?utm_source=tiktok&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_10` | `?utm_source=instagram&utm_medium=ugc&utm_campaign=dach_launch&utm_content=script_10` | `?utm_source=instagram&utm_medium=organic&utm_campaign=dach_launch&utm_content=script_10` |

### How UTM Params Are Captured

UTM params land on `roamapp.app` (web, `Platform.OS === 'web'`). The existing `captureRefOnLoad()` in `lib/waitlist-guest.ts` handles `?ref=` but **does not yet capture UTM params**. 

**Required addition to `lib/waitlist-guest.ts`:**

```typescript
const UTM_STORAGE_KEY = '@roam/utm_params';

export async function captureUtmOnLoad(): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
  };
  if (utm.utm_campaign === 'dach_launch') {
    await AsyncStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    // Forward to PostHog so $set_once persists the acquisition source on the person profile
    captureEvent('utm_attributed', {
      utm_source: utm.utm_source ?? '',
      utm_medium: utm.utm_medium ?? '',
      utm_campaign: utm.utm_campaign ?? '',
      utm_content: utm.utm_content ?? '',
    });
  }
}
```

Call `captureUtmOnLoad()` alongside `captureRefOnLoad()` in `app/_layout.tsx`:

```typescript
captureRefOnLoad().catch(() => {});
captureUtmOnLoad().catch(() => {}); // Add this line
```

Pass stored UTM params as properties on the `auth_sign_up` event so every DACH signup carries acquisition attribution:

```typescript
captureEvent(EVENTS.AUTH_SIGN_UP.name, {
  provider,
  utm_source: storedUtm?.utm_source ?? null,
  utm_medium: storedUtm?.utm_medium ?? null,
  utm_campaign: storedUtm?.utm_campaign ?? null,
  utm_content: storedUtm?.utm_content ?? null,
});
```

---

## 2. PostHog Event Audit — 6 Core Events

Audit date: 2026-03-15. Files checked: `lib/posthog.ts`, `lib/posthog-events.ts`, `app/_layout.tsx`, `app/(tabs)/generate.tsx`, `app/paywall.tsx`.

### Audit Table

| Spec Event | PostHog Status | Actual Event Fired | File | Action Required |
|------------|---------------|-------------------|------|-----------------|
| `app_open` | DEFINED, NOT FIRED | — | `lib/posthog-events.ts` (L73) defines `APP_OPENED` / `app_opened` but `recordAppOpen()` in `lib/reengagement.ts` never calls `captureEvent` | Add `captureEvent('app_opened', { source })` in `_layout.tsx` on AppState `active` + cold start |
| `generate_started` | MISSING | — | Not in `app/(tabs)/generate.tsx` nor anywhere in codebase | Fire before `generateItinerary()` call in both `handleQuickSubmit` and `handleConversationGenerate` |
| `generate_completed` | NAME MISMATCH | `trip_generation_completed` | `app/(tabs)/generate.tsx` L117, L184 | Either rename to `generate_completed` or add an alias. `trip_generation_completed` IS firing. |
| `generate_failed` | MISSING | `rate_limit_hit` fires on limit errors only | `app/(tabs)/generate.tsx` L127, L194 | Add `captureEvent('generate_failed', { destination, error_type, error_message })` in the catch block for non-limit errors |
| `paywall_seen` | NAME MISMATCH | `paywall_viewed` | `app/paywall.tsx` L122 | Either rename to `paywall_seen` or add alias. `paywall_viewed` IS firing with `reason` and `destination` props. |
| `subscription_started` | MISSING | — | `app/paywall.tsx` `handlePurchase` (L198) fires `purchase_success` to Supabase analytics only; no PostHog event | Add `captureEvent('subscription_started', { plan: billingCycle, price })` before `purchasePro()` / `purchaseGlobal()` call |

### Detailed Event Specs (What Each Event Must Carry)

#### `app_open`
```typescript
captureEvent('app_open', {
  source: 'cold_start' | 'background' | 'deep_link',
});
```
Fire in `app/_layout.tsx`:
- `cold_start` → in the `initPostHog()` callback immediately after PostHog initializes
- `background` → in the `AppState.addEventListener('change', ...)` handler when state becomes `active`
- `deep_link` → in `handleDeepLink()` when a URL is handled

#### `generate_started`
```typescript
captureEvent('generate_started', {
  destination: string,        // e.g. 'Tokyo'
  budget: string,             // e.g. 'budget' | 'comfort' | 'luxury'
  vibes: string,              // comma-joined: 'culture,food'
  mode: 'quick' | 'conversation',
  days: number,
});
```
Fire at the top of `handleQuickSubmit` and `handleConversationGenerate` in `app/(tabs)/generate.tsx`, after guard checks pass and before `setIsGenerating(true)`.

#### `generate_completed`
Currently fires as `trip_generation_completed`. Add canonical name:
```typescript
captureEvent('generate_completed', {
  destination: string,
  days: number,
  duration_ms: number,        // Date.now() - startTime
  trip_id: string,
  mode: 'quick' | 'conversation',
});
```

#### `generate_failed`
```typescript
captureEvent('generate_failed', {
  destination: string,
  error_type: 'rate_limit' | 'network' | 'parse_error' | 'unknown',
  error_message: string,
  mode: 'quick' | 'conversation',
});
```
Fire in the `catch` block of both handlers. Map `TripLimitReachedError` → `error_type: 'rate_limit'`, other errors → `'network'` or `'unknown'`.

#### `paywall_seen`
Currently fires as `paywall_viewed`. Rename or alias:
```typescript
captureEvent('paywall_seen', {
  trigger: 'limit' | 'feature' | 'upsell',  // maps from params.reason
  source_screen: string,                      // add as optional param to paywall route
  destination: string | null,
});
```

#### `subscription_started`
```typescript
captureEvent('subscription_started', {
  plan: 'monthly' | 'yearly',   // billingCycle === 'annual' → 'yearly'
  price: string,                 // e.g. '$4.99' from packages
});
```
Fire in `handlePurchase` in `app/paywall.tsx` immediately before the `purchasePro()` / `purchaseGlobal()` call.

### Summary: Implementation Status

| Event | Firing? | Correct Name? | All Props? |
|-------|---------|---------------|------------|
| `app_open` | NO | — | — |
| `generate_started` | NO | — | — |
| `generate_completed` | YES (as `trip_generation_completed`) | NO | Partial — missing `duration_ms`, `trip_id` |
| `generate_failed` | PARTIAL (limit errors only as `rate_limit_hit`) | NO | Partial |
| `paywall_seen` | YES (as `paywall_viewed`) | NO | Missing `source_screen` |
| `subscription_started` | NO | — | — |

**3 of 6 are firing.** Of those 3, none use the exact spec event name. 0 of 6 are fully compliant with both name and properties.

---

## 3. DACH Funnel Design

### Funnel: DACH Creator Video → Pro Subscriber

**Funnel ID:** `dach_creator_conversion`  
**Name:** DACH Creator Video → Pro  
**Description:** Full-funnel attribution for DACH UGC/organic creator content. Measures the conversion from a video view on TikTok/Instagram through to a Pro subscription. This is the primary ROI funnel for the DACH launch campaign.  
**Conversion Window:** 30 days  

```
Step 1: Video View
  ↓  (tracked externally via TikTok/Instagram analytics; join point = app visit with utm_campaign=dach_launch)
Step 2: App Visit (UTM-attributed)
  ↓  PostHog event: utm_attributed { utm_campaign: 'dach_launch' }
Step 3: Signup
  ↓  PostHog event: auth_sign_up { utm_campaign: 'dach_launch' }
Step 4: First Trip Generated
  ↓  PostHog event: generate_completed { destination, days, trip_id }
Step 5: Pro Conversion
     PostHog event: subscription_started { plan, price }
```

### PostHog Funnel Definition

```typescript
export const DACH_CREATOR_FUNNEL: FunnelDefinition = {
  id: 'dach_creator_conversion',
  name: 'DACH Creator → Pro',
  description:
    'Full attribution funnel from DACH TikTok/Instagram creator content to Pro subscription. ' +
    'Filter by property utm_campaign=dach_launch to isolate DACH traffic. ' +
    'Break down by utm_content (script_01–script_10) and utm_source (tiktok|instagram) ' +
    'to identify highest-ROI scripts and platforms.',
  steps: [
    {
      event: 'utm_attributed',
      label: 'App visit (UTM attributed)',
      filter: { utm_campaign: 'dach_launch' },
    },
    {
      event: EVENTS.AUTH_SIGN_UP.name,        // 'auth_sign_up'
      label: 'Signup',
      filter: { utm_campaign: 'dach_launch' },
    },
    {
      event: 'generate_completed',            // or 'trip_generation_completed' until renamed
      label: 'First trip generated',
    },
    {
      event: 'subscription_started',
      label: 'Pro conversion',
    },
  ],
  conversionWindow: { value: 30, unit: 'day' },
};
```

### Funnel Step Benchmarks (Targets)

| Step | Event | Target Rate | Absolute Target |
|------|-------|-------------|-----------------|
| 1 → 2 | Video view → App visit | — | Tracked in TikTok/IG analytics |
| 2 → 3 | App visit → Signup | > 20% | 1 in 5 visitors creates account |
| 3 → 4 | Signup → First trip | > 60% | Activation is the primary early metric |
| 4 → 5 | First trip → Pro | > 5% | Matches global free-to-paid benchmark |
| 2 → 5 | App visit → Pro (full funnel) | > 1% | Industry standard for paid social |

### Sub-Funnels for Optimization

#### By Script Performance
Break down `utm_attributed` → `auth_sign_up` by `utm_content` to rank scripts by signup conversion.

| Rank | Script | Hypothesis |
|------|--------|------------|
| Expected top | script_09 (Interrail) | Most relatable DACH use case; high intent |
| Expected top | script_01 (Tokyo) | Aspirational bucket-list destination; high share rate |
| Expected top | script_08 (Skiurlaub) | DACH-specific; low competition on TikTok |
| Needs monitoring | script_06 (Thailand) | Budget angle may resonate less on Instagram |

#### By Platform
Break down by `utm_source` (tiktok vs instagram) to compare platform CAC.

#### By Medium
Break down by `utm_medium` (ugc vs organic) to compare creator ROI vs owned channel.

### DACH Cohort Segmentation in PostHog

Add a PostHog cohort: **DACH Launch Users**

Cohort filter: `utm_campaign` is `dach_launch` (set on sign-up event or as Person property via `utm_attributed` event).

Use this cohort for:
- Retention curves (D1, D7, D30) vs global baseline
- Free-to-paid conversion rate vs global baseline
- Average trips generated before paying vs global baseline
- Language preference distribution

---

## 4. Full Event Taxonomy

| Event Name | Properties | Trigger | Status | File |
|-----------|------------|---------|--------|------|
| `app_open` | `source: 'cold_start' \| 'background' \| 'deep_link'` | App opens or foregrounds | MISSING — needs implementation | `app/_layout.tsx` |
| `utm_attributed` | `utm_source, utm_medium, utm_campaign, utm_content` | Web load with UTM params present | MISSING — needs `captureUtmOnLoad()` | `lib/waitlist-guest.ts` |
| `generate_started` | `destination, budget, vibes, mode, days` | User taps Generate | MISSING | `app/(tabs)/generate.tsx` |
| `generate_completed` | `destination, days, duration_ms, trip_id, mode` | Itinerary returned from Claude | FIRES as `trip_generation_completed` (rename needed) | `app/(tabs)/generate.tsx` |
| `generate_failed` | `destination, error_type, error_message, mode` | Claude call throws | PARTIAL (`rate_limit_hit` only) | `app/(tabs)/generate.tsx` |
| `paywall_seen` | `trigger, source_screen, destination` | Paywall screen mounts | FIRES as `paywall_viewed` (rename needed) | `app/paywall.tsx` |
| `subscription_started` | `plan, price` | Purchase button tapped | MISSING | `app/paywall.tsx` |
| `auth_sign_up` | `provider, utm_source?, utm_medium?, utm_campaign?, utm_content?` | Account created | EXISTS in EVENTS registry — needs UTM props added | `app/(auth)/*.tsx` |
| `itinerary_viewed` | `trip_id, destination, days` | Itinerary screen mounts | EXISTS in EVENTS registry | `app/itinerary.tsx` |
| `share_triggered` | `type, destination` | Share sheet opened | EXISTS as `itinerary_shared` in code | `app/itinerary.tsx` |
| `affiliate_clicked` | `partner, destination, placement` | Affiliate link tapped | EXISTS in `lib/affiliate-tracking.ts` | Various |

---

## 5. User Properties for DACH Segmentation

| Property | Type | Set When | DACH Use |
|----------|------|----------|----------|
| `is_pro` | boolean | On auth + RevenueCat listener | Segment DACH paying vs free |
| `trips_generated` | number | After each `generate_completed` | Activation depth |
| `acquisition_source` | string | On `utm_attributed` → `auth_sign_up` | `tiktok` / `instagram` |
| `acquisition_campaign` | string | On `utm_attributed` → `auth_sign_up` | `dach_launch` |
| `acquisition_content` | string | On `utm_attributed` → `auth_sign_up` | `script_01` … `script_10` |
| `home_airport` | string | Personalization screen | DACH user clustering (FRA, VIE, ZRH, MUC) |
| `passport_country` | string | Personalization screen | DE / AT / CH segmentation |
| `onboarding_variant` | string | A/B test assignment | Experiment tracking |
| `days_since_signup` | number | Computed from created_at | Lifecycle stage |
| `language` | string | i18n detection | Device locale (de / en) |

Set user properties via `identifyUser()` in `lib/posthog.ts`:

```typescript
identifyUser(userId, {
  is_pro: proFromPurchases,
  acquisition_campaign: storedUtm?.utm_campaign ?? null,
  acquisition_source: storedUtm?.utm_source ?? null,
  acquisition_content: storedUtm?.utm_content ?? null,
});
```

---

## 6. PostHog Dashboard Setup — DACH

### Recommended Dashboard Panels

1. **DACH Funnel Chart** — 4-step funnel: `utm_attributed` → `auth_sign_up` → `generate_completed` → `subscription_started`, filtered to `utm_campaign = dach_launch`
2. **Script Leaderboard** — Bar chart of `auth_sign_up` count broken down by `utm_content` (script_01–script_10)
3. **Platform Split** — Pie chart of `utm_attributed` broken down by `utm_source` (tiktok vs instagram)
4. **Medium ROI** — `subscription_started` count broken down by `utm_medium` (ugc vs organic)
5. **D1/D7/D30 Retention** — Retention curve for DACH cohort vs global
6. **CAC Tracker** — `auth_sign_up` count by `utm_content` (compare to creator spend to compute per-script CAC)
7. **Activation Rate** — `generate_completed` ÷ `auth_sign_up` for DACH cohort, week-over-week
8. **Revenue from DACH** — `subscription_started` by week, DACH cohort only

---

## 7. Implementation Priority

| Priority | Task | File | Complexity |
|----------|------|------|------------|
| P0 | Add `captureUtmOnLoad()` to `lib/waitlist-guest.ts` | `lib/waitlist-guest.ts` | Low |
| P0 | Call `captureUtmOnLoad()` in `app/_layout.tsx` | `app/_layout.tsx` | Low |
| P0 | Add `subscription_started` PostHog event to paywall | `app/paywall.tsx` | Low |
| P0 | Add `generate_started` PostHog event to both generate handlers | `app/(tabs)/generate.tsx` | Low |
| P1 | Add `app_open` PostHog event (cold_start + background + deep_link) | `app/_layout.tsx` | Low |
| P1 | Rename `trip_generation_completed` → `generate_completed` OR fire both | `app/(tabs)/generate.tsx` | Low |
| P1 | Rename `paywall_viewed` → `paywall_seen` OR fire both | `app/paywall.tsx` | Low |
| P1 | Add `generate_failed` for non-limit errors | `app/(tabs)/generate.tsx` | Low |
| P1 | Add UTM props to `auth_sign_up` event | Auth screens | Medium |
| P2 | Add `DACH_CREATOR_FUNNEL` to `lib/posthog-funnels.ts` | `lib/posthog-funnels.ts` | Low |
| P2 | Set `acquisition_*` user properties on `identifyUser()` | `app/_layout.tsx` | Low |
| P2 | Build PostHog DACH dashboard with 8 panels above | PostHog UI | Medium |

---

## 8. Implementation Status

- [x] PostHog SDK installed (`posthog-react-native` in `lib/posthog.ts`)
- [x] PostHog initialized in `app/_layout.tsx` via `initPostHog()` + `PostHogProvider`
- [x] User identity set on login via `identifyUser()`
- [x] Core event registry defined in `lib/posthog-events.ts`
- [x] Funnel definitions in `lib/posthog-funnels.ts`
- [ ] `app_open` event instrumented
- [ ] `generate_started` event instrumented
- [ ] `generate_completed` event name normalized
- [ ] `generate_failed` event instrumented
- [ ] `paywall_seen` event name normalized
- [ ] `subscription_started` event instrumented
- [ ] UTM parameter capture (`captureUtmOnLoad`) implemented
- [ ] UTM params attached to `auth_sign_up` event
- [ ] DACH funnel added to `lib/posthog-funnels.ts`
- [ ] Acquisition user properties set on `identifyUser()`
- [ ] PostHog DACH dashboard configured

---

## 9. New Tab Engagement Tracking — 5-Tab Structure

### Context

PR #37 shipped a 5-tab restructure: **Plan → Discover → People → Flights → Prep**. The old `generate`, `stays`, and `food` tabs are hidden (`href: null`) but still routable. The Plan tab is now the core product surface. People tab is the new social/viral feature. This section documents all new engagement events instrumented for the new tabs.

### Events Instrumented

#### Plan Tab (`app/(tabs)/plan.tsx`)

| Event | Properties | Trigger | File | Status |
|-------|------------|---------|------|--------|
| `plan_new_trip_tapped` | `trips_existing: number` | "Plan a new trip" CTA pressed | `app/(tabs)/plan.tsx` | LIVE |
| `plan_quick_action_tapped` | `action: 'hotels' \| 'food' \| 'flights'` | Quick action card pressed | `app/(tabs)/plan.tsx` | LIVE |
| `plan_trip_card_tapped` | `trip_id, destination, days` | Existing trip card pressed to open itinerary | `app/(tabs)/plan.tsx` | LIVE |

Note: `trip_generation_completed` already fires from the Plan tab when generation succeeds (same handler as old generate.tsx).

#### People Tab (`app/(tabs)/people.tsx`)

| Event | Properties | Trigger | File | Status |
|-------|------------|---------|------|--------|
| `people_traveler_viewed` | `traveler_id, destination, match_score` | TravelerCard tapped to open profile | `app/(tabs)/people.tsx` | LIVE |
| `people_connect_tapped` | `traveler_id, destination, match_score` | "Connect" button inside TravelerCard | `app/(tabs)/people.tsx` | LIVE |
| `people_traveler_saved` | `traveler_id, destination` | Heart/save button inside TravelerCard | `app/(tabs)/people.tsx` | LIVE |
| `people_group_tapped` | `group_id, destination, member_count` | GroupCard pressed | `app/(tabs)/people.tsx` | LIVE |
| `people_setup_profile_tapped` | `source: 'people_bottom_cta'` | "Set up profile" CTA at bottom | `app/(tabs)/people.tsx` | LIVE |

#### Tab Navigation (`components/ui/ROAMTabBar.tsx`)

| Event | Properties | Trigger | File | Status |
|-------|------------|---------|------|--------|
| `tab_switched` | `from_tab, to_tab, time_spent_ms` | User presses a different tab | `components/ui/ROAMTabBar.tsx` | LIVE |

`time_spent_ms` = milliseconds elapsed since the previous tab became active. Computed via `useRef` tracking `{ tab, enteredAt }`. Fires only on actual tab switches (not re-taps of the current tab).

### Key Metrics to Answer

| Question | Event + Property | PostHog Query |
|----------|-----------------|---------------|
| Which quick action is tapped most? | `plan_quick_action_tapped.action` | Count by `action` property breakdown |
| Trip card tap-through rate | `plan_trip_card_tapped` ÷ `screen_view(plan)` | Funnel: `screen_view` → `plan_trip_card_tapped` |
| "Plan a new trip" usage rate | `plan_new_trip_tapped` ÷ `screen_view(plan)` with trips_existing > 0 | Trend chart, filter `trips_existing > 0` |
| People tab Connect rate | `people_connect_tapped` ÷ `screen_view(people)` | Funnel: `screen_view(people)` → `people_connect_tapped` |
| "Set up profile" click rate | `people_setup_profile_tapped` ÷ `screen_view(people)` | Funnel: `screen_view(people)` → `people_setup_profile_tapped` |
| Which tab users spend most time on | `tab_switched.time_spent_ms` grouped by `from_tab` | Avg `time_spent_ms` per `from_tab` |
| Tab switching sequence patterns | `tab_switched.from_tab` → `tab_switched.to_tab` | Path analysis / Sankey chart |

### New Funnel Definitions (added to `lib/posthog-funnels.ts`)

#### `plan_tab_engagement` — Plan Tab Depth Funnel
```
plan_tab screen_view → plan_new_trip_tapped → trip_generation_completed → plan_trip_card_tapped
```
Conversion window: 1 day.

#### `people_tab_engagement` — People Social Adoption Funnel
```
people_tab screen_view → people_traveler_viewed → people_connect_tapped
```
Conversion window: 7 days.

#### `dach_creator_conversion` — DACH Creator → Pro Funnel
```
utm_attributed(dach_launch) → auth_sign_up → generate_completed → subscription_started
```
Conversion window: 30 days. Break down by `utm_content` (script_01–script_10).

### Event Registry Updates (`lib/posthog-events.ts`)

New events added to the canonical `EVENTS` registry:

```
PLAN_NEW_TRIP_TAPPED       plan_new_trip_tapped
PLAN_QUICK_ACTION_TAPPED   plan_quick_action_tapped
PLAN_TRIP_CARD_TAPPED      plan_trip_card_tapped
PEOPLE_TRAVELER_VIEWED     people_traveler_viewed
PEOPLE_CONNECT_TAPPED      people_connect_tapped
PEOPLE_TRAVELER_SAVED      people_traveler_saved
PEOPLE_GROUP_TAPPED        people_group_tapped
PEOPLE_SETUP_PROFILE_TAPPED people_setup_profile_tapped
TAB_SWITCHED               tab_switched
```

### PostHog Dashboard — New Tab Engagement

Recommended panels to add to the existing DACH dashboard:

| Panel | Chart Type | Event(s) |
|-------|-----------|---------|
| Quick Action Split | Pie chart | `plan_quick_action_tapped` by `action` |
| Plan Tab Engagement Funnel | Funnel | `plan_tab_engagement` funnel |
| People Tab Adoption | Trend | `people_connect_tapped` week-over-week |
| Time Spent Per Tab | Bar chart | `tab_switched` avg `time_spent_ms` by `from_tab` |
| Tab Flow Sankey | Path analysis | `tab_switched` from/to pairs |
| Profile Setup Funnel | Funnel | `people_tab_engagement` funnel |

### Updated Implementation Status

- [x] `plan_new_trip_tapped` event instrumented (`app/(tabs)/plan.tsx`)
- [x] `plan_quick_action_tapped` event instrumented (`app/(tabs)/plan.tsx`)
- [x] `plan_trip_card_tapped` event instrumented (`app/(tabs)/plan.tsx`)
- [x] `people_traveler_viewed` event instrumented (`app/(tabs)/people.tsx`)
- [x] `people_connect_tapped` event instrumented (`app/(tabs)/people.tsx`)
- [x] `people_traveler_saved` event instrumented (`app/(tabs)/people.tsx`)
- [x] `people_group_tapped` event instrumented (`app/(tabs)/people.tsx`)
- [x] `people_setup_profile_tapped` event instrumented (`app/(tabs)/people.tsx`)
- [x] `tab_switched` event with `time_spent_ms` instrumented (`components/ui/ROAMTabBar.tsx`)
- [x] All 9 new events registered in `lib/posthog-events.ts`
- [x] 3 new funnels added to `lib/posthog-funnels.ts` (DACH, Plan tab, People tab)

---

*Agent 10 — Analytics. Updated 2026-03-15.*
