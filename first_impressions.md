# First Impressions Audit — March 16, 2026

## The 10-Second Test

A stranger opens ROAM for the first time on iOS. Here is what happens:

1. Native splash screen (system-level) appears while fonts and auth session load.
2. A cinematic screen fades in — a Tokyo photo background, the word ROAM in gold at 80pt, and the tagline "Go somewhere that changes you." There is a subtle radial glow behind the logo. This lasts about 2.4 seconds and auto-advances.
3. The Hook screen appears — a full-screen travel hero photo, Ken Burns zoom-out, the headline "Travel like you know someone there", a subline, a gold "Build my first trip" CTA button, and a dim "Browse first" text link beneath it.
4. If the user taps "Build my first trip" they land on an onboarding flow with 3 steps (travel style, priorities, budget), each with photo-background option cards.
5. After the 3rd selection, confetti fires and they are dropped onto the main tab bar — Plan tab first.
6. The Plan tab, on a fresh install with no trips, shows the GenerateModeSelect screen — a centered "Where are you going?" headline with two option cards: Quick Mode (30-second trip) and Conversation Mode.

**Feeling in 10 seconds:** The splash and hook screens are genuinely good — cinematic, confident, editorial. If the background photo loads (it depends on network), this makes a strong first impression. If the photo fails to load, the user stares at a near-black screen with just the logo. That is a real risk.

**Clarity of action:** The "Build my first trip" button is clear. The "Browse first" option is available but easy to miss — it is pale, small, positioned at the bottom edge. That is intentional friction for unauthenticated use, which is appropriate.

---

## Screen-by-Screen Findings

### Screen 1: Splash (app/(auth)/splash.tsx)

**What works:**
- The ROAM wordmark at 80pt in gold Cormorant Garamond is striking.
- The spring animation on the logo scale feels premium.
- The "Browse first" fallback gracefully enters guest mode if anonymous auth fails — good defensive coding.

**What breaks or risks breaking:**
- The background image is fetched from `getDestinationPhoto('tokyo')` at runtime. On a slow or offline network at first launch, the user sees a plain dark screen with just the wordmark. There is no blurhash or static fallback image. The cinematic effect simply does not exist if the image fails.
- The screen auto-advances after 2.4 seconds with no user interaction. If the network call to `assignOnboardingVariant()` (Supabase) is slow, the redirect to `/(auth)/hook` fires before it completes — the `.catch(() => {})` silently swallows any error, so the user never knows, but the A/B test data is unreliable.
- There is a duplicate "Browse first" entry point here AND on the Hook screen. A first-time user who taps it on the splash gets taken directly to tabs, bypassing the Hook screen entirely. The Hook screen has better copy and a stronger CTA. The splash-level bypass undercuts it.

**Trust signal:** Moderate. Looks like a real product. Feels intentional.

---

### Screen 2: Hook (app/(auth)/hook.tsx)

**What works:**
- "Travel like you know someone there" is the best line in the entire app. It earns attention.
- "AI-powered itineraries that feel like they came from a well-traveled friend, not a search engine." — clear value proposition, no jargon.
- The Ken Burns zoom on the background is a nice touch.
- The gold button is prominent and correctly sized (56pt height).

**What breaks:**
- Same image-loading risk as splash — `getDestinationPhoto('travel')` called at runtime. No fallback.
- The subline reads "AI-powered itineraries that feel like they came{'\n'}from a well-traveled friend, not a search engine." — there is a raw `{'\n'}` line break that may render incorrectly depending on the rendering context. On native it probably works, but it is a fragile pattern.
- The "Browse first" button here uses `t('auth.browseFirst')` from i18n, but the primary CTA text "Build my first trip" is hardcoded in English. This inconsistency will matter once non-English users arrive.

**Trust signal:** High. This is the strongest screen in the app.

---

### Screen 3: Onboarding (app/(auth)/onboarding.tsx)

**What works:**
- The 3-question format is fast. 3 taps and you are through.
- Option cards with background photos make choices feel emotionally resonant.
- Confetti on completion is a good dopamine hit.
- Progress bar with glow effect clearly shows "1/3, 2/3, 3/3".

**What breaks:**
- After completing all 3 steps and triggering confetti, `handleConfettiComplete` navigates to `/(tabs)` — but the Plan tab (first visible tab) will show `GenerateModeSelect`. The confetti celebration fires and then the user lands on a screen that says "Where are you going?" as if nothing happened. The personalization data collected (travel style, priorities, budget) is saved to AsyncStorage but not visibly reflected anywhere in the Plan tab or GenerateModeSelect copy. The user has no idea their answers mattered.
- The `Skip` link on the onboarding sets `ONBOARDING_COMPLETE` and routes to `/(tabs)` with zero personalization applied. A user who skips gets the same generic experience as a user who answered. The skip path undermines the entire value of asking.
- The `saveLocalPrefs(inferred)` call happens but nothing in the immediate post-onboarding screens uses it visibly.

