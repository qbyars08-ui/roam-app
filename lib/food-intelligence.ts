// =============================================================================
// ROAM — Food Intelligence Engine
// Deep food knowledge: safety, translations, costs, dietary, time-aware dining
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSonarResult } from './sonar';
import { getCostOfLiving } from './cost-of-living';
import { getTimeOfDay, type TimeOfDay } from './here-now-context';
import { DESTINATIONS, HIDDEN_DESTINATIONS } from './constants';
import type { SonarResult } from './types/sonar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FoodProfile {
  readonly dietaryRestrictions: readonly string[];
  readonly allergies: readonly string[];
  readonly spicePreference: 1 | 2 | 3 | 4 | 5;
  readonly adventurousness: 1 | 2 | 3 | 4 | 5;
  readonly budgetPerMeal: number;
  readonly cuisinePreferences: readonly string[];
  readonly avoidCuisines: readonly string[];
}

export type DietaryFilter =
  | 'all'
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'gluten-free';

export type MealTier = 'budget' | 'mid' | 'comfort';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DishInfo {
  readonly localName: string;
  readonly pronunciation: string;
  readonly englishName: string;
  readonly description: string;
  readonly priceLocal: string;
  readonly dietaryTags: readonly DietaryFilter[];
  readonly orderPhrase: string;
}

export interface FoodSafetyItem {
  readonly item: string;
  readonly status: 'safe' | 'caution' | 'avoid';
  readonly note: string;
}

export interface FoodSafetyBrief {
  readonly tapWater: FoodSafetyItem;
  readonly ice: FoodSafetyItem;
  readonly streetFood: FoodSafetyItem;
  readonly commonRisks: readonly string[];
  readonly hygieneSignsToWatch: readonly string[];
}

export interface MealCostEstimate {
  readonly mealType: MealType;
  readonly tier: MealTier;
  readonly localCurrency: string;
  readonly localPrice: string;
  readonly usdEquivalent: string;
}

export interface AllergyPhrase {
  readonly allergy: string;
  readonly phrase: string;
  readonly pronunciation: string;
  readonly language: string;
}

export interface VegetarianGuide {
  readonly difficulty: 'easy' | 'moderate' | 'difficult';
  readonly tips: readonly string[];
  readonly usefulPhrases: readonly string[];
  readonly recommendedDishes: readonly string[];
}

