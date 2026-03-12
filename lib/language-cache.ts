// =============================================================================
// ROAM — Language Survival offline cache
// Caches pack to AsyncStorage when destination selected for offline use
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LanguagePack } from './language-data';

const CACHE_KEY = 'roam_language_pack_cache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedPack {
  pack: LanguagePack;
  cachedAt: number;
}

export async function cacheLanguagePack(pack: LanguagePack): Promise<void> {
  try {
    const cached: CachedPack = { pack, cachedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {}
}

export async function getCachedLanguagePack(): Promise<LanguagePack | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedPack = JSON.parse(raw);
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) return null;
    return cached.pack;
  } catch {
    return null;
  }
}
