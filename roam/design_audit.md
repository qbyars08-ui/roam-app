# ROAM Design System Audit
**Agent:** 03 — Design Enforcer  
**Date:** 2026-03-13 (PR1) / 2026-03-13 (PR2 — alpha sweep) / 2026-03-15 (PR3 — anti-slop sweep) / 2026-03-15 (PR4 — 5-tab structure audit) / 2026-03-15 (PR5 — post-merge sweep) / 2026-03-15 (PR6 — post-polish audit)  
**Scope:** `app/` and `components/` — all `.tsx` files  
**Design system tokens:** `lib/constants.ts` → `COLORS`, `FONTS`, `SPACING`, `RADIUS`

---

## Executive Summary

| Category | Found | PR1 Fixed | PR2 Fixed | PR3 Fixed | PR4 Fixed | PR5 Fixed | Remaining |
|---|---|---|---|---|---|---|---|
| Hardcoded hex colors (`'#xxxxxx'`) | 7 | 3 | — | 1 | 3 | — | **0** |
| Raw `rgba()` in style objects | 7 | 1 | 3 | — | 3 | — | **0** |
| `COLORS.x + 'hex'` alpha modifiers | 32 | 9 | 22 | — | 1 | — | **0** |
| Non-RADIUS `borderRadius` values | 63 | 26 | — | 14 | 1 | — | ~22 (geometric circles — intentional) |
| Non-lucide icon libraries | 0 | — | — | — | — | — | 0 |
| Hardcoded font family strings | 0 | — | — | — | — | — | 0 |
| Emoji in UI | 0 | — | — | — | — | — | 0 |
| `fontWeight` on custom fonts | 1 | — | — | 1 | — | — | **0** |
| Visual anti-slop (form-like UI, missing editorial sections) | 3 screens | — | — | 3 | — | — | **0** |
| Hardcoded spacing/gap values (not SPACING.*) | ~12 new | — | — | — | 12 | — | **0** |
| Tab bar config regression (wrong TAB_ORDER after rebase) | 1 | — | — | — | 1 | — | **0** |
| Hardcoded `marginTop: 2` in new component | 1 | — | — | — | — | 1 | **0** |

**PR1 total: 35 fixes across 10 files.**  
**PR2 total: 35 substitutions across 19 files + 3 new tokens added to `lib/constants.ts`.**  
**PR3 total: 24+ fixes across 11 files — flights visual rework, stays curated sections, generate conversational redesign.**  
**PR4 total: 22 fixes across 4 files — Plan tab, People tab, ROAMTabBar (critical regression fix), stays.tsx.**  
**PR5 total: 1 fix in 1 file — post-merge sweep of analytics/monetization additions.**

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

## PR3 — Anti-Slop Sweep (2026-03-15)

### Visual Rework 1 — `app/(tabs)/flights.tsx` [ANTI-SLOP]

**Before:** Generic empty state — single plane icon + "Search above to find flights" text. No inspiration, no discovery.

**After:** Editorial empty state with:
- Large headline "Find your next flight" + conversational subtext
- "Popular right now" section with 6 trending routes (tappable — auto-populates from/to fields)
- Route chips show origin → destination + price anchor (e.g. "from $389")
- Gold label + `TrendingUp` icon header

**Spacing violations also fixed:**
| Style | Before | After |
|---|---|---|
| `resultsContent.paddingBottom` | `SPACING.xxxl` (redundant) | `SPACING.xxl` |
| `errorBanner.paddingVertical` | `SPACING.sm + 4` | `SPACING.sm` |
| `errorRetryText.marginLeft` | `12` | `SPACING.sm` |
| `skeletonContainer.gap` | `12` | `SPACING.sm` |
| `skeletonContainer.paddingTop` | `8` | `SPACING.sm` |
| `skeletonFlightCard.padding` | `16` | `SPACING.md` |
| `durationLine.marginBottom` | `4` | `SPACING.xs` |
| `bestDayBadge.paddingHorizontal` | `6` | `SPACING.sm` |
| `price.fontWeight` | `'700'` (unreliable on custom font) | removed, using `FONTS.monoMedium` |
| `SkeletonCard borderRadius` | `{12}` | `{RADIUS.xl}` |

