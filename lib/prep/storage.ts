// =============================================================================
// ROAM — PREP offline storage
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PrepSectionId } from './types';

const PREP_PREFIX = '@roam/prep/';

export async function getPrepSection(tripId: string, sectionId: PrepSectionId): Promise<string | null> {
  return AsyncStorage.getItem(`${PREP_PREFIX}${tripId}_${sectionId}`);
}

export async function setPrepSection(tripId: string, sectionId: PrepSectionId, data: string): Promise<void> {
  await AsyncStorage.setItem(`${PREP_PREFIX}${tripId}_${sectionId}`, data);
}

export async function getPrepProgress(tripId: string): Promise<Record<PrepSectionId, boolean> | null> {
  const raw = await AsyncStorage.getItem(`${PREP_PREFIX}progress_${tripId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function setPrepProgress(tripId: string, sections: Record<PrepSectionId, boolean>): Promise<void> {
  await AsyncStorage.setItem(`${PREP_PREFIX}progress_${tripId}`, JSON.stringify(sections));
}
