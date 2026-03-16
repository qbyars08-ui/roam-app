# ROAM Design Audit — Post-Polish (2026-03-16)

Agent 03 Design Enforcer. Top 15 violations to fix.

---

## 1. Hardcoded hex/rgba outside constants

**Rule:** All colors must use COLORS tokens from `lib/constants.ts`.

| File | Violation |
|------|-----------|
| `app/trip-album.tsx` | `#000`, `#fff`, `rgba(0,0,0,0.6)`, `rgba(0,0,0,0.95)` — use COLORS.black, COLORS.white, COLORS.overlay |
| `app/trip-story.tsx` | 20+ hardcoded `#fff`, `#000`, `rgba(255,255,255,...)` — use COLORS tokens |
| `app/expense-tracker.tsx` | `#000`, `rgba(0,0,0,0.7)` — use COLORS.black, COLORS.overlayDark |
| `app/compatibility.tsx` | `#000` on icons — use COLORS.black |
| `app/profile.tsx` | `rgba(0,0,0,0.5)`, `#fff` — use COLORS.overlay, COLORS.white |
| `app/(tabs)/people.tsx` | `rgba(0,0,0,0.5)`, `#fff`, `rgba(255,255,255,0.15)` — use COLORS tokens |
| `app/(tabs)/index.tsx` | `#fff`, `rgba(255,255,255,0.7)` — use COLORS.white, COLORS.creamBright |
| `components/monetization/ProGate.tsx` | `#A8893A` — use COLORS.goldDark or add to constants |
| `components/ui/DestinationImageFallback.tsx` | Per-destination hex — acceptable (theme-specific) but consider COLORS map |
| `components/ui/DestinationThemeOverlay.tsx` | Per-destination rgba — acceptable (theme-specific) |

---

## 2. Magic number spacing

**Rule:** All gaps must use SPACING tokens (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48, xxxl:64).

| File | Violation |
|------|-----------|
| `app/what-if.tsx` | `padding: 0`, various non-token values |
| `app/visited-map.tsx` | fontSize 10, 11, 12, 13 — consider typography scale |
| `app/viral-cards.tsx` | fontSize 13, 14, 22 — use FONTS + consistent scale |

---

## 3. Font size hierarchy

**Rule:** Headers 28–40pt, body 13–15pt, labels 11–12pt. Use FONTS constants.

| File | Violation |
|------|-----------|
| `app/what-if.tsx` | fontSize: 64, 56, 34 — oversized headers |
| `app/visited-map.tsx` | fontSize: 42, 36, 28 — inconsistent with design system |
| `app/viral-cards.tsx` | fontSize: 22, 13, 14 — no FONTS reference |

---

## 4. Icon consistency

**Rule:** All lucide icons, strokeWidth={2}, size={20} default.

| File | Violation |
|------|-----------|
| `app/trip-album.tsx` | Plus size={28}, X size={24} — inconsistent |
| `app/expense-tracker.tsx` | Plus size={28}, Check size={20} — mixed sizes |
| `app/compatibility.tsx` | ArrowRight size={18}, Share2 size={18} — sub-20 default |

---

## 5. Button press states

**Rule:** All pressable elements must have haptic + scale/opacity feedback.

| File | Violation |
|------|-----------|
| `app/(tabs)/flights.tsx` | Popular route cards — verify Pressable has activeOpacity |
| `app/(tabs)/people.tsx` | Connect buttons — verify haptic on press |
| Various | Empty state CTAs — ensure Haptics.impactAsync on press |

---

## 6. Card height consistency

**Rule:** Discover, People, Flights tabs — card heights should be consistent.

| Tab | Current | Target |
|-----|---------|--------|
| Discover | ~180px destination cards | Standardize |
| People | ~200px traveler cards | Match Discover rhythm |
| Flights | Popular routes ~200px | Align with others |

---

## 7. Hardcoded English strings (localization)

**Rule:** All user-facing strings must use i18n `t()`.

| File | Violation |
|------|-----------|
| `app/profile.tsx` | "Emergency Medical Card", "Set up your medical info..." — hardcoded |
| `app/(tabs)/flights.tsx` | "Layover Optimizer", "What to do with X hours..." — hardcoded |
| `app/before-you-land.tsx` | CHECKLIST_ITEMS labels — hardcoded |
| `app/emergency-card.tsx` | Form labels, Alert strings — hardcoded |
| `app/layover.tsx` | "Activities that fit your X-hour layover" — hardcoded |

---

## 8. Travel card gradient palette

**Rule:** `app/travel-card.tsx` uses custom hex palettes — consider moving to COLORS or DESTINATION_THEME_PALETTES.

---

## 9. Air quality colors

**Rule:** `lib/air-quality.ts` uses Material Design hex (#4CAF50, #FFC107, etc.) — add COLORS.aqiGood, etc. or map to design system.

---

## 10. ComingSoon gradient

**Rule:** `components/ComingSoon.tsx` uses `#0a1812` — use COLORS.gradientForestLight.

---

## 11. Duplicate SUPPORTED_LANGUAGES entry

**Rule:** `lib/i18n/index.ts` has `{ code: 'de', ... }` twice — remove duplicate.

---

## 12. People tab headerSubActive

**Rule:** `people.headerSubActive` key used but missing from en.ts — add to base locale.

---

## 13. DestinationImageFallback default

**Rule:** `DEFAULT_THEME_COLOR = '#7CAF8A'` — use COLORS.sage.

---

## 14. Shadow color

**Rule:** `shadowColor: '#000'` in itinerary, expense-tracker, trip-album — use COLORS.black.

---

## 15. Receipt/print theme

**Rule:** `app/trip-story.tsx` uses light-theme receipt colors — acceptable for share card; ensure COLORS.receipt* tokens used consistently.

---

## Priority Fix Order

1. **P0:** Remove duplicate German in i18n, add missing keys (people.headerSubActive, profile.emergencyCard*, flights.layover*)
2. **P1:** Replace #fff/#000 with COLORS.white/COLORS.black in trip-album, trip-story, expense-tracker, profile, people
3. **P2:** Add i18n to before-you-land, emergency-card, layover screens
4. **P3:** ProGate #A8893A → COLORS.goldDark, ComingSoon → COLORS.gradientForestLight
5. **P4:** Font/spacing audit for what-if, visited-map, viral-cards