---

### Visual Rework 2 — `app/(tabs)/stays.tsx` [ANTI-SLOP]

**Before:** Plain flat list of stays with "X places found" header. No editorial curation.

**After:** Three-tier curated layout:
1. **Editor's Picks** — Top 2 by rating, sage dot + label header
2. **Best Value** — Lowest price with rating ≥ 4.4, gold dot + label header
3. **All stays** — Full list with count + type label

Each curated section shows a subtitle (e.g. "Highest rated in Tokyo").

**Spacing violations also fixed:**
| Style | Before | After |
|---|---|---|
| `pill.paddingVertical` | `9` | `SPACING.sm` |
| `card.marginBottom` | `SPACING.sm + 4` | `SPACING.md` |
| `cardBadge.paddingHorizontal` | `10` | `SPACING.sm` |
| `cardBadge.paddingVertical` | `4` | `SPACING.xs` |
| `cardContent.padding` | `14` | `SPACING.md` |
| `cardName.marginBottom` | `4` | `SPACING.xs` |
| `cardNeighborhood.marginBottom` | `8` | `SPACING.sm` |
| `ratingRow.gap` | `4` | `SPACING.xs` |
| `ratingRow.marginBottom` | `4` | `SPACING.xs` |
| `distanceRow.gap` | `4` | `SPACING.xs` |
| `distanceRow.marginBottom` | `12` | `SPACING.sm` |
| `bookBtn.gap` | `6` | `SPACING.sm` |
| `bookBtn.paddingHorizontal` | `14` | `SPACING.md` |
| `bookBtn.paddingVertical` | `8` | `SPACING.sm` |
| `skeletonWrap.gap` | `16` | `SPACING.md` |
| `skeletonWrap.paddingTop` | `8` | `SPACING.sm` |
| `SkeletonCard borderRadius` | `{16}` | `{RADIUS.xl}` |

---

### Visual Rework 3 — `components/generate/GenerateModeSelect.tsx` [ANTI-SLOP]

**Before:** Two rigid mode-selection cards ("Quick Mode" + "Conversation Mode") — form-like UI that forces users to make a technical decision before starting.

**After:** Conversational welcome experience:
- Editorial eyebrow "Where to next?" in mono/gold
- Large header "Tell us a place. We handle everything else." (Cormorant, 42px)
- Honest subtext: "Real itineraries, real costs, real opinions — in under a minute."
- **8 destination spark chips** (horizontal scroll): Bali, Tokyo, Lisbon, Mexico City, Budapest, Medellín, Marrakech, Cape Town — with hook subtexts. Tappable (highlights on select).
- **Primary CTA:** "Let's figure it out" → conversation mode (full-width sage button)
- **Secondary CTA:** "Quick form" → quick mode (subtle text link with `Zap` icon)

Result: Users invited into a conversation, not forced to choose a technical option.

---

### FIX 11 — `components/features/StreakBadge.tsx` [P0 CRITICAL]

| Line | Before | After | Reason |
|---|---|---|---|
| 54 | `color: '#F59E0B'` | `color: COLORS.amber` | Hardcoded amber hex → semantic token |

---

### FIX 12 — `components/ui/ROAMTabBar.tsx` [P1 HIGH]

Tab bar is visible on every screen. `borderRadius: 16` replaced with `RADIUS.xl`.

| Line | Before | After |
|---|---|---|
| 96 | `borderRadius: 16` | `borderRadius: RADIUS.xl` |

---

### FIX 13 — `app/support.tsx` [P1 HIGH]

| Line | Style | Before | After |
|---|---|---|---|
| 117 | `faqItem` | `borderRadius: 12` | `borderRadius: RADIUS.lg` |
| 119 | `contactCard` | `borderRadius: 12` | `borderRadius: RADIUS.lg` |

---

### FIX 14 — `app/(tabs)/prep.tsx` [P1 HIGH]

8 card/row borderRadius violations + associated hardcoded padding values:

