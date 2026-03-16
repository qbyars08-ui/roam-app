// =============================================================================
// ROAM — Trip Stories
// Cinematic, auto-advancing, full-screen story experience for generated trips.
// Each card = one day. Animated text reveals, destination-themed gradients,
// weather/cost overlays, shareable as images. Viral loop at the end.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from '../lib/view-shot';
import * as Sharing from 'expo-sharing';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary, type ItineraryDay } from '../lib/types/itinerary';
import { getDestinationTheme, type DestinationTheme } from '../lib/destination-themes';
import { getHeroPhotoUrl } from '../lib/heroPhotos';
import { getDestinationPhoto } from '../lib/photos';
import { getCostOfLiving } from '../lib/cost-of-living';
import { ChevronLeft, Share2, MapPin, Clock, Wallet, Sparkles } from 'lucide-react-native';
import { withComingSoon } from '../lib/with-coming-soon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PROGRESS_BAR_HEIGHT = 3;
const AUTO_ADVANCE_MS = 6000;

// =============================================================================
// Story card data — derived from itinerary day
// =============================================================================
interface StoryCard {
  type: 'intro' | 'day' | 'budget' | 'outro';
  day?: ItineraryDay;
  dayNumber?: number;
}

function buildStoryCards(itinerary: Itinerary): StoryCard[] {
  const cards: StoryCard[] = [{ type: 'intro' }];
  for (let i = 0; i < itinerary.days.length; i++) {
    cards.push({ type: 'day', day: itinerary.days[i], dayNumber: i + 1 });
  }
  cards.push({ type: 'budget' });
  cards.push({ type: 'outro' });
  return cards;
}

// =============================================================================
// Cinematic taglines for day themes
// =============================================================================
const DAY_TAGLINES = [
  'The adventure begins.',
  'Going deeper.',
  'The one you\'ll remember.',
  'Where it all clicks.',
  'The grand finale.',
  'One more for the road.',
  'Pure magic.',
  'No words needed.',
  'This is why you came.',
  'Save this day.',
];

function getDayTagline(dayIndex: number): string {
  return DAY_TAGLINES[dayIndex % DAY_TAGLINES.length];
}

