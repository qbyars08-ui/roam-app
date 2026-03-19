// =============================================================================
// ROAM — Live Trip Narration Engine
// Context-aware, GPS-driven narration that speaks like a friend who knows the city.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchSonarResult } from './sonar';
import { narrateText, stopNarration, isNarrating } from './elevenlabs';
import { searchPlaces, type FSQPlace } from './apis/foursquare';
import { getTimeOfDay, type TimeOfDay } from './here-now-context';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from './types/itinerary';
import type { CurrentWeather } from './apis/openweather';
import { CACHE_NARRATION_PREFIX } from './storage-keys';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NarrationContext {
  readonly destination: string;
  readonly neighborhood: string;
  readonly timeOfDay: TimeOfDay;
  readonly weather: string;
  readonly currentActivity: string;
  readonly nextActivity: string;
  readonly nearbyVenues: ReadonlyArray<{ name: string; category: string; distance: number }>;
  readonly userPreferences: ReadonlyArray<string>;
}

export interface NarrationResult {
  readonly text: string;
  readonly audioText: string;
  readonly timestamp: number;
  readonly context: NarrationContext;
}

export interface AutoNarrationState {
  readonly narration: NarrationResult | null;
  readonly isLoading: boolean;
  readonly isPlaying: boolean;
  readonly error: string | null;
  readonly play: () => Promise<void>;
  readonly dismiss: () => void;
  readonly refresh: () => void;
}

// ---------------------------------------------------------------------------
// Cache (AsyncStorage, 15-min TTL)
// ---------------------------------------------------------------------------

const NARRATION_TTL_MS = 15 * 60 * 1000;

function buildCacheKey(destination: string, lat: number, lng: number): string {
  const latRounded = Math.round(lat * 100) / 100;
  const lngRounded = Math.round(lng * 100) / 100;
  return `${CACHE_NARRATION_PREFIX}${destination.toLowerCase().replace(/\s+/g, '_')}_${latRounded}_${lngRounded}`;
}

async function getCachedNarration(key: string): Promise<NarrationResult | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw) as { data: NarrationResult; cachedAt: number };
    if (Date.now() - cachedAt > NARRATION_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCachedNarration(key: string, result: NarrationResult): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data: result, cachedAt: Date.now() }));
  } catch {
    // cache is best-effort
  }
}

// ---------------------------------------------------------------------------
// Activity resolver — determine current & next from itinerary + time
// ---------------------------------------------------------------------------

