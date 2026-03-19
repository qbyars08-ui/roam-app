// =============================================================================
// ROAM — Budget Tracker
// Compares actual spending against CRAFT itinerary budget
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useExpenseStore, type ExpenseCategory, type TripExpense } from './expense-store';
import type { Itinerary, BudgetBreakdown, ItineraryDay } from './types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BudgetCategory =
  | 'food'
  | 'transport'
  | 'activities'
  | 'accommodation'
  | 'shopping'
  | 'other';

export type CategoryBudget = {
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
};

export type BudgetComparison = {
  budget: number;
  actual: number;
  remaining: number;
  percentUsed: number;
  byCategory: Record<BudgetCategory, CategoryBudget>;
  dailyBurnRate: number;
  projectedTotal: number;
  daysLeft: number;
  daysElapsed: number;
  totalDays: number;
};

export type DailySpend = {
  date: string;
  amount: number;
  label: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_BUDGET_CATEGORIES: readonly BudgetCategory[] = [
  'food',
  'transport',
  'activities',
  'accommodation',
  'shopping',
  'other',
] as const;

/**
 * Maps expense store categories to budget categories.
 * The expense store has 'drinks' which we fold into 'food'.
 */
function mapExpenseToBudgetCategory(cat: ExpenseCategory): BudgetCategory {
  if (cat === 'drinks') return 'food';
  if (cat === 'food') return 'food';
  if (cat === 'transport') return 'transport';
  if (cat === 'activities') return 'activities';
  if (cat === 'accommodation') return 'accommodation';
  if (cat === 'shopping') return 'shopping';
  return 'other';
}

// ---------------------------------------------------------------------------
// Helpers — parse currency strings from itinerary
// ---------------------------------------------------------------------------

/**
 * Extracts a numeric dollar amount from strings like "$1,200", "~$850",
 * "$300–500" (takes the midpoint), or "$200/night".
 */
function parseDollarAmount(raw: string): number {
  if (!raw || typeof raw !== 'string') return 0;

  // Remove common prefixes/suffixes
  const cleaned = raw.replace(/[~≈]/g, '').trim();

  // Handle range like "$300–500" or "$300-500"
  const rangeMatch = cleaned.match(
    /\$?([\d,]+(?:\.\d+)?)\s*[–\-]\s*\$?([\d,]+(?:\.\d+)?)/,
  );
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
    return (low + high) / 2;
  }

  // Handle single amount like "$1,200"
  const singleMatch = cleaned.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (singleMatch) {
    return parseFloat(singleMatch[1].replace(/,/g, ''));
  }

  return 0;
}

/**
 * Parse a cost string from a TimeSlotActivity.
 * Examples: "$15-25", "Free", "$0", "~$40"
 */
function parseActivityCost(cost: string): number {
  if (!cost) return 0;
  const lower = cost.toLowerCase().trim();
  if (lower === 'free' || lower === '$0' || lower === '0') return 0;
  return parseDollarAmount(cost);
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Parse all costs from an itinerary, summing by budget category.
 * Returns the total budget and per-category breakdown.
 */
export function getBudgetFromItinerary(itinerary: Itinerary): {
  total: number;
  byCategory: Record<BudgetCategory, number>;
} {
  const byCategory: Record<BudgetCategory, number> = {
    food: 0,
    transport: 0,
    activities: 0,
    accommodation: 0,
    shopping: 0,
    other: 0,
  };

  // 1. Use budgetBreakdown if available (preferred — already summed)
  const bb = itinerary.budgetBreakdown;
  if (bb) {
    byCategory.accommodation = parseDollarAmount(bb.accommodation);
    byCategory.food = parseDollarAmount(bb.food);
    byCategory.activities = parseDollarAmount(bb.activities);
    byCategory.transport = parseDollarAmount(bb.transportation);
    // miscellaneous splits into shopping and other
    const misc = parseDollarAmount(bb.miscellaneous);
    byCategory.shopping = Math.round(misc * 0.5);
    byCategory.other = Math.round(misc * 0.5);
  }

  // 2. Compute total from budgetBreakdown or totalBudget
  const categorySum = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const parsedTotal = parseDollarAmount(itinerary.totalBudget);

  // If budgetBreakdown was missing or zero, fallback to per-day parsing
  if (categorySum === 0 && parsedTotal > 0) {
    // Distribute totalBudget using typical travel ratios
    byCategory.accommodation = Math.round(parsedTotal * 0.35);
    byCategory.food = Math.round(parsedTotal * 0.25);
    byCategory.activities = Math.round(parsedTotal * 0.15);
    byCategory.transport = Math.round(parsedTotal * 0.15);
    byCategory.shopping = Math.round(parsedTotal * 0.05);
    byCategory.other = Math.round(parsedTotal * 0.05);
  }

  const total = categorySum > 0 ? categorySum : parsedTotal;

  return { total, byCategory };
}

/**
 * Reads actual spending from the expense store, grouped by budget category.
 */
export function getActualSpending(
  expenses: readonly TripExpense[],
  currency = 'USD',
): Record<BudgetCategory, number> {
  const result: Record<BudgetCategory, number> = {
    food: 0,
    transport: 0,
    activities: 0,
    accommodation: 0,
    shopping: 0,
    other: 0,
  };

  for (const expense of expenses) {
    if (expense.currency !== currency) continue;
    const budgetCat = mapExpenseToBudgetCategory(expense.category);
    result[budgetCat] = result[budgetCat] + expense.amount;
  }

  return result;
}

/**
 * Returns daily spending breakdown for chart display.
 */
export function getDailyBreakdown(
  expenses: readonly TripExpense[],
  startDate: string | undefined,
  totalDays: number,
  currency = 'USD',
): DailySpend[] {
  if (!startDate || totalDays <= 0) return [];

  const start = new Date(startDate);
  const dailyMap = new Map<string, number>();

  // Initialize all days
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dailyMap.set(key, 0);
  }

  // Sum expenses by day
  for (const expense of expenses) {
    if (expense.currency !== currency) continue;
    const day = expense.createdAt.split('T')[0];
    if (dailyMap.has(day)) {
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + expense.amount);
    }
  }

  const result: DailySpend[] = [];
  let dayNum = 1;
  for (const [date, amount] of dailyMap) {
    result.push({
      date,
      amount: Math.round(amount * 100) / 100,
      label: `Day ${dayNum}`,
    });
    dayNum++;
  }

  return result;
}

