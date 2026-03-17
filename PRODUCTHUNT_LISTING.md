# ROAM — ProductHunt Launch Listing

## Name
ROAM — AI Travel Planner

## Tagline (60 chars max)
Plan any trip in 30 seconds, like a local

## Description (260 chars for PH)
ROAM builds complete day-by-day travel itineraries in 30 seconds using AI that thinks like a local, not a tourist. Specific neighborhoods. Real restaurants. Exact transit directions. Find travelers going where you're going.

## Topics (5)
1. Travel
2. Artificial Intelligence
3. Productivity
4. iOS
5. Social

## Links
- Website: https://roamapp.app
- Twitter: @YoungBullis

## Maker Comment (First Comment)

Hey PH — I'm Quinn, 17, built ROAM after spending 3 weeks trying to plan my first solo trip to Tokyo. Every travel blog said the same tourist spots. No one told me which ramen shop to go to before 11AM or I'd wait 45 minutes.

So I built ROAM. You tell it where you want to go, how long, your budget and vibe. It builds a complete day-by-day itinerary in about 30 seconds — specific neighborhoods, real restaurants with what to order, exact transit directions in local currency.

It also has a People tab where you can find other travelers going to the same destination the same week. Because solo travel is better when you're not actually alone.

Built on Expo + Supabase + Claude API. roamapp.app — completely free to try.

Would love brutal honest feedback.

## Gallery Images (5 required)

### Image 1 — Generate Screen
- **Screen:** Plan tab → Chat mode active
- **State:** User has typed "Tokyo, 5 days" — AI has responded with trip cards (destination, duration, budget pills) and a follow-up question
- **Why:** Shows the conversational AI experience — the hook

### Image 2 — Streaming Itinerary
- **Screen:** Plan tab → Trip generating
- **State:** TripGeneratingLoader visible — compass animation spinning, "Building your perfect trip..." status text, destination name shown
- **Why:** Shows the magic moment — AI building the trip in real time

### Image 3 — Full Day-by-Day Itinerary
- **Screen:** Itinerary view for Tokyo
- **State:** Day 1 expanded — showing morning/afternoon/evening slots with specific activities, restaurant names, transit directions with costs in JPY, neighborhood labels
- **Why:** The core product — this is what makes people say "wait, it actually did that?"

### Image 4 — Prep Tab
- **Screen:** Prep tab with Tokyo selected
- **State:** Showing "I AM HERE NOW" emergency section, live timezone (local time), safety score, visa info, daily budget ranges, currency conversion
- **Why:** Shows depth — ROAM isn't just an itinerary, it's a travel companion

### Image 5 — People Tab
- **Screen:** People tab
- **State:** Showing travelers matched to the same destination + date range, with travel style badges and "Connect" buttons
- **Why:** The social differentiator — find your travel crew

## Launch Checklist

- [ ] Schedule launch for 12:01 AM PT (best time)
- [ ] Post maker comment immediately after launch
- [ ] Share PH link on Twitter within 5 minutes
- [ ] Post in Discord communities (see DISCORD_OUTREACH.md)
- [ ] Reply to every comment within 30 minutes
- [ ] Share on LinkedIn with personal story
- [ ] DM 10 builder friends to check it out
- [ ] Post Instagram Story with share card
- [ ] Monitor analytics in PostHog all day

## Response Templates

### For "How did you build this?"
"Expo + React Native for the app, Supabase for auth/DB/edge functions, Claude API (Sonnet) for trip generation. The entire prompt engineering took longer than the code — getting AI to think like a local instead of a guidebook was the hard part. Happy to share the architecture if you're curious."

### For "How is this different from ChatGPT?"
"ChatGPT gives you a list. ROAM gives you a plan. Specific neighborhoods, not just city names. Actual restaurant names with what to order. Transit directions with the exact line, exit number, and cost in local currency. Plus the People tab to find travelers going to the same place."

### For "What's your business model?"
"Free tier: 1 trip per month. Pro: unlimited trips via subscription. The goal is to make it so useful on the free tier that you want more. No ads, no sponsored recommendations."

### For negative feedback
"Appreciate the honesty — that's exactly why I posted here. [Address specific point]. Going to fix that today. What would make it work for you?"
