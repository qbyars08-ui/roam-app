// =============================================================================
// ROAM — Daily Brief Screen
// Magazine-style morning briefing: weather, schedule, live intel, golden hour
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  ChevronLeft,
  Clock,
  Compass,
  Globe,
  MapPin,
  Phone,
  Shirt,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, DESTINATIONS, FONTS, HIDDEN_DESTINATIONS, RADIUS, SPACING } from '../lib/constants';
import { useAppStore, getActiveTripDayIndex } from '../lib/store';
import type { Trip } from '../lib/store';
import type { ItineraryDay, TimeSlotActivity } from '../lib/types/itinerary';
import { parseItinerary } from '../lib/types/itinerary';
import { useSonarQuery } from '../lib/sonar';
import { getGoldenHour, getPhotoTip } from '../lib/golden-hour';
import type { GoldenHourData } from '../lib/golden-hour';
import { getWeatherForecast } from '../lib/weather-forecast';
import type { DailyForecast } from '../lib/weather-forecast';
import { geocodeCity } from '../lib/geocoding';
import FadeIn from '../components/ui/FadeIn';
import SonarCard, { SonarFallback } from '../components/ui/SonarCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTripDayLabel(trip: Trip): string {
  if (!trip.startDate) return '';
  const start = new Date(trip.startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - start.getTime();
  const dayNum = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  if (dayNum < 1 || dayNum > trip.days) return '';
  return `Day ${dayNum} of ${trip.days}`;
}

function getWardrobeAdvice(forecast: DailyForecast): string {
  const temp = forecast.tempMax;
  if (temp > 30) return 'Light, breathable layers. Sunscreen is essential.';
  if (temp > 22) return 'T-shirt weather. Bring a light layer for evening.';
  if (temp > 15) return 'A light jacket or sweater will be useful today.';
  if (temp > 5) return 'Layer up. A warm coat and scarf recommended.';
  return 'Bundle up. Heavy coat, gloves, and warm layers.';
}

