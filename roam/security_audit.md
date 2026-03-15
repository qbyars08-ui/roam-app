# Security Audit — ROAM
## Last Updated: 2026-03-15
## Audits Contained: (1) GDPR/DACH Compliance · (2) People Tab Security Review

---

# AUDIT 1 — GDPR/DACH Compliance
## Date: 2026-03-15
## Summary: 14 issues (3 critical, 5 high, 4 medium, 2 low)
## DACH Launch Readiness: NOT READY — 5 blockers

| # | Severity | Category | Description | File(s) | Status |
|---|----------|----------|-------------|---------|--------|
| 1 | CRITICAL | Data Deletion | No "Delete Account" UI exists. Support FAQ references "Profile > Settings > Delete Account" but route does not exist in `app/profile.tsx`. GDPR Article 17. | `app/profile.tsx`, `app/support.tsx` | OPEN |
| 2 | CRITICAL | Analytics PII Leak | `WAITLIST_JOINED` PostHog event sends `email` as a property. Email is PII and must never be sent to third-party analytics. | `lib/posthog-events.ts:417-420` | OPEN |
| 3 | CRITICAL | No Tracking Consent | PostHog initializes unconditionally on app start before any user consent. Violates TTDSG § 25 (Germany), DSG (Austria), nDSG (Switzerland). Web (`tryroam.netlify.app`) has no cookie banner or CMP. | `app/_layout.tsx:111`, `lib/posthog.ts` | OPEN |
| 4 | HIGH | PostHog US Data Residency | Default host `https://us.i.posthog.com`. EU users' behavioral data routes to US servers. Should be `https://eu.i.posthog.com`. | `lib/posthog.ts:14-15` | OPEN |
| 5 | HIGH | Supabase US Region | Privacy policy states "Data stored on Supabase (US)". No SCCs referenced. Must use Supabase EU (Frankfurt) or document SCCs. | `app/privacy.tsx:104` | OPEN |
| 6 | HIGH | Anthropic Data Transfer | Trip preferences + dietary data sent to `api.anthropic.com` (US). Dietary restrictions may constitute Art. 9 special category data. No DPA documented. | `supabase/functions/claude-proxy/index.ts:167-179` | OPEN |
| 7 | HIGH | Missing Legal Basis | Privacy policy does not specify Art. 6 legal basis per processing activity. DACH authorities require explicit documentation. | `app/privacy.tsx` | OPEN |
| 8 | HIGH | No DPAs Executed | No DPAs with Anthropic, PostHog, ElevenLabs, RevenueCat, Supabase. GDPR Art. 28 requires written DPAs with all processors. | All edge functions | OPEN |
| 9 | MEDIUM | analytics_events ON DELETE SET NULL | User analytics rows persist after account deletion. session_id + payload may allow re-identification. | `supabase/migrations/20260312000002_create_analytics_events.sql:11` | OPEN |
| 10 | MEDIUM | affiliate_clicks ON DELETE SET NULL | Affiliate click records survive account deletion (partner + destination + timestamp linkable). | `supabase/migrations/20260311000001_affiliate_clicks.sql:8` | OPEN |
| 11 | MEDIUM | waitlist_emails No Deletion Path | Plain-text emails with no account linkage and no self-service deletion endpoint. | `supabase/migrations/20260314000002_create_waitlist_emails.sql` | OPEN |
| 12 | MEDIUM | Privacy Policy DACH Gaps | Missing: EU representative, DPO contact, supervisory authority names (BfDI/DSB/EDÖB), per-category retention periods, company address. | `app/privacy.tsx` | OPEN |
| 13 | LOW | ElevenLabs Undisclosed | Itinerary text sent to `api.elevenlabs.io` (US) not mentioned in privacy policy. | `supabase/functions/voice-proxy/index.ts` | OPEN |
| 14 | LOW | error_logs PII Risk | Free-form payload/message fields may contain user input without retention/deletion policy. | `supabase/migrations/20260312000004_create_error_logs.sql` | OPEN |

