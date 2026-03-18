# SPRINT 4 — Website + App Ecosystem

## THE INSIGHT
ROAM isn't one product. It's two products that share a brain.
The website is where you PLAN. The app is what you CARRY.
They feed each other through Supabase real-time sync.

---

## PHASE 1 — Website Planning Studio (roamapp.app)

### 1. Command-K Live Intel Search
Keyboard shortcut (Cmd+K / Ctrl+K) opens a full-width search bar.
Powered by Perplexity Sonar. Type anything:
- "best ramen in Shinjuku" → live answer with sources
- "visa requirements Japan US passport" → instant answer
- "flights JFK to NRT March" → price intel
Works from ANY screen. Never leave ROAM.
Build: `components/web/CommandKSearch.tsx`
- Modal overlay, auto-focus input
- Sonar query on debounced input (300ms)
- Results render as cards with citations
- Esc to close, Enter to search
- Only renders on web (Platform.OS === 'web')

### 2. Side-by-Side Destination Compare
Two destination pages rendered in split-screen.
Compare: weather, cost, safety, visa, flights, vibe.
Build: `app/compare.tsx`
- Two-column layout (50/50)
- Each column loads a full destination data set
- Highlighted differences (cheaper/safer/warmer)
- "Pick this one → Plan" CTA on each side
- Only makes sense on desktop-width screens

### 3. Trip Builder Timeline
Horizontal drag-and-drop timeline of your itinerary.
Each day is a column. Activities are cards you can drag between days.
Build: `app/trip-builder.tsx`
- Uses react-beautiful-dnd or similar
- Each day column shows weather + total cost
- Drag activities between days
- Add/remove activities inline
- Auto-saves to Supabase on every change
- Web only — needs mouse precision

### 4. Printable Trip PDF
One-click export: full itinerary + visa docs + emergency numbers + hotel addresses in local script.
Dark-only UI, high contrast, designed to be printed.
Build: `lib/trip-pdf.ts` + `app/print-trip.tsx`
- Uses @react-pdf/renderer or html2canvas
- Sections: itinerary by day, hotel info, emergency numbers, visa requirements, useful phrases
- Formatted for A4/Letter
- "Print this before you leave WiFi" CTA on Prep tab

### 5. Vibe Check Audio Preview
Hover over any itinerary day on web → hear a 10-second ElevenLabs audio preview.
"Day 3 in Shimokitazawa. Vinyl shops close at 8. The ramen spots stay open until 2AM."
Build: extend `lib/elevenlabs.ts`
- Generate 10s clips per day via voice-proxy
- Cache in Supabase storage
- Web: play on hover (mouseenter/mouseleave)
- Mobile: play on long-press

---

## PHASE 2 — App Companion Features (iOS)

### 6. Daily Brief Smart Notification
Every morning at 8AM local time, push notification with:
- Weather + what to wear
- Today's top 3 itinerary items
- One surprise from Sonar ("Cherry blossoms peak today in Ueno Park")
Build: extend `lib/notifications.ts`
- Already partially built — verify it works end to end
- Add ElevenLabs audio option (play brief as voice)
- Schedule via expo-notifications repeating trigger

### 7. Environmental UI Shifts
The app's entire color temperature shifts based on real conditions:
- Golden hour at destination → warm 5% overlay on all screens
- Raining → cool 3% blue overlay
- Night (10PM-6AM) → deeper blacks, dimmer accents
Build: `lib/environmental-ui.ts` + context provider
- Reads from OpenWeather current conditions
- Applies subtle tint via React context
- Wraps root layout
- Toggle in settings

### 8. Walking Audio Guide
As user walks between venues, Claude generates real-time narration:
"You're passing through Yanaka. This is old Tokyo — wooden houses, temple cats, no tourists."
Mapbox tracks location → Claude generates script → ElevenLabs narrates.
Build: extend existing narration system
- Needs: location permissions, Mapbox directions, Claude proxy, ElevenLabs
- Trigger: user taps "Guide me" on itinerary venue
- Background audio via expo-av

### 9. Moment Capture Enhancement
Current: text note saved to trip_moments.
Enhanced:
- Photo attachment (expo-image-picker)
- Auto-tag with current venue from itinerary
- Auto-tag with weather conditions
- Auto-tag with neighborhood from Mapbox reverse geocode
- These feed into Trip Wrapped and Trip Journal automatically
Build: extend `app/i-am-here-now.tsx` moment capture

### 10. Offline Everything Pack
One-tap download before leaving WiFi:
- Full itinerary as JSON
- All venue photos (cached)
- Emergency numbers
- Survival phrases with audio files
- Map tiles for destination area
Build: `lib/offline-pack.ts`
- Download progress indicator
- Storage size estimate before download
- Works with airplane mode after download

---

## PHASE 3 — Sync Layer

### 11. Real-time Trip Sync
Website and app always in sync via Supabase realtime:
- Edit itinerary on website → app updates within seconds
- Capture moment on app → website journal updates
- Split expense on app → website budget tracker reflects
Build: Supabase realtime subscriptions in store
- `supabase.channel('trips').on('postgres_changes', ...)`
- Optimistic updates + conflict resolution
- "Last synced" indicator on both platforms

### 12. Trip Share Links
Share your trip as a live-updating web page:
- roamapp.app/trip/[id] — public read-only view
- Shows itinerary, map, photos, moments
- Updates in real time during the trip
- Friends/family can follow along
Build: `app/shared-trip/[id].tsx` (public, no auth required)

---

## BUILD ORDER
1. Command-K Search (highest impact, web-only, 1 component)
2. Printable Trip PDF (practical, solves real problem)
3. Daily Brief notifications (verify existing, add audio)
4. Environmental UI shifts (subtle but magical)
5. Moment capture enhancement (photo + auto-tags)
6. Offline pack (critical for travelers)
7. Side-by-side compare (web showcase)
8. Trip builder timeline (web showcase)
9. Walking audio guide (flagship mobile feature)
10. Real-time sync (infrastructure)
11. Trip share links (growth)
12. Vibe check audio (polish)

---

## THE TEST
Quinn opens roamapp.app on his laptop.
Cmd+K → "Tokyo vs Seoul for cherry blossoms"
Sonar answers instantly. He clicks "Compare."
Side by side: weather, cost, flights, safety.
Tokyo wins. He clicks "Plan this."
CRAFT mode. 5 days. Solo. Budget.
Trip generates. He drags Day 3 afternoon
from Akihabara to Shimokitazawa.
He clicks "Print trip pack."
PDF downloads. Hotel in Japanese. Emergency 110.

His phone buzzes at 8AM Tokyo time.
"Good morning. 17°C, light rain.
Pack a light jacket. Cherry blossoms peak today."
He opens the app. Golden hour overlay.
Taps "Guide me" on the afternoon venue.
Claude narrates his walk through Yanaka.
He takes a photo. Auto-tagged: Yanaka Cemetery, 15°C, overcast.

His dad opens roamapp.app/trip/xyz back home.
Sees the photo. Sees the map. Sees "Day 3 — Yanaka."
Thinks: "He's having a great time."

That's the product.
