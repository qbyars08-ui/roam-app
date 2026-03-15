# Security Audit — GDPR/DACH Compliance
## Date: 2026-03-15
## Scope: GDPR compliance readiness for Germany, Austria, Switzerland (DACH) launch
## Summary: 14 issues (3 critical, 5 high, 4 medium, 2 low)

---

## Findings

| # | Severity | Category | Description | File(s) | Status |
|---|----------|----------|-------------|---------|--------|
| 1 | CRITICAL | Data Deletion | No "Delete Account" UI exists. Support FAQ references "Profile > Settings > Delete Account" but this route does not exist in `app/profile.tsx`. GDPR Article 17 (right to erasure) requires a user-facing deletion mechanism. | `app/profile.tsx`, `app/support.tsx` | OPEN |
| 2 | CRITICAL | Analytics PII Leak | `WAITLIST_JOINED` PostHog event sends `email` as a property. Email is PII and must never be sent to third-party analytics. | `lib/posthog-events.ts:417-420` | OPEN |
| 3 | CRITICAL | No Cookie/Tracking Consent | PostHog analytics initializes unconditionally on app start (`initPostHog()` in `_layout.tsx:111`) with no prior user consent. Under GDPR Article 7 and ePrivacy Directive (§ 25 TTDSG in Germany), consent is required before analytics tracking. Web platform is affected. | `app/_layout.tsx:111`, `lib/posthog.ts` | OPEN |
| 4 | HIGH | PostHog US Data Residency | Default PostHog host hardcoded to `https://us.i.posthog.com`. EU users' behavioral data (user ID, screen views, events) is routed to US servers. No SCC/adequacy decision covers this transfer for DACH users without explicit consent and DPA. Should use `https://eu.i.posthog.com`. | `lib/posthog.ts:14-15` | OPEN |
| 5 | HIGH | Supabase US Data Residency | Primary database stores EU user personal data in US region (privacy policy states "Data stored on Supabase (US)"). No Standard Contractual Clauses (SCC) reference in privacy policy. For DACH launch, Supabase EU region (Frankfurt) must be enabled or SCCs must be documented. | `app/privacy.tsx:104`, `lib/supabase.ts` | OPEN |
| 6 | HIGH | Anthropic Data Transfer | Trip preferences, travel style profiles (pace, budget, dietary requirements, accommodation style), and chat messages are sent to `api.anthropic.com` (US). Travel profile data can constitute special category-adjacent data (dietary restrictions may reveal religious/health info). Privacy policy lacks SCC/DPA reference for Anthropic. | `supabase/functions/claude-proxy/index.ts:167-179`, `app/privacy.tsx:91-96` | OPEN |
| 7 | HIGH | Missing Legal Basis Documentation | Privacy policy does not specify the legal basis (Art. 6 GDPR) for each processing activity: analytics (legitimate interest vs. consent?), AI processing (contract performance?), push notifications (consent?). DACH data protection authorities require explicit legal basis per processing purpose. | `app/privacy.tsx` | OPEN |
| 8 | HIGH | No Data Processing Agreement (DPA) References | No DPAs documented with: Anthropic (claude-proxy processes user content), PostHog (analytics), ElevenLabs (TTS processes itinerary text), RevenueCat (subscription/payment data). GDPR Art. 28 requires written DPAs with all data processors. | `supabase/functions/claude-proxy/`, `supabase/functions/voice-proxy/` | OPEN |
| 9 | MEDIUM | analytics_events ON DELETE SET NULL | `analytics_events.user_id` uses `ON DELETE SET NULL` instead of `CASCADE`. When a user deletes their account, their analytics rows persist with a null user_id. Depending on session_id or payload content, this data may still be re-identifiable, partially violating Art. 17 erasure rights. | `supabase/migrations/20260312000002_create_analytics_events.sql:11` | OPEN |
| 10 | MEDIUM | affiliate_clicks ON DELETE SET NULL | Same issue: `affiliate_clicks.user_id` uses `ON DELETE SET NULL`. Affiliate click records (partner, destination, platform, timestamp) remain after account deletion and could be linkable via correlated timestamps. | `supabase/migrations/20260311000001_affiliate_clicks.sql:8` | OPEN |
| 11 | MEDIUM | waitlist_emails No Deletion Mechanism | `waitlist_emails` stores plain-text email addresses with no user account linkage and no deletion endpoint. Users cannot exercise Art. 17 rights for waitlist data. No retention period defined for this table. | `supabase/migrations/20260314000002_create_waitlist_emails.sql`, `lib/waitlist-guest.ts` | OPEN |
| 12 | MEDIUM | Privacy Policy Missing DACH-Specific Requirements | Privacy policy (`app/privacy.tsx`) lacks: (a) EU data controller address / company registration, (b) Data Protection Officer (DPO) contact if required, (c) EU representative contact (required if no EU establishment), (d) right to lodge complaint with specific supervisory authority (BfDI for Germany, DSB for Austria, EDÖB for Switzerland), (e) data retention periods for all processing categories (analytics, push tokens, error logs, social profiles). | `app/privacy.tsx` | OPEN |
| 13 | LOW | ElevenLabs TTS Data Flow Undisclosed | Itinerary narration text (containing destination names, activity descriptions derived from user preferences) is sent to `api.elevenlabs.io` via `voice-proxy`. ElevenLabs is a US company. This third-party processor is not disclosed in the privacy policy. | `supabase/functions/voice-proxy/index.ts:105-121`, `app/privacy.tsx:100` | OPEN |
| 14 | LOW | Error Logs May Contain PII | `error_logs.payload` and `error_logs.message` fields are free-form JSONB/TEXT. If error context includes user inputs (e.g., destination names, travel preferences passed during a failing API call), PII could be stored without a defined retention period or deletion mechanism. No user_id linkage means Art. 17 requests cannot be applied. | `supabase/migrations/20260312000004_create_error_logs.sql`, `lib/error-tracking.ts:43-52` | OPEN |