### DACH Launch Blockers
1. No account deletion UI (GDPR Art. 17 hard requirement)
2. No consent mechanism before analytics tracking (TTDSG/DSG/nDSG)
3. Email PII leaking to PostHog
4. PostHog routing EU data to US without documented SCCs
5. No DPAs executed with any data processors

---

# AUDIT 2 — People Tab Security Review
## Date: 2026-03-15
## Summary: 8 issues (1 critical, 3 high, 3 medium, 1 low)

## Findings

| # | Severity | Category | Description | File(s) | Status |
|---|----------|----------|-------------|---------|--------|
| P-1 | CRITICAL | Broken RLS Policy | `squad_matches` INSERT policy references non-existent columns `user_a, user_b`. Actual columns are `initiator_id, target_id`. Policy fails at creation or runtime, leaving match insertion unguarded. Any authenticated user can insert arbitrary matches for any pair of users. | `supabase/migrations/20260312000008_security_fix_rls.sql:11-14` | OPEN |
| P-2 | HIGH | Trip Presence Enumeration | `trip_presence` SELECT policy `USING (status = 'active')` allows any authenticated user to query ALL active presences — bypassing the matching flow entirely. Exposes: who is going where, exact arrival/departure dates, and stated intentions (`looking_for[]`) for all active users. | `supabase/migrations/20260311000005_social_layer.sql:373-374` | OPEN |
| P-3 | HIGH | Privacy Flags Not Enforced at DB Level | `social_profiles` has `show_age` and `show_real_name` boolean flags, but the `"Visible profiles readable"` policy returns ALL columns including `age_range` and `display_name` regardless of these flags. Enforcement is entirely at application layer. `findSquadCandidates()` returns the full profile object with no filtering. If any client bypasses the app to query directly, privacy settings are ignored. | `supabase/migrations/20260311000005_social_layer.sql:365-367`, `lib/social.ts:121-125` | OPEN |
| P-4 | HIGH | No Input Validation on Social Profile Fields | `upsertSocialProfile()` sends user-provided `bio`, `display_name`, `vibe_tags`, `languages` to DB with no length limits or sanitization. DB schema has no `CHECK` constraints on these TEXT fields. Risks: oversized payloads causing rendering issues; XSS payloads in `bio`/`display_name` (critical on web platform). | `lib/social.ts:43-53`, `supabase/migrations/20260311000005_social_layer.sql:10-29` | OPEN |
| P-5 | MEDIUM | No Rate Limiting on Social Profile Operations | `social_profiles` upsert, `trip_presence` insert, `squad_swipes` insert, and `breakfast_listings` insert have no per-user rate limits. Only edge functions (voice-proxy, weather-intel etc.) use `increment_edge_rate_limit`. A malicious user can: spam presence records across hundreds of destinations, create automated swipe bots, or flood listing tables. | `lib/social.ts`, `supabase/migrations/20260324000002_edge_function_rate_limits.sql` | OPEN |
| P-6 | MEDIUM | Group Preview Exposes Itinerary to Unauthenticated Users | `get_group_preview_by_invite` RPC is granted to `anon` role. Returns full `itinerary_json` (accommodation, restaurant, activity details) to unauthenticated callers. No rate limiting on the RPC. Invite codes are 8 chars (charset ~32 chars = ~2^40 space) — brute-forceable with sustained effort and no lockout. | `supabase/migrations/20260320000001_group_trip_preview_rpc.sql:40` | OPEN |
| P-7 | MEDIUM | shared_trips No DELETE Policy | Once a trip is shared, it cannot be deleted by the creator. `shared_trips` has SELECT and INSERT policies but no DELETE policy. Users cannot retract shared links. This also conflicts with GDPR Art. 17 (right to erasure applies to shared content). | `supabase/migrations/20260311000004_create_shared_trips_table.sql` | OPEN |
| P-8 | LOW | Avatar URL Allowlist Missing for Future Live Data | Current People tab uses hardcoded Unsplash URLs (safe). The `social_profiles` schema uses `avatar_emoji` (safe). But `local_profiles` has no avatar field defined — if one is added later, and avatar image URLs are stored in DB without an allowlist, they could be used for SSRF or tracking pixel injection. No validation guard exists preemptively. | `app/(tabs)/people.tsx:58-113` | OPEN |

