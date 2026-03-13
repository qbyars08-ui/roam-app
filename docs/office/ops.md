# ROAM — Operations Procedures

> Standard operating procedures for deploying, monitoring, and maintaining the ROAM platform. Covers web, native, Supabase, and third-party integrations.

*Last updated: 2026-03-13*

---

## Platform Overview

| Surface | Stack | URL / Distribution |
|---------|-------|--------------------|
| Web | Expo (React Native Web) on Netlify | https://tryroam.netlify.app |
| iOS | Expo + EAS Build | App Store (`com.roam.app`) |
| Android | Expo + EAS Build | Play Store (`com.roam.app`) |
| Backend | Supabase (Postgres + Edge Functions + Auth + Realtime) | Supabase Dashboard |
| AI | Anthropic Claude via `claude-proxy` edge function | Server-side only |
| Subscriptions | RevenueCat | RevenueCat Dashboard |

---

## Environments & Secrets

### Client Environment Variables

Set in `.env` locally and in **Netlify Dashboard > Environment Variables** for production.

| Variable | Required | Notes |
|----------|----------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (safe for client) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | Native | RevenueCat iOS SDK key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | Native | RevenueCat Android SDK key |
| `EXPO_PUBLIC_GOOGLE_PLACES_KEY` | Optional | Places autocomplete |
| `EXPO_PUBLIC_OPENWEATHER_KEY` | Optional | Client-side weather fallback |
| `EXPO_PUBLIC_AVIATIONSTACK_KEY` | Optional | Flight tracking |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Optional | Map tiles |
| `EXPO_PUBLIC_TICKETMASTER_KEY` | Optional | Events |
| `EXPO_PUBLIC_EVENTBRITE_TOKEN` | Optional | Events |
| `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` | Optional | Destination images |
| `EXPO_PUBLIC_VISA_API_KEY` | Optional | Visa requirements (RapidAPI) |
| `EXPO_PUBLIC_CLIMATIQ_KEY` | Optional | Carbon footprint |
| `EXPO_PUBLIC_AMADEUS_KEY` / `_SECRET` | Optional | Flight search |

### Supabase Edge Function Secrets

Set in **Supabase Dashboard > Project Settings > Edge Functions > Secrets**.

| Secret | Used By |
|--------|---------|
| `SUPABASE_URL` | All functions |
| `SUPABASE_ANON_KEY` | claude-proxy, enrich-venues, destination-photo |
| `SUPABASE_SERVICE_ROLE_KEY` | All functions (bypasses RLS) |
| `ANTHROPIC_API_KEY` | claude-proxy |
| `OPENWEATHERMAP_KEY` | weather-intel |
| `ELEVENLABS_API_KEY` | voice-proxy |
| `GOOGLE_PLACES_KEY` | enrich-venues, destination-photo |
| `REVENUECAT_WEBHOOK_SECRET` | revenuecat-webhook |

### CI/CD Secrets

Set in **GitHub > Settings > Secrets and variables > Actions**.

| Secret | Purpose |
|--------|---------|
| `NETLIFY_AUTH_TOKEN` | Netlify deploy from CI |
| `NETLIFY_SITE_ID` | Target Netlify site |

### Secret Safety Rules

