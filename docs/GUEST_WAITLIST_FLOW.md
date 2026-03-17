# Guest + Waitlist Growth Loop

## Overview

Web visitors at **roamapp.app** can generate 1 trip as a guest without signing in. After the trip generates, a modal captures their email for the waitlist and gives them a referral link.

## Flow

1. **Guest visits** roamapp.app (optionally with `?ref=CODE` or `?email=xxx`)
2. **Splash → Hook → Onboard**: They pick a destination, AI generates a real trip
3. **Modal**: "Save this trip and get early access" — email input
4. **Submit**: Adds to `waitlist_emails`, generates referral code, shows "You're #X on the waitlist"
5. **Share**: Copy/share referral link — "Share with 3 friends → unlock Pro free for 1 month"
6. **View trip**: Anonymous sign-in, navigate to itinerary

## Referral Integration

- `?ref=CODE` on page load → stored in localStorage, used when they submit email
- Referrer is credited when:
  - **Signed-in referrer**: Credited when referred user signs up (`credit_referrer_on_signup`)
  - **Waitlist referrer**: Credited immediately when referred user joins waitlist (trigger)

## Waitlist Page (roamappwait.netlify.app)

- **Nav**: "Try the app now →" links to roamapp.app
- **Success state**: After joining, "Try the app now →" with email in URL (so they don't enter twice)

## Supabase Migration

Run before using the guest flow:

```bash
cd roam
supabase db push
# Or apply manually: supabase/migrations/20260320_waitlist_referral_codes.sql
```

Adds to `waitlist_emails`:
- `referral_code` (auto-generated from email)
- `referral_count` (for waitlist-to-waitlist referrals)

## Deploy

```bash
npm run deploy:web
```

Or manually:
```bash
npx expo export --platform web
echo '/*    /index.html   200' > dist/_redirects
netlify deploy --prod --dir=dist
```
