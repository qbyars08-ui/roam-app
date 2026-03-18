// =============================================================================
// ROAM — Environmental UI Context Provider
// Subtly shifts app color temperature based on real weather + time at destination
// =============================================================================
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { getCurrentWeather } from './apis/openweather';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type EnvironmentalCondition =
  | 'golden_hour'
  | 'raining'
  | 'late_night'
  | 'extreme_heat'
  | 'normal';

export interface EnvironmentalState {
  condition: EnvironmentalCondition;
  overlayStyle: ViewStyle;
}

// ---------------------------------------------------------------------------
// Overlay styles — one per condition (immutable constants)
// ---------------------------------------------------------------------------
const OVERLAY_STYLES: Record<EnvironmentalCondition, ViewStyle> = {
  golden_hour: { backgroundColor: 'rgba(201, 168, 76, 0.04)' },
  raining: { backgroundColor: 'rgba(91, 158, 111, 0.03)' },
  late_night: { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
  extreme_heat: { backgroundColor: 'rgba(232, 97, 74, 0.03)' },
  normal: {},
} as const;

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Time-of-day fallback (no weather API needed)
// ---------------------------------------------------------------------------
function detectConditionFromTime(): EnvironmentalCondition {
  const hour = new Date().getHours();

  // Late night: 10PM – 6AM
  if (hour >= 22 || hour < 6) return 'late_night';

  // Rough golden hour proxy: 1 hour before typical sunset window (5–8 PM)
  if (hour >= 17 && hour < 19) return 'golden_hour';

  return 'normal';
}

// ---------------------------------------------------------------------------
// Weather-based condition detection
// Returns null if weather fetch is unavailable — caller falls back to time
// ---------------------------------------------------------------------------
const RAIN_KEYWORDS = ['rain', 'drizzle', 'shower', 'storm', 'thunderstorm'];
const EXTREME_HEAT_CELSIUS = 35;

function isRainingCondition(condition: string): boolean {
  const lower = condition.toLowerCase();
  return RAIN_KEYWORDS.some((kw) => lower.includes(kw));
}

function isGoldenHour(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  // Golden hour: 1 hour before sunset; approximate range 17:00–19:30 local time
  // A more precise calculation would need destination coordinates & timezone,
  // but as a reliable approximation we use the 1hr-before-dusk window.
  const minuteOfDay = hour * 60 + minute;
  return minuteOfDay >= 17 * 60 && minuteOfDay <= 19 * 60 + 30;
}

function isLateNight(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
}

async function detectConditionFromWeather(
  destination: string,
): Promise<EnvironmentalCondition | null> {
  try {
    const weather = await getCurrentWeather(destination);
    if (!weather) return null;

    // Evaluate in priority order: late night always wins, then weather signals
    if (isLateNight()) return 'late_night';
    if (weather.temp > EXTREME_HEAT_CELSIUS) return 'extreme_heat';
    if (isRainingCondition(weather.condition)) return 'raining';
    if (isGoldenHour()) return 'golden_hour';
    return 'normal';
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const DEFAULT_STATE: EnvironmentalState = {
  condition: 'normal',
  overlayStyle: OVERLAY_STYLES.normal,
};

const EnvironmentalContext = createContext<EnvironmentalState>(DEFAULT_STATE);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface EnvironmentalProviderProps {
  children: React.ReactNode;
}

export function EnvironmentalProvider({
  children,
}: EnvironmentalProviderProps): React.ReactElement {
  const destination = useAppStore((s) => s.trips?.[0]?.destination ?? null);
  const [condition, setCondition] =
    useState<EnvironmentalCondition>('normal');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (destination) {
      const detected = await detectConditionFromWeather(destination);
      setCondition(detected ?? detectConditionFromTime());
    } else {
      setCondition(detectConditionFromTime());
    }
  }, [destination]);

  // Initial check + polling every 5 minutes
  useEffect(() => {
    refresh();
    timerRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [refresh]);

  const value = useMemo<EnvironmentalState>(
    () => ({
      condition,
      overlayStyle: OVERLAY_STYLES[condition],
    }),
    [condition],
  );

  return React.createElement(
    EnvironmentalContext.Provider,
    { value },
    children,
    // Non-interactive tinted overlay rendered above all content
    React.createElement(
      View,
      {
        style: [StyleSheet.absoluteFill, OVERLAY_STYLES[condition]],
        pointerEvents: 'none' as const,
      } as object,
    ),
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useEnvironmental(): EnvironmentalState {
  return useContext(EnvironmentalContext);
}
