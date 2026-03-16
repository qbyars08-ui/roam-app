// =============================================================================
// ROAM — Expense Tracker (local-first)
// Track actual spending vs AI budget estimate during/after a trip.
// AsyncStorage-backed, ready for Supabase sync.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENSES_KEY = 'roam_expenses';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'drinks'
  | 'tips'
  | 'other';

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; emoji: string }[] = [
  { id: 'food', label: 'Food & Dining', emoji: '\u{1F35C}' },
  { id: 'transport', label: 'Transport', emoji: '\u{1F695}' },
  { id: 'accommodation', label: 'Accommodation', emoji: '\u{1F3E8}' },
  { id: 'activities', label: 'Activities', emoji: '\u{1F3AB}' },
  { id: 'shopping', label: 'Shopping', emoji: '\u{1F6CD}\uFE0F' },
  { id: 'drinks', label: 'Drinks', emoji: '\u{1F37B}' },
  { id: 'tips', label: 'Tips', emoji: '\u{1F4B0}' },
  { id: 'other', label: 'Other', emoji: '\u{1F4CC}' },
];

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note: string;
  dayNumber: number;
  createdAt: string;
}

export interface TripExpenseSummary {
  tripId: string;
  totalSpent: number;
  currency: string;
  byCategory: Record<ExpenseCategory, number>;
  byDay: Record<number, number>;
  expenseCount: number;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

async function getAllExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

export async function getExpensesForTrip(tripId: string): Promise<Expense[]> {
  const all = await getAllExpenses();
  return all
    .filter((e) => e.tripId === tripId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addExpense(expense: Expense): Promise<void> {
  const all = await getAllExpenses();
  const updated = [...all, expense];
  await saveExpenses(updated);
}

export async function removeExpense(expenseId: string): Promise<void> {
  const all = await getAllExpenses();
  const filtered = all.filter((e) => e.id !== expenseId);
  await saveExpenses(filtered);
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Pick<Expense, 'amount' | 'category' | 'note' | 'dayNumber'>>
): Promise<void> {
  const all = await getAllExpenses();
  const updated = all.map((e) =>
    e.id === expenseId ? { ...e, ...updates } : e
  );
  await saveExpenses(updated);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export async function getTripExpenseSummary(
  tripId: string,
  currency = 'USD'
): Promise<TripExpenseSummary> {
  const expenses = await getExpensesForTrip(tripId);

  const byCategory: Record<ExpenseCategory, number> = {
    food: 0,
    transport: 0,
    accommodation: 0,
    activities: 0,
    shopping: 0,
    drinks: 0,
    tips: 0,
    other: 0,
  };

  const byDay: Record<number, number> = {};
  let totalSpent = 0;

  for (const expense of expenses) {
    totalSpent += expense.amount;
    byCategory[expense.category] = (byCategory[expense.category] ?? 0) + expense.amount;
    byDay[expense.dayNumber] = (byDay[expense.dayNumber] ?? 0) + expense.amount;
  }

  return {
    tripId,
    totalSpent,
    currency,
    byCategory,
    byDay,
    expenseCount: expenses.length,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createExpense(params: {
  tripId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  note: string;
  dayNumber: number;
}): Expense {
  return {
    id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tripId: params.tripId,
    amount: params.amount,
    currency: params.currency,
    category: params.category,
    note: params.note,
    dayNumber: params.dayNumber,
    createdAt: new Date().toISOString(),
  };
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
