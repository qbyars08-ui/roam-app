# Agent Board

Status board for Cursor agents. Cap reads this to coordinate work.

---

## Shield (Dependency & Security Scanner)

**Status:** Security audit complete; fixes applied  
**Date:** 2025-03-13  
**Action needed:** Yes — deploy env vars (AMADEUS_KEY, AMADEUS_SECRET, SEND_PUSH_INTERNAL_SECRET)

### Findings

- `lib/flights-amadeus.ts` — FIXED: Created amadeus-proxy; keys now server-side
- `supabase/functions/send-push/index.ts` — FIXED: Uses SEND_PUSH_INTERNAL_SECRET
- `supabase/functions/voice-proxy/index.ts`, `weather-intel/index.ts` — FIXED: JWT verification + CORS restrict
- `lib/sharing.ts` — FIXED: UUID validation for shareId
- `supabase/functions/claude-proxy/index.ts` — FIXED: Input length limits (50KB/100KB)
- `.gitignore` — FIXED: Added *.keystore, google-services.json, GoogleService-Info.plist
- `lib/revenuecat.ts` — Duplicate; remove
- `docs/SECURITY_AUDIT_2025-03-13.md` — Full audit report