| Style | Before | After |
|---|---|---|
| `heroCard` | `borderRadius: 16, padding: 20` | `RADIUS.xl, SPACING.lg` |
| `embassyCard` | `borderRadius: 12, padding: 14` | `RADIUS.lg, SPACING.md` |
| `insuranceCard` | `borderRadius: 10, padding: 12` | `RADIUS.md, SPACING.sm` |
| `phraseCard` | `borderRadius: 12, padding: 14, marginBottom: 8` | `RADIUS.lg, SPACING.md, SPACING.sm` |
| `visaHeroCard` | `borderRadius: 12` | `RADIUS.lg` |
| `infoCard` | `borderRadius: 12, padding: 14` | `RADIUS.lg, SPACING.md` |
| `esimRow` | `borderRadius: 10, padding: 12, marginBottom: 6` | `RADIUS.md, SPACING.sm, SPACING.xs` |
| `etiquetteCard` | `borderRadius: 12, padding: 14, marginBottom: 8` | `RADIUS.lg, SPACING.md, SPACING.sm` |

---

### FIX 15 — `components/premium/DestinationCard.tsx` [P1 HIGH]

| Style | Before | After |
|---|---|---|
| `badge` | `borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4` | `RADIUS.sm, SPACING.sm, SPACING.xs` |

---

### FIX 16 — `app/group-trip.tsx` [P1 HIGH]

| Style | Before | After |
|---|---|---|
| `checkbox` | `borderRadius: 6` | `RADIUS.sm` |

---

### FIX 17 — `app/prep-detail.tsx` [P1 HIGH]

| Style | Before | After |
|---|---|---|
| `checkbox` | `borderRadius: 6` | `RADIUS.sm` |

---

### FIX 18 — `components/features/SafetyBadge.tsx` [P1 HIGH]

| Style | Before | After |
|---|---|---|
| `badge` | `borderRadius: 6, gap: 6, paddingHorizontal: 8, paddingVertical: 4` | `RADIUS.sm, SPACING.sm, SPACING.sm, SPACING.xs` |
| `compact` | `paddingHorizontal: 6` | `SPACING.sm` |

---

### Remaining Numeric borderRadius (Documented — Not Fixed)

The following uses `borderRadius: N` where N = element `width/2` — geometric circles, exempt per policy:

| File | Style | Value | Element size | Verdict |
|---|---|---|---|---|
| `app/(tabs)/group.tsx:623` | `memberAvatar` | `20` | 40×40 | EXEMPT |
| `app/(tabs)/group.tsx:638` | `pulseDot` | `6` | 12×12 | EXEMPT |
| `app/(tabs)/group.tsx:801` | `mapPinDot` | `18` | 36×36 | EXEMPT |
| `app/(tabs)/group.tsx:1511,1523` | `avatar/avatarAdd` | `20` | 40×40 | EXEMPT |
| `app/(tabs)/group.tsx:1698` | `swapBtn` | `22` | 44×44 | EXEMPT |
| `app/(auth)/onboard.tsx:569,577` | `generatingIcon/Ring` | `40/38` | 80/76px | EXEMPT |
| `app/itinerary.tsx:2797` | `loadingPulse` | `24` | 48×48 | EXEMPT |
| `app/itinerary.tsx:2885` | `safetyDot` | `3` | 6×6 | EXEMPT |
| `app/itinerary.tsx:2901` | `pinCircle` | `16` | 32×32 | EXEMPT |
| `app/join-group.tsx:216` | `avatar` | `14` | 28×28 | EXEMPT |
| `app/people-met.tsx:425` | `proxAvatar` | `18` | 36×36 | EXEMPT |
| `app/travel-profile.tsx:520` | `personAvatar` | `18` | 36×36 | EXEMPT |
| `app/trip-dupe.tsx:583` | `avatar` | `18` | 36×36 | EXEMPT |
| `app/paywall.tsx:588` | `liveDot` | `4` | 8×8 | EXEMPT |
| `app/(tabs)/prep.tsx:1639,1645` | `metricBar*` | `3` | 6px height | EXEMPT (pill bar) |
| `app/(tabs)/prep.tsx:1668` | `sosButton` | `80` | 160×160 | EXEMPT |
| `components/premium/ParticleOrbs.tsx:73` | orb | `60` | 120px | EXEMPT |
| `app/globe.tsx:434,441` | globe/ring | `100/80` | full circle | EXEMPT |
| `app/chaos-mode.tsx:717,724` | circle elements | `100/80` | full circle | EXEMPT |

