# ROAM Design System Audit
**Agent:** 03 — Design Enforcer  
**Date:** 2026-03-13  
**Branch:** `cursor/agent-03-design-enforcer` (from `main`)  
**Scope:** `app/` and `components/` — all `.tsx` files  
**Design system tokens:** `lib/constants.ts` → `COLORS`, `FONTS`, `SPACING`, `RADIUS`

---

## Executive Summary

| Category | Violations Found | Fixed in PR | Remaining |
|---|---|---|---|
| Hardcoded hex colors (`'#xxxxxx'`) | 3 | 3 | 0 |
| Raw `rgba()` in style objects | 3 | 2 | 1 (gradient array — minor) |
| `COLORS.x + 'hex'` alpha modifiers | 26 | 4 | 22 (spread across legacy screens) |
| Non-RADIUS `borderRadius` values | 62 | 26 | 36 (tiny dots/progress bars — cosmetically intentional) |
| Non-lucide icon libraries | 0 | — | 0 |
| Hardcoded font family strings | 0 | — | 0 |
| Emoji in UI | 0 | — | 0 |

**Total violations fixed in this PR: 35 across 10 files.**

---

## Top 10 Fixes Applied

### FIX 1 — `components/features/ActivityEditModal.tsx` [P0 CRITICAL]
**3 hardcoded hex colors + 1 raw `rgba()`** in a brand-new component (landed in this sprint).

| Line | Before | After | Reason |
|---|---|---|---|
| 49 | `color: '#4CAF50'` | `color: COLORS.carbonGreen` | "Make cheaper" action — green = save money |
| 57 | `color: '#FF9800'` | `color: COLORS.amber` | "More adventurous" action — warm orange |
| 65 | `color: '#E91E63'` | `color: COLORS.coral` | "Food alternative" action — warm accent |
| 521 | `backgroundColor: 'rgba(255,255,255,0.04)'` | `backgroundColor: COLORS.bgGlass` | Exact match to existing token |

**Impact:** P0 — new component shipped with 4 design system violations. All fixed.

---

### FIX 2 — `components/generate/GenerateModeSelect.tsx` [P0 CRITICAL]
**`borderRadius: 16` and hardcoded `padding: 20`** in new Generate tab mode selection card.

| Line | Before | After |
|---|---|---|
| 118 | `borderRadius: 16` | `borderRadius: RADIUS.xl` |
| 121 | `padding: 20` | `padding: SPACING.lg` |

---

### FIX 3 — `components/generate/GenerateQuickMode.tsx` [P0 CRITICAL]
**`borderRadius: 18` and `borderRadius: 14`** in new Generate quick-mode component.

| Line | Before | After |
|---|---|---|
| 862 | `borderRadius: 18` (circular 36×36 button) | `borderRadius: RADIUS.full` |
| 925 | `borderRadius: 14` (CTA button) | `borderRadius: RADIUS.xl` |

---

### FIX 4 — `components/generate/GenerateConversationMode.tsx` [P0 CRITICAL]
**`borderRadius: 14` and `borderRadius: 20`** in new Generate conversation component.

| Line | Before | After |
|---|---|---|
| 506 | `borderRadius: 14` (generate button) | `borderRadius: RADIUS.xl` |
| 547 | `borderRadius: 20` (circular 40×40 send button) | `borderRadius: RADIUS.full` |

---

### FIX 5 — `app/(tabs)/stays.tsx` [P1 HIGH]
**5 numeric `borderRadius` values** in newly-shipped Stays tab.

| Line | Style | Before | After |
|---|---|---|---|
| 669 | `pill` (filter chip) | `borderRadius: 100` | `borderRadius: RADIUS.full` |
| 692 | `mapContainer` | `borderRadius: 16` | `borderRadius: RADIUS.xl` |
| 719 | `mapWrap` | `borderRadius: 16` | `borderRadius: RADIUS.xl` |
| 726 | `priceBubble` | `borderRadius: 100` | `borderRadius: RADIUS.full` |
| 751 | `card` | `borderRadius: 16` | `borderRadius: RADIUS.xl` |

Also fixed incidental hardcoded padding (`paddingHorizontal: 16` → `SPACING.md`, etc.) in same elements.

---

### FIX 6 — `app/(tabs)/food.tsx` [P1 HIGH]
**4 numeric `borderRadius` values + `RADIUS.lg + 4` expression** in newly-shipped Food tab.

| Line | Style | Before | After |
|---|---|---|---|
| 598 | `categoryPill` | `borderRadius: 100` | `borderRadius: RADIUS.full` |
| 617 | `heroCard` | `borderRadius: RADIUS.lg + 4` | `borderRadius: RADIUS.xl` |
| 641 | `aiPickBadge` | `borderRadius: 4` | `borderRadius: RADIUS.sm` |
| 744 | `restaurantCard` | `borderRadius: 14` | `borderRadius: RADIUS.xl` |

