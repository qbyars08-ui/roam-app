// =============================================================================
// ROAM — Year in Review Engine (no streaks)
// =============================================================================
import { useAppStore, type Trip } from './store';

export interface YearInReview {
  year: number;
  tripsGenerated: number;
  uniqueDestinations: string[];
  totalDaysPlanned: number;
  topVibes: { vibe: string; count: number }[];
  avgTripLength: number;
  favoriteDestination: string | null;
  budgetBreakdown: { tier: string; count: number }[];
  personalityShift: string;
  headline: string;
  generatedAt: string;
}

export async function generateYearInReview(year?: number): Promise<YearInReview> {
  const targetYear = year ?? new Date().getFullYear();
  const { trips } = useAppStore.getState();

  const yearTrips = trips.filter((t) => {
    const tripYear = new Date(t.createdAt).getFullYear();
    return tripYear === targetYear;
  });

  const destinations = yearTrips.map((t) => t.destination);
  const uniqueDests = [...new Set(destinations)];

  const totalDays = yearTrips.reduce((sum, t) => sum + t.days, 0);
  const avgLength = yearTrips.length > 0 ? Math.round(totalDays / yearTrips.length) : 0;

  const vibeCount = new Map<string, number>();
  for (const t of yearTrips) {
    for (const v of t.vibes) {
      vibeCount.set(v, (vibeCount.get(v) ?? 0) + 1);
    }
  }
  const topVibes = [...vibeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([vibe, count]) => ({ vibe, count }));

  const destCount = new Map<string, number>();
  for (const d of destinations) {
    destCount.set(d, (destCount.get(d) ?? 0) + 1);
  }
  const favorite = [...destCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const budgetMap = new Map<string, number>();
  for (const t of yearTrips) {
    const b = t.budget || 'comfort';
    budgetMap.set(b, (budgetMap.get(b) ?? 0) + 1);
  }
  const budgetBreakdown = [...budgetMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tier, count]) => ({ tier, count }));

  const headline = generateHeadline(yearTrips, uniqueDests, totalDays);
  const shift =
    yearTrips.length >= 3
      ? `You evolved from ${topVibes[topVibes.length - 1]?.vibe ?? 'explorer'} to ${topVibes[0]?.vibe ?? 'adventurer'} this year`
      : 'Keep exploring to see how your travel personality evolves';

  return {
    year: targetYear,
    tripsGenerated: yearTrips.length,
    uniqueDestinations: uniqueDests,
    totalDaysPlanned: totalDays,
    topVibes,
    avgTripLength: avgLength,
    favoriteDestination: favorite,
    budgetBreakdown,
    personalityShift: shift,
    headline,
    generatedAt: new Date().toISOString(),
  };
}

function generateHeadline(trips: Trip[], destinations: string[], totalDays: number): string {
  if (trips.length === 0) return 'Your travel year is just beginning';
  if (trips.length === 1) return `You kicked off with ${destinations[0]}`;
  if (destinations.length >= 5) return `${destinations.length} places. ${totalDays} days planned. Unstoppable.`;
  if (totalDays >= 30) return `${totalDays} days of adventure planned this year`;
  return `${trips.length} trips. ${destinations.length} destinations. Your year in travel.`;
}

