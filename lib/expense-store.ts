// =============================================================================
// ROAM — Expense Store (Zustand + Supabase)
// Group trip cost splitting and settlement tracking
// =============================================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'drinks'
  | 'shopping'
  | 'other';

export type TripExpense = {
  id: string;
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: string;
  splitWith: string[];
  createdAt: string;
};

export type ExpenseSettlement = {
  id: string;
  tripId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  currency: string;
  settled: boolean;
  createdAt: string;
};

export type UserBalance = {
  userId: string;
  /** positive = user is owed money, negative = user owes money */
  netBalance: number;
};

export type DebtSummary = {
  fromUser: string;
  toUser: string;
  amount: number;
  currency: string;
};

export type CategorySpend = Record<ExpenseCategory, number>;

// ---------------------------------------------------------------------------
// Row converters — Supabase snake_case → camelCase
// ---------------------------------------------------------------------------

function rowToExpense(row: Record<string, unknown>): TripExpense {
  return {
    id: String(row.id ?? ''),
    tripId: String(row.trip_id ?? ''),
    userId: String(row.user_id ?? ''),
    description: String(row.description ?? ''),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? 'USD'),
    category: (row.category as ExpenseCategory) ?? 'other',
    paidBy: String(row.paid_by ?? ''),
    splitWith: Array.isArray(row.split_with) ? (row.split_with as string[]) : [],
    createdAt: String(row.created_at ?? ''),
  };
}

function rowToSettlement(row: Record<string, unknown>): ExpenseSettlement {
  return {
    id: String(row.id ?? ''),
    tripId: String(row.trip_id ?? ''),
    fromUser: String(row.from_user ?? ''),
    toUser: String(row.to_user ?? ''),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? 'USD'),
    settled: Boolean(row.settled ?? false),
    createdAt: String(row.created_at ?? ''),
  };
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const CACHE_KEY_PREFIX = '@roam/expenses::';
const SETTLEMENTS_CACHE_KEY_PREFIX = '@roam/settlements::';

async function cacheExpenses(tripId: string, expenses: TripExpense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY_PREFIX + tripId, JSON.stringify(expenses));
  } catch {
    // Non-critical
  }
}

async function loadCachedExpenses(tripId: string): Promise<TripExpense[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + tripId);
    return raw ? (JSON.parse(raw) as TripExpense[]) : null;
  } catch {
    return null;
  }
}

async function cacheSettlements(tripId: string, settlements: ExpenseSettlement[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTLEMENTS_CACHE_KEY_PREFIX + tripId, JSON.stringify(settlements));
  } catch {
    // Non-critical
  }
}

