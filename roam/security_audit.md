# Security Audit — 2026-03-13

**Agent:** 08 Security (Scanguard)  
**Scope:** All edge functions + claude-proxy admin bypass  
**Date:** 2026-03-13

---

## Summary: 0 critical, 0 high, 2 low (fixed)

All 7 edge functions audited. Admin bypass added and verified. Input validation gaps fixed.

---

## Edge Function Audit

| Function | Auth | CORS | Rate Limit | Input Validation | Error Handling |
|----------|------|------|------------|------------------|----------------|
| claude-proxy | JWT | Allowlist | Trip limit (1/mo free) | 50KB system, 100KB messages | Generic only |
| voice-proxy | JWT | Allowlist | 30/min | text 5K, voice_id regex | Generic only |
| weather-intel | JWT | Allowlist | 60/min | destination 200 chars | Generic only |
| destination-photo | JWT | Allowlist | 60/min | query 200 chars (added) | Generic only |
| enrich-venues | JWT | Allowlist | 30/min | 30 venues, name 200, city 100 (added) | Generic only |
| send-push | Bearer (service_role) | N/A | N/A | user_ids, title, body | Generic only |
| revenuecat-webhook | Bearer (RC secret) | RC origin only | N/A | event type | Generic only |

---

## Claude-Proxy Admin Bypass — Verified

**Pro bypass:** Users with `subscription_tier !== "free"` skip the trip limit. Works correctly.

**Admin bypass (added):** `CLAUDE_PROXY_ADMIN_EMAILS` (Supabase env, comma-separated) allows support/testing emails to bypass the trip limit without Pro subscription.

- Logic: `isAdmin = user.email in adminEmails`
- When `isAdmin` is true, the 429 "Trip limit reached" is not returned
- Env var is server-side only (not EXPO_PUBLIC)
- Documented in `.env.example` as commented example

---

## Fixes Applied This Session

1. **claude-proxy:** Added `CLAUDE_PROXY_ADMIN_EMAILS` admin bypass for allowlisted emails
2. **destination-photo:** Added `query` length limit (200 chars) to prevent unbounded Google API calls
3. **enrich-venues:** Added venue `name` (200) and `city` (100) length validation

---

## Resolved This Session

- Admin bypass: Implemented and documented
- destination-photo query: Unbounded → 200 chars max
- enrich-venues name/city: Unbounded → 200/100 chars max

---

## Recommendations

- [ ] **LOW:** Consider `SEND_PUSH_INTERNAL_SECRET` for send-push instead of service_role key (defense in depth)
- [ ] **LOW:** Add `roamtravel.app` subdomain to CORS if staging exists (e.g. `staging.roamtravel.app`)

---

## Files Changed

- `supabase/functions/claude-proxy/index.ts` — admin bypass
- `supabase/functions/destination-photo/index.ts` — query length limit
- `supabase/functions/enrich-venues/index.ts` — venue name/city length limits
- `.env.example` — CLAUDE_PROXY_ADMIN_EMAILS doc
