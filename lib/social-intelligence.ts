// =============================================================================
// ROAM — Social Intelligence Engine
// Smart social matching, venue recs, group activities, icebreakers
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAppStore } from './store';
import { fetchSonarResult } from './sonar';
import { ensureValidSession } from './ensure-session';
import type { TravelProfile } from './types/travel-profile';
import type { SonarQueryType } from './types/sonar';
import type { TravelStyle, VibeTag } from './types/social';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TravelerMatch {
  userId: string;
  displayName: string;
  avatar: string;
  destination: string;
  travelStyle: TravelStyle;
  matchScore: number; // 0-100
  sharedInterests: VibeTag[];
  overlappingDays: number;
}

export interface SocialVenue {
  name: string;
  type: 'hostel' | 'bar' | 'coworking' | 'tour' | 'meetup';
  description: string;
  soloTravelerFriendly: boolean;
}

export interface GroupDiningSpot {
  name: string;
  cuisine: string;
  groupSize: string;
  priceRange: string;
}

export interface SharedExperience {
  title: string;
  type: 'tour' | 'class' | 'pub-crawl' | 'workshop';
  pricePerPerson: string;
  groupSize: string;
  description: string;
}

export interface SocialIntelData {
  venues: SocialVenue[];
  diningSpots: GroupDiningSpot[];
  experiences: SharedExperience[];
  icebreaker: string;
  matches: TravelerMatch[];
}

// ---------------------------------------------------------------------------
// Style compatibility matrix (0-100)
// ---------------------------------------------------------------------------

const STYLE_COMPAT: Record<string, Record<string, number>> = {
  backpacker: { backpacker: 100, adventure: 90, 'slow-travel': 55, comfort: 30, luxury: 15, 'digital-nomad': 65 },
  adventure: { backpacker: 90, adventure: 100, 'slow-travel': 50, comfort: 55, luxury: 20, 'digital-nomad': 60 },
  comfort: { backpacker: 30, adventure: 55, 'slow-travel': 85, comfort: 100, luxury: 65, 'digital-nomad': 60 },
  luxury: { backpacker: 15, adventure: 20, 'slow-travel': 60, comfort: 65, luxury: 100, 'digital-nomad': 30 },
  'slow-travel': { backpacker: 55, adventure: 50, 'slow-travel': 100, comfort: 85, luxury: 60, 'digital-nomad': 75 },
  'digital-nomad': { backpacker: 65, adventure: 60, 'slow-travel': 75, comfort: 60, luxury: 30, 'digital-nomad': 100 },
};

function computeStyleScore(a: string, b: string): number {
  return STYLE_COMPAT[a]?.[b] ?? 50;
}

// ---------------------------------------------------------------------------
// Budget compatibility (travel profile pace 1-10)
// ---------------------------------------------------------------------------

function computeBudgetScore(myBudget: number, theirBudget: number): number {
  const diff = Math.abs(myBudget - theirBudget);
  if (diff <= 1) return 100;
  if (diff <= 3) return 70;
  if (diff <= 5) return 40;
  return 20;
}

// ---------------------------------------------------------------------------
// Vibe overlap
// ---------------------------------------------------------------------------

function computeVibeOverlap(a: VibeTag[], b: VibeTag[]): { score: number; shared: VibeTag[] } {
  const bSet = new Set(b);
  const shared = a.filter((v) => bSet.has(v));
  const total = new Set([...a, ...b]).size;
  const score = total > 0 ? Math.round((shared.length / total) * 100) : 0;
  return { score, shared };
}

// ---------------------------------------------------------------------------
// Date overlap (within +/- 3 days)
// ---------------------------------------------------------------------------

function computeDateOverlap(
  myStart: string,
  myEnd: string,
  theirStart: string,
  theirEnd: string,
): number {
  const ms = new Date(myStart).getTime();
  const me = new Date(myEnd).getTime();
  const ts = new Date(theirStart).getTime();
  const te = new Date(theirEnd).getTime();

  const overlapStart = Math.max(ms, ts);
  const overlapEnd = Math.min(me, te);

  if (overlapStart >= overlapEnd) return 0;
  const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));
  return overlapDays;
}