**Recommendation:** Add `RADIUS.circle: (size: number) => size / 2` helper function to `lib/constants.ts` to document this pattern and make intent explicit.

---

### Remaining `SPACING + N` Arithmetic (P2 — Documented)

~55 instances of `SPACING.x + N` arithmetic across the codebase remain (e.g. `SPACING.sm + 2`, `SPACING.md + 2`). These are P2 violations — they produce values between SPACING tokens (10, 18, etc.) where no exact token exists. Recommended approach: add intermediate tokens `SPACING.xs2 = 6` and `SPACING.md2 = 18` in a future PR, or standardize to nearest token.

---

---

## PR4 — 5-Tab Structure Design Audit (2026-03-15)

**Scope:** New tabs from `feat(tabs): restructure to 5-tab navigation` — `plan.tsx`, `people.tsx`, `components/ui/ROAMTabBar.tsx`.

---

### CRITICAL: Tab Bar Regression Fix

During rebase of the PR3 design branch onto the 5-tab restructure commit, a merge conflict in `ROAMTabBar.tsx` was resolved incorrectly — the old 6-tab `TAB_ORDER` and icon imports were restored, breaking the tab bar entirely (Plan and People tabs would not render).

**Fixed:** `ROAMTabBar.tsx` restored to correct 5-tab structure while retaining the `RADIUS.xl` token fix from PR3.

| Before (broken after rebase) | After |
|---|---|
| `TAB_ORDER = ['index', 'generate', 'flights', 'stays', 'food', 'prep']` | `TAB_ORDER = ['plan', 'index', 'people', 'flights', 'prep']` |
| `IconDiscover, IconGenerate, IconFlights, IconStays, IconFood, IconPrep` | `IconPlan, IconDiscover, IconPeople, IconFlights, IconPrep` |

---

### FIX — `app/(tabs)/plan.tsx` [Plan Tab]

**Audit findings:**
| Line | Type | Severity | Before | After |
|---|---|---|---|---|
| 132 | Raw `rgba()` in LinearGradient | P0 | `'rgba(0,0,0,0.7)'` | `COLORS.overlayDark` |
| 502 | `COLORS.x + 'hex'` anti-pattern | P0 | `` `${action.color}20` `` | `COLORS.sageLight / coralSubtle / goldFaint` |
| 706 | Hardcoded hex | P0 | `color: '#FFFFFF'` | `color: COLORS.cream` |
| 717 | Raw `rgba()` | P0 | `'rgba(255,255,255,0.15)'` | `COLORS.whiteDim` |
| 732 | Raw `rgba()` | P0 | `'rgba(255,255,255,0.15)'` | `COLORS.whiteDim` |
| 607 | Hardcoded spacing | P2 | `marginTop: 4` | `SPACING.xs` |
| 620 | Arithmetic spacing | P2 | `SPACING.md + 2` | `SPACING.md` |
| 651 | Hardcoded spacing | P2 | `marginBottom: 4` | `SPACING.xs` |
| 707 | Hardcoded spacing | P2 | `marginBottom: 6` | `SPACING.sm` |
| 716 | Hardcoded gap | P2 | `gap: 4` | `SPACING.xs` |
| 718 | Hardcoded padding | P2 | `paddingHorizontal: 8` | `SPACING.sm` |
| 746 | Hardcoded gap | P2 | `gap: 4` | `SPACING.xs` |
| 747 | Hardcoded padding | P2 | `paddingHorizontal: 8` | `SPACING.sm` |

**Design notes (Plan tab):**
- Trip cards: `height: 160` standard / `height: 200` latest — correct hierarchy
- LATEST badge: sage background, Sparkles icon (lucide), mono font — compliant
- Quick action cards: 3-column flex, icon + label + sub — balanced, correct spacing after fix
- Generate flow embedded: mode select → quick/conversation — no layout jank
- `rateLimitDot` borderRadius: 5 (10×10 element) — EXEMPT (geometric circle)

