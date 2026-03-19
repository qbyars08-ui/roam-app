// =============================================================================
// ROAM — Trip Cost Optimizer
// Finds savings and suggests cheaper alternatives for trip itineraries
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { searchPlaces } from './apis/foursquare';
import { fetchSonarResult } from './sonar';
import { getCostOfLiving } from './cost-of-living';
import { getDestinationCoords } from './air-quality';
import { useAppStore } from './store';
import { parseItinerary } from './types/itinerary';
import type { FSQPlace } from './apis/foursquare';
import type { Itinerary, ItineraryDay } from './types/itinerary';
import type { SonarResult } from './types/sonar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CostOptimization {
  category: 'food' | 'activities' | 'accommodation' | 'rebalance';
  currentCost: number;
  suggestedCost: number;
  savings: number;
  suggestion: string;
  source: 'foursquare' | 'sonar' | 'analysis';
}

export interface DealAlert {
  title: string;
  description: string;
  source: string;
}

export interface FreeDayActivity {
  activity: string;
  location: string;
  description: string;
}

export interface CostOptimizerResult {
  optimizations: CostOptimization[];
  deals: SonarResult | null;
  freePlan: SonarResult | null;
  totalSavings: number;
  cheaperVenues: FSQPlace[];
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDollar(s: string): number {
  const match = s.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function findMostExpensiveDay(days: ItineraryDay[]): ItineraryDay | null {
  if (days.length === 0) return null;
  return days.reduce((max, day) =>
    parseDollar(day.dailyCost) > parseDollar(max.dailyCost) ? day : max
  );
}

function averageDailyCost(days: ItineraryDay[]): number {
  if (days.length === 0) return 0;
  const total = days.reduce((sum, d) => sum + parseDollar(d.dailyCost), 0);
  return total / days.length;
}

// ---------------------------------------------------------------------------
// Core: optimizeTripCost
// ---------------------------------------------------------------------------

export async function optimizeTripCost(
  destination: string,
  itinerary: Itinerary,
  budget: string,
): Promise<{ optimizations: CostOptimization[]; cheaperVenues: FSQPlace[] }> {
  const optimizations: CostOptimization[] = [];
  let cheaperVenues: FSQPlace[] = [];
  const coords = getDestinationCoords(destination);
  const costData = getCostOfLiving(destination);

  // 1. Restaurant alternatives via Foursquare
  if (coords) {
    const budgetEats = await searchPlaces(
      'cheap eats restaurant',
      coords.lat,
      coords.lng,
      undefined,
      3000,
    );
    if (budgetEats && budgetEats.length > 0) {
      cheaperVenues = budgetEats
        .filter((p) => p.price !== null && p.price <= 2)
        .slice(0, 5);

      if (cheaperVenues.length > 0) {
        const avgMealCost = costData
          ? parseDollar(costData.comfort.meal)
          : 20;
        const budgetMealCost = costData
          ? parseDollar(costData.budget.meal)
          : 8;
        const mealSavings = (avgMealCost - budgetMealCost) * itinerary.days.length * 2;

        if (mealSavings > 0) {
          optimizations.push({
            category: 'food',
            currentCost: avgMealCost * itinerary.days.length * 2,
            suggestedCost: budgetMealCost * itinerary.days.length * 2,
            savings: Math.round(mealSavings),
            suggestion: `Try local spots like ${cheaperVenues[0].name} — rated ${cheaperVenues[0].rating ?? 'well'} by locals, at a fraction of tourist restaurant prices.`,
            source: 'foursquare',
          });
        }
      }
    }
  }

  // 2. Free alternatives for paid activities via Sonar
  try {
    const freeResult = await fetchSonarResult(destination, 'local', {
      budget: 'free activities only',
    });
    if (freeResult?.answer) {
      const activityCosts = itinerary.days.reduce((sum, day) => {
        const mCost = parseDollar(day.morning.cost);
        const aCost = parseDollar(day.afternoon.cost);
        const eCost = parseDollar(day.evening.cost);
        return sum + mCost + aCost + eCost;
      }, 0);

      const estimatedFreeSavings = Math.round(activityCosts * 0.3);
      if (estimatedFreeSavings > 5) {
        optimizations.push({
          category: 'activities',
          currentCost: Math.round(activityCosts),
          suggestedCost: Math.round(activityCosts * 0.7),
          savings: estimatedFreeSavings,
          suggestion: `Swap some paid activities for free alternatives — ${freeResult.answer.split('.')[0]}.`,
          source: 'sonar',
        });
      }
    }
  } catch {
    // non-fatal — skip activity optimization
  }

  // 3. Most expensive day rebalancing
  const expensiveDay = findMostExpensiveDay(itinerary.days);
  const avg = averageDailyCost(itinerary.days);
  if (expensiveDay && parseDollar(expensiveDay.dailyCost) > avg * 1.4) {
    const dayCost = parseDollar(expensiveDay.dailyCost);
    const savingsAmount = Math.round(dayCost - avg);
    optimizations.push({
      category: 'rebalance',
      currentCost: Math.round(dayCost),
      suggestedCost: Math.round(avg),
      savings: savingsAmount,
      suggestion: `Day ${expensiveDay.day} ("${expensiveDay.theme}") costs ${Math.round((dayCost / avg) * 100 - 100)}% more than average. Move one premium activity to a lighter day.`,
      source: 'analysis',
    });
  }

  // 4. Accommodation alternatives
  if (costData && itinerary.days.length > 0) {
    const firstDay = itinerary.days[0];
    const currentNightly = parseDollar(firstDay.accommodation.pricePerNight);
    const budgetNightly = parseDollar(costData.budget.accommodation);
    const nights = itinerary.days.length;
    const accomSavings = (currentNightly - budgetNightly) * nights;

    if (accomSavings > 10) {
      optimizations.push({
        category: 'accommodation',
        currentCost: Math.round(currentNightly * nights),
        suggestedCost: Math.round(budgetNightly * nights),
        savings: Math.round(accomSavings),
        suggestion: `Switch to a hostel or budget Airbnb (${costData.budget.accommodation}/night) instead of ${firstDay.accommodation.type} to save across ${nights} nights.`,
        source: 'analysis',
      });
    }
  }

  return { optimizations, cheaperVenues };
}

// ---------------------------------------------------------------------------
// getDealAlerts
// ---------------------------------------------------------------------------

export async function getDealAlerts(
  destination: string,
): Promise<SonarResult | null> {
  try {
    return await fetchSonarResult(destination, 'events', {
      budget: 'Current deals, discounts, free events this week',
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// getFreeDayPlan
// ---------------------------------------------------------------------------

export async function getFreeDayPlan(
  destination: string,
): Promise<SonarResult | null> {
  try {
    return await fetchSonarResult(destination, 'local', {
      budget: 'Plan a completely free day — only free museums, parks, viewpoints, walking routes',
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook: useCostOptimizer
// ---------------------------------------------------------------------------

export function useCostOptimizer(
  tripId: string | undefined,
  destination: string | undefined,
): CostOptimizerResult {
  const [optimizations, setOptimizations] = useState<CostOptimization[]>([]);
  const [deals, setDeals] = useState<SonarResult | null>(null);
  const [freePlan, setFreePlan] = useState<SonarResult | null>(null);
  const [cheaperVenues, setCheaperVenues] = useState<FSQPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trips = useAppStore((s) => s.trips);

  const trip = useMemo(
    () => trips.find((t) => t.id === tripId),
    [trips, tripId],
  );

  const itinerary = useMemo(() => {
    if (!trip?.itinerary) return null;
    return parseItinerary(trip.itinerary);
  }, [trip?.itinerary]);

  const fetchAll = useCallback(async () => {
    if (!destination || !itinerary) return;
    setIsLoading(true);
    setError(null);

    try {
      const [optResult, dealsResult, freeResult] = await Promise.allSettled([
        optimizeTripCost(destination, itinerary, trip?.budget ?? ''),
        getDealAlerts(destination),
        getFreeDayPlan(destination),
      ]);

      if (optResult.status === 'fulfilled') {
        setOptimizations(optResult.value.optimizations);
        setCheaperVenues(optResult.value.cheaperVenues);
      }
      if (dealsResult.status === 'fulfilled') {
        setDeals(dealsResult.value);
      }
      if (freeResult.status === 'fulfilled') {
        setFreePlan(freeResult.value);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Optimization failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [destination, itinerary, trip?.budget]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalSavings = useMemo(
    () => optimizations.reduce((sum, o) => sum + o.savings, 0),
    [optimizations],
  );

  return {
    optimizations,
    deals,
    freePlan,
    totalSavings,
    cheaperVenues,
    isLoading,
    error,
  };
}
