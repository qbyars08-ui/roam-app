// =============================================================================
// ROAM — Recommendation Engine
// Powers: For You feed, Mood-based discovery, Surprise Me, Travel Twin
// Learns from every trip, save, vibe selection — gets smarter over time
// =============================================================================
import { DESTINATIONS, HIDDEN_DESTINATIONS, type Destination } from './constants';
import { getLocalPrefs, type UserPrefs } from './personalization';
import { type TravelProfile, DEFAULT_TRAVEL_PROFILE } from './types/travel-profile';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Mood → Destination mapping
// ---------------------------------------------------------------------------

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** Which destination traits score high for this mood */
  traits: {
    categories: string[];
    vibes: string[];
    dailyCostMax?: number;
    trendMin?: number;
    /** Prefer destinations with these keywords in hook */
    hookKeywords?: string[];
  };
}

export const MOODS: Mood[] = [
  {
    id: 'disappear',
    label: 'I need to disappear',
    emoji: '',
    description: 'Somewhere quiet where nobody knows your name',
    traits: {
      categories: ['beaches', 'mountains', 'adventure'],
      vibes: ['off-grid', 'nature-escape', 'solo-friendly', 'wellness'],
      hookKeywords: ['quiet', 'slow', 'escape', 'remote'],
    },
  },
  {
    id: 'inspired',
    label: 'I want to be inspired',
    emoji: '',
    description: 'Art, architecture, culture that rewires your brain',
    traits: {
      categories: ['cities', 'couples'],
      vibes: ['art-design', 'deep-history', 'photo-worthy'],
      hookKeywords: ['culture', 'art', 'museum', 'history', 'design'],
    },
  },
  {
    id: 'adventure',
    label: 'I need adventure',
    emoji: '🧗',
    description: 'Push yourself. Come back with a story.',
    traits: {
      categories: ['adventure', 'mountains'],
      vibes: ['adrenaline', 'nature-escape', 'off-grid'],
      hookKeywords: ['bungee', 'hike', 'volcano', 'wild'],
    },
  },
  {
    id: 'eat-everything',
    label: 'I want to eat everything',
    emoji: '',
    description: 'Cities where food is the main event',
    traits: {
      categories: ['food', 'budget'],
      vibes: ['local-eats', 'market-hopper'],
      hookKeywords: ['food', 'eat', 'ramen', 'steak', 'street', 'mole', 'carbonara'],
    },
  },
  {
    id: 'sun',
    label: 'I need sun',
    emoji: '☀️',
    description: 'Warm sand, blue water, zero agenda',
    traits: {
      categories: ['beaches', 'couples'],
      vibes: ['beach-vibes', 'sunset-chaser', 'wellness'],
      hookKeywords: ['beach', 'sun', 'island', 'tropical', 'surf', 'sand'],
    },
  },
  {
    id: 'feel-small',
    label: 'I want to feel small',
    emoji: '',
    description: 'Mountains, temples, landscapes that humble you',
    traits: {
      categories: ['mountains', 'adventure'],
      vibes: ['nature-escape', 'deep-history', 'photo-worthy'],
      hookKeywords: ['mountain', 'temple', 'volcano', 'canyon'],
    },
  },
  {
    id: 'culture-shock',
    label: 'I need culture shock',
    emoji: '',
    description: 'Go somewhere that rewires how you see the world',
    traits: {
      categories: ['food', 'adventure', 'budget'],
      vibes: ['hidden-gems', 'off-grid', 'local-eats'],
      hookKeywords: ['chaotic', 'sensory', 'underrated', 'lost'],
    },
  },
];

// ---------------------------------------------------------------------------
// Scoring engine
// ---------------------------------------------------------------------------

export interface ScoredDestination {
  destination: Destination;
  score: number;
  reasons: string[];
}

