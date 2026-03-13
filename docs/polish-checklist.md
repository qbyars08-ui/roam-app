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
| /chaos-dare | x | Trip copy |
| /create-group | x | |
| /join-group | x | Contraction, haptics |
| /group-trip | x | Trip copy, em dash, haptics |
| /dupe-finder | x | Back button, sentence case, haptics |
| /trip-dupe | x | Emojis → Lucide, share copy |
| /made-for-you | x | Back button → Lucide |
| /travel-persona | x | Back/refresh → Lucide |
| /trip-chemistry | x | Sentence case |
| /travel-twin | x | Sentence case, contractions |
| /memory-lane | x | Haptics import, sentence case |
| /dream-vault | x | Back button, trip copy |
| /alter-ego | x | Emojis → Lucide, sentence case |
| /trip-receipt | x | Back button → Lucide |
| /trip-wrapped | x | Back button, contractions |
| /trip-collections | x | Back button → Lucide |
| /trip-trading | x | Back button → Lucide |
| /main-character | x | Trip copy |
| /local-lens | x | |
| /arrival-mode | x | |
| /airport-guide | x | Back button → Lucide |
| /layover | x | Back button → Lucide |
| /language-survival | x | Flag/category emojis removed |
| /prep-detail | x | Haptics |
| /budget-guardian | x | Sentence case, haptics |
| /visited-map | x | Haptics |
| /people-met | x | Back button → Lucide |
| /honest-reviews | x | Sentence case, haptics |
| /hype | x | Emojis → Lucide, sentence case |
| /anti-itinerary | x | |
| /roam-for-dates | x | Trip copy |
| /travel-time-machine | x | Haptics |
| /share-card | x | Haptics |
| /viral-cards | x | Haptics |
| /paywall | x | Haptics |
| /referral | x | Haptics |
| /admin | x | |
| /trip/[id] | x | Trip copy, haptics |
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
| travel-profile | x | |
| +not-found | x | |

Total: 59 screens
