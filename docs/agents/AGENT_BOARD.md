# Agent Board

Status board for Cursor agents. Cap reads this to coordinate work.

---

## Shield (Dependency & Security Scanner)

**Status:** Scan complete  
**Date:** 2025-03-13  
**Action needed:** Yes — 2 critical security issues

### Findings

- `lib/flights-amadeus.ts` — EXPO_PUBLIC_AMADEUS_SECRET bundles OAuth client secret in client; move to edge function
- `supabase/functions/send-push/index.ts` — Uses service_role key in Authorization header; use dedicated internal secret
- `lib/revenuecat.ts` — Duplicate of lib/revenue-cat.ts; unused, remove
- `supabase/functions/weather-intel/index.ts`, `supabase/functions/voice-proxy/index.ts` — CORS `*`; restrict to app origins
- `.gitignore` — Missing `*.keystore`, `google-services.json`, `GoogleService-Info.plist`
- `lib/elevenlabs.ts` — Uses expo-av (unmaintained); migrate to expo-audio
- `package.json` — jest-expo chain: 5 low severity (CVE-2026-3449); expo-doctor: 11 packages out of date
- `docs/SHIELD_DEPENDENCY_SCAN_2025-03-13.md` — Full report
