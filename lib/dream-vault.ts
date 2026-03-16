// =============================================================================
// ROAM — Dream Vault
// Persist and manage the user's travel wishlist with savings tracking.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DreamEntry {
  destination: string;
  country: string;
  savedAt: string; // ISO date string
  note?: string; // "why I want to go"
  estimatedCost?: number;
}

export interface DreamVault {
  entries: DreamEntry[];
  monthlySavings?: number; // user's self-reported monthly savings rate
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@roam/dream-vault';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const EMPTY_VAULT: DreamVault = { entries: [] };

async function readVault(): Promise<DreamVault> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_VAULT;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'entries' in parsed &&
      Array.isArray((parsed as DreamVault).entries)
    ) {
      return parsed as DreamVault;
    }
    return EMPTY_VAULT;
  } catch {
    return EMPTY_VAULT;
  }
}

async function writeVault(vault: DreamVault): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return the full dream vault from storage.
 */
export async function getDreamVault(): Promise<DreamVault> {
  return readVault();
}

/**
 * Save a new destination to the vault. Ignores duplicates (by destination name).
 */
export async function saveDream(
  entry: Omit<DreamEntry, 'savedAt'>,
): Promise<void> {
  const vault = await readVault();
  const alreadySaved = vault.entries.some(
    (e) => e.destination.toLowerCase() === entry.destination.toLowerCase(),
  );
  if (alreadySaved) return;

  const newEntry: DreamEntry = {
    ...entry,
    savedAt: new Date().toISOString(),
  };

  await writeVault({
    ...vault,
    entries: [...vault.entries, newEntry],
  });
}

/**
 * Remove a destination from the vault by name (case-insensitive).
 */
export async function removeDream(destination: string): Promise<void> {
  const vault = await readVault();
  await writeVault({
    ...vault,
    entries: vault.entries.filter(
      (e) => e.destination.toLowerCase() !== destination.toLowerCase(),
    ),
  });
}

/**
 * Update the personal note for a saved destination.
 */
export async function updateDreamNote(
  destination: string,
  note: string,
): Promise<void> {
  const vault = await readVault();
  await writeVault({
    ...vault,
    entries: vault.entries.map((e) =>
      e.destination.toLowerCase() === destination.toLowerCase()
        ? { ...e, note }
        : e,
    ),
  });
}

/**
 * Set the user's self-reported monthly savings amount.
 */
export async function setMonthlySavings(amount: number): Promise<void> {
  const vault = await readVault();
  await writeVault({ ...vault, monthlySavings: amount });
}

/**
 * Calculate how many full days have passed since the entry was saved.
 */
export function getDaysSinceSaved(entry: DreamEntry): number {
  const savedMs = new Date(entry.savedAt).getTime();
  const nowMs = Date.now();
  return Math.floor((nowMs - savedMs) / (1000 * 60 * 60 * 24));
}

/**
 * How many whole months of saving at `monthlySavings` to reach the estimated
 * cost. Returns null if estimatedCost is not set or monthlySavings <= 0.
 */
export function getMonthsToAfford(
  entry: DreamEntry,
  monthlySavings: number,
): number | null {
  if (!entry.estimatedCost || monthlySavings <= 0) return null;
  return Math.ceil(entry.estimatedCost / monthlySavings);
}

/**
 * Check whether a destination is already in the vault.
 */
export async function isDreamSaved(destination: string): Promise<boolean> {
  const vault = await readVault();
  return vault.entries.some(
    (e) => e.destination.toLowerCase() === destination.toLowerCase(),
  );
}