/**
 * Full budget comparison: budget vs actual with projections.
 */
export function getBudgetComparison(
  itinerary: Itinerary,
  expenses: readonly TripExpense[],
  startDate: string | undefined,
  currency = 'USD',
): BudgetComparison {
  const { total: budget, byCategory: budgetByCategory } =
    getBudgetFromItinerary(itinerary);
  const actualByCategory = getActualSpending(expenses, currency);

  const actual = Object.values(actualByCategory).reduce((s, v) => s + v, 0);
  const remaining = budget - actual;
  const percentUsed = budget > 0 ? (actual / budget) * 100 : 0;

  // Days calculation
  const totalDays = itinerary.days.length;
  let daysElapsed = 1;

  if (startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    daysElapsed = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  }

  const daysLeft = Math.max(0, totalDays - daysElapsed);

  // Burn rate and projection
  const dailyBurnRate = daysElapsed > 0 ? actual / daysElapsed : 0;
  const projectedTotal = dailyBurnRate * totalDays;

  // Per-category comparison
  const byCategory = {} as Record<BudgetCategory, CategoryBudget>;
  for (const cat of ALL_BUDGET_CATEGORIES) {
    const budgeted = budgetByCategory[cat];
    const spent = actualByCategory[cat];
    const catRemaining = budgeted - spent;
    const catPercent = budgeted > 0 ? (spent / budgeted) * 100 : 0;

    byCategory[cat] = {
      budgeted,
      spent,
      remaining: catRemaining,
      percentUsed: catPercent,
    };
  }

  return {
    budget,
    actual,
    remaining,
    percentUsed,
    byCategory,
    dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
    projectedTotal: Math.round(projectedTotal * 100) / 100,
    daysLeft,
    daysElapsed,
    totalDays,
  };
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export type BudgetTrackerState = {
  comparison: BudgetComparison | null;
  dailyBreakdown: DailySpend[];
  loading: boolean;
  refresh: () => void;
};

/**
 * React hook that provides live budget tracking for a trip.
 */
export function useBudgetTracker(
  tripId: string,
  itinerary: Itinerary | null,
  startDate: string | undefined,
  currency = 'USD',
): BudgetTrackerState {
  const loadExpenses = useExpenseStore((s) => s.loadExpenses);
  const expensesMap = useExpenseStore((s) => s.expenses);
  const loading = useExpenseStore((s) => s.loading);

  const expenses = useMemo(
    () => expensesMap[tripId] ?? [],
    [expensesMap, tripId],
  );

  // Load expenses on mount
  useEffect(() => {
    if (tripId) {
      void loadExpenses(tripId);
    }
  }, [tripId, loadExpenses]);

  const comparison = useMemo(() => {
    if (!itinerary) return null;
    return getBudgetComparison(itinerary, expenses, startDate, currency);
  }, [itinerary, expenses, startDate, currency]);

  const dailyBreakdown = useMemo(() => {
    if (!itinerary) return [];
    return getDailyBreakdown(
      expenses,
      startDate,
      itinerary.days.length,
      currency,
    );
  }, [expenses, startDate, itinerary, currency]);

  const refresh = useCallback(() => {
    if (tripId) {
      void loadExpenses(tripId);
    }
  }, [tripId, loadExpenses]);

  return {
    comparison,
    dailyBreakdown,
    loading,
    refresh,
  };
}
