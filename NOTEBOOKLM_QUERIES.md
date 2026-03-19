# NotebookLM Queries for ROAM

Quinn: paste each QUESTION into NotebookLM and paste the answer back here.

---

## QUERY 1 — Revenue: Make Money Fast and Legally

QUESTION: ROAM is a React Native travel app with these monetization layers:
- Free tier: 1 trip lifetime
- Pro: $7.99/month (unlimited CRAFT AI planning, group trips, PDF export, budget tracker, audio guides)
- Affiliate links: Skyscanner flights, Hostelworld, Booking.com, GetYourGuide activities

What are the 5 fastest LEGAL ways to generate revenue in the first 30 days with under 1000 users? Give me exact dollar projections, expected conversion rates, and what to prioritize first. Which travel affiliate programs pay the most per click or booking? What's the legal minimum we need (privacy policy, terms of service, refund policy) to start charging on the App Store?

EXPECTED OUTPUT: Prioritized revenue playbook with real numbers.

---

## QUERY 2 — Reliability: No-Fail Architecture

QUESTION: ROAM uses 10+ external APIs (Perplexity Sonar, Google Places, Foursquare, OpenWeather, Mapbox, ElevenLabs, Rome2Rio, TripAdvisor, Sherpa, Eventbrite). What is the best architecture pattern to ensure the app NEVER shows a blank screen or error to users, even when 3+ APIs fail simultaneously? What should the fallback chain look like? How do production travel apps like Google Travel, TripIt, and Hopper handle multi-API resilience?

EXPECTED OUTPUT: Specific fallback chain architecture with patterns.

---

## QUERY 3 — First 5 Seconds: What Converts

QUESTION: A user opens ROAM for the first time. They've never heard of it. What should they see in the first 5 seconds that makes them stay? What's the single most effective onboarding pattern for subscription travel apps? Should we show the AI planning immediately or build anticipation? What do Wanderlog, TripIt, and Hopper do for first impressions?

EXPECTED OUTPUT: Exact first-screen spec with competitive analysis.

---

## QUERY 4 — App Store Description (Ready to Paste)

QUESTION: Write ROAM's App Store description optimized for conversion. The killer feature is CRAFT mode — you plan a trip by having a conversation with AI that generates a personalized day-by-day itinerary with real restaurant names, real prices, real tips in 30 seconds. 4000 chars max. Keywords: AI travel planner, trip planner, travel itinerary, solo travel, group trip planning, budget travel, travel companion.

EXPECTED OUTPUT: Title, subtitle, promotional text (170 chars), full description.

---

## QUERY 5 — Legal Checklist for Charging Users

QUESTION: What does a React Native travel app need legally before charging users via App Store subscriptions? Cover: privacy policy (GDPR, CCPA, App Store rules), terms of service, refund policy, data handling for user locations/preferences/trip data, third-party API attribution requirements (Google Places requires "Powered by Google", TripAdvisor has logo rules, Foursquare requires attribution). What are the exact risks and how to mitigate each?

EXPECTED OUTPUT: Checklist with specific requirements per API and platform.

---

## QUERY 6 — Growth: 0 to 2000 Users, $0 Ads

QUESTION: How can a travel app grow from 0 to 2000 users in 60 days with $0 ad spend? Be SPECIFIC. Not "post on social media." Exact tactics: which subreddits (r/solotravel has 4M members), which TikTok formats work for app demos, what makes a travel app tweet go viral, what's the conversion rate from a shared trip link to a new user? What referral mechanics actually work?

EXPECTED OUTPUT: 60-day growth playbook with specific channels and conversion numbers.

---

## QUERY 7 — New Tech That Changes the Game

QUESTION: What APIs or technologies could a travel app integrate in 2026 to feel genuinely futuristic — things nobody else has? Think beyond maps/weather/flights. Consider: real-time crowd density data, AR navigation, local eSIM provisioning via API, real-time speech translation, predictive destination pricing, satellite imagery previews, carbon footprint tracking, AI-generated walking tours with spatial audio. Which are available via API TODAY and which would blow users' minds?