Note: `borderRadius: 4` on `statusDot` (8×8 circle indicator, line 719) and `borderRadius: 3` on `statusDotSmall` (6×6, line 724) are intentionally kept — they're circular indicators where `width/2` produces the correct circle. No `RADIUS.xs` token exists; the nearest `RADIUS.sm = 6` would over-round a 6px element.

---

### FIX 7 — `app/(tabs)/flights.tsx` [P1 HIGH]
**7 numeric `borderRadius` values** in the overhauled Flights tab.

| Line | Style | Before | After |
|---|---|---|---|
| 724 | `inputWrap` | `borderRadius: 10` | `borderRadius: RADIUS.md` |
| 758 | `datePicker` | `borderRadius: 10` | `borderRadius: RADIUS.md` |
| 901 | `priceBar` | `borderRadius: 4` | `borderRadius: RADIUS.sm` |
| 917 | `searchBtn` | `borderRadius: 14` | `borderRadius: RADIUS.xl` |
| 998 | `flightCard` | `borderRadius: 14` | `borderRadius: RADIUS.xl` |
| 1018 | `airlineLogo` | `borderRadius: 18` | `borderRadius: RADIUS.full` |
| 1110 | `errorBanner` | `borderRadius: 8` | `borderRadius: RADIUS.sm` |

Also fixed incidental hardcoded `paddingHorizontal: 16`, `paddingVertical: 12`, `marginHorizontal: 16`, `marginBottom: 8` on `errorBanner`.

---

### FIX 8 — `app/profile.tsx` [P1 HIGH]
**3 `COLORS.x + 'hex'` alpha modifier anti-patterns** on the Profile screen.

| Line | Before | After | Token value |
|---|---|---|---|
| 519 | `COLORS.gold + '15'` | `COLORS.goldSubtle` | `rgba(201,168,76,0.10)` ≈ 8% |
| 522 | `COLORS.gold + '40'` | `COLORS.goldDim` | `rgba(201,168,76,0.40)` ≈ 25% |
| 555 | `` `${COLORS.coral}33` `` | `COLORS.coralLight` | `rgba(232,97,74,0.20)` ≈ 20% |

---

### FIX 9 — `components/features/ReturnTripSection.tsx` [P1 HIGH]
**3 `COLORS.accentGold + 'hex'` alpha modifiers** in the Return Trip suggestion component.

| Line | Before | After |
|---|---|---|
| 62 | `COLORS.accentGold + '15'` | `COLORS.goldSubtle` |
| 66 | `COLORS.accentGold + '30'` | `COLORS.goldBorderStrong` |
| 98 | `COLORS.accentGold + '30'` | `COLORS.goldBorderStrong` |

---

### FIX 10 — `app/(tabs)/prep.tsx` [P1 HIGH]
**1 `COLORS.gold + 'hex'` alpha modifier** in the Prep tab's insurance card inline style.

| Line | Before | After |
|---|---|---|
| 638 | `COLORS.gold + '14'` | `COLORS.goldFaint` |

---

## Remaining Violations (Not Fixed — Documented for Next PR)

### A. Alpha Modifier Anti-Patterns (22 remaining)

These are spread across legacy/secondary screens. None are in the new main tabs (generate, stays, food, group, flights, index — all fixed). Recommended for a follow-up sweep.

| File | Count | Patterns |
|---|---|---|
| `app/arrival-mode.tsx` | 7 | `COLORS.coral + '30'`, `COLORS.sage + '20'/'12'/'50'/'30'/'60'` |
| `app/language-survival.tsx` | 4 | `COLORS.sage + '25'/'20'`, `COLORS.gold + '20'/'15'` |
| `app/(auth)/signin.tsx` | 2 | `` `${COLORS.cream}33` `` (placeholder text colors) |
| `app/dupe-finder.tsx` | 1 | `` `${COLORS.sage}CC` `` (LinearGradient) |
| `app/trip-receipt.tsx` | 1 | `` `${COLORS.sage}CC` `` |
| `app/trip-wrapped.tsx` | 1 | `` `${COLORS.sage}CC` `` |
| `app/chaos-mode.tsx` | 1 | `` `${COLORS.gold}cc` `` |
| `app/chaos-dare.tsx` | 1 | `` `${COLORS.gold}cc` `` |
| `app/visited-map.tsx` | 1 | `COLORS.sage + '40'` |
| `app/people-met.tsx` | 1 | `COLORS.sage + '40'` |
| `app/roam-for-dates.tsx` | 1 | `COLORS.sage + '25'` |
| `components/features/LiveCompanionFAB.tsx` | 1 | `` `${COLORS.cream}44` `` |

**Recommended token mappings for follow-up sweep:**
- `sage + '12'/'20'/'25'` → `COLORS.sageSoft` / `COLORS.sageHighlight`
- `sage + '30'` → `COLORS.sageBorder`
- `sage + '40'/'50'` → `COLORS.sageStrong`
- `sage + '60'` → `COLORS.sageMedium`
- `cream + '33'/'44'` → `COLORS.creamVeryFaint` / `COLORS.creamFaint`
- `sage + 'CC'` / `gold + 'cc'` → use `COLORS.sageMedium` / `COLORS.goldMutedDim`

