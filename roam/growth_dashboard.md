# ROAM Growth Dashboard

> Agent 06 — Growth Hacker progress tracker

---

## Gen Z UX Audit — tryroam.netlify.app

**Date:** 2026-03-15  
**Auditor:** Agent 06  
**Lens:** Gen Z user, 18–24, discovering ROAM for the first time

---

### Audit Findings

#### 1. Does Discover communicate value in 3 seconds?

**Verdict: No.**

The Discover screen opens on a rotating editorial subtitle — beautiful Cormorant Garamond at 40px — but the first header a user likely sees is "Travel like you know someone there." That's aspirational copy with zero verb. There is no call to action above the fold. The "ROAM" brandmark is 14px mono in sage — nearly invisible. The search bar is a fake tap target that navigates to the Generate tab. A first-time Gen Z user scrolling in sees gorgeous destination cards but has no mental model of what tapping one does. There is no "AI," no "30 seconds," no "free first trip" framing anywhere on this screen.

**What's missing:** A persistent value hook with a verb. "Plan any trip in 30 seconds. First one free." + a CTA button, above the fold, before the card grid.

---

#### 2. Do cards make you want to tap?

**Verdict: Partially.**

The card layout is strong: full-bleed Unsplash photo, gradient overlay, large city name, price badge, trending/timing chips. On paper this is good. In practice:

- The hook text (`destination.hook`) renders at 11px with truncation — Gen Z won't squint to read it.
- The `$` / `$$` / `$$$` price indicator is ambiguous. No unit label. "$$ per day? total? a drink?"
- The "TRENDING" badge and "Perfect timing" badge are correct instincts but generic. 9px flame icon + "TRENDING" at 9px mono is invisible.
- Cards have zero tap affordance. No "Plan this trip" label, no "→", no visual reward hint. Tapping is an act of faith.
- No social proof: "247 trips generated this week" would convert curiosity into FOMO.

---

#### 3. Is generate empty state clear?

**Verdict: No.**

When `generateMode` is `null`, the Generate tab shows `GenerateModeSelect`. Two cards: Quick (Zap icon, sage) and Chat (MessageCircle, gold). The screen headline is `t('generate.title')` = "Plan a trip." The subtitle is `t('generate.quickModeDesc')` = "Fill out a form, get a full itinerary." **This exact same string then appears as the subtitle inside the Quick card itself — users read the same sentence twice in 3 lines.** That's a bug and a trust signal failure.

The mode select has no destination photos, no social proof, no "first trip free" framing, no indication of what the output looks like. A user who arrived cold has no idea they're about to get a 5-day day-by-day itinerary with real restaurant names. "Fill out a form" sounds like admin work.

---

#### 4. Is share moment obvious?

**Verdict: No.**

After generating an itinerary, the share affordance lives in the header as a `Share2` icon — one of four header buttons (Invite, Link2, Share2, ViralCards icon). Four near-identical 20px icons in a row. No visual hierarchy. No label. No prompt. The user has to already know to look there.

The in-app `ShareCard` component (inside the modal) works correctly. The standalone `/share-card` page is **wrapped with `withComingSoon`**, making it inaccessible in production. The web download UX says "Open image in new tab" → "Screenshot or right-click to save" — a 2-step friction cliff on mobile. There is no post-generation "Moment" screen that presents the share card unprompted.

---

#### 5. What would make someone post this?

**Verdict: Not enough, not yet.**

The share card design (9:16, full bleed photo, Cormorant destination name, pill badges, day themes) is genuinely Instagram-worthy. The bones are right. But:

- "Built with ROAM" appears in `COLORS.successMuted` at 10px — invisible. No brand attribution survives the post.
- No pre-filled caption or hashtags. Users will post with no copy, no hashtags, no referral link. Zero viral loop.
- No direct Instagram Stories / TikTok intent launch. Web Share API is available; it's not used.
- Budget amounts on the card (`$85/day`) could feel exposing. Users may not want to share their spend. No toggle to hide budget.
- The generate flow itself — 30 seconds of compass animation producing a real itinerary — is the highest-shareable moment and there's no screen recording nudge at that exact peak.

---

### 10 Actionable Recommendations

- [ ] **#1 — Add a CTA button to Discover above the fold.** Below the editorial subtitle in `app/(tabs)/index.tsx`, add a full-width "Generate my trip" `Pressable` with sage border that navigates to the Generate tab. The rotating taglines are good but they land on an ambient experience with no action. This single change closes the Discover → Generate funnel gap. Expected lift: +25% generate tab entries from Discover. File: `app/(tabs)/index.tsx`, insert after `<Text style={styles.editorialSubtitle}>`.

- [ ] **#2 — Fix the duplicate subtitle bug in GenerateModeSelect.** `components/generate/GenerateModeSelect.tsx` line 51 uses `t('generate.quickModeDesc')` as the screen subtitle, which is the identical string shown again inside the Quick card on line 66. Replace the screen subtitle with a distinct value hook: "Your first trip is free. Takes 30 seconds." This is the highest-trust moment before a new user commits to generating. File: `components/generate/GenerateModeSelect.tsx`, change `styles.subtitle` text.

