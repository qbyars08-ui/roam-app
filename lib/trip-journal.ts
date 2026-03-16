// =============================================================================
// ROAM — Trip Journal (local-first)
// Daily travel diary: mood, highlights, notes, and a highlight moment.
// AsyncStorage-backed, ready for Supabase sync.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNAL_KEY = 'roam_journal_entries';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type JournalMood = 'amazing' | 'great' | 'good' | 'meh' | 'rough';

export const JOURNAL_MOODS: { id: JournalMood; label: string; color: string }[] = [
  { id: 'amazing', label: 'Amazing', color: '#C9A84C' },
  { id: 'great', label: 'Great', color: '#7CAF8A' },
  { id: 'good', label: 'Good', color: '#4AC8E8' },
  { id: 'meh', label: 'Meh', color: '#8A8A8A' },
  { id: 'rough', label: 'Rough', color: '#E8614A' },
];

export interface JournalEntry {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string; // ISO date
  mood: JournalMood;
  highlight: string; // Best moment of the day
  notes: string; // Free-form diary text
  tags: string[]; // Quick tags: food, adventure, rest, etc.
  createdAt: string;
  updatedAt: string;
}

export const JOURNAL_TAGS = [
  'food', 'adventure', 'culture', 'rest', 'nightlife',
  'nature', 'shopping', 'transit', 'new friend', 'got lost',
  'best meal', 'sunset', 'museum', 'beach', 'hike',
];

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

async function getAllEntries(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(JOURNAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveEntries(entries: JournalEntry[]): Promise<void> {
  await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
}

export async function getJournalForTrip(tripId: string): Promise<JournalEntry[]> {
  const all = await getAllEntries();
  return all
    .filter((e) => e.tripId === tripId)
    .sort((a, b) => a.dayNumber - b.dayNumber);
}

export async function getJournalEntry(
  tripId: string,
  dayNumber: number
): Promise<JournalEntry | null> {
  const all = await getAllEntries();
  return all.find((e) => e.tripId === tripId && e.dayNumber === dayNumber) ?? null;
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const all = await getAllEntries();
  const idx = all.findIndex((e) => e.id === entry.id);
  const updated = idx >= 0
    ? all.map((e, i) => (i === idx ? { ...entry, updatedAt: new Date().toISOString() } : e))
    : [...all, entry];
  await saveEntries(updated);
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  const all = await getAllEntries();
  await saveEntries(all.filter((e) => e.id !== entryId));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createJournalEntry(params: {
  tripId: string;
  dayNumber: number;
  date: string;
  mood: JournalMood;
  highlight: string;
  notes: string;
  tags: string[];
}): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tripId: params.tripId,
    dayNumber: params.dayNumber,
    date: params.date,
    mood: params.mood,
    highlight: params.highlight,
    notes: params.notes,
    tags: params.tags,
    createdAt: now,
    updatedAt: now,
  };
}

export function getMoodColor(mood: JournalMood): string {
  return JOURNAL_MOODS.find((m) => m.id === mood)?.color ?? '#8A8A8A';
}

export function getMoodLabel(mood: JournalMood): string {
  return JOURNAL_MOODS.find((m) => m.id === mood)?.label ?? mood;
}

/**
 * Compute a trip's overall "vibe score" from journal entries.
 * Returns a 1-5 rating based on average mood.
 */
export function computeTripVibeScore(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const moodValues: Record<JournalMood, number> = {
    amazing: 5,
    great: 4,
    good: 3,
    meh: 2,
    rough: 1,
  };
  const sum = entries.reduce((acc, e) => acc + moodValues[e.mood], 0);
  return Math.round((sum / entries.length) * 10) / 10;
}
