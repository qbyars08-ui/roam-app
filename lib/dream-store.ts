// =============================================================================
// ROAM — Dream Board Zustand Store
// Save, edit, and manage potential future trip ideas
// =============================================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type DreamTrip = {
  id: string;
  destination: string;
  title: string | null;
  notes: string | null;
  photoUrl: string | null;
  estimatedBudget: number | null;
  estimatedDays: number | null;
  travelMonth: string | null;
  priority: 'next' | 'soon' | 'someday';
  tags: string[];
  inspirationLinks: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DreamTripInsert = Omit<DreamTrip, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DREAMS_STORAGE_KEY = 'roam_dream_trips';

function persistDreams(dreams: readonly DreamTrip[]): void {
  AsyncStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(dreams)).catch((err: unknown) => {
    console.warn('[ROAM] Dream persist failed:', err instanceof Error ? err.message : String(err));
  });
}

// Map Supabase row to DreamTrip (snake_case -> camelCase)
function rowToDream(row: Record<string, unknown>): DreamTrip {
  return {
    id: String(row.id ?? ''),
    destination: String(row.destination ?? ''),
    title: row.title != null ? String(row.title) : null,
    notes: row.notes != null ? String(row.notes) : null,
    photoUrl: row.photo_url != null ? String(row.photo_url) : null,
    estimatedBudget: row.estimated_budget != null ? Number(row.estimated_budget) : null,
    estimatedDays: row.estimated_days != null ? Number(row.estimated_days) : null,
    travelMonth: row.travel_month != null ? String(row.travel_month) : null,
    priority: (['next', 'soon', 'someday'].includes(String(row.priority))
      ? String(row.priority)
      : 'someday') as DreamTrip['priority'],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    inspirationLinks: Array.isArray(row.inspiration_links) ? (row.inspiration_links as string[]) : [],
    isArchived: Boolean(row.is_archived),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

// Map DreamTrip fields to Supabase row (camelCase -> snake_case)
function dreamToRow(dream: Partial<DreamTripInsert>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (dream.destination !== undefined) row.destination = dream.destination;
  if (dream.title !== undefined) row.title = dream.title;
  if (dream.notes !== undefined) row.notes = dream.notes;
  if (dream.photoUrl !== undefined) row.photo_url = dream.photoUrl;
  if (dream.estimatedBudget !== undefined) row.estimated_budget = dream.estimatedBudget;
  if (dream.estimatedDays !== undefined) row.estimated_days = dream.estimatedDays;
  if (dream.travelMonth !== undefined) row.travel_month = dream.travelMonth;
  if (dream.priority !== undefined) row.priority = dream.priority;
  if (dream.tags !== undefined) row.tags = dream.tags;
  if (dream.inspirationLinks !== undefined) row.inspiration_links = dream.inspirationLinks;
  return row;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
type DreamState = {
  dreams: DreamTrip[];
  isLoading: boolean;

  loadDreams: () => Promise<void>;
  addDream: (dream: DreamTripInsert) => Promise<DreamTrip | null>;
  updateDream: (id: string, updates: Partial<DreamTripInsert>) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  promoteDreamToTrip: (dreamId: string) => void;
  isDreamSaved: (destination: string) => boolean;
  toggleDreamByDestination: (destination: string) => Promise<void>;
};

export const useDreamStore = create<DreamState>((set, get) => ({
  dreams: [],
  isLoading: false,

  // Fetch from Supabase, fallback to AsyncStorage cache
  loadDreams: async () => {
    set({ isLoading: true });
    try {
      const session = useAppStore.getState().session;
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('dream_trips')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const dreams = (data as Record<string, unknown>[]).map(rowToDream);
          set({ dreams });
          persistDreams(dreams);
          set({ isLoading: false });
          return;
        }
      }
      // Fallback: load from cache
      const cached = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as DreamTrip[];
        set({ dreams: parsed });
      }
    } catch {
      // Try cache on any error
      try {
        const cached = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
        if (cached) {
          set({ dreams: JSON.parse(cached) as DreamTrip[] });
        }
      } catch {
        // silent
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addDream: async (dream) => {
    const session = useAppStore.getState().session;
    const userId = session?.user?.id;

    // Optimistic local insert
    const tempId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();
    const newDream: DreamTrip = {
      id: tempId,
      destination: dream.destination,
      title: dream.title,
      notes: dream.notes,
      photoUrl: dream.photoUrl,
      estimatedBudget: dream.estimatedBudget,
      estimatedDays: dream.estimatedDays,
      travelMonth: dream.travelMonth,
      priority: dream.priority,
      tags: dream.tags,
      inspirationLinks: dream.inspirationLinks,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    set((s) => {
      const updated = [newDream, ...s.dreams];
      persistDreams(updated);
      return { dreams: updated };
    });

    // Remote insert
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('dream_trips')
          .insert({ ...dreamToRow(dream), user_id: userId })
          .select()
          .single();

        if (!error && data) {
          const remoteDream = rowToDream(data as Record<string, unknown>);
          set((s) => {
            const updated = s.dreams.map((d) => (d.id === tempId ? remoteDream : d));
            persistDreams(updated);
            return { dreams: updated };
          });
          return remoteDream;
        }
      } catch {
        // Keep optimistic local version
      }
    }
    return newDream;
  },

  updateDream: async (id, updates) => {
    // Optimistic update
    set((s) => {
      const updated = s.dreams.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d,
      );
      persistDreams(updated);
      return { dreams: updated };
    });

    // Remote update
    const session = useAppStore.getState().session;
    if (session?.user?.id) {
      try {
        await supabase
          .from('dream_trips')
          .update({ ...dreamToRow(updates), updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', session.user.id);
      } catch {
        // silent — local state is source of truth
      }
    }
  },

  // Soft delete (archive)
  deleteDream: async (id) => {
    set((s) => {
      const updated = s.dreams.filter((d) => d.id !== id);
      persistDreams(updated);
      return { dreams: updated };
    });

    const session = useAppStore.getState().session;
    if (session?.user?.id) {
      try {
        await supabase
          .from('dream_trips')
          .update({ is_archived: true, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', session.user.id);
      } catch {
        // silent
      }
    }
  },

  promoteDreamToTrip: (dreamId) => {
    const dream = get().dreams.find((d) => d.id === dreamId);
    if (!dream) return;

    const { setPlanWizard, setGenerateMode } = useAppStore.getState();
    const budgetMap: Record<string, string> = {
      // Map estimated budget to closest budget tier
    };
    let budgetTier = '';
    if (dream.estimatedBudget != null) {
      const daily = dream.estimatedDays
        ? dream.estimatedBudget / dream.estimatedDays
        : dream.estimatedBudget;
      if (daily <= 75) budgetTier = 'backpacker';
      else if (daily <= 200) budgetTier = 'comfort';
      else if (daily <= 500) budgetTier = 'treat-yourself';
      else budgetTier = 'no-budget';
    }

    setPlanWizard({
      destination: dream.destination,
      days: dream.estimatedDays ? String(dream.estimatedDays) : '7',
      budget: budgetTier,
      vibes: [],
    });
    setGenerateMode('quick');
  },

  isDreamSaved: (destination) => {
    return get().dreams.some(
      (d) => d.destination.toLowerCase() === destination.toLowerCase() && !d.isArchived,
    );
  },

  toggleDreamByDestination: async (destination) => {
    const existing = get().dreams.find(
      (d) => d.destination.toLowerCase() === destination.toLowerCase() && !d.isArchived,
    );
    if (existing) {
      await get().deleteDream(existing.id);
    } else {
      await get().addDream({
        destination,
        title: null,
        notes: null,
        photoUrl: null,
        estimatedBudget: null,
        estimatedDays: null,
        travelMonth: null,
        priority: 'someday',
        tags: [],
        inspirationLinks: [],
      });
    }
  },
}));

// ---------------------------------------------------------------------------
// Load persisted dreams on app start
// ---------------------------------------------------------------------------
export async function loadPersistedDreams(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(DREAMS_STORAGE_KEY);
    if (cached) {
      const dreams = JSON.parse(cached) as DreamTrip[];
      useDreamStore.setState({ dreams });
    }
  } catch {
    // silent — first launch or corrupt data
  }
}