---

## Detailed Findings

### Finding 1 — CRITICAL: No Account Deletion UI
**GDPR Article:** 17 (Right to Erasure)
**Risk:** A user cannot exercise their right to erasure. German data subjects routinely invoke this right. Absence of a self-service deletion mechanism creates legal liability under DSGVO (German GDPR implementation) with fines up to €20M or 4% global turnover.

**Evidence:**
- `app/support.tsx:42`: FAQ answer says "Open ROAM > Profile > Settings > Delete Account"
- `app/profile.tsx`: No "Settings" section and no "Delete Account" button exist in the rendered UI
- Database has `ON DELETE CASCADE` on most tables, so the deletion *mechanism* exists at DB level — it's only the UI entry point that's missing

**Fix Required:**
Add a "Delete Account" destructive action to `app/profile.tsx` that calls `supabase.auth.admin.deleteUser()` (via a secure edge function) or uses Supabase's account deletion API. Confirm with a two-step dialog. Display estimated data deletion timeline (≤30 days per privacy policy).

---

### Finding 2 — CRITICAL: Email PII in PostHog Analytics
**GDPR Article:** 5(1)(c) data minimisation, 9 (special categories adjacent), Art. 25 privacy by design

**Evidence:**
```typescript
// lib/posthog-events.ts:417-420
WAITLIST_JOINED: def<{ email: string; destination?: string }>(
  'waitlist_joined',
  'User joined the waitlist',
),
```
Email is defined as a required PostHog event property for `waitlist_joined`. If fired, this sends raw email addresses to PostHog (US servers). Under GDPR, email is PII and its transfer to analytics processors requires lawful basis and DPA.

**Fix Required:**
Remove `email` from the `WAITLIST_JOINED` event payload. Use a hashed or pseudonymous identifier instead (e.g., `email_domain` or a server-side generated opaque ID). Audit all call sites that fire `WAITLIST_JOINED` to confirm email is not currently being sent.

