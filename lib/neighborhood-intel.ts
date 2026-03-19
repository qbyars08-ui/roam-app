// =============================================================================
// ROAM — Neighborhood Intelligence
// Discover the vibe, safety, and walkability of destination neighborhoods
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSonarResult } from './sonar';
import { searchPlaces, type FSQPlace } from './apis/foursquare';
import { geocodeCity } from './geocoding';
import { DESTINATIONS, HIDDEN_DESTINATIONS } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Neighborhood {
  readonly name: string;
  readonly vibe: string;
  readonly bestFor: readonly string[];
  readonly walkability: 1 | 2 | 3 | 4 | 5;
  readonly safety: 1 | 2 | 3 | 4 | 5;
  readonly priceLevel: 1 | 2 | 3;
  readonly bestTimeToVisit: string;
  readonly sonarInsight?: string;
}

interface UseNeighborhoodsResult {
  readonly neighborhoods: readonly Neighborhood[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly selected: Neighborhood | null;
  readonly setSelected: (n: Neighborhood | null) => void;
  readonly refetch: () => void;
}

// ---------------------------------------------------------------------------
// Sonar query — fetch neighborhoods for a destination
// ---------------------------------------------------------------------------

export async function getNeighborhoods(
  destination: string,
): Promise<readonly Neighborhood[]> {
  const result = await fetchSonarResult(destination, 'neighborhoods');
  return parseNeighborhoodResponse(result.answer);
}

// ---------------------------------------------------------------------------
// Parser — extract structured Neighborhood[] from Sonar text
// ---------------------------------------------------------------------------

function clamp<T extends number>(val: number, min: T, max: T): T {
  return Math.max(min, Math.min(max, Math.round(val))) as T;
}

export function parseNeighborhoodResponse(
  answer: string,
): readonly Neighborhood[] {
  const neighborhoods: Neighborhood[] = [];

  // Split by numbered items (1. Name, 2. Name, etc.) or markdown headers
  const sections = answer.split(/(?:^|\n)(?:\d+\.\s+\*{0,2}|#{1,3}\s+)/).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split('\n').filter((l) => l.trim());
    if (lines.length === 0) continue;

    // First line typically has the neighborhood name
    const nameMatch = lines[0].match(/^[*]*([A-Za-z\s''\-/().&]+)[*]*/);
    if (!nameMatch) continue;

    const name = nameMatch[1]
      .replace(/\*+/g, '')
      .replace(/[:\-–]+$/, '')
      .trim();
    if (!name || name.length < 2 || name.length > 60) continue;

    const block = lines.join(' ').toLowerCase();

    // Extract vibe (one-word descriptor)
    const vibeMatch = block.match(/vibe[:\s]*[*]*([a-z\-]+)/i);
    const vibe = vibeMatch ? vibeMatch[1].replace(/[*]/g, '').trim() : 'diverse';

    // Extract best for (comma-separated list)
    const bestForMatch = block.match(/best\s+for[:\s]*([^.\n]+)/i);
    const bestFor = bestForMatch
      ? bestForMatch[1]
          .split(/[,;&]+/)
          .map((s) => s.replace(/[*]/g, '').trim())
          .filter((s) => s.length > 1 && s.length < 40)
          .slice(0, 5)
      : [];

    // Extract numeric scores
    const walkMatch = block.match(/walkability[:\s]*(\d)/);
    const safetyMatch = block.match(/safety[:\s]*(\d)/);
    const priceMatch = block.match(/price\s*(?:level)?[:\s]*(\d)/);

    const walkability = walkMatch
      ? clamp(parseInt(walkMatch[1], 10), 1 as 1, 5 as 5)
      : (3 as 1 | 2 | 3 | 4 | 5);
    const safety = safetyMatch
      ? clamp(parseInt(safetyMatch[1], 10), 1 as 1, 5 as 5)
      : (3 as 1 | 2 | 3 | 4 | 5);
    const priceLevel = priceMatch
      ? clamp(parseInt(priceMatch[1], 10), 1 as 1, 3 as 3)
      : (2 as 1 | 2 | 3);

    // Extract best time to visit
    const timeMatch = block.match(/best\s+time(?:\s+to\s+visit)?[:\s]*([^.\n]+)/i);
    const bestTimeToVisit = timeMatch
      ? timeMatch[1].replace(/[*]/g, '').trim().slice(0, 60)
      : 'anytime';

    // Extract warning / insight (anything after "warning" or "note" or "tip")
    const insightMatch = block.match(/(?:warning|note|tip|caution|heads up)[:\s]*([^.\n]+)/i);
    const sonarInsight = insightMatch
      ? insightMatch[1].replace(/[*]/g, '').trim().slice(0, 120)
      : undefined;

    neighborhoods.push({
      name,
      vibe,
      bestFor: bestFor.length > 0 ? bestFor : ['exploring'],
      walkability,
      safety,
      priceLevel,
      bestTimeToVisit,
      sonarInsight,
    });
  }

  return neighborhoods.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Foursquare — venues in a neighborhood
// ---------------------------------------------------------------------------

export async function getNeighborhoodVenues(
  neighborhood: string,
  destination: string,
  category?: string,
): Promise<readonly FSQPlace[]> {
  // Resolve coords: try known destinations first, then geocode
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const known = all.find(
    (d) => d.label.toLowerCase() === destination.toLowerCase(),
  );

  let lat: number;
  let lng: number;

  if (known) {
    lat = known.lat;
    lng = known.lng;
  } else {
    const geo = await geocodeCity(destination);
    if (!geo) return [];
    lat = geo.latitude;
    lng = geo.longitude;
  }

  const query = category
    ? `${category} in ${neighborhood}`
    : neighborhood;

  const places = await searchPlaces(query, lat, lng, undefined, 2000);
  return places ?? [];
}

// ---------------------------------------------------------------------------
// React hook — useNeighborhoods
// ---------------------------------------------------------------------------

export function useNeighborhoods(
  destination: string | undefined,
): UseNeighborhoodsResult {
  const [neighborhoods, setNeighborhoods] = useState<readonly Neighborhood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Neighborhood | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const mountedRef = useRef(true);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!destination) {
      setNeighborhoods([]);
      setLoading(false);
      setError(null);
      setSelected(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getNeighborhoods(destination)
      .then((result) => {
        if (cancelled || !mountedRef.current) return;
        setNeighborhoods(result);
        setSelected(result[0] ?? null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled || !mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load neighborhoods');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [destination, fetchKey]);

  const handleSetSelected = useCallback((n: Neighborhood | null) => {
    setSelected(n);
  }, []);

  return {
    neighborhoods,
    loading,
    error,
    selected,
    setSelected: handleSetSelected,
    refetch,
  };
}
