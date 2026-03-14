# ROAM — Project CLAUDE.md

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
- Colors: bg=#080F0A, sage=#7CAF8A, cream=#F5EDD8, coral=#E8614A, gold=#C9A84C
- Headers: Cormorant Garamond Bold (`FONTS.header`)
- Body: DM Sans (`FONTS.body`, `FONTS.bodySemiBold`, `FONTS.bodyMedium`)
- Data/labels: DM Mono (`FONTS.mono`)
- Use COLORS tokens, never hardcode rgba() values
- Icons: lucide-react-native only, strokeWidth={2}, size={20} default

### Architecture
- State: Zustand (`lib/store.ts`). Persist important state to AsyncStorage.
- Edge function proxy: all Claude API calls go through `supabase/functions/claude-proxy/`
- File routing: `app/(tabs)/` for tab screens, `app/` for modals
- Collapsible sections: `useState(false)` + Pressable header + ChevronDown rotation pattern

### Code Style
- Always use `useCallback` and `useMemo` for handlers/computed values
- Haptic feedback on all user interactions (`lib/haptics.ts` wrapper)
- `type` imports for interfaces (not `import { MyType }`)
- Keep `any` only at DB/SDK boundaries (Supabase rows, RevenueCat). Use `unknown` + type guards elsewhere.

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

### Verification
- After code changes: run `npx tsc --noEmit` before proceeding
- Preview: use preview tools (preview_start, preview_snapshot, preview_screenshot) to verify UI
- Check console logs for errors (ignore RN web `collapsable` deprecation warnings — not a real issue)

## Subscription Model
- Free: 1 trip/month (reset monthly via edge function)
- Pro: unlimited trips (RevenueCat)
- Guest: 1 trip total, then paywall