/** Score a destination against a user's travel profile */
function scoreByProfile(dest: Destination, profile: TravelProfile): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Budget alignment: budget-1 → prefer cheap destinations, budget-10 → prefer expensive
  const budgetNorm = profile.budgetStyle / 10; // 0.1 to 1.0
  const costNorm = Math.min(dest.dailyCost / 200, 1); // normalize cost (200/day = 1.0)
  const budgetAlignment = 1 - Math.abs(budgetNorm - costNorm);
  score += budgetAlignment * 30;
  if (budgetAlignment > 0.7) reasons.push('Matches your budget style');

  // Crowd tolerance vs popularity
  const crowdNorm = profile.crowdTolerance / 10;
  const trendNorm = dest.trendScore / 100;
  const crowdAlignment = 1 - Math.abs(crowdNorm - trendNorm);
  score += crowdAlignment * 20;
  if (crowdAlignment > 0.7) reasons.push(profile.crowdTolerance <= 3 ? 'Under the radar' : 'Popular for a reason');

  // Food adventurousness — food destinations score higher for adventurous eaters
  if (dest.category === 'food') {
    score += profile.foodAdventurousness * 2;
    if (profile.foodAdventurousness >= 7) reasons.push('Made for foodies like you');
  }

  // Category matches trip purposes
  const purposeCategoryMap: Record<string, string[]> = {
    exploration: ['cities', 'adventure'],
    food: ['food'],
    history: ['cities', 'couples'],
    nightlife: ['cities'],
    nature: ['mountains', 'beaches', 'adventure'],
    photography: ['cities', 'mountains', 'couples'],
    relaxation: ['beaches', 'couples'],
    'meet-locals': ['budget', 'food'],
    'off-beaten-path': ['budget', 'adventure'],
  };

  for (const purpose of profile.tripPurposes) {
    const categories = purposeCategoryMap[purpose] ?? [];
    if (categories.includes(dest.category)) {
      score += 15;
      break;
    }
  }

  // Pace alignment — high pace travelers might prefer cities with lots to do
  if (profile.pace >= 7 && dest.category === 'cities') {
    score += 10;
    reasons.push('Enough to fill a packed schedule');
  }
  if (profile.pace <= 3 && ['beaches', 'mountains'].includes(dest.category)) {
    score += 10;
    reasons.push('Perfect pace for slowing down');
  }

  // Seasonal bonus — in-season destinations get a boost
  const currentMonth = new Date().getMonth() + 1;
  if (dest.bestMonths.includes(currentMonth)) {
    score += 10;
    reasons.push('Perfect time to go');
  }

  // Trend bonus
  score += dest.trendScore / 10;

  return { score, reasons: reasons.slice(0, 2) };
}

/** Score a destination against learned preferences */
function scoreByPrefs(dest: Destination, prefs: UserPrefs): number {
  let score = 0;

  // Penalize destinations user has already visited
  if (prefs.favoriteDestinations.includes(dest.label)) {
    score -= 20;
  }

  // Boost categories that align with past vibes
  const categoryVibeMap: Record<string, string[]> = {
    food: ['local-eats', 'market-hopper'],
    cities: ['deep-history', 'art-design', 'night-owl'],
    beaches: ['beach-vibes', 'sunset-chaser', 'wellness'],
    adventure: ['adrenaline', 'nature-escape', 'off-grid'],
    mountains: ['nature-escape', 'off-grid'],
    budget: ['hidden-gems', 'solo-friendly'],
    couples: ['date-night', 'sunset-chaser', 'photo-worthy'],
  };

  const destVibes = categoryVibeMap[dest.category] ?? [];
  const overlap = destVibes.filter((v) => prefs.travelStyle.includes(v)).length;
  score += overlap * 10;

  return score;
}

