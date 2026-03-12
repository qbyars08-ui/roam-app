// =============================================================================
// ROAM — Content freshness agent
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const FRESHNESS_PREFIX = '@roam/freshness/';
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getContentFreshness(
  key: string
): Promise<{ data: unknown; updatedToday: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(`${FRESHNESS_PREFIX}${key}`);
    if (!raw) return null;
    const { data, updatedAt } = JSON.parse(raw);
    const updatedToday = Date.now() - updatedAt < DAY_MS;
    return { data, updatedToday };
  } catch {
    return null;
  }
}

export async function setContentFreshness(key: string, data: unknown): Promise<void> {
  await AsyncStorage.setItem(
    `${FRESHNESS_PREFIX}${key}`,
    JSON.stringify({ data, updatedAt: Date.now() })
  );
}

export async function needsRefresh(key: string): Promise<boolean> {
  const cached = await getContentFreshness(key);
  if (!cached) return true;
  return !cached.updatedToday;
}
