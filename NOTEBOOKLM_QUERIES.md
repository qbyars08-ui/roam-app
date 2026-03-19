# NotebookLM Queries for ROAM

Quinn: paste each QUESTION into NotebookLM and paste the answer back here.

---

## QUERY 1 — First Screen

QUESTION: What is the single best first screen to show someone who has never heard of ROAM? What do they see in the first 5 seconds? Consider: they found this via a friend's shared trip link, an App Store search for "AI travel planner", or a tweet. They have zero context. What makes them stay vs close the tab?

CONTEXT: ROAM's killer feature is CRAFT mode — a conversational AI that builds a personalized trip by asking what you like, not making you fill out forms. The first trip is free. Currently the first screen shows "Where are you going?" with rotating city names.

EXPECTED OUTPUT: A specific screen layout — what text, what visual, what CTA button, what happens on tap. Not abstract advice.

---

## QUERY 2 — App Store Description

QUESTION: Write ROAM's App Store description optimized for conversion. Lead with CRAFT mode as the differentiator. 4000 chars max. Must include these keywords naturally: AI travel planner, trip planner, travel itinerary, solo travel, personalized travel, trip organizer, vacation planner, travel companion, flight deals, travel prep.

CONTEXT: ROAM is a React Native app that: (1) builds a full personalized itinerary through conversation in 30 seconds, (2) adapts to your travel stage (dreaming/planning/traveling/returned), (3) has live Sonar intel for every destination, (4) works offline during travel with emergency numbers and hotel address display, (5) generates Trip Wrapped summaries after return. Free tier: 1 trip. Pro: unlimited CRAFT sessions at $7.99/month.

EXPECTED OUTPUT: Ready-to-paste App Store description with title, subtitle, and full description. Include promotional text (170 chars).

---

## QUERY 3 — Pricing Justification

QUESTION: What does ROAM need to add to justify $7.99/month vs $4.99/month? What is the specific feature that makes someone upgrade from free to Pro? Consider: the free tier gives you 1 trip with the full 30-second Quick Trip generator. What does Pro need to offer that the free version doesn't, that someone would actually pay for monthly?

CONTEXT: Current Pro features: unlimited CRAFT sessions, unlimited Quick Trips. Potential Pro features: priority API access (faster Sonar responses), audio daily briefs via ElevenLabs TTS, group trip planning, PDF export, advanced packing lists, budget tracking, real-time flight price alerts, ad-free experience.

EXPECTED OUTPUT: A ranked list of 5 Pro features with reasoning. Which one is the "I need this" feature that justifies the price?

---

## QUERY 4 — Competitive Analysis

QUESTION: Who are ROAM's 3 real competitors and what is ROAM's unique angle against each? For each competitor, what does ROAM do better, what does the competitor do better, and what should ROAM steal?

CONTEXT: ROAM is an AI-powered travel planner that builds personalized itineraries through conversation (CRAFT mode). It covers the full travel lifecycle: Dream (explore destinations) > Plan (build itinerary) > Go (companion during trip) > Remember (Trip Wrapped + Journal). It has live data via Perplexity Sonar, 10+ travel API integrations, offline mode, and social features.

EXPECTED OUTPUT: 3 competitors with specific feature comparisons, not generic "ROAM is better because AI."

---

## QUERY 5 — Demo Video Script

QUESTION: Write a 30-second screen recording script for ROAM's launch tweet. What screens do you show, in what order, for maximum "I need to try this" impact? The recording shows a real phone screen — no talking head, no voiceover, just the app with text overlays.

CONTEXT: The app's most impressive moment is CRAFT mode: you type "Tokyo, 5 days, food + culture, mid-range budget" and watch a full personalized itinerary build in real-time with specific restaurants, neighborhoods, walking routes, and costs. The itinerary has real Google Places photos and ratings.

EXPECTED OUTPUT: Shot-by-shot breakdown. Timestamp, what's on screen, what overlay text says. 30 seconds max.

---

## QUERY 6 — User Retention

QUESTION: After someone generates their first trip on ROAM, what brings them back tomorrow? And the day after? ROAM currently has: daily brief notifications, countdown to departure, Trip Wrapped after return, dream boards, savings goals. What's missing? What's the daily hook that makes someone open ROAM every day even when they're not actively planning a trip?

CONTEXT: Most travel apps have a "use it once, delete it" problem. You plan your trip, go on it, and never open the app again. ROAM's thesis is the Dream > Plan > Go > Remember > Dream loop. But the "Dream" stage has the weakest features right now.

EXPECTED OUTPUT: 3 specific daily-use features with reasoning. Not "social features" — specific mechanics.

---

## QUERY 7 — Light Mode Design

QUESTION: ROAM currently uses a dark-only UI (bg: #0A0A0A, accent: #5B9E6F sage green). NotebookLM flagged this as a usability problem — people use travel apps in airports and bright sunlight. What should ROAM's light mode look like? What colors preserve the brand identity while being usable in daylight?

CONTEXT: Brand colors: sage green (#5B9E6F) as primary action, gold (#C9A84C) as premium accent, coral (#E8614A) as alerts only. Fonts: Space Grotesk for headlines, Inter for body, DM Mono for data. The dark theme feels premium and intentional — the light theme must feel equally premium, not like a "default white app."

EXPECTED OUTPUT: Specific hex codes for light mode: background, surface, text, borders, cards. Plus one design rule to follow.
