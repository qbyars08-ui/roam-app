// =============================================================================
// ROAM — Savings Goals Store (Zustand + Supabase)
// Tracks trip savings goals and transactions
// =============================================================================

import { create } from 'zustand';
import { supabase } from './supabase';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SavingsGoal = {
  id: string;
  destination: string;
  targetAmount: number;
  currency: string;
  savedAmount: number;
  deadline: string | null;
  autoSaveWeekly: number | null;
  dreamTripId: string | null;
  tripId: string | null;
  createdAt: string;
};

export type SavingsTransaction = {
  id: string;
  goalId: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type GoalProgress = {
  saved: number;
  target: number;
  percentage: number;
  weeksToGo: number | null;
};

// ---------------------------------------------------------------------------
// Row converters (Supabase snake_case → camelCase)
// ---------------------------------------------------------------------------

function rowToGoal(row: Record<string, unknown>): SavingsGoal {
  return {
    id: String(row.id ?? ''),
    destination: String(row.destination ?? ''),
    targetAmount: Number(row.target_amount ?? 0),
    currency: String(row.currency ?? 'USD'),
    savedAmount: Number(row.saved_amount ?? 0),
    deadline: row.deadline ? String(row.deadline) : null,
    autoSaveWeekly: row.auto_save_weekly != null ? Number(row.auto_save_weekly) : null,
    dreamTripId: row.dream_trip_id ? String(row.dream_trip_id) : null,
    tripId: row.trip_id ? String(row.trip_id) : null,
    createdAt: String(row.created_at ?? ''),
  };
}

function rowToTransaction(row: Record<string, unknown>): SavingsTransaction {
  return {
    id: String(row.id ?? ''),
    goalId: String(row.goal_id ?? ''),
    amount: Number(row.amount ?? 0),
    note: row.note ? String(row.note) : null,
    createdAt: String(row.created_at ?? ''),
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type SavingsState = {
  goals: SavingsGoal[];
  transactions: Record<string, SavingsTransaction[]>;
  loading: boolean;

  loadGoals: () => Promise<void>;
  loadTransactions: (goalId: string) => Promise<void>;
  createGoal: (goal: {
    destination: string;
    targetAmount: number;
    currency?: string;
    deadline?: string | null;
    autoSaveWeekly?: number | null;
    dreamTripId?: string | null;
    tripId?: string | null;
  }) => Promise<SavingsGoal | null>;
  addSavings: (goalId: string, amount: number, note?: string) => Promise<boolean>;
  withdrawSavings: (goalId: string, amount: number, note?: string) => Promise<boolean>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  getGoalProgress: (goalId: string) => GoalProgress;
};

export const useSavingsStore = create<SavingsState>((set, get) => ({
  goals: [],
  transactions: {},
  loading: false,

  loadGoals: async () => {
    const userId = useAppStore.getState().session?.user?.id;
    if (!userId) return;

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ROAM] loadGoals error:', error.message);
        return;
      }
      const goals = (data ?? []).map((r: Record<string, unknown>) => rowToGoal(r));
      set({ goals });
    } catch (err: unknown) {
      console.warn('[ROAM] loadGoals failed:', err instanceof Error ? err.message : String(err));
    } finally {
      set({ loading: false });
    }
  },

  loadTransactions: async (goalId: string) => {
    const userId = useAppStore.getState().session?.user?.id;
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[ROAM] loadTransactions error:', error.message);
        return;
      }
      const txns = (data ?? []).map((r: Record<string, unknown>) => rowToTransaction(r));
      set((s) => ({
        transactions: { ...s.transactions, [goalId]: txns },
      }));
    } catch (err: unknown) {
      console.warn('[ROAM] loadTransactions failed:', err instanceof Error ? err.message : String(err));
    }
  },

  createGoal: async (goal) => {
    const userId = useAppStore.getState().session?.user?.id;
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: userId,
          destination: goal.destination,
          target_amount: goal.targetAmount,
          currency: goal.currency ?? 'USD',
          deadline: goal.deadline ?? null,
          auto_save_weekly: goal.autoSaveWeekly ?? null,
          dream_trip_id: goal.dreamTripId ?? null,
          trip_id: goal.tripId ?? null,
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('[ROAM] createGoal error:', error?.message);
        return null;
      }
      const newGoal = rowToGoal(data as Record<string, unknown>);
      set((s) => ({ goals: [newGoal, ...s.goals] }));
      return newGoal;
    } catch (err: unknown) {
      console.warn('[ROAM] createGoal failed:', err instanceof Error ? err.message : String(err));
      return null;
    }
  },

  addSavings: async (goalId, amount, note) => {
    const userId = useAppStore.getState().session?.user?.id;
    if (!userId || amount <= 0) return false;

    try {
      const { error: txnError } = await supabase
        .from('savings_transactions')
        .insert({
          goal_id: goalId,
          user_id: userId,
          amount,
          note: note ?? null,
        });

      if (txnError) {
        console.warn('[ROAM] addSavings txn error:', txnError.message);
        return false;
      }

      // Update goal saved_amount
      const goal = get().goals.find((g) => g.id === goalId);
      if (!goal) return false;

      const newSaved = goal.savedAmount + amount;
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({ saved_amount: newSaved, updated_at: new Date().toISOString() })
        .eq('id', goalId);

      if (updateError) {
        console.warn('[ROAM] addSavings update error:', updateError.message);
        return false;
      }

      set((s) => ({
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, savedAmount: newSaved } : g
        ),
      }));

      // Reload transactions for this goal
      get().loadTransactions(goalId);
      return true;
    } catch (err: unknown) {
      console.warn('[ROAM] addSavings failed:', err instanceof Error ? err.message : String(err));
      return false;
    }
  },

  withdrawSavings: async (goalId, amount, note) => {
    const userId = useAppStore.getState().session?.user?.id;
    if (!userId || amount <= 0) return false;

    try {
      const { error: txnError } = await supabase
        .from('savings_transactions')
        .insert({
          goal_id: goalId,
          user_id: userId,
          amount: -amount,
          note: note ?? null,
        });

      if (txnError) {
        console.warn('[ROAM] withdrawSavings txn error:', txnError.message);
        return false;
      }

      const goal = get().goals.find((g) => g.id === goalId);
      if (!goal) return false;

      const newSaved = Math.max(0, goal.savedAmount - amount);
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({ saved_amount: newSaved, updated_at: new Date().toISOString() })
        .eq('id', goalId);

      if (updateError) {
        console.warn('[ROAM] withdrawSavings update error:', updateError.message);
        return false;
      }

      set((s) => ({
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, savedAmount: newSaved } : g
        ),
      }));

      get().loadTransactions(goalId);
      return true;
    } catch (err: unknown) {
      console.warn('[ROAM] withdrawSavings failed:', err instanceof Error ? err.message : String(err));
      return false;
    }
  },

  deleteGoal: async (goalId) => {
    const userId = useAppStore.getState().session?.user?.id;
    if (!userId) return false;

    try {
      // Delete transactions first
      await supabase
        .from('savings_transactions')
        .delete()
        .eq('goal_id', goalId)
        .eq('user_id', userId);

      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId);

      if (error) {
        console.warn('[ROAM] deleteGoal error:', error.message);
        return false;
      }

      set((s) => ({
        goals: s.goals.filter((g) => g.id !== goalId),
        transactions: Object.fromEntries(
          Object.entries(s.transactions).filter(([k]) => k !== goalId)
        ),
      }));
      return true;
    } catch (err: unknown) {
      console.warn('[ROAM] deleteGoal failed:', err instanceof Error ? err.message : String(err));
      return false;
    }
  },

  getGoalProgress: (goalId) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return { saved: 0, target: 0, percentage: 0, weeksToGo: null };

    const percentage = goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
      : 0;

    let weeksToGo: number | null = null;
    if (goal.deadline && goal.autoSaveWeekly && goal.autoSaveWeekly > 0) {
      const remaining = goal.targetAmount - goal.savedAmount;
      if (remaining > 0) {
        weeksToGo = Math.ceil(remaining / goal.autoSaveWeekly);
      } else {
        weeksToGo = 0;
      }
    } else if (goal.deadline) {
      const now = new Date();
      const deadlineDate = new Date(goal.deadline);
      const msLeft = deadlineDate.getTime() - now.getTime();
      if (msLeft > 0) {
        weeksToGo = Math.ceil(msLeft / (7 * 24 * 60 * 60 * 1000));
      } else {
        weeksToGo = 0;
      }
    }

    return {
      saved: goal.savedAmount,
      target: goal.targetAmount,
      percentage,
      weeksToGo,
    };
  },
}));
