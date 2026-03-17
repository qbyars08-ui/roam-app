# ROAM MASTER PROMPT — The Only Travel App That Matters

## What ROAM Is

ROAM is not a travel app. It's a travel intelligence platform.

Every other travel app does ONE thing:
- Google Flights: searches flights
- TripAdvisor: shows reviews
- Google Maps: gives directions
- Booking.com: books hotels
- Lonely Planet: publishes guides

ROAM does ALL of them. In one place. Powered by AI that knows you.

The user never opens 14 tabs. They open one app. ROAM knows where they're going, when, what they like, what they can afford, and what's happening there RIGHT NOW. It generates a complete, personalized, living trip plan in 30 seconds. Then it stays with you — before, during, and after.

No other app does this. Not Wanderlog. Not TripIt. Not Kayak. Not Google Travel.

## The Revenue Model

Free: 1 trip/month. Enough to fall in love.
Pro ($6.99/month): Unlimited trips. That's it.

The conversion moment: User generates Trip 1 for free. It's incredible. Specific neighborhoods, real restaurants, actual prices, weather for their dates, visa info, emergency numbers, audio pronunciation of local phrases. They think: "I need this for every trip." They tap "Plan a new trip." Paywall. They pay.

## What Must Work Perfectly (Revenue-Critical)

### 1. Trip Generation (the product)
User says "Tokyo, 5 days, $2000, foodie + culture"
ROAM returns in 30 seconds:
- 5 days of specific activities (not "visit a temple" — "Senso-ji at 6AM before crowds, enter from the back gate on Nishi-Sandō")
- Real restaurants with photos, ratings, price range, Google Maps link
- Real costs that add up to their budget
- Weather for their actual dates
- Neighborhood flow that makes geographic sense
- One surprise per day they wouldn't have found on Google
- Transit between activities (walk 12 min, take Yamanote Line 2 stops)

This is the product. If this isn't incredible, nothing else matters.

### 2. Paywall Flow (the money)
- Trip 1: free, no friction
- Trip 2: paywall appears, RevenueCat processes payment
- After payment: immediate unlock, no refresh needed
- Monthly reset: free counter resets on the 1st
- Edge cases: guest users, expired sessions, failed payments

### 3. CRAFT Mode (the differentiator)
The conversational trip planner. No other app has this.
User talks to ROAM like a friend:
"I want Tokyo but I hate crowds"
"Add a day trip somewhere"
"My wife is vegetarian"
"What about Osaka instead?"

ROAM remembers everything. Updates the itinerary in real-time. Builds a travel profile over sessions. Next trip: "Last time you mentioned business class for flights over 8 hours. Should I factor that in?"

### 4. I Am Here Now (the 2AM feature)
You're in a foreign city. It's late. You need help.
Open ROAM. It knows where you are, what time it is, what the weather is, what your itinerary says, and what's open nearby.
"Still going. It's 1:47 AM in Shibuya. Rain starting. 24-hour ramen at Fuunji, 4 min walk."
Two buttons: "Show driver my hotel" (black screen, hotel name in Japanese, works offline) and "Emergency" (police/ambulance/fire, tap to call, works offline).

### 5. Share → Download → Generate Loop (the growth)
Trip Wrapped: 5 beautiful slides summarizing your trip. Share to Instagram Stories. Friend sees it. Taps link. Downloads ROAM. Generates their own trip in 30 seconds. Watermark: "roamapp.app"

## Execution Plan

### Phase 1: Revenue-Critical (NOW)
- [ ] Verify paywall flow end-to-end (free → block → pay → unlock)
- [ ] Make CRAFT mode the default trip creation experience
- [ ] Ensure every generated itinerary has real venue photos + ratings
- [ ] Fix: venue enrichment runs automatically after generation
- [ ] Fix: Sonar timeout/fallback (no infinite skeletons)
- [ ] Test on mobile Safari (iOS) — this is where real users are

### Phase 2: Mobile-Ready
- [ ] EAS Build → TestFlight
- [ ] Push notifications (daily brief, trip wrapped)
- [ ] Offline support for itinerary + emergency info
- [ ] Deep links (roamapp.app/trip/[id] opens app)

### Phase 3: Viral Mechanics
- [ ] Trip Wrapped share generates 9:16 image with watermark
- [ ] Share link → app store → generate flow
- [ ] "X ROAMers planning Tokyo this month" (real Supabase count)
- [ ] Referral: "Give a friend 3 free trips" (RevenueCat promo)

### Phase 4: The Moat
- [ ] Travel profiles that learn over trips (preferences, budget patterns, travel style)
- [ ] Group trips (split costs, vote on activities, shared itinerary)
- [ ] Affiliate revenue (GetYourGuide bookings, hotel referrals)
- [ ] B2B: white-label for travel agencies

## Design Principles
- Dark. Confident. Minimal. Not playful — sophisticated.
- Every pixel earns its place. If it doesn't help someone plan, go, or remember: cut it.
- Real data always. Never fake. Never placeholder. If an API fails, show nothing rather than fake.
- Specific beats generic. "Senso-ji at 6AM" not "Visit temples."
- Honest copy. No "vibrant" "bustling" "hidden gem" "must-see."

## The Test
Quinn's dad opens ROAM for the first time.
In 30 seconds he has a complete Tokyo trip.
Every restaurant has a real photo.
Every activity has a real rating.
Every day has real weather.
The itinerary makes geographic sense.
He shows his wife. She says "Book it."
He taps "Plan a new trip" for Osaka.
Paywall. He pays $6.99 without thinking.
That's the product.