EXPECTED OUTPUT: Ranked list with API names, availability, and user impact score 1-10.

---

## QUERY 8 — What Makes Someone Pay $7.99/month

QUESTION: ROAM's free tier gives 1 trip with the Quick Trip generator. Pro is $7.99/month. What specific feature makes someone upgrade? Not "more trips" — what's the emotional moment where they think "I NEED this"? Is it CRAFT mode (conversational planning)? Group planning? Real-time trip narration? PDF export? What do subscription apps with 5%+ free-to-paid conversion do differently?

EXPECTED OUTPUT: The single most important Pro feature with psychological reasoning.

---

## QUERY 9 — Two Users, One App

QUESTION: ROAM needs to serve two completely different users with one product:

USER A: A 13-year-old who generates a Tokyo trip to show their parents. They'll never go. They just want to dream and share. They have zero budget. They want it to feel like TikTok — fast, visual, shareable.

USER B: A 55-year-old dad planning a $20,000 family trip to Italy. Business class. Specific dietary needs. He wants to connect his airline loyalty program, track every expense, download a PDF for the hotel, and know exactly what visa requirements apply. He wants it to feel like a travel agent — thorough, trustworthy, complete.

How does one app serve both without feeling like a toy to Dad or boring to the teenager? What are the specific UI/UX patterns that accommodate both? What does the onboarding look like for each? Which features does each user NEVER see?

EXPECTED OUTPUT: Specific dual-persona design system with feature visibility rules.

---

## QUERY 10 — Making It Undetectable

QUESTION: ROAM is built by one 17-year-old with a MacBook. The goal is to make it look and feel like a team of 20 built it at a Series A startup. What are the specific design patterns, UI details, and product decisions that separate "solo dev project" from "real product"? What do users notice first that makes something feel amateur? What are the easiest wins to look professional (loading animations, error states, onboarding, typography consistency, haptic feedback, micro-interactions)?

EXPECTED OUTPUT: Top 20 "professionalism signals" ranked by user impact, with specific implementation guidance.

---

## QUERY 11 — Competitive Positioning

QUESTION: ROAM's 3 closest competitors are Wanderlog, TripIt, and Google Travel. For each:
1. What do they do better than ROAM?
2. What does ROAM do that they can't?
3. What's the one-sentence pitch that positions ROAM against each?

Also consider: Hopper (flight deals), Rome2Rio (transport), Culture Trip (editorial), Lonely Planet (guides). Where does ROAM fit in this landscape? What's the unique angle nobody else owns?

EXPECTED OUTPUT: Competitive matrix with ROAM's defensible position.

---

## ANSWERS (paste NotebookLM responses below each question)

---
---

# WAVE 2 — March 19, 2026 (Post-Sonar, Post-Life-Integration)

These queries reflect where ROAM is NOW: Perplexity Sonar live intel across all tabs, 12 new life-integration modules (travel accounts, document vault, calendar sync, cost optimizer, neighborhood intel, wardrobe advisor, photo journal, etc.), and a full web + mobile split.

---

## QUERY 12 — Retention: Day 1 → Day 30

QUESTION: ROAM now has 40+ screens and features. The risk is that users try it once, generate a trip, and never come back. What are the specific retention mechanics that travel apps use to get users to return DAILY, not just when they book a trip? Consider:
- Pre-trip: countdown timers, daily destination intel, packing list nudges
- During trip: "I Am Here Now" live mode, daily brief notifications, photo journal
- Post-trip: trip recap, sharing, next-trip suggestions
- Always-on: flight deal alerts, destination dreaming, bucket list

What's the ideal push notification strategy for a travel app? Which notifications get opened vs. cause uninstalls? What frequency is optimal? What do Hopper and Google Flights do for retention between bookings?

EXPECTED OUTPUT: Retention loop design with specific notification copy and timing.

---

## QUERY 13 — The Reservation Import Problem

