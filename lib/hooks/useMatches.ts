import { useState, useEffect, useCallback } from 'react';
import { getMyMatches } from '../social';
import { supabase } from '../supabase';
import type { SquadMatch } from '../types/social';

interface UseMatchesResult {
  matches: SquadMatch[];
  loading: boolean;
  refetch: () => void;
}

export function useMatches(): UseMatchesResult {
  const [matches, setMatches] = useState<SquadMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getMyMatches();
      setMatches(results ?? []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    const channel = supabase
      .channel('squad_matches_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'squad_matches' },
        () => {
          fetchMatches();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  const refetch = useCallback(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, refetch };
}