**Trust signal:** Moderate. Fun to complete, but the payoff is invisible.

---

### Screen 4: GenerateModeSelect / Plan Tab — First Visit (components/generate/GenerateModeSelect.tsx, app/(tabs)/plan.tsx)

**What works:**
- "Where are you going?" headline at 40pt italic is the right question.
- The two-card layout (Quick Mode vs Conversation Mode) is clear.
- The subtitle on first visit is honest and specific: "In 30 seconds you'll have a full trip plan with real restaurants, real directions, and real costs."
- Both cards show destination + price indicators — the product description manages expectations.

**What breaks:**
- The `GenerateModeSelect` card subtitles are pulled from i18n keys `t('generate.quickModeDesc')` and `t('generate.conversationModeDesc')`. If these translation keys are missing or empty, the cards show blank descriptions. There is no fallback text.
- "Quick Mode" and "Conversation Mode" are the card titles (from i18n). These are functional labels, not emotionally compelling choices. A stranger does not know what "Conversation Mode" means without reading the fine print.
- The flow from onboarding to this screen has no bridge. There is no "Welcome, Quinn. We built this around how you travel" moment. The onboarding data evaporates into silence.

**Trust signal:** Moderate-high. The promise is bold and specific. The execution is neutral.

---

### Screen 5: Plan Tab — After First Trip Generated

**What works:**
- The NextTripHero card with a full-bleed destination photo, tagline, and quick-link pills (Before You Land, Health Brief, Emergency Card) is genuinely impressive.
- The gradient overlay on trip cards is well-executed.
- Social proof nudge ("247 people are planning Tokyo this month") is present and believable.

**What breaks:**
- The "Before You Land" pill navigates to `/before-you-land`, which is wrapped in `withComingSoon`. On native v1.0, this shows a Coming Soon screen. A user who just generated their first trip and taps the most prominent action button in the hero card immediately hits a dead end. This is a critical first-impression failure.
- The "Health Brief" pill navigates to `/(tabs)/body-intel`, which IS in the V1 core routes and should work.
- The "Emergency Card" pill navigates to `/emergency-card`, which IS in V1 core routes and should work, but the screen itself has internal "coming soon" text in a fallback display.
- The social proof count from `getDestinationCount()` is a seeded pseudo-random number, not real data. The code comment in `lib/social-proof.ts` explicitly acknowledges this: "it's a projection until live data is available." If a user researches the app or compares counts across sessions, the fiction is discoverable.
- The quick-link row (Compatibility, Passport, Wrapped, What if?) only appears after the user has trips. Compatibility and Passport both navigate to `withComingSoon`-wrapped screens and will show Coming Soon on native. Wrapped also uses `withComingSoon`. Three of the four quick links are dead ends on native.

**Trust signal:** Low after a trip is generated and the user starts tapping things.

---

### Screen 6: Discover Tab (app/(tabs)/index.tsx)

Note: The Discover tab (`app/(tabs)/index.tsx`) is hidden from the tab bar — `href: null` in the tabs layout. It is routable but not tab-navigable. New users do not see it unless they are routed there directly. This analysis covers it because it is the default `/(tabs)` landing point before the tab bar takes over, but in practice the first visible tab is Plan.

**What works:**
- The editorial rotating headers (crossfade every 5 seconds) give the app a magazine personality.
- The "For You" horizontal scroll of personalized picks populates quickly via `getForYouFeed`.
- The "What if I just went?" empty-state prompt for users with no trips is inviting.
- The TravelTruthCard section adds editorial value.
- Destination cards have resilient fallback colors when images fail.

**What breaks:**
- The search bar is a fake input — it is a `Pressable` over a `Text` element styled to look like an input field. Tapping it routes to `/(tabs)/generate`. On native, `/(tabs)/generate` is in V1 core routes, so this should work. But visually the fake input is slightly deceptive — users expect to type.
- The `source.unsplash.com` URL pattern used as fallback in `getUnsplashUrl()` is deprecated by Unsplash. Requests to `source.unsplash.com` return 301 redirects or errors depending on the client. Destination cards may show placeholder fallback colors instead of photos.
- The context-aware banner (`ContextBanner`) only appears if `contextStrategy?.contextBanner` is non-null after `getContext()` resolves. New users with no behavioral data will never see it, which is correct. But the code path assumes the async `getContext()` call succeeds silently — if it throws, the banner never appears and no error surface exists.
- The quick-links row (Compatibility, Passport, Wrapped, What if?) only renders when `trips.length > 0`. A new user on their first visit sees none of these. Good — they are not relevant yet. But after generating a trip, three of four links are Coming Soon on native (same issue as Plan tab).

