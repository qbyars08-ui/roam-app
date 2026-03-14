# ROAM — Localization Audit

> Generated 2026-03-14. Tracks i18n coverage, supported languages, and remaining work.

---

## Architecture

| Component | Technology |
|-----------|-----------|
| Framework | i18next + react-i18next |
| Device locale | expo-localization |
| Persistence | AsyncStorage (`@roam/locale`) |
| Plurals | intl-pluralrules polyfill |
| RTL | I18nManager + logical layout properties |

### File Structure

```
lib/i18n/
  index.ts          — i18n config, init, changeLanguage()
  rtl.ts            — RTL support (applyRTL, logicalPadding, flexRow)
  helpers.ts        — tCategory(), tBudgetLabel(), tVibe(), tExpense()
  locales/
    en.ts           — English (base, ~1200 lines, ~700 keys)
    es.ts           — Spanish (~1020 lines)
    fr.ts           — French (~1020 lines)
    ja.ts           — Japanese (~1020 lines)
```

---

## Supported Languages

| Code | Language | Status | Native Label |
|------|----------|--------|--------------|
| `en` | English | Base | English |
| `es` | Spanish | Complete | Español |
| `fr` | French | Complete | Français |
| `ja` | Japanese | Complete | 日本語 |

---

## Translation Namespaces (~65 namespaces)

| Namespace | Screen / Component | Keys |
|-----------|--------------------|------|
| common | Shared strings (cancel, save, done, etc.) | ~35 |
| tabs | Tab bar labels | 6 |
| errorBoundary | Error boundary | 3 |
| auth | Sign in / sign up | ~25 |
| onboarding | Onboarding flow | ~15 |
| discover | Discover tab | ~10 |
| categories | Destination category chips | 8 |
| budgets | Budget tier labels | ~12 |
| vibes | Vibe tag labels | 16 |
| generate | Generate tab / trip creation | ~15 |
| itinerary | Itinerary screen | ~20 |
| flights | Flights tab | ~15 |
| stays | Stays tab | ~10 |
| food | Food tab | ~10 |
| prep | Prep tab | ~15 |
| profile | Profile screen + language selector | ~25 |
| paywall | Subscription paywall | ~18 |
| saved | Saved trips | 5 |
| passport | Passport / gamification | ~10 |
| groups | Group trips | ~15 |
| shareCard | Share card | ~8 |
| weather | Weather card | ~12 |
| safety | Safety info | ~10 |
| currency | Currency conversion | ~5 |
| languageSurvival | Language survival kit | ~12 |
| pets | Pet travel hub | ~12 |
| expenses | Expense categories | 6 |
| loadingStates | Trip generation loading | 5 |
| settings | Language selector | ~10 |
| referral | Referral program | ~12 |
| legal | Legal pages | 6 |
| notFound | 404 page | 3 |
| globe | Spin the Globe | ~10 |
| dreamVault | Dream Trip Vault | ~10 |
| chaosMode | Chaos Mode | ~20 |
| chaosDare | Chaos Dare | ~5 |
| alterEgo | Alter Ego quiz | ~5 |
| support | Support screen | ~6 |
| hype | Countdown / hype | ~15 |
| peopleMet | People You've Met | ~15 |
| localLens | Local Lens | ~18 |
| honestReviews | Honest Reviews | ~15 |
| antiItinerary | Anti-Itinerary | ~15 |
| tripCollections | Trip Collections | 2 |
| tripWrapped | Trip Wrapped | ~15 |
| tripReceipt | Trip Receipt | ~15 |
| tripDupe | Trip Dupe | ~12 |
| tripChemistry | Trip Chemistry | ~20 |
| tripTrading | Trip Trading | ~6 |
| travelTwin | Travel Twin | ~12 |
| travelProfile | Travel Profile | ~15 |
| travelPersona | Travel Persona | ~10 |
| travelTimeMachine | Travel Time Machine | 2 |
| mainCharacter | Main Character | ~8 |
| memoryLane | Memory Lane | ~12 |
| budgetGuardian | Budget Guardian | ~12 |
| arrivalMode | Arrival Mode | ~5 |
| airportGuide | Airport Survival Guide | ~8 |
| layover | Layover Optimizer | ~10 |
| dupeFinder | Dupe Finder | ~12 |
| roamForDates | ROAM for Dates | ~8 |
| visitedMap | Visited Map | ~15 |
| groupTrip | Group Trip detail | ~12 |
| createGroup | Create Group | ~8 |
| joinGroup | Join Group | ~5 |
| groupTab | Group tab | ~20 |
| onboard | Auth onboard flow | ~15 |
| splash | Splash screen | 2 |
| socialProof | Social proof | 2 |
| personalization | Personalization | 3 |
| valuePreview | Value preview | 4 |
| tripDetail | Public trip sharing | ~10 |

---