---

### Finding 3 — CRITICAL: Unconditional Analytics Tracking (No Consent)
**GDPR Article:** 7 (Conditions for consent), ePrivacy Directive, TTDSG § 25 (Germany)

**Evidence:**
```typescript
// app/_layout.tsx:111
initPostHog().catch(() => {});  // Called unconditionally at app start
```
PostHog is initialized before any user consent is collected. Under TTDSG (Germany's Telecommunications Digital Services Data Protection Act), tracking tools require prior informed consent — even for analytics classified as "legitimate interest" in other jurisdictions. Austria (DSG) and Switzerland (nDSG) have similar requirements.

The web version (`tryroam.netlify.app`) is particularly exposed: no cookie banner, no consent management platform (CMP), no opt-out mechanism.

**Fix Required:**
1. Implement a GDPR-compliant consent banner for web (before `initPostHog()` fires)
2. For native app: add analytics opt-in/opt-out in Profile settings
3. Gate `initPostHog()` and `captureEvent()` behind `hasAnalyticsConsent()` check
4. Store consent in AsyncStorage and sync to PostHog via `posthog.optIn()` / `posthog.optOut()`
5. Consider a Consent Management Platform (CMP) like Didomi, Usercentrics, or Cookiebot for web

---

### Finding 4 — HIGH: PostHog US Endpoint for EU Users
**GDPR Article:** 44-49 (International transfers)

**Evidence:**
```typescript
// lib/posthog.ts:14-15
const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
```
The fallback (and likely production value unless `EXPO_PUBLIC_POSTHOG_HOST` is explicitly set) routes all analytics to US infrastructure. PostHog EU endpoint (`https://eu.i.posthog.com`) stores data in Frankfurt, Germany, eliminating the international transfer issue.

**Fix Required:**
Set `EXPO_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` in production environment. Update `.env.example` to document this. Add a comment explaining the EU hosting requirement.

---

### Finding 5 — HIGH: Supabase US Region
**GDPR Article:** 44-49 (International transfers), Art. 13 (transparency)

Privacy policy states data is stored in US. Supabase now offers EU region (Frankfurt). For DACH launch, either:
- Migrate to Supabase EU region, OR
- Implement and document Standard Contractual Clauses (SCCs) in the privacy policy

No mention of SCCs, Binding Corporate Rules, or adequacy decisions for any US data transfers in current privacy policy.

---

### Finding 6 — HIGH: Anthropic (Claude) Data Transfer
**GDPR Article:** 44-49, Art. 9 (special categories)

**Evidence:** `supabase/functions/claude-proxy/index.ts:167-179` — User's `system` prompt (containing travel profile with dietary restrictions, pace, budget) and `messages` (chat content, trip requests) are sent to `api.anthropic.com`.

Dietary restrictions (e.g., halal, kosher, gluten-free) can reveal religious beliefs or health conditions, which are special category data under Art. 9 GDPR, requiring explicit consent for processing.

Privacy policy (`app/privacy.tsx:91-96`) mentions Anthropic but states only "not retained beyond the API request" — this is Anthropic's policy, not a legally binding DPA commitment documented for regulators.

**Fix Required:**
1. Execute a formal DPA with Anthropic (check their DPA availability at anthropic.com/legal)
2. Reference the DPA and applicable SCCs in the privacy policy
3. Evaluate whether dietary/religious data flowing to Anthropic requires explicit Art. 9 consent
4. Consider stripping dietary flags from the prompt or replacing with neutral categories

---

### Finding 7 — HIGH: Missing Legal Basis Per Processing Activity
**GDPR Article:** 13(1)(c), 6

Current privacy policy does not specify the legal basis for each processing activity. DACH data protection authorities (BfDI, DSB, EDÖB) require explicit documentation. Required additions:

| Processing Activity | Required Legal Basis |
|--------------------|---------------------|
| Account data (email, auth) | Art. 6(1)(b) — contract performance |
| Trip generation / AI chat | Art. 6(1)(b) — contract performance |
| PostHog analytics | Art. 6(1)(a) — consent (preferred for DACH) or Art. 6(1)(f) — legitimate interest with balancing test |
| Push notifications | Art. 6(1)(a) — consent (already requires OS permission) |
| Marketing/referrals | Art. 6(1)(a) — consent |
| Error logs | Art. 6(1)(f) — legitimate interest (security/debugging) |
| Affiliate click tracking | Art. 6(1)(f) — legitimate interest (with opt-out) |

---

### Finding 9 — MEDIUM: analytics_events Survive Account Deletion
**Evidence:**
```sql
-- 20260312000002_create_analytics_events.sql:11
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
```
After account deletion, `analytics_events` rows persist with `user_id = NULL`. The `session_id` field (format: `sess_{timestamp}_{random}`) combined with timestamps, screen names, and payloads may allow re-identification, particularly if cross-referenced with logs.

**Fix Required:**
Change `ON DELETE SET NULL` to `ON DELETE CASCADE` on `analytics_events.user_id`, OR implement a scheduled cleanup job that purges rows for deleted users within the 30-day window stated in the privacy policy.

---

### Finding 10 — MEDIUM: affiliate_clicks Survive Account Deletion
**Evidence:**
```sql
-- 20260311000001_affiliate_clicks.sql:8
user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
```
Same pattern as analytics_events. Affiliate click records (partner, destination, platform, `clicked_at`) remain after deletion. These records show travel intentions and platform usage patterns.

---

### Finding 11 — MEDIUM: Waitlist Emails — No Deletion Path
`waitlist_emails` stores raw email addresses (`email TEXT NOT NULL`). These are pre-signup records with no user account linkage. Users who submitted their email to the waitlist have no way to delete this data. No retention period is defined. For DACH users who submitted emails before launch, GDPR Art. 17 rights cannot be exercised.

**Fix Required:**
1. Add a `/waitlist/unsubscribe` endpoint (via Supabase edge function or email link) 
2. Define and document a retention policy (e.g., delete 1 year after launch or upon user request)
3. Confirm a deletion link was included in the waitlist confirmation email

---

### Finding 12 — MEDIUM: Privacy Policy Gaps for DACH
Missing required elements under Art. 13 GDPR:

1. **Data Controller Identity**: No company registration number, country of incorporation, or physical address listed. Only email contacts. German DPA requires full controller identity.
2. **Data Protection Officer**: Whether a DPO is required depends on scale. If processing >250 employees worth of data or systematic monitoring, appoint and list DPO contact.
3. **EU Representative**: If ROAM Travel Inc. has no EU establishment, Art. 27 requires appointing an EU representative. No representative listed.
4. **Supervisory Authority**: Only "lodge complaint" mentioned. Must name the specific supervisory authority (BfDI for Germany: `https://www.bfdi.bund.de`; DSB for Austria: `https://www.dsb.gv.at`; EDÖB for Switzerland: `https://www.edoeb.admin.ch`).
5. **Retention Periods**: Push tokens, affiliate clicks, error logs, social profiles, analytics events — no individual retention periods defined.
6. **Switzerland (nDSG)**: Swiss Data Protection Act (nDSG, in force Sept 2023) has additional requirements including registration of data processing activities (Bearbeitungsreglement) and information duties.

---

## Third-Party Data Flow Map

| Third Party | Data Sent | Region | DPA Exists | SCC Required | Risk |
|-------------|-----------|--------|------------|--------------|------|
| Supabase | All user data (auth, trips, social, location) | US (unless migrated) | Supabase offers DPA | Yes | HIGH |
| Anthropic | Trip prompts, chat, travel profile (incl. dietary) | US | Anthropic offers DPA | Yes | HIGH |
| PostHog | User ID, events, screen views, (potentially email) | US (default) | PostHog offers DPA | Yes | HIGH |
| RevenueCat | User ID, subscription status, purchase events | US | RevenueCat offers DPA | Yes | MEDIUM |
| ElevenLabs | Itinerary narration text | US | ElevenLabs offers DPA | Yes | MEDIUM |
| Unsplash | Photo ID queries (no user PII) | US | Not required | No | LOW |
| Open-Meteo | City names for weather/geocoding | Switzerland/EU | Not required | No | LOW |
| Frankfurter API | Currency codes (no PII) | EU | Not required | No | LOW |

---

## What Open-Meteo Sends (Confirmation: LOW Risk)
Open-Meteo (`geocoding-api.open-meteo.com`, `api.open-meteo.com`) is operated from Switzerland, which has EU adequacy status. Requests contain only destination city names (not user identifiers). No personal data transferred. **Compliant as-is.**

## What Unsplash Sends (Confirmation: LOW Risk)
Unsplash API calls include only photo IDs and the API key. No user identifiers are sent. **Compliant as-is.**

---

## Resolved This Session

None — all findings are newly identified.

---

## Recommendations (Priority Order)

- [ ] **[IMMEDIATE — blocks DACH launch]** Implement Delete Account UI in `app/profile.tsx` with confirmation dialog and backend deletion edge function
- [ ] **[IMMEDIATE — blocks DACH launch]** Add GDPR consent banner to web (`tryroam.netlify.app`) before any PostHog tracking fires
- [ ] **[IMMEDIATE — blocks DACH launch]** Remove `email` field from `WAITLIST_JOINED` PostHog event; replace with opaque identifier
- [ ] **[IMMEDIATE — blocks DACH launch]** Switch PostHog host to `https://eu.i.posthog.com` via env var
- [ ] **[PRE-LAUNCH]** Execute DPAs with: Anthropic, PostHog, ElevenLabs, RevenueCat, Supabase
- [ ] **[PRE-LAUNCH]** Migrate Supabase project to EU region (Frankfurt) OR document SCCs in privacy policy
- [ ] **[PRE-LAUNCH]** Rewrite privacy policy to include: legal basis per activity, EU representative, supervisory authority contacts (BfDI/DSB/EDÖB), DPO contact, per-category retention periods
- [ ] **[PRE-LAUNCH]** Add in-app analytics opt-out toggle in Profile screen
- [ ] **[PRE-LAUNCH]** Add waitlist unsubscribe endpoint (email link or web form)
- [ ] **[SPRINT]** Change `analytics_events.user_id` and `affiliate_clicks.user_id` to `ON DELETE CASCADE`
- [ ] **[SPRINT]** Audit `error_logs.payload` for PII leakage; add message sanitization before insert
- [ ] **[SPRINT]** Add legal basis documentation to privacy policy for each processing category
- [ ] **[SPRINT]** Add ElevenLabs to "Third-Party Services" section of privacy policy
- [ ] **[BACKLOG]** Define and implement data retention schedule (automated purge jobs for analytics, error logs, push tokens with defined TTLs)
- [ ] **[BACKLOG]** Evaluate whether dietary restriction data in AI prompts constitutes Art. 9 special category data requiring explicit consent
- [ ] **[BACKLOG]** Assess DPO requirement threshold; appoint DPO or document exemption
- [ ] **[BACKLOG]** Swiss nDSG: create Bearbeitungsreglement (data processing record) for Swiss users

---

## DACH Launch Blockers (Must Fix Before Going Live in DE/AT/CH)

1. No account deletion UI (GDPR Art. 17 hard requirement)
2. No consent mechanism for analytics tracking (TTDSG Germany, DSG Austria, nDSG Switzerland)
3. Email PII leaking to PostHog
4. PostHog routing EU user data to US without SCCs documented
5. No DPAs executed with any data processors

**Current DACH readiness: NOT READY. 5 launch blockers must be resolved.**
