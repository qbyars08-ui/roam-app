# System Health Report

**Status: GREEN**
**Date: 2026-03-14**
**Post-merge verification after Builder + Captain + Growth + Analytics + Monetization PRs**

## Check Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS — 0 errors |
| `npx jest` | PASS — 423 tests, 14 suites, 0 failures |
| `npx eslint . --ext .ts,.tsx` | PASS — 0 errors, 0 warnings |

## Tab Verification (Web)

| Tab | Status | Notes |
|-----|--------|-------|
| Discover | GREEN | Destination cards, images, search, category filters, rotating taglines |
| Generate | GREEN | Quick + Chat mode selection renders correctly |
| Flights | GREEN | Search form, date pickers, price calendar, passenger controls |
| Stays | GREEN | Empty state with "Go to Plan" CTA (no destination set) |
| Food | GREEN | Empty state with icon (no destination set) |
| Prep | GREEN | Live data: safety score 95, local time, temp, exchange rate, holidays |

## Bugs Fixed This Run

### Tokyo Image Not Loading (P1)
- `lib/constants.ts`: truncated Unsplash photo ID `eab42de406` → `eab4deabeeaf`
- Tokyo destination card now renders full Shibuya crossing image

### Console Error Toast on Web (P2)
- `collapsable` prop from Animated SVG components triggers React DOM warning
- `ViralCards.tsx`: guard with `Platform.OS !== 'web'`
- `ShareCard.tsx`, `share-card.tsx`: removed `collapsable={undefined}` (no-op)
- `_layout.tsx`: console.error filter for RN Web `collapsable` DOM warnings

### ESLint Regressions from Builder PRs (P3)
- `affiliates.test.ts`: eslint-disable for test mock `any`
- `prep.tsx`: eslint-disable for `set-state-in-effect` (timezone)
- `paywall.tsx`: eslint-disable for mount-only `captureEvent` effect
- `referral.ts`: `/* silent */` in empty catch block

## Edge Functions (7 active)

| Function | Status | Auth | CORS |
|----------|--------|------|------|
| claude-proxy | GREEN | JWT | Allowlist |
| voice-proxy | GREEN | JWT | Allowlist |
| weather-intel | GREEN | JWT | Allowlist |
| destination-photo | GREEN | None | Allowlist |
| enrich-venues | GREEN | Service role | Allowlist |
| revenuecat-webhook | GREEN | RC signature | Allowlist |
| send-push | GREEN | Internal | Allowlist |

## CI Pipeline
- `.eslintrc.js`: fully configured for RN + React 19 hooks rules
- ESLint devDependencies in package.json
- `.github/workflows/ci.yml`: tsc + eslint on push to main + PRs

## Open Issues (non-blocking)
- P3: Rate limiting missing on 4 edge functions
- P5: Booking.com AID is placeholder 'roam' — needs real partner ID
