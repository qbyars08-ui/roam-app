## Cursor Cloud specific instructions

### Project overview

ROAM is a React Native + Expo Router travel planning app (SDK 55). It runs on iOS, Android, and Web. For cloud development, **web mode** is the primary target.

### Quick reference

| Task | Command |
|---|---|
| Install deps | `npm install` |
| Type check | `npx tsc --noEmit` |
| Run tests | `npm test` |
| Dev server (web) | `npx expo start --web --port 3000` |
| Build web | `npm run build:web` |

### Node version

The project requires **Node 20** (pinned in `.nvmrc`). Run `nvm use 20` if a different version is active.

### Running the web dev server

```
npx expo start --web --port 3000
```

Metro bundler takes ~15s for the initial bundle (~3700 modules). The app loads at `http://localhost:3000`. The app **gracefully degrades** without Supabase or API keys configured -- it will run the full UI with local-only state via Zustand.

### Environment variables

See `.env.example` for the full list. None are required for basic UI development; the Supabase client uses placeholder values when env vars are missing. AI features (itinerary generation, chat) require `ANTHROPIC_API_KEY` set in Supabase Edge Functions.

### Testing caveats

- Jest config uses `jest-expo/ios` preset with custom `transformIgnorePatterns` for Expo/RN modules.
- The `jest.setup.js` mocks Supabase, AsyncStorage, and several Expo modules.
- The `jest.config.js` references `jest.expo-winter-mock.js` for Expo winter runtime compatibility.
- Test command: `npm test` (runs `jest --forceExit --detectOpenHandles`).

### TypeScript

- `tsconfig.json` extends `expo/tsconfig.base` with strict mode.
- The `supabase/functions/` and `roam-v2/` directories are excluded from TS compilation.
- Supabase Edge Functions use Deno and are type-checked separately.

### Supabase (optional for local dev)

Local Supabase requires Docker and the Supabase CLI (`supabase start`). Config is in `supabase/config.toml`. This is optional for UI development since the app works without a backend.

### Known web-mode warnings

A "Maximum update depth exceeded" warning may appear in the browser console. This is a known React state-loop issue in the existing codebase and does not block functionality.
