# ROAM — Project CLAUDE.md

## Memory System
At the start of every session, read these files for persistent context:
- `memory/decisions.md` — Architectural and product decisions with reasoning
- `memory/people.md` — Key people involved in the project
- `memory/preferences.md` — Quinn's development, design, and deploy preferences
- `memory/user.md` — Quinn's profile, skills, and working style

At the end of every session, update these files with any new decisions, preferences, or learnings.

## What is ROAM?
AI-powered travel planner for Gen Z. React Native + Expo Router + Supabase + RevenueCat.

## Commands
```bash
# Node (required — nvm path)
export PATH="/Users/quinnbyars/.nvm/versions/node/v20.20.1/bin:$PATH"

# TypeScript check (run after every change)
npx tsc --noEmit

# Start dev server
npx expo start

# Run tests
npx jest

# Lint
npx eslint . --ext .ts,.tsx
```

## Conventions

### Design System (lib/constants.ts)
- Dark-only UI. Never add light mode.
- Colors: bg=#0A0A0A, surface1=#141414, surface2=#1C1C1C, accent=#E8F5E1, action=#5B9E6F, muted=#8A8A8A
- Keep coral=#E8614A (alerts only), gold=#C9A84C (premium badges only)
- Headlines: Space Grotesk Bold/Medium (`FONTS.header`, `FONTS.headerMedium`)
- Body: Inter Regular/Medium/Bold (`FONTS.body`, `FONTS.bodyMedium`, `FONTS.bodySemiBold`)
- Data/labels: DM Mono (`FONTS.mono`)
- Use COLORS tokens, never hardcode rgba() values
- Icons: lucide-react-native only, strokeWidth={1.5}, size={20} default
- No italic headers. No textTransform uppercase on non-data labels.
- Buttons: pill-shaped (borderRadius: RADIUS.pill) where appropriate
- Cards: two types only — photo (full-bleed) and data (#141414 bg)

### Architecture
- State: Zustand (`lib/store.ts`). Persist important state to AsyncStorage.
- Edge function proxy: all Claude API calls go through `supabase/functions/claude-proxy/`
- File routing: `app/(tabs)/` for tab screens, `app/` for modals
- Collapsible sections: `useState(false)` + Pressable header + ChevronDown rotation pattern

### Localization (lib/i18n/)
- i18next + react-i18next + expo-localization for multi-language support
- Supported: English (en), Spanish (es), French (fr), Japanese (ja)
- Translation files: `lib/i18n/locales/{en,es,fr,ja}.ts`
- In functional components: `const { t } = useTranslation();` then `t('namespace.key')`
- In class components / memo: `import i18n from '../../lib/i18n';` then `i18n.t('key')`
- Helper functions in `lib/i18n/helpers.ts`: `tCategory()`, `tBudget*()`, `tVibe()`, `tExpense()`
- Language persisted to AsyncStorage key `@roam/locale`
- Device language auto-detected on first launch
- Language selector in Profile screen

### Code Style
- Always use `useCallback` and `useMemo` for handlers/computed values
- Haptic feedback on all user interactions (`lib/haptics.ts` wrapper)
- `type` imports for interfaces (not `import { MyType }`)
- Keep `any` only at DB/SDK boundaries (Supabase rows, RevenueCat). Use `unknown` + type guards elsewhere.
- All user-facing strings should use i18n `t()` function, not hardcoded English

## Audio System (ElevenLabs + expo-av)

### Architecture
- All ElevenLabs API calls routed through `supabase/functions/voice-proxy/index.ts` (API key server-side)
- Client engine: `lib/elevenlabs.ts` — multilingual TTS with LRU audio cache (10 items)
- Ambient audio: `lib/ambient-audio.ts` — TTS-generated ambient sounds with expo-av fade-out
- Voice input: `lib/voice-input.ts` — expo-speech-recognition wrapper with BCP-47 locale mapping
- Survival phrases: `lib/survival-phrases.ts` — 72 curated phrases across es/fr/de/ja

### Supported Languages & Voices
| Language | Voice ID | Name | Model |
|----------|----------|------|-------|
| en | EXAVITQu4vr4xnSDxMaL | Sarah | eleven_turbo_v2_5 |
| es | onwK4e9ZLuTAKqWW03F9 | Daniel | eleven_multilingual_v2 |
| fr | XB0fDUnXU5powFXDhCwa | Charlotte | eleven_multilingual_v2 |
| de | pqHfZKP75CvOlQylNhV4 | Bill | eleven_multilingual_v2 |
| ja | iP95p4xoKVk53GoZ742B | Yuki | eleven_multilingual_v2 |

### Key Functions
- `narrateText(text, options?)` — Core TTS with language/speed/voice settings
- `narrateItinerary(itinerary, options?)` → `NarrationController` — Full trip audio guide with play/pause/skip/stop
- `pronounce(text, language?)` — Short TTS for location names (max 200 chars)
- `narrateSurvivalPhrases(phrases, language, options?)` — Sequential phrase playback
- `buildDayNarration(params)` — Rich prose builder (neighborhoods, transit, costs, accommodation)
- `playAmbientSound(key)` — Destination ambient sounds with fade-out

### UI Components (`components/audio/`)
- `AudioGuideBar` — Floating podcast-style mini player
- `NarrationToggle` — Headphones button to start/stop full trip audio guide
- `PronunciationButton` — Inline tap-to-hear (Volume2 icon, 300ms debounce)
- `SurvivalPhrasesCard` — Phrase card with play-all and individual pronunciation
- `VoiceInputButton` — Animated mic button with pulsing red dot

### Rate Limits
- Voice proxy: 30 req/min per user (server-enforced)
- Pronunciation: 200 char max text length

## Learnings (update after every correction)

### Shell
- `head`, `tail` do NOT work in this zsh. Use `Read` tool with offset/limit instead.
- Always prefix commands with the nvm PATH export.

### TypeScript
- `COLORS.glass` doesn't exist — use `COLORS.bgGlass`
- `Record<string, unknown>` causes 50+ errors on DB row converters — keep `any` for Supabase `.select()` return types
- `catch (err: any)` → `catch (err: unknown)` with `err instanceof Error` guards everywhere except RevenueCat `userCancelled` check
- `TimeSlotActivity` has no `coordinates` — use `getDestinationCoords()` from `lib/air-quality.ts`

### Components
- `TripGeneratingLoader` (in `components/premium/LoadingStates.tsx`) — full-screen compass loader, accepts `destination` prop
- `SkeletonCard` (same file) — animated shimmer skeleton, use instead of static grey blocks
- Free API modules (all free, no API key, AsyncStorage cached):
  - Existing: `lib/air-quality.ts`, `lib/sun-times.ts`, `lib/timezone.ts`, `lib/public-holidays.ts`, `lib/cost-of-living.ts`
  - New: `lib/weather-forecast.ts` (Open-Meteo), `lib/exchange-rates.ts` (Frankfurter), `lib/country-info.ts` (REST Countries), `lib/travel-safety.ts` (travel-advisory.info), `lib/emergency-numbers.ts` (emergencynumberapi.com), `lib/geocoding.ts` (Open-Meteo)
  - Newest: `lib/crowd-intelligence.ts` (holiday+event crowd forecasting), `lib/currency-history.ts` (30-day rate history via Frankfurter), `lib/golden-hour.ts` (sunrise-sunset.org), `lib/jet-lag.ts` (pure calculation, no API)
- Feature widgets in `components/features/`:
  - `HolidayCrowdCalendar.tsx` — horizontal scrolling crowd forecast calendar
  - `CostComparisonWidget.tsx` — side-by-side destination cost comparison
  - `CurrencySparkline.tsx` — 30-day exchange rate sparkline with SVG
  - `DualClockWidget.tsx` — home vs destination clocks + jet lag
  - `GoldenHourCard.tsx` — photography golden hour times
- Destination dashboard: `app/destination/[name].tsx` — all widgets combined
- New data modules (no API, local data):
  - `lib/flight-intelligence.ts` — deal scoring, price calendar, route intel, Go Now feed
  - `lib/roam-score.ts` — composite 0-100 destination score
  - `lib/symptom-checker.ts` — destination-aware symptom intelligence
  - `lib/layover-data.ts` — curated guides for 8 major airports
  - `lib/emergency-card.ts` — medical card data + translations
  - `lib/trip-journal.ts` — daily diary with mood tracking
- New feature components:
  - `components/features/FlightPriceCalendar.tsx` — 6-week color-coded grid
  - `components/features/RouteIntelCard.tsx` — flight intel for a route
  - `components/features/SeasonalIntel.tsx` — why now is/isn't the right time
  - `components/features/ROAMScoreBadge.tsx` — reusable score badge (sm/md/lg)
  - `components/features/GoNowFeed.tsx` — horizontal flight deal cards
  - `components/features/TravelStats.tsx` — compact travel history summary
  - `components/features/TripRecap.tsx` — shareable trip summary card
- New screens:
  - `app/body-intel.tsx` — destination-aware health intelligence
  - `app/before-you-land.tsx` — pre-departure briefing
  - `app/emergency-card.tsx` — bilingual medical card
  - `app/layover.tsx` — airport layover optimizer
  - `app/travel-card.tsx` — shareable personality card
  - `app/trip-journal.tsx` — daily travel diary

### API Types (avoid wrong property names)
- `getTimezoneByDestination()` returns `string | null` (synchronous, NOT a Promise)
- `DailyForecast.precipitationChance` (0-100), NOT `pop`
- `SafetyData.safetyScore`, NOT `overallScore`
- `track()` accepts `AnalyticsEvent` union — use `payload` for custom fields, NOT top-level properties

### Verification
- After code changes: run `npx tsc --noEmit` before proceeding
- Preview: use preview tools (preview_start, preview_snapshot, preview_screenshot) to verify UI
- Check console logs for errors (ignore RN web `collapsable` deprecation warnings — not a real issue)

### Deploy Rules
**DEPLOY ONLY WHEN:**
- A complete feature is finished
- A P0 bug is fixed
- Quinn explicitly says "deploy"

**NEVER deploy for:**
- Doc changes
- Small copy fixes
- Single file edits
- Agent output files

## Deploy
Primary (Vercel — auto-deploys on push):
```bash
git push origin main
```

Manual (if needed):
```bash
vercel --prod
```

Legacy (Netlify backup):
```bash
npx netlify deploy --prod --dir=dist --no-build
```

## Visual Design (Clean Spatial Redesign — March 2026)
- Linear/Notion/Arc inspired — clean, spatial, confident
- Space Grotesk Bold headlines, Inter Regular body, DM Mono labels
- Pure near-black bg (#0A0A0A), no green tint
- Two card types: photo (full-bleed) and data (#141414 bg)
- Pill-shaped buttons (borderRadius: 9999)
- Lucide icons at strokeWidth={1.5}
- No italic headers, no uppercase on non-data labels
- Floating pill navigation — 5 visible tabs: Plan / Pulse / Flights / People / Prep
- Tab layout in `app/(tabs)/_layout.tsx`, nav in `components/ui/FloatingPillNav.tsx`
- Hidden but routable: pets, index, body-intel, generate, stays, food, group
- Flights has its own tab, Health Intel accessible from Prep tab

## Ops Dashboard (`roam-dashboard.html`)
- Single-file HTML/CSS/JS war room — zero dependencies
- 3-panel Palantir layout: left 25%, center 50%, right 25%, bottom budget bar
- Live data feeds: GitHub (commits, PRs, branches), Netlify (deploys, bandwidth), Supabase (users, trips, messages), PostHog (events), RevenueCat (projects)
- All tokens in localStorage via settings modal — NEVER in code
- Auto-refresh: health 30s, GitHub 2min, Netlify 2min, Supabase 60s, PostHog 90s, RevenueCat 3min
- Sections: Daily Focus, ROAM Metrics 2x3, Quick Wins Tracker, Burn Rate, 5 Composers with wake-up prompts, 10 Agent Prompts, Checklist, Budget

## Installed Skills (Claude Code) — 11 total in `~/.claude/skills/`
- `ui-ux-pro-max` — 50+ UI styles, 161 color palettes, 57 font pairings, UX guidelines
- `frontend-design` — Anthropic's official skill for distinctive, production-grade frontend interfaces
- `react-native-best-practices` — RN performance: FPS, TTI, bundle size, memory, Hermes, Reanimated
- `app-store-aso` — Apple App Store ASO: metadata validation, keyword optimization, screenshots
- `test-driven-development` — TDD enforcement: RED→GREEN→REFACTOR cycle
- `mcp-builder` — MCP server development: TypeScript/Python, tool design, eval creation
- `supabase` — Supabase CRUD operations: database, auth, storage, edge functions
- `expo-revenuecat` — Expo + RevenueCat payments, AdMob, i18n, onboarding, paywall
- `expo-official` — 11 official Expo skills: native UI, API routes, deployment, CI/CD
- `i18n-best-practices` — Internationalization: translation keys, localization workflows, CDN delivery
- `last30days` — Research topics from the last 30 days across social platforms

## Subscription Model
- Free: 1 trip/month (reset monthly via edge function)
- Pro: unlimited trips (RevenueCat)
- Guest: 1 trip total, then paywall
