# Security Audit — 2025-03-13

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH     | 2 |
| MEDIUM   | 4 |
| LOW      | 2 |

---

## CRITICAL

### 1. EXPO_PUBLIC_AMADEUS_SECRET — OAuth client secret in client bundle — FIXED
- **File:** `lib/flights-amadeus.ts`
- **Vector:** Amadeus API key + secret were bundled into the client. Anyone could extract them and abuse the API.
- **Fix applied:** Created `supabase/functions/amadeus-proxy`; client now calls proxy. Set `AMADEUS_KEY` and `AMADEUS_SECRET` in Supabase env.

### 2. send-push authenticates with service_role key in header — FIXED
- **File:** `supabase/functions/send-push/index.ts`
- **Vector:** Passing SUPABASE_SERVICE_ROLE_KEY in requests risked leakage in logs, misrouted traffic, or replay.
- **Fix applied:** Now uses `SEND_PUSH_INTERNAL_SECRET`. Callers must pass `Authorization: Bearer ${SEND_PUSH_INTERNAL_SECRET}`.

### 3. voice-proxy and weather-intel lack JWT verification — FIXED
- **Files:** `supabase/functions/voice-proxy/index.ts`, `supabase/functions/weather-intel/index.ts`
- **Vector:** voice-proxy checked Bearer header but did not verify JWT. weather-intel had no auth. Anyone could burn ElevenLabs/OpenWeatherMap quota.
- **Fix applied:** Both now verify JWT via supabase.auth.getUser(). CORS restricted to app origins.

---

## HIGH

### 4. shareId not validated as UUID before DB query
- **File:** `lib/sharing.ts`
- **Vector:** Malformed shareId could cause unexpected behavior; no format validation.
- **Fix:** Validate UUID format before querying.

### 5. claude-proxy lacks input length limits
- **File:** `supabase/functions/claude-proxy/index.ts`
- **Vector:** Unbounded systemPrompt/messages could cause token exhaustion or cost abuse.
- **Fix:** Add max length limits (e.g. 50KB system, 100KB messages total).

---

## MEDIUM

### 6. .gitignore missing native secret patterns
- **File:** `.gitignore`
- **Fix:** Add `*.keystore`, `google-services.json`, `GoogleService-Info.plist`.

### 7. weather-intel and voice-proxy use CORS `*`
- **Files:** `supabase/functions/weather-intel/index.ts`, `supabase/functions/voice-proxy/index.ts`
- **Fix:** Restrict to app origins (like claude-proxy).

### 8. voice-proxy leaks ElevenLabs error text to client
- **File:** `supabase/functions/voice-proxy/index.ts`
- **Fix:** Return generic error; log details server-side only.

### 9. store loadPersistedTrips — JSON.parse without schema validation
- **File:** `lib/store.ts`
- **Vector:** Malicious/corrupt AsyncStorage could cause prototype pollution. Low risk (local only).
- **Fix:** Add basic shape validation or use safe parse wrapper.

---

## LOW

### 10. prompt_versions RLS allows client writes (migration 20260312_create_prompt_versions.sql)
- **Note:** security_fix_rls.sql later restricted to SELECT-only. Verify current state.

### 11. Deep link trip regex allows non-UUID formats
- **File:** `app/_layout.tsx`
- **Vector:** `[0-9a-f-]+` matches non-UUID strings. getSharedTrip returns null for invalid UUIDs; low impact.
- **Fix:** Use strict UUID regex.

---

## Deployment

After deploying these fixes, set in Supabase Edge Function secrets:

- `AMADEUS_KEY` — Amadeus API key (was EXPO_PUBLIC_AMADEUS_KEY)
- `AMADEUS_SECRET` — Amadeus API secret (was EXPO_PUBLIC_AMADEUS_SECRET)
- `SEND_PUSH_INTERNAL_SECRET` — Random string for send-push auth (generate with `openssl rand -hex 32`)

Update callers of send-push to use `Authorization: Bearer ${SEND_PUSH_INTERNAL_SECRET}` instead of service_role key.

---

## Clean (no issues found)

- RLS on profiles, shared_trips: correct
- claude-proxy: JWT verified, trip limit server-enforced, CORS restricted
- lib/claude.ts: No API keys; routes through edge function
- parseItinerary: try/catch, type validation
- Trip data rendered as React Text (no XSS)
- Subscription bypass: server enforces via profiles.trips_generated_this_month
- Guest limits: server rejects invalid JWTs; fake guests converted to anon before API call
