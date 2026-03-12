// =============================================================================
// ROAM — Packing List Persistence (AsyncStorage)
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'roam_packing_';

export async function savePackingChecked(tripId: string, checkedIds: string[]): Promise<void> {
  await AsyncStorage.setItem(PREFIX + tripId, JSON.stringify(checkedIds));
}

export async function loadPackingChecked(tripId: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + tripId);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}