export interface FoodIntelState {
  readonly localGuide: SonarResult | null;
  readonly safetyBrief: SonarResult | null;
  readonly menuDecoder: SonarResult | null;
  readonly timeOfDayFood: SonarResult | null;
  readonly vegetarianGuide: SonarResult | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

// ---------------------------------------------------------------------------
// Destination lookup helper
// ---------------------------------------------------------------------------

function findDestination(name: string) {
  const lower = name.toLowerCase();
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  return all.find((d) => d.label.toLowerCase() === lower) ?? null;
}

// ---------------------------------------------------------------------------
// Sonar query functions
// ---------------------------------------------------------------------------

export async function getLocalFoodGuide(
  destination: string,
): Promise<SonarResult> {
  return fetchSonarResult(destination, 'food', {
    budget: 'local',
  });
}

export async function getFoodSafetyBrief(
  destination: string,
): Promise<SonarResult> {
  return fetchSonarResult(destination, 'health', {
    budget: 'safety',
  });
}

export async function getDishTranslations(
  destination: string,
  _dishes: readonly string[],
): Promise<SonarResult> {
  return fetchSonarResult(destination, 'local_eats');
}

export async function getMenuDecoder(
  destination: string,
): Promise<SonarResult> {
  return fetchSonarResult(destination, 'local_eats');
}

export async function getFoodByTimeOfDay(
  destination: string,
  timeOfDay: TimeOfDay,
): Promise<SonarResult> {
  return fetchSonarResult(destination, 'food', {
    dates: timeOfDay,
  });
}

export async function getVegetarianGuide(
  destination: string,
): Promise<SonarResult> {
  return fetchSonarResult(destination, 'food', {
    budget: 'vegetarian',
  });
}

export async function getFoodAllergySafety(
  destination: string,
  allergy: string,
): Promise<SonarResult> {
  return fetchSonarResult(destination, 'health', {
    budget: allergy,
  });
}

// ---------------------------------------------------------------------------
// Meal cost estimation (offline data + enrichment)
// ---------------------------------------------------------------------------

export function estimateMealCost(
  destination: string,
  mealType: MealType,
  tier: MealTier,
): MealCostEstimate | null {
  const costs = getCostOfLiving(destination);
  if (!costs) return null;

  const tierData =
    tier === 'budget'
      ? costs.budget
      : tier === 'mid'
        ? costs.comfort
        : costs.luxury;

  // Apply meal type multiplier to the per-meal cost
  const multiplierMap: Record<MealType, number> = {
    breakfast: 0.7,
    lunch: 0.9,
    dinner: 1.3,
    snack: 0.4,
  };

  const multiplier = multiplierMap[mealType];
  const mealStr = tierData.meal;

  return {
    mealType,
    tier,
    localCurrency: costs.currency,
    localPrice: `~${costs.currencySymbol}${mealStr} x${multiplier.toFixed(1)}`,
    usdEquivalent: tierData.dailyTotal,
  };
}

// ---------------------------------------------------------------------------
// Get tipping + bargaining culture
// ---------------------------------------------------------------------------

export function getTippingCulture(destination: string): {
  tipping: string;
  bargaining: string;
} | null {
  const costs = getCostOfLiving(destination);
  if (!costs) return null;
  return { tipping: costs.tipping, bargaining: costs.bargaining };
}

// ---------------------------------------------------------------------------
// Dietary filter labels
// ---------------------------------------------------------------------------

export const DIETARY_FILTERS: readonly {
  readonly id: DietaryFilter;
  readonly label: string;
  readonly shortLabel: string;
}[] = [
  { id: 'all', label: 'All', shortLabel: 'All' },
  { id: 'vegetarian', label: 'Vegetarian', shortLabel: 'V' },
  { id: 'vegan', label: 'Vegan', shortLabel: 'VG' },
  { id: 'halal', label: 'Halal', shortLabel: 'H' },
  { id: 'kosher', label: 'Kosher', shortLabel: 'K' },
  { id: 'gluten-free', label: 'Gluten Free', shortLabel: 'GF' },
] as const;

// ---------------------------------------------------------------------------
// Default food profile
// ---------------------------------------------------------------------------

export const DEFAULT_FOOD_PROFILE: FoodProfile = {
  dietaryRestrictions: [],
  allergies: [],
  spicePreference: 3,
  adventurousness: 3,
  budgetPerMeal: 15,
  cuisinePreferences: [],
  avoidCuisines: [],
} as const;

// ---------------------------------------------------------------------------
// React hook — useFoodIntel
// ---------------------------------------------------------------------------

const FOOD_INTEL_TIMEOUT_MS = 12_000;

export function useFoodIntel(destination: string | undefined): {
  localGuide: SonarResult | null;
  safetyBrief: SonarResult | null;
  menuDecoder: SonarResult | null;
  timeOfDayFood: SonarResult | null;
  vegetarianGuide: SonarResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [state, setState] = useState<FoodIntelState>({
    localGuide: null,
    safetyBrief: null,
    menuDecoder: null,
    timeOfDayFood: null,
    vegetarianGuide: null,
    isLoading: false,
    error: null,
  });
  const [fetchKey, setFetchKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!destination) {
      setState({
        localGuide: null,
        safetyBrief: null,
        menuDecoder: null,
        timeOfDayFood: null,
        vegetarianGuide: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    timeoutRef.current = setTimeout(() => {
      if (!cancelled) {
        setState((prev) => ({ ...prev, isLoading: false, error: 'timeout' }));
      }
    }, FOOD_INTEL_TIMEOUT_MS);

    const hour = new Date().getHours();
    const timeOfDay = getTimeOfDay(hour);

    // Fetch all intel in parallel
    Promise.allSettled([
      getLocalFoodGuide(destination),
      getFoodSafetyBrief(destination),
      getMenuDecoder(destination),
      getFoodByTimeOfDay(destination, timeOfDay),
      getVegetarianGuide(destination),
    ]).then((results) => {
      if (cancelled) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const getValue = (r: PromiseSettledResult<SonarResult>) =>
        r.status === 'fulfilled' ? r.value : null;

      setState({
        localGuide: getValue(results[0]),
        safetyBrief: getValue(results[1]),
        menuDecoder: getValue(results[2]),
        timeOfDayFood: getValue(results[3]),
        vegetarianGuide: getValue(results[4]),
        isLoading: false,
        error: null,
      });
    });

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [destination, fetchKey]);

  return { ...state, refetch };
}