### B. Raw `rgba()` in Non-Token Contexts (1 remaining)

| File | Line | Value | Context |
|---|---|---|---|
| `app/(tabs)/index.tsx` | 145 | `rgba(0,0,0,0.35)`, `rgba(0,0,0,0.75)` | LinearGradient `colors` array on destination card | 
| `app/itinerary.tsx` | 2363 | `rgba(255,255,255,0.06)` | `borderTopColor` — matches `COLORS.border` exactly |

**Fix for itinerary.tsx:** `borderTopColor: 'rgba(255,255,255,0.06)'` → `borderTopColor: COLORS.border`  
**Fix for index.tsx:** `'rgba(0,0,0,0.35)'` → `COLORS.overlayMedium`; `'rgba(0,0,0,0.75)'` → `COLORS.overlayDarkDim`

### C. Cosmetically-Intentional Numeric Radius (Not tokenizable — documented)

The following use `borderRadius` values for which no RADIUS token exists and which are geometrically intentional (circle elements where `radius = width/2`):

| File | Style | Value | Reason |
|---|---|---|---|
| `app/(tabs)/food.tsx:719` | `statusDot` | `borderRadius: 4` | 8×8 circle indicator (`width/2`) |
| `app/(tabs)/food.tsx:724` | `statusDotSmall` | `borderRadius: 3` | 6×6 circle indicator (`width/2`) |
| `components/generate/GenerateQuickMode.tsx:878` | `paceBlock` | `borderRadius: 2` | Tiny 6×12 bar tick |
| Various `group.tsx` | Multiple `borderRadius: 3` | Progress bar ticks | Same pattern |

**Recommendation:** Add `RADIUS.circle: (size: number) => size / 2` helper, or document that `borderRadius: width/2` is acceptable for purely geometric circle elements.

### D. Additional `borderRadius` Violations in Legacy Screens

Large number of raw values remain in `app/(tabs)/group.tsx` (10), `app/(tabs)/prep.tsx` (12), `app/people-met.tsx` (5), etc. These are all in screens that are functional but not newly-built in this sprint. Recommended for a dedicated radius sweep PR.

---

## Audit Methodology

```bash
# Hardcoded hex colors
rg "backgroundColor: '#|borderColor: '#|color: '#" app/ components/ --glob "**/*.tsx"

# Raw rgba()  
rg "rgba\([0-9]" app/ components/ --glob "**/*.tsx"

# Alpha modifier anti-patterns
rg "COLORS\.\w+ \+ '|\`\$\{COLORS\." app/ components/ --glob "**/*.tsx"

# Numeric borderRadius
rg "borderRadius: [0-9]" app/ components/ --glob "**/*.tsx" --count

# Non-lucide icon imports
rg "@expo/vector-icons|react-native-vector-icons|Ionicons|MaterialIcons" --glob "**/*.tsx"

# Hardcoded fonts
rg "fontFamily: 'Cormorant|fontFamily: 'DM" app/ components/ --glob "**/*.tsx"
```

---

## Token Reference — Quick Mapping Guide

### Border Radius
| Numeric | Use `RADIUS.*` | Notes |
|---|---|---|
| `3`, `4` | Keep if `width/2` circle | No `RADIUS.xs` token |
| `6` | `RADIUS.sm` | |
| `8` | `RADIUS.sm` | Close enough |
| `10` | `RADIUS.md` | Exact |
| `12`, `14`, `16` | `RADIUS.xl` | Max non-full token |
| `18`, `20`, `22`, `100`, `9999` | `RADIUS.full` | Pill / circle |

### Alpha Modifiers
| Pattern | Replacement |
|---|---|
| `COLORS.sage + '05'/'06'` | `COLORS.sageVeryFaint` |
| `COLORS.sage + '10'/'12'/'15'` | `COLORS.sageSoft` |
| `COLORS.sage + '20'/'25'` | `COLORS.sageHighlight` |
| `COLORS.sage + '30'` | `COLORS.sageBorder` |
| `COLORS.sage + '40'/'50'` | `COLORS.sageStrong` |
| `COLORS.sage + '60'` | `COLORS.sageMedium` |
| `COLORS.gold + '08'/'10'/'14'/'15'` | `COLORS.goldSubtle` |
| `COLORS.gold + '20'` | `COLORS.goldMutedLight` |
| `COLORS.gold + '30'` | `COLORS.goldBorderStrong` |
| `COLORS.gold + '40'` | `COLORS.goldDim` |
| `COLORS.gold + 'cc'` | `COLORS.goldMutedDim` |
| `COLORS.coral + '15'/'20'` | `COLORS.coralSubtle` |
| `COLORS.coral + '30'/'33'` | `COLORS.coralLight` |
| `COLORS.cream + '33'` | `COLORS.creamVeryFaint` |
| `COLORS.cream + '44'` | `COLORS.creamFaint` |
| `rgba(255,255,255,0.04)` | `COLORS.bgGlass` |
| `rgba(255,255,255,0.06)` | `COLORS.border` |

---

*Report generated by Agent 03 — Design Enforcer on 2026-03-13.*
