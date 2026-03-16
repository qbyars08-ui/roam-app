// =============================================================================
// ROAM — Trip Countdown
// Beautiful animated countdown to departure. Daily tips, weather preview,
// packing reminders, and a shareable "X days until..." card.
// No travel app does this. Pure engagement + viral sharing.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from '../lib/view-shot';
import * as Sharing from 'expo-sharing';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary } from '../lib/types/itinerary';
import { getDestinationTheme } from '../lib/destination-themes';
import { getDestinationPhoto } from '../lib/photos';
import {
  ChevronLeft, Share2, Clock, Plane, Sparkles,
  Sun, Cloud, Umbrella, ShoppingBag, Camera,
  Heart, MapPin, Star, Zap, Coffee,
} from 'lucide-react-native';
import { withComingSoon } from '../lib/with-coming-soon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// Countdown tips — daily inspiration that rotates
// =============================================================================
const COUNTDOWN_TIPS: { icon: React.ReactNode; text: string; category: string }[] = [
  { icon: <ShoppingBag size={16} color={COLORS.sage} strokeWidth={2} />, text: 'Start your packing list today. You\'ll thank yourself later.', category: 'packing' },
  { icon: <Camera size={16} color={COLORS.coral} strokeWidth={2} />, text: 'Download offline maps for your destination. No WiFi needed.', category: 'prep' },
  { icon: <Coffee size={16} color={COLORS.gold} strokeWidth={2} />, text: 'Research local breakfast spots. The best meals happen early.', category: 'food' },
  { icon: <Heart size={16} color={COLORS.coral} strokeWidth={2} />, text: 'Tell someone you\'re excited. Anticipation is half the joy.', category: 'vibes' },
  { icon: <MapPin size={16} color={COLORS.sage} strokeWidth={2} />, text: 'Save your hotel address in your phone\'s notes — works offline.', category: 'prep' },
  { icon: <Star size={16} color={COLORS.gold} strokeWidth={2} />, text: 'Learn 3 phrases in the local language. Locals will love it.', category: 'culture' },
  { icon: <Zap size={16} color={COLORS.sage} strokeWidth={2} />, text: 'Check if you need a travel adapter. Different plugs, different world.', category: 'packing' },
  { icon: <Sun size={16} color={COLORS.gold} strokeWidth={2} />, text: 'Check the sunset time. The golden hour won\'t wait for you.', category: 'vibes' },
  { icon: <Plane size={16} color={COLORS.cream} strokeWidth={2} />, text: 'Screenshot your boarding pass. Screenshots never lose WiFi.', category: 'prep' },
  { icon: <Camera size={16} color={COLORS.coral} strokeWidth={2} />, text: 'Clear your camera roll. You\'re gonna need the space.', category: 'prep' },
];

// =============================================================================
// Milestone messages
// =============================================================================
function getMilestoneMessage(daysLeft: number): string | null {
  if (daysLeft === 30) return 'One month out. The countdown is real.';
  if (daysLeft === 14) return 'Two weeks. Time to get serious about packing.';
  if (daysLeft === 7) return 'One week. Can you feel it?';
  if (daysLeft === 3) return 'Three days. This is not a drill.';
  if (daysLeft === 1) return 'Tomorrow. Sleep tight — if you can.';
  if (daysLeft === 0) return 'Today\'s the day. Go make memories.';
  return null;
}

// =============================================================================
// Animated countdown digit
// =============================================================================
const CountdownDigit = React.memo(function CountdownDigit({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.digitContainer,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <Text style={[styles.digitValue, { color }]}>{value}</Text>
      <Text style={styles.digitLabel}>{label}</Text>
    </Animated.View>
  );
});

// =============================================================================
// Pulsing ring animation
// =============================================================================
const PulsingRing = React.memo(function PulsingRing({ color }: { color: string }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });
  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
});

