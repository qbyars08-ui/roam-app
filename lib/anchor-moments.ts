// =============================================================================
// ROAM — Anchor Moments Engine
// The Anti-Itinerary: 2-3 unmissable moments per day, intentional blank space,
// and real-time gap filling based on where you actually are.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSonarResult } from './sonar';
import { searchPlaces, type FSQPlace } from './apis/foursquare';
import { trackEvent } from './analytics';
import type { SonarResult } from './types/sonar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlankSpaceLabel =
  | 'morning wander'
  | 'afternoon drift'
  | 'evening explore'
  | 'late night';

export type FillStrategy =
  | 'nearby-trending'
  | 'weather-aware'
  | 'serendipity'
  | 'food-discovery';

export interface AnchorMoment {
  readonly time: string;
  readonly activity: string;
  readonly location: string;
  readonly why: string;
  readonly isUnmissable: boolean;
  readonly flexWindow: number; // minutes of flex around this
}

export interface BlankSpace {
  readonly startTime: string;
  readonly endTime: string;
  readonly label: BlankSpaceLabel;
  readonly fillStrategy: FillStrategy;
}

export interface AntiItineraryDay {
  readonly day: number;
  readonly anchors: readonly AnchorMoment[];
  readonly spaces: readonly BlankSpace[];
  readonly philosophy: string;
}

export interface AntiItinerary {
  readonly destination: string;
  readonly days: readonly AntiItineraryDay[];
  readonly totalDays: number;
  readonly style: string;
}

