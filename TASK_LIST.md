# ROAM Task List (Generated 2025-03-12)

## Completed This Session

- [x] Build-fix: Deploy workflow now creates `_redirects` (SPA fallback)
- [x] Security audit: Full OWASP/Supabase audit; SECURITY_AUDIT.md created
- [x] Netlify: Security headers (X-Frame-Options, CSP, etc.) and fixed connect-src for APIs
- [x] Guest mode plan: PLAN_GUEST_MODE.md
- [x] Bundle size plan: PLAN_BUNDLE_SIZE.md (target <1.5MB from ~6.1MB)

---

## Next Priority (Security)

1. ~~**Remove hardcoded Supabase creds**~~ — outputs use placeholders + `npm run inject-outputs` (set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in Netlify env for outputs site)
2. **Move Amadeus OAuth to edge function** — Remove EXPO_PUBLIC_AMADEUS_SECRET from client
3. **Remove Anthropic direct fallback** — Use edge function only; remove client API key path
4. **Restrict chaos_dares insert** — Auth or rate limit + CAPTCHA
5. **Tighten RLS** — prompt_versions, content_freshness

---

## Next Priority (Features)

6. **Implement guest mode** — See PLAN_GUEST_MODE.md
7. **Reduce bundle size** — See PLAN_BUNDLE_SIZE.md
8. **Verify Netlify deploy** — Confirm roamapp.app loads after push

---

## Technical Debt

- Replace `document.write` in share-card with createElement + append
- Add DOMPurify or safer API for innerHTML in outputs/trip
- Rate limit invite code RPC
- Add `source` column to waitlist_emails for paywall vs onboard attribution

---

## Reference

- SECURITY_AUDIT.md — Full security findings
- PLAN_GUEST_MODE.md — Guest mode implementation plan
- PLAN_BUNDLE_SIZE.md — Bundle optimization plan
- DEPLOY_SETUP.md — Netlify build/publish config
