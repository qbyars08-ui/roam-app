# ROAM — App Store Screenshot Specifications

## Device Frames
- iPhone 15 Pro Max (6.7") — primary
- iPhone 15 Pro (6.1") — secondary
- iPad Pro 12.9" — if submitting iPad build

## Color System
- Background: #080F0A (ROAM dark)
- Overlay text: #F5EDD8 (cream)
- Accent text: #7CAF8A (sage)
- Secondary text: cream at 70% opacity
- Headers: Cormorant Garamond Bold Italic
- Body: DM Sans

---

## Screenshot 1 — Hook / Hero
- **Screen:** Splash or Plan tab with mode selector visible
- **App state:** Fresh app, "Where are you going?" headline with Quick and Chat cards visible
- **Overlay text top:** *Plan any trip*
- **Overlay text bottom:** *in 30 seconds*
- **Text color:** Cream (#F5EDD8), Cormorant Garamond 48px italic
- **Feature:** First impression — the promise
- **Notes:** Clean, minimal. Let the dark UI breathe. Small "ROAM" wordmark top-center in sage.

## Screenshot 2 — Generate (Chat Mode)
- **Screen:** Plan tab → Chat mode active
- **App state:** User typed "Tokyo, 5 days, solo" — AI responded with trip cards (📍Tokyo, 📅5 days, 💰Mid-range) and follow-up question about budget
- **Overlay text top:** *Tell us where*
- **Overlay text bottom:** *We'll handle the rest*
- **Text color:** Cream, Cormorant Garamond 36px italic
- **Feature:** Conversational AI trip planning
- **Notes:** Show the chat bubbles and suggestion chips. The AI should feel alive.

## Screenshot 3 — Itinerary (Full Day View)
- **Screen:** Itinerary view, Day 1 expanded
- **App state:** Tokyo trip — morning activities visible: temple visit with time, restaurant with dish name and price in ¥, transit directions with line name and exit
- **Overlay text top:** *Your perfect day*
- **Overlay text bottom:** *planned to the minute*
- **Text color:** Cream, Cormorant Garamond 36px italic
- **Feature:** Core product — the day-by-day itinerary
- **Notes:** This is the money shot. Show enough detail that people zoom in.

## Screenshot 4 — Prep Tab (I Am Here Now)
- **Screen:** Prep tab with destination selected (Tokyo)
- **App state:** Showing emergency numbers (Police 110, Ambulance 119), local time, safety score (95/100), visa info, daily budget ranges in USD
- **Overlay text top:** *Everything you need*
- **Overlay text bottom:** *before you land*
- **Text color:** Cream, Cormorant Garamond 36px italic
- **Feature:** Travel intelligence — safety, visa, currency, emergency
- **Notes:** Show the "I AM HERE NOW" button prominently. This differentiates from ChatGPT.

## Screenshot 5 — People Tab
- **Screen:** People tab
- **App state:** Showing 3-4 traveler cards matched to Tokyo, same week — showing travel style badges, "Connect" buttons, compatibility indicators
- **Overlay text top:** *Find your people*
- **Overlay text bottom:** *wherever you're going*
- **Text color:** Cream, Cormorant Garamond 36px italic
- **Feature:** Social travel — find companions
- **Notes:** This is the viral feature. Make it look warm and inviting.

## Screenshot 6 — Flights Tab
- **Screen:** Flights tab
- **App state:** Showing flight deals, price calendar with color-coded days (green = cheap, red = expensive), Go Now feed with deal cards
- **Overlay text top:** *Find the deal*
- **Overlay text bottom:** *book the flight*
- **Text color:** Cream, Cormorant Garamond 36px italic
- **Feature:** Flight intelligence — deals, price trends
- **Notes:** Show the price calendar grid and at least one deal card with savings badge.

## Screenshot 7 — Pulse Tab
- **Screen:** Pulse tab
- **App state:** Showing live destination intel — weather, events happening now, crowd levels, trending destinations with ROAM scores
- **Overlay text top:** *What's happening*
- **Overlay text bottom:** *right now*
- **Text color:** Cream, Cormorant Garamond 36px italic
- **Feature:** Real-time travel intelligence
- **Notes:** Show the live data updating. Emphasize the "pulse" feeling.

## Screenshot 8 — Before You Land
- **Screen:** Before You Land briefing screen
- **App state:** Tokyo pre-departure brief — weather forecast, currency conversion, timezone offset, what to pack, cultural notes
- **Overlay text top:** *The brief*
- **Overlay text bottom:** *before you board*
- **Text color:** Cream, Cormorant Garamond 36px italic
- **Feature:** Pre-departure intelligence
- **Notes:** Show the dense, useful data. This proves ROAM is more than an itinerary generator.

---

## Layout Template (all screenshots)

```
┌──────────────────────┐
│    OVERLAY TEXT TOP   │  ← Cormorant Garamond Italic, cream
│     (centered)       │
│                      │
│  ┌────────────────┐  │
│  │                │  │
│  │   APP SCREEN   │  │  ← Actual screenshot in device frame
│  │   CAPTURE      │  │
│  │                │  │
│  │                │  │
│  └────────────────┘  │
│                      │
│  OVERLAY TEXT BOTTOM  │  ← Cormorant Garamond Italic, cream
│     (centered)       │
│                      │
│      roamapp.app     │  ← DM Mono 11px, sage
└──────────────────────┘
```

Background: #080F0A (matches app)
Device frame: Space Black titanium

## Production Notes
- Capture at 3x resolution for Retina
- Use Expo's screenshot capabilities or Simulator
- No status bar content visible (clean capture)
- Ensure all data shown is realistic (real restaurant names, real transit lines)
- Test all screenshots with App Store Connect preview before submission