---

## Detailed Findings — People Tab

### P-1 — CRITICAL: Broken squad_matches RLS INSERT Policy
**Evidence:**
```sql
-- 20260312000008_security_fix_rls.sql:11-14
DROP POLICY IF EXISTS "Authenticated insert squad_matches" ON squad_matches;
CREATE POLICY "Users insert own matches" ON squad_matches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (user_a, user_b));  -- ❌ columns don't exist
```

The actual `squad_matches` schema uses `initiator_id` and `target_id`, not `user_a`/`user_b`. This policy either fails to create (throwing a PostgreSQL error, leaving no INSERT policy at all after the DROP) or creates silently but fails at enforcement time.

**Impact:** Any authenticated user can insert a row into `squad_matches` with arbitrary `initiator_id` and `target_id`, creating fake mutual matches between users who never swiped. This enables:
- Fake match notifications to any user
- Unauthorized access to match-gated chat channels
- Impersonation of match events

**Fix Required:**
```sql
-- In new migration:
DROP POLICY IF EXISTS "Users insert own matches" ON squad_matches;
CREATE POLICY "Users insert own matches" ON squad_matches
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = initiator_id
    AND initiator_id <> target_id  -- prevent self-matching
  );
```

---

### P-2 — HIGH: Trip Presence Direct Enumeration
**Evidence:**
```sql
-- social_layer.sql:373-374
CREATE POLICY "Active presence readable" ON trip_presence
  FOR SELECT TO authenticated USING (status = 'active');
```

Any authenticated user can execute:
```sql
SELECT * FROM trip_presence WHERE status = 'active';
```
This returns every active traveler's `user_id`, `destination`, `arrival_date`, `departure_date`, and `looking_for[]` — the full dataset backing the People tab's matching feature. No filtering by mutual interest or destination overlap is enforced at DB level.

**Fix Required:**
Restrict direct table reads to own rows only. Expose matching data exclusively through a `SECURITY DEFINER` RPC that enforces overlap/destination criteria before returning results:
```sql
DROP POLICY IF EXISTS "Active presence readable" ON trip_presence;
CREATE POLICY "Users read own presence" ON trip_presence
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Matching queries go through a SECURITY DEFINER RPC instead
```

---

### P-3 — HIGH: Privacy Flags Not Enforced at DB Level
**Evidence:**
```sql
-- social_layer.sql:365-367
CREATE POLICY "Visible profiles readable" ON social_profiles
  FOR SELECT TO authenticated USING (visibility != 'invisible');
-- Returns ALL columns including age_range, display_name, bio
```

The table has:
- `show_real_name boolean DEFAULT false` — display_name should be anonymized when false
- `show_age boolean DEFAULT true` — age_range should be hidden when false

