# ROAM Security Audit

**Date:** 2026-03-13
**Previous audit:** 2025-03-12
**Scope:** `supabase/`, `lib/`, `app/` — RLS, edge functions, secrets, CORS, input validation, error handling

---

## Audit Summary

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| CRITICAL | 5 | 5 | 0 |
| HIGH | 8 | 8 | 0 |
| MEDIUM | 7 | 0 | 7 |
| LOW | 4 | 0 | 4 |

---

## CRITICAL — Fixed

| # | Finding | Location | Fix Applied |
|---|---------|----------|-------------|
| 1 | `venues` RLS: `FOR ALL USING(true)` with no `TO` clause — anon gets full read/write | `20260310_create_venues_table.sql` | Added `TO service_role` |
| 2 | `prompt_versions` RLS: `FOR ALL USING(true)` — anon full access | `20260312_create_prompt_versions.sql` | service_role write + authenticated read-only |
| 3 | `content_freshness` RLS: `FOR ALL USING(true)` — anon full access | `20260312_create_content_freshness.sql` | service_role write + authenticated read-only |
| 4 | `voice-proxy` no JWT verification — only checks header format | `supabase/functions/voice-proxy/index.ts` | Added Supabase JWT verification via `auth.getUser()` |
| 5 | `weather-intel` no authentication at all | `supabase/functions/weather-intel/index.ts` | Added Supabase JWT verification |

---

## HIGH — Fixed

| # | Finding | Location | Fix Applied |
|---|---------|----------|-------------|
| 6 | `error_logs` readable by anon (leaks stack traces, error details) | `20260312_create_error_logs.sql` | Restricted SELECT/INSERT to `authenticated` |
| 7 | `analytics_events` readable by anon (leaks user behavior) | `20260312_create_analytics_events.sql` | Removed public SELECT; INSERT to `authenticated` |
| 8 | `waitlist_emails` readable by anon (leaks all emails) | `20260312_fix_waitlist_rls.sql` | Removed anon SELECT; authenticated read + anon insert |
| 9 | CORS `Access-Control-Allow-Origin: *` on 4 edge functions | `weather-intel`, `enrich-venues`, `destination-photo`, `voice-proxy` | Origin allowlist matching `claude-proxy` pattern |
| 10 | Error responses leak internal details (`details: String(err)`) | `enrich-venues`, `destination-photo`, `voice-proxy`, `weather-intel` | Generic error messages only |
| 11 | `claude-proxy` leaks full Anthropic error body to client | `supabase/functions/claude-proxy/index.ts` | Generic status-aware error message |
| 12 | `send-push` uses `authHeader.includes(serviceRoleKey)` (substring match) | `supabase/functions/send-push/index.ts` | Exact `Bearer ${key}` match |
| 13 | `send-push` missing try/catch on `req.json()` | `supabase/functions/send-push/index.ts` | Added try/catch + JSON validation |

---

## MEDIUM — Remaining (Next Sprint)

| # | Finding | Location | Recommendation |
|---|---------|----------|----------------|
| 14 | Amadeus OAuth client secret in client bundle (`EXPO_PUBLIC_AMADEUS_SECRET`) | `lib/flights-amadeus.ts` | Move OAuth flow to an edge function; keep secret server-side |
| 15 | Sensitive data in AsyncStorage (Amadeus token, user prefs) | `lib/flights-amadeus.ts` | Use `expo-secure-store` for tokens |
| 16 | `chaos_dares` INSERT allows any authenticated user | `20260319_chaos_dare.sql` | Add per-user rate limit or ownership check |
| 17 | `hostel_channels` INSERT open to all authenticated (no ownership) | `20260311_social_layer.sql:406` | Add `created_by = auth.uid()` check |
| 18 | `safety_alerts` INSERT open to all authenticated | `20260311_social_layer.sql:485` | Verify security_fix migration drops this correctly (policy name mismatch) |
| 19 | `nightlife_groups` security fix policy names may not match originals | `20260312_security_fix_rls.sql` | Verify `DROP POLICY` names align with `20260311_social_layer.sql` |
| 20 | No rate limiting on `weather-intel`, `voice-proxy`, `destination-photo`, `enrich-venues` | Edge functions | Add per-user rate limiting |

---

## LOW — Remaining