async function loadCachedSettlements(tripId: string): Promise<ExpenseSettlement[] | null> {
  try {
    const raw = await AsyncStorage.getItem(SETTLEMENTS_CACHE_KEY_PREFIX + tripId);
    return raw ? (JSON.parse(raw) as ExpenseSettlement[]) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Balance calculator — simplifies debts using a greedy algorithm
// ---------------------------------------------------------------------------

function calculateSimplifiedDebts(
  expenses: TripExpense[],
  currency: string,
): DebtSummary[] {
  // Build net balance map: userId → net amount (positive = owed, negative = owes)
  const balances: Record<string, number> = {};

  for (const expense of expenses) {
    if (expense.currency !== currency) continue;

    const participants = [expense.paidBy, ...expense.splitWith];
    const uniqueParticipants = Array.from(new Set(participants));
    if (uniqueParticipants.length === 0) continue;

    const share = expense.amount / uniqueParticipants.length;

    // Payer is owed the full amount
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount;

    // Each participant owes their share
    for (const uid of uniqueParticipants) {
      balances[uid] = (balances[uid] ?? 0) - share;
    }
  }

  // Greedy simplification: match creditors with debtors
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0.005)
    .map(([uid, b]) => ({ uid, balance: b }))
    .sort((a, b) => b.balance - a.balance);

  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -0.005)
    .map(([uid, b]) => ({ uid, balance: -b }))
    .sort((a, b) => b.balance - a.balance);

  const debts: DebtSummary[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const settled = Math.min(creditor.balance, debtor.balance);

    if (settled > 0.005) {
      debts.push({
        fromUser: debtor.uid,
        toUser: creditor.uid,
        amount: Math.round(settled * 100) / 100,
        currency,
      });
    }

    creditor.balance -= settled;
    debtor.balance -= settled;

    if (creditor.balance < 0.005) ci++;
    if (debtor.balance < 0.005) di++;
  }

  return debts;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type ExpenseState = {
  expenses: Record<string, TripExpense[]>;       // keyed by tripId
  settlements: Record<string, ExpenseSettlement[]>; // keyed by tripId
  loading: boolean;

  loadExpenses: (tripId: string) => Promise<void>;

  addExpense: (params: {
    tripId: string;
    description: string;
    amount: number;
    currency?: string;
    category: ExpenseCategory;
    paidBy: string;
    splitWith: string[];
  }) => Promise<TripExpense | null>;

  deleteExpense: (expenseId: string, tripId: string) => Promise<boolean>;

  settleUp: (params: {
    tripId: string;
    fromUser: string;
    toUser: string;
    amount: number;
    currency?: string;
  }) => Promise<boolean>;

  markSettled: (settlementId: string, tripId: string) => Promise<boolean>;

  getBalances: (tripId: string, currency?: string) => DebtSummary[];
  getTotalSpent: (tripId: string, currency?: string) => number;
  getDailyAverage: (tripId: string, currency?: string) => number;
  getSpentByCategory: (tripId: string, currency?: string) => CategorySpend;
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: {},
  settlements: {},
  loading: false,

  // ── Load ──────────────────────────────────────────────────────────────────

  loadExpenses: async (tripId: string) => {
    set({ loading: true });

    // Serve from cache while fetching
    const cached = await loadCachedExpenses(tripId);
    const cachedSettlements = await loadCachedSettlements(tripId);
    if (cached) {
      set((s) => ({ expenses: { ...s.expenses, [tripId]: cached } }));
    }
    if (cachedSettlements) {
      set((s) => ({ settlements: { ...s.settlements, [tripId]: cachedSettlements } }));
    }

    try {
      const [expensesResult, settlementsResult] = await Promise.all([
        supabase
          .from('trip_expenses')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false }),
        supabase
          .from('expense_settlements')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false }),
      ]);

      if (expensesResult.error) {
        console.warn('[ROAM] loadExpenses error:', expensesResult.error.message);
      } else {
        const expenses = (expensesResult.data ?? []).map((r: Record<string, unknown>) =>
          rowToExpense(r),
        );
        set((s) => ({ expenses: { ...s.expenses, [tripId]: expenses } }));
        void cacheExpenses(tripId, expenses);
      }

      if (settlementsResult.error) {
        console.warn('[ROAM] loadSettlements error:', settlementsResult.error.message);
      } else {
        const settlements = (settlementsResult.data ?? []).map((r: Record<string, unknown>) =>
          rowToSettlement(r),
        );
        set((s) => ({ settlements: { ...s.settlements, [tripId]: settlements } }));
        void cacheSettlements(tripId, settlements);
      }
    } catch (err: unknown) {
      console.warn('[ROAM] loadExpenses failed:', err instanceof Error ? err.message : String(err));
    } finally {
      set({ loading: false });
    }
  },

  // ── Add expense ───────────────────────────────────────────────────────────

  addExpense: async ({ tripId, description, amount, currency = 'USD', category, paidBy, splitWith }) => {
    const userId = useAppStore.getState().session?.user?.id;
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('trip_expenses')
        .insert({
          trip_id: tripId,
          user_id: userId,
          description,
          amount,
          currency,
          category,
          paid_by: paidBy,
          split_with: splitWith,
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('[ROAM] addExpense error:', error?.message);
        return null;
      }

      const newExpense = rowToExpense(data as Record<string, unknown>);
      set((s) => {
        const existing = s.expenses[tripId] ?? [];
        const updated = [newExpense, ...existing];
        void cacheExpenses(tripId, updated);
        return { expenses: { ...s.expenses, [tripId]: updated } };
      });
      return newExpense;
    } catch (err: unknown) {
      console.warn('[ROAM] addExpense failed:', err instanceof Error ? err.message : String(err));
      return null;
    }
  },

  // ── Delete expense ────────────────────────────────────────────────────────

  deleteExpense: async (expenseId: string, tripId: string) => {
    try {
      const { error } = await supabase
        .from('trip_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.warn('[ROAM] deleteExpense error:', error.message);
        return false;
      }

      set((s) => {
        const updated = (s.expenses[tripId] ?? []).filter((e) => e.id !== expenseId);
        void cacheExpenses(tripId, updated);
        return { expenses: { ...s.expenses, [tripId]: updated } };
      });
      return true;
    } catch (err: unknown) {
      console.warn('[ROAM] deleteExpense failed:', err instanceof Error ? err.message : String(err));
      return false;
    }
  },

  // ── Settle up — record a payment ─────────────────────────────────────────

  settleUp: async ({ tripId, fromUser, toUser, amount, currency = 'USD' }) => {
    try {
      const { data, error } = await supabase
        .from('expense_settlements')
        .insert({
          trip_id: tripId,
          from_user: fromUser,
          to_user: toUser,
          amount,
          currency,
          settled: true,
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('[ROAM] settleUp error:', error?.message);
        return false;
      }

      const newSettlement = rowToSettlement(data as Record<string, unknown>);
      set((s) => {
        const existing = s.settlements[tripId] ?? [];
        const updated = [newSettlement, ...existing];
        void cacheSettlements(tripId, updated);
        return { settlements: { ...s.settlements, [tripId]: updated } };
      });
      return true;
    } catch (err: unknown) {
      console.warn('[ROAM] settleUp failed:', err instanceof Error ? err.message : String(err));
      return false;
    }
  },

  // ── Mark existing settlement as settled ───────────────────────────────────

  markSettled: async (settlementId: string, tripId: string) => {
    try {
      const { error } = await supabase
        .from('expense_settlements')
        .update({ settled: true })
        .eq('id', settlementId);

      if (error) {
        console.warn('[ROAM] markSettled error:', error.message);
        return false;
      }

      set((s) => {
        const updated = (s.settlements[tripId] ?? []).map((s) =>
          s.id === settlementId ? { ...s, settled: true } : s,
        );
        void cacheSettlements(tripId, updated);
        return { settlements: { ...s.settlements, [tripId]: updated } };
      });
      return true;
    } catch (err: unknown) {
      console.warn('[ROAM] markSettled failed:', err instanceof Error ? err.message : String(err));
      return false;
    }
  },

  // ── Derived calculations ──────────────────────────────────────────────────

  getBalances: (tripId: string, currency = 'USD'): DebtSummary[] => {
    const expenses = get().expenses[tripId] ?? [];
    return calculateSimplifiedDebts(expenses, currency);
  },

  getTotalSpent: (tripId: string, currency = 'USD'): number => {
    const expenses = get().expenses[tripId] ?? [];
    return expenses
      .filter((e) => e.currency === currency)
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getDailyAverage: (tripId: string, currency = 'USD'): number => {
    const expenses = get().expenses[tripId] ?? [];
    const filtered = expenses.filter((e) => e.currency === currency);
    if (filtered.length === 0) return 0;

    const timestamps = filtered.map((e) => new Date(e.createdAt).getTime());
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const daysDiff = Math.max(1, Math.round((maxTs - minTs) / (24 * 60 * 60 * 1000)) + 1);

    const total = filtered.reduce((sum, e) => sum + e.amount, 0);
    return total / daysDiff;
  },

  getSpentByCategory: (tripId: string, currency = 'USD'): CategorySpend => {
    const expenses = get().expenses[tripId] ?? [];
    const result: CategorySpend = {
      food: 0,
      transport: 0,
      accommodation: 0,
      activities: 0,
      drinks: 0,
      shopping: 0,
      other: 0,
    };

    for (const expense of expenses) {
      if (expense.currency !== currency) continue;
      result[expense.category] = (result[expense.category] ?? 0) + expense.amount;
    }

    return result;
  },
}));
