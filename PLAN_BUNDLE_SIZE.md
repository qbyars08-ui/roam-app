# Bundle Size Reduction Plan: 6.1MB → <1.5MB

**Current:** ~6.1MB (dist/_expo/static/js/web)  
**Target:** <1.5MB  
**Strategy:** Tree-shake, lazy-load, replace heavy deps, split by route

---

## Current State

- `__common-*.js` ≈ 3.5MB — shared chunks (React, RN, Supabase, etc.)
- 80+ route chunks (asyncRoutes already enabled)
- Heavy deps: react-native-maps, expo-location, expo-speech, html-to-image, date-fns, RevenueCat, fonts

---

## Phase 1: Quick Wins (est. -1.5MB)

| Action | Est. savings | Risk |
|--------|--------------|------|
| **Dynamic import react-native-maps** | ~500KB | Web doesn't need maps — use `require()` only on native or lazy-load map routes |
| **Dynamic import date-fns** | ~100KB | Import specific functions: `import { format } from 'date-fns'`; tree-shake unused |
| **Font subsetting** | ~200KB | Use font-display: swap; subset Google Fonts to Latin; or switch to system fonts on web |
| **Replace html-to-image with lighter alternative** | ~100KB | Use canvas API or server-side screenshot for share cards on web |
| **Lazy RevenueCat** | ~100KB | `import()` only when paywall/pro check needed |

---

## Phase 2: Native-Only Exclusion for Web

| Dep | Strategy |
|-----|----------|
| react-native-maps | Platform.OS !== 'web' — stub on web or use react-leaflet (smaller) for trip map |
| expo-location | Lazy load only in screens that need it |
| expo-speech / expo-speech-recognition | Lazy load in VoiceInputButton, LanguageSurvival |
| expo-apple-authentication | Already web-stubbed; ensure not bundled |
| expo-notifications | Lazy or stub for web |
| react-native-confetti-cannon | Lazy load only in celebration screens |

---

## Phase 3: Chunk / Route Optimization

1. **Ensure async routes** — `asyncRoutes: { web: true }` already in app.json
2. **Lazy Stack** — Lazy-load heavy screens (chaos-mode, itinerary, chat) so they don't bloat initial load
3. **Reduce common chunk** — Move Supabase, zustand, RevenueCat to route-level where possible
4. **Code split libs** — `import('./lib/claude')` only when AI generation runs

---

## Phase 4: Dependency Audit

| Dep | Size impact | Action |
|-----|-------------|--------|
| @expo-google-fonts/* (3 packages) | High | Subset or system fonts on web |
| react-native-reanimated | High | Required for animations; keep |
| @supabase/supabase-js | Medium | Keep; required |
| zustand | Low | Keep |
| lucide-react-native | Medium | Tree-shake icons; use `import { X } from 'lucide-react-native'` — DONE: only icon lib used |
| @expo/vector-icons | ~2.5MB (web) | STUBBED: metro.config.js resolves to lib/stub-vector-icons.tsx on web |
| date-fns | Medium | Use `date-fns/format` etc.; avoid full import |

---

## Implementation Order

1. **Create metro resolver for web** — Add `resolver.platforms` to exclude native-only modules on web
2. **Lazy-load maps** — `const Map = Platform.OS === 'web' ? () => null : require('react-native-maps')` or dynamic import
3. **Font optimization** — `font-display: swap`; subset; or skip custom fonts on web
4. **date-fns tree-shaking** — Audit imports; use `date-fns/format`
5. **Lazy RevenueCat** — Dynamic import in pro-gate
6. **Measure** — Run `npx expo export --platform web` after each phase; track `du -sh dist/_expo/static/js/web`

---

## Success Criteria

- [ ] Initial load (main + first route) < 1.5MB
- [ ] LCP and FCP acceptable on 3G
- [ ] No regression on native builds
