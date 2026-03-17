// =============================================================================
// ROAM — Perplexity Sonar Client Module
// Live travel intelligence with AsyncStorage cache (6hr TTL)
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAppStore } from './store';
import { trackEvent } from './analytics';
import { CACHE_SONAR_PREFIX } from './storage-keys';
import type {
  SonarQueryType,
  SonarCitation,
  SonarResult,
} from './types/sonar';

// ---------------------------------------------------------------------------
// Cache (AsyncStorage, 6hr TTL — mirrors server-side TTL)
// ---------------------------------------------------------------------------
const TTL_MS = 6 * 60 * 60 * 1000;

function cacheKey(destination: string, queryType: SonarQueryType): string {
  return (
    CACHE_SONAR_PREFIX +
    destination.toLowerCase().replace(/\s+/g, '_') +
    '_' +
    queryType
  );
}

async function getCached(
  destination: string,
  queryType: SonarQueryType
): Promise<SonarResult | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(destination, queryType));
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw) as {
      data: SonarResult;
      cachedAt: number;
    };
    if (Date.now() - cachedAt > TTL_MS) return null;
    return { ...data, isLive: false };
  } catch {
    return null;
  }
}

async function setCache(
  destination: string,
  queryType: SonarQueryType,
  result: SonarResult
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      cacheKey(destination, queryType),
      JSON.stringify({ data: result, cachedAt: Date.now() })
    );
  } catch {
    // silent — cache is best-effort
  }
}

// ---------------------------------------------------------------------------
// ensureValidSession — reuse pattern from lib/claude.ts
// ---------------------------------------------------------------------------
async function ensureValidSession(): Promise<void> {
  const session = useAppStore.getState().session;
  const needsUpgrade =
    !session ||
    !session.access_token ||
    String(session.user?.id).startsWith('guest-');

  if (!needsUpgrade) {
    const {
      data: { session: refreshed },
    } = await supabase.auth.getSession();
    if (refreshed && refreshed.access_token !== session?.access_token) {
      useAppStore.getState().setSession(refreshed);
    }
    return;
  }

  const {
    data: { session: anonSession },
    error,
  } = await supabase.auth.signInAnonymously();
  if (error || !anonSession) {
    throw new Error('Failed to create anonymous session');
  }
  useAppStore.getState().setSession(anonSession);
}

// ---------------------------------------------------------------------------
// Core fetch — calls sonar-proxy edge function
// ---------------------------------------------------------------------------
export async function fetchSonarResult(
  destination: string,
  queryType: SonarQueryType,
  context?: { dates?: string; budget?: string }
): Promise<SonarResult> {
  // 1. Check local cache first
  const cached = await getCached(destination, queryType);
  if (cached) return cached;

  // 2. Ensure auth
  await ensureValidSession();

  // 3. Call edge function
  const { data, error } = await supabase.functions.invoke('sonar-proxy', {
    body: { destination, queryType, context },
  });

  if (error) {
    trackEvent('sonar_error', {
      destination,
      queryType,
      error: error.message ?? 'unknown',
    });
    throw new Error(error.message ?? 'Sonar query failed');
  }

  const result = data as SonarResult;

  // 4. Cache locally
  await setCache(destination, queryType, result);

  trackEvent('sonar_query', {
    destination,
    queryType,
    isLive: result.isLive,
    citationCount: result.citations?.length ?? 0,
  });

  return result;
}

// ---------------------------------------------------------------------------
// React hook — useSonarQuery
// ---------------------------------------------------------------------------
interface UseSonarQueryResult {
  data: SonarResult | null;
  isLoading: boolean;
  isLive: boolean;
  citations: SonarCitation[];
  error: string | null;
  refetch: () => void;
}

export function useSonarQuery(
  destination: string | undefined,
  queryType: SonarQueryType
): UseSonarQueryResult {
  const [data, setData] = useState<SonarResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!destination) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchSonarResult(destination, queryType)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Sonar query failed';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [destination, queryType, fetchKey]);

  return {
    data,
    isLoading,
    isLive: data?.isLive ?? false,
    citations: data?.citations ?? [],
    error,
    refetch,
  };
}
