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

## Shield (Dependency & Security Scanner)

**Status:** Dead code purge + deep link validation complete  
**Date:** 2025-03-13  
**Action needed:** No

### Findings

- Deleted orphaned: lib/gamification.ts, lib/google-places.ts, lib/content-freshness.ts (aviationstack has imports, kept)
- `lib/params-validator.ts` — Created; validateDestination, validateUuid, validateCode
- dream-vault, local-lens, honest-reviews, arrival-mode — destination param validation
- `lib/storage-keys.ts` — Centralized AsyncStorage keys; store, guest, offline, auth screens updated
- `docs/SECURITY_AUDIT_2025-03-13.md` — Full audit report
