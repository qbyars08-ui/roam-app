// =============================================================================
// ROAM — Memory Lane: Trip Journal & Nostalgia Engine
// A beautiful visual timeline of all your past trips
// =============================================================================
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  Dimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { withComingSoon } from '../lib/with-coming-soon';
import type { ComponentType } from 'react';
import { type LucideIcon } from 'lucide-react-native';
import {
  ChevronLeft,
  BookOpen,
  ArrowRight,
  Clock,
  Calendar,
  Wallet,
  Flag,
  Globe,
  Library,
  UtensilsCrossed,
} from 'lucide-react-native';

import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS } from '../lib/constants';
import { useAppStore, type Trip } from '../lib/store';
import { useProGate } from '../lib/pro-gate';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Milestone definitions
// ---------------------------------------------------------------------------
type MilestoneIcon = ComponentType<Record<string, unknown>>;
type Milestone = {
  id: string;
  label: string;
  description: string;
  Icon: MilestoneIcon;
  check: (trips: Trip[]) => boolean;
};

const MILESTONES: Milestone[] = [
  {
    id: 'first-trip',
    label: 'First Trip',
    description: 'Completed your first journey',
    Icon: Flag as MilestoneIcon,
    check: (trips) => trips.length >= 1,
  },
  {
    id: 'globe-trotter',
    label: 'Globe Trotter',
    description: '5+ trips planned',
    Icon: Globe as MilestoneIcon,
    check: (trips) => trips.length >= 5,
  },
  {
    id: 'week-warrior',
    label: 'Week Warrior',
    description: 'A trip that was 7+ days',
    Icon: Calendar as MilestoneIcon,
    check: (trips) => trips.some((t) => t.days >= 7),
  },
  {
    id: 'budget-boss',
    label: 'Budget Boss',
    description: 'Completed a backpacker trip',
    Icon: Wallet as MilestoneIcon,
    check: (trips) => trips.some((t) => t.budget === 'backpacker'),
  },
  {
    id: 'culture-club',
    label: 'Culture Club',
    description: 'Explored culture or history',
    Icon: Library,
    check: (trips) =>
      trips.some((t) =>
        t.vibes.some((v) => v.toLowerCase().includes('culture') || v.toLowerCase().includes('history'))
      ),
  },
  {
    id: 'food-explorer',
    label: 'Food Explorer',
    description: 'Traveled for the food',
    Icon: UtensilsCrossed as MilestoneIcon,
    check: (trips) =>
      trips.some((t) => t.vibes.some((v) => v.toLowerCase().includes('food') || v.toLowerCase().includes('eat'))),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getUniqueDestinations(trips: Trip[]): string[] {
  return [...new Set(trips.map((t) => t.destination))];
}

function getTotalDays(trips: Trip[]): number {
  return trips.reduce((sum, t) => sum + t.days, 0);
}

function getCountries(trips: Trip[]): number {
  // Rough heuristic: unique destinations are a proxy for countries explored
  // In a real app you'd geocode, but for now unique destinations serves
  return getUniqueDestinations(trips).length;
}

function getOnThisDayTrips(trips: Trip[]): Trip[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  return trips.filter((t) => {
    const d = new Date(t.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() !== currentYear;
  });
}

// ---------------------------------------------------------------------------
// Stagger animation hook
// ---------------------------------------------------------------------------
function useStaggerAnim(count: number, delay = 80) {
  const anims = useRef<Animated.Value[]>([]);
  if (anims.current.length !== count) {
    anims.current = Array.from({ length: count }, () => new Animated.Value(0));
  }

  useEffect(() => {
    const animations = anims.current.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: i * delay,
        useNativeDriver: true,
      })
    );
    Animated.stagger(delay, animations).start();
  }, [count, delay]);

  return anims.current;
}

