import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store';
import { getSocialProfile, upsertSocialProfile } from '../social';
import type { SocialProfile } from '../types/social';

interface UseSocialProfileResult {
  profile: SocialProfile | null;
  loading: boolean;
  error: boolean;
  refetch: () => void;
  upsert: (updates: Partial<SocialProfile>) => Promise<SocialProfile | null>;
}

export function useSocialProfile(): UseSocialProfileResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const profile = useAppStore((state) => state.socialProfile ?? null);
  const socialProfileLoaded = useAppStore((state) => state.socialProfileLoaded ?? false);
  const setSocialProfile = useAppStore((state) => state.setSocialProfile);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getSocialProfile();
      setSocialProfile(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [setSocialProfile]);

  useEffect(() => {
    if (!socialProfileLoaded) {
      fetchProfile();
    }
  }, [socialProfileLoaded, fetchProfile]);

  const refetch = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  const upsert = useCallback(
    async (updates: Partial<SocialProfile>): Promise<SocialProfile | null> => {
      setLoading(true);
      setError(false);
      try {
        const updated = await upsertSocialProfile(updates);
        if (updated) {
          setSocialProfile(updated);
        }
        return updated;
      } catch {
        setError(true);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setSocialProfile],
  );

  return { profile, loading, error, refetch, upsert };
}