// =============================================================================
// Main Screen
// =============================================================================
function TripCountdownScreen() {
  const { tripId, departureDate: departureDateParam } = useLocalSearchParams<{
    tripId?: string;
    departureDate?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);
  const viewShotRef = useRef<View>(null);

  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? trips[0] ?? null,
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

  // Calculate departure date — use param or estimate from trip creation + days
  const departureDate = useMemo(() => {
    if (departureDateParam) return new Date(departureDateParam);
    if (!trip) return new Date();
    // Default: assume trip starts 14 days from creation
    const created = new Date(trip.createdAt);
    created.setDate(created.getDate() + 14);
    return created;
  }, [departureDateParam, trip]);

  // Calculate countdown
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    const diff = departureDate.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, total: diff };
  }, [departureDate, now]);

  // Daily tip (changes based on day of year)
  const dailyTip = useMemo(() => {
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return COUNTDOWN_TIPS[dayOfYear % COUNTDOWN_TIPS.length];
  }, [now]);

  const milestone = useMemo(
    () => getMilestoneMessage(countdown.days),
    [countdown.days]
  );

  // Share countdown card
  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${countdown.days} days until ${trip?.destination ?? 'my trip'}!`,
        });
      }
    } catch {
      // Sharing cancelled or unavailable
    }
  }, [countdown.days, trip?.destination]);

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  if (!trip || !theme) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>No trip found</Text>
          <Pressable onPress={() => router.back()} style={styles.backPill}>
            <Text style={styles.backPillText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={28} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Countdown</Text>
        <Pressable onPress={handleShare} hitSlop={12}>
          <Share2 size={22} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Shareable countdown card */}
          <ViewShot ref={viewShotRef} style={styles.countdownCardWrap}>
            <LinearGradient
              colors={[theme.gradient[0], theme.gradient[1], COLORS.bg]}
              style={styles.countdownCard}
            >
              {/* Pulsing rings */}
              <View style={styles.pulseContainer}>
                <PulsingRing color={theme.primary} />
                <PulsingRing color={theme.secondary} />
              </View>

              {/* Destination */}
              <Text style={styles.countdownEmoji}>{theme.emoji}</Text>
              <Text style={styles.countdownDest}>{trip.destination}</Text>

              {/* Big countdown number */}
              <View style={styles.bigCountdownWrap}>
                <Text style={[styles.bigCountdownNum, { color: theme.primary }]}>
                  {countdown.days}
                </Text>
                <Text style={styles.bigCountdownLabel}>
                  {countdown.days === 1 ? 'day to go' : 'days to go'}
                </Text>
              </View>

              {/* HH:MM:SS detail */}
              <View style={styles.detailRow}>
                <CountdownDigit value={countdown.hours} label="hrs" color={theme.primary} />
                <Text style={styles.detailSep}>:</Text>
                <CountdownDigit value={countdown.minutes} label="min" color={theme.primary} />
                <Text style={styles.detailSep}>:</Text>
                <CountdownDigit value={countdown.seconds} label="sec" color={theme.primary} />
              </View>

              {/* Trip meta */}
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Clock size={12} color={COLORS.creamMuted} strokeWidth={2} />
                  <Text style={styles.metaText}>{trip.days} days</Text>
                </View>
                <View style={styles.metaPill}>
                  <Plane size={12} color={COLORS.creamMuted} strokeWidth={2} />
                  <Text style={styles.metaText}>
                    {departureDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              {/* ROAM branding for shares */}
              <Text style={styles.brandingText}>ROAM</Text>
            </LinearGradient>
          </ViewShot>

          {/* Milestone alert */}
          {milestone && (
            <View style={[styles.milestoneCard, { borderColor: theme.primary }]}>
              <Sparkles size={20} color={theme.primary} strokeWidth={2} />
              <Text style={styles.milestoneText}>{milestone}</Text>
            </View>
          )}

          {/* Daily tip */}
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Sparkles size={14} color={COLORS.gold} strokeWidth={2} />
              <Text style={styles.tipHeaderText}>Daily Travel Tip</Text>
            </View>
            <View style={styles.tipContent}>
              {dailyTip.icon}
              <Text style={styles.tipText}>{dailyTip.text}</Text>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/trip-story', params: { tripId: trip.id } } as never);
              }}
              style={({ pressed }) => [
                styles.actionCard,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Sparkles size={24} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.actionLabel}>View Story</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/trip-album', params: { tripId: trip.id } } as never);
              }}
              style={({ pressed }) => [
                styles.actionCard,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Camera size={24} color={COLORS.coral} strokeWidth={2} />
              <Text style={styles.actionLabel}>Photo Album</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.actionCard,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Share2 size={24} color={COLORS.gold} strokeWidth={2} />
              <Text style={styles.actionLabel}>Share</Text>
            </Pressable>
          </View>

          {/* Packing checklist preview */}
          {itinerary?.packingEssentials && itinerary.packingEssentials.length > 0 && (
            <View style={styles.packingCard}>
              <View style={styles.packingHeader}>
                <ShoppingBag size={18} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.packingTitle}>Packing Essentials</Text>
              </View>
              {itinerary.packingEssentials.slice(0, 6).map((item, i) => (
                <View key={item} style={styles.packingItem}>
                  <View style={styles.packingCheckbox} />
                  <Text style={styles.packingItemText}>{item}</Text>
                </View>
              ))}
              {itinerary.packingEssentials.length > 6 && (
                <Text style={styles.packingMore}>
                  +{itinerary.packingEssentials.length - 6} more items
                </Text>
              )}
            </View>
          )}

          {/* Pro tip from itinerary */}
          {itinerary?.proTip && (
            <View style={styles.proTipCard}>
              <Text style={styles.proTipLabel}>PRO TIP</Text>
              <Text style={styles.proTipText}>{itinerary.proTip}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

export default withComingSoon(TripCountdownScreen, {
  routeName: 'trip-countdown',
  title: 'Trip Countdown',
});

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  } as ViewStyle,

  // Countdown card
  countdownCardWrap: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  } as ViewStyle,
  countdownCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl + SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    position: 'relative',
  } as ViewStyle,
  pulseContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -60,
    marginLeft: -60,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  } as ViewStyle,
  countdownEmoji: {
    fontSize: 48,
  } as TextStyle,
  countdownDest: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  bigCountdownWrap: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  } as ViewStyle,
  bigCountdownNum: {
    fontFamily: FONTS.header,
    fontSize: 80,
    lineHeight: 88,
  } as TextStyle,
  bigCountdownLabel: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  } as TextStyle,
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  detailSep: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.creamMuted,
  } as TextStyle,
  digitContainer: {
    alignItems: 'center',
    minWidth: 44,
  } as ViewStyle,
  digitValue: {
    fontFamily: FONTS.header,
    fontSize: 28,
  } as TextStyle,
  digitLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  } as ViewStyle,
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  metaText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  brandingText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 3,
    marginTop: SPACING.md,
    opacity: 0.5,
  } as TextStyle,

  // Milestone
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
  } as ViewStyle,
  milestoneText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 22,
  } as TextStyle,

  // Daily tip
  tipCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  tipHeaderText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 22,
  } as TextStyle,

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  } as ViewStyle,
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  actionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,

  // Packing
  packingCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  packingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  packingTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  packingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  packingCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  packingItemText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  packingMore: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 4,
    paddingLeft: 26,
  } as TextStyle,

  // Pro tip
  proTipCard: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  proTipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  proTipText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  // Empty
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
  backPill: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  backPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
});