export interface LiveSuggestion {
  readonly id: string;
  readonly text: string;
  readonly detail: string;
  readonly source: 'foursquare' | 'sonar';
  readonly place: FSQPlace | null;
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// Parsing — extract anchor moments from Sonar's free-text response
// ---------------------------------------------------------------------------

function parseAnchorsFromText(
  text: string,
  totalDays: number,
): readonly AntiItineraryDay[] {
  const days: AntiItineraryDay[] = [];

  for (let d = 1; d <= totalDays; d++) {
    const dayRegex = new RegExp(
      `Day\\s*${d}[:\\s]*([\\s\\S]*?)(?=Day\\s*${d + 1}[:\\s]|$)`,
      'i',
    );
    const match = text.match(dayRegex);
    const section = match?.[1]?.trim() ?? '';

    const anchors: AnchorMoment[] = [];
    // Match lines like: "7:00 AM Activity description — why sentence"
    // or "7:00 AM — Activity. Why sentence."
    const lineRegex =
      /(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[—–-]?\s*(.+?)(?:\.\s*(.+?))?$/gim;
    let lineMatch: RegExpExecArray | null = null;

    while ((lineMatch = lineRegex.exec(section)) !== null) {
      const time = lineMatch[1].trim();
      const rawActivity = lineMatch[2].trim().replace(/\.$/, '');
      const rawWhy = lineMatch[3]?.trim().replace(/\.$/, '') ?? '';

      // Split on " — " or " - " if why wasn't captured in group 3
      let activity = rawActivity;
      let why = rawWhy;
      if (!why) {
        const dashSplit = rawActivity.split(/\s*[—–]\s*/);
        if (dashSplit.length > 1) {
          activity = dashSplit[0].trim();
          why = dashSplit.slice(1).join(' ').trim();
        }
      }

      anchors.push({
        time,
        activity,
        location: '',
        why: why || 'This one is worth your time.',
        isUnmissable: true,
        flexWindow: 60,
      });
    }

    // If regex didn't match, try simpler line-based parsing
    if (anchors.length === 0 && section.length > 0) {
      const lines = section
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 10);
      for (const line of lines.slice(0, 3)) {
        const timePart = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
        const rest = line
          .replace(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i, '')
          .replace(/^[\s—–-]+/, '')
          .trim();
        if (rest) {
          const parts = rest.split(/\s*[—–]\s*/);
          anchors.push({
            time: timePart?.[1] ?? '10:00 AM',
            activity: parts[0] ?? rest,
            location: '',
            why: parts[1] ?? 'Trust this one.',
            isUnmissable: true,
            flexWindow: 60,
          });
        }
      }
    }

    const spaces = buildBlankSpaces(anchors);
    const philosophies = [
      'The best trips have room to breathe.',
      'Leave space for what you cannot plan.',
      'Wander without direction. Find without searching.',
      'The gaps are where the stories happen.',
      'Not every hour needs a plan.',
    ];

    days.push({
      day: d,
      anchors,
      spaces,
      philosophy: philosophies[(d - 1) % philosophies.length],
    });
  }

  return days;
}

function buildBlankSpaces(anchors: readonly AnchorMoment[]): BlankSpace[] {
  const spaces: BlankSpace[] = [];

  if (anchors.length === 0) {
    return [
      { startTime: '8:00 AM', endTime: '12:00 PM', label: 'morning wander', fillStrategy: 'serendipity' },
      { startTime: '12:00 PM', endTime: '5:00 PM', label: 'afternoon drift', fillStrategy: 'nearby-trending' },
      { startTime: '5:00 PM', endTime: '10:00 PM', label: 'evening explore', fillStrategy: 'food-discovery' },
    ];
  }

  // Before first anchor
  spaces.push({
    startTime: '8:00 AM',
    endTime: anchors[0].time,
    label: 'morning wander',
    fillStrategy: 'serendipity',
  });

  // Between anchors
  for (let i = 0; i < anchors.length - 1; i++) {
    const label = getBlankSpaceLabel(anchors[i].time);
    spaces.push({
      startTime: anchors[i].time,
      endTime: anchors[i + 1].time,
      label,
      fillStrategy: label === 'evening explore' ? 'food-discovery' : 'nearby-trending',
    });
  }

  // After last anchor
  const lastAnchor = anchors[anchors.length - 1];
  spaces.push({
    startTime: lastAnchor.time,
    endTime: '10:00 PM',
    label: 'evening explore',
    fillStrategy: 'food-discovery',
  });

  return spaces;
}

function getBlankSpaceLabel(time: string): BlankSpaceLabel {
  const hourMatch = time.match(/(\d{1,2})/);
  const isPM = /PM/i.test(time);
  const hour = hourMatch ? parseInt(hourMatch[1], 10) + (isPM && parseInt(hourMatch[1], 10) !== 12 ? 12 : 0) : 12;

  if (hour < 12) return 'morning wander';
  if (hour < 17) return 'afternoon drift';
  if (hour < 22) return 'evening explore';
  return 'late night';
}

// ---------------------------------------------------------------------------
// Generate Anti-Itinerary — Sonar-powered anchor moments
// ---------------------------------------------------------------------------

export async function generateAntiItinerary(
  destination: string,
  days: number,
  style: string,
): Promise<AntiItinerary> {
  const result: SonarResult = await fetchSonarResult(
    destination,
    'local',
    {
      dates: `${days} days`,
      budget: style,
    },
  );

  const parsedDays = parseAnchorsFromText(result.answer, days);

  trackEvent('anti_itinerary_generated', {
    destination,
    days,
    style,
    anchorCount: parsedDays.reduce((sum, d) => sum + d.anchors.length, 0),
  });

  return {
    destination,
    days: parsedDays,
    totalDays: days,
    style,
  };
}

// ---------------------------------------------------------------------------
// Fill Blank Space — real-time gap filler
// Queries Foursquare for trending nearby + Sonar for live context
// ---------------------------------------------------------------------------

export async function fillBlankSpace(params: {
  destination: string;
  currentLocation: { lat: number; lng: number };
  weather: string | null;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'latenight';
  preferences: readonly string[];
}): Promise<readonly LiveSuggestion[]> {
  const { destination, currentLocation, weather, timeOfDay, preferences } = params;
  const suggestions: LiveSuggestion[] = [];

  // 1. Foursquare — trending nearby places
  const categoryMap: Record<string, string[]> = {
    morning: ['cafe', 'bakery', 'breakfast'],
    afternoon: ['museum', 'park', 'market', 'gallery'],
    evening: ['restaurant', 'bar', 'night market'],
    latenight: ['bar', 'late night', 'jazz'],
  };

  const query = categoryMap[timeOfDay]?.[0] ?? 'popular';
  const places = await searchPlaces(
    query,
    currentLocation.lat,
    currentLocation.lng,
    undefined,
    1500, // 1.5km radius
  );

  if (places) {
    for (const place of places.slice(0, 3)) {
      const distanceText = place.distance < 1000
        ? `${place.distance}m away`
        : `${(place.distance / 1000).toFixed(1)}km away`;
      const ratingText = place.rating ? ` Rating: ${place.rating}` : '';

      suggestions.push({
        id: `fsq_${place.fsqId}`,
        text: `${place.name} — ${distanceText}`,
        detail: `${place.category}.${ratingText}`,
        source: 'foursquare',
        place,
        timestamp: Date.now(),
      });
    }
  }

  // 2. Sonar — contextual live intelligence
  try {
    const weatherContext = weather ? ` Weather: ${weather}.` : '';
    const prefContext = preferences.length > 0 ? ` Interests: ${preferences.join(', ')}.` : '';
    const sonarResult = await fetchSonarResult(
      destination,
      'local',
      {
        dates: `right now, ${timeOfDay}`,
        budget: `near ${currentLocation.lat},${currentLocation.lng}.${weatherContext}${prefContext}`,
      },
    );

    if (sonarResult.answer) {
      const lines = sonarResult.answer
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 15)
        .slice(0, 2);

      for (const line of lines) {
        suggestions.push({
          id: `sonar_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: line.slice(0, 120),
          detail: 'Live suggestion',
          source: 'sonar',
          place: null,
          timestamp: Date.now(),
        });
      }
    }
  } catch {
    // Sonar failed — Foursquare suggestions are enough
  }

  trackEvent('blank_space_filled', {
    destination,
    timeOfDay,
    suggestionCount: suggestions.length,
  });

  return suggestions;
}

// ---------------------------------------------------------------------------
// useLiveGapFiller — React hook that auto-fills the current blank space
// Polls every 10 minutes while active
// ---------------------------------------------------------------------------

const GAP_FILL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface UseLiveGapFillerResult {
  readonly suggestions: readonly LiveSuggestion[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
}

export function useLiveGapFiller(
  destination: string | undefined,
  currentLocation: { lat: number; lng: number } | null,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'latenight',
  preferences: readonly string[],
): UseLiveGapFillerResult {
  const [suggestions, setSuggestions] = useState<readonly LiveSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!destination || !currentLocation) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const doFill = async () => {
      try {
        const result = await fillBlankSpace({
          destination,
          currentLocation,
          weather: null,
          timeOfDay,
          preferences,
        });
        if (!cancelled) {
          setSuggestions(result);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to get suggestions');
          setIsLoading(false);
        }
      }
    };

    doFill();

    // Auto-refresh every 10 minutes
    intervalRef.current = setInterval(() => {
      if (!cancelled) doFill();
    }, GAP_FILL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [destination, currentLocation?.lat, currentLocation?.lng, timeOfDay, refreshKey]);

  return { suggestions, isLoading, error, refresh };
}
