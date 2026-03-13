# ROAM — App Store Submission Checklist

Final checklist for App Store and TestFlight submission. Complete each item before submitting.

---

## Pre-Submission Checklist

### 1. Screenshots (6 required)
- [ ] **Screenshot 1 — Hero/Plan:** "Plan your Tokyo trip in 60 seconds" — Discover hero with search
- [ ] **Screenshot 2 — Itinerary:** Day-by-day slots, budget breakdown, map
- [ ] **Screenshot 3 — Chaos Mode:** "ROAM picks everything. Zero decisions."
- [ ] **Screenshot 4 — Dupe Finder:** "Can't afford Paris? Find the dupe"
- [ ] **Screenshot 5 — Profile/Passport:** Countries map, ROAM Rank, trips planned
- [ ] **Screenshot 6 — Share Card:** 9:16 poster, "Made with ROAM" badge

**Exact copy and specs:** See `docs/screenshots-spec.md` (per `docs/app-store-optimization.md`)

**Export size:** 1290 x 2796px (iPhone 15 Pro Max) or equivalent for other device families

---

### 2. Legal & Support Pages
- [ ] **Privacy Policy** — In-app: `app/privacy.tsx` (route: `/privacy`)
- [ ] **Terms of Service** — In-app: `app/terms.tsx` (route: `/terms`)
- [ ] **Support** — In-app: `app/support.tsx` (route: `/support`)

**App Store URLs (host these on web for App Store Connect):**
- Privacy: `https://roamtravel.app/privacy`
- Terms: `https://roamtravel.app/terms`
- Support: `https://roamtravel.app/support`

---

### 3. TestFlight Build
- [ ] Follow `docs/testflight-build.md`
- [ ] `eas build --platform ios --profile production`
- [ ] `eas submit --platform ios --latest` (or `--auto-submit`)
- [ ] Build processing complete in App Store Connect
- [ ] Testers added and invited

---

### 4. Age Rating Justification
**Rating: 4+**

**Justification (travel app):**
ROAM is a travel planning app with no objectionable content. It contains:
- No violence, sexual content, profanity, or mature themes
- No user-generated content in v1.0
- No web browsing (AI chat is a closed system)
- No gambling or contests
- No alcohol, tobacco, or drug references
- Emergency SOS is a safety tool, not mature content

**Questionnaire answers:** All "None" for violence, sexual content, profanity, drug use, gambling, horror, medical info, mature themes. Unrestricted Web Access: No.

---

### 5. App Store Connect Fields
- [ ] App Name: ROAM - AI Travel Planner (24/30 chars)
- [ ] Subtitle: Plan trips in 60 seconds (per ASO)
- [ ] Primary Category: Travel
- [ ] Secondary Category: Lifestyle
- [ ] Support URL: https://roamtravel.app/support
- [ ] Privacy Policy URL: https://roamtravel.app/privacy
- [ ] Copyright: 2026 ROAM Travel Inc.
- [ ] Bundle ID: com.roam.app
- [ ] Keywords: See `docs/app-store-optimization.md`

---

### 6. App Review Notes
Copy from `docs/appstore-submission.md` Section 12 into App Store Connect "App Review Information":

```
ROAM is an AI-powered travel planning app. To test:
1. Create account with any email
2. Tap Plan tab → Select destination (e.g. Tokyo)
3. Choose budget tier and at least one vibe
4. Tap "Generate Trip" for full AI itinerary

Free accounts get 1 trip/month. No demo account needed.
```

---

### 7. In-App Purchase Setup (RevenueCat)
- [ ] Monthly Pro product configured
- [ ] Annual Pro product configured
- [ ] Subscription group: ROAM Pro
- [ ] Descriptions per `docs/app-store-optimization.md`

---

## Submission Day
1. [ ] All 6 screenshots uploaded for each device size
2. [ ] All metadata complete in App Store Connect
3. [ ] Build selected and submitted for review
4. [ ] App Review notes entered
5. [ ] Age rating questionnaire completed (4+)
6. [ ] Export compliance: ITSAppUsesNonExemptEncryption = false (in app.json)

---

## References
| Document | Purpose |
|----------|---------|
| `docs/app-store-optimization.md` | Screenshot copy, keywords, ASO |
| `docs/screenshots-spec.md` | Exact copy + capture instructions |
| `docs/testflight-build.md` | EAS build + submit steps |
| `docs/appstore-submission.md` | Full copy (description, privacy, support, review notes) |
