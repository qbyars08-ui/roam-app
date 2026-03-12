# ROAM Polish Checklist

Systematic pass: design system, copy, loading, haptics, images, responsive.

Design bar:
- Colors: `#080F0A`, `#7CAF8A`, `#F5EDD8`, `#E8614A`, `#C9A84C`
- Cards: `rgba(255,255,255,0.04)`; borders `rgba(255,255,255,0.06)`
- Typography: Cormorant Garamond / DM Sans / DM Mono; max 12px radius
- No emojis (Lucide only); no drop shadows
- Copy: human, contractions, sentence case, em dashes, "trip" not "itinerary"
- Loading: skeleton within 1.5s for any fetch
- Haptics on interactive elements
- Images: ResilientImage with fallback
- Responsive: 3x resolution (iPhone 15 Pro Max)

| Route | Audited | Notes |
|-------|---------|-------|
| / (Discover) | x | SeasonalBadge, budget slider, design tokens, image fallback |
| /plan | x | SafetyScoreBadge, VisaChecker |
| /chat (Ask) | x | VoiceInputButton, "Where should I go?" starter |
| /saved | x | Image fallback, trip copy |
| /prep | x | Trip copy |
| /passport | x | |
| /globe | x | Trip copy, no shadows |
| /flights | x | |
| /pets | x | |
| /profile | x | |
| /itinerary | x | Trip copy, no shadows |
| /chaos-mode | x | Trip copy |
| /chaos-dare | | |
| /create-group | | |
| /join-group | | |
| /group-trip | | |
| /dupe-finder | | |
| /trip-dupe | | |
| /made-for-you | | |
| /travel-persona | | |
| /trip-chemistry | | |
| /travel-twin | | |
| /memory-lane | | |
| /dream-vault | | |
| /alter-ego | | |
| /trip-receipt | | |
| /trip-wrapped | | |
| /trip-collections | | |
| /trip-trading | | |
| /main-character | x | Trip copy |
| /local-lens | | |
| /arrival-mode | | |
| /airport-guide | | |
| /layover | | |
| /language-survival | | |
| /prep-detail | | |
| /budget-guardian | | |
| /visited-map | | |
| /people-met | | |
| /honest-reviews | | |
| /hype | | |
| /anti-itinerary | | |
| /roam-for-dates | x | Trip copy |
| /travel-time-machine | | |
| /share-card | | |
| /viral-cards | | |
| /paywall | | |
| /referral | | |
| /admin | | |
| /trip/[id] | | |
| (auth) welcome | x | |
| (auth) signin | x | |
| (auth) signup | x | |
| (auth) onboard | x | |
| (auth) onboarding | x | Trip copy, no shadows |
| (auth) personalization | x | No emojis |
| (auth) value-preview | x | |
| (auth) social-proof | x | Trip copy |
| (auth) splash | x | |
| (auth) hook | x | |
| travel-profile | | |
| +not-found | | |

Total: 59 screens