function findDestinationCoords(destination: string): { lat: number; lng: number } | null {
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const found = all.find(
    (d) => d.label.toLowerCase() === destination.toLowerCase(),
  );
  if (found) return { lat: found.lat, lng: found.lng };
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DailyBriefScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  // Store
  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);

  const trip = useMemo(() => {
    const id = tripId ?? activeTripId;
    if (!id) return trips[0] ?? null;
    return trips.find((t) => t.id === id) ?? trips[0] ?? null;
  }, [tripId, activeTripId, trips]);

  const destination = trip?.destination ?? '';

  // State
  const [todayWeather, setTodayWeather] = useState<DailyForecast | null>(null);
  const [goldenHour, setGoldenHour] = useState<GoldenHourData | null>(null);

  // Sonar live intel
  const {
    data: sonarData,
    isLive: sonarIsLive,
    citations: sonarCitations,
  } = useSonarQuery(destination || undefined, 'pulse');

  // Parse itinerary for today's schedule
  const todaySchedule = useMemo((): ItineraryDay | null => {
    if (!trip?.itinerary) return null;
    try {
      const parsed = parseItinerary(trip.itinerary);
      const dayIndex = getActiveTripDayIndex();
      if (dayIndex >= 0 && dayIndex < parsed.days.length) {
        return parsed.days[dayIndex];
      }
      // Fallback: show day 1
      return parsed.days[0] ?? null;
    } catch {
      return null;
    }
  }, [trip?.itinerary]);

  // Fetch weather
  useEffect(() => {
    if (!destination) return;
    let cancelled = false;

    async function loadWeather() {
      const coords = findDestinationCoords(destination);
      const geo = coords ? null : await geocodeCity(destination);
      const lat = coords?.lat ?? geo?.latitude;
      const lng = coords?.lng ?? geo?.longitude;
      if (lat == null || lng == null || cancelled) return;

      const forecast = await getWeatherForecast(lat, lng);
      if (cancelled || !forecast?.days?.length) return;
      setTodayWeather(forecast.days[0]);
    }

    loadWeather();
    return () => { cancelled = true; };
  }, [destination]);

  // Fetch golden hour
  useEffect(() => {
    if (!destination) return;
    let cancelled = false;

    async function loadGoldenHour() {
      const coords = findDestinationCoords(destination);
      const geo = coords ? null : await geocodeCity(destination);
      const lat = coords?.lat ?? geo?.latitude;
      const lng = coords?.lng ?? geo?.longitude;
      if (lat == null || lng == null || cancelled) return;

      const data = await getGoldenHour(lat, lng);
      if (!cancelled) setGoldenHour(data);
    }

    loadGoldenHour();
    return () => { cancelled = true; };
  }, [destination]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleQuickAction = useCallback(
    (action: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Navigation stubs -- these can route to real screens later
      switch (action) {
        case 'navigate':
          break;
        case 'translate':
          break;
        case 'emergency':
          router.push('/emergency-card');
          break;
        case 'camera':
          break;
      }
    },
    [router],
  );

  // Greeting + day label
  const greeting = useMemo(() => getGreeting(), []);
  const dayLabel = useMemo(() => (trip ? getTripDayLabel(trip) : ''), [trip]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!trip) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {t('dailyBrief.noTrip', { defaultValue: 'Plan a trip to unlock your daily brief' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back button */}
      <Pressable
        onPress={handleBack}
        style={styles.backBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
      >
        <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header */}
        <FadeIn delay={0}>
          <View style={styles.header}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.destination}>{destination}</Text>
            {dayLabel ? (
              <Text style={styles.dayLabel}>{dayLabel}</Text>
            ) : null}
          </View>
        </FadeIn>

        {/* 2. Weather Card */}
        <FadeIn delay={100}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Thermometer size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.cardTitle}>
                {t('dailyBrief.weather', { defaultValue: 'Weather' })}
              </Text>
            </View>
            {todayWeather ? (
              <View style={styles.weatherBody}>
                <View style={styles.weatherMain}>
                  <Text style={styles.weatherTemp}>
                    {Math.round(todayWeather.tempMax)}°
                  </Text>
                  <View style={styles.weatherDetails}>
                    <Text style={styles.weatherDesc}>
                      {todayWeather.weatherLabel}
                    </Text>
                    <Text style={styles.weatherRange}>
                      {Math.round(todayWeather.tempMin)}° / {Math.round(todayWeather.tempMax)}°
                    </Text>
                  </View>
                </View>
                <View style={styles.wardrobeRow}>
                  <Shirt size={14} color={COLORS.creamDim} strokeWidth={1.5} />
                  <Text style={styles.wardrobeText}>
                    {getWardrobeAdvice(todayWeather)}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.loadingText}>
                {t('common.loading', { defaultValue: 'Loading...' })}
              </Text>
            )}
          </View>
        </FadeIn>

        {/* 3. Today's Schedule */}
        {todaySchedule ? (
          <FadeIn delay={200}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Clock size={16} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.cardTitle}>
                  {t('dailyBrief.todaySchedule', { defaultValue: "Today's Schedule" })}
                </Text>
                {todaySchedule.theme ? (
                  <Text style={styles.themeLabel}>{todaySchedule.theme}</Text>
                ) : null}
              </View>
              <View style={styles.timeline}>
                <TimelineSlot
                  label={t('dailyBrief.morning', { defaultValue: 'Morning' })}
                  time={todaySchedule.morning.time ?? '9:00 AM'}
                  activity={todaySchedule.morning}
                />
                <TimelineSlot
                  label={t('dailyBrief.afternoon', { defaultValue: 'Afternoon' })}
                  time={todaySchedule.afternoon.time ?? '1:00 PM'}
                  activity={todaySchedule.afternoon}
                />
                <TimelineSlot
                  label={t('dailyBrief.evening', { defaultValue: 'Evening' })}
                  time={todaySchedule.evening.time ?? '7:00 PM'}
                  activity={todaySchedule.evening}
                />
              </View>
            </View>
          </FadeIn>
        ) : null}

        {/* 4. Live Intel Card */}
        <FadeIn delay={300}>
          <View style={styles.section}>
            <View style={styles.cardHeader}>
              <Globe size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.cardTitle}>
                {t('dailyBrief.liveIntel', { defaultValue: 'Live Intel' })}
              </Text>
            </View>
            {sonarData?.answer ? (
              <SonarCard
                answer={sonarData.answer}
                isLive={sonarIsLive}
                citations={sonarCitations}
                title={`${t('dailyBrief.whatsHappening', { defaultValue: "What's happening in" })} ${destination}`}
              />
            ) : (
              <SonarFallback />
            )}
          </View>
        </FadeIn>

        {/* 5. Golden Hour */}
        {goldenHour ? (
          <FadeIn delay={400}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Sun size={16} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={styles.cardTitle}>
                  {t('dailyBrief.goldenHour', { defaultValue: 'Golden Hour' })}
                </Text>
              </View>
              <Text style={styles.goldenTip}>{getPhotoTip(goldenHour)}</Text>
              <View style={styles.goldenTimesRow}>
                <View style={styles.goldenTimeBlock}>
                  <Sunrise size={14} color={COLORS.creamDim} strokeWidth={1.5} />
                  <Text style={styles.goldenTimeLabel}>
                    {t('dailyBrief.morningLight', { defaultValue: 'Morning' })}
                  </Text>
                  <Text style={styles.goldenTimeValue}>
                    {goldenHour.morningGoldenStart} – {goldenHour.morningGoldenEnd}
                  </Text>
                </View>
                <View style={styles.goldenDivider} />
                <View style={styles.goldenTimeBlock}>
                  <Sunset size={14} color={COLORS.gold} strokeWidth={1.5} />
                  <Text style={styles.goldenTimeLabel}>
                    {t('dailyBrief.eveningLight', { defaultValue: 'Evening' })}
                  </Text>
                  <Text style={styles.goldenTimeValue}>
                    {goldenHour.eveningGoldenStart} – {goldenHour.eveningGoldenEnd}
                  </Text>
                </View>
              </View>
            </View>
          </FadeIn>
        ) : null}

        {/* 6. Quick Actions */}
        <FadeIn delay={500}>
          <View style={styles.quickActionsRow}>
            <QuickActionPill
              icon={<Compass size={16} color={COLORS.cream} strokeWidth={1.5} />}
              label={t('dailyBrief.navigate', { defaultValue: 'Navigate' })}
              onPress={() => handleQuickAction('navigate')}
            />
            <QuickActionPill
              icon={<Globe size={16} color={COLORS.cream} strokeWidth={1.5} />}
              label={t('dailyBrief.translate', { defaultValue: 'Translate' })}
              onPress={() => handleQuickAction('translate')}
            />
            <QuickActionPill
              icon={<Phone size={16} color={COLORS.cream} strokeWidth={1.5} />}
              label={t('dailyBrief.emergency', { defaultValue: 'Emergency' })}
              onPress={() => handleQuickAction('emergency')}
            />
            <QuickActionPill
              icon={<Camera size={16} color={COLORS.cream} strokeWidth={1.5} />}
              label={t('dailyBrief.camera', { defaultValue: 'Camera' })}
              onPress={() => handleQuickAction('camera')}
            />
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TimelineSlot({
  label,
  time,
  activity,
}: {
  label: string;
  time: string;
  activity: TimeSlotActivity;
}) {
  return (
    <View style={styles.timelineSlot}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTime}>{time}</Text>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineActivity}>{activity.activity}</Text>
        {activity.location ? (
          <View style={styles.timelineLocationRow}>
            <MapPin size={12} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={styles.timelineLocation}>{activity.location}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function QuickActionPill({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={styles.quickPillLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: 20,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  } as ViewStyle,
  backBtn: {
    marginLeft: 16,
    marginTop: SPACING.sm,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Header
  header: {
    gap: SPACING.xs,
  } as ViewStyle,
  greeting: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
  } as TextStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    lineHeight: 38,
  } as TextStyle,
  dayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,

  // Cards
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,

  // Weather
  weatherBody: {
    gap: SPACING.sm,
  } as ViewStyle,
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  weatherTemp: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.cream,
    lineHeight: 52,
  } as TextStyle,
  weatherDetails: {
    gap: 2,
  } as ViewStyle,
  weatherDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.creamBright,
  } as TextStyle,
  weatherRange: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,
  wardrobeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  wardrobeText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  } as TextStyle,

  // Schedule theme
  themeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.3,
  } as TextStyle,

  // Timeline
  timeline: {
    gap: SPACING.md,
    paddingLeft: SPACING.xs,
  } as ViewStyle,
  timelineSlot: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
    marginTop: 6,
    flexShrink: 0,
  } as ViewStyle,
  timelineContent: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  timelineTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  timelineLabel: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  timelineActivity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    lineHeight: 20,
  } as TextStyle,
  timelineLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  } as ViewStyle,
  timelineLocation: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,

  // Section (for SonarCard wrapper)
  section: {
    gap: SPACING.sm,
  } as ViewStyle,

  // Golden hour
  goldenTip: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    lineHeight: 20,
  } as TextStyle,
  goldenTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  goldenTimeBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  goldenDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  } as ViewStyle,
  goldenTimeLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  goldenTimeValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  quickPill: {
    flex: 1,
    minWidth: 72,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  quickPillPressed: {
    opacity: 0.7,
  } as ViewStyle,
  quickPillLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 0.3,
  } as TextStyle,

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  } as TextStyle,
});
