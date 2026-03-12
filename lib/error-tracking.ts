// =============================================================================
// ROAM — Auto-error detection and fixing
// Never show blank screen or raw error to users
// =============================================================================

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ERROR_STORAGE_KEY = '@roam/error_counts';
const THRESHOLD = 3;

interface ErrorCount {
  key: string;
  count: number;
  lastAt: number;
}

async function getErrorCounts(): Promise<Record<string, ErrorCount>> {
  try {
    const raw = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function incrementError(
  key: string,
  screen: string,
  message: string,
  payload?: Record<string, unknown>
): Promise<void> {
  const counts = await getErrorCounts();
  const now = Date.now();
  const prev = counts[key];
  const count = (prev?.count ?? 0) + 1;

  counts[key] = { key, count, lastAt: now };
  await AsyncStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(counts));

  if (count >= THRESHOLD) {
    try {
      await supabase.from('error_logs').insert({
        error_type: key.split(':')[0] ?? 'unknown',
        screen,
        message: message.slice(0, 500),
        occurrence_count: count,
        last_seen_at: new Date().toISOString(),
        payload: payload ?? {},
      });
    } catch {
      // Don't fail on logging
    }
  }
}

export async function trackError(
  screen: string,
  errorType: string,
  error: unknown,
  payload?: Record<string, unknown>
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const key = `${errorType}:${screen}:${message.slice(0, 50)}`;
  await incrementError(key, screen, message, payload);
}

export function withErrorTracking<T>(
  fn: () => Promise<T>,
  options: { screen: string; errorType: string; fallback: T; payload?: Record<string, unknown> }
): Promise<T> {
  return fn().catch(async (err) => {
    await trackError(options.screen, options.errorType, err, options.payload);
    return options.fallback;
  });
}