| # | Finding | Location | Recommendation |
|---|---------|----------|----------------|
| 21 | `onboarding_ab_assignments` INSERT open to all authenticated | `20260319_onboarding_ab_test.sql` | Acceptable for A/B test; consider `user_id = auth.uid()` check |
| 22 | Invite code functions (`get_group_preview_by_invite`) lack format/length validation | `20260319_group_preview_rpc.sql` | Add length limit (e.g., max 20 chars) + rate limit |
| 23 | `scripts/test-itinerary.mjs` calls Anthropic API directly | `scripts/test-itinerary.mjs` | Mark as dev-only; CI gate already blocks in `lib/`/`app/` |
| 24 | `.env.example` lists `EXPO_PUBLIC_ANTHROPIC_API_KEY` | `.env.example` | Remove or mark as deprecated |

---

## Verified Secure

- No hardcoded secrets, API keys, or credentials in source code
- No `sk-ant-*`, `AKIA*`, `postgres://`, or private keys in repo
- `.env` properly gitignored; `.env.example` contains placeholders only
- `outputs/` HTML uses `__SUPABASE_URL__`/`__SUPABASE_ANON__` placeholders (build-time injection)
- All edge functions read secrets from `Deno.env.get()`
- `claude-proxy` uses proper origin allowlist and JWT verification
- `revenuecat-webhook` uses exact Bearer secret match and restricted CORS
- `supabase/config.toml` references `env()` for all secrets
- No `eval()`, `new Function()`, `dangerouslySetInnerHTML`, or `innerHTML` in `app/` or `lib/`
- No SQL injection (all Supabase client queries use parameterized `.eq()`/`.in()`)
- `supabase.ts` has safe placeholders when env vars are missing

---

## Client-Side API Keys (EXPO_PUBLIC_)

| Variable | File | Risk | Notes |
|----------|------|------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | `lib/supabase.ts` | Expected | Required for client SDK |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts` | Expected | RLS protects data |
| `EXPO_PUBLIC_AMADEUS_KEY` | `lib/flights-amadeus.ts` | Low | Public client ID |
| `EXPO_PUBLIC_AMADEUS_SECRET` | `lib/flights-amadeus.ts` | **HIGH** | OAuth secret — move to edge function |
| `EXPO_PUBLIC_GOOGLE_PLACES_KEY` | `lib/google-places.ts` | Low | Restricted via Google Console |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | `lib/mapbox.ts` | Low | Scoped public token |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | `lib/revenue-cat.ts` | Expected | Public SDK key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | `lib/revenuecat.ts` | Expected | Public SDK key |
| `EXPO_PUBLIC_TICKETMASTER_KEY` | `lib/events.ts` | Low | Public consumer key |
| `EXPO_PUBLIC_EVENTBRITE_TOKEN` | `lib/local-events.ts` | Medium | Consider edge function proxy |
| `EXPO_PUBLIC_OPENWEATHER_KEY` | `lib/weather.ts` | Medium | Consider edge function proxy |
| `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` | `lib/unsplash.ts` | Low | Public access key |
| `EXPO_PUBLIC_AVIATIONSTACK_KEY` | `lib/aviationstack.ts` | Medium | Consider edge function proxy |
| `EXPO_PUBLIC_VISA_API_KEY` | `lib/visa-requirements.ts` | Medium | RapidAPI key — consider proxy |
| `EXPO_PUBLIC_CLIMATIQ_KEY` | `lib/carbon-footprint.ts` | Medium | Consider edge function proxy |

---

## Files Changed in This Audit

### Migrations (RLS hardening)
- `supabase/migrations/20260310_create_venues_table.sql`
- `supabase/migrations/20260312_create_prompt_versions.sql`
- `supabase/migrations/20260312_create_content_freshness.sql`
- `supabase/migrations/20260312_create_error_logs.sql`
- `supabase/migrations/20260312_create_analytics_events.sql`
- `supabase/migrations/20260312_fix_waitlist_rls.sql`
- `supabase/migrations/20260319_chaos_dare.sql`
- `supabase/migrations/20260319_onboarding_ab_test.sql`
- `supabase/migrations/20260313_security_audit_rls_fixes.sql` (NEW — patches live DB)

### Edge Functions (auth, CORS, error handling)
- `supabase/functions/voice-proxy/index.ts`
- `supabase/functions/weather-intel/index.ts`
- `supabase/functions/enrich-venues/index.ts`
- `supabase/functions/destination-photo/index.ts`
- `supabase/functions/claude-proxy/index.ts`
- `supabase/functions/send-push/index.ts`
