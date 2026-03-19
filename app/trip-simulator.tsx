// =============================================================================
// ROAM — Trip Simulator ("Preview Your Trip")
// Walk through itinerary day by day with photos, weather, activities, costs.
// Auto-advance every 5s (pausable). Share slide as image. Progress indicator.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Share2,
  Sun,
  CloudRain,
  Cloud,
  Sunrise,
  Coffee,
  Moon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  DESTINATIONS,
  DESTINATION_HERO_PHOTOS,
} from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary, type ItineraryDay } from '../lib/types/itinerary';
import { getWeatherForecast, type DailyForecast } from '../lib/weather-forecast';
import { trackEvent } from '../lib/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AUTO_ADVANCE_MS = 5000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TripSimulatorScreen(): React.JSX.Element {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const trips = useAppStore((s) => s.trips);
  const trip = useMemo(() => trips.find((tr) => tr.id === tripId), [trips, tripId]);

  const itinerary = useMemo<Itinerary | null>(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip]);

  const destData = useMemo(
    () => DESTINATIONS.find((d) => d.label === itinerary?.destination),
    [itinerary],
  );

  const [currentDay, setCurrentDay] = useState(0);
  const [paused, setPaused] = useState(false);
  const [weather, setWeather] = useState<readonly DailyForecast[]>([]);
  const [runningCost, setRunningCost] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDays = itinerary?.days.length ?? 0;
  const day = itinerary?.days[currentDay] ?? null;

  // Fetch weather
  useEffect(() => {
    if (!destData) return;
    getWeatherForecast(destData.lat, destData.lng)
      .then((fc) => setWeather(fc?.days ?? []))
      .catch(() => {});
  }, [destData]);

  // Track view
  useEffect(() => {
    if (itinerary) {
      trackEvent('trip_simulator_view', { destination: itinerary.destination });
    }
  }, [itinerary]);

  // Running cost calculation
  useEffect(() => {
    if (!itinerary) return;
    const cost = itinerary.days.slice(0, currentDay + 1).reduce((sum, d) => {
      const parsed = parseFloat(d.dailyCost.replace(/[^0-9.]/g, ''));
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);
    setRunningCost(cost);
  }, [currentDay, itinerary]);

  // Auto-advance timer
  useEffect(() => {
    if (paused || !itinerary) return;
    timerRef.current = setInterval(() => {
      setCurrentDay((prev) => {
        if (prev >= totalDays - 1) {
          setPaused(true);
          return prev;
        }
        return prev + 1;
      });
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, totalDays, itinerary]);

  const goNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDay((prev) => Math.min(prev + 1, totalDays - 1));
  }, [totalDays]);

  const goPrev = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDay((prev) => Math.max(prev - 1, 0));
  }, []);

  const togglePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaused((prev) => !prev);
  }, []);

  const handleShare = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent('trip_simulator_share', {
      destination: itinerary?.destination ?? '',
      day: currentDay + 1,
    });
    // Share functionality would use expo-sharing + ViewShot here
  }, [itinerary, currentDay]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  }, [router]);

  const heroPhoto = useMemo(() => {
    const dest = itinerary?.destination ?? '';
    return (
      DESTINATION_HERO_PHOTOS[dest] ??
      `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80`
    );
  }, [itinerary]);

  const dayWeather = weather[currentDay] ?? null;

  if (!itinerary || !day) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {t('tripSim.noTrip', { defaultValue: 'No itinerary to preview' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background photo */}
      <Image source={{ uri: heroPhoto }} style={styles.bgImage} blurRadius={2} />
      <View style={styles.bgOverlay} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button">
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Pressable onPress={handleShare} hitSlop={12} accessibilityRole="button">
          <Share2 size={20} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {Array.from({ length: totalDays }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === currentDay && styles.progressDotActive,
              i < currentDay && styles.progressDotDone,
            ]}
          />
        ))}
      </View>

      {/* Day counter */}
      <Text style={styles.dayCounter}>
        {t('tripSim.dayOf', { defaultValue: `Day ${currentDay + 1} of ${totalDays}` })}
      </Text>

      {/* Day theme */}
      <Text style={styles.dayTheme}>{day.theme}</Text>

      {/* Weather badge */}
      {dayWeather && (
        <View style={styles.weatherBadge}>
          <WeatherIcon code={dayWeather.weatherCode} />
          <Text style={styles.weatherText}>
            {Math.round(dayWeather.tempMax)}/{Math.round(dayWeather.tempMin)}
          </Text>
          {dayWeather.precipitationChance > 30 && (
            <Text style={styles.weatherRain}>
              {dayWeather.precipitationChance}% rain
            </Text>
          )}
        </View>
      )}

      {/* Activity timeline */}
      <View style={styles.timeline}>
        <ActivityRow
          icon={<Sunrise size={14} color={COLORS.sage} strokeWidth={1.5} />}
          label={t('tripSim.morning', { defaultValue: 'Morning' })}
          activity={day.morning.activity}
          location={day.morning.location}
          cost={day.morning.cost}
          time={day.morning.time}
        />
        <ActivityRow
          icon={<Sun size={14} color={COLORS.gold} strokeWidth={1.5} />}
          label={t('tripSim.afternoon', { defaultValue: 'Afternoon' })}
          activity={day.afternoon.activity}
          location={day.afternoon.location}
          cost={day.afternoon.cost}
          time={day.afternoon.time}
        />
        <ActivityRow
          icon={<Moon size={14} color={COLORS.creamDim} strokeWidth={1.5} />}
          label={t('tripSim.evening', { defaultValue: 'Evening' })}
          activity={day.evening.activity}
          location={day.evening.location}
          cost={day.evening.cost}
          time={day.evening.time}
        />
      </View>

      {/* Running total */}
      <View style={styles.costRow}>
        <Text style={styles.costLabel}>
          {t('tripSim.total', { defaultValue: 'Running total' })}
        </Text>
        <Text style={styles.costValue}>${runningCost.toFixed(0)}</Text>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Pressable onPress={goPrev} disabled={currentDay === 0} hitSlop={12}>
          <ChevronLeft
            size={28}
            color={currentDay === 0 ? COLORS.muted : COLORS.cream}
            strokeWidth={1.5}
          />
        </Pressable>
        <Pressable
          onPress={togglePause}
          style={styles.playPauseBtn}
          accessibilityRole="button"
        >
          {paused ? (
            <Play size={24} color={COLORS.cream} strokeWidth={1.5} />
          ) : (
            <Pause size={24} color={COLORS.cream} strokeWidth={1.5} />
          )}
        </Pressable>
        <Pressable onPress={goNext} disabled={currentDay >= totalDays - 1} hitSlop={12}>
          <ChevronRight
            size={28}
            color={currentDay >= totalDays - 1 ? COLORS.muted : COLORS.cream}
            strokeWidth={1.5}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ActivityRow({
  icon,
  label,
  activity,
  location,
  cost,
  time,
}: {
  icon: React.ReactNode;
  label: string;
  activity: string;
  location: string;
  cost: string;
  time?: string;
}) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIcon}>{icon}</View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityLabel}>{label}</Text>
          {time && <Text style={styles.activityTime}>{time}</Text>}
        </View>
        <Text style={styles.activityName} numberOfLines={1}>{activity}</Text>
        <View style={styles.activityMeta}>
          <Text style={styles.activityLocation} numberOfLines={1}>{location}</Text>
          <Text style={styles.activityCost}>{cost}</Text>
        </View>
      </View>
    </View>
  );
}

