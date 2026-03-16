import { useState, useEffect, useCallback } from 'react';
import {
  getMyTripPresences,
  getTripPresenceFeed,
  postTripPresence,
  removeTripPresence,
} from '../social';
import type { TripPresence, VibeTag } from '../types/social';

interface PostTripPresenceParams {
  destination: string;
  arrivalDate: string;
  departureDate: string;
  lookingFor: VibeTag[];
}

interface UseTripPresenceResult {
  myPresences: TripPresence[];
  feed: TripPresence[];
  postPresence: (params: PostTripPresenceParams) => Promise<TripPresence | null>;
  removePresence: (id: string) => Promise<void>;
  loading: boolean;
}

export function useTripPresence(): UseTripPresenceResult {
  const [myPresences, setMyPresences] = useState<TripPresence[]>([]);
  const [feed, setFeed] = useState<TripPresence[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, feedResults] = await Promise.all([
        getMyTripPresences(),
        getTripPresenceFeed(),
      ]);
      setMyPresences(mine ?? []);
      setFeed(feedResults ?? []);
    } catch {
      setMyPresences([]);
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const postPresence = useCallback(
    async (params: PostTripPresenceParams): Promise<TripPresence | null> => {
      try {
        const created = await postTripPresence(params);
        await fetchAll();
        return created;
      } catch {
        return null;
      }
    },
    [fetchAll],
  );

  const removePresence = useCallback(
    async (id: string): Promise<void> => {
      try {
        await removeTripPresence(id);
        await fetchAll();
      } catch {
        // silently handle removal errors
      }
    },
    [fetchAll],
  );

  return { myPresences, feed, postPresence, removePresence, loading };
}