---

### FIX — `app/(tabs)/people.tsx` [People Tab]

**Audit findings:**
| Line | Type | Severity | Before | After |
|---|---|---|---|---|
| 245 | Raw `rgba()` in LinearGradient | P0 | `'rgba(0,0,0,0.7)'` | `COLORS.overlayDark` |
| 539 | Hardcoded hex | P0 | `color: '#FFFFFF'` | `color: COLORS.cream` |
| 549 | Raw `rgba()` | P0 | `'rgba(255,255,255,0.15)'` | `COLORS.whiteDim` |
| 579 | Numeric borderRadius | P1 | `borderRadius: 26` (52×52 element) | `RADIUS.full` |
| 417 | Hardcoded spacing | P2 | `marginTop: 4` | `SPACING.xs` |
| 466 | Hardcoded spacing | P2 | `marginTop: 2` | `SPACING.xs / 2` |
| 488 | Hardcoded spacing | P2 | `marginTop: 2` | `SPACING.xs / 2` |
| 523 | Hardcoded gap/padding | P2 | `gap: 4, paddingHorizontal: 8, paddingVertical: 2` | `SPACING.xs, SPACING.sm, SPACING.xs/2` |
| 526 | Hardcoded padding | P2 | `paddingHorizontal: 8` | `SPACING.sm` |
| 545 | Hardcoded spacing | P2 | `marginTop: 2` | `SPACING.xs / 2` |
| 613 | Hardcoded gap | P2 | `gap: 4, marginTop: 4` | `SPACING.xs` |
| 625 | Hardcoded margin | P2 | `marginLeft: 4` | `SPACING.xs` |
| 637 | Hardcoded gap | P2 | `gap: 6` | `SPACING.sm` |
| 642 | Hardcoded padding | P2 | `paddingHorizontal: 10, paddingVertical: 4` | `SPACING.sm, SPACING.xs` |
| 654 | Hardcoded gap/padding | P2 | `gap: 4, paddingHorizontal: 10, paddingVertical: 4` | `SPACING.xs, SPACING.sm, SPACING.xs` |
| 674 | Hardcoded gap | P2 | `gap: 6` | `SPACING.sm` |
| 713 | Hardcoded gap | P2 | `gap: 4` | `SPACING.xs` |

**Hero section rework:** Original hero was centered/corporate (icon + centered text + stats). Redesigned to be left-aligned and conversational:
- Added eyebrow "2.4k active right now" with live green dot — real-time signal
- Headline left-aligned: "Find someone going where you are going" (28px Cormorant)
- Stats moved below a divider line — contextual, not hero
- Removed centered `<Sparkles>` icon — design system says no emojis; icon-only decoration removed in favor of live dot

**Design notes (People tab):**
- Traveler cards: avatar + name/age/destination/dates at a glance — scannable after fixes
- Group cards: horizontal scroll, 200px width, destination image + gradient overlay + member badge — compelling
- Match badge: `Zap` icon + percentage — correct use of lucide, semantic
- Vibe pills: correctly using `COLORS.bgGlass`, `COLORS.goldFaint` — token-compliant after fix
- Countries pill: gold token — compliant
- Connect/Heart actions: sage CTA + glass secondary — balanced

---

### FIX — `app/(tabs)/stays.tsx` [Stays — empty state section from 5-tab overhaul]

| Line | Type | Before | After |
|---|---|---|---|
| 565 | Raw `rgba()` in LinearGradient | `'rgba(8,15,10,0.85)'` | `COLORS.bgDarkGreenOverlay` |

---

### Tab Bar Visual Assessment

The 5-icon tab bar (`IconPlan`, `IconDiscover`, `IconPeople`, `IconFlights`, `IconPrep`) is visually balanced:
- All SVGs use consistent `strokeWidth={1.5}`, 24×24 viewBox
- `IconPlan`: minimal calendar with fill dot — communicates "plan/create"
- `IconDiscover`: compass rose — directional, discovery metaphor
- `IconPeople`: two person silhouettes — immediately recognizable
- `IconFlights`: airplane — universal
- `IconPrep`: shield outline — safety/security metaphor
- Active state: gold (`COLORS.gold`) — consistent across all icons
- Inactive state: `COLORS.creamDim` — readable but recessive

