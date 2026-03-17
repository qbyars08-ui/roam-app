# SPRINT 3 PROMPT — ROAM Becomes a Platform

Read MASTER_PROMPT.md and NEXT_SESSION_PROMPT.md first.

## Context
Sprints 1-2 complete:
- Core app works end-to-end (generate, CRAFT, all tabs, all APIs)
- Dream Boards let users save future trips
- Money section tracks savings goals with real cost intelligence
- Onboarding captures intent in 10 seconds
- Referral system built
- Share mechanics on everything
- Push notifications scheduled
- Offline itinerary works
- Every card is tappable, every screen is reachable

## This Sprint: ROAM Becomes Indispensable

The goal: make ROAM the app people open every day, not just when planning a trip.
Daily active users. Not monthly. Daily.

---

## BLOCK 1: The Daily Pulse (why you open ROAM every morning)

Rebuild the Pulse tab as a personalized daily feed.

Not "here are some destinations." Instead:
"Here's what's happening in the places you care about."

For each dream destination + planned trip:
- Flight price change: "Tokyo flights dropped $120 since Tuesday"
- Weather shift: "Bali monsoon season starting next week"
- Event alert: "Cherry blossom peak forecast: March 28-April 5"
- Safety update: "New travel advisory for [country]"
- Savings milestone: "You're 60% to your Tokyo fund"
- Countdown: "23 days until Barcelona"

Each card: tappable, links to actionable next step.
This is the reason to open ROAM daily.

Powered by: Sonar (events, advisories), OpenWeather (forecasts),
flight intelligence (price tracking), savings store (milestones).

Cache per user per day. New content every morning.

## BLOCK 2: Smart Notifications (the hook)

Not spam. Intelligence.

Flight price drop:
"Tokyo flights just dropped to $589. That's $200 less than last week."
→ Tap opens flights tab with that route

Weather warning:
"Rain forecast for your first 3 days in Bali. Want indoor alternatives?"
→ Tap opens itinerary with rain-adapted suggestions

Savings milestone:
"You just hit 75% of your Tokyo fund. Book flights now?"
→ Tap opens flights search

Pre-trip countdown:
Day 7: "One week. Here's what to pack for Tokyo weather."
Day 3: "Check in for your flight online today."
Day 1: "Tomorrow. Download offline maps. Screenshot hotel address."

Post-trip:
Day 7: "Your Tokyo trip is ready to relive."
Day 30: "Where next? Your Dream Board has 3 destinations waiting."

All through expo-notifications local scheduling.
Build lib/smart-notifications.ts with functions for each type.

## BLOCK 3: Group Trips (the multiplier)

Every group trip = 2-6 new users.

Build lib/group-trips.ts:
- createGroup(tripId, name) → generates invite code
- joinGroup(inviteCode) → adds user to group
- getGroupMembers(groupId) → list with profiles
- Group chat (simple — store messages in Supabase)

Build app/group/[id].tsx:
- Shared itinerary view
- Vote on activities (thumb up/down per activity)
- Split costs calculator
- Group chat
- "Invite friends" share button with invite code

Wire into People tab:
- "Start a group trip" button
- List of active groups
- Each group: destination, member avatars, departure countdown

This is the viral mechanic that actually works.
Every invited friend downloads ROAM to see the itinerary.

## BLOCK 4: Travel Wallet (the daily utility)

Make the Money section something people use every day, not just for saving.

Add to app/money.tsx:
- "Trip spending" section — track expenses during a trip
- Quick add: amount + category (food, transport, activity, shopping, other)
- Daily total, running total, budget remaining
- Category breakdown pie chart (simple, SVG-based)
- Currency converter (live rates from lib/exchange-rates.ts)
- "You've spent $X of $Y budget" progress bar
- Photo receipt capture (camera → save to trip_expenses table)

Supabase migration:
```sql
CREATE TABLE trip_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  trip_id uuid references trips,
  amount numeric not null,
  currency text default 'USD',
  category text not null,
  note text,
  receipt_url text,
  spent_at date default current_date,
  created_at timestamptz default now()
);
```

This makes ROAM useful DURING the trip, not just before.

## BLOCK 5: Destination Intelligence Network

Turn every user's data into intelligence for every other user.

After a trip, ask: "How accurate was ROAM's cost estimate?"
Store: actual vs estimated for each category.
Use aggregated data to improve cost estimates for future users.

Show on destination pages:
"Based on 47 ROAMers who visited Tokyo:"
- Average daily spend: $182
- Most visited neighborhood: Shibuya
- Top-rated restaurant: Ichiran Ramen
- Most common surprise: "Everything is walkable"
- Pro tip most agreed with: "Get a Suica card immediately"

This is the moat. The more users, the better the data.
No competitor can replicate this without the user base.

## BLOCK 6: B2B API (the revenue multiplier)

Build a simple API that travel agencies can use:
- POST /api/generate-itinerary — same as CRAFT but returns JSON
- Priced per call: $0.50 per itinerary
- API key management in Supabase
- Rate limiting per key
- Usage dashboard

This is future revenue but the foundation is easy:
- Edge function that accepts API key instead of JWT
- Same Claude proxy underneath
- Response format: structured JSON (not markdown)

Build: supabase/functions/api-generate/index.ts

## BLOCK 7: Content Engine (organic growth)

Auto-generate SEO content from user trips:
- "Best restaurants in Tokyo according to ROAM travelers"
- "How much does Tokyo actually cost? Real data from 47 trips"
- "Tokyo in March: what to expect"

Build scripts/generate-content.ts:
- Queries aggregated trip data from Supabase
- Generates static HTML pages via Sonar + real data
- Deploys to roamapp.app/guide/[city]/[topic]

These rank on Google. Free traffic forever.
Each page has CTA: "Plan your own [city] trip → roamapp.app"

## BLOCK 8: Premium Features (upsell)

Pro subscribers get:
- Unlimited trips (already built)
- Audio trip narration (ElevenLabs, already built)
- Offline maps (Mapbox, download for offline)
- Priority Sonar queries (no rate limit)
- Group trips (host unlimited groups)
- Travel Wallet (expense tracking)
- Custom trip themes ("romantic Paris" vs "budget Paris")
- Early access to new destinations

Free tier stays generous enough to convert:
1 trip/month, basic Pulse feed, Dream Board (3 max), no audio.

## Success Metrics

| Metric | Sprint 2 Target | Sprint 3 Target |
|--------|-----------------|-----------------|
| DAU | 200 | 2,000 |
| Trips generated | 5,000 | 50,000 |
| Paying users | 50 | 500 |
| MRR | $350 | $3,500 |
| Group trips | 0 | 200 |
| Referral rate | 5% | 15% |
| D7 retention | 30% | 50% |

## Priority Order
1. Daily Pulse rebuild (daily engagement)
2. Smart notifications (retention hook)
3. Group trips (viral multiplier)
4. Travel Wallet (daily utility during trips)
5. Destination Intelligence Network (moat)
6. Premium feature gates (revenue)
7. Content engine (organic growth)
8. B2B API (future revenue)