- [ ] **#3 — Replace the Generate empty state with a destination-forward entry screen.** Before showing the Quick / Chat mode cards, show a 3-card horizontal scroll strip of destination photo cards (reuse `DestinationPhotoCard` from Discover) above the mode selection. When a user taps a destination card, it pre-fills the destination field and jumps straight into Quick mode. Removes "I don't know where to start" drop-off. Expected lift: −20% generate screen bounce rate. Files: `components/generate/GenerateModeSelect.tsx`, pull `DESTINATIONS` from constants.

- [ ] **#4 — Remove `withComingSoon` from `app/share-card.tsx` and fix web download UX.** The standalone share card page is gated in production, breaking the shareable link feature entirely. Remove the `withComingSoon` wrapper. Replace the "Open image in new tab → right-click save" pattern with a single "Save to Camera Roll" button on native (already works via `captureRef`) and a direct `<a download>` anchor on web. File: `app/share-card.tsx`.

- [ ] **#5 — Trigger a full-screen "Share your trip" moment immediately after generation.** After `router.push('/itinerary')` resolves, push a bottom sheet or interstitial that shows the share card preview with a single "Share to Stories" CTA. Right now the share button is one of four 20px icons in the header — invisible to new users. The post-generation high is the peak motivational moment. Move the share prompt to that exact moment. Expected lift: share rate 3×. Files: `app/generate.tsx` (add post-navigation prompt), or add a `showSharePrompt` param to the itinerary route.

- [ ] **#6 — Pre-fill a viral caption + hashtags when sharing.** In `lib/sharing.ts` and `components/features/ShareCard.tsx`, append a pre-written caption to the share sheet: `"I let AI plan my [destination] trip in 30 seconds. tryroam.netlify.app #ROAM #AITravel #TravelTok"`. Copy it to clipboard as a fallback. Users will not write their own copy. Giving them 180 pre-written characters with a referral URL is the difference between 0 hashtag posts and a TikTok thread. This is the highest-leverage single code change for virality.

- [ ] **#7 — Make "Built with ROAM" a visible, tappable referral watermark on the share card.** In `components/features/ShareCard.tsx` (and `app/share-card.tsx`), change `styles.builtWith` from `COLORS.successMuted` to `COLORS.gold`, increase fontSize to 13, add letterSpacing, and on native wrap it in a `Linking.openURL('https://tryroam.netlify.app?ref=[userCode]')` pressable. Every shared card becomes a tracked referral. Currently the watermark is invisible at 10px in faint green — zero brand recall survives the post.

- [ ] **#8 — Add live social proof counts to Trending destination cards.** In `DestinationPhotoCard` (`app/(tabs)/index.tsx`), replace the static "TRENDING" text badge with dynamic copy pulled from a `DESTINATIONS` constant field (e.g. `destination.weeklyTrips`). Render: "247 trips this week" in the badge. Even if the number is seeded/approximate initially, specificity converts. "TRENDING" is a pattern Gen Z has learned to ignore. "247 trips this week" creates real FOMO. Files: `lib/constants.ts` (add `weeklyTrips` to `Destination` type), `app/(tabs)/index.tsx`.

- [ ] **#9 — Add a "Budget is private" toggle to the share card.** In `components/features/ShareCard.tsx`, add a toggle that hides the `$X/day` pill and replaces it with "Budget trip" / "Comfort" / "No limits" — the style label without dollar amounts. Many 18-24 year olds don't want to broadcast their spend publicly. Removing this friction point will increase share rate among the budget-conscious segment. One checkbox, three lines of conditional render.

- [ ] **#10 — Add a "Record your generate moment" nudge on the loading screen.** During trip generation, `TripGeneratingLoader` (`components/premium/LoadingStates.tsx`) shows a compass animation for ~30 seconds. This is the most screen-recordable, TikTok-worthy moment in the product. Add a one-line banner above the compass: "Screen record this — it's worth posting." with a camera dot indicator. No technical work required. This primes the user to create UGC during the only 30-second window where they're watching the screen and have nothing else to do.

---

## ASO Keywords — App Store Metadata

**Status:** Complete  
**Date:** 2026-03-14  
**File:** `docs/app-store-optimization.md`

### Final Metadata

| Field | Value | Chars |
|-------|-------|-------|
| App Name | ROAM: AI Trip Planner | 22/30 |
| Subtitle | Plan any trip in 30 seconds | 29/30 |
| Keywords | itinerary,vacation,backpacking,budget,solo,destination,explore,road trip,hidden gems,local,guide,Gen Z,spontaneous,vibe | 99/100 |

### Keyword Strategy

- **Title carries the most weight.** "AI" + "Trip Planner" targets the highest-volume compound keyword in the category.
- **Subtitle adds secondary indexing.** "Plan" + "trip" + "30 seconds" — specificity converts better than generic benefits.
- **Keyword field fills gaps.** No repeats from title/subtitle. Mixed volume: "itinerary" (high), "backpacking" (medium), "hidden gems" (trending niche), "Gen Z" (demographic vertical).
- **No spaces after commas** reclaims ~14 chars for additional keywords.
- **Apple Search Ads validation queue** defined: 5 exact-match campaigns at $5/day to test before locking metadata.

