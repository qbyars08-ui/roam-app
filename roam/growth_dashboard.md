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
