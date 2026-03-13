# ROAM Security Audit

**Date:** 2025-03-12  
**Status:** Pre-deploy audit complete  
**Scope:** OWASP Top 10, Supabase, env/secrets, input handling, dependencies

---

## Critical (Fix Immediately)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| 1 | Hardcoded Supabase credentials | `outputs/waitlist.html`, `outputs/trip/index.html`, `outputs/index.html` | Inject via `EXPO_PUBLIC_*` at build; remove from repo |
| 2 | Amadeus client secret in client | `lib/flights-amadeus.ts` | Move OAuth to Supabase edge function; use secret server-side only |
| 3 | Anthropic API key in native binary | `lib/claude.ts` | Remove direct API fallback; always use edge function with JWT |

---

## High (Fix Before Deploy)

| # | Finding | Fix |
|---|---------|-----|
| 4–5 | Security headers, CSP | **DONE** — Added to `netlify.toml` |
| 6 | `chaos_dares` unauthenticated insert | Require auth or server-side rate limit + CAPTCHA |
| 7 | `shared_trips` public read | Document; consider explicit opt-in |
| 8 | `innerHTML` with API content | Use DOMPurify or safer APIs |
| 9 | `document.write` in share-card | Replace with `createElement` + append |
| 10 | CORS `Access-Control-Allow-Origin: *` | Restrict to app origins |

---

## Medium (Next Sprint)

| # | Finding | Fix |
|---|---------|-----|
| 11–12 | `prompt_versions`, `content_freshness` permissive RLS | Restrict to authenticated/service role |
| 13 | Sensitive data in AsyncStorage | Use `expo-secure-store` for tokens; avoid PII |
| 14 | Amadeus token in AsyncStorage | Use SecureStore; move to backend long-term |
| 15 | Invite code brute-force | Rate limit RPC; short-lived invite links |
| 16 | Trip ID validation | Strict UUID; rate limit lookups |

---

## Implemented

- [x] Netlify security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP)
- [x] Deploy workflow creates `_redirects` (SPA fallback)
- [x] Hardcoded credentials removal: outputs use `__SUPABASE_URL__` / `__SUPABASE_ANON__`; run `npm run inject-outputs` with env at build
- [ ] Amadeus OAuth to backend
- [ ] Anthropic fallback removal

---

## Notes

- Supabase anon key is OK client-side when RLS is correct; avoid hardcoding.
- `npm audit`: 0 known vulnerabilities.
- Rotate Supabase anon key if `outputs/` were ever deployed with it.