function WeatherIcon({ code }: { code: number }) {
  if (code >= 61) return <CloudRain size={14} color={COLORS.coral} strokeWidth={1.5} />;
  if (code >= 2) return <Cloud size={14} color={COLORS.muted} strokeWidth={1.5} />;
  return <Sun size={14} color={COLORS.gold} strokeWidth={1.5} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: '100%',
    opacity: 0.3,
  } as ImageStyle,
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgDarkGreen80,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    zIndex: 1,
  } as ViewStyle,
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: SPACING.sm,
  } as ViewStyle,
  progressDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.whiteMuted,
  } as ViewStyle,
  progressDotActive: {
    width: 24,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  progressDotDone: {
    backgroundColor: COLORS.sageMuted,
  } as ViewStyle,
  dayCounter: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
  dayTheme: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
  } as TextStyle,
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  weatherText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  weatherRain: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
  } as TextStyle,
  timeline: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  activityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  } as ViewStyle,
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.sageVeryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  activityContent: { flex: 1, gap: 2 } as ViewStyle,
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  activityLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  activityTime: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
  } as TextStyle,
  activityName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  activityLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    flex: 1,
    marginRight: SPACING.sm,
  } as TextStyle,
  activityCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
  } as TextStyle,
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  costLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,
  costValue: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.sage,
  } as TextStyle,
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingTop: SPACING.md,
  } as ViewStyle,
  playPauseBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  } as TextStyle,
});