// =============================================================================
// Main Screen
// =============================================================================
function TripStoryScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId]
  );

  const itinerary = useMemo<Itinerary | null>(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip?.itinerary]);

  const theme = useMemo(
    () => (trip ? getDestinationTheme(trip.destination) : null),
    [trip?.destination]
  );

  const heroPhoto = useMemo(
    () => (trip ? getHeroPhotoUrl(trip.destination) : ''),
    [trip?.destination]
  );

  const costData = useMemo(
    () => (trip ? getCostOfLiving(trip.destination) : null),
    [trip?.destination]
  );

  const storyCards = useMemo(
    () => (itinerary ? buildStoryCards(itinerary) : []),
    [itinerary]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardRefs = useRef<(React.ElementRef<typeof ViewShot> | null)[]>([]);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Text reveal animations ---
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(15)).current;
  const detailsFade = useRef(new Animated.Value(0)).current;

  const animateCardIn = useCallback(() => {
    titleFade.setValue(0);
    titleSlide.setValue(20);
    subtitleFade.setValue(0);
    subtitleSlide.setValue(15);
    detailsFade.setValue(0);

    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(titleFade, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleFade, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(detailsFade, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [titleFade, titleSlide, subtitleFade, subtitleSlide, detailsFade]);

  // --- Auto-advance progress bar ---
  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: AUTO_ADVANCE_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const goToCard = useCallback(
    (index: number) => {
      if (index < 0 || index >= storyCards.length) return;
      setActiveIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateCardIn();
      startProgress();
    },
    [storyCards.length, animateCardIn, startProgress]
  );

  // Auto-advance timer
  useEffect(() => {
    if (paused || storyCards.length === 0) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (activeIndex < storyCards.length - 1) {
        goToCard(activeIndex + 1);
      }
    }, AUTO_ADVANCE_MS);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [activeIndex, paused, storyCards.length, goToCard]);

  // Initial animation
  useEffect(() => {
    if (storyCards.length > 0) {
      animateCardIn();
      startProgress();
    }
  }, [storyCards.length, animateCardIn, startProgress]);

  // --- Tap handling (left = back, right = forward) ---
  const handleTap = useCallback(
    (x: number) => {
      if (x < SCREEN_WIDTH * 0.3) {
        goToCard(Math.max(0, activeIndex - 1));
      } else {
        if (activeIndex >= storyCards.length - 1) {
          router.back();
        } else {
          goToCard(activeIndex + 1);
        }
      }
    },
    [activeIndex, storyCards.length, goToCard, router]
  );

  // --- Share current card ---
  const handleShare = useCallback(async () => {
    const ref = cardRefs.current[activeIndex];
    if (!ref) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaused(true);
    try {
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your trip story',
      });
    } catch {
      // Cancelled or failed
    } finally {
      setPaused(false);
    }
  }, [activeIndex]);

  // --- Long press to pause ---
  const handleLongPress = useCallback(() => {
    setPaused(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handlePressOut = useCallback(() => {
    setPaused(false);
  }, []);

  if (!trip || !itinerary || !theme) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>No trip to preview</Text>
          <Pressable onPress={() => router.back()} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const currentCard = storyCards[activeIndex];
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.screen}>
      {/* Full-screen tap area */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
      >
        <ViewShot
          ref={(ref: React.ElementRef<typeof ViewShot> | null) => {
            cardRefs.current[activeIndex] = ref;
          }}
          options={{ format: 'png', quality: 1 }}
          style={StyleSheet.absoluteFill}
        >
          {/* Background gradient */}
          <LinearGradient
            colors={[
              theme.gradient[0],
              theme.gradient[1],
              theme.gradient[2],
            ]}
            style={StyleSheet.absoluteFill}
          />

          {/* Hero photo overlay for intro card */}
          {currentCard.type === 'intro' && heroPhoto ? (
            <ImageBackground
              source={{ uri: heroPhoto }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
              />
            </ImageBackground>
          ) : null}

          {/* Card Content */}
          <View style={[styles.cardContent, { paddingTop: insets.top + 60 }]}>
            {currentCard.type === 'intro' && (
              <IntroCard
                destination={trip.destination}
                days={trip.days}
                tagline={itinerary.tagline}
                theme={theme}
                titleFade={titleFade}
                titleSlide={titleSlide}
                subtitleFade={subtitleFade}
                subtitleSlide={subtitleSlide}
                detailsFade={detailsFade}
              />
            )}

            {currentCard.type === 'day' && currentCard.day && (
              <DayCard
                day={currentCard.day}
                dayNumber={currentCard.dayNumber ?? 1}
                totalDays={itinerary.days.length}
                theme={theme}
                titleFade={titleFade}
                titleSlide={titleSlide}
                subtitleFade={subtitleFade}
                subtitleSlide={subtitleSlide}
                detailsFade={detailsFade}
              />
            )}

            {currentCard.type === 'budget' && (
              <BudgetCard
                itinerary={itinerary}
                costData={costData}
                theme={theme}
                titleFade={titleFade}
                titleSlide={titleSlide}
                detailsFade={detailsFade}
              />
            )}

            {currentCard.type === 'outro' && (
              <OutroCard
                destination={trip.destination}
                theme={theme}
                titleFade={titleFade}
                titleSlide={titleSlide}
                subtitleFade={subtitleFade}
                subtitleSlide={subtitleSlide}
                onPlanYours={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(tabs)/generate' as never);
                }}
              />
            )}
          </View>

          {/* ROAM watermark */}
          <View style={[styles.watermark, { bottom: insets.bottom + 16 }]}>
            <Text style={styles.watermarkText}>ROAM</Text>
          </View>
        </ViewShot>
      </Pressable>

      {/* Progress bars */}
      <View style={[styles.progressRow, { top: insets.top + 12 }]}>
        {storyCards.map((_, i) => (
          <View key={i} style={styles.progressBarBg}>
            {i < activeIndex ? (
              <View style={[styles.progressBarFill, { width: '100%' }]} />
            ) : i === activeIndex ? (
              <Animated.View
                style={[styles.progressBarFill, { width: progressWidth }]}
              />
            ) : null}
          </View>
        ))}
      </View>

      {/* Top controls */}
      <View style={[styles.topControls, { top: insets.top + 24 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={28} color="#fff" strokeWidth={2} />
        </Pressable>

        <Pressable onPress={handleShare} hitSlop={12}>
          <Share2 size={22} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Paused indicator */}
      {paused && (
        <View style={styles.pausedOverlay}>
          <Text style={styles.pausedText}>PAUSED</Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// Intro Card — destination hero
// =============================================================================
function IntroCard({
  destination,
  days,
  tagline,
  theme,
  titleFade,
  titleSlide,
  subtitleFade,
  subtitleSlide,
  detailsFade,
}: {
  destination: string;
  days: number;
  tagline: string;
  theme: DestinationTheme;
  titleFade: Animated.Value;
  titleSlide: Animated.Value;
  subtitleFade: Animated.Value;
  subtitleSlide: Animated.Value;
  detailsFade: Animated.Value;
}) {
  return (
    <View style={styles.introContent}>
      <Animated.Text
        style={[
          styles.introBrand,
          { opacity: detailsFade, color: theme.primary },
        ]}
      >
        ROAM
      </Animated.Text>

      <Animated.Text
        style={[
          styles.introDestination,
          {
            opacity: titleFade,
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        {destination}
      </Animated.Text>

      <Animated.Text
        style={[
          styles.introTagline,
          {
            opacity: subtitleFade,
            transform: [{ translateY: subtitleSlide }],
          },
        ]}
      >
        {tagline}
      </Animated.Text>

      <Animated.View style={[styles.introPills, { opacity: detailsFade }]}>
        <View style={[styles.introPill, { borderColor: theme.primary }]}>
          <Clock size={12} color={theme.primary} strokeWidth={2} />
          <Text style={[styles.introPillText, { color: theme.primary }]}>
            {days} {days === 1 ? 'day' : 'days'}
          </Text>
        </View>
        <View style={[styles.introPill, { borderColor: theme.primary }]}>
          <MapPin size={12} color={theme.primary} strokeWidth={2} />
          <Text style={[styles.introPillText, { color: theme.primary }]}>
            Your trip
          </Text>
        </View>
      </Animated.View>

      <Animated.Text
        style={[styles.introSwipe, { opacity: detailsFade }]}
      >
        tap to continue →
      </Animated.Text>
    </View>
  );
}

// =============================================================================
// Day Card — one day of the itinerary
// =============================================================================
function DayCard({
  day,
  dayNumber,
  totalDays,
  theme,
  titleFade,
  titleSlide,
  subtitleFade,
  subtitleSlide,
  detailsFade,
}: {
  day: ItineraryDay;
  dayNumber: number;
  totalDays: number;
  theme: DestinationTheme;
  titleFade: Animated.Value;
  titleSlide: Animated.Value;
  subtitleFade: Animated.Value;
  subtitleSlide: Animated.Value;
  detailsFade: Animated.Value;
}) {
  return (
    <View style={styles.dayContent}>
      {/* Day counter */}
      <Animated.Text
        style={[styles.dayCounter, { opacity: detailsFade, color: theme.primary }]}
      >
        DAY {dayNumber} OF {totalDays}
      </Animated.Text>

      {/* Theme title */}
      <Animated.Text
        style={[
          styles.dayTheme,
          {
            opacity: titleFade,
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        {day.theme}
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text
        style={[
          styles.dayTagline,
          {
            opacity: subtitleFade,
            transform: [{ translateY: subtitleSlide }],
          },
        ]}
      >
        {getDayTagline(dayNumber - 1)}
      </Animated.Text>

      {/* Activities */}
      <Animated.View style={[styles.activitiesWrap, { opacity: detailsFade }]}>
        <ActivityRow
          label="MORNING"
          activity={day.morning.activity}
          location={day.morning.location}
          time={day.morning.time}
          theme={theme}
        />
        <View style={[styles.activityDivider, { backgroundColor: theme.primary }]} />
        <ActivityRow
          label="AFTERNOON"
          activity={day.afternoon.activity}
          location={day.afternoon.location}
          time={day.afternoon.time}
          theme={theme}
        />
        <View style={[styles.activityDivider, { backgroundColor: theme.primary }]} />
        <ActivityRow
          label="EVENING"
          activity={day.evening.activity}
          location={day.evening.location}
          time={day.evening.time}
          theme={theme}
        />
      </Animated.View>

      {/* Daily cost + route */}
      <Animated.View style={[styles.dayFooter, { opacity: detailsFade }]}>
        <View style={styles.dayFooterRow}>
          <Wallet size={14} color={theme.primary} strokeWidth={2} />
          <Text style={styles.dayCost}>{day.dailyCost}</Text>
        </View>
        {day.routeSummary ? (
          <Text style={styles.dayRoute}>{day.routeSummary}</Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

function ActivityRow({
  label,
  activity,
  location,
  time,
  theme,
}: {
  label: string;
  activity: string;
  location: string;
  time?: string;
  theme: DestinationTheme;
}) {
  return (
    <View style={styles.activityRow}>
      <Text style={[styles.activityLabel, { color: theme.primary }]}>
        {label}
      </Text>
      <Text style={styles.activityName} numberOfLines={2}>
        {activity}
      </Text>
      <View style={styles.activityMeta}>
        <MapPin size={10} color={COLORS.creamMuted} strokeWidth={2} />
        <Text style={styles.activityLocation} numberOfLines={1}>
          {location}
        </Text>
        {time ? (
          <Text style={styles.activityTime}> · {time}</Text>
        ) : null}
      </View>
    </View>
  );
}

// =============================================================================
// Budget Card — total trip cost breakdown
// =============================================================================
function BudgetCard({
  itinerary,
  costData,
  theme,
  titleFade,
  titleSlide,
  detailsFade,
}: {
  itinerary: Itinerary;
  costData: ReturnType<typeof getCostOfLiving>;
  theme: DestinationTheme;
  titleFade: Animated.Value;
  titleSlide: Animated.Value;
  detailsFade: Animated.Value;
}) {
  const breakdown = itinerary.budgetBreakdown;
  const items = [
    { label: 'Accommodation', value: breakdown.accommodation },
    { label: 'Food', value: breakdown.food },
    { label: 'Activities', value: breakdown.activities },
    { label: 'Transport', value: breakdown.transportation },
    { label: 'Misc', value: breakdown.miscellaneous },
  ];

  return (
    <View style={styles.budgetContent}>
      <Animated.Text
        style={[styles.budgetEyebrow, { opacity: detailsFade, color: theme.primary }]}
      >
        YOUR TRIP BUDGET
      </Animated.Text>

      <Animated.Text
        style={[
          styles.budgetTotal,
          { opacity: titleFade, transform: [{ translateY: titleSlide }] },
        ]}
      >
        {itinerary.totalBudget}
      </Animated.Text>

      <Animated.Text
        style={[styles.budgetSubtitle, { opacity: detailsFade }]}
      >
        {itinerary.days.length} days in {itinerary.destination}
      </Animated.Text>

      <Animated.View style={[styles.budgetBreakdown, { opacity: detailsFade }]}>
        {items.map((item) => (
          <View key={item.label} style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>{item.label}</Text>
            <View style={styles.budgetDots} />
            <Text style={[styles.budgetValue, { color: theme.primary }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </Animated.View>

      {costData ? (
        <Animated.View style={[styles.tippingNote, { opacity: detailsFade }]}>
          <Sparkles size={12} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.tippingText}>{costData.tipping}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

// =============================================================================
// Outro Card — viral CTA
// =============================================================================
function OutroCard({
  destination,
  theme,
  titleFade,
  titleSlide,
  subtitleFade,
  subtitleSlide,
  onPlanYours,
}: {
  destination: string;
  theme: DestinationTheme;
  titleFade: Animated.Value;
  titleSlide: Animated.Value;
  subtitleFade: Animated.Value;
  subtitleSlide: Animated.Value;
  onPlanYours: () => void;
}) {
  return (
    <View style={styles.outroContent}>
      <Animated.Text
        style={[
          styles.outroHeadline,
          { opacity: titleFade, transform: [{ translateY: titleSlide }] },
        ]}
      >
        That's {destination}.
      </Animated.Text>

      <Animated.Text
        style={[
          styles.outroSubtext,
          { opacity: subtitleFade, transform: [{ translateY: subtitleSlide }] },
        ]}
      >
        Built by AI in 30 seconds.{'\n'}Where are you going?
      </Animated.Text>

      <Animated.View style={{ opacity: subtitleFade }}>
        <Pressable
          onPress={onPlanYours}
          style={({ pressed }) => [
            styles.outroCta,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.outroCtaText}>Plan yours</Text>
        </Pressable>
      </Animated.View>

      <Animated.Text
        style={[styles.outroFooter, { opacity: subtitleFade }]}
      >
        roam — go somewhere that changes you.
      </Animated.Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  } as ViewStyle,

  // --- Progress bars ---
  progressRow: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: 4,
    zIndex: 20,
  } as ViewStyle,
  progressBarBg: {
    flex: 1,
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  } as ViewStyle,
  progressBarFill: {
    height: '100%',
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    backgroundColor: '#fff',
  } as ViewStyle,

  // --- Top controls ---
  topControls: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  } as ViewStyle,

  // --- Card content wrapper ---
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 80,
  } as ViewStyle,

  // --- Intro card ---
  introContent: {
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  introBrand: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    letterSpacing: 6,
    marginBottom: SPACING.sm,
  } as TextStyle,
  introDestination: {
    fontFamily: FONTS.header,
    fontSize: 52,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 58,
  } as TextStyle,
  introTagline: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
  } as TextStyle,
  introPills: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  introPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  } as ViewStyle,
  introPillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
  } as TextStyle,
  introSwipe: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginTop: SPACING.xl,
  } as TextStyle,

  // --- Day card ---
  dayContent: {
    gap: SPACING.md,
  } as ViewStyle,
  dayCounter: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 3,
  } as TextStyle,
  dayTheme: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: '#fff',
    lineHeight: 42,
  } as TextStyle,
  dayTagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  } as TextStyle,

  activitiesWrap: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  activityRow: {
    gap: 4,
  } as ViewStyle,
  activityLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 2,
  } as TextStyle,
  activityName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  } as TextStyle,
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  activityLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  activityTime: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  activityDivider: {
    height: 1,
    opacity: 0.2,
  } as ViewStyle,

  dayFooter: {
    gap: 4,
    marginTop: SPACING.sm,
  } as ViewStyle,
  dayFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  dayCost: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: '#fff',
  } as TextStyle,
  dayRoute: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  } as TextStyle,

  // --- Budget card ---
  budgetContent: {
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  budgetEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 3,
  } as TextStyle,
  budgetTotal: {
    fontFamily: FONTS.header,
    fontSize: 56,
    color: '#fff',
    textAlign: 'center',
  } as TextStyle,
  budgetSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: SPACING.md,
  } as TextStyle,
  budgetBreakdown: {
    width: '100%',
    gap: SPACING.sm,
  } as ViewStyle,
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  budgetLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    width: 120,
  } as TextStyle,
  budgetDots: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dotted',
  } as ViewStyle,
  budgetValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    textAlign: 'right',
    minWidth: 60,
  } as TextStyle,
  tippingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  } as ViewStyle,
  tippingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
    lineHeight: 18,
  } as TextStyle,

  // --- Outro card ---
  outroContent: {
    alignItems: 'center',
    gap: SPACING.lg,
  } as ViewStyle,
  outroHeadline: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: '#fff',
    textAlign: 'center',
  } as TextStyle,
  outroSubtext: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 28,
  } as TextStyle,
  outroCta: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: 16,
    marginTop: SPACING.md,
  } as ViewStyle,
  outroCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: '#000',
    letterSpacing: 0.5,
  } as TextStyle,
  outroFooter: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    textTransform: 'lowercase',
    marginTop: SPACING.xxl,
  } as TextStyle,

  // --- Watermark ---
  watermark: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  } as ViewStyle,
  watermarkText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 4,
  } as TextStyle,

  // --- Paused ---
  pausedOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  } as ViewStyle,
  pausedText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
  } as TextStyle,

  // --- Empty ---
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  emptyBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
  } as ViewStyle,
  emptyBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
});

export default withComingSoon(TripStoryScreen, {
  routeName: 'trip-story',
  title: 'Trip Story',
});
