# ROAM Pre-Launch Checklist

_Audited March 2026 by reading actual source files — checked boxes are verified in code._

---

## Technical

### Core Generate Flow

- [x] generate.tsx wires up both quick and conversation modes end to end
- [x] generateItineraryStreaming() called with full param set (destination, days, budget, vibes, pace, dietary, transport, etc.)
- [x] Itinerary validated before being stored (`!itinerary?.destination || !itinerary?.days?.length` guard present)
- [x] Trip added to Zustand store and persisted to AsyncStorage on success
- [x] tripsThisMonth counter updated from server response after each generation
- [x] TripGeneratingLoader overlay shown during generation with streaming status text
- [x] Error banner displayed on network failure with human-readable message
- [x] Rate-limit modal shows when TripLimitReachedError is thrown, routes to paywall
- [x] Guest mode capped at 1 trip total; free authenticated users capped at FREE_TRIPS_PER_MONTH
- [x] plan.tsx mirrors the same generate logic (duplicate implementation — not a blocker but a maintenance risk)

### Auth

- [x] Email/password sign-in and sign-up working via Supabase (signin.tsx)
- [x] Apple Sign-In implemented via expo-apple-authentication (signup.tsx, iOS only)
- [x] Google OAuth implemented via supabase.auth.signInWithOAuth (signup.tsx)
- [x] Guest/anonymous mode via supabase.auth.signInAnonymously with offline fallback
- [x] Terms and Privacy links shown on signup screen
- [ ] Google OAuth redirect URL confirmed working on device (web only in current code — needs native deep link testing with roam:// scheme)
- [ ] Apple Sign-In tested on a physical iOS device (simulator does not support it)

### Paywall / Monetization

- [x] PaywallScreen implemented with annual/monthly toggle, feature list, social proof counter, and free trial CTA
- [x] RevenueCat integrated via react-native-purchases; getOfferings(), purchasePro(), purchaseGlobal(), restorePurchases() all present
- [x] API keys loaded from env vars (EXPO_PUBLIC_REVENUECAT_IOS_KEY, EXPO_PUBLIC_REVENUECAT_ANDROID_KEY) — not hardcoded
- [x] Pro status synced to Supabase after purchase via syncProStatusToSupabase()
- [x] Restore purchases button present and functional
- [x] TripLimitBanner shown on generate screens for non-pro users with remaining count
- [x] ProGate component exists for feature-level gating
- [ ] RevenueCat products ("pro_monthly", "global_annual") confirmed created in RevenueCat dashboard
- [ ] EXPO_PUBLIC_REVENUECAT_IOS_KEY set in production EAS build environment (eas.json env block exists but keys are empty in example)
- [ ] 3-day free trial confirmed configured on the product in App Store Connect (CTA says "Start your 3-day free trial" — must match what's set in ASC)

### Waitlist

- [x] WaitlistCaptureModal exists and calls joinWaitlist()
- [x] joinWaitlist() inserts to waitlist_emails table via Supabase
- [x] Referral code returned after signup, shareable URL constructed
- [x] Modal shown to guest users who hit the paywall
- [ ] waitlist_emails table confirmed exists in production Supabase (migration must be applied)
- [ ] Referral position counter verified accurate (pulls from waitlist_emails count)

### Affiliate Links

- [x] BookingCards component present, shown on itinerary screens
- [x] Four partners configured: Skyscanner, Booking.com, GetYourGuide, Rentalcars.com
- [x] Links built dynamically using destination name with UTM params (utm_source=roam)
- [x] Click tracking to affiliate_clicks Supabase table implemented
- [ ] Affiliate IDs are placeholder strings ("roam", "associateId=roam", "partner_id=roam") — these are NOT real affiliate IDs. Actual program enrollments needed for Skyscanner Partner API, Booking.com Affiliate Partner Programme, GetYourGuide Partner Portal before revenue is tracked
- [ ] affiliate_clicks table confirmed in production Supabase

### Edge Function / Backend

- [x] claude-proxy edge function verifies JWT before calling Claude API
- [x] ANTHROPIC_API_KEY read from Deno.env (not hardcoded)
- [x] Free tier check (1 trip/month) enforced server-side with monthly reset logic
- [x] Trip count incremented server-side after successful generation
- [ ] ANTHROPIC_API_KEY set in Supabase edge function secrets for production
- [ ] Edge function deployed to production Supabase project (not just local)

### Feature Flags / Coming Soon Gates

- [x] withComingSoon HOC implemented; gates non-core routes on native builds
- [x] V1_CORE_ROUTES set defined — core tabs (plan, generate, people, flights, prep, itinerary, paywall, privacy, terms, support, referral) are unlocked
- [x] prep.tsx is in V1_CORE_ROUTES but also uses withComingSoon — it will render on native
- [x] Features gated as coming soon on native: airport-guide, visited-map, travel-card, travel-time-machine, travel-twin, main-character, travel-persona, chaos-mode, layover (NOTE: layover is also in V1_CORE_ROUTES — flag conflict to review)
- [ ] Verify no coming-soon gated screen is accessible via deep link bypass

### Loading States

- [x] TripGeneratingLoader (compass animation) used for trip generation
- [ ] Multiple screens still use bare ActivityIndicator (travel-time-machine, people, group, destination/[name], before-you-land, travel-mirror) — acceptable for v1 but inconsistent with design system. Consider SkeletonCard for data-loading states.

### Error Messages

- [x] Network error fallback: "Couldn't reach our servers — probably a WiFi thing. Give it a sec and try again."
- [x] Incomplete itinerary error: "Almost had it — the trip came back a little incomplete. One more try should do it."
- [x] Auth errors use human language ("That didn't work", "Almost there")
- [x] Purchase error: "Purchase didn't go through. Check your connection and try again."
- [x] Waitlist error: "Couldn't join the waitlist. Check your connection and try again."

### Console / Code Issues

- [ ] plan.tsx and generate.tsx contain near-duplicate trip generation logic — not a blocker but increases maintenance surface
- [ ] local-lens.tsx has user-visible "Local intel coming soon for {city}" string
- [ ] made-for-you.tsx has user-visible "Restaurant recommendations coming soon" and "Nightlife recommendations powered by Google Places coming soon" strings
- [ ] group.tsx has user-visible "Full map view coming soon" string — verify this is intentional for v1

### Placeholder / Stub Text

- [x] No lorem ipsum found in tsx files
- [x] Input placeholder text (form fields, text inputs) is functional and descriptive — not lorem ipsum
- [ ] local-lens.tsx fallback message contains literal city variable in string — review before launch

---

## Content

- [x] App Store listing copy written (APP_STORE_LISTING.md) — name, subtitle, description
- [x] Privacy Policy screen exists at app/privacy.tsx, linked to https://roamtravel.app/privacy
- [x] Terms of Service screen exists at app/terms.tsx, linked to https://roamtravel.app/terms
- [x] Support email configured (support@roamtravel.app) in app/support.tsx
- [x] App icon present (assets/icon.png)
- [x] Splash screen asset present (assets/splash-icon.png)
- [x] Android adaptive icons present (foreground, background, monochrome PNGs)
- [ ] App Store screenshots not created — docs/APP_STORE_SCREENSHOTS.md spec exists but no PNG assets in repo; 6 screenshots at 1290x2796px required for submission
- [ ] roamtravel.app/privacy and roamtravel.app/terms confirmed live on production domain
- [ ] Support URL verified resolving before submission

---

## Legal

- [x] Privacy Policy exists in-app (app/privacy.tsx)
- [x] Terms of Service exists in-app (app/terms.tsx)
- [x] Terms and Privacy linked from signup screen
- [x] Terms and Privacy linked from welcome screen
- [x] Health disclaimer present in body-intel.tsx: "For informational purposes only. Always consult a doctor for medical advice."
- [x] body-intel.tsx file-level comment: "For informational purposes only — always consult a doctor for medical advice."
- [ ] prep.tsx: health/medical content is present but no visible disclaimer rendered to user — verify or add one
- [ ] Apple Sign-In requirement: if app offers third-party login (Google), Apple Sign-In is mandatory on iOS — confirmed present in signup.tsx but must be tested on device
- [ ] Subscription terms visible before purchase: CTA says "Then $X/year. Cancel anytime." — verify this satisfies Apple's auto-renewable subscription disclosure requirements
- [ ] EULA: App Store uses Apple's standard EULA unless a custom one is configured — confirm no custom EULA needed
- [ ] Affiliate disclosure: no disclosure that Booking.com, Skyscanner, GetYourGuide links are affiliate links — may be required depending on jurisdiction and Apple guidelines

---

## Distribution

_These items require Quinn's manual action and cannot be verified from code._

- [ ] Apple Developer account active and in good standing
- [ ] App Store Connect app record created with bundle ID com.roam.app
- [ ] ASC App ID filled in eas.json (currently empty string "")
- [ ] Apple Team ID filled in eas.json (currently empty string "")
- [ ] Android package name set in app.json (currently missing — bundleIdentifier is iOS only; need google-services.json or android.package field for Play Store)
- [ ] Production EAS build run and binary uploaded to App Store Connect
- [ ] RevenueCat iOS and Android apps created with correct bundle IDs
- [ ] RevenueCat "pro" entitlement configured with monthly ($9.99) and annual ($49.99) products
- [ ] Skyscanner, Booking.com, GetYourGuide, Rentalcars.com affiliate program applications submitted and IDs obtained
- [ ] ANTHROPIC_API_KEY set in Supabase production edge function secrets
- [ ] All Supabase migrations applied to production database
- [ ] PostHog project key set (captureEvent calls present throughout app)
- [ ] roamtravel.app domain pointing to production Netlify deploy
- [ ] App Store screenshots designed and uploaded (6 required, spec in docs/APP_STORE_SCREENSHOTS.md)
- [ ] App Store review notes prepared (sandbox test account credentials needed for reviewer)
- [ ] Age rating set in App Store Connect (travel content — likely 4+)
- [ ] App privacy label completed in App Store Connect (data collection: email, usage data, identifiers)

---

## Critical Blockers

These must be resolved before submitting to the App Store.

1. **ASC App ID and Apple Team ID empty in eas.json** — EAS submit will fail without these. Fill in before running `eas submit`.

2. **RevenueCat API keys not set in production build** — EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY are blank in .env.example. If they are not set in the EAS build environment or .env, the paywall will silently fail to load offerings and purchases will not work.

3. **Affiliate partner IDs are placeholders** — All four affiliate URLs use "roam" as the partner/associate ID. Until real affiliate program accounts are created and real IDs substituted, zero affiliate revenue will be earned and some links may be rejected by the partners.

4. **App Store screenshots not created** — Apple requires at least one screenshot per device size. The spec doc exists but no PNG files are in the repo. Submission will be blocked.

5. **Android package name missing from app.json** — There is no android.package field. The Play Store requires a unique package name distinct from the iOS bundle identifier convention. Add "package": "com.roam.app" under "android" in app.json before an Android build.

6. **Affiliate disclosure missing** — Showing booking links without any disclosure that they are affiliate links may violate Apple App Store guidelines (section 3.1.5) and FTC rules depending on geography. Add a one-line disclosure near the BookingCards component ("We may earn a commission on bookings" or similar).

---

## Nice to Have Before Launch

These are not blocking but would meaningfully improve quality or revenue.

- Deduplicate trip generation logic between generate.tsx and plan.tsx into a shared hook or utility to reduce maintenance risk
- Replace ActivityIndicator with SkeletonCard in data-loading screens (people.tsx, before-you-land.tsx, destination/[name].tsx) for design consistency
- Remove or replace "coming soon" user-visible strings in local-lens.tsx, made-for-you.tsx, and group.tsx with proper feature flags so users are not told something is coming soon inside screens they can already navigate to
- Verify the layover route flag conflict: layover is both in V1_CORE_ROUTES and wrapped with withComingSoon — the HOC will never gate it but the wrapping is confusing
- Add a medical disclaimer to prep.tsx (health content is present but no disclaimer is rendered, unlike body-intel.tsx which has one)
- Confirm Google OAuth deep link works on a physical device using the roam:// scheme — the current implementation uses signInWithOAuth which relies on a browser redirect back to the app
- Test Apple Sign-In on a physical iOS device before submitting
- Set up PostHog, analytics, and error monitoring for production before launch day so you have baseline data from the first install