- **Never** put private API keys in `EXPO_PUBLIC_` variables. Only the Supabase anon key and public-facing API keys are allowed.
- **Never** commit `.env` files. The repo includes `.env.example` as a template.
- Edge function secrets are managed exclusively through the Supabase Dashboard.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` immediately if exposed; it bypasses all RLS.

---

## Deployment Procedures

### Web (Netlify)

**Automatic:** Every push to `main` triggers `.github/workflows/deploy.yml`:

1. `npm install --legacy-peer-deps`
2. `npx tsc --noEmit` (type check)
3. `npx expo export --platform web` (build)
4. `npx netlify-cli deploy --prod --dir=dist`

**Manual:**

```
npm run deploy:web
```

This runs `build:web` then `netlify deploy --prod --dir=dist`. Requires `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` in the environment.

**Netlify configuration** (`netlify.toml`):

- Build command: `npx expo export --platform web` + SPA `_redirects` file
- Publish directory: `dist`
- SPA fallback: `/* -> /index.html` (200)
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CSP policy
- JS cache: `max-age=31536000, immutable` for `/_expo/static/js/*`

**Post-deploy verification:**

1. Visit https://tryroam.netlify.app
2. Confirm the app loads without blank screen
3. Test a guest flow: tap "Continue as guest", generate a trip
4. Check browser console for errors

### iOS (EAS Build)

```
eas build --platform ios --profile production
eas submit --platform ios
```

- `eas.json` production profile: store distribution, auto-increment `buildNumber`
- App ID: `com.roam.app`
- Entitlements: Apple Sign In, Associated Domains (`applinks:roamtravel.app`)
- EAS Project ID: `c19740b8-17b5-43c6-8156-35bacc2312dd`

### Android (EAS Build)

```
eas build --platform android --profile production
eas submit --platform android
```

- `eas.json` production profile: `app-bundle`, auto-increment `versionCode`

### Pre-Deploy Checklist

Run before every deploy:

- [ ] `npx tsc --noEmit` passes
- [ ] `npx expo export --platform web` succeeds
- [ ] No `sk-ant-` or `ANTHROPIC_API_KEY` in client code (CI scans for this)
- [ ] Bundle size < 15 MB (JS + fonts, uncompressed)
- [ ] `.env` not staged for commit
- [ ] All new Supabase tables have RLS policies using `auth.uid()`
- [ ] Feature flags updated in `lib/feature-flags.ts` if new routes added

---

## CI/CD Pipeline

### CI (`ci.yml`) — Runs on PR and push to `main`

| Job | What It Does | Blocks Merge |
|-----|-------------|--------------|
| TypeScript Check | `npx tsc --noEmit` | Yes |
| Web Build | `npx expo export --platform web` + bundle size check (15 MB limit) | Yes |
| Security Scan | Grep for leaked secrets + `npm audit --production` | Yes (secrets) / No (audit) |

### Deploy (`deploy.yml`) — Runs on push to `main`

| Step | Command |
|------|---------|
| Type check | `npx tsc --noEmit` |
| Build | `npx expo export --platform web` |
| Deploy | `npx netlify-cli deploy --prod --dir=dist` |

Concurrency: one deploy per ref; in-progress deploys are cancelled.

### Pre-Push Hook

The `pre-push` npm script runs `tsc --noEmit && npx expo export --platform web` locally before pushing.

---

## Supabase Edge Functions

### Function Inventory

| Function | Path | Auth | Purpose |
|----------|------|------|---------|
| `claude-proxy` | `supabase/functions/claude-proxy/` | Bearer JWT | Proxies AI requests to Anthropic; enforces free-tier trip limits (1/month) |
| `weather-intel` | `supabase/functions/weather-intel/` | None (public) | 7-day forecast via OpenWeatherMap One Call 3.0 |
| `voice-proxy` | `supabase/functions/voice-proxy/` | Bearer JWT | ElevenLabs text-to-speech |
| `enrich-venues` | `supabase/functions/enrich-venues/` | Bearer JWT | Google Places search + details; caches in `venues` table |
| `destination-photo` | `supabase/functions/destination-photo/` | Bearer JWT | Destination photos via Google Places; caches in `venues` |
| `revenuecat-webhook` | `supabase/functions/revenuecat-webhook/` | Bearer webhook secret | Syncs subscription status to `profiles.subscription_tier` |
| `send-push` | `supabase/functions/send-push/` | Service role key | Sends push notifications via Expo Push API |

### Deploying Edge Functions

Deploy a single function:

```
supabase functions deploy claude-proxy --project-ref <PROJECT_REF>
```

Deploy all functions:

```
supabase functions deploy --project-ref <PROJECT_REF>
```

### CORS Configuration

`claude-proxy` restricts origins to:

- `https://tryroam.netlify.app`
- `https://roamtravel.app`
- `http://localhost:*`

Update CORS in the function's `index.ts` if domains change.

### Rate Limits & Quotas

| Service | Free Tier | Action If Exceeded |
|---------|-----------|-------------------|
| Anthropic (Claude) | Pay-per-token | Monitor billing in Anthropic Console |
| OpenWeatherMap | 1,000 calls/day (One Call 3.0) | Returns 401; weather card shows fallback |
| ElevenLabs | 10K characters/month | Voice proxy returns error; TTS degrades to `expo-speech` |
| Google Places | $200/month credit | Returns 403; venue enrichment fails silently |
| Amadeus | 2,000 calls/month | Flight data unavailable |

---

## Database Operations

### Running Migrations

**Local development:**

```
supabase db reset
```

Replays all migrations in `supabase/migrations/` and seeds from `supabase/seed.sql`.

**Production:**

```
supabase db push --project-ref <PROJECT_REF>
```

Applies pending migrations to the remote database.

### Creating New Migrations

```
supabase migration new <migration_name>
```

Creates a timestamped SQL file in `supabase/migrations/`.

**Requirements for every migration:**

- Include RLS policies that use `auth.uid()` for row-level security
- Never use `true` as a policy condition (security audit `20260312` already fixed legacy violations)
- Service role access is for edge functions only

### Key Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profile, subscription status, trip counts, travel profile | Own row only |
| `venues` | Google Places cache (enriched venue data) | Service role only |
| `push_tokens` | Expo push tokens per user per platform | Own tokens; service role reads all |
| `analytics_events` | Event tracking (taps, screens, flows, errors) | Insert allowed; select allowed |
| `error_logs` | Aggregated client errors (threshold: 3+ occurrences) | Insert allowed; select allowed |
| `trip_groups` | Group trip metadata | Members only |
| `trip_group_members` | Group membership and roles | Own membership |
| `referral_codes` | Referral tracking | Own codes |
| `waitlist_emails` | Pre-launch waitlist | Insert only |

### Backup & Recovery

- Supabase provides automatic daily backups (Pro plan)
- Point-in-time recovery available via Supabase Dashboard
- For manual backup: `supabase db dump --project-ref <PROJECT_REF> > backup.sql`

---

## Authentication

### Auth Methods

| Method | Where | Implementation |
|--------|-------|---------------|
| Anonymous sign-in | Web + Native | `supabase.auth.signInAnonymously()` |
| Email/Password | Web + Native | `supabase.auth.signUp()` / `signInWithPassword()` |
| Google OAuth | Web + Native | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Apple Sign In | iOS | `expo-apple-authentication` + `signInWithIdToken()` |
| Guest mode (web) | Web | `lib/guest.ts` — fake session with `guest-web-{timestamp}` ID |

### Guest Mode Operations

Guest mode (`lib/guest.ts`) creates a local-only session for web users who skip sign-in:

- Guest IDs: `guest-web-{timestamp}`
- Stored in AsyncStorage: `@roam/guest_mode`, `@roam/guest_id`
- `enterGuestMode()` sets `onboarding_complete` flag and updates the Zustand store
- `clearGuestMode()` must be called on real sign-in to prevent stale guest data
- `tryRestoreGuestSession()` runs on web refresh to restore guest state

### Auth Configuration

Key settings in `supabase/config.toml`:

- Anonymous sign-ins: enabled (required for "Continue as guest")
- Email confirmations: disabled (frictionless signup)
- JWT expiry: 3600s (1 hour)
- Refresh token rotation: enabled
- Rate limits: 30 anonymous users/hour/IP, 30 sign-ins per 5 min/IP

### Troubleshooting Auth

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Continue as guest" broken | `enable_anonymous_sign_ins` off in prod | Enable in Supabase Dashboard > Auth > Settings |
| Google OAuth redirect fails | Missing redirect URL in Supabase config | Add URL to Auth > URL Configuration > Redirect URLs |
| Apple Sign In fails | Missing entitlements or team config | Verify `com.roam.app` has Sign In with Apple capability |
| Session lost on refresh | Guest mode not restored | Check `tryRestoreGuestSession()` in `_layout.tsx` |

---

## Subscriptions & Billing

### RevenueCat Integration

- **Entitlement:** `pro`
- **Products:**
  - `roam_pro_monthly` — $9.99/month
  - `roam_global_yearly` — $49.99/year
- **Implementation:** `lib/revenue-cat.ts` (native only; no-op on web)

### Subscription Lifecycle

1. User purchases via `purchasePro()` or `purchaseGlobal()` in `lib/revenue-cat.ts`
2. RevenueCat sends webhook to `supabase/functions/revenuecat-webhook/`
3. Webhook updates `profiles.subscription_tier` based on event type:
   - PRO events: `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION`, `NON_RENEWING_PURCHASE`, `PRODUCT_CHANGE`
   - FREE events: `EXPIRATION`, `BILLING_ISSUE`
   - `CANCELLATION` is logged but does not downgrade (user keeps access until period ends)
4. Client syncs Pro status via `lib/sync-pro-status.ts` on app start

### Pro Feature Gating

`lib/pro-gate.ts` controls access to:

- `offline-prep`, `travel-twin`, `trip-chemistry`, `memory-lane`, `unlimited-trips`, `priority-ai`
- Free users: 1 trip/month (`FREE_TRIPS_PER_MONTH` in `lib/constants.ts`)
- Trip count tracked in Zustand store (`tripsThisMonth`) and Supabase (`profiles.trips_generated_this_month`)

### Referral Pro

- `profiles.pro_referral_expires_at` grants temporary Pro access
- `lib/sync-pro-status.ts` checks referral expiry alongside RevenueCat status

### Troubleshooting Subscriptions

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Purchase succeeds but user still shows FREE | Webhook not firing | Check RevenueCat Dashboard > Webhooks; verify `REVENUECAT_WEBHOOK_SECRET` |
| `subscription_tier` wrong in DB | Webhook secret mismatch | Compare secret in Supabase edge function env with RevenueCat webhook config |
| Pro status not reflected on app | `sync-pro-status.ts` not running | Verify `_layout.tsx` calls sync on mount |
| Web users stuck on FREE | Expected; RevenueCat is native-only | Web has no paywall; all features unlocked |

---

## Feature Flags

### How Flags Work

`lib/feature-flags.ts` controls route availability:

- **Web:** All features unlocked (`isComingSoon()` returns `false`)
- **Native v1.0:** Only core routes are accessible; non-core routes show "Coming Soon"

### Core Routes (Always Available on Native)

`splash`, `hook`, `signin`, `signup`, `welcome`, `onboard`, `onboarding`, `social-proof`, `value-preview`, `personalization`, `index`, `plan`, `saved`, `profile`, `chat`, `itinerary`, `paywall`, `privacy`, `terms`, `support`, `referral`, `trip/[id]`

### Adding a New Feature-Flagged Route

1. Build the screen in `app/`
2. If it should be v1.0 native: add the route name to `V1_CORE_ROUTES` in `lib/feature-flags.ts`
3. If it should be gated on native: do nothing (it defaults to "Coming Soon")
4. Web gets all routes automatically

---

## Monitoring & Observability

### Error Tracking

`lib/error-tracking.ts` provides client-side error aggregation:

- Counts errors per `{errorType}:{screen}:{message}` key in AsyncStorage
- After 3 occurrences, inserts into `error_logs` table in Supabase
- Use `trackError(screen, errorType, error, payload)` in catch blocks
- Use `withErrorTracking(fn, options)` for automatic fallback on failure

### Analytics

`lib/analytics.ts` tracks user behavior:

- Event types: `tap`, `screen_view`, `flow_step`, `flow_abandon`, `feature_use`, `error`, `session_start`, `session_end`
- All events written to `analytics_events` table
- Fails silently (never blocks UX)

### Error Boundary

`components/ui/ErrorBoundary.tsx` catches uncaught React errors and displays a fallback UI with a "Try Again" button.

### Monitoring Queries

Run these in Supabase SQL Editor to check system health:

**Recent errors (last 24 hours):**

```sql
SELECT error_type, screen, message, occurrence_count, last_seen_at
FROM error_logs
WHERE last_seen_at > now() - interval '24 hours'
ORDER BY occurrence_count DESC
LIMIT 20;
```

**Active sessions (last hour):**

```sql
SELECT COUNT(DISTINCT session_id) as active_sessions,
       COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE created_at > now() - interval '1 hour';
```

**Trip generation volume (today):**

```sql
SELECT COUNT(*) as trips_today
FROM analytics_events
WHERE event_type = 'feature_use'
  AND payload->>'feature' = 'generate_trip'
  AND created_at > now() - interval '24 hours';
```

**Subscription distribution:**

```sql
SELECT subscription_tier, COUNT(*) as users
FROM profiles
GROUP BY subscription_tier;
```

**Failed webhook events (check if RevenueCat sync is broken):**

```sql
SELECT *
FROM error_logs
WHERE error_type LIKE '%webhook%' OR screen LIKE '%revenuecat%'
ORDER BY last_seen_at DESC
LIMIT 10;
```

### What We Don't Have (Yet)

- No Sentry or external APM. Errors are tracked in Supabase only.
- No uptime monitoring. Consider adding UptimeRobot or similar for `tryroam.netlify.app`.
- No alerting pipeline. Monitor manually via Supabase Dashboard and the queries above.
- Edge functions log to Supabase Dashboard > Edge Functions > Logs. Check these when debugging API issues.

---

## Incident Response

### Severity Levels

| Level | Definition | Response Time |
|-------|-----------|---------------|
| P0 | App completely unusable (blank screen, auth broken, AI proxy down) | Immediate |
| P1 | Core feature broken (trip generation fails, payments broken) | < 2 hours |
| P2 | Non-core feature degraded (weather missing, venue photos fail) | < 24 hours |
| P3 | Cosmetic or minor (UI glitch, non-critical console error) | Next sprint |

### P0 Runbook: App Won't Load (Web)

1. Check https://tryroam.netlify.app — confirm the issue
2. Check Netlify Dashboard > Deploys for recent failed deploys
3. If last deploy broke it: roll back via Netlify Dashboard > Deploys > select last working > "Publish deploy"
4. If Supabase is down: check https://status.supabase.com
5. If CSP is blocking resources: check browser console, update `netlify.toml` CSP header

### P0 Runbook: AI Trip Generation Down

1. Test: open app, start a trip plan, check if generation works
2. Check Supabase Dashboard > Edge Functions > `claude-proxy` > Logs
3. Common causes:
   - `ANTHROPIC_API_KEY` expired or billing issue: check Anthropic Console
   - CORS error: verify allowed origins in `claude-proxy/index.ts`
   - Supabase edge function crashed: redeploy with `supabase functions deploy claude-proxy`
4. Verify the fix by generating a test trip

### P1 Runbook: Subscriptions Not Syncing

1. Check RevenueCat Dashboard > Webhooks for delivery failures
2. Check Supabase Dashboard > Edge Functions > `revenuecat-webhook` > Logs
3. Verify `REVENUECAT_WEBHOOK_SECRET` matches between RevenueCat and Supabase
4. Test webhook manually via RevenueCat Dashboard > Webhooks > "Test"
5. If webhook is fine but profile not updating: check the SQL update logic in the function

### P2 Runbook: Weather/Venue Data Missing

1. Check Supabase edge function logs for the relevant function
2. Verify API key is set and has quota remaining
3. OpenWeatherMap: check https://openweathermap.org/api — 1K calls/day limit
4. Google Places: check Google Cloud Console billing — $200/month free credit
5. If quota exceeded: wait for reset or upgrade plan

---

## Local Development

### First-Time Setup

```
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

npm install --legacy-peer-deps

# Start Supabase locally (optional — requires Docker)
supabase start

# Start Expo dev server
npx expo start
```

### Running the Web Build Locally

```
npm run build:web
npx serve dist
```

### Running Tests

```
npm test                # Jest tests
npm run test:coverage   # Jest with coverage report
```

### Type Checking

```
npx tsc --noEmit
```

### Common Dev Issues

| Issue | Fix |
|-------|-----|
| Peer dependency errors on install | Use `npm install --legacy-peer-deps` (`.npmrc` sets this) |
| Supabase types out of date | `supabase gen types typescript --project-id <ref> > lib/database.types.ts` |
| Web SplashScreen crash | Platform-specific import already handled in `ExpoRoot`; if it recurs, check `app/_layout.tsx` |
| Fonts not loading on web | CSP in `netlify.toml` must allow `font-src data:` |

---

## Operational Checklist — Weekly

- [ ] Check `error_logs` for recurring errors (query above)
- [ ] Review Supabase edge function logs for failures
- [ ] Verify Anthropic billing is within budget
- [ ] Check RevenueCat webhook delivery success rate
- [ ] Review `analytics_events` for unusual patterns (traffic spikes, abandonment)
- [ ] Confirm latest deploy on Netlify is healthy

## Operational Checklist — Monthly

- [ ] Rotate API keys that are approaching expiry
- [ ] Review Supabase usage (database size, edge function invocations, auth users)
- [ ] Check Google Places and OpenWeatherMap quota usage
- [ ] Review `npm audit --production` output for new vulnerabilities
- [ ] Update dependencies: `npm outdated` and address critical updates
- [ ] Test native builds with `eas build --profile preview` on both platforms

## Operational Checklist — Per Release

- [ ] Run pre-deploy checklist (above)
- [ ] Verify feature flags are correct for the release
- [ ] Test all auth flows (anonymous, email, OAuth, Apple)
- [ ] Test subscription purchase + webhook flow in sandbox
- [ ] Verify CSP headers allow all required external services
- [ ] Update app version in `app.json` for native releases

---

## Architecture Quick Reference

```
app/                          Expo Router screens (file-based routing)
components/features/          Feature-specific UI components
components/ui/                Reusable design system components
lib/                          Business logic, API clients, utilities
  analytics.ts                Event tracking -> analytics_events table
  constants.ts                Design tokens, destinations, config
  error-tracking.ts           Client error aggregation -> error_logs table
  feature-flags.ts            v1.0 route gating (native vs web)
  guest.ts                    Web guest mode (fake sessions)
  offline.ts                  AsyncStorage trip/itinerary caching
  pro-gate.ts                 Pro feature gating + trip limits
  revenue-cat.ts              RevenueCat SDK wrapper (native only)
  store.ts                    Zustand state (trips, chat, profile, pets)
  supabase.ts                 Supabase client initialization
  sync-pro-status.ts          RevenueCat + referral Pro sync
supabase/
  config.toml                 Local Supabase config
  functions/                  Deno edge functions (server-side)
  migrations/                 SQL migrations with RLS
.github/workflows/
  ci.yml                      PR checks (type, build, security)
  deploy.yml                  Auto-deploy to Netlify on push to main
netlify.toml                  Netlify build, redirects, headers, CSP
eas.json                      EAS Build profiles (dev, preview, prod)
app.json                      Expo app config
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-13 | No external APM (Sentry) yet | Supabase error_logs sufficient for current scale; add when DAU > 10K |
| 2026-03-13 | Edge functions handle all API proxying | Keeps secrets server-side; single CORS config point |
| 2026-03-13 | Web fully unlocked, native gated | Web drives discovery; native is premium App Store experience |
| 2026-03-13 | RevenueCat webhook writes to profiles directly | Simplest sync path; no intermediate queue needed at current scale |
| 2026-03-13 | Anonymous sign-ins enabled | Required for guest mode; rate-limited to 30/hour/IP |

---

*This document is maintained by the operations function. Update after each infrastructure change or incident.*