QUESTION: TripIt's #1 feature is auto-importing reservations from email. ROAM doesn't have this. What are the technical approaches to building email-based reservation importing in 2026?
- Gmail API parsing (what permissions needed?)
- Email forwarding to a ROAM address (like TripIt's plans@tripit.com)
- Screenshot/photo OCR of confirmation pages
- Manual entry with smart autofill

Which approach has the best UX vs. engineering effort tradeoff? What structured data formats do airlines/hotels use (Schema.org, JSON-LD in confirmation emails)? How does TripIt actually parse 3000+ booking formats? Is there an API or service that does this?

EXPECTED OUTPUT: Technical recommendation with effort estimate and UX comparison.

---

## QUERY 14 — The $7.99 Paywall Moment

QUESTION: ROAM's paywall appears after the user's first free trip. Right now the paywall screen shows feature comparisons. But conversion psychology says the BEST time to show a paywall is at a "magic moment" — when the user just experienced value and wants MORE.

What is ROAM's magic moment? Is it:
- Right after generating their first itinerary (they're excited, want to do another)
- When they try to use CRAFT mode and hit the limit
- When they try to add a friend to a group trip
- When they try to export a PDF
- When they see a flight deal and want alerts

What paywall design converts best for subscription apps in 2026? Soft paywall vs. hard paywall? What copy on the upgrade button drives the highest conversion? What does Duolingo's paywall strategy teach us?

EXPECTED OUTPUT: Exact paywall timing + screen design spec with conversion reasoning.

---

## QUERY 15 — Web vs. Mobile Strategy

QUESTION: ROAM has both a web app (roamapp.app) and a mobile app (React Native). The web app has a sidebar, CRAFT split-screen, flight tables, and budget spreadsheets. The mobile app has floating pill nav, I Am Here Now, and haptic feedback.

What should the web app do that the mobile app DOESN'T? What's the web app's role vs. the mobile app's role? Consider:
- Web = planning (desktop, longer sessions, spreadsheets, split-screen CRAFT)
- Mobile = traveling (GPS, notifications, offline, camera, quick access)

How do Notion, Linear, and Arc split their web vs. mobile experiences? What content should be web-exclusive vs. mobile-exclusive vs. shared? Should the pricing be different for web-only vs. mobile-only users?

EXPECTED OUTPUT: Platform strategy matrix with feature assignments.

---

## QUERY 16 — Making AI Feel Like a Travel Agent, Not a Chatbot

QUESTION: ROAM's CRAFT mode lets users have a conversation with AI to plan trips. The risk: it feels like ChatGPT with a travel skin. What makes a conversational AI planning experience feel like talking to a knowledgeable travel agent instead of a generic chatbot?

Consider:
- Proactive suggestions ("Based on your budget, skip Santorini in August — try Naxos instead")
- Memory across sessions ("Last time you loved street food in Bangkok, so here's Oaxaca's food scene")
- Opinionated recommendations ("Don't stay in Taksim — Karakoy has better restaurants and is walkable")
- Travel-specific personality (confident, slightly opinionated, uses insider knowledge)
- Follow-up intelligence ("Your flight to Rome lands at 2pm — I've moved your Vatican visit to Day 2 morning")

How do luxury travel concierge services (Black Tomato, Journy, Scott's Cheap Flights) create that "someone who knows" feeling? What's the difference between a travel chatbot and a travel advisor?

EXPECTED OUTPUT: CRAFT mode personality spec with 10 example interactions.

---

## QUERY 17 — The Share Loop

QUESTION: ROAM's biggest growth potential is viral sharing — a user generates a trip, shares it, and the recipient downloads ROAM to see it. What makes a shared trip link actually get clicked and convert?

Currently ROAM has:
- Share card (visual trip summary image)
- Shared trip page (web view of full itinerary)
- Referral codes (5 invites, unlock free trips)

What's missing? Should the shared trip be a beautiful web page or a screenshot? What format works best on Instagram Stories vs. iMessage vs. WhatsApp? What do Spotify Wrapped, Duolingo streaks, and Strava achievements teach us about shareable moments in apps?

EXPECTED OUTPUT: Sharing strategy with specific formats per platform and viral coefficient targets.

---

## QUERY 18 — What Would Make This Worth $20/month?

QUESTION: ROAM Pro is $7.99/month. If we wanted to charge $19.99/month (like a premium tier), what features would justify that price? Think about what affluent travelers (User B: the 55-year-old dad) would pay $20/month for:
- Live concierge (real-time AI chat during travel)
- Automatic rebooking when flights change
- Restaurant reservation integration (OpenTable, Resy)
- Priority access to deal alerts
- Family account (5 travelers under one subscription)
- Insurance integration
- VIP airport lounge finder
- White-glove trip planning (AI + human review)

Which of these are technically feasible with existing APIs? Which have the highest willingness-to-pay? What do premium travel services charge and what's included?

EXPECTED OUTPUT: Premium tier spec with pricing justification and technical feasibility.

---

## QUERY 19 — Web App vs. Mobile App: Two Different Products

QUESTION: ROAM exists on TWO platforms right now, and they need to feel like different products that complement each other — NOT the same thing on different screens.

**ROAM Web (roamapp.app) — what exists today:**
- Sidebar navigation (not bottom tabs)
- CRAFT split-screen: conversation on left, itinerary building on right with draggable divider
- Flight comparison table with sortable columns and Skyscanner links
- Budget spreadsheet with editable cells, category chart, and CSV export
- Cmd+K search overlay for quick destination lookup
- Full-width content, optimized for desktop/laptop sessions

**ROAM Mobile (React Native) — what exists today:**
- Floating pill nav (5 tabs: Plan / Pulse / Flights / People / Prep)
- "I Am Here Now" live mode when GPS detects you're at a destination
- Haptic feedback on all interactions
- Audio guides with ElevenLabs narration
- Push notifications (daily brief, golden hour, trip countdown)
- Offline pack download for trips without WiFi
- Camera integration for photo journal
- Pronunciation button for foreign words

**The question:** What should EACH platform do that the other DOESN'T? Specifically:

1. What are the best "plan on web, travel on mobile" workflows? (Like how Figma is desktop for design, mobile for presenting)
2. Should web have features mobile doesn't? (Interactive maps? Spreadsheet views? Collaboration?)
3. Should mobile have features web doesn't? (AR? NFC? Widgets? Siri/Shortcuts?)
4. How should the handoff work? (User plans trip on laptop Saturday night, picks up phone Monday morning at airport)
5. What do Notion, Linear, Arc, Figma do for web-to-mobile continuity?
6. Should there be a "travel mode" on mobile that completely changes the UI when you're actually traveling vs. planning?
7. What about a "Planning Mode" on web that's optimized for deep 30-minute planning sessions?

Give me a specific feature matrix: Web Only | Mobile Only | Shared (synced). Include WHY each feature belongs on that platform.

EXPECTED OUTPUT: Platform-specific feature matrix with rationale, plus handoff design spec.

---

## QUERY 20 — Web App Conversion: Why Would Someone Plan Trips on a Website?

QUESTION: Most Gen Z users discover apps on TikTok/Instagram and download directly to their phone. Why would anyone use ROAM's web app at roamapp.app?

Consider these user scenarios:
1. A college student on their laptop procrastinating — googles "Tokyo trip planner" and lands on roamapp.app
2. A dad at his desk at work planning a family vacation during lunch break
3. A couple sitting on the couch with a laptop between them, planning together
4. A content creator who wants to screenshot/screen-record their trip planning process
5. Someone comparing ROAM to Google Sheets where they currently plan trips

For each scenario: What would make them stay on the web app instead of just downloading the mobile app? What web-specific features would make them think "this is better on my laptop"?

What's the conversion funnel? Web visitor → plans trip → sees "Get the mobile app for live travel features" → downloads. Is this the right flow?

What do Notion, Figma, and Canva do on web that drives mobile downloads? How do they make web feel essential for certain tasks while mobile feels essential for others?

EXPECTED OUTPUT: Web app value proposition per user scenario + web-to-mobile conversion funnel design.

