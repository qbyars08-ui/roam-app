// =============================================================================
// ROAM — Trip Replay: Cinematic animated movie of your trip
// Traces the journey day by day with maps, moments, and stats.
// =============================================================================
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Cloud,
  MapPin,
  Pause,
  Play,
  Share2,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import type { Trip } from '../lib/store';
import { parseItinerary } from '../lib/types/itinerary';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from '../lib/types/itinerary';
import { buildStaticMapUrl } from '../lib/mapbox';
import type { GeocodedLocation } from '../lib/mapbox';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import * as Haptics from '../lib/haptics';

const { width: SW, height: SH } = Dimensions.get('window');
const S = SPACING;
const AUTO_ADVANCE_MS = 4000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TripMoment {
  id: string;
  note: string;
  photo_url: string | null;
  location: string | null;
  weather_icon: string | null;
  weather_temp: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCostNumber(cost: string): number {
  const match = cost.replace(/[^0-9.]/g, '');
  return parseFloat(match) || 0;
}

function getPhotoUrl(destination: string): string {
  return (
    DESTINATION_HERO_PHOTOS[destination] ??
    `https://images.unsplash.com/photos/${encodeURIComponent(destination)}?w=800&q=80`
  );
}

function formatDate(dateStr: string, dayNum: number): string {
  try {
    const start = new Date(dateStr);
    start.setDate(start.getDate() + dayNum - 1);
    return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return `Day ${dayNum}`;
  }
}

/**
 * Build a simple map URL for a day's locations using Mapbox static images.
 */
function buildDayMapUrl(day: ItineraryDay, destination: string): string | null {
  const locations: GeocodedLocation[] = [
    day.morning,
    day.afternoon,
    day.evening,
  ]
    .filter((slot) => slot.location && slot.location.length > 2)
    .map((slot) => ({
      name: slot.location,
      lat: 0,
      lng: 0,
      fullAddress: `${slot.location}, ${destination}`,
    }));

  // We cannot geocode synchronously, so we use the destination hero photo
  // as a visual fallback. The real map would require async geocoding.
  return null;
}

function getSlotActivities(day: ItineraryDay): Array<{
  label: string;
  slot: TimeSlotActivity;
  time: string;
}> {
  return [
    { label: 'Morning', slot: day.morning, time: day.morning.time ?? '9:00 AM' },
    { label: 'Afternoon', slot: day.afternoon, time: day.afternoon.time ?? '1:00 PM' },
    { label: 'Evening', slot: day.evening, time: day.evening.time ?? '7:00 PM' },
  ];
}

function collectNeighborhoods(itinerary: Itinerary): string[] {
  const set = new Set<string>();
  for (const day of itinerary.days) {
    for (const slot of [day.morning, day.afternoon, day.evening]) {
      if (slot.neighborhood) set.add(slot.neighborhood);
    }
  }
  return Array.from(set);
}

// ---------------------------------------------------------------------------
// Count-Up Animation Component
// ---------------------------------------------------------------------------

function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return <Text style={styles.statNumber}>{display}</Text>;
}

// ---------------------------------------------------------------------------
// Day Frame Component
// ---------------------------------------------------------------------------

interface DayFrameProps {
  day: ItineraryDay;
  dayIndex: number;
  totalDays: number;
  destination: string;
  startDate: string;
  moments: TripMoment[];
  runningCost: number;
}

