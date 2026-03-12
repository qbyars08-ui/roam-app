# ROAM Push Notification System — Post-Launch Spec

## Overview
Push notifications drive re-engagement, trip readiness, and social connection. All notifications are opt-in and respect user preferences.

---

## 1. Flight Price Drops
**Trigger:** Saved destination has flight price drop (e.g. >10% below previous low)  
**Message:** "Flights to Tokyo just dropped 15%. Your dream trip might be closer than you think."  
**Action:** Deep link to Flights tab or destination  
**Frequency:** Max 1 per destination per week

---

## 2. Trip Countdown
**Trigger:** 3 days / 1 day / day-of before trip start  
**Message:** "Your Tokyo trip is in 3 days. Here's what to do today."  
**Action:** Deep link to itinerary  
**Frequency:** 3 days, 1 day, day-of (configurable)

---

## 3. Weather Alerts
**Trigger:** Significant weather change for active trip (rain, storm, heat)  
**Message:** "Rain forecast Day 3 of your Bali trip. ROAM adjusted your itinerary."  
**Action:** Deep link to itinerary  
**Frequency:** Max 1 per trip per 24h

---

## 4. Social: Meetup Request
**Trigger:** Another ROAM user requests to meet (Breakfast Club, Squad Match)  
**Message:** "Marcus wants to meet up in Lisbon — breakfast tomorrow?"  
**Action:** Deep link to chat / meetup request  
**Frequency:** Per request

---

## 5. Streak / Explorer Status
**Trigger:** User hasn't planned in 7 days, has explorer+ rank  
**Message:** "Plan something today — keep your Explorer status."  
**Action:** Deep link to Plan tab  
**Frequency:** Max 1 per week

---

## 6. Re-engagement
**Trigger:** No app open in 14 days  
**Message:** "You haven't planned anything in 2 weeks. Where next?"  
**Action:** Deep link to Discover  
**Frequency:** Max 2 per month

---

## 7. Seasonal Alerts
**Trigger:** Saved destination hits seasonal peak (cherry blossom, fall colors)  
**Message:** "Cherry blossom season in Kyoto starts next week. Ready to go?"  
**Action:** Deep link to destination / Plan  
**Frequency:** Max 1 per destination per season

---

## 8. Safety Circle
**Trigger:** Circle member missed check-in  
**Message:** "[Name] missed their check-in. Tap to see details."  
**Action:** Deep link to Safety Circle / check-in  
**Frequency:** Per event

---

## Technical Notes
- Use Expo Notifications
- Store preferences in `profiles` or `notification_preferences` table
- Batch similar notifications (e.g. multiple price drops → single digest)
- A/B test copy and timing
- Local timezone for trip countdowns
