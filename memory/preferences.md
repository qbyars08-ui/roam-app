# Preferences

Quinn's development and product preferences.

## Development
- Ship fast, iterate later
- No confirmation needed before starting work
- Parallel agent execution whenever possible
- Research before building (check existing libs/patterns)
- Conventional commits: type(scope): description

## Design
- Dark-only UI (NEVER light mode)
- COLORS tokens from lib/constants.ts (NEVER hardcode hex)
- Lucide icons only, strokeWidth={2}, size={20} default
- Fonts: Cormorant Garamond (headers), DM Sans (body), DM Mono (data)
- No emojis in code or UI
- Punchy, specific copy (not generic marketing speak)

## Architecture
- Free APIs preferred (no API key costs)
- AsyncStorage caching on all API calls
- Edge function proxy for all sensitive API calls
- Zustand for state management
- useCallback/useMemo for all handlers/computed values

## Deploy
- Build locally first (preserves .env vars)
- Rename netlify.toml before deploy to prevent Netlify rebuild
- Verify Supabase URL in deployed bundle after every deploy
- Always run npx tsc --noEmit before build

## Communication
- Direct, no fluff
- Don't ask for confirmation, just do it
- Show results, not plans
