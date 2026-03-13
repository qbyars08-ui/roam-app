# CLAUDE.md — ROAM Project Guide

Agent instructions, architecture decisions, and accumulated learnings for ROAM.

## Medic Verification Suite

Every code change must pass all three checks before committing:

```bash
npx tsc --noEmit          # TypeScript strict mode
npx jest                  # 46 unit tests
npx eslint . --ext .ts,.tsx  # ESLint (0 errors required; warnings are legacy dead code)
```

---

## Architecture Decisions

### AI Routing
All Anthropic API calls go through `supabase/functions/claude-proxy/`. Never call the Anthropic API directly from client code. This is enforced by the CI security scan.

### Pro Gating
Use `useProGate(feature)` from `lib/pro-gate.ts`. All pro-gated screens redirect to `/paywall` if `canAccess` is false.

### State Management
Zustand store at `lib/store.ts`. Use immutable update patterns — never mutate state directly.

### Auth
Supabase auth + guest mode (`lib/guest.ts`). Guest users are identified by IDs starting with `guest-`.

### Web Compatibility
- `lib/haptics.ts` — safe shim for `expo-haptics` on web
- `lib/view-shot.ts` — safe shim for `react-native-view-shot` on web

---

## Learnings

### Rules of Hooks — Early Return Pattern

**Bug**: Pro-gated screens used this pattern, which violates Rules of Hooks:

```tsx
// WRONG — hooks after an early return
useEffect(() => { if (!canAccess) router.replace('/paywall'); }, [canAccess, router]);
if (!canAccess) return null;  // ← early return
const data = useMemo(...);    // ← hook AFTER early return ❌
```

**Fix**: All hooks must be declared before any early return. Move the guard to after all hooks:

```tsx
// CORRECT — all hooks first, then early return
useEffect(() => { if (!canAccess) router.replace('/paywall'); }, [canAccess, router]);
const data = useMemo(...);  // ← hook before early return ✅
if (!canAccess) return null;
```

**Files fixed**: `app/memory-lane.tsx`, `app/travel-twin.tsx`, `app/trip-chemistry.tsx`, `app/paywall.tsx`, `components/ui/OfflineBanner.tsx`

**Detection**: `npx eslint . --ext .ts,.tsx` — `react-hooks/rules-of-hooks` rule.

---

### ESLint Setup Notes

ESLint was added in March 2026 (first-time brownfield adoption).

- **Config**: `.eslintrc.js` using ESLint v8 (last version supporting `.eslintrc.*` format — v9+ requires flat config, which many React Native plugins don't support yet)
- **`no-unused-vars`**: Currently set to `warn` because the codebase had ~80 instances of unused imports/variables at the time ESLint was introduced. Should be tightened to `error` once legacy dead code is cleaned up.
- **`react/no-unescaped-entities`**: Disabled — React Native doesn't parse HTML entities, so this rule is not applicable.
- **`@typescript-eslint/no-var-requires`**: Warning — `require()` is a valid React Native idiom for dynamic image asset loading.
- **`no-empty`**: Warning with `allowEmptyCatch: true` — empty catch blocks are common for user-cancelled actions (Share, RevenueCat purchase cancellations).

---

### `COLORS.glass` Does Not Exist

Use `COLORS.bgGlass` instead. `COLORS.glass` will compile fine (TypeScript won't catch it if the type allows string indexing) but will produce `undefined` at runtime.

---

### Supabase `.select()` Return Types

`Record<string, unknown>` breaks Supabase row converters. Keep `any` for `.select()` returns at the DB boundary. This is documented as an exception to the "no `any`" rule.

---

### `catch (err)` Pattern

Use `catch (err: unknown)` with an `instanceof Error` guard everywhere **except** RevenueCat's `userCancelled` pattern, which returns a specific object structure that requires `any`.

```ts
// Standard pattern
} catch (err: unknown) {
  if (err instanceof Error) console.error(err.message);
}

// RevenueCat exception — userCancelled check requires any
} catch (err: any) {
  if (err?.userCancelled) return false;
  throw err;
}
```

---

### `TimeSlotActivity` Has No `coordinates`

Use `getDestinationCoords()` from `lib/air-quality.ts` to get coordinates for a `TimeSlotActivity`. The `coordinates` field does not exist on that type.

---

### `backdropFilter` in Web-Only Styles

`backdropFilter` is web-only and not in React Native's `StyleSheet` types. Cast the style object `as any` to avoid TypeScript errors. No `@ts-ignore` needed if `as any` is already applied to the object:

```tsx
overlayWeb: {
  backgroundColor: COLORS.whiteVeryFaint,
  backdropFilter: 'blur(12px)',       // web-only property
  WebkitBackdropFilter: 'blur(12px)', // Safari prefix
} as any,
```

---

## Cursor Cloud Specific Instructions

- Node v20, npm with `--legacy-peer-deps` flag required for all installs
- Run `npm install --legacy-peer-deps` (not plain `npm install`)
- ESLint must be run via `node_modules/.bin/eslint` or `npx eslint@8` — do NOT use bare `npx eslint` (will install ESLint v10 which requires flat config)