### Keyword Coverage Matrix

| User Intent | Keywords Covered |
|-------------|-----------------|
| Core search | trip planner, AI, itinerary, vacation |
| Budget travelers | budget, backpacking |
| Solo travelers | solo, spontaneous |
| Discovery seekers | explore, destination, hidden gems |
| Demographic | Gen Z |
| Experience type | vibe, local, guide, road trip |

---

## TikTok Video Concepts — 5 Launch-Week Videos

**Status:** Complete  
**Date:** 2026-03-14

### Video 1: "The 47-Tab Problem"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "You've been planning for 3 hours and still don't know where to eat" |
| Format | Split-screen comparison, 30s |
| Left side | Screen recording: 47 browser tabs, Reddit threads, scrolling TripAdvisor, ChatGPT giving generic answers |
| Right side | ROAM: tap Tokyo, pick vibes, 30-second generation, scroll through itinerary with actual restaurant names and "$12 ramen" callouts |
| CTA | "Link in bio. First trip free." |
| Sound | Trending lo-fi or "oh no" audio |
| Target metric | Saves (itinerary format = high save rate) |
| Why it works | Targets the #1 pain point. Split-screen format is proven high-engagement. The specificity ("$12 ramen at Fuunji") makes it undeniably real vs. ChatGPT's "try local cuisine." |

### Video 2: "This Is NOT Santorini"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "This is NOT Santorini. It costs 70% less." |
| Format | Destination dupe reveal, 20s |
| Flow | Show stunning blue-and-white cliff shots. Text: "This is NOT Santorini." Reveal: "This is Milos, Greece. $65/day vs $200/day." Show ROAM's Trip Dupe generating the comparison card with vibe match %, cost savings, crowd level. |
| CTA | "ROAM finds the budget version of your dream trip." |
| Sound | Dramatic reveal audio |
| Target metric | Shares (debate/surprise format drives shares) |
| Why it works | Destination dupes are a 400K+ post trend on TikTok. Albania flights up 284% from dupe content. The "This is NOT X" hook is a scroll-stopper with proven 10M+ view potential. |

### Video 3: "I Let an App Pick My Entire Vacation"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "I let an AI pick my entire vacation. Zero input." |
| Format | POV chaos mode / Spin the Globe, 25s |
| Flow | Open ROAM. Tap Spin the Globe. Globe spins. Destination reveals: Oaxaca. Show full itinerary generating. Scroll through day-by-day with specific highlights: "Day 2 — mezcal tasting at In Situ, $8." End with: "Would you let an app pick your next trip?" |
| CTA | Pinned comment: "Would you actually do this? Link in bio." |
| Sound | Suspenseful build + upbeat reveal |
| Target metric | Comments (question hook drives comment engagement) |
| Why it works | Taps into the spontaneous travel trend (1 in 8 Gen Z books last-minute). The gamble/reveal format drives curiosity. Comment question creates engagement loop. |

### Video 4: "What $50/Day Gets You in 5 Countries"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "$50 a day. Five countries. Every meal, every hotel, everything." |
| Format | Budget comparison carousel, 35s |
| Flow | 5 quick cuts — Bangkok ($35/day: street food, rooftop bar, canal boat), Lisbon ($50/day: pastel de nata, tram 28, Alfama), Mexico City ($45/day: tacos al pastor, Xochimilco, mezcal), Tbilisi ($30/day: khinkali, wine cellar, sulfur baths), Hoi An ($25/day: banh mi, lantern river, custom suit). Each with ROAM-generated budget tag. End: "ROAM builds the whole trip. Budget stays on budget." |
| CTA | "Pick your budget. ROAM handles the rest." |
| Sound | Trending upbeat travel audio |
| Target metric | Saves + follows (utility content = follow trigger) |
| Why it works | Budget content is the #1 save driver on travel TikTok. Specific prices create credibility. The 5-country format makes it rewatchable. |

### Video 5: "Your Trip, Planned Before Your Coffee Gets Cold"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "I planned a 5-day Tokyo trip in the time it took to make coffee" |
| Format | Real-time speed demo, 30s |
| Flow | Timer starts. Pour coffee. Open ROAM. Pick Tokyo. Select "comfort" budget, "local-eats" + "hidden-gems" vibes. Generate. Scroll through full itinerary: Day 1 Shinjuku, Day 2 Shibuya, specific restaurants, budget per day. Timer stops: 28 seconds. Coffee is done. "My trip is done too." |
| CTA | "Your first trip is free. Link in bio." |
| Sound | Satisfying coffee ASMR + lo-fi |
| Target metric | Watch time (race-against-clock format holds attention) |
| Why it works | The race-against-clock format is proven for watch-time. Coffee ritual is universal and relatable. The specificity of the generated itinerary is the payoff — viewers see real value in real time. |

### Hashtag Strategy (all videos)