function resolveActivities(
  itinerary: Itinerary | null,
  dayIndex: number,
  timeOfDay: TimeOfDay,
): { current: string; next: string; nextHours: number; neighborhood: string } {
  const fallback = { current: 'exploring', next: 'wandering', nextHours: 0, neighborhood: '' };
  if (!itinerary) return fallback;

  const day: ItineraryDay | undefined = itinerary.days[dayIndex];
  if (!day) return fallback;

  const slotMap: Record<TimeOfDay, { slot: TimeSlotActivity; nextSlot: TimeSlotActivity | null; hours: number }> = {
    morning: { slot: day.morning, nextSlot: day.afternoon, hours: 3 },
    afternoon: { slot: day.afternoon, nextSlot: day.evening, hours: 4 },
    evening: { slot: day.evening, nextSlot: null, hours: 0 },
    latenight: { slot: day.evening, nextSlot: null, hours: 0 },
  };

  const { slot, nextSlot, hours } = slotMap[timeOfDay];
  return {
    current: slot.activity || 'exploring',
    next: nextSlot ? nextSlot.activity : 'heading back',
    nextHours: hours,
    neighborhood: slot.neighborhood || day.routeSummary || '',
  };
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function generateNarration(context: NarrationContext): string {
  const venueNames = context.nearbyVenues
    .slice(0, 5)
    .map((v) => `${v.name} (${v.category}, ${v.distance}m away)`)
    .join(', ');

  const venueContext = venueNames ? `Nearby: ${venueNames}.` : '';
  const weatherNote = context.weather ? `Weather: ${context.weather}.` : '';
  const prefNotes = context.userPreferences.length > 0
    ? `I like: ${context.userPreferences.join(', ')}.`
    : '';

  return [
    `I'm in ${context.neighborhood || context.destination} in ${context.destination}.`,
    `It's ${context.timeOfDay}. ${weatherNote}`,
    `I just finished ${context.currentActivity}.`,
    context.nextActivity !== 'heading back'
      ? `My next plan is ${context.nextActivity}.`
      : '',
    venueContext,
    prefNotes,
    'What should I know right now? Be specific — street names, restaurant names, prices.',
    'Talk like a friend who has been here before, not a guidebook.',
    'Keep it under 150 words. One or two paragraphs max.',
  ].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Orchestrator — gets venues, builds context, calls Sonar
// ---------------------------------------------------------------------------

export async function getNarrationForMoment(
  destination: string,
  lat: number,
  lng: number,
  itinerary: Itinerary | null,
  weather: CurrentWeather | null,
  dayIndex: number,
  vibes: ReadonlyArray<string>,
): Promise<NarrationResult> {
  const key = buildCacheKey(destination, lat, lng);
  const cached = await getCachedNarration(key);
  if (cached) return cached;

  const hour = new Date().getHours();
  const timeOfDay = getTimeOfDay(hour);
  const { current, next, neighborhood } = resolveActivities(itinerary, dayIndex, timeOfDay);

  // Fetch nearby venues (fire & forget if fails)
  let nearbyVenues: NarrationContext['nearbyVenues'] = [];
  try {
    const places = await searchPlaces('restaurants bars cafes', lat, lng, undefined, 500);
    if (places) {
      nearbyVenues = places.slice(0, 8).map((p: FSQPlace) => ({
        name: p.name,
        category: p.category,
        distance: p.distance,
      }));
    }
  } catch {
    // venues are supplemental — continue without
  }

  const weatherStr = weather
    ? `${Math.round(weather.temp)}°C, ${weather.condition}`
    : '';

  const context: NarrationContext = {
    destination,
    neighborhood,
    timeOfDay,
    weather: weatherStr,
    currentActivity: current,
    nextActivity: next,
    nearbyVenues,
    userPreferences: [...vibes],
  };

  const prompt = generateNarration(context);

  // Call Sonar via the existing proxy infrastructure
  const sonarResult = await fetchSonarResult(destination, 'narration', {
    dates: new Date().toISOString().split('T')[0],
    budget: prompt,
  });

  const result: NarrationResult = {
    text: sonarResult.answer,
    audioText: sonarResult.answer.replace(/\*\*/g, '').replace(/\[.*?\]/g, ''),
    timestamp: Date.now(),
    context,
  };

  await setCachedNarration(key, result);
  return result;
}

// ---------------------------------------------------------------------------
// Hook — useAutoNarration
// ---------------------------------------------------------------------------

const AUTO_NARRATION_INTERVAL_MS = 15 * 60 * 1000;

export function useAutoNarration(
  tripId: string | null,
  enabled: boolean,
  params: {
    destination: string;
    lat: number;
    lng: number;
    itinerary: Itinerary | null;
    weather: CurrentWeather | null;
    dayIndex: number;
    vibes: ReadonlyArray<string>;
  },
): AutoNarrationState {
  const [narration, setNarration] = useState<NarrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const fetchNarration = useCallback(async () => {
    if (!tripId || !enabled || !params.destination) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getNarrationForMoment(
        params.destination,
        params.lat,
        params.lng,
        params.itinerary,
        params.weather,
        params.dayIndex,
        params.vibes,
      );
      setNarration(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Narration failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [tripId, enabled, params.destination, params.lat, params.lng, params.itinerary, params.weather, params.dayIndex, params.vibes]);

  // Initial fetch + interval
  useEffect(() => {
    if (!enabled || !tripId) return;
    fetchNarration();

    intervalRef.current = setInterval(() => {
      fetchNarration();
    }, AUTO_NARRATION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, tripId, fetchKey, fetchNarration]);

  const play = useCallback(async () => {
    if (!narration) return;
    setIsPlaying(true);
    try {
      await narrateText(narration.audioText, {
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    } catch {
      setIsPlaying(false);
    }
  }, [narration]);

  const dismiss = useCallback(() => {
    stopNarration();
    setIsPlaying(false);
  }, []);

  const refresh = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return { narration, isLoading, isPlaying, error, play, dismiss, refresh };
}
