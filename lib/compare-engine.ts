// =============================================================================
// ROAM — Compare Engine
// Fetches all data for 2-3 destinations in parallel, scores winners,
// and computes vibe-match against the user's travel DNA.
// =============================================================================
import { DESTINATIONS, HIDDEN_DESTINATIONS, type Destination } from './constants';
import { getCostOfLiving, type CostOfLiving } from './cost-of-living';
import { getTravelAdvisory, type TravelAdvisory } from './travel-safety';
import { getWeatherForecast, type WeatherForecast } from './weather-forecast';
import { getSimpleVisaInfo, type SimpleVisaInfo } from './visa-intel';
import { HISTORICAL_PRICES } from './flight-intelligence';
import { getDestinationAirport } from './flights';
import type { TravelProfile } from './types/travel-profile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DestinationSnapshot {
  name: string;
  dest: Destination | null;
  weather: WeatherForecast | null;
  cost: CostOfLiving | null;
  safety: TravelAdvisory | null;
  visa: SimpleVisaInfo | null;
  flightEstimate: number | null;
  vibeMatch: number | null;
}

export type CategoryKey =
  | 'weather'
  | 'cost'
  | 'safety'
  | 'flight'
  | 'visa'
  | 'bestTime'
  | 'vibeMatch';

export interface ComparisonResult {
  snapshots: DestinationSnapshot[];
  wins: Record<string, number>; // destination name -> win count
  winner: string | null;
  totalCategories: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_DESTINATIONS: Destination[] = [
  ...DESTINATIONS,
  ...HIDDEN_DESTINATIONS,
];

function findDestination(name: string): Destination | null {
  const lower = name.toLowerCase();
  return (
    ALL_DESTINATIONS.find((d) => d.label.toLowerCase() === lower) ?? null
  );
}

function getFlightEstimate(destination: string): number | null {
  const destCode = getDestinationAirport(destination);
  if (!destCode) return null;

  // Try common US origins
  const origins = ['JFK', 'LAX', 'ORD', 'SFO'];
  for (const origin of origins) {
    const key = `${origin}-${destCode}`;
    const price = HISTORICAL_PRICES[key];
    if (price) return price.low;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Vibe Match — scores a destination against the user's travel DNA (0–100)
// ---------------------------------------------------------------------------

export function getVibeMatch(
  destination: string,
  profile: TravelProfile,
): number {
  const dest = findDestination(destination);
  if (!dest) return 50; // neutral if unknown

  let score = 60; // base

  // Budget alignment: closer match = higher score
  const budgetDiff = Math.abs(
    (profile.budgetStyle / 10) * 200 - dest.dailyCost,
  );
  score += budgetDiff < 30 ? 15 : budgetDiff < 80 ? 8 : 0;

  // Food adventurousness vs category
  if (dest.category === 'food' && profile.foodAdventurousness >= 7) score += 10;
  if (dest.category === 'budget' && profile.budgetStyle <= 4) score += 10;
  if (dest.category === 'couples' && profile.budgetStyle >= 6) score += 8;
  if (dest.category === 'adventure' && profile.pace >= 6) score += 10;

  // Crowd tolerance
  if (dest.trendScore > 85 && profile.crowdTolerance >= 6) score += 5;
  if (dest.trendScore < 75 && profile.crowdTolerance <= 4) score += 8;

  // Safety preference (less experienced travelers prefer safer)
  if (
    profile.travelFrequency === 'first-trip' &&
    dest.safetyScore >= 8
  ) {
    score += 8;
  }

  return Math.min(99, Math.max(20, score));
}

// ---------------------------------------------------------------------------
// Core comparison — fetches all data in parallel
// ---------------------------------------------------------------------------

export async function compareDestinations(
  names: string[],
  profile: TravelProfile,
): Promise<ComparisonResult> {
  const snapshots = await Promise.all(
    names.map(async (name): Promise<DestinationSnapshot> => {
      const dest = findDestination(name);
      const countryCode = dest?.country ?? null;

      const [weather, safety] = await Promise.all([
        dest
          ? getWeatherForecast(dest.lat, dest.lng, 7)
          : Promise.resolve(null),
        countryCode
          ? getTravelAdvisory(countryCode)
          : Promise.resolve(null),
      ]);

      return {
        name,
        dest,
        weather,
        cost: getCostOfLiving(name),
        safety,
        visa: getSimpleVisaInfo(name, 'US'),
        flightEstimate: getFlightEstimate(name),
        vibeMatch: getVibeMatch(name, profile),
      };
    }),
  );

  return getWinner(snapshots);
}

// ---------------------------------------------------------------------------
// Winner calculation — counts category wins per destination
// ---------------------------------------------------------------------------

export function getWinner(snapshots: DestinationSnapshot[]): ComparisonResult {
  const wins: Record<string, number> = {};
  for (const s of snapshots) wins[s.name] = 0;

  const totalCategories = 7;

  // 1. Weather — warmer tempMax average wins
  const weatherScores = snapshots.map((s) => {
    if (!s.weather?.days.length) return null;
    return s.weather.days.reduce((a, d) => a + d.tempMax, 0) / s.weather.days.length;
  });
  awardWinner(weatherScores, snapshots, wins, 'higher');

  // 2. Cost — lower dailyCost wins
  const costScores = snapshots.map((s) => s.dest?.dailyCost ?? null);
  awardWinner(costScores, snapshots, wins, 'lower');

  // 3. Safety — higher safetyScore wins
  const safetyScores = snapshots.map((s) => s.dest?.safetyScore ?? null);
  awardWinner(safetyScores, snapshots, wins, 'higher');

  // 4. Flight — lower price wins
  const flightScores = snapshots.map((s) => s.flightEstimate);
  awardWinner(flightScores, snapshots, wins, 'lower');

  // 5. Visa — higher maxStay wins
  const visaScores = snapshots.map((s) => s.visa?.maxStay ?? null);
  awardWinner(visaScores, snapshots, wins, 'higher');

  // 6. Best time — is current month in bestMonths?
  const month = new Date().getMonth() + 1;
  const timingScores = snapshots.map((s) =>
    s.dest?.bestMonths.includes(month) ? 1 : 0,
  );
  awardWinner(timingScores, snapshots, wins, 'higher');

  // 7. Vibe match
  const vibeScores = snapshots.map((s) => s.vibeMatch);
  awardWinner(vibeScores, snapshots, wins, 'higher');

  // Determine overall winner
  let winner: string | null = null;
  let maxWins = 0;
  for (const [name, count] of Object.entries(wins)) {
    if (count > maxWins) {
      maxWins = count;
      winner = name;
    }
  }

  return { snapshots, wins, winner, totalCategories };
}

function awardWinner(
  scores: (number | null)[],
  snapshots: DestinationSnapshot[],
  wins: Record<string, number>,
  mode: 'higher' | 'lower',
): void {
  const valid = scores.filter((s): s is number => s != null);
  if (valid.length < 2) return;

  const best = mode === 'higher' ? Math.max(...valid) : Math.min(...valid);
  const winnerIdx = scores.findIndex((s) => s === best);
  if (winnerIdx >= 0) {
    wins[snapshots[winnerIdx].name] += 1;
  }
}