// ---------------------------------------------------------------------------
// findTravelBuddies — queries Supabase for matching travelers
// ---------------------------------------------------------------------------

export async function findTravelBuddies(
  myTrip: { destination: string; startDate: string; endDate: string },
  myProfile: { travelStyle: TravelStyle; vibeTags: VibeTag[]; budgetStyle: number },
): Promise<TravelerMatch[]> {
  const hasSession = await ensureValidSession();
  if (!hasSession) return [];

  const userId = useAppStore.getState().session?.user?.id;
  if (!userId) return [];

  // Query for travelers going to same destination within +/- 3 days
  const windowStart = new Date(new Date(myTrip.startDate).getTime() - 3 * 86400000).toISOString();
  const windowEnd = new Date(new Date(myTrip.endDate).getTime() + 3 * 86400000).toISOString();

  try {
    const { data, error } = await supabase
      .from('trip_presences')
      .select('user_id, destination, arrival_date, departure_date, looking_for')
      .ilike('destination', myTrip.destination)
      .gte('departure_date', windowStart)
      .lte('arrival_date', windowEnd)
      .neq('user_id', userId)
      .limit(20);

    if (error || !data) return [];

    // Fetch social profiles for matched users
    const userIds = (data as Array<{ user_id: string }>).map((d) => d.user_id);
    if (userIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('social_profiles')
      .select('user_id, display_name, avatar_emoji, travel_style, vibe_tags')
      .in('user_id', userIds);

    const profileMap = new Map(
      ((profiles ?? []) as Array<{
        user_id: string;
        display_name: string;
        avatar_emoji: string;
        travel_style: string;
        vibe_tags: string[];
      }>).map((p) => [p.user_id, p]),
    );

    return (data as Array<{
      user_id: string;
      destination: string;
      arrival_date: string;
      departure_date: string;
      looking_for: string[];
    }>)
      .map((presence) => {
        const profile = profileMap.get(presence.user_id);
        const theirStyle = (profile?.travel_style ?? 'comfort') as TravelStyle;
        const theirVibes = (profile?.vibe_tags ?? []) as VibeTag[];

        const styleScore = computeStyleScore(myProfile.travelStyle, theirStyle);
        const { score: vibeScore, shared } = computeVibeOverlap(myProfile.vibeTags, theirVibes);
        const overlapDays = computeDateOverlap(
          myTrip.startDate, myTrip.endDate,
          presence.arrival_date, presence.departure_date,
        );
        const matchScore = Math.round(styleScore * 0.35 + vibeScore * 0.45 + Math.min(overlapDays * 10, 100) * 0.20);

        return {
          userId: presence.user_id,
          displayName: profile?.display_name ?? 'Traveler',
          avatar: profile?.avatar_emoji ?? '',
          destination: presence.destination,
          travelStyle: theirStyle,
          matchScore,
          sharedInterests: shared,
          overlappingDays: overlapDays,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getSocialVenueRecommendations — Sonar-powered
// ---------------------------------------------------------------------------

export async function getSocialVenueRecommendations(
  destination: string,
): Promise<SocialVenue[]> {
  try {
    const result = await fetchSonarResult(destination, 'meetups' as SonarQueryType);
    const lines = result.answer.split('\n').filter((l) => l.trim().length > 0);

    return lines.slice(0, 6).map((line): SocialVenue => {
      const cleaned = line.replace(/^[-*\d.]+\s*/, '').trim();
      const isHostel = /hostel/i.test(cleaned);
      const isBar = /bar|pub|nightlife/i.test(cleaned);
      const isCowork = /cowork|cafe|coffee/i.test(cleaned);
      const isTour = /tour|group/i.test(cleaned);

      return {
        name: cleaned.split(/[:.–—]/)[0]?.trim() ?? cleaned,
        type: isHostel ? 'hostel' : isBar ? 'bar' : isCowork ? 'coworking' : isTour ? 'tour' : 'meetup',
        description: cleaned,
        soloTravelerFriendly: true,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getGroupDiningSpots — fallback curated data
// ---------------------------------------------------------------------------

export async function getGroupDiningSpots(
  destination: string,
  groupSize: number,
): Promise<GroupDiningSpot[]> {
  try {
    const result = await fetchSonarResult(destination, 'food' as SonarQueryType, {
      budget: groupSize > 4 ? 'moderate' : 'any',
    });
    const lines = result.answer.split('\n').filter((l) => l.trim().length > 0);

    return lines.slice(0, 5).map((line): GroupDiningSpot => {
      const cleaned = line.replace(/^[-*\d.]+\s*/, '').trim();
      return {
        name: cleaned.split(/[:.–—]/)[0]?.trim() ?? cleaned,
        cuisine: 'Local',
        groupSize: `${Math.max(2, groupSize)}+`,
        priceRange: '$$',
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getSharedExperiences — group activities
// ---------------------------------------------------------------------------

export async function getSharedExperiences(
  destination: string,
): Promise<SharedExperience[]> {
  try {
    const result = await fetchSonarResult(destination, 'events' as SonarQueryType);
    const lines = result.answer.split('\n').filter((l) => l.trim().length > 0);

    return lines.slice(0, 5).map((line): SharedExperience => {
      const cleaned = line.replace(/^[-*\d.]+\s*/, '').trim();
      const isPubCrawl = /pub crawl|bar crawl|nightlife/i.test(cleaned);
      const isClass = /class|workshop|cooking|lesson/i.test(cleaned);
      const isTour = /tour|walk|guide/i.test(cleaned);

      return {
        title: cleaned.split(/[:.–—]/)[0]?.trim() ?? cleaned,
        type: isPubCrawl ? 'pub-crawl' : isClass ? 'class' : isTour ? 'tour' : 'workshop',
        pricePerPerson: '$20–50',
        groupSize: '2–12',
        description: cleaned,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// generateIcebreaker — Sonar one-liner
// ---------------------------------------------------------------------------

export async function generateIcebreaker(
  destination: string,
  sharedInterest?: string,
): Promise<string> {
  try {
    const context = sharedInterest ? { budget: sharedInterest } : undefined;
    const result = await fetchSonarResult(destination, 'local' as SonarQueryType, context);
    const firstLine = result.answer.split('\n').find((l) => l.trim().length > 10);
    return firstLine?.replace(/^[-*\d.]+\s*/, '').trim() ?? `What surprised you most about ${destination}?`;
  } catch {
    return `What surprised you most about ${destination}?`;
  }
}

// ---------------------------------------------------------------------------
// useSocialIntel — React hook combining all social intelligence
// ---------------------------------------------------------------------------

interface UseSocialIntelResult {
  venues: SocialVenue[];
  diningSpots: GroupDiningSpot[];
  experiences: SharedExperience[];
  icebreaker: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSocialIntel(destination: string | undefined): UseSocialIntelResult {
  const [venues, setVenues] = useState<SocialVenue[]>([]);
  const [diningSpots, setDiningSpots] = useState<GroupDiningSpot[]>([]);
  const [experiences, setExperiences] = useState<SharedExperience[]>([]);
  const [icebreaker, setIcebreaker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!destination) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      getSocialVenueRecommendations(destination),
      getGroupDiningSpots(destination, 4),
      getSharedExperiences(destination),
      generateIcebreaker(destination),
    ])
      .then((results) => {
        if (cancelled) return;

        const [venueResult, diningResult, expResult, iceResult] = results;
        if (venueResult.status === 'fulfilled') setVenues(venueResult.value);
        if (diningResult.status === 'fulfilled') setDiningSpots(diningResult.value);
        if (expResult.status === 'fulfilled') setExperiences(expResult.value);
        if (iceResult.status === 'fulfilled') setIcebreaker(iceResult.value);

        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load social intel');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [destination, fetchKey]);

  return { venues, diningSpots, experiences, icebreaker, loading, error, refetch };
}
