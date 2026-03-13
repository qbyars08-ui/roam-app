// =============================================================================
// ROAM — Trip Wrapped: Your Year in Travel
// Spotify Wrapped for travel. 5-card swipeable stack, shareable as PNG.
// =============================================================================
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from '../lib/view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS, VIBES } from '../lib/constants';
import {
  generateYearInReview,
  type YearInReview,
} from '../lib/travel-year';
import { withComingSoon } from '../lib/with-coming-soon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;

// =============================================================================
// Personality Labels
// =============================================================================
const PERSONALITY_LABELS: Record<string, { title: string; desc: string }> = {
  backpacker: {
    title: 'The Budget Ninja',
    desc: 'You see the world without breaking the bank. Respect.',
  },
  comfort: {
    title: 'The Smart Spender',
    desc: 'Nice hotels, real food, zero guilt. You know what matters.',
  },
  'treat-yourself': {
    title: 'The Experience Collector',
    desc: 'Life is short. You travel accordingly.',
  },
  'no-budget': {
    title: 'The High Roller',
    desc: 'When you go, you GO. No compromises.',
  },
};

function getPersonality(review: YearInReview): { title: string; desc: string } {
  const topBudget = review.budgetBreakdown[0]?.tier ?? 'comfort';
  return PERSONALITY_LABELS[topBudget] ?? PERSONALITY_LABELS.comfort;
}

function getVibeLabel(vibeId: string): string {
  return VIBES.find((v) => v.id === vibeId)?.label ?? vibeId;
}

// =============================================================================
// Card Gradients
// =============================================================================
const CARD_GRADIENTS: string[][] = [
  [COLORS.bg, COLORS.gradientForestDeep, COLORS.gradientForestDarker], // Overview
  [COLORS.gradientPurple, COLORS.gradientMidnight, COLORS.bg], // Stats
  [COLORS.gradientMidnight, COLORS.gradientForestDeep, COLORS.bg], // Personality
  [COLORS.bg, COLORS.gradientPurple, COLORS.gradientMidnight], // Top Vibes
  [COLORS.gradientForestDeep, COLORS.bg, COLORS.gradientForestDarker], // Next Year
];