**Trust signal:** High visually. Photo grid with editorial copy reads like a real product.

---

### Screen 7: Prep Tab (app/(tabs)/prep.tsx)

The Prep tab is notable because it is wrapped in `withComingSoon`. It IS listed in V1 core routes (`'prep'`), so the gate should not fire on native. However, the internal `// Stub: no audio implementation` comment on line 884 indicates at least one feature within Prep silently does nothing.

---

## Critical Fixes (must fix before first real user)

1. **Before You Land is a dead end on native.** The hero card on Plan tab after a trip is generated has "Before You Land" as the top-priority pill. It routes to `withComingSoon` on native. A user's first tap after their first trip hits a dead end. Either remove this pill from the hero card for v1.0 or add `before-you-land` to `V1_CORE_ROUTES`. It is already listed there — re-verify the feature flag check is working at runtime.

2. **Three of four Discover quick-links are Coming Soon on native.** Compatibility, Passport, and Trip Wrapped all use `withComingSoon`. These links appear on the Discover tab for users with trips. Tapping them shows a dead end. Remove these links from the discover quick-link row entirely for v1.0, or replace them with links that actually work.

3. **Splash and Hook screens have no image fallback.** On slow networks, the user sees a near-black screen. Use a static bundled image as a fallback, or add a `defaultSource` prop, or at minimum ensure the dark gradient alone is intentional and the layout does not collapse without the photo.

4. **Onboarding personalization is invisible after completion.** Three questions are asked, answers are saved, and then... nothing. The first screen after onboarding is generic. The word "personalized" is not justified if the output is identical regardless of answers. At minimum, the GenerateModeSelect headline after onboarding should reference what was collected: "You travel solo. Let's find something worth the trip."

5. **Social proof counts are fabricated.** `getDestinationCount()` returns seeded fake numbers with a comment in the source acknowledging it is a placeholder "until live data is available." Showing a user "247 people are planning Tokyo this month" when it is deterministic math is misleading. Remove this number display until real data exists, or label it clearly as an estimate.

6. **The search bar on Discover is a fake input.** It looks like a text field but does not accept input. This is a common dark pattern. Replace with a real `TextInput` or make the visual design unambiguously a button (not an input field).

---

## Quick Wins (fix in under 30 minutes each)

1. **Add a static bundled fallback image for splash and hook.** Pick one strong travel photo, bundle it as an asset, use it as `defaultSource` on the `ImageBackground`. 20 minutes.

2. **Remove Compatibility, Passport, and Wrapped from the Discover quick-links row on native.** Conditionally render them only when `!isV1Mode()`. 10 minutes.

3. **Hardcode the "Build my first trip" button text in i18n** to match the rest of the hook screen. Fix the raw `{'\n'}` in the subline — use `lineHeight` styling instead. 10 minutes.

4. **Remove the duplicate "Browse first" from the splash screen.** The Hook screen has better copy and a clearer context for that choice. Having it on the splash screen (before any value has been shown) just gets users into guest mode before they understand what they are bypassing auth for. 5 minutes.

5. **Add a one-line bridge between onboarding completion and the Plan tab.** After confetti, replace the `GenerateModeSelect` headline with a personalized line. Store the first onboarding answer in the Zustand store and use it. "Solo trips, big food, no nonsense. Where are you going?" 20 minutes.

6. **Replace `source.unsplash.com` fallback URLs with direct Unsplash photo IDs** (which use the stable `/photo/` CDN endpoint). The `source.unsplash.com` hostname is deprecated and produces unreliable results. 15 minutes.

7. **Add the `'pulse'` tab to V1_CORE_ROUTES verification.** The Pulse tab is eager-loaded and expected to work. Verify no inner components inside Pulse use `withComingSoon` or render Coming Soon text for new users without trips.

---

## The Verdict

ROAM is not ready for strangers yet. The first 30 seconds — splash, hook, onboarding — are strong. The design language is distinctive. The copy is better than 90% of travel apps. The editorial aesthetic is real.

The problem is everything that happens after a user generates their first trip. The hero card offers three quick-link pills. One of them (Before You Land) hits a Coming Soon gate. The Discover quick-links hit Coming Soon. The social proof numbers are fake. The onboarding personalization produces no visible output.

The pattern is: the app makes promises with its UI, and then fails to keep them on the first tap. That is the thing that makes people delete apps.

The core trip generation flow — entering a destination, choosing a mode, generating an itinerary — appears functional based on code review. If that works reliably, it is the one thing that can save a first impression. Get a user to a generated itinerary fast, and make sure every button on that itinerary works. Right now they do not all work.

Minimum bar for first real users: fix the dead-end quick-links on the trip hero card and the Discover tab. Everything else is forgivable. Tapping a button and seeing "Coming Soon" is not.
