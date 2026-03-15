// =============================================================================
// ROAM — Demo Trip
// A hardcoded sample Tokyo itinerary shown when the AI generation fails.
// Lets users experience ROAM's output quality even when the edge function
// is unreachable. Reduces bounce from error dead-ends.
// =============================================================================

import type { Itinerary } from './types/itinerary';

export const DEMO_TRIP_DESTINATION = 'Tokyo';
export const DEMO_TRIP_DAYS = 3;
export const DEMO_TRIP_BUDGET = 'comfort';

export const DEMO_ITINERARY: Itinerary = {
  destination: 'Tokyo, Japan',
  tagline: 'The city that stays up later than you do',
  totalBudget: '$900',
  days: [
    {
      day: 1,
      theme: 'The Day You Eat Too Much',
      morning: {
        activity: 'Tsukiji Outer Market breakfast',
        location: 'Tsukiji Outer Market',
        cost: '$15',
        tip: 'Tamagoyaki from Marutake. Get there by 8am — the best stalls sell out.',
        time: '8:00 AM',
        duration: '90',
        neighborhood: 'Tsukiji',
        address: '4-16-2 Tsukiji, Chuo City, Tokyo',
        transitToNext: '20 min walk through Ginza to Shibuya via subway (12 min, Hibiya Line)',
      },
      afternoon: {
        activity: 'Harajuku takeshita street + Meiji Shrine',
        location: 'Takeshita Street → Meiji Shrine',
        cost: '$10',
        tip: 'Meiji Shrine is free. Go before 3pm to avoid tour buses. Skip the gift shops.',
        time: '1:00 PM',
        duration: '120',
        neighborhood: 'Harajuku',
        address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo',
        transitToNext: '10 min walk to Shibuya crossing',
      },
      evening: {
        activity: 'Shibuya crossing at sunset + ramen at Ichiran',
        location: 'Shibuya Crossing → Ichiran Shibuya',
        cost: '$20',
        tip: 'Ichiran lets you eat solo in a booth — order the richness level 3, extra noodles.',
        time: '6:00 PM',
        duration: '120',
        neighborhood: 'Shibuya',
        address: 'Ichiran Shibuya: 2-21-4 Dogenzaka, Shibuya',
      },
      accommodation: {
        name: 'Shinjuku Granbell Hotel',
        type: 'hotel',
        pricePerNight: '$120',
        neighborhood: 'Shinjuku',
      },
      dailyCost: '$165',
      routeSummary: 'Tsukiji → Ginza → Harajuku → Shibuya',
    },
    {
      day: 2,
      theme: 'Old Tokyo Meets New',
      morning: {
        activity: 'Senso-ji Temple at dawn',
        location: 'Senso-ji, Asakusa',
        cost: '$0',
        tip: 'Arrive by 7am — the temple is open, empty, and genuinely atmospheric. Tourists don\'t show up until 10am.',
        time: '7:00 AM',
        duration: '90',
        neighborhood: 'Asakusa',
        address: '2-3-1 Asakusa, Taito City, Tokyo',
        transitToNext: 'Take Ginza Line from Asakusa to Akihabara (6 min)',
      },
      afternoon: {
        activity: 'TeamLab Planets',
        location: 'teamLab Planets TOKYO',
        cost: '$35',
        tip: 'Book tickets online at least 3 days ahead. Wear socks. The water room — just go with it.',
        time: '12:00 PM',
        duration: '120',
        neighborhood: 'Toyosu',
        address: '6-1-16 Toyosu, Koto City, Tokyo',
        transitToNext: 'Yurikamome Line to Odaiba (25 min)',
      },
      evening: {
        activity: 'Golden Gai bar crawl',
        location: 'Golden Gai, Shinjuku',
        cost: '$40',
        tip: 'Each bar fits 6-8 people. Walk in, sit, order. Don\'t ask for a menu. Just say "おすすめは何ですか?" (What do you recommend?)',
        time: '8:00 PM',
        duration: '180',
        neighborhood: 'Shinjuku',
        address: 'Golden Gai, 1-1 Kabukicho, Shinjuku City',
      },
      accommodation: {
        name: 'Shinjuku Granbell Hotel',
        type: 'hotel',
        pricePerNight: '$120',
        neighborhood: 'Shinjuku',
      },
      dailyCost: '$195',
      routeSummary: 'Asakusa → Toyosu → Shinjuku',
    },
    {
      day: 3,
      theme: 'The Hidden Layers',
      morning: {
        activity: 'Coffee in Shimokitazawa',
        location: 'Bear Pond Espresso',
        cost: '$8',
        tip: 'Shimokitazawa is Tokyo\'s Brooklyn. Wander the vintage shops. Skip the coffee if there\'s a line — Obscura Coffee nearby is better anyway.',
        time: '9:30 AM',
        duration: '90',
        neighborhood: 'Shimokitazawa',
        address: '2-36-12 Kitazawa, Setagaya City, Tokyo',
        transitToNext: 'Odakyu Line to Shinjuku (10 min), then Chuo Line to Koenji (8 min)',
      },
      afternoon: {
        activity: 'Yanaka cemetery + shotengai shopping street',
        location: 'Yanaka Ginza',
        cost: '$12',
        tip: 'Yanaka Ginza is what old Tokyo looked like before Shibuya happened. Get the menchi-katsu (fried meat cutlet) from the butcher stall.',
        time: '1:00 PM',
        duration: '120',
        neighborhood: 'Yanaka',
        address: 'Yanaka Ginza, 3-13-1 Yanaka, Taito City',
        transitToNext: 'JR Yamanote Line from Nippori to Ueno (3 min)',
      },
      evening: {
        activity: 'Robot Restaurant — or skip it, and go to Omoide Yokocho instead',
        location: 'Omoide Yokocho, Shinjuku',
        cost: '$30',
        tip: 'Omoide Yokocho (Memory Lane) is 50 tiny yakitori stalls under the train tracks. Smoke, beer, $3 skewers. This is the real Tokyo night out.',
        time: '7:00 PM',
        duration: '120',
        neighborhood: 'Shinjuku',
        address: '1-2-7 Nishishinjuku, Shinjuku City, Tokyo',
      },
      accommodation: {
        name: 'Shinjuku Granbell Hotel',
        type: 'hotel',
        pricePerNight: '$120',
        neighborhood: 'Shinjuku',
      },
      dailyCost: '$170',
      routeSummary: 'Shimokitazawa → Yanaka → Shinjuku',
    },
  ],
  budgetBreakdown: {
    accommodation: '$360',
    food: '$270',
    activities: '$120',
    transportation: '$80',
    miscellaneous: '$70',
  },
  packingEssentials: [
    'IC card (Suica/Pasmo) — load it at the airport, use it for everything',
    'Pocket WiFi or SIM (Sakura Mobile or IIJmio)',
    'Cash — many spots in Yanaka/Asakusa are cash-only',
    'Comfortable shoes — you will walk 15,000+ steps/day',
    'Umbrella — Tokyo rains unpredictably in spring',
  ],
  proTip: 'Buy a 3-day Tokyo subway pass at the airport (¥1,500). It pays for itself by day 2.',
  visaInfo: 'US passport holders: visa-free entry for up to 90 days.',
};

/** Returns a pre-built Trip object for the demo itinerary. */
export function buildDemoTrip() {
  return {
    id: 'demo-tokyo',
    destination: DEMO_TRIP_DESTINATION,
    days: DEMO_TRIP_DAYS,
    budget: DEMO_TRIP_BUDGET,
    vibes: ['local-eats', 'hidden-gems', 'night-owl'],
    itinerary: JSON.stringify(DEMO_ITINERARY),
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
}