## Converted Files (66 screens + 6 components)

### App Screens (app/)
- All 6 tab screens: index, generate, flights, stays, food, prep
- All 8 auth screens: splash, hook, welcome, signin, signup, onboard, onboarding, social-proof, personalization, value-preview
- 50+ feature/modal screens including: profile, paywall, itinerary, saved, passport, globe, dream-vault, chaos-mode, chaos-dare, alter-ego, share-card, support, hype, anti-itinerary, trip-collections, trip-wrapped, trip-receipt, trip-dupe, trip-chemistry, trip-trading, travel-twin, travel-profile, travel-persona, travel-time-machine, main-character, memory-lane, budget-guardian, arrival-mode, airport-guide, layover, dupe-finder, roam-for-dates, visited-map, people-met, pets, local-lens, honest-reviews, referral, group-trip, create-group, join-group, +not-found, trip/[id], made-for-you, viral-cards, prep-detail, language-survival, food/[id]

### Components (components/)
- ROAMTabBar, OfflineBanner, ErrorBoundary
- ComingSoon, GenerateModeSelect, LoadingStates

---

## RTL Support

- `lib/i18n/rtl.ts` — `applyRTL()` called on language change and init
- `I18nManager.forceRTL()` / `I18nManager.allowRTL()` managed automatically
- Physical layout properties converted to logical equivalents:
  - `paddingLeft` → `paddingStart`
  - `paddingRight` → `paddingEnd`
  - `marginLeft` → `marginStart`
  - `marginRight` → `marginEnd`
- Converted across 35 files (app screens + components)
- `flexDirection: 'row'` auto-reverses in RTL (RN 0.62+)

---

## Remaining Work (Low Priority)

### Not localized (intentionally)

| File | Reason |
|------|--------|
| `app/admin.tsx` | Internal dashboard; admin-only |
| `app/investor.tsx` | Investor-facing; English only |
| `app/privacy.tsx` | Legal text; requires legal review per locale |
| `app/terms.tsx` | Legal text; requires legal review per locale |
| `app/join/[code].tsx` | Redirect wrapper; no visible strings |

### Partial coverage

| Area | Notes |
|------|-------|
| Destination hooks | Editorial content (e.g. "More to do per block than most cities have total") — kept in English as creative copy |
| AI-generated content | Itinerary text generated by Claude is in English; could be adjusted by injecting locale into system prompt |
| Large data arrays | Alter-ego quiz questions, arrival-mode city data, honest-reviews attraction data — content arrays kept in English |
| date-fns formatting | Date formatting uses date-fns which supports locale; not yet wired to i18n locale |

### Prep Tab: Weather Intel ("Right Now" section)
- `components/features/RightNowSection.tsx` — live weather for destination
- Uses Open-Meteo (free, no API key) via `lib/weather-forecast.ts`
- Geocoding fallback via `lib/geocoding.ts` for destinations not in DESTINATION_COORDS
- Shows: today's conditions, 3-day forecast strip, AI packing suggestions
- Default tab when opening Prep screen

### Prep Tab: Useful Phrases section
- `components/features/UsefulPhrasesSection.tsx` — categorized phrase browser
- 7 categories: Greetings, Food, Directions, Emergency, Transport, Shopping, Social
- TTS pronunciation via expo-speech
- Collapsible categories with phrase count
- Wired into Language tab below existing survival phrases

### Emergency Numbers Verification
- All 25 countries in `lib/prep/emergency-data.ts` cross-verified against Wikipedia + emergencyphonenumbers.org (March 2026)
- Fixed: Hungary police 112 → 107
- Added: New York (US), Santorini (Greece), Ljubljana (Slovenia)
- All top 20 ROAM destinations now have verified emergency data

### Future languages

To add a new language:
1. Create `lib/i18n/locales/{code}.ts` implementing `TranslationKeys`
2. Import in `lib/i18n/index.ts` and add to `resources`
3. Add entry to `SUPPORTED_LANGUAGES` array
4. If RTL, the language code will be auto-detected by `isRTLLanguage()` in `rtl.ts`

---

## How to Use

### In functional components
```tsx
import { useTranslation } from 'react-i18next';

function MyScreen() {
  const { t } = useTranslation();
  return <Text>{t('namespace.key')}</Text>;
}
```

### In class components
```tsx
import i18n from '../lib/i18n';

class MyComponent extends React.Component {
  render() {
    return <Text>{i18n.t('namespace.key')}</Text>;
  }
}
```

### For constant arrays (categories, vibes, budgets)
```tsx
import { tCategory, tVibe, tBudgetLabel } from '../lib/i18n/helpers';

const label = tCategory('beaches'); // "Playas" (es)
```

### Changing language
```tsx
import { changeLanguage } from '../lib/i18n';
await changeLanguage('es'); // persists + applies RTL if needed
```