/** Score a destination for a specific mood */
function scoreByMood(dest: Destination, mood: Mood): number {
  let score = 0;

  // Category match
  if (mood.traits.categories.includes(dest.category)) {
    score += 30;
  }

  // Hook keyword match
  if (mood.traits.hookKeywords) {
    const hookLower = dest.hook.toLowerCase();
    const keywordHits = mood.traits.hookKeywords.filter((k) =>
      hookLower.includes(k)
    ).length;
    score += keywordHits * 15;
  }

  // Cost constraint
  if (mood.traits.dailyCostMax && dest.dailyCost > mood.traits.dailyCostMax) {
    score -= 20;
  }

  // Trend minimum
  if (mood.traits.trendMin && dest.trendScore < mood.traits.trendMin) {
    score -= 10;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get personalized "For You" feed — sorted by how well each destination matches the user */
export async function getForYouFeed(options?: {
  limit?: number;
  includeHidden?: boolean;
}): Promise<ScoredDestination[]> {
  const limit = options?.limit ?? 15;
  const base = options?.includeHidden
    ? [...DESTINATIONS, ...HIDDEN_DESTINATIONS]
    : [...DESTINATIONS];

  const store = useAppStore.getState();
  const profile: TravelProfile = store.hasCompletedProfile
    ? store.travelProfile
    : DEFAULT_TRAVEL_PROFILE;

  const prefs = await getLocalPrefs();

  const scored = base.map((dest) => {
    const { score: profileScore, reasons } = scoreByProfile(dest, profile);
    const prefScore = scoreByPrefs(dest, prefs);
    return {
      destination: dest,
      score: profileScore + prefScore,
      reasons,
    };
  });

  // Sort by score, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** Get destinations matching a mood, personalized to user's profile */
export async function getDestinationsForMood(
  moodId: string,
  limit = 5
): Promise<ScoredDestination[]> {
  const mood = MOODS.find((m) => m.id === moodId);
  if (!mood) return [];

  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const store = useAppStore.getState();
  const profile: TravelProfile = store.hasCompletedProfile
    ? store.travelProfile
    : DEFAULT_TRAVEL_PROFILE;

  const scored = all.map((dest) => {
    const moodScore = scoreByMood(dest, mood);
    const { score: profileScore, reasons } = scoreByProfile(dest, profile);
    const totalScore = moodScore + profileScore * 0.5; // mood matters more

    const moodReasons = [...reasons];
    if (moodScore > 20) moodReasons.unshift(`Perfect for when you ${mood.label.toLowerCase()}`);

    return {
      destination: dest,
      score: totalScore,
      reasons: moodReasons.slice(0, 2),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/** "Surprise Me" — pick one perfect destination the user hasn't considered */
export async function getSurpriseDestination(): Promise<ScoredDestination | null> {
  const prefs = await getLocalPrefs();
  const feed = await getForYouFeed({ limit: 20, includeHidden: true });

  // Filter out destinations they've already planned
  const unseen = feed.filter(
    (s) => !prefs.favoriteDestinations.includes(s.destination.label)
  );

  if (unseen.length === 0) return feed[0] ?? null;

  // Pick from top 5 unseen, weighted random for variety
  const top5 = unseen.slice(0, 5);
  const totalScore = top5.reduce((sum, s) => sum + Math.max(s.score, 1), 0);
  let random = Math.random() * totalScore;
  for (const s of top5) {
    random -= Math.max(s.score, 1);
    if (random <= 0) return s;
  }
  return top5[0];
}

/** Generate a "why we picked this" explanation */
export function generatePickReason(
  scored: ScoredDestination,
  profile: TravelProfile
): string {
  const dest = scored.destination;
  const reasons = scored.reasons;

  if (reasons.length > 0) {
    return reasons.join('. ') + '.';
  }

  // Fallback reason generation
  if (profile.pace <= 3 && dest.dailyCost <= 50) {
    return `Slow pace, low cost, and ${dest.hook.toLowerCase()}.`;
  }
  if (profile.foodAdventurousness >= 7 && dest.category === 'food') {
    return `Your food adventurousness score says you'll love this. ${dest.hook}`;
  }
  if (dest.bestMonths.includes(new Date().getMonth() + 1)) {
    return `It's the perfect month. ${dest.hook}`;
  }

  return dest.hook;
}

// ---------------------------------------------------------------------------
// Price Pulse — cost of living data
// ---------------------------------------------------------------------------

export interface PricePulse {
  destination: string;
  currency: string;
  exchangeRate: string;
  tipping: string;
  paymentMethod: string;
  touristTraps: string;
  examples: { item: string; localPrice: string; usdPrice: string }[];
}

/** Generate cost of living context for a destination (using AI or static data) */
export function getStaticPricePulse(destination: string, dailyCost: number): PricePulse {
  // Static data for popular destinations — AI can enhance this later
  const data: Record<string, Partial<PricePulse>> = {
    Tokyo: {
      currency: 'Japanese Yen (¥)',
      exchangeRate: '~¥150 = $1 USD',
      tipping: 'No tipping. Seriously — it can be considered rude.',
      paymentMethod: 'IC cards (Suica/Pasmo) for transit + most stores. Cash still king at small restaurants.',
      touristTraps: 'Avoid Robot Restaurant (overpriced). Tsukiji outer market is touristy but still worth it for breakfast.',
      examples: [
        { item: 'Bowl of ramen', localPrice: '¥900', usdPrice: '$6' },
        { item: 'Metro ride', localPrice: '¥170', usdPrice: '$1.10' },
        { item: 'Convenience store onigiri', localPrice: '¥150', usdPrice: '$1' },
        { item: 'Draft beer at izakaya', localPrice: '¥500', usdPrice: '$3.30' },
        { item: 'Capsule hotel per night', localPrice: '¥3,500', usdPrice: '$23' },
      ],
    },
    Bali: {
      currency: 'Indonesian Rupiah (Rp)',
      exchangeRate: '~Rp 15,500 = $1 USD',
      tipping: '10% at nicer restaurants. Round up for drivers.',
      paymentMethod: 'Cash preferred everywhere outside luxury spots. ATMs charge fees — use Wise.',
      touristTraps: 'Skip Tanah Lot at midday (packed). Seminyak beach clubs charge $50+ for a daybed.',
      examples: [
        { item: 'Nasi goreng from warung', localPrice: 'Rp 25,000', usdPrice: '$1.60' },
        { item: 'Scooter rental per day', localPrice: 'Rp 75,000', usdPrice: '$5' },
        { item: 'Large Bintang beer', localPrice: 'Rp 35,000', usdPrice: '$2.25' },
        { item: 'Private driver for day', localPrice: 'Rp 500,000', usdPrice: '$32' },
        { item: 'Surf lesson (2hr)', localPrice: 'Rp 350,000', usdPrice: '$23' },
      ],
    },
    Bangkok: {
      currency: 'Thai Baht (฿)',
      exchangeRate: '~฿35 = $1 USD',
      tipping: 'Not expected. 20-50฿ for exceptional service.',
      paymentMethod: 'Cash for street food and markets. Cards at malls and restaurants.',
      touristTraps: 'Tuk-tuk "tours" that take you to gem shops. Negotiate BTS fare vs taxi for short rides.',
      examples: [
        { item: 'Pad thai from street cart', localPrice: '฿50', usdPrice: '$1.40' },
        { item: 'BTS single ride', localPrice: '฿25-60', usdPrice: '$0.70-1.70' },
        { item: 'Thai massage (1hr)', localPrice: '฿300', usdPrice: '$8.50' },
        { item: 'Chang beer (7-11)', localPrice: '฿45', usdPrice: '$1.30' },
        { item: 'Hostel dorm bed', localPrice: '฿350', usdPrice: '$10' },
      ],
    },
  };

  const destData = data[destination];
  if (destData) {
    return {
      destination,
      currency: destData.currency ?? 'Local currency',
      exchangeRate: destData.exchangeRate ?? 'Check XE.com',
      tipping: destData.tipping ?? 'Varies — check locally',
      paymentMethod: destData.paymentMethod ?? 'Cash + card both accepted',
      touristTraps: destData.touristTraps ?? 'Do your research before booking tours',
      examples: destData.examples ?? [],
    };
  }

  // Generic fallback
  return {
    destination,
    currency: 'Local currency',
    exchangeRate: 'Check XE.com for current rates',
    tipping: 'Research local customs before you go',
    paymentMethod: 'Card accepted at most hotels and restaurants. Carry some cash.',
    touristTraps: 'Compare prices, avoid booking tours from hotel lobbies',
    examples: [
      { item: 'Budget meal', localPrice: '—', usdPrice: `~$${Math.round(dailyCost * 0.05)}` },
      { item: 'Mid-range dinner', localPrice: '—', usdPrice: `~$${Math.round(dailyCost * 0.15)}` },
      { item: 'Local transport', localPrice: '—', usdPrice: `~$${Math.round(dailyCost * 0.05)}` },
    ],
  };
}

// ---------------------------------------------------------------------------
// Vibe Check — what's happening at a destination right now
// ---------------------------------------------------------------------------

export interface VibeCheck {
  destination: string;
  bestTimeToGo: string;
  crowdLevel: 'low' | 'moderate' | 'high' | 'peak';
  crowdDescription: string;
  localEvents: string;
  priceNote: string;
}

export function getVibeCheck(dest: Destination): VibeCheck {
  const month = new Date().getMonth() + 1;
  const inSeason = dest.bestMonths.includes(month);

  const crowdLevel: VibeCheck['crowdLevel'] = dest.trendScore > 85
    ? (inSeason ? 'peak' : 'high')
    : (inSeason ? 'moderate' : 'low');

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bestMonthNames = dest.bestMonths.map((m) => MONTH_NAMES[m - 1]).join(', ');

  return {
    destination: dest.label,
    bestTimeToGo: bestMonthNames,
    crowdLevel,
    crowdDescription: crowdLevel === 'peak'
      ? 'Very busy right now. Book accommodation early.'
      : crowdLevel === 'high'
        ? 'Popular but manageable. Avoid weekends.'
        : crowdLevel === 'moderate'
          ? 'Good time to visit. Not too crowded.'
          : 'Under the radar right now. Great timing.',
    localEvents: inSeason
      ? `In season now — great weather and local events.`
      : `Off-season. Expect fewer crowds and lower prices.`,
    priceNote: inSeason
      ? `Prices are at ${dest.trendScore > 85 ? 'peak' : 'standard'} levels. Book now.`
      : `Off-peak pricing — save 20-40% on accommodation.`,
  };
}
