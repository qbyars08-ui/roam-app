import { useState, useEffect, useCallback } from 'react';
import { findSquadCandidates, swipeCandidate } from '../social';
import type { SquadCandidate, SwipeDirection } from '../types/social';

interface SwipeResult {
  matched: boolean;
  matchId?: string;
}

interface UseSquadFinderResult {
  candidates: SquadCandidate[];
  loading: boolean;
  swipe: (
    presenceId: string,
    userId: string,
    direction: SwipeDirection,
  ) => Promise<SwipeResult>;
  refetch: () => void;
}

interface UseSquadFinderParams {
  destination: string;
  arrivalDate: string;
  departureDate: string;
}

export function useSquadFinder({
  destination,
  arrivalDate,
  departureDate,
}: UseSquadFinderParams): UseSquadFinderResult {
  const [candidates, setCandidates] = useState<SquadCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = useCallback(async () => {
    if (!destination || !arrivalDate || !departureDate) return;

    setLoading(true);
    try {
      const results = await findSquadCandidates(
        destination,
        arrivalDate,
        departureDate,
      );
      setCandidates(results ?? []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [destination, arrivalDate, departureDate]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const refetch = useCallback(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const swipe = useCallback(
    async (
      presenceId: string,
      userId: string,
      direction: SwipeDirection,
    ): Promise<SwipeResult> => {
      try {
        const result = await swipeCandidate(presenceId, userId, direction);
        await fetchCandidates();
        return result ?? { matched: false };
      } catch {
        return { matched: false };
      }
    },
    [fetchCandidates],
  );

  return { candidates, loading, swipe, refetch };
}