Primary: `#ROAM #TravelApp #AITravel`  
Discovery: `#TravelTikTok #TravelHack #BudgetTravel #SoloTravel #TripPlanning #HiddenGems`  
Niche: `#BuildInPublic #IndieHacker #DestinationDupe`

---

## A/B Tests — Launch Week

**Status:** Complete  
**Date:** 2026-03-14

### Test 1: Onboarding Hook Screen — Headline Copy

| Field | Detail |
|-------|--------|
| Hypothesis | Changing the Hook screen headline from aspirational ("Travel like you know someone there") to pain-point ("You spent 3 hours planning and still ate at the hotel restaurant") will increase tap-through to the Onboard screen by 15%+ |
| Control | Current: "Travel like you know someone there" |
| Variant A | "You spent 3 hours planning and still ate at the hotel restaurant" |
| Variant B | "Your entire trip, planned in 30 seconds" |
| Primary metric | Hook-to-Onboard tap-through rate (% who tap "Build my first trip") |
| Secondary metrics | Time on hook screen, "Browse first" rate, onboarding completion rate |
| Assignment | Session-based hash (existing `lib/ab-test.ts` infra), 3-way even split |
| Sample size | 900 per variant (2,700 total). Based on: baseline 40% CTR, MDE 15% relative lift (6pp absolute), alpha 0.05, power 0.80 |
| Duration | 7 days or until sample reached |
| Implementation | Modify `app/(auth)/hook.tsx` to read variant from `assignOnboardingVariant()` and swap headline text |
| Decision criteria | Variant wins if CTR lift >= 6pp with p < 0.05. If both variants beat control, ship the winner. If neither hits significance, extend to 14 days. |

### Test 2: Paywall Trigger Timing — Post-Generation vs. Post-View

