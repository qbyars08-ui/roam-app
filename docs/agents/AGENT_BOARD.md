# Agent Board

Status board for Cursor agents. Cap reads this to coordinate work.

---

## Localization (Agent 09)

**Status:** i18n infrastructure complete; core screens converted
**Date:** 2026-03-14
**Action needed:** No

### Deliverables

- `lib/i18n/` — i18next + react-i18next + expo-localization infrastructure
- `lib/i18n/locales/en.ts` — English base translations (~400 keys across 25 namespaces)
- `lib/i18n/locales/es.ts` — Spanish translations (complete)
- `lib/i18n/locales/fr.ts` — French translations (complete)
- `lib/i18n/locales/ja.ts` — Japanese translations (complete)
- `lib/i18n/helpers.ts` — tCategory, tBudgetLabel, tVibe, tExpense helper functions
- Device locale auto-detection; persisted language choice via AsyncStorage
- Language selector modal in Profile screen

### Converted screens/components
- Tab bar (ROAMTabBar), OfflineBanner, ErrorBoundary, ComingSoon
- Auth: signup, signin, welcome, hook
- Tabs: Discover, Generate, Flights, Stays, Food, Prep
- Screens: Profile, Paywall, Saved, Passport, Itinerary, NotFound
- Components: GenerateModeSelect, LoadingStates

### Remaining (lower priority)
- ~40 additional feature screens (local-lens, honest-reviews, etc.) still have hardcoded strings
- Destination hooks/descriptions are not translated (content is editorial)
- AI-generated itinerary content is in English (Claude prompt language could be adjusted per locale)

---

## Growth Hacker (Agent 06)

**Status:** Growth hooks engine, smart triggers, and retention mechanics deployed
**Date:** 2026-03-13
**Action needed:** No

### Deliverables

- `lib/growth-hooks.ts` — Milestone detection (first_trip through streak_30), growth event tracking, engagement scoring, social proof data, contextual upgrade messaging
- `lib/smart-triggers.ts` — Context-aware conversion triggers with 4-hour cooldowns, session depth tracking, trigger history. Events: post_generation, itinerary_view, app_open, post_share, feature_tap
- `lib/growth-banner-logic.ts` — Screen-aware banner selection (discover/itinerary/profile/generate/prep) with 24-hour per-variant cooldowns and scoring
- `components/features/StreakBadge.tsx` — Animated streak counter with 5 tiers (starting/building/hot/on-fire/legendary), pulse animation at 3+ streaks
- `components/features/MilestoneModal.tsx` — Full-screen celebration modal with contextual CTAs (share/refer/upgrade/continue), entrance spring animation
- `components/features/GrowthBanner.tsx` — Dismissible contextual banners (refer/upgrade/streak/share) with slide-in animation
- `app/paywall.tsx` — Added social proof counter ("X travelers upgraded this month"), contextual headlines from getUpgradeMessage(), purchase event tracking
- `app/_layout.tsx` — Milestone checks on session bootstrap (2s delay), MilestoneModal in render tree, session tracking reset
- `app/(tabs)/generate.tsx` — Growth event recording after trip generation, contextual paywall routing with reason params
- `app/itinerary.tsx` — Growth event tracking on view + share
- `supabase/migrations/20260323000002_growth_milestones.sql` — growth_milestones table, growth_triggers table, profiles engagement fields

### Growth Mechanics Summary

| Mechanic | Implementation | Trigger |
|----------|---------------|---------|
| Milestone celebrations | MilestoneModal | 1st/3rd/5th/10th trip, 3/7/14/30-day streak |
| Smart paywall triggers | evaluateTrigger() | Post-generation, feature tap, high engagement, streak momentum |
| Social proof on paywall | getPaywallSocialProof() | Always-on, deterministic counts |
| Streak visualization | StreakBadge | Profile, tabs |
| Contextual banners | GrowthBanner + selectBanner() | Discover, itinerary, profile screens |
| Growth event tracking | recordGrowthEvent() | Trip generation, sharing, itinerary view, session start |

---

## Captain (Situational Awareness)

**Status:** First briefing complete
**Date:** 2026-03-13
**Action needed:** Quinn — merge 3 draft PRs, fix Netlify billing, set Supabase secrets

### Summary

- System YELLOW: TS clean, 151 tests green, Netlify paused, 2 HIGH security items open
- 3 draft PRs: #15 (debugger), #14 (captain), #16 (API research) — merge in that order
- Blocked: Netlify billing, Supabase secrets, RevenueCat dashboard, App Store products
- Full briefing: `roam/captain_status.md`

---

## Shield (Dependency & Security Scanner)

**Status:** Dead code purge + deep link validation complete
**Date:** 2026-03-13
**Action needed:** No

### Findings

- Deleted orphaned: lib/gamification.ts, lib/google-places.ts, lib/content-freshness.ts (aviationstack has imports, kept)
- `lib/params-validator.ts` — Created; validateDestination, validateUuid, validateCode
- dream-vault, local-lens, honest-reviews, arrival-mode — destination param validation
- `lib/storage-keys.ts` — Centralized AsyncStorage keys; store, guest, offline, auth screens updated
- `docs/SECURITY_AUDIT_2025-03-13.md` — Full audit report

---

## Agent 02 (API Research)

**Status:** 6 free API modules added
**Date:** 2026-03-13
**Action needed:** Quinn — review + merge PR #16

### Deliverables

- New modules: `lib/country-info.ts`, `lib/emergency-numbers.ts`, `lib/exchange-rates.ts`, `lib/geocoding.ts`, `lib/travel-safety.ts`, `lib/weather-forecast.ts`
- Research doc: `docs/api-research.md`

---

## Agent 05 (Debugger)

**Status:** TS readonly fix
**Date:** 2026-03-13
**Action needed:** Quinn — review + merge PR #15

### Deliverables

- Fixed `buildTripPrompt()` array params to accept `readonly string[]`

---

## Agent 11 — Rules & Content

**Status:** Agent rules file created
**Date:** 2026-03-13
**Action needed:** No

### Scope

- `.cursor/rules/` governance — keep all agent `.mdc` files accurate and consistent
- `CLAUDE.md` + `.cursorrules` maintenance — prune stale learnings, add new gotchas
- In-app editorial content audits — destination hooks, system prompts, brand voice compliance
- Cross-file consistency — colors, fonts, spacing, file paths, destination names match across all rule and doc surfaces

### Deliverables

- `.cursor/rules/agent-11-rules-content.mdc` — Role definition and audit checklist
- Audit output goes to `docs/agents/agent-11-rules-content-audit.md`
