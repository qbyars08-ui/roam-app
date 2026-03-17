# Dependency Scan — 2025-03-13

## Critical (fix immediately)

- **lib/flights-amadeus.ts**: `EXPO_PUBLIC_AMADEUS_SECRET` — OAuth client secret is bundled into the client. NEVER put secrets in EXPO_PUBLIC vars. Move Amadeus token exchange to a Supabase edge function (server-side only). — Create `supabase/functions/amadeus-proxy` to fetch tokens; call it from client.
- **supabase/functions/send-push/index.ts**: Authenticates by passing `SUPABASE_SERVICE_ROLE_KEY` in the Authorization header. Passing the service role key in requests risks leakage in logs or misrouted traffic. — Use a dedicated `SEND_PUSH_INTERNAL_SECRET` for internal function-to-function auth.

## Warning (fix this sprint)

- **jest-expo@55.0.9** (via @tootallnate/once): 5 low severity — Incorrect Control Flow Scoping (CVE-2026-3449). `npm audit fix --force` would downgrade to jest-expo@47 (breaking). — Monitor; consider excluding from audit or waiting for jest-expo patch.
- **expo-av@15.0.2**: Unmaintained per React Native Directory. Deprecated; will be removed from SDK. Used in lib/elevenlabs.ts for Audio playback. — Migrate to expo-audio (stable for SDK 55).
- **.gitignore**: Missing `*.keystore`, `google-services.json`, `GoogleService-Info.plist`. — Add these to prevent accidental commit of native secrets.
- **lib/revenuecat.ts**: Duplicate of lib/revenue-cat.ts. Unused (app imports revenue-cat). — Remove lib/revenuecat.ts to avoid confusion.
- **supabase/functions/weather-intel, voice-proxy**: `Access-Control-Allow-Origin: "*"` — Permissive CORS. — Restrict to app origins (roamapp.app, roamtravel.app, localhost) like claude-proxy.
- **expo-doctor**: 11 packages out of date. Major: @types/jest (29 vs 30), @types/react (19 vs 18), jest (29 vs 30). Minor: react-native-maps, typescript, @react-navigation/bottom-tabs. — Run `npx expo install --check` and align versions.

## Info (monitor)

- **Supabase edge functions**: Pin @supabase/supabase-js@2.43.4; app uses ^2.49.0. — Version drift; consider bumping edge functions to match.
- **date-fns@4.1.0**: ~39MB in node_modules. Tree-shaking in use (`import { format } from 'date-fns'`). — Good; no duplicate date libs.
- **lucide-react-native@0.577.0**: ~37MB. — Consider path imports if bundle size grows.
- **node-forge@1.3.3**: License (BSD-3-Clause OR GPL-2.0). — Use BSD path; no GPL contamination.
- **expo-speech-recognition@3.1.1**: Not in Expo SDK 55 core. — Verify compatibility with SDK 55.

## Clean

- No `eval()`, dynamic `require()`, or injection vectors.
- Supabase anon key (client) vs service_role (edge functions only) used correctly.
- RevenueCat: EXPO_PUBLIC keys are public API keys — correct.
- config.toml uses `env()` — no hardcoded secrets.
- Licenses: MIT, Apache-2.0, BSD dominate. No blocking GPL.
- 1 date library (date-fns); no duplicates.

---

**Summary:** 2 critical, 6 warnings, 5 info items. 2 critical security issues (Amadeus secret in client, service role in send-push auth). 778+ packages scanned; supply chain otherwise clean.