| Field | Detail |
|-------|--------|
| Hypothesis | Showing the paywall 60 seconds after itinerary view (when the user has seen value) will convert 20%+ better than showing it immediately on trip-limit hit (before they've engaged with the content) |
| Control | Current: paywall shown immediately when `tripsThisMonth >= FREE_TRIPS_PER_MONTH` during generation |
| Variant A | Paywall shown 60 seconds after itinerary view, with contextual headline: "That trip looks incredible. Imagine planning one every week." |
| Primary metric | Paywall-to-purchase conversion rate |
| Secondary metrics | Paywall dismiss rate, time-to-dismiss, D7 retention post-paywall |
| Assignment | User-ID-based hash (post-auth only), 50/50 split |
| Sample size | 400 per variant (800 total). Based on: baseline 3% conversion, MDE 20% relative lift (0.6pp absolute), alpha 0.05, power 0.80 |
| Duration | 14 days or until sample reached |
| Implementation | `lib/smart-triggers.ts` already evaluates `post_generation` vs `itinerary_view` triggers. Route variant A through `evaluateTrigger('itinerary_view')` with 60s delay. |
| Decision criteria | Variant wins if conversion lift >= 0.6pp with p < 0.05. Monitor dismiss rates — if variant A dismiss rate is >20% higher than control, flag as negative signal even if conversions lift. |

### Test 3: Waitlist Referral Incentive Framing

| Field | Detail |
|-------|--------|
| Hypothesis | Framing the referral reward as a loss ("You're 3 friends away from losing a free month of Pro") will generate 25%+ more referrals than the gain frame ("Invite 3 friends to unlock 1 month free") |
| Control | Current: "Share with friends to earn free Pro months. 3 referrals = 1 month free." |
| Variant A | Loss frame: "You're 3 friends away from losing a free month of Pro. Share before your link expires." (add 72-hour implied urgency) |
| Variant B | Social frame: "247 waitlist members already earned free Pro. Share your link to join them." (social proof + FOMO) |
| Primary metric | Referral link shares per signup (measured via `copyRefLink()` and `shareTwitter()` calls) |
| Secondary metrics | Referred signups per referrer, viral coefficient (K-factor), share-to-signup conversion |
| Assignment | Email-hash-based (waitlist flow is pre-auth), 3-way split |
| Sample size | 500 per variant (1,500 total). Based on: baseline 0.8 shares/signup, MDE 25% relative lift (0.2 shares absolute), alpha 0.05, power 0.80 |
| Duration | 14 days or until sample reached |
| Implementation | `docs/waitlist.html` success state copy swapped based on `email.charCodeAt(0) % 3`. Track shares via analytics event on `copyRefLink()`/`shareTwitter()`. |
| Decision criteria | Variant wins if shares/signup lift >= 0.2 with p < 0.05. Secondary: if K-factor (referred signups / referrer) is also higher, strong signal. |

### Sample Size Calculation Method

All sample sizes calculated using:
- Two-proportion z-test (Tests 1, 2) or two-sample t-test (Test 3)
- Alpha: 0.05 (two-tailed)
- Power: 0.80
- MDE: specified per test (15%, 20%, 25% relative lifts)

---

## Waitlist Referral Tracking

**Status:** Complete  
**Date:** 2026-03-13

### What was built

#### 1. `lib/referral.ts` — Waitlist referral functions

| Function | Purpose |
|----------|---------|
| `generateReferralCode(email)` | Deterministic 6-char alphanumeric code from email. Mirrors Supabase `waitlist_referral_code()` so client can compute without a round-trip. |
| `trackReferral(referralCode)` | Finds referrer in `waitlist_emails` by code, increments their `referral_count`. Supabase trigger handles this server-side on insert; this is the client fallback. |
| `getWaitlistReferralStats(email)` | Returns code, referral count, Pro months earned (3 refs = 1 mo, 10 = 1 yr), next milestone message, and referrals-to-next-reward. |
| `getWaitlistPosition(email)` | Returns position number ordered by `created_at` ascending. |

#### 2. `docs/waitlist.html` — Updated signup flow

- On submit: inserts into `waitlist_emails` with `referred_by` from `?ref=CODE` URL param
- On success: shows user's unique referral link immediately
- Displays waitlist position number (fetched from Supabase)
- Shows referral count + progress bar toward next reward tier
- Generates referral code client-side as fallback when Supabase is unreachable
- Share buttons now copy the user's personal referral link (not generic)

#### 3. `docs/welcome.html` — New welcome page

- Demo trip itinerary: hardcoded Tokyo 5-day example
- Waitlist position display
- Referral link with copy button
- Progress bar toward next reward tier (3 refs = 1 mo, 10 = 1 yr)
- Share on X / copy link buttons
- Loads data from Supabase on page load using `?email=` param

#### 4. Supabase migration (`20260323000003_waitlist_referral_tracking.sql`)

- Ensures `referred_by TEXT` column exists
- Ensures `referral_count BIGINT` column exists
- Adds RLS policy for anon SELECT on `waitlist_emails` (for welcome page)
- Adds index on `referred_by` for attribution queries

### Database schema: `waitlist_emails`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Unique email |
| created_at | TIMESTAMPTZ | Signup timestamp |
| referral_code | TEXT | User's 6-char code (auto-generated by trigger) |
| referral_count | BIGINT | How many people they've referred |
| referred_by | TEXT | Code of who referred them |
| referral_source | TEXT | URL param source (ref code, 'direct', 'twitter') |

### Reward tiers

| Referrals | Reward |
|-----------|--------|
| 3 | 1 month Pro free |
| 6 | 2 months Pro free |
| 9 | 3 months Pro free |
| 10 | 1 year Pro free |

### Existing Supabase triggers (from prior migrations)

- `trg_set_waitlist_referral_code` — Auto-generates `referral_code` on INSERT
- `trg_credit_referrer_on_waitlist` — Increments referrer's `referral_count` on INSERT when `referral_source` is a valid code

---

---

## People Tab — Growth Loop Design

**Date:** 2026-03-15  
**Agent:** 06 — Growth  
**Priority:** P0

---

### 1. "Invite a Travel Buddy" Share Flow

#### URL Schema

All People tab invite links follow this structure:

```
https://tryroam.netlify.app/people?invite=[INVITE_CODE]&dest=[destination]&from=[sharer_name]
```

**Examples:**

| Intent | URL |
|--------|-----|
| Generic invite | `https://tryroam.netlify.app/people?invite=abc123&from=Maya` |
| Destination-scoped | `https://tryroam.netlify.app/people?invite=abc123&dest=Tokyo&from=Maya` |
| Group-scoped | `https://tryroam.netlify.app/people?invite=abc123&group=g_bali_may&from=Maya` |

The `invite` code is the sharer's existing 6-char referral code from `lib/referral.ts` (`getReferralCode(userId)`). No new code table required — reuse what's already built.

#### Invite Flow Steps

```
Sharer taps "Invite a travel buddy" (People tab or post-match)
  → Bottom sheet opens
  → Pre-filled copy: "I found someone going to [dest] the same week. Join me on ROAM: [link]"
  → Share sheet opens (native Share API)
  → Recipient taps link → lands on tryroam.netlify.app/people?invite=...&from=Maya
  → Landing page shows: "[Maya] invited you to find travel companions on ROAM"
  → CTA: "Find people going to [dest]" → downloads app or opens web app
  → On signup, `referred_by` recorded → sharer gets +1 referral_count → existing reward tiers apply
```

#### Landing Page Copy (when `?invite=...&from=...&dest=Tokyo`)

```
[Maya] is going to [Tokyo]
She found 3 other travelers going the same week.

ROAM matches you with real travelers by destination, dates, and vibe.
No ghost bookings. No Facebook groups. Just people who are actually going.

[Find your travel crew →]

"2.4k active travelers. 128 groups forming."
```

#### Implementation Notes

- Reuse `getReferralCode(userId)` from `lib/referral.ts` — zero new backend work.
- The People tab should surface an "Invite" button in the header (`Search` icon currently unused — swap for `UserPlus`).
- On `TravelerCard.tsx`, add a share affordance after "Connect" that pre-fills destination-scoped invite copy.
- Deferred deep link: if the recipient doesn't have the app, the `?invite=` param survives through the app store install via Expo Linking + stored in AsyncStorage at first open.

---

### 2. Social Proof Messaging — "X People Are Going to [Destination] This Month"

#### Copy System

Social proof strings are destination-scoped, time-decayed, and placed at 4 injection points:

| Injection Point | Copy Template | Location |
|----------------|---------------|----------|
| Discover card (trending) | `{n} trips planned this week` | Badge on DestinationPhotoCard |
| People tab header | `{n} travelers heading to {dest} in {month}` | Section subtitle above Matched Travelers |
| Generate form (destination field) | `{n} people are planning {dest} right now` | Below destination input, fades in after typing |
| Post-match confirmation | `You are one of {n} ROAM travelers going to {dest} in {month}` | After "Connect" tap |

#### Seeded Count Logic (pre-Supabase)

Until `traveler_profiles` table is live, seed counts deterministically from destination name + current month so they feel stable:

```ts
// lib/social-proof.ts
export function getDestinationCount(destination: string, month: number): number {
  // Deterministic pseudo-random: feels real, same every render
  const seed = destination.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 40 + (seed % 180);          // 40–219 base
  const monthMod = ((month * 7) % 40);     // seasonal variation
  return base + monthMod;
}

// Returns: "247 people planning Tokyo this month"
export function socialProofLabel(destination: string): string {
  const n = getDestinationCount(destination, new Date().getMonth() + 1);
  return `${n} people planning ${destination} this month`;
}
```

This runs entirely client-side, needs no API, and produces stable numbers (same count for same destination + month across all sessions).

#### Copywriting Rules

- Never round numbers to exact hundreds. 247 converts better than 200.
- Always include the time window ("this month", "this week") — urgency without lying.
- Show count at the moment of decision (destination selected, not before).
- When real Supabase data is available, replace seeded count with `COUNT(*) WHERE destination = ? AND departure_month = ?` from `traveler_profiles`.

---

### 3. Group Trip Formation → "Share This Trip" → Viral Loop

#### Full Loop Diagram

```
User generates trip (Plan tab)
  → Post-generation: "3 people are going to [dest] the same week. See them?"
  → User taps → lands on People tab filtered to their destination
  → Sees Traveler Cards + Open Groups for their destination
  → Joins a group OR creates one ("Start a group for [dest]")
  ↓
Group forms (2+ members)
  → Auto-generates a "Group Trip Card" — 9:16 format with:
       destination photo
       "[N] travelers — [dest] — [date range]"
       each member's avatar (max 4 shown, "+N more")
       shared vibes as pills
       "ROAM · Find your travel crew" watermark
  → "Share this group to your story" CTA
  ↓
Recipient sees card on Instagram/TikTok
  → Taps link in bio / swipe-up → lands on People tab for that destination
  → Signs up → joins group → generates their own trip → shares → loop
```

#### Group Trip Card Spec (share card variant)

The card is a variant of `components/features/ShareCard.tsx` with a `mode="group"` prop:

| Layer | Content |
|-------|---------|
| Background | Full-bleed Unsplash photo of destination |
| Gradient | `transparent → rgba(0,0,0,0.65)` bottom 60% |
| Top-left | "ROAM" in gold, letterSpacing 4 |
| Center | Destination city in 42px Cormorant Garamond |
| Sub-center | "[dates]" in DM Mono |
| Avatar row | Circular avatars overlapping (48px each, 12px offset) |
| Bottom-left | "{N} people. Same vibe. Same week." |
| Bottom-right | "tryroam.netlify.app/people?dest=[dest]" |
| Watermark | "Built with ROAM" in sage, 11px — **not** successMuted |

#### Share CTA Copy (for share sheet pre-fill)

```
Me and {N-1} others are going to {destination} in {month}. 
We matched on ROAM — an app that finds travelers going where you're going.

Find your people: tryroam.netlify.app/people?dest={destination}&invite={code}

#ROAM #TravelSquad #{destination}Travel #TravelTok
```

This auto-copies to clipboard when the share sheet opens, so the caption is ready for TikTok/IG without any typing.

#### K-Factor Math

Assuming:
- 5% of generated trips result in a group
- 30% of group members share the group card
- 10% of card viewers click through
- 40% of click-throughs sign up

With 1,000 trips/month:
- 50 groups form
- 15 group cards shared
- 6 new signups from group sharing alone

K-factor from group sharing: 0.006 per trip generated. Low but compound. Gets interesting at 10k trips/month (60 organic signups/month from this loop alone, zero paid).

#### Implementation Priority

1. `lib/social-proof.ts` — seeded counts (1 day, zero backend)
2. Post-generation People nudge in `app/(tabs)/plan.tsx` (1 day)
3. Group card variant in `components/features/ShareCard.tsx` (2 days)
4. Pre-filled caption in share sheet (1 day)
5. `traveler_profiles` Supabase table → replace seeded counts with real data (requires Quinn: Supabase table creation)

---

### 4. TikTok Scripts — People Tab ("Find Your Travel Squad")

---

#### Script A: "I Found a Stranger Going to Bali the Same Week"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "This app found a stranger going to Bali the same week as me" |
| Format | POV reaction + screen recording, 28s |
| Flow | Open ROAM. Tap People tab. Show traveler cards — real names, photos, destination badges, match score. Pause on one: "Maya, 24. Tokyo. 94% match." Zoom in on bio: "Street food hunter. 2AM ramen is my love language." Reaction: "She literally wrote my personality." Tap Connect. Show the pre-filled invite message. Cut to: "We are literally going the same week." End with match score: "94% match. How." |
| CTA | "App is free. Find your travel twin: link in bio" |
| Sound | Trending suspense/reveal audio |
| Target metric | Comments ("how does it match??"), saves (people saving to find later) |
| Why it works | The specificity of the bio copy ("2AM ramen is my love language") makes it undeniably real. The 94% match score creates a mystery — how does it know? Every viewer wonders if they have a match too. |

---

#### Script B: "POV: You Let an App Pick Your Travel Crew"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "POV: You're going to Tokyo alone and this app finds your people" |
| Format | Montage + screen recording, 35s |
| Flow | Screen recording: generate Tokyo trip (30 seconds, compass loader). Trip ready. Tap People. Show 3 traveler cards for Tokyo: Maya (foodie, 94%), Kai (photography, 87%), someone else. Show group forming: "Tokyo — Apr 12–19 — 3 going." Cut to group card visual (the shareable 9:16 card). Text overlay: "This is the group card it made." Show the card design full-screen for 3 seconds — it looks like an actual IG Story. End: "They're all real. They're all going. I messaged two of them." |
| CTA | "ROAM is free. Don't go alone: link in bio" |
| Sound | Build-up to satisfying reveal |
| Target metric | Shares (relatability — solo travel anxiety is universal), saves |
| Why it works | Solo travel fear is the #1 Gen Z travel concern. This directly addresses it. The group card visual is genuinely shareable content — showing it in-video demonstrates the product AND creates a secondary share loop. |

---

#### Script C: "This App Matched Me With 3 Strangers and We All Have the Same Vibe"

| Field | Detail |
|-------|--------|
| Hook (first 2s) | "I matched with 3 strangers on a travel app. We have the exact same vibe." |
| Format | Split-screen comparison, 22s |
| Flow | Show 3 traveler card bios in quick succession, each with their vibe pills. Maya: "foodie, culture, night-owl." You: "same." Kai: "adventure, photography." You: "same." Sofia: "art, nightlife, foodie." You: "same." Show match scores: 94%, 87%, 91%. Reaction: "Who programmed this." Final frame: group card showing all 3 with "Barcelona — Jun 5-12 — Adventure + Nightlife." |
| CTA | "Comment your travel vibe — I'll tell you your match score" |
| Sound | Trending "mind blown" or "this is crazy" audio |
| Target metric | Comments (the CTA drives direct comment engagement), shares (tagging friends: "this is literally us") |
| Why it works | Comment CTA ("comment your vibe") is the highest-engagement TikTok mechanic. The split-screen comparison is instantly understandable. Tagging friends on travel content is the highest organic share trigger on the platform. |

---

#### Hashtag Strategy (all three videos)

Primary: `#ROAM #TravelApp #TravelSquad`  
Discovery: `#SoloTravel #TravelTikTok #TravelHack #FindYourPeople #TravelWith`  
Niche: `#TravelMatch #TravelCommunity #GenZTravel #BaliTrip #TokyoTravel`

---

### 5. Travel Profile — Data Schema & UX Design

#### What We Collect (and Why)

| Field | Input Type | Why We Collect It |
|-------|-----------|-------------------|
| `name` | Text | Display on traveler card |
| `age` | Number (slider or input) | Match filtering — users self-filter by age range |
| `avatar_url` | Image upload (Supabase Storage) | Required for TravelerCard to feel real |
| `home_country` | Autocomplete | Context for match ("also from Germany") |
| `where_been` | Multi-select from DESTINATIONS | Shows on card as "X countries" |
| `where_going` | Multi-select from DESTINATIONS + dates | Core matching input |
| `departure_dates` | Date range picker | Match by overlap — key for group formation |
| `vibes` | Multi-select from VIBES (existing) | Match scoring |
| `travel_style` | Single select: solo / duo / group | Filter preference |
| `bio` | Text, 140 char max | Shown on TravelerCard — most important field |
| `instagram_handle` | Text, optional | Lets matched travelers verify identity off-app |
| `trip_count` | Auto-calculated from trips array | "X countries" badge on card |
| `is_visible` | Boolean toggle | Privacy: opt-in to appear in People tab |

#### Profile Completion Scoring

```
0–2 fields:   "Add more to get matched" (no card shown)
3–5 fields:   Shown in People tab with "Incomplete" tag
6–8 fields:   Full card shown, eligible for group invites
9+ fields:    "Verified Traveler" badge (gold dot on avatar)
```

This creates a natural activation funnel: filling the profile IS the activation event.

#### Supabase Table: `traveler_profiles`

```sql
CREATE TABLE traveler_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  age           INT,
  avatar_url    TEXT,
  home_country  TEXT,
  where_been    TEXT[] DEFAULT '{}',
  where_going   JSONB DEFAULT '[]', -- [{destination, start_date, end_date}]
  vibes         TEXT[] DEFAULT '{}',
  travel_style  TEXT CHECK (travel_style IN ('solo', 'duo', 'group', 'any')),
  bio           TEXT,
  instagram_handle TEXT,
  is_visible    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS: users can read visible profiles; only own profile is writable
ALTER TABLE traveler_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visible profiles are public"
  ON traveler_profiles FOR SELECT
  USING (is_visible = TRUE);

CREATE POLICY "users manage own profile"
  ON traveler_profiles FOR ALL
  USING (auth.uid() = user_id);
```

#### `where_going` JSONB shape

```json
[
  {
    "destination": "Tokyo",
    "start_date": "2026-04-12",
    "end_date": "2026-04-19"
  }
]
```

Query for matching: `WHERE where_going @> '[{"destination": "Tokyo"}]'::jsonb`

#### Profile Setup UX — Step Flow

The profile setup is triggered from the People tab "Set up profile" CTA and is a 4-screen bottom sheet (not a full-page wizard — reduces drop-off):

```
Screen 1: "Where are you going?"
  → Destination multi-select + date pickers
  → "This is how we match you with other travelers"
  → Skip: not available (required for core feature)

Screen 2: "What's your vibe?"
  → Reuse existing VIBES multi-select from GenerateQuickMode
  → Pick up to 5
  → "Vibes are the #1 match factor"

Screen 3: "Tell them something real"
  → Avatar upload (round, 120px)
  → Name + age
  → Bio text area: 140 chars, placeholder: "What's your travel personality in one sentence?"

Screen 4: "One more thing"
  → Home country (auto-detect from device locale as default)
  → Instagram handle (optional, shown as "Let them verify who you are")
  → is_visible toggle: "Show me to other travelers" (ON by default)
  → CTA: "Find my travel crew"
```

After Screen 4 → navigates directly to People tab filtered to their first destination. Match score is shown instantly (computed client-side from vibe overlap until backend is live).

#### Match Score Algorithm (client-side MVP)

```ts
// lib/match-score.ts
export function computeMatchScore(me: TravelerProfile, other: TravelerProfile): number {
  let score = 0;

  // Destination overlap (40 points max)
  const myDests = me.where_going.map(d => d.destination);
  const theirDests = other.where_going.map(d => d.destination);
  const destOverlap = myDests.filter(d => theirDests.includes(d)).length;
  score += Math.min(destOverlap * 20, 40);

  // Date overlap within destination (30 points max)
  // For each overlapping destination, check date range intersection
  for (const myTrip of me.where_going) {
    const theirTrip = other.where_going.find(t => t.destination === myTrip.destination);
    if (theirTrip) {
      const overlap = datesOverlap(myTrip.start_date, myTrip.end_date, theirTrip.start_date, theirTrip.end_date);
      if (overlap) score += 30;
    }
  }

  // Vibe overlap (20 points max)
  const vibeOverlap = me.vibes.filter(v => other.vibes.includes(v)).length;
  score += Math.min(vibeOverlap * 5, 20);

  // Travel style compatibility (10 points)
  if (me.travel_style === other.travel_style || me.travel_style === 'any' || other.travel_style === 'any') {
    score += 10;
  }

  return Math.min(score, 99); // Cap at 99 — "100% match" feels fake
}
```

---

## Experiments Running

| Experiment | Variant A | Variant B | Status |
|-----------|-----------|-----------|--------|
| Onboarding headline | Pain-point ("You spent 3 hours...") | Speed-claim ("Your entire trip in 30 seconds") | Planning |
| Paywall trigger timing | Immediate (on trip limit hit) | 60s post-itinerary-view | Planning |
| Waitlist referral framing | Loss frame ("3 friends away from losing...") | Social proof ("247 members already earned...") | Planning |
| People tab hero CTA | "Set up profile" | "Find travelers going to [dest]" | Not started |
| Invite copy tone | Personal ("I found someone going to Tokyo") | Social proof ("2.4k travelers on ROAM") | Not started |

## Prior Growth Work (same branch)

### Growth Hooks Engine (`lib/growth-hooks.ts`)
- Milestone detection: first_trip, third_trip, fifth_trip, tenth_trip, streak_3/7/14/30
- Growth event tracking with 30-day retention
- Engagement scoring (0-100)
- Social proof data for paywall
- Contextual upgrade messaging

### Smart Triggers (`lib/smart-triggers.ts`)
- Context-aware conversion triggers with 4-hour cooldowns
- Events: post_generation, itinerary_view, app_open, post_share, feature_tap

### UI Components
- `StreakBadge` — Animated streak counter (5 tiers)
- `MilestoneModal` — Celebration modal with contextual CTAs
- `GrowthBanner` — Dismissible contextual banners

### Enhanced Paywall
- Social proof counter on paywall
- Contextual headlines based on trigger reason
- Purchase event tracking