function DayFrame({
  day,
  dayIndex,
  totalDays,
  destination,
  startDate,
  moments,
  runningCost,
}: DayFrameProps) {
  const activities = useMemo(() => getSlotActivities(day), [day]);
  const dayMoments = useMemo(
    () => moments.filter((m) => {
      const mDate = new Date(m.created_at);
      const tripStart = new Date(startDate);
      tripStart.setDate(tripStart.getDate() + dayIndex);
      const tripEnd = new Date(tripStart);
      tripEnd.setDate(tripEnd.getDate() + 1);
      return mDate >= tripStart && mDate < tripEnd;
    }),
    [moments, startDate, dayIndex]
  );

  return (
    <View style={styles.dayFrame}>
      {/* Background image */}
      <Image
        source={{ uri: getPhotoUrl(destination) }}
        style={styles.dayBgImage}
        blurRadius={Platform.OS === 'web' ? 0 : 6}
      />
      <LinearGradient
        colors={[COLORS.overlayDim, COLORS.overlayDarkest]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top bar: day + date left, weather right */}
      <View style={styles.dayTopBar}>
        <View>
          <Text style={styles.dayNumber}>Day {day.day}</Text>
          <Text style={styles.dayDate}>{formatDate(startDate, day.day)}</Text>
        </View>
        <View style={styles.weatherBadge}>
          <Sun size={14} color={COLORS.gold} strokeWidth={1.5} />
          <Text style={styles.weatherTemp}>--</Text>
        </View>
      </View>

      {/* Activities list */}
      <View style={styles.activitiesContainer}>
        {activities.map((a) => (
          <View key={a.label} style={styles.activityRow}>
            <View style={styles.activityDot} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityTime}>{a.time}</Text>
              <Text style={styles.activityName} numberOfLines={2}>
                {a.slot.activity}
              </Text>
              <View style={styles.activityLocationRow}>
                <MapPin size={10} color={COLORS.muted} strokeWidth={1.5} />
                <Text style={styles.activityLocation} numberOfLines={1}>
                  {a.slot.location}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Moment overlay cards */}
      {dayMoments.length > 0 && (
        <View style={styles.momentOverlay}>
          {dayMoments.slice(0, 1).map((m) => (
            <View key={m.id} style={styles.momentCard}>
              <Text style={styles.momentNote} numberOfLines={3}>
                {m.note}
              </Text>
              {m.location && (
                <Text style={styles.momentLocation}>{m.location}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Running cost counter */}
      <View style={styles.costCounter}>
        <Text style={styles.costLabel}>Total spent</Text>
        <Text style={styles.costValue}>${runningCost.toLocaleString()}</Text>
      </View>

      {/* Day theme */}
      <View style={styles.dayThemeContainer}>
        <Text style={styles.dayTheme}>{day.theme}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Summary Frame (Final slide with count-up animations)
// ---------------------------------------------------------------------------

interface SummaryFrameProps {
  itinerary: Itinerary;
  destination: string;
  totalCost: number;
}

function SummaryFrame({ itinerary, destination, totalCost }: SummaryFrameProps) {
  const neighborhoods = useMemo(() => collectNeighborhoods(itinerary), [itinerary]);
  const totalActivities = useMemo(
    () => itinerary.days.length * 3,
    [itinerary.days.length]
  );

  return (
    <View style={styles.dayFrame}>
      <Image
        source={{ uri: getPhotoUrl(destination) }}
        style={styles.dayBgImage}
        blurRadius={Platform.OS === 'web' ? 0 : 8}
      />
      <LinearGradient
        colors={[COLORS.overlayStrong, COLORS.overlayDarkest]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>Your {destination} trip</Text>
        <Text style={styles.summaryTagline}>{itinerary.tagline}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <CountUp target={itinerary.days.length} />
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statBox}>
            <CountUp target={neighborhoods.length} />
            <Text style={styles.statLabel}>Neighborhoods</Text>
          </View>
          <View style={styles.statBox}>
            <CountUp target={totalActivities} />
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statBox}>
            <CountUp target={totalCost} duration={2000} />
            <Text style={styles.statLabel}>Total cost</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TripReplayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();

  const trips = useAppStore((s) => s.trips);

  // Find target trip
  const trip: Trip | null = useMemo(() => {
    if (params.tripId) {
      return trips.find((t) => t.id === params.tripId) ?? null;
    }
    return trips[0] ?? null;
  }, [params.tripId, trips]);

  // Parse itinerary
  const itinerary: Itinerary | null = useMemo(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip]);

  // Trip moments
  const [moments, setMoments] = useState<TripMoment[]>([]);

  useEffect(() => {
    if (!trip) return;
    supabase
      .from('trip_moments')
      .select('id, note, photo_url, location, weather_icon, weather_temp, created_at')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMoments(data as TripMoment[]);
      });
  }, [trip]);

  // Frame navigation
  const totalFrames = (itinerary?.days.length ?? 0) + 1; // +1 for summary
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Running cost calculation
  const runningCosts = useMemo(() => {
    if (!itinerary) return [];
    let sum = 0;
    return itinerary.days.map((day) => {
      sum += parseCostNumber(day.dailyCost);
      return sum;
    });
  }, [itinerary]);

  const totalCost = runningCosts.length > 0 ? runningCosts[runningCosts.length - 1] : 0;

  // Crossfade transition
  const transitionToFrame = useCallback((nextFrame: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setCurrentFrame(nextFrame);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) return;

    timerRef.current = setTimeout(() => {
      const nextFrame = currentFrame + 1 < totalFrames ? currentFrame + 1 : 0;
      transitionToFrame(nextFrame);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentFrame, totalFrames, transitionToFrame]);

  // Tap to pause/play
  const handleTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying((prev) => !prev);
  }, []);

  // Scrubber
  const handleScrub = useCallback((index: number) => {
    Haptics.selectionAsync();
    if (timerRef.current) clearTimeout(timerRef.current);
    transitionToFrame(index);
  }, [transitionToFrame]);

  // Share
  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackEvent('trip_replay_shared', {
      destination: trip?.destination ?? '',
      totalDays: itinerary?.days.length ?? 0,
    });
    // TODO: generate shareable URL via Supabase shared_trips
  }, [trip, itinerary]);

  // Music toggle
  const handleMusicToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMusicOn((prev) => !prev);
  }, []);

  // Track view
  useEffect(() => {
    if (trip) {
      trackEvent('trip_replay_viewed', {
        destination: trip.destination,
        days: trip.days,
      });
    }
  }, [trip]);

  if (!trip || !itinerary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topControls}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
          >
            <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No trip to replay yet.</Text>
        </View>
      </View>
    );
  }

  const isSummaryFrame = currentFrame >= itinerary.days.length;
  const currentDay = isSummaryFrame ? null : itinerary.days[currentFrame];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tap area for pause/play */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleTap}>
        <Animated.View style={[styles.frameContainer, { opacity: fadeAnim }]}>
          {isSummaryFrame ? (
            <SummaryFrame
              itinerary={itinerary}
              destination={trip.destination}
              totalCost={totalCost}
            />
          ) : currentDay ? (
            <DayFrame
              day={currentDay}
              dayIndex={currentFrame}
              totalDays={itinerary.days.length}
              destination={trip.destination}
              startDate={trip.startDate ?? trip.createdAt}
              moments={moments}
              runningCost={runningCosts[currentFrame] ?? 0}
            />
          ) : null}
        </Animated.View>
      </Pressable>

      {/* Top controls overlay */}
      <View style={[styles.topControls, { top: insets.top + S.sm }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={12}
        >
          <ArrowLeft size={24} color={COLORS.white} strokeWidth={1.5} />
        </Pressable>

        <View style={styles.topRight}>
          <Pressable onPress={handleMusicToggle} hitSlop={12}>
            {musicOn ? (
              <Volume2 size={20} color={COLORS.white} strokeWidth={1.5} />
            ) : (
              <VolumeX size={20} color={COLORS.whiteDim} strokeWidth={1.5} />
            )}
          </Pressable>
          <Pressable onPress={handleShare} hitSlop={12}>
            <Share2 size={20} color={COLORS.white} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* Play/Pause indicator */}
      {!isPlaying && (
        <View style={styles.pauseIndicator} pointerEvents="none">
          <Play size={48} color={COLORS.white} strokeWidth={1.5} fill={COLORS.white} />
        </View>
      )}

      {/* Bottom: timeline scrubber */}
      <View
        style={[styles.scrubberContainer, { paddingBottom: insets.bottom + S.sm }]}
        pointerEvents="box-none"
      >
        <View style={styles.scrubberTrack}>
          {Array.from({ length: totalFrames }).map((_, i) => (
            <Pressable
              key={i}
              onPress={() => handleScrub(i)}
              style={[
                styles.scrubberDot,
                i === currentFrame && styles.scrubberDotActive,
                i < currentFrame && styles.scrubberDotPast,
              ]}
            />
          ))}
        </View>
        <Text style={styles.scrubberLabel}>
          {isSummaryFrame
            ? 'Trip Summary'
            : `Day ${(currentDay?.day ?? currentFrame + 1)} of ${itinerary.days.length}`}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  frameContainer: {
    flex: 1,
  },

  // Top controls
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    zIndex: 10,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },

  // Day frame
  dayFrame: {
    flex: 1,
    justifyContent: 'space-between',
  },
  dayBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: SW,
    height: SH,
    resizeMode: 'cover',
  },
  dayTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: S.lg,
    paddingTop: 60,
  },
  dayNumber: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.white,
    letterSpacing: 0.15 * 13,
    textTransform: 'uppercase',
  },
  dayDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.whiteDim,
    marginTop: 2,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.overlayMedium,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  weatherTemp: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.white,
  },

  // Activities
  activitiesContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: S.lg,
    gap: S.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
    marginTop: 6,
  },
  activityInfo: {
    flex: 1,
  },
  activityTime: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.whiteDim,
    marginBottom: 2,
  },
  activityName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.white,
    lineHeight: 26,
  },
  activityLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  activityLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.whiteDim,
  },

  // Moment overlay
  momentOverlay: {
    paddingHorizontal: S.lg,
    marginBottom: S.sm,
  },
  momentCard: {
    backgroundColor: COLORS.overlayMedium,
    borderRadius: RADIUS.md,
    padding: S.md,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  },
  momentNote: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 14 * 1.6,
  },
  momentLocation: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.whiteDim,
    marginTop: S.xs,
  },

  // Cost counter
  costCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    marginBottom: S.xs,
  },
  costLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.whiteDim,
    textTransform: 'uppercase',
    letterSpacing: 0.15 * 11,
  },
  costValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.gold,
  },

  // Day theme
  dayThemeContainer: {
    paddingHorizontal: S.lg,
    paddingBottom: S.xxl + S.xl,
  },
  dayTheme: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.white,
  },

  // Summary frame
  summaryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S.xl,
  },
  summaryTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: S.sm,
  },
  summaryTagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginBottom: S.xl,
    lineHeight: 16 * 1.6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: S.lg,
  },
  statBox: {
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontFamily: FONTS.mono,
    fontSize: 36,
    color: COLORS.gold,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.whiteDim,
    textTransform: 'uppercase',
    letterSpacing: 0.15 * 11,
    marginTop: 4,
  },

  // Pause indicator
  pauseIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },

  // Scrubber
  scrubberContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: S.md,
    zIndex: 10,
  },
  scrubberTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: S.xs,
  },
  scrubberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.whiteDim,
  },
  scrubberDotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
  },
  scrubberDotPast: {
    backgroundColor: COLORS.sageLight,
  },
  scrubberLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.whiteDim,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
  },
});
