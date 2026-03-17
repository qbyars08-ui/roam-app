# NEXT SESSION PROMPT — ROAM Sprint 2

Read MASTER_PROMPT.md first. Then this.

## Context
Phase 1-4 are complete:
- CRAFT mode is default, paywall works, Sonar has timeouts
- Every card is tappable and links to destination hub
- Push notifications, offline itinerary, deep links built
- Trip Wrapped shareable, ROAMer count live
- Copy audited, empty states polished

## This Session: The 2000-User Sprint

The goal is 2000 real users generating real trips and 50 paying $6.99/month.
That's $350/month MRR from this sprint alone.

Everything below serves that goal. If it doesn't get users, get shares, or get payments: skip it.

---

## BLOCK 1: The Demo Video (ship first, everything else depends on it)

Build a screen recording flow that shows ROAM in 30 seconds:
1. Open app cold → DREAMING state hero
2. Tap "Plan Together" → CRAFT conversation starts
3. Type "Tokyo, 5 days, foodie" → AI responds
4. Itinerary generates → scroll through days
5. Tap a restaurant → real photo, rating, Google Maps link
6. Swipe to Pulse → "Right now in Tokyo" with live data
7. End card: "ROAM — the only travel app you need. roamapp.app"

This video goes on:
- Twitter/X (Quinn's Young Bull account)
- TikTok (vertical, fast cuts)
- Instagram Reels
- Reddit r/travel, r/solotravel, r/digitalnomad
- Product Hunt (launch day)
- Hacker News (Show HN)

Create the end card as a React component: `components/marketing/DemoEndCard.tsx`
- Black bg, "ROAM" in Space Grotesk 72px
- "The only travel app you need." in Inter 18px cream
- "roamapp.app" in DM Mono sage
- QR code linking to roamapp.app (use react-native-qrcode-svg or static image)

## BLOCK 2: Onboarding That Converts (the funnel)

Current: new user lands on DREAMING hero.
Problem: no context, no guidance, no hook.

Build `app/onboarding.tsx` — 3 slides, full screen, swipeable:

Slide 1: "Where do you want to go?"
- Large text input, auto-focus
- Below: 6 destination photo chips (Tokyo, Bali, Paris, Barcelona, NYC, Bangkok)
- Tap a chip → fills the input
- This captures intent immediately

Slide 2: "ROAM builds your entire trip in 30 seconds."
- Animated mockup of itinerary generating
- "Real restaurants. Real prices. Real weather."
- "Not a template. Built for you."

Slide 3: "Your first trip is free."
- Big sage button: "Plan my [destination] trip"
- Small text: "No credit card needed"
- Tap → goes directly to CRAFT mode with their destination pre-filled

Store `hasSeenOnboarding` in AsyncStorage. Show once.

After onboarding completion: track `onboarding_completed` event in PostHog with destination choice.

## BLOCK 3: SEO Landing Pages (free traffic)

Build `marketing/destinations/` — static HTML pages for top 50 destinations.
Each page:
- Title: "Tokyo Travel Guide 2026 — ROAM"
- H1: "Everything you need to know about Tokyo"
- Content: Pull from Sonar API at build time (cache forever)
- Sections: weather, costs, safety, visa, neighborhoods, food, transport
- CTA: "Plan your Tokyo trip in 30 seconds → roamapp.app"
- Schema.org markup for rich Google snippets

These pages rank on Google for "[city] travel guide 2026" and drive organic traffic to ROAM.

Deploy to roamapp.app/guide/tokyo, roamapp.app/guide/bali, etc.

Build a generator script: `scripts/generate-seo-pages.ts`
- Reads a list of 50 destinations
- For each: calls Sonar API for content
- Generates a static HTML file
- Outputs to `marketing/destinations/[city].html`

## BLOCK 4: Referral System (viral growth)

Build `lib/referral.ts`:
- `generateReferralCode(userId)` — creates unique code, stores in Supabase `referral_codes` table
- `applyReferralCode(code, newUserId)` — gives both users 3 bonus trips
- `getReferralStats(userId)` — returns { referrals: number, bonusTrips: number }

Supabase migration:
```sql
CREATE TABLE referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  code text unique not null,
  uses integer default 0,
  created_at timestamptz default now()
);
CREATE TABLE referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references referral_codes not null,
  redeemed_by uuid references auth.users not null,
  created_at timestamptz default now()
);
```

Wire into profile screen:
- "Share ROAM" section with unique referral link
- "You've referred [X] friends" counter
- Share button: `Share.share({ message: 'Plan your next trip in 30 seconds. Use my code [CODE] for 3 free trips. roamapp.app' })`

## BLOCK 5: Social Proof Engine (trust)

Build real-time social proof throughout the app:

1. **Generation counter** — Supabase RPC function that returns total trips generated:
   `SELECT count(*) FROM trips` — display in plan tab hero: "[X] trips planned on ROAM"

2. **Live activity feed** — Already partially built in Pulse. Enhance with real Supabase data:
   - "[Name] just planned a trip to [destination]" (real, anonymized)
   - Query: last 10 trips, show destination only, rotate every 5 seconds

3. **Destination popularity** — On destination page:
   - "[X] ROAMers planned [destination] this month"
   - "Trending: +[X]% vs last month"

4. **Review/testimonial section** — In onboarding slide 2 or plan tab:
   - 3 real quotes from beta testers
   - Profile photo + name + destination
   - Rotating carousel

## BLOCK 6: Email Capture + Drip (retention)

Build `lib/email-capture.ts`:
- After first trip generation, show a bottom sheet: "Get your itinerary by email"
- Email input + "Send" button
- Calls Supabase edge function that stores email and sends itinerary PDF via Resend/SendGrid

This does three things:
1. Captures email for marketing
2. Gives user a reason to come back (email has app link)
3. Makes the trip feel real ("I got an email with my Tokyo itinerary")

## BLOCK 7: App Store Submission

Read docs/APP_STORE_CHECKLIST.md for the full list.

Critical path:
1. `eas build --platform ios --profile production`
2. Upload to App Store Connect
3. Screenshots (6.7" and 5.5") — generate from the demo video frames
4. Description, keywords, categories (use app-store-aso skill)
5. Privacy policy at roamapp.app/privacy
6. Submit for review

Target: live on App Store within 1 week of this session.

## BLOCK 8: Analytics + Conversion Tracking

Ensure PostHog tracks these critical events:
- `trip_generated` — with destination, mode (quick/craft), duration
- `paywall_shown` — when free limit hit
- `paywall_converted` — when payment succeeds
- `trip_shared` — when user shares wrapped/itinerary
- `referral_shared` — when user shares referral link
- `onboarding_completed` — with destination choice
- `destination_viewed` — which destinations get the most views

Build a conversion funnel in PostHog:
onboarding → first_trip → second_trip_attempt → paywall → payment

## Success Metrics for This Sprint

| Metric | Target | How |
|--------|--------|-----|
| App installs | 2,000 | Demo video + Reddit + Product Hunt |
| Trips generated | 5,000 | Onboarding funnels to instant generation |
| Paying users | 50 | Paywall after 1 free trip |
| MRR | $350 | 50 × $6.99 |
| Share rate | 10% | Trip Wrapped + referral incentives |
| D7 retention | 30% | Daily brief notifications + email drip |

## Priority Order

1. Demo video end card + recording (everything depends on distribution)
2. Onboarding flow (converts installs to trips)
3. Referral system (viral loop)
4. SEO landing pages (free traffic forever)
5. Email capture (retention)
6. App Store submission (real distribution)
7. Social proof (trust)
8. Analytics funnel (measure everything)

## Rules
- NEVER touch pillpal
- NEVER TypeScript errors
- NEVER deploy without "deploy" command
- NEVER generic copy
- ALWAYS test locally with preview_start before deploying
- ALWAYS ask: does this get a user, a share, or a payment?
