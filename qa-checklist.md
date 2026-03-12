# ROAM QA Checklist

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Discover | working | Destinations, categories, navigation |
| Spin (Globe) | working | Spin → reveal → Build trip; real AI or mock fallback |
| Plan (Build my trip) | working | Wizard + natural language ("5 days Tokyo $800"); real AI or mock |
| Chat (Ask) | working | Real Claude via edge fn or direct API fallback; mock on error |
| Saved / Trips | working | List, delete, Hype, Plan CTA |
| Passport | working | Stamps, badges, share |
| Pets | working | Add pet, sitter links, destinations |
| Profile | working | Menu, Skip Login in dev |
| Paywall | partial | UI; purchase needs RevenueCat |
| Alter-Ego | working | Quiz, result, share |
| Trip Dupe | working | Real AI or mock fallback |
| Referral | working | Code, copy, share |
| Itinerary | working | Layout, map fallback, affiliate links |
| Hype | working | Countdown, share |
| Flights | working | AviationStack; needs EXPO_PUBLIC_AVIATIONSTACK_KEY |
| Welcome / Signin | working | Skip Login (dev) uses direct API fallback |
| Responsive layout | working | 430px phone frame on desktop |

## Dependencies

- **Claude**: Fallback mock when claude-proxy fails
- **AviationStack**: Flights tab — add `EXPO_PUBLIC_AVIATIONSTACK_KEY` to `.env` (free key at aviationstack.com)
- **Supabase**: Auth, sharing (optional in demo)