// =============================================================================
// Component
// =============================================================================
function MemoryLaneScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { canAccess } = useProGate('memory-lane');
  const trips = useAppStore((s) => s.trips);

  // All hooks must be declared before any early return (Rules of Hooks)
  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [trips]
  );

  const uniqueDestinations = useMemo(() => getUniqueDestinations(trips), [trips]);
  const totalDays = useMemo(() => getTotalDays(trips), [trips]);
  const countries = useMemo(() => getCountries(trips), [trips]);
  const onThisDayTrips = useMemo(() => getOnThisDayTrips(trips), [trips]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const staggerAnims = useStaggerAnim(sortedTrips.length + 4); // +4 for sections

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!canAccess) router.replace('/paywall');
  }, [canAccess, router]);

  if (!canAccess) return null;

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------
  if (trips.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[COLORS.bg, COLORS.gradientForestDark, COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>

        <View style={styles.emptyContainer}>
          <BookOpen size={64} color={COLORS.sage} strokeWidth={1.5} style={{ marginBottom: SPACING.lg }} />
          <Text style={styles.emptyTitle}>{t('memoryLane.title')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('memoryLane.emptySubtitle')}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.ctaButton, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/generate');
            }}
          >
            <Text style={styles.ctaText}>{t('memoryLane.planFirstTrip')}</Text>
            <ArrowRight size={18} color={COLORS.bg} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestDark, COLORS.gradientNavy, COLORS.bg]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================= */}
        {/* Header */}
        {/* ================================================================= */}
        <Animated.View
          style={[
            styles.headerSection,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <Text style={styles.screenTitle}>{t('memoryLane.title')}</Text>
          <Text style={styles.screenSubtitle}>{t('memoryLane.screenSubtitle')}</Text>
        </Animated.View>

        {/* ================================================================= */}
        {/* Stats Header */}
        {/* ================================================================= */}
        <Animated.View
          style={[
            styles.statsRow,
            {
              opacity: staggerAnims[0] ?? new Animated.Value(1),
              transform: [
                {
                  translateY: (staggerAnims[0] ?? new Animated.Value(1)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <StatBox label={t('memoryLane.statTrips')} value={trips.length} />
          <StatBox label={t('memoryLane.statDays')} value={totalDays} />
          <StatBox label={t('memoryLane.statPlaces')} value={uniqueDestinations.length} />
          <StatBox label={t('memoryLane.statCountries')} value={countries} />
        </Animated.View>

        {/* ================================================================= */}
        {/* On This Day — Nostalgia */}
        {/* ================================================================= */}
        {onThisDayTrips.length > 0 && (
          <Animated.View
            style={[
              styles.nostalgiaSection,
              {
                opacity: staggerAnims[1] ?? new Animated.Value(1),
                transform: [
                  {
                    translateY: (staggerAnims[1] ?? new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {onThisDayTrips.map((trip) => (
              <View key={trip.id} style={styles.nostalgiaCard}>
                <LinearGradient
                  colors={[COLORS.coralLight, COLORS.dangerSubtle]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.nostalgiaInner}>
                  <Clock size={20} color={COLORS.coral} strokeWidth={2} />
                  <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                    <Text style={styles.nostalgiaTitle}>{t('memoryLane.onThisDay')}</Text>
                    <Text style={styles.nostalgiaBody}>
                      You were in {trip.destination} this time in{' '}
                      {new Date(trip.createdAt).getFullYear()}!
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* ================================================================= */}
        {/* Passport Stamps — Stylized destination grid */}
        {/* ================================================================= */}
        <Animated.View
          style={[
            styles.passportSection,
            {
              opacity: staggerAnims[2] ?? new Animated.Value(1),
              transform: [
                {
                  translateY: (staggerAnims[2] ?? new Animated.Value(1)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>· {t('memoryLane.passportStamps')}</Text>
          <View style={styles.stampsGrid}>
            {uniqueDestinations.map((dest, i) => (
              <View
                key={dest}
                style={[
                  styles.stampItem,
                  {
                    transform: [
                      { rotate: `${((i % 5) - 2) * 4}deg` },
                      { translateY: (i % 3) * 4 - 4 },
                    ],
                  },
                ]}
              >
                <View style={styles.stampBorder}>
                  <Text style={styles.stampText}>{dest.toUpperCase()}</Text>
                  <View style={styles.stampDivider} />
                  <Text style={styles.stampSubtext}>VISITED</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ================================================================= */}
        {/* Milestones */}
        {/* ================================================================= */}
        <Animated.View
          style={[
            styles.milestonesSection,
            {
              opacity: staggerAnims[3] ?? new Animated.Value(1),
              transform: [
                {
                  translateY: (staggerAnims[3] ?? new Animated.Value(1)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionLabel}>· {t('memoryLane.milestones')}</Text>
          <View style={styles.milestonesGrid}>
            {MILESTONES.map((m) => {
              const earned = m.check(trips);
              return (
                <View key={m.id} style={[styles.milestoneCard, !earned && styles.milestoneCardDimmed]}>
                  <LinearGradient
                    colors={
                      earned
                        ? [COLORS.goldMuted, COLORS.goldSoft]
                        : [COLORS.bgGlass, COLORS.bgCard]
                    }
                    style={StyleSheet.absoluteFill}
                  />
                  <m.Icon
                    size={24}
                    color={earned ? COLORS.gold : COLORS.creamMuted}
                    style={{ marginBottom: SPACING.xs }}
                  />
                  <Text style={[styles.milestoneName, earned && styles.milestoneNameEarned]}>
                    {m.label}
                  </Text>
                  <Text style={[styles.milestoneDesc, earned && styles.milestoneDescEarned]}>
                    {m.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ================================================================= */}
        {/* Timeline */}
        {/* ================================================================= */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.xl, marginBottom: SPACING.md }]}>
          · {t('memoryLane.yourJourney')}
        </Text>

        <View style={styles.timelineContainer}>
          {/* Vertical timeline line */}
          <View style={styles.timelineLine} />

          {sortedTrips.map((trip, index) => {
            const animIndex = index + 4; // offset for earlier sections
            const anim = staggerAnims[animIndex] ?? new Animated.Value(1);
            const budgetLabel = BUDGETS.find((b) => b.id === trip.budget)?.label ?? trip.budget;

            return (
              <Animated.View
                key={trip.id}
                style={[
                  styles.timelineItem,
                  {
                    opacity: anim,
                    transform: [
                      {
                        translateX: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* Timeline dot */}
                <View style={styles.timelineDotOuter}>
                  <View style={styles.timelineDot} />
                </View>

                {/* Date badge */}
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{formatMonthYear(trip.createdAt)}</Text>
                </View>

                {/* Trip card */}
                <View style={styles.tripCard}>
                  <LinearGradient
                    colors={[COLORS.bgGlass, COLORS.whiteFaint]}
                    style={StyleSheet.absoluteFill}
                  />

                  <Text style={styles.tripDestination}>{trip.destination}</Text>

                  <View style={styles.tripMeta}>
                    <View style={styles.tripChip}>
                      <Calendar size={12} color={COLORS.sage} strokeWidth={2} />
                      <Text style={styles.tripChipText}>{trip.days} days</Text>
                    </View>
                    <View style={styles.tripChip}>
                      <Wallet size={12} color={COLORS.sage} strokeWidth={2} />
                      <Text style={styles.tripChipText}>{budgetLabel}</Text>
                    </View>
                  </View>

                  {trip.vibes.length > 0 && (
                    <View style={styles.vibesRow}>
                      {trip.vibes.map((v) => (
                        <View key={v} style={styles.vibePill}>
                          <Text style={styles.vibePillText}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Pressable
                    style={({ pressed }) => [
                      styles.reliveBtn,
                      { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/itinerary',
                        params: { tripId: trip.id },
                      });
                    }}
                  >
                    <Text style={styles.reliveBtnText}>{t('memoryLane.reliveTrip')}</Text>
                    <ArrowRight size={14} color={COLORS.sage} strokeWidth={2} />
                  </Pressable>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat box sub-component
// ---------------------------------------------------------------------------
function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <LinearGradient colors={[COLORS.bgGlass, COLORS.bgCard]} style={StyleSheet.absoluteFill} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const TIMELINE_LEFT = 28;

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + SPACING.lg,
  } as ViewStyle,
  backBtn: {
    position: 'absolute',
    top: SPACING.xxl + 12,
    left: SPACING.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Header
  headerSection: {
    marginBottom: SPACING.xl,
    paddingLeft: SPACING.xl,
  } as ViewStyle,
  screenTitle: {
    fontFamily: FONTS.header,
    fontSize: 38,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  screenSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  statBox: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  } as TextStyle,

  // Nostalgia
  nostalgiaSection: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  nostalgiaCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  nostalgiaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  } as ViewStyle,
  nostalgiaTitle: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.coral,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as TextStyle,
  nostalgiaBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,

  // Passport stamps
  passportSection: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
  } as TextStyle,
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  } as ViewStyle,
  stampItem: {
    marginHorizontal: SPACING.xs,
    marginVertical: SPACING.xs,
  } as ViewStyle,
  stampBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderStyle: 'dashed',
  } as ViewStyle,
  stampText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  stampDivider: {
    width: 20,
    height: 1,
    backgroundColor: COLORS.sage,
    marginVertical: 3,
    opacity: 0.4,
  } as ViewStyle,
  stampSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.creamMuted,
    letterSpacing: 2,
  } as TextStyle,

  // Milestones
  milestonesSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  milestoneCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  milestoneCardDimmed: {
    opacity: 0.35,
  } as ViewStyle,
  milestoneName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,
  milestoneNameEarned: {
    color: COLORS.gold,
  } as TextStyle,
  milestoneDesc: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  milestoneDescEarned: {
    color: COLORS.cream,
    opacity: 0.7,
  } as TextStyle,

  // Timeline
  timelineContainer: {
    position: 'relative',
    paddingLeft: TIMELINE_LEFT + SPACING.lg,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  timelineLine: {
    position: 'absolute',
    left: TIMELINE_LEFT / 2 - 1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.sage,
    opacity: 0.25,
    borderRadius: 1,
  } as ViewStyle,
  timelineItem: {
    marginBottom: SPACING.xl,
    position: 'relative',
  } as ViewStyle,
  timelineDotOuter: {
    position: 'absolute',
    left: -(TIMELINE_LEFT + SPACING.lg) + TIMELINE_LEFT / 2 - 7,
    top: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.sage,
  } as ViewStyle,
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  dateBadge: {
    position: 'absolute',
    left: -(TIMELINE_LEFT + SPACING.lg) - 4,
    top: 28,
    width: TIMELINE_LEFT + SPACING.md,
  } as ViewStyle,
  dateBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
  } as TextStyle,

  // Trip card
  tripCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  tripDestination: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  tripMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  tripChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  tripChipText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  } as ViewStyle,
  vibePill: {
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  vibePillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  reliveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingTop: SPACING.xs,
  } as ViewStyle,
  reliveBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 34,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  } as TextStyle,
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});

export default withComingSoon(MemoryLaneScreen, { routeName: 'memory-lane', title: 'Memory Lane' });
