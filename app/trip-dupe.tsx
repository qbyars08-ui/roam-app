// =============================================================================
// ROAM — Trip Dupe Mode
// "Can't afford Maldives? Here's Lombok."
// Find budget-friendly alternatives to dream destinations
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';
import { useAppStore } from '../lib/store';
import { callClaude, TripLimitReachedError } from '../lib/claude';
import { getMockDupeResult } from '../lib/mock-fallback';
import MockDataBadge from '../components/ui/MockDataBadge';
import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Dupe prompt — separate from main itinerary prompt
// ---------------------------------------------------------------------------
const DUPE_SYSTEM_PROMPT = `You are ROAM's Trip Dupe engine. Given a "dream destination" the user can't afford, find the perfect budget-friendly alternative.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

JSON schema:
{
  "dream": "The original dream destination",
  "dupe": "The budget-friendly alternative city",
  "dupeCountry": "Country name",
  "dupeEmoji": "Single flag or destination emoji",
  "whyItWorks": "2-3 sentence explanation of why this is a perfect dupe — mention specific similarities (food, scenery, vibe, architecture)",
  "costComparison": {
    "dreamPerDay": "$XXX",
    "dupePerDay": "$XX",
    "savings": "XX%"
  },
  "similarVibes": ["vibe1", "vibe2", "vibe3"],
  "topPicks": [
    { "category": "Stay", "name": "Specific hotel/hostel name", "price": "$XX/night" },
    { "category": "Eat", "name": "Specific restaurant/food spot", "price": "$X" },
    { "category": "Do", "name": "Specific activity or experience", "price": "$X" }
  ],
  "bestMonth": "When to go for the best experience + weather"
}

Guidelines:
- Be SURPRISING — don't suggest obvious alternatives. Think laterally.
- Always suggest somewhere genuinely great, not just cheap.
- The dupe should share the SOUL of the dream destination, not just surface aesthetics.
- Real places, real prices, real recommendations.
- Focus on what makes the dupe BETTER in some ways, not just cheaper.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DupeResult {
  dream: string;
  dupe: string;
  dupeCountry: string;
  dupeEmoji: string;
  whyItWorks: string;
  costComparison: {
    dreamPerDay: string;
    dupePerDay: string;
    savings: string;
  };
  similarVibes: string[];
  topPicks: Array<{
    category: string;
    name: string;
    price: string;
  }>;
  bestMonth: string;
}

type Phase = 'pick' | 'searching' | 'result';

// ---------------------------------------------------------------------------
// Popular dream destinations
// ---------------------------------------------------------------------------
const DREAM_DESTINATIONS = [
  { label: 'Maldives', emoji: '\uD83C\uDFDD\uFE0F', hook: 'Overwater bungalows, crystal lagoons' },
  { label: 'Santorini', emoji: '\uD83C\uDDEC\uD83C\uDDF7', hook: 'Blue domes, sunset caldera views' },
  { label: 'Swiss Alps', emoji: '\uD83C\uDDE8\uD83C\uDDED', hook: 'Mountain chalets, fondue, pristine peaks' },
  { label: 'Amalfi Coast', emoji: '\uD83C\uDDEE\uD83C\uDDF9', hook: 'Cliffside villages, limoncello, sea views' },
  { label: 'Bora Bora', emoji: '\uD83C\uDDF5\uD83C\uDDEB', hook: 'Turquoise lagoons, luxury overwater' },
  { label: 'Tokyo', emoji: '\uD83C\uDDEF\uD83C\uDDF5', hook: 'Neon-lit streets, Michelin heaven' },
  { label: 'Iceland', emoji: '\uD83C\uDDEE\uD83C\uDDF8', hook: 'Northern lights, dramatic landscapes' },
  { label: 'Dubai', emoji: '\uD83C\uDDE6\uD83C\uDDEA', hook: 'Gold everything, desert luxury' },
  { label: 'Patagonia', emoji: '\uD83C\uDDE6\uD83C\uDDF7', hook: 'Glaciers, peaks, end of the world' },
  { label: 'New Zealand', emoji: '\uD83C\uDDF3\uD83C\uDDFF', hook: 'Epic landscapes, adventure capital' },
  { label: 'Norway Fjords', emoji: '\uD83C\uDDF3\uD83C\uDDF4', hook: 'Dramatic fjords, midnight sun' },
  { label: 'French Riviera', emoji: '\uD83C\uDDEB\uD83C\uDDF7', hook: 'Yacht life, Côte d\'Azur glamour' },
];

function TripDupeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('pick');
  const [selectedDream, setSelectedDream] = useState<string | null>(null);
  const [dupeResult, setDupeResult] = useState<DupeResult | null>(null);
  const [isMockResult, setIsMockResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const handlePickDream = useCallback(
    async (dream: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedDream(dream);
      setPhase('searching');
      setError(null);

      try {
        const response = await callClaude(
          DUPE_SYSTEM_PROMPT,
          `Find the perfect budget-friendly alternative to ${dream}. The user dreams of going there but it's too expensive. What's the "dupe" destination that gives 80% of the magic at 30% of the price?`,
          false // Not a trip generation, just a dupe lookup
        );

        const parsed: DupeResult = JSON.parse(response.content);
        setDupeResult(parsed);
        setPhase('result');

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Animate result card in
        cardScale.setValue(0);
        fadeIn.setValue(0);
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(fadeIn, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      } catch (err) {
        if (err instanceof TripLimitReachedError) {
          router.push({ pathname: '/paywall', params: { reason: 'limit' } });
        } else {
          // Fallback: use mock dupe when API unavailable
          const parsed = getMockDupeResult(dream);
          setDupeResult(parsed);
          setIsMockResult(true);
          setPhase('result');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          cardScale.setValue(0);
          fadeIn.setValue(0);
          Animated.parallel([
            Animated.spring(cardScale, {
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(fadeIn, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    },
    [cardScale, fadeIn, router]
  );

  const handleBuildTrip = useCallback(() => {
    if (!dupeResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Navigate to plan wizard with dupe destination pre-filled
    const { setPlanWizard } = useAppStore.getState();
    setPlanWizard({
      destination: dupeResult.dupe,
      budget: 'backpacker',
      vibes: dupeResult.similarVibes.slice(0, 3),
    });
    router.push('/(tabs)/generate');
  }, [dupeResult, router]);

  const handleShare = useCallback(async () => {
    if (!dupeResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Share.share({
      message: `Can\u2019t afford ${dupeResult.dream}? Try ${dupeResult.dupeEmoji} ${dupeResult.dupe}!\n\n${dupeResult.whyItWorks}\n\nSave ${dupeResult.costComparison.savings} per day\n\nFound with ROAM \u2728`,
    });
  }, [dupeResult]);

  const handleReset = useCallback(() => {
    setPhase('pick');
    setSelectedDream(null);
    setDupeResult(null);
    setIsMockResult(false);
    setError(null);
    cardScale.setValue(0);
    fadeIn.setValue(0);
  }, [cardScale, fadeIn]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close button */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.closeBtnText}>{'\u2715'}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('tripDupe.title')}</Text>
          <Text style={styles.subtitle}>
            {t('tripDupe.subtitle')}
          </Text>
        </View>

        {/* Pick phase */}
        {phase === 'pick' && (
          <View style={styles.pickSection}>
            <Text style={styles.sectionLabel}>{t('tripDupe.pickDreamDestination')}</Text>
            <View style={styles.dreamGrid}>
              {DREAM_DESTINATIONS.map((dest) => (
                <Pressable
                  key={dest.label}
                  onPress={() => handlePickDream(dest.label)}
                  style={({ pressed }) => [
                    styles.dreamCard,
                    { transform: [{ scale: pressed ? 0.96 : 1 }] },
                  ]}
                >
                  <ImageBackground
                    source={{ uri: getDestinationPhoto(dest.label) }}
                    style={styles.dreamCardImage}
                    imageStyle={styles.dreamCardImageInner}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={['transparent', COLORS.overlayLight, COLORS.overlayFull]}
                      locations={[0.3, 0.7, 1]}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.dreamLabel}>{dest.label}</Text>
                    <Text style={styles.dreamHook}>{dest.hook}</Text>
                  </ImageBackground>
                </Pressable>
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}

        {/* Searching phase */}
        {phase === 'searching' && (
          <View style={styles.searchingContainer}>
            <Text style={styles.searchingEmoji}>{'\uD83D\uDD0D'}</Text>
            <Text style={styles.searchingTitle}>
              Finding your {selectedDream} dupe...
            </Text>
            <Text style={styles.searchingSubtitle}>
              {t('tripDupe.aiScouringWorld')}
            </Text>
          </View>
        )}

        {/* Result phase */}
        {phase === 'result' && dupeResult && (
          <Animated.View
            style={[
              styles.resultSection,
              {
                opacity: fadeIn,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            {/* Comparison header */}
            <View style={styles.comparisonHeader}>
              <View style={styles.comparisonSide}>
                <Text style={styles.comparisonLabel}>{t('tripDupe.dream')}</Text>
                <Text style={styles.comparisonCity}>
                  {dupeResult.dream}
                </Text>
                <Text style={styles.comparisonPrice}>
                  {dupeResult.costComparison.dreamPerDay}/day
                </Text>
              </View>

              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>{t('tripDupe.vs')}</Text>
              </View>

              <View style={styles.comparisonSide}>
                <Text style={[styles.comparisonLabel, { color: COLORS.sage }]}>
                  {t('tripDupe.dupe')}
                </Text>
                <Text style={styles.comparisonCity}>
                  {dupeResult.dupeEmoji} {dupeResult.dupe}
                </Text>
                <Text style={[styles.comparisonPrice, { color: COLORS.sage }]}>
                  {dupeResult.costComparison.dupePerDay}/day
                </Text>
              </View>
            </View>

            {/* Savings badge */}
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>
                Save {dupeResult.costComparison.savings}
              </Text>
            </View>

            {/* Why it works */}
            <View style={styles.whyCard}>
              <Text style={styles.whyLabel}>{t('tripDupe.whyItWorks')}</Text>
              <Text style={styles.whyText}>{dupeResult.whyItWorks}</Text>
            </View>

            {/* Vibes */}
            <View style={styles.vibesRow}>
              {dupeResult.similarVibes.map((vibe, i) => (
                <View key={i} style={styles.vibePill}>
                  <Text style={styles.vibeText}>{vibe}</Text>
                </View>
              ))}
            </View>

            {/* Top picks */}
            <View style={styles.picksSection}>
              <Text style={styles.picksLabel}>{t('tripDupe.topPicks')}</Text>
              {dupeResult.topPicks.map((pick, i) => (
                <View key={i} style={styles.pickRow}>
                  <View style={styles.pickCategoryBadge}>
                    <Text style={styles.pickCategory}>{pick.category}</Text>
                  </View>
                  <View style={styles.pickDetails}>
                    <Text style={styles.pickName}>{pick.name}</Text>
                    <Text style={styles.pickPrice}>{pick.price}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Best month */}
            <View style={styles.bestMonthCard}>
              <Text style={styles.bestMonthLabel}>{t('tripDupe.bestTimeToGo')}</Text>
              <Text style={styles.bestMonthText}>{dupeResult.bestMonth}</Text>
            </View>

            {/* Actions */}
            <View style={styles.resultActions}>
              <Pressable
                onPress={handleBuildTrip}
                style={({ pressed }) => [
                  styles.buildButton,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.sage, COLORS.sageDark]}
                  style={styles.buildGradient}
                >
                  <Text style={styles.buildButtonText}>
                    {'\u2728'} {t('tripDupe.buildThisTrip')}
                  </Text>
                </LinearGradient>
              </Pressable>

              <View style={styles.secondaryActions}>
                <Pressable onPress={handleShare} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>
                    {'\uD83D\uDCE4'} Share
                  </Text>
                </Pressable>
                <Pressable onPress={handleReset} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>{t('tripDupe.tryAnother')}</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
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
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  closeBtnText: {
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,

  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 34,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // Pick phase
  pickSection: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  } as TextStyle,
  dreamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  dreamCard: {
    width: '48%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dreamCardImage: {
    minHeight: 120,
    padding: SPACING.md,
    gap: SPACING.xs,
    justifyContent: 'flex-end',
  } as ViewStyle,
  dreamCardImageInner: {
    borderRadius: RADIUS.lg - 1,
  },
  dreamEmoji: {
    fontSize: 24,
  } as TextStyle,
  dreamLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  dreamHook: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    lineHeight: 14,
  } as TextStyle,

  // Searching
  searchingContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  searchingEmoji: {
    fontSize: 64,
  } as TextStyle,
  searchingTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  searchingSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Result
  resultSection: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  mockBadgeWrap: {
    alignSelf: 'flex-start',
  } as ViewStyle,
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  comparisonSide: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  comparisonLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
  } as TextStyle,
  comparisonCity: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  comparisonPrice: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.sm,
  } as ViewStyle,
  vsText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,

  savingsBadge: {
    alignSelf: 'center',
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as ViewStyle,
  savingsText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,

  whyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  whyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  whyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  vibePill: {
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  vibeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  picksSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  picksLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  pickCategoryBadge: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    minWidth: 44,
    alignItems: 'center',
  } as ViewStyle,
  pickCategory: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  pickDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  pickName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  pickPrice: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    marginStart: SPACING.sm,
  } as TextStyle,

  bestMonthCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: SPACING.md,
    gap: SPACING.xs,
    alignItems: 'center',
  } as ViewStyle,
  bestMonthLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 1.5,
  } as TextStyle,
  bestMonthText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  resultActions: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  } as ViewStyle,
  buildButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  buildGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  buildButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
  } as TextStyle,
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
  } as ViewStyle,
  secondaryBtn: {
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  secondaryBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
    textDecorationLine: 'underline',
  } as TextStyle,

  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
    marginTop: SPACING.md,
  } as TextStyle,
});

export default withComingSoon(TripDupeScreen, { routeName: 'trip-dupe', title: 'Trip Dupe' });