But the SELECT policy returns all columns regardless. Any PostgreSQL client that directly queries `social_profiles` (bypassing the app's filtering logic) receives full profile data.

**Fix Required:**
Create a view or RPC that respects privacy flags:
```sql
CREATE OR REPLACE FUNCTION get_public_social_profile(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM social_profiles WHERE user_id = p_user_id AND visibility != 'invisible';
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object(
    'id', r.id,
    'display_name', CASE WHEN r.show_real_name THEN r.display_name ELSE 'Traveler' END,
    'age_range', CASE WHEN r.show_age THEN r.age_range ELSE NULL END,
    'travel_style', r.travel_style,
    'vibe_tags', r.vibe_tags,
    'bio', r.bio,
    'avatar_emoji', r.avatar_emoji,
    'languages', r.languages,
    'visibility', r.visibility,
    'open_to_meetups', r.open_to_meetups
    -- Omit: show_real_name, show_age, auto_delete_chats, created_at
  );
END;
$$;
```

---

### P-4 — HIGH: No Input Validation on Social Profile Fields
**Evidence (`lib/social.ts:43-53`):**
```typescript
export async function upsertSocialProfile(
  profile: Partial<SocialProfile>
): Promise<SocialProfile | null> {
  const userId = getUserId();
  const { data } = await supabase
    .from('social_profiles')
    .upsert({ user_id: userId, ...profile }, { onConflict: 'user_id' })
    // No validation on bio, display_name, vibe_tags, languages
```

DB schema has no length constraints (`bio TEXT`, `display_name TEXT NOT NULL DEFAULT 'Traveler'`). A user can:
1. Submit a `bio` of 10MB — stored and rendered to every matched user, crashing their UI
2. Submit XSS payload in `display_name` or `bio` — **critical** on web platform since React Native Web renders to DOM
3. Submit invalid/oversized arrays in `vibe_tags` or `languages`

**Fix Required:**
Add validation before upsert in `lib/social.ts` and DB-level constraints:
```typescript
const LIMITS = {
  display_name: 50,
  bio: 300,
  vibe_tags: 10,    // max array length
  languages: 10,
};

// In upsertSocialProfile:
if (profile.bio && profile.bio.length > LIMITS.bio) throw new Error('Bio too long (max 300 chars)');
if (profile.display_name && profile.display_name.length > LIMITS.display_name) throw new Error('Name too long');
if (profile.vibe_tags && profile.vibe_tags.length > LIMITS.vibe_tags) throw new Error('Too many vibes');
```

```sql
ALTER TABLE social_profiles
  ADD CONSTRAINT bio_length CHECK (char_length(bio) <= 300),
  ADD CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50);
```

---

### P-5 — MEDIUM: No Rate Limiting on Social Operations
No rate limit on `trip_presence` inserts, `squad_swipes` inserts, or `social_profiles` upserts. Edge function rate limiting (`increment_edge_rate_limit`) only covers: `voice-proxy`, `weather-intel`, `destination-photo`, `enrich-venues`.

**Attack scenarios:**
- **Presence spam**: Submit 1000 `trip_presence` records across all destinations → appear in every destination's candidate pool → denial-of-service for matching UX
- **Swipe bot**: Auto-swipe right on every candidate → force matches with all users in a destination
- **Profile churn**: Rapidly update profile to test what content passes filters

**Fix Required:**
Add DB-level insert limits via triggers or extend `increment_edge_rate_limit` to cover direct Supabase client table operations:
```sql
-- Limit presence inserts: max 10 active per user
CREATE OR REPLACE FUNCTION check_presence_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM trip_presence WHERE user_id = NEW.user_id AND status = 'active') >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 active trip presences allowed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_presence_limit BEFORE INSERT ON trip_presence FOR EACH ROW EXECUTE FUNCTION check_presence_limit();
```

---

### P-6 — MEDIUM: Group Preview Unauthenticated Access + No Rate Limit
**Evidence:**
```sql
-- 20260320000001_group_trip_preview_rpc.sql:40-41
GRANT EXECUTE ON FUNCTION get_group_preview_by_invite(text) TO anon;
GRANT EXECUTE ON FUNCTION get_group_preview_by_invite(text) TO authenticated;
```

The function returns `itinerary_json` (full trip plan with accommodations, restaurants, activities) to unauthenticated callers. The only secret is the 8-character invite code (charset ~32 = ~1 trillion combinations — guessable via sustained automated requests with no lockout).

**Fix Required:**
1. Revoke `anon` grant: `REVOKE EXECUTE ON FUNCTION get_group_preview_by_invite(text) FROM anon;`
2. Require authentication for group previews (deferred signup flow can show destination/dates without full itinerary)
3. Add rate limiting: max 20 preview lookups/minute per IP via edge function wrapper

---

### P-7 — MEDIUM: shared_trips Cannot Be Deleted by Creator
**Evidence (`supabase/migrations/20260311000004_create_shared_trips_table.sql`):**
```sql
CREATE POLICY "Anyone can view shared trips" ON shared_trips FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert shared trips" ON shared_trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- No DELETE policy
```

Once shared, a trip link is permanent. The creator cannot retract it. Also: `user_id` is stored and publicly readable in the table (any SELECT returns the creator's UUID).

**Fix Required:**
```sql
CREATE POLICY "Users can delete own shared trips" ON shared_trips
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```
And remove `user_id` from the public SELECT by replacing the table policy with a view that omits it, or using a SECURITY DEFINER function.

---

## People Tab: What's Safe

- `social_profiles` RLS correctly gates all writes to own user (`user_id = auth.uid()`)
- Default `visibility = 'invisible'` — users are opt-in for visibility (correct)
- `avatar_emoji` field (not URLs) used in social profiles — no XSS via avatar in current schema
- `trip_presence` INSERT correctly enforces `user_id = auth.uid()`
- `squad_swipes` INSERT enforces `swiper_id = auth.uid()` (correct)
- `social_chat_messages` INSERT enforces `sender_id = auth.uid()` AND channel membership (correct)
- `location_checkins` properly restricted to own user + circle members
- People tab currently serves mock data only — no live user data is exposed yet

---

## Combined Recommendations (Both Audits)

### Immediate (blocks People tab going live)
- [ ] Fix `squad_matches` INSERT policy: replace `user_a, user_b` with `initiator_id, target_id`
- [ ] Add DELETE policy to `shared_trips`
- [ ] Revoke `anon` grant on `get_group_preview_by_invite`
- [ ] Add input validation + DB constraints on `social_profiles` text fields

### Pre-Launch DACH
- [ ] Implement Delete Account UI in `app/profile.tsx`
- [ ] Add GDPR consent banner to web before PostHog fires
- [ ] Remove `email` from `WAITLIST_JOINED` PostHog event
- [ ] Switch PostHog host to `https://eu.i.posthog.com`
- [ ] Execute DPAs with Anthropic, PostHog, ElevenLabs, RevenueCat, Supabase
- [ ] Rewrite privacy policy with legal basis, EU representative, supervisory authority contacts

### Sprint
- [ ] Restrict `trip_presence` direct SELECT to own rows; expose matches via SECURITY DEFINER RPC
- [ ] Enforce `show_age` and `show_real_name` flags via DB view or RPC (not app layer)
- [ ] Add per-user rate limits on `trip_presence` inserts and `squad_swipes`
- [ ] Change `analytics_events.user_id` and `affiliate_clicks.user_id` to `ON DELETE CASCADE`
- [ ] Add waitlist unsubscribe endpoint

### Backlog
- [ ] Add avatar URL allowlist for when live user-supplied avatar URLs are introduced
- [ ] Add date validation to `postTripPresence()` (arrival < departure, max 1 year out)
- [ ] Add `trip_presence` insert limit trigger (max 10 active per user)
- [ ] Define per-table data retention periods and implement automated purge

---

---

# AUDIT 3 — Post-Merge Scan (New Agent Code)
## Date: 2026-03-15
## Scope: Code merged from agents 06 (Growth), 07 (Monetization), 10 (Analytics) + full Module 2/5/6 scan
## Summary: 4 issues (1 critical resolved, 1 medium resolved, 2 low remaining)

| # | Severity | Category | Description | File(s) | Status |
|---|----------|----------|-------------|---------|--------|
| A3-1 | CRITICAL | API Key Exposure | `.env.example` contained `EXPO_PUBLIC_ANTHROPIC_API_KEY=` — a template that could lead developers to bundle the Anthropic key into the client app. The `EXPO_PUBLIC_` prefix causes Expo to embed the value into the JS bundle. | `.env.example:7` | FIXED |
| A3-2 | MEDIUM | Affiliate URL Leak to Analytics | `lib/affiliates.ts` and `components/features/FlightPriceCard.tsx` sent full affiliate URLs (including `associateId=`, `aid=`, `partner_id=`, UTM params) to PostHog. Module 6 rule: cleaned URLs only (origin+path). | `lib/affiliates.ts:150-155`, `components/features/FlightPriceCard.tsx:41-46` | FIXED |
| A3-3 | MEDIUM | WAITLIST_JOINED email PII | (Carry-forward from Audit 1, now fixed) `WAITLIST_JOINED` PostHog event type definition included `email: string` as required property. Removed from type — callers cannot accidentally pass email to PostHog. | `lib/posthog-events.ts:417` | FIXED |
| A3-4 | LOW | PostHog EU host not in .env.example | `.env.example` had no `EXPO_PUBLIC_POSTHOG_HOST` variable. Without it, production will silently route EU user data to `https://us.i.posthog.com` (US servers). Added to .env.example with correct EU value and GDPR comment. | `.env.example` | FIXED |
| A3-5 | LOW | CVE Scan | `npm audit` shows 0 critical, 0 high vulnerabilities. 5 low-severity issues in `@tootallnate/once` (transitive dep of `jest-expo`). Fix requires `npm audit fix --force` which would downgrade `jest-expo` to v47 (breaking change). Not a runtime risk. | `package.json` | ACCEPTED |
| A3-6 | LOW | `EXPO_PUBLIC_OPENWEATHER_KEY` and `EXPO_PUBLIC_AVIATIONSTACK_KEY` in client | Both `lib/weather.ts` and `lib/aviationstack.ts` read API keys from `EXPO_PUBLIC_` env vars — bundled into client JS. Per project rules, only Supabase anon key and Google Places key are permitted as `EXPO_PUBLIC_`. Medium-risk for key abuse (weather/flight search rate limits). Recommend proxying through edge functions long-term. | `lib/weather.ts:38`, `lib/aviationstack.ts:54` | OPEN |

## Fixes Applied This Session

### A3-1: Removed `EXPO_PUBLIC_ANTHROPIC_API_KEY` from `.env.example`
Removed the dangerous template variable. Anthropic key is server-side only (`Deno.env.get("ANTHROPIC_API_KEY")` in `claude-proxy`). Added comment clarifying this constraint.

### A3-2: Strip query params from affiliate URLs before PostHog
Both `lib/affiliates.ts` and `components/features/FlightPriceCard.tsx` now send only `origin+pathname` to PostHog, stripping all affiliate IDs, UTM parameters, and tracking tokens.

### A3-3: Removed `email` from `WAITLIST_JOINED` PostHog event type
The TypeScript type for `WAITLIST_JOINED` now only allows `{ destination?: string }`. No call site currently fires this event with an email — the type fix ensures no future caller can accidentally introduce the PII leak.

### A3-4: Added `EXPO_PUBLIC_POSTHOG_HOST` to `.env.example`
Added `EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` with a clear GDPR comment. This ensures any new environment setup defaults to EU data residency.

---

## Resolved This Session
- [x] Identified broken `squad_matches` INSERT policy referencing wrong columns — FIXED in migration 20260315000001
- [x] Added DELETE policy to `shared_trips` — FIXED in migration 20260315000002
- [x] Revoked `anon` grant on `get_group_preview_by_invite` — FIXED in migration 20260315000002
- [x] Added DB-level length constraints to `social_profiles` — FIXED in migration 20260315000002
- [x] Added `trip_presence` insert limit trigger — FIXED in migration 20260315000002
- [x] Added `validateSocialProfileInput()` to `lib/social.ts` — FIXED
- [x] Removed `EXPO_PUBLIC_ANTHROPIC_API_KEY` from `.env.example` — FIXED
- [x] Stripped query params from affiliate URLs before PostHog — FIXED in `lib/affiliates.ts`, `FlightPriceCard.tsx`
- [x] Removed `email` from `WAITLIST_JOINED` PostHog event type — FIXED in `lib/posthog-events.ts`
- [x] Added `EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` to `.env.example` — FIXED
- [x] Documented all 5 DACH launch blockers for prioritization
