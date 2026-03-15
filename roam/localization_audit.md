# Localization Audit — 2026-03-15

## Overview
Added German (`de`) locale to ROAM. Full coverage of all 34 translation namespaces.
Voice: Gen Z register, casual `du`-form, Denglish where natural, zero corporate language.
DACH context: EUR (€) for DE/AT, CHF (Fr.) for CH — currency symbol handled at runtime in currency module.

---

## Coverage

| Data Type | Locales Covered | Gaps |
|-----------|----------------|------|
| UI strings (all namespaces) | en, es, fr, ja, **de** | ko, pt not started |
| Emergency numbers (API) | Global via emergencynumberapi.com | Bundled offline fallback not yet implemented |
| Currency symbols | EUR shown in de.ts budget/discover strings | Runtime CHF switching for CH not yet in prep tab UI |
| Language selector label | All 5 locales now include `settings.german = 'Deutsch'` | None |

---

## Emergency Numbers — DACH + Key European Cities

Verified against official government sources and emergencynumberapi.com (March 2026).

| City | Country | Police | Fire | Ambulance | EU 112 | Notes |
|------|---------|--------|------|-----------|--------|-------|
| Vienna (Wien) | AT | 133 | 122 | 144 | ✓ | AT is EU member; 112 also works |
| Munich (München) | DE | 110 | 112 | 112 | ✓ | DE: police = 110; fire/ambulance = 112 |
| Zurich (Zürich) | CH | 117 | 118 | 144 | — | CH not EU; 112 routed to 117/144 |
| Berlin | DE | 110 | 112 | 112 | ✓ | Same as all DE cities |
| Budapest | HU | 107 | 105 | 104 | ✓ | HU is EU member |
| Prague (Praha) | CZ | 158 | 150 | 155 | ✓ | CZ is EU member |
| Amsterdam | NL | 112 | 112 | 112 | ✓ | NL: all emergencies via 112; 0900-8844 non-emergency police |
| Barcelona | ES | 091 | 080 | 061 | ✓ | ES: 091 national police, 112 general emergency |

### Key DACH Emergency Number Summary

```
Germany (DE):   Police 110 | Fire 112 | Ambulance 112 | EU 112 ✓
Austria (AT):   Police 133 | Fire 122 | Ambulance 144 | EU 112 ✓
Switzerland (CH): Police 117 | Fire 118 | Ambulance 144 | EU 112 —
```

Sources:
- DE: [notruf.de](https://www.notruf.de) / Bundesamt für Bevölkerungsschutz
- AT: [help.gv.at](https://www.help.gv.at) / Österreichisches Bundeskanzleramt
- CH: [admin.ch](https://www.admin.ch) / Bundesamt für Bevölkerungsschutz
- EU: [ec.europa.eu/112](https://ec.europa.eu/digital-single-market/en/112)
- emergencynumberapi.com (live API, 30-day AsyncStorage cache)

---

## Currency — DACH Prep Tab

| Country | Currency | Code | Symbol | Position | Decimal Sep | Thousands Sep |
|---------|---------|------|--------|----------|-------------|---------------|
| Germany | Euro | EUR | € | After number | , | . |
| Austria | Euro | EUR | € | After number | , | . |
| Switzerland | Swiss Franc | CHF | Fr. / CHF | Before or after | . | ' |

### Current State (post this PR)
- `de.ts` uses `€` in `budgets.*Range` and `discover.dailyCost` strings (e.g. `0–75€/Tag`)
- `prep.money` label: `'Geld'` — correct
- `currency.title`: `'Währung'` — correct
- Runtime EUR↔CHF switching: handled by `lib/exchange-rates.ts` + `lib/currency.ts`
- **Gap**: The prep tab UI does not yet auto-detect CH locale to display CHF; it relies on user's home currency setting

---

## Translation Quality Notes

### Gen Z German Voice Decisions
- Informal `du` throughout (never `Sie`)
- Denglish kept where natural: `Trip`, `Vibes`, `Hidden Gems`, `Check-in`, `Check-out`, `Hostels`, `Budget`, `Feature`, `KI` (not `AI`), `Date Night`
- `Let's go` kept in English (universally used by German Gen Z)
- `trending` kept in English (same usage in DE social media)
- `Instagrammable` used for `photoWorthy` (standard in DE Gen Z)
- Error message: `"Na das hätte nicht passieren dürfen"` — casual, not "Ein Fehler ist aufgetreten"
- Budget vibes: `"Gönn dir was"` (treat yourself), `"krasse Erinnerungen"` (great memories)

### DACH-specific Copy
- `discover.dailyCost`: `'{{cost}}€/Tag'` (euro sign, not $)
- `budgets.*Range`: all use `€` ranges
- `generate.chatStarters`: localized to German cultural context (e.g. "Lohnt sich Bali gerade noch?")

---

## Missing Data

| Destination | Missing | Priority |
|-------------|---------|----------|
| Zurich (CH) | Bundled offline emergency numbers | High |
| Vienna (AT) | Bundled offline emergency numbers | High |
| Munich (DE) | Bundled offline emergency numbers | High |
| Berlin (DE) | Bundled offline emergency numbers | High |
| All DACH | EU embassy contacts for non-US passport holders | Medium |
| Switzerland | CHF runtime auto-detection in prep tab | Medium |
| All DE cities | Hospital locations (bundled) | Low |

---

## Recommendations

- [ ] Add bundled offline emergency numbers for DACH cities to `lib/emergency-numbers.ts` static fallback (life-safety critical; API may not be reachable)
- [ ] Implement CHF auto-display in prep tab when destination country = CH (`lib/currency.ts` already has the exchange rate logic)
- [ ] Add `ko` (Korean) and `pt` (Portuguese) locales — keys are in `settings` but translations not started
- [ ] Add `settings.german` display in language selector UI component (key added to all locale files in this PR)
- [ ] Consider `de-AT` (Austrian German) sub-locale for terms like `"Jänner"` vs `"Januar"` if DACH growth prioritizes AT specifically

---

## Files Changed

```
lib/i18n/locales/de.ts          — NEW: 34 namespaces, ~340 keys, Gen Z German
lib/i18n/locales/en.ts          — ADD: settings.german = 'Deutsch'
lib/i18n/locales/es.ts          — ADD: settings.german = 'Deutsch'
lib/i18n/locales/fr.ts          — ADD: settings.german = 'Deutsch'
lib/i18n/locales/ja.ts          — ADD: settings.german = 'Deutsch'
lib/i18n/index.ts               — REGISTER: de locale, SUPPORTED_LANGUAGES entry
roam/localization_audit.md      — THIS FILE
```