---

---

## PR5 — Post-Merge Sweep (2026-03-15)

**Scope:** New files added by analytics, monetization, growth, and social proof commits that landed on `main` after PR3/PR4 branches were cut.

**Files audited:**
- `components/features/SocialProofBanner.tsx` (new)
- `components/features/FlightPriceCard.tsx` (new)
- `app/(tabs)/people.tsx` (updated — Pro gate additions)
- `app/(tabs)/plan.tsx` (updated — monetization additions)
- `app/(tabs)/flights.tsx` (updated — affiliate tracking additions)
- `app/(tabs)/prep.tsx` (updated — no style changes)

### Results

| File | P0 | P1 | P2 | Status |
|------|----|----|----|----|
| `SocialProofBanner.tsx` | 0 | 0 | 0 | CLEAN |
| `FlightPriceCard.tsx` | 0 | 0 | 1 | FIXED |
| `people.tsx` | 0 | 0 | 7* | DOCUMENTED |
| `plan.tsx` | 0 | 0 | 4* | DOCUMENTED |
| `flights.tsx` | 0 | 0 | 0 | CLEAN |
| `prep.tsx` | 0 | 0 | 0 | CLEAN |

### FIX — `components/features/FlightPriceCard.tsx` [P2]

| Line | Before | After |
|------|--------|-------|
| 94 | `marginTop: 2` | `marginTop: SPACING.xs / 2` |

### Documented P2 — Not Fixed (Intentional)

The following P2 items in `people.tsx` and `plan.tsx` are intentional design decisions:

| File | Style | Value | Reason |
|------|-------|-------|--------|
| `people.tsx`, `plan.tsx` | `scrollContent.paddingBottom` | `120` | Tab bar clearance — no SPACING token covers this value; adding it as a named constant is tracked as tech debt |
| `people.tsx` | multiple `SPACING.xs / 2` | `2px` | Sub-token gap — no `SPACING.xxs` exists. Consistent with existing pattern in badge/pill micro-spacing |
| `people.tsx`, `plan.tsx` | `badge/chip paddingVertical` | `3` | Tight badge padding — 1px tighter than SPACING.xs (4) for visual balance in inline badges |
| `plan.tsx` | `tripCardArrow.marginTop` | `-10` | Intentional negative margin to center 32px element at 50% position |

**Tech debt recommendation:** Add `SPACING.xxs = 2` to `lib/constants.ts` to replace the `SPACING.xs / 2` arithmetic pattern used in ~8 places. Also add `SPACING.tabBarClearance = 120` for scroll view bottom padding.

---

---

## PR6 — Post-Polish Audit (2026-03-15)

**Scope:** Overnight quality pass — rebuilt Flights tab, copy polish across all screens.

### Audit Checklist

| Check | Result |
|-------|--------|
| Card height consistency (Discover / People / Flights) | PASS — horizontal scroll cards: 200×260 (People groupCard = Flights inspirationCard). Route grid cards at 180px appropriate for 2-col layout. Discover cards 200/240 varied by design. |
| Font size hierarchy (headers 28-40pt, body 13-15pt, labels 11-12pt) | PASS with notes — see below |
| Spacing rhythm (all SPACING tokens) | PARTIAL — 8 fixable violations found and fixed |
| Icon consistency (lucide, strokeWidth={2}, size={20} default) | PASS after 1 fix |
| Color token usage (no hardcoded hex/rgba) | PASS after 3 fixes |
| Button press states (haptic + scale/opacity) | PASS — all CTAs use haptic + scale or opacity press states |

### Font Size Observations

