// =============================================================================
// ROAM — Perplexity Sonar Client Module
// Live travel intelligence with AsyncStorage cache (6hr TTL)
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAppStore } from './store';
import { trackEvent } from './analytics';
import { ensureValidSession } from './ensure-session';
import { CACHE_SONAR_PREFIX } from './storage-keys';
import { getPersonaConfig } from './traveler-persona';
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
// Session guard — shared via lib/ensure-session.ts
// ---------------------------------------------------------------------------

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
  const hasSession = await ensureValidSession();
  if (!hasSession) throw new Error('Failed to create anonymous session');

  // 3. Inject persona modifier into context
  const travelerPersona = useAppStore.getState().travelerPersona;
  const personaModifier = travelerPersona
    ? getPersonaConfig(travelerPersona).sonarPromptModifier
    : undefined;

  const enrichedContext = personaModifier
    ? { ...context, personaModifier }
    : context;

  // 4. Call edge function
  const { data, error } = await supabase.functions.invoke('sonar-proxy', {
    body: { destination, queryType, context: enrichedContext },
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
const SONAR_TIMEOUT_MS = 10_000;

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Safety timeout — if the query hasn't resolved after 10s, bail out
    timeoutRef.current = setTimeout(() => {
      if (!cancelled) {
        setIsLoading(false);
        setError('timeout');
      }
    }, SONAR_TIMEOUT_MS);

    fetchSonarResult(destination, queryType)
      .then((result) => {
        if (!cancelled) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          const msg =
            err instanceof Error ? err.message : 'Sonar query failed';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
