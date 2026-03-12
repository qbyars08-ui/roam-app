// =============================================================================
// ROAM — Mock fallbacks when Claude/API unavailable (demo mode)
// =============================================================================

import type { Itinerary } from './types/itinerary';

const MOCK_ITINERARY_JSON = (dest: string, days: number) => `{
  "destination": "${dest}",
  "tagline": "Your AI-crafted adventure — offline demo",
  "totalBudget": "$${days * 120}",
  "days": ${JSON.stringify(
    Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      theme: ['First impressions', 'Dive deeper', 'Local secrets', 'Adventure day', 'Best of the best'][i] || 'Explore',
      morning: {
        activity: 'Morning walk through the old town',
        location: 'Historic Center',
        cost: '$0',
        tip: 'Go early to beat the crowds',
      },
      afternoon: {
        activity: 'Lunch at a local favorite',
        location: 'Central Market',
        cost: '$15',
        tip: 'Ask for the daily special',
      },
      evening: {
        activity: 'Sunset viewpoint',
        location: 'Scenic overlook',
        cost: '$5',
        tip: 'Bring a light jacket',
      },
      accommodation: {
        name: 'Boutique Hotel Central',
        type: 'hotel',
        pricePerNight: '$80',
      },
      dailyCost: `$${80 + 35}`,
    }))
  )},
  "budgetBreakdown": {
    "accommodation": "$${days * 80}",
    "food": "$${days * 40}",
    "activities": "$${days * 25}",
    "transportation": "$${days * 15}",
    "miscellaneous": "$${days * 10}"
  },
  "packingEssentials": ["Passport", "Comfortable shoes", "Adapter", "Sunscreen", "Reusable water bottle"],
  "proTip": "Book the top restaurant for lunch — same views, half the price of dinner.",
  "visaInfo": "Check current requirements for your passport at your embassy."
}`;

/** Generate mock itinerary when Claude API unavailable */
export function getMockItinerary(destination: string, days: number): Itinerary {
  const raw = MOCK_ITINERARY_JSON(destination, days);
  return JSON.parse(raw) as Itinerary;
}

/** Raw JSON string for callClaude-style response */
export function getMockItineraryRaw(destination: string, days: number): string {
  return MOCK_ITINERARY_JSON(destination, days);
}

/** Fallback chat response when API fails */
export const MOCK_CHAT_RESPONSE = `I'm having trouble reaching my servers right now, but here's my go-to advice:

**General travel tips:**
• Book flights on Tuesday/Wednesday for better prices
• Pack a universal adapter and portable charger
• Save Google Maps offline before you go
• Learn "please" and "thank you" in the local language — goes a long way
• Always have a backup plan for your first night's accommodation

Try your question again in a moment — or head to the **Plan** tab to build a full itinerary. I'll be here when you're back.`;

/** Mock dupe result for Trip Dupe when API fails */
export function getMockDupeResult(dream: string): {
  dream: string;
  dupe: string;
  dupeCountry: string;
  dupeEmoji: string;
  whyItWorks: string;
  costComparison: { dreamPerDay: string; dupePerDay: string; savings: string };
  similarVibes: string[];
  topPicks: Array<{ category: string; name: string; price: string }>;
  bestMonth: string;
} {
  const dupes: Record<string, { dupe: string; country: string; emoji: string; why: string; dreamPerDay: string; dupePerDay: string; savings: string }> = {
    Santorini: { dupe: 'Milos', country: 'Greece', emoji: '\uD83C\uDDEC\uD83C\uDDF7', why: 'Same Cycladic white villages and blue water, 65% cheaper. Fewer crowds, same Aegean magic.', dreamPerDay: '$350', dupePerDay: '$120', savings: '65%' },
    Paris: { dupe: 'Lyon', country: 'France', emoji: '\uD83C\uDDEB\uD83C\uDDF7', why: 'World-class food and culture without the crowds. Same romantic French soul.', dreamPerDay: '$280', dupePerDay: '$140', savings: '50%' },
    Tokyo: { dupe: 'Osaka', country: 'Japan', emoji: '\uD83C\uDDEF\uD83C\uDDF5', why: 'Same food obsession, lower prices, friendlier vibe. Street food heaven.', dreamPerDay: '$220', dupePerDay: '$130', savings: '40%' },
    Bali: { dupe: 'Lombok', country: 'Indonesia', emoji: '\uD83C\uDDEE\uD83C\uDDE9', why: 'Beaches and rice terraces without the tourist crush. Raw beauty.', dreamPerDay: '$150', dupePerDay: '$70', savings: '53%' },
    Maldives: { dupe: 'Zanzibar', country: 'Tanzania', emoji: '\uD83C\uDDF9\uD83C\uDDFF', why: 'Turquoise water, white sand, overwater vibes at a fraction of the cost.', dreamPerDay: '$600', dupePerDay: '$150', savings: '75%' },
    'Swiss Alps': { dupe: 'Dolomites', country: 'Italy', emoji: '\uD83C\uDDEE\uD83C\uDDF9', why: 'Epic mountains, alpine villages, half the price. Same jaw-dropping views.', dreamPerDay: '$350', dupePerDay: '$140', savings: '60%' },
    'Amalfi Coast': { dupe: 'Puglia', country: 'Italy', emoji: '\uD83C\uDDEE\uD83C\uDDF9', why: 'Coastal charm, killer food, dramatic cliffs — without the Amalfi tax.', dreamPerDay: '$320', dupePerDay: '$110', savings: '66%' },
    'Bora Bora': { dupe: 'Fiji', country: 'Fiji', emoji: '\uD83C\uDDEB\uD83C\uDDEF', why: 'Overwater bungalows and lagoons at a fraction of French Polynesia.', dreamPerDay: '$800', dupePerDay: '$250', savings: '69%' },
    Iceland: { dupe: 'Faroe Islands', country: 'Denmark', emoji: '\uD83C\uDDE9\uD83C\uDDF0', why: 'Dramatic landscapes, fewer tourists, similar Nordic magic.', dreamPerDay: '$280', dupePerDay: '$140', savings: '50%' },
  };
  const match = dupes[dream] ?? { dupe: 'Lisbon', country: 'Portugal', emoji: '\uD83C\uDDF5\uD83C\uDDF9', why: 'European charm, great food, beaches, affordable. Underrated gem.', dreamPerDay: '$200', dupePerDay: '$90', savings: '55%' };
  return {
    dream,
    dupe: match.dupe,
    dupeCountry: match.country,
    dupeEmoji: match.emoji,
    whyItWorks: match.why,
    costComparison: { dreamPerDay: match.dreamPerDay, dupePerDay: match.dupePerDay, savings: match.savings },
    similarVibes: ['Culture', 'Food', 'Adventure'],
    topPicks: [
      { category: 'Stay', name: 'Boutique hotel in the old town', price: '$90/night' },
      { category: 'Eat', name: 'Local market lunch', price: '$12' },
      { category: 'Do', name: 'Guided walking tour', price: '$25' },
    ],
    bestMonth: 'April or September — great weather, fewer crowds.',
  };
}