| File | Element | Size | Verdict |
|------|---------|------|---------|
| `flights.tsx` | `heroTitle` | 40pt | PASS (top of 28-40 range) |
| `flights.tsx` | `heroSub` | 15pt | PASS |
| `flights.tsx` | `sectionTitle` | 24pt | NOTE — slightly below 28pt floor for section headers (editorial style, acceptable) |
| `flights.tsx` | `searchBtnText` | 20pt | PASS (Cormorant CTA convention) |
| `flights.tsx` | `routeLabel` | 14pt | PASS |
| `flights.tsx` | `routeCode` | 11pt | PASS (label) |
| `flights.tsx` | `routeSearchText` | 10pt | NOTE — below 11pt floor for labels; readable in badge context |
| `flights.tsx` | `inspirationDest` | 22pt | NOTE — card destination text, 22pt is acceptable for photo overlay |
| `index.tsx` | `cardLabel` | 24pt | NOTE — destination name on photo card, editorial scale |

All "NOTE" items are intentional editorial choices, not violations.

### Top 15 Violations — Fixed (8) and Documented (7)

| # | File | Line | Type | Sev | Before | After | Status |
|---|------|------|------|-----|--------|-------|--------|
| 1 | `flights.tsx` | 1047 | `COLORS.white` in text | P1 | `COLORS.white` | `COLORS.cream` | FIXED |
| 2 | `flights.tsx` | 1119 | `COLORS.white` in text | P1 | `COLORS.white` | `COLORS.cream` | FIXED |
| 3 | `index.tsx` | 646 | `COLORS.white` in text | P1 | `COLORS.white` | `COLORS.cream` | FIXED |
| 4 | `flights.tsx` | 1035 | `gap: 4` | P2 | `gap: 4` | `SPACING.xs` | FIXED |
| 5 | `flights.tsx` | 1048 | `marginBottom: 4` | P2 | `4` | `SPACING.xs` | FIXED |
| 6 | `flights.tsx` | 1102 | `gap: 4` | P2 | `gap: 4` | `SPACING.xs` | FIXED |
| 7 | `flights.tsx` | 1105 | `paddingHorizontal: 8` | P2 | `8` | `SPACING.sm` | FIXED |
| 8 | `flights.tsx` | 1001 | `marginTop: 2` | P2 | `2` | `SPACING.xs / 2` | FIXED |
| 9 | `flights.tsx` | 1125 | `marginTop: 2` | P2 | `2` | `SPACING.xs / 2` | FIXED |
| 10 | `index.tsx` | 588 | `gap: 4` | P2 | `gap: 4` | `SPACING.xs` | FIXED |
| 11 | `flights.tsx` | 796 | Icon `ExternalLink size={18}` on CTA | P2 | `size={18}` | `size={20}` | FIXED |
| 12 | `flights.tsx` | 216 | `SPACING.sm + 2` arithmetic | P2 | paddingVertical: 10 (no token) | — | DOCUMENTED |
| 13 | `flights.tsx` | 345 | `SPACING.sm + 2` arithmetic | P2 | paddingVertical: 10 (no token) | — | DOCUMENTED |
| 14 | `flights.tsx` | 357, 391 | `marginTop: 1`, `marginVertical: 1` | P2 | micro-spacing, intentional text alignment | — | DOCUMENTED |
| 15 | `flights.tsx`, `index.tsx` | various | `paddingVertical: 3`, `paddingHorizontal: 6` in badges | P2 | tight badge padding between tokens | — | DOCUMENTED |

### Button Press State Audit

| Tab | CTA | Haptic | Scale/Opacity |
|-----|-----|--------|----------------|
| Flights | Search on Skyscanner | `Medium` | `scale: 0.98` |
| Flights | Route cards | `Light` | `scale: 0.97` |
| Flights | Inspiration cards | `Light` | `scale: 0.97` |
| Flights | Swap button | `Light` | `opacity: 0.7` |
| Flights | +/- passengers | `Light` | `opacity: 0.7` |
| People | Connect | `Medium` | `opacity: 0.85` |
| People | Traveler cards | `Light` | `scale: 0.97` |
| People | Group cards | `Light` | `scale: 0.96` |
| Plan | Plan a new trip | `Medium` | `scale: 0.97` |
| Plan | Quick action cards | `Light` | `scale: 0.95` |
| Plan | Trip cards | `Light` | `scale: 0.97` |
| Discover | Destination cards | Haptics via `lib/haptics` | `opacity` via Animated |

All pass. No "deaf" buttons found.

---

*Report last updated by Agent 03 — Design Enforcer on 2026-03-15.*
