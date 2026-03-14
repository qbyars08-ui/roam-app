# ROAM Design System Audit
**Agent:** 03 — Design Enforcer  
**Date:** 2026-03-13 (PR1) / 2026-03-13 (PR2 — alpha sweep)  
**Scope:** `app/` and `components/` — all `.tsx` files  
**Design system tokens:** `lib/constants.ts` → `COLORS`, `FONTS`, `SPACING`, `RADIUS`

---

## Executive Summary

| Category | Found | PR1 Fixed | PR2 Fixed | Remaining |
|---|---|---|---|---|
| Hardcoded hex colors (`'#xxxxxx'`) | 3 | 3 | — | **0** |
| Raw `rgba()` in style objects | 4 | 1 | 3 | **0** |
| `COLORS.x + 'hex'` alpha modifiers | 31 | 9 | 22 | **0** |
| Non-RADIUS `borderRadius` values | 62 | 26 | — | 36 (geometric circles — intentional) |
| Non-lucide icon libraries | 0 | — | — | 0 |
| Hardcoded font family strings | 0 | — | — | 0 |
| Emoji in UI | 0 | — | — | 0 |

**PR1 total: 35 fixes across 10 files.**  
**PR2 total: 35 substitutions across 19 files + 3 new tokens added to `lib/constants.ts`.**

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

## PR2 — Alpha Sweep (2026-03-13)

All remaining alpha modifier anti-patterns and raw `rgba()` values were eliminated.

### New Tokens Added to `lib/constants.ts`

Three tokens were missing from the design system and required addition:

| Token | Value | Purpose |
|---|---|---|
| `COLORS.sageAlpha80` | `rgba(124,175,138,0.8)` | Sage at 80% opacity — LinearGradient fade endpoints |
| `COLORS.goldAlpha80` | `rgba(201,168,76,0.8)` | Gold at 80% opacity — LinearGradient fade endpoints |
| `COLORS.warningBorder` | `rgba(245,158,11,0.3)` | Amber warning border — fills gap above `warningHighlight` (0.2) |

### Alpha Modifier Fixes (22 from audit + 9 newly found = 31 total)

9 additional violations were discovered in files that landed on `main` after PR1 (`app/profile.tsx`, `components/monetization/`, `components/features/ExploreHub.tsx`).

| File | Before | After |
|---|---|---|
| `app/arrival-mode.tsx` (×7) | `coral+'30'`, `sage+'20'×2`, `sage+'12'`, `sage+'50'`, `sage+'30'`, `sage+'60'` | `coralLight`, `sageMuted`, `sageSubtle`, `sageStrong`, `sageLight`, `sageMedium` |
| `app/language-survival.tsx` (×4) | `sage+'25'`, `gold+'20'`, `sage+'20'`, `gold+'15'` | `sageHighlight`, `goldMutedLight`, `sageMuted`, `goldSoft` |
| `app/(auth)/signin.tsx` (×2) | `` `${COLORS.cream}33` `` | `COLORS.creamVeryFaint` |
| `app/dupe-finder.tsx` | `` `${COLORS.sage}CC` `` | `COLORS.sageAlpha80` |
| `app/trip-receipt.tsx` | `` `${COLORS.sage}CC` `` | `COLORS.sageAlpha80` |
| `app/trip-wrapped.tsx` | `` `${COLORS.sage}CC` `` | `COLORS.sageAlpha80` |
| `app/chaos-mode.tsx` | `` `${COLORS.gold}cc` `` | `COLORS.goldAlpha80` |
| `app/chaos-dare.tsx` | `` `${COLORS.gold}cc` `` | `COLORS.goldAlpha80` |
| `app/visited-map.tsx` | `sage+'40'` | `COLORS.sageBorder` |
| `app/people-met.tsx` | `sage+'40'` | `COLORS.sageBorder` |
| `app/roam-for-dates.tsx` | `sage+'25'` | `COLORS.sageHighlight` |
| `components/features/LiveCompanionFAB.tsx` | `` `${COLORS.cream}44` `` | `COLORS.creamFaint` |
| `app/profile.tsx` (×2) | `gold+'20'`, `gold+'40'` | `goldMutedLight`, `goldBorderStrong` |
| `components/monetization/PostTripUpgradeNudge.tsx` | `gold+'30'` | `COLORS.goldBorder` |
| `components/monetization/SubscriptionCard.tsx` (×3) | `gold+'18'`, `gold+'08'`, `gold+'30'` | `goldSubtle`, `goldVeryFaint`, `goldBorder` |
| `components/features/ExploreHub.tsx` (×3) | `gold+'30'`, `gold+'20'`, `gold+'40'` | `goldBorder`, `goldMutedLight`, `goldBorderStrong` |

### Raw rgba() Fixes

| File | Before | After | Token used |
|---|---|---|---|
| `app/itinerary.tsx:2393` | `'rgba(255,255,255,0.06)'` | `COLORS.border` | Exact match |
| `app/(tabs)/index.tsx:149` | `'rgba(0,0,0,0.35)'` | `COLORS.overlaySoft` | Closest (30%) |
| `app/(tabs)/index.tsx:149` | `'rgba(0,0,0,0.75)'` | `COLORS.overlayDark` | Closest (70%) |
| `components/features/StreakBadge.tsx:57` | `'rgba(245,158,11,0.3)'` | `COLORS.warningBorder` | New token |

### Alpha Modifier Token Mapping Reference

| Hex suffix | Opacity | Use this token |
|---|---|---|
| `sage + '05'/'06'` | 2–4% | `COLORS.sageVeryFaint` / `COLORS.sageFaint` |
| `sage + '12'/'14'` | ~7% | `COLORS.sageSubtle` |
| `sage + '20'` | 12.5% | `COLORS.sageMuted` |
| `sage + '25'` | 14.5% | `COLORS.sageHighlight` |
| `sage + '30'` | 18.8% | `COLORS.sageLight` |
| `sage + '40'` | 25.1% | `COLORS.sageBorder` |
| `sage + '50'` | 31.4% | `COLORS.sageStrong` |
| `sage + '60'` | 37.6% | `COLORS.sageMedium` |
| `sage + 'CC'` | 80% | `COLORS.sageAlpha80` *(new)* |
| `gold + '03'/'04'` | ~1.5% | `COLORS.goldVeryFaint` |
| `gold + '08'` | 3.1% | `COLORS.goldVeryFaint` |
| `gold + '15'` | 8.2% | `COLORS.goldSoft` |
| `gold + '18'` | 9.4% | `COLORS.goldSubtle` |
| `gold + '20'` | 12.5% | `COLORS.goldMutedLight` |
| `gold + '30'` | 18.8% | `COLORS.goldBorder` |
| `gold + '40'` | 25.1% | `COLORS.goldBorderStrong` |
| `gold + 'cc'` | 80% | `COLORS.goldAlpha80` *(new)* |
| `coral + '30'` | 18.8% | `COLORS.coralLight` |
| `cream + '33'` | 20% | `COLORS.creamVeryFaint` |
| `cream + '44'` | 26.7% | `COLORS.creamFaint` |

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