// =============================================================================
// Main Screen
// =============================================================================
function TripWrappedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [review, setReview] = useState<YearInReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(0);
  const cardRefs = useRef<(React.ElementRef<typeof ViewShot> | null)[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadReview();
  }, []);

  const loadReview = async () => {
    setLoading(true);
    try {
      const data = await generateYearInReview();
      setReview(data);

      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleIn, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {
      // Failed to generate
    } finally {
      setLoading(false);
    }
  };

  const handleShare = useCallback(async (index: number) => {
    const ref = cardRefs.current[index];
    if (!ref) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Trip Wrapped',
      });
    } catch {
      // cancelled
    }
  }, []);

  const handleShareAll = useCallback(async () => {
    // Share the currently visible card
    handleShare(activeCard);
  }, [activeCard, handleShare]);

  const goToCard = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({
        x: index * (CARD_WIDTH + SPACING.md),
        animated: true,
      });
      setActiveCard(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    []
  );

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.loadingCenter}>
          <Text style={styles.loadingText}>Wrapping your year in travel...</Text>
          <Text style={styles.loadingSubtext}>
            Crunching the numbers on everywhere you have been
          </Text>
        </View>
      </View>
    );
  }

  if (!review) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backBtn}>{'\u2190'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Trip Wrapped</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>Nothing to wrap yet</Text>
          <Text style={styles.emptyBody}>
            Plan some trips and come back at the end of the year. We will have your recap ready.
          </Text>
        </View>
      </View>
    );
  }

  const personality = getPersonality(review);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>{'\u2190'}</Text>
        </Pressable>
        <View>
          <Text style={styles.headerEyebrow}>YOUR YEAR IN TRAVEL</Text>
          <Text style={styles.headerTitle}>Trip Wrapped</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Dot Indicators */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Pressable key={i} onPress={() => goToCard(i)}>
            <View
              style={[
                styles.dot,
                activeCard === i && styles.dotActive,
              ]}
            />
          </Pressable>
        ))}
      </View>

      {/* Cards Carousel */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeIn,
          transform: [{ scale: scaleIn }],
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          snapToInterval={CARD_WIDTH + SPACING.md}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / (CARD_WIDTH + SPACING.md)
            );
            setActiveCard(index);
          }}
        >
          {/* Card 1: Overview */}
          <ViewShot
            ref={(ref: React.ElementRef<typeof ViewShot> | null) => { cardRefs.current[0] = ref; }}
            options={{ format: 'png', quality: 1 }}
          >
            <LinearGradient
              colors={CARD_GRADIENTS[0] as [string, string, ...string[]]}
              style={styles.wrappedCard}
            >
              <Text style={styles.cardBrand}>ROAM</Text>
              <Text style={styles.cardYear}>{review.year}</Text>
              <Text style={styles.cardHeadline}>{review.headline}</Text>

              <View style={styles.bigStatRow}>
                <BigStat value={`${review.tripsGenerated}`} label="Trips Planned" />
                <BigStat value={`${review.totalDaysPlanned}`} label="Days Planned" />
              </View>

              <View style={styles.destList}>
                {review.uniqueDestinations.slice(0, 6).map((d) => (
                  <View key={d} style={styles.destChip}>
                    <Text style={styles.destChipText}>{d}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.cardFooter}>
                Go somewhere that changes you.
              </Text>
            </LinearGradient>
          </ViewShot>

          {/* Card 2: Stats Deep Dive */}
          <ViewShot
            ref={(ref: React.ElementRef<typeof ViewShot> | null) => { cardRefs.current[1] = ref; }}
            options={{ format: 'png', quality: 1 }}
          >
            <LinearGradient
              colors={CARD_GRADIENTS[1] as [string, string, ...string[]]}
              style={styles.wrappedCard}
            >
              <Text style={styles.cardBrand}>ROAM</Text>
              <Text style={styles.cardSectionTitle}>By the Numbers</Text>

              <View style={styles.statsGrid}>
                <StatBlock
                  value={`${review.uniqueDestinations.length}`}
                  label="Unique Destinations"
                />
                <StatBlock
                  value={`${review.avgTripLength}`}
                  label="Avg Trip Length (days)"
                />
                <StatBlock
                  value={review.favoriteDestination ?? '—'}
                  label="Most Planned"
                  isText
                />
                <StatBlock
                  value={`${review.totalDaysPlanned}`}
                  label="Days Planned"
                />
              </View>

              <Text style={styles.cardFooter}>
                Go somewhere that changes you.
              </Text>
            </LinearGradient>
          </ViewShot>

          {/* Card 3: Travel Personality */}
          <ViewShot
            ref={(ref: React.ElementRef<typeof ViewShot> | null) => { cardRefs.current[2] = ref; }}
            options={{ format: 'png', quality: 1 }}
          >
            <LinearGradient
              colors={CARD_GRADIENTS[2] as [string, string, ...string[]]}
              style={styles.wrappedCard}
            >
              <Text style={styles.cardBrand}>ROAM</Text>
              <Text style={styles.cardSectionTitle}>Your Travel Type</Text>

              <Text style={styles.personalityTitle}>{personality.title}</Text>
              <Text style={styles.personalityDesc}>{personality.desc}</Text>

              {/* Budget Breakdown */}
              <View style={styles.budgetBreakdown}>
                {review.budgetBreakdown.map((b) => {
                  const tier = BUDGETS.find((bt) => bt.id === b.tier);
                  return (
                    <View key={b.tier} style={styles.budgetRow}>
                      <Text style={styles.budgetLabel}>
                        {tier?.label ?? b.tier}
                      </Text>
                      <View style={styles.budgetBar}>
                        <View
                          style={[
                            styles.budgetBarFill,
                            {
                              width: `${Math.min(
                                100,
                                (b.count / review.tripsGenerated) * 100
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.budgetCount}>{b.count}</Text>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.personalityShift}>
                {review.personalityShift}
              </Text>

              <Text style={styles.cardFooter}>
                Go somewhere that changes you.
              </Text>
            </LinearGradient>
          </ViewShot>

          {/* Card 4: Top Vibes */}
          <ViewShot
            ref={(ref: React.ElementRef<typeof ViewShot> | null) => { cardRefs.current[3] = ref; }}
            options={{ format: 'png', quality: 1 }}
          >
            <LinearGradient
              colors={CARD_GRADIENTS[3] as [string, string, ...string[]]}
              style={styles.wrappedCard}
            >
              <Text style={styles.cardBrand}>ROAM</Text>
              <Text style={styles.cardSectionTitle}>Your Top Vibes</Text>

              {review.topVibes.length > 0 ? (
                <View style={styles.vibesStack}>
                  {review.topVibes.map((v, i) => (
                    <View key={v.vibe} style={styles.vibeRow}>
                      <Text style={styles.vibeRank}>#{i + 1}</Text>
                      <View style={styles.vibeInfo}>
                        <Text style={styles.vibeName}>
                          {getVibeLabel(v.vibe)}
                        </Text>
                        <View style={styles.vibeBarBg}>
                          <View
                            style={[
                              styles.vibeBarFill,
                              {
                                width: `${Math.min(
                                  100,
                                  (v.count /
                                    (review.topVibes[0]?.count ?? 1)) *
                                    100
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.vibeCount}>{v.count}x</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noVibesText}>
                  No vibes recorded yet. Plan more trips!
                </Text>
              )}

              <Text style={styles.cardFooter}>
                Go somewhere that changes you.
              </Text>
            </LinearGradient>
          </ViewShot>

          {/* Card 5: Next Year CTA */}
          <ViewShot
            ref={(ref: React.ElementRef<typeof ViewShot> | null) => { cardRefs.current[4] = ref; }}
            options={{ format: 'png', quality: 1 }}
          >
            <LinearGradient
              colors={CARD_GRADIENTS[4] as [string, string, ...string[]]}
              style={styles.wrappedCard}
            >
              <Text style={styles.cardBrand}>ROAM</Text>
              <Text style={styles.cardSectionTitle}>
                {review.year + 1} Awaits
              </Text>

              <Text style={styles.nextYearText}>
                {review.tripsGenerated === 0
                  ? 'Your first trip is out there. Stop scrolling and start planning.'
                  : review.tripsGenerated < 3
                  ? `You planned ${review.tripsGenerated} trips this year. Next year, aim higher.`
                  : review.tripsGenerated < 6
                  ? `${review.tripsGenerated} trips and counting. Next year is going to be even bigger.`
                  : `${review.tripsGenerated} trips? You're not slowing down. Keep going.`}
              </Text>

              {review.favoriteDestination && (
                <Text style={styles.nextSuggestion}>
                  You keep coming back to {review.favoriteDestination}. Maybe it
                  is time to try something completely different.
                </Text>
              )}

              <View style={styles.ctaWrapper}>
                <Text style={styles.ctaText}>Plan your next trip</Text>
              </View>

              <Text style={styles.cardFooter}>
                Go somewhere that changes you.
              </Text>
            </LinearGradient>
          </ViewShot>
        </ScrollView>
      </Animated.View>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Pressable
          style={({ pressed }) => [
            styles.shareBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleShareAll}
        >
          <LinearGradient
            colors={[COLORS.sage, COLORS.sageMedium]}
            style={styles.shareBtnGradient}
          >
            <Text style={styles.shareBtnText}>
              Share this card
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================
function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.bigStat}>
      <Text style={styles.bigStatValue}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
    </View>
  );
}

function StatBlock({
  value,
  label,
  isText,
}: {
  value: string;
  label: string;
  isText?: boolean;
}) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statBlockValue, isText && styles.statBlockText]}>
        {value}
      </Text>
      <Text style={styles.statBlockLabel}>{label}</Text>
    </View>
  );
}

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
  backBtn: {
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  headerEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.whiteMuted,
  } as ViewStyle,
  dotActive: {
    backgroundColor: COLORS.sage,
    width: 24,
  } as ViewStyle,

  // Loading
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  loadingSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Empty
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // Carousel
  carouselContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Wrapped Card Base
  wrappedCard: {
    width: CARD_WIDTH,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    minHeight: 520,
  } as ViewStyle,
  cardBrand: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  cardYear: {
    fontFamily: FONTS.header,
    fontSize: 64,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,
  cardHeadline: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamBright,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xl,
  } as TextStyle,
  cardSectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,
  cardFooter: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamFaint,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 'auto' as unknown as number,
    paddingTop: SPACING.lg,
  } as TextStyle,

  // Big Stats
  bigStatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxl,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  bigStat: {
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  bigStatValue: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.cream,
  } as TextStyle,
  bigStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  // Destination Chips
  destList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  destChip: {
    backgroundColor: COLORS.sageHighlight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.sageStrong,
  } as ViewStyle,
  destChipText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  } as ViewStyle,
  statBlock: {
    width: '44%' as unknown as number,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  statBlockValue: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  statBlockText: {
    fontSize: 18,
  } as TextStyle,
  statBlockLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  } as TextStyle,

  // Personality
  personalityTitle: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  personalityDesc: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamBrightSoft,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: SPACING.lg,
  } as TextStyle,
  personalityShift: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.md,
  } as TextStyle,

  // Budget Breakdown
  budgetBreakdown: {
    gap: SPACING.sm,
  } as ViewStyle,
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  budgetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    width: 80,
    letterSpacing: 1,
  } as TextStyle,
  budgetBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.whiteSoft,
    overflow: 'hidden',
  } as ViewStyle,
  budgetBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  budgetCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    width: 24,
    textAlign: 'right',
  } as TextStyle,

  // Vibes
  vibesStack: {
    gap: SPACING.md,
  } as ViewStyle,
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  vibeRank: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.gold,
    width: 28,
  } as TextStyle,
  vibeInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  vibeName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  vibeBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.whiteSoft,
    overflow: 'hidden',
  } as ViewStyle,
  vibeBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  vibeCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    width: 28,
    textAlign: 'right',
  } as TextStyle,
  noVibesText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // Next Year
  nextYearText: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamBright,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.lg,
  } as TextStyle,
  nextSuggestion: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
  } as TextStyle,
  ctaWrapper: {
    alignSelf: 'center',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  } as ViewStyle,
  shareBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  shareBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  shareBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.5,
  } as TextStyle,
});

export default withComingSoon(TripWrappedScreen, { routeName: 'trip-wrapped', title: 'Trip Wrapped' });
