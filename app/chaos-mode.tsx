// =============================================================================
// ROAM — Chaos Mode: One Button. ROAM Picks Everything.
// No input. No decisions. Full surprise trip. Send to the group chat.
// =============================================================================
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
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
import ViewShot, { captureRef } from '../lib/view-shot';
import { Share as RNShare } from 'react-native';
import * as ExpoSharing from 'expo-sharing';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  DESTINATIONS,
  HIDDEN_DESTINATIONS,
  BUDGETS,
  VIBES,
  FREE_TRIPS_PER_MONTH,
} from '../lib/constants';
import { DiceIcon } from '../lib/icons';
import { useAppStore } from '../lib/store';
import { getDestinationPhoto } from '../lib/photos';
import ShimmerOverlay from '../components/ui/ShimmerOverlay';
import { generateItinerary, TripLimitReachedError } from '../lib/claude';
import { isGuestUser } from '../lib/guest';
import { type Itinerary } from '../lib/types/itinerary';
import { saveChaosDare, getDareShareUrl, getDareShareMessage } from '../lib/chaos-dare';
import { withComingSoon } from '../lib/with-coming-soon';

// =============================================================================
// Chaos Messages — shown during generation
// =============================================================================
const CHAOS_MESSAGES = [
  'Closing your eyes and pointing at the map...',
  'Asking the universe where you should go...',
  'Rolling the dice on your next adventure...',
  'Picking a random continent... now narrowing down...',
  'Finding somewhere you have never heard of...',
  'Ignoring your comfort zone entirely...',
  'Consulting the travel gods...',
  'This one is going to be good. Trust me.',
  'Booking your protagonist moment...',
  'Choosing chaos over comfort...',
];

const REVEAL_LINES = [
  'You\'re going to',
  'Pack your bags for',
  'Say hello to',
  'Hope you\'re ready for',
  'Your next story starts in',
];

// =============================================================================
// Helpers
// =============================================================================
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomVibes(): string[] {
  const shuffled = [...VIBES].sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 3) + 1; // 1-3 vibes
  return shuffled.slice(0, count).map((v) => v.id);
}

function pickRandomBudget(): string {
  return pickRandom(BUDGETS).id;
}

function pickRandomDays(): number {
  const options = [3, 4, 5, 7, 10, 14];
  return pickRandom(options);
}

function pickRandomDestination(): string {
  const allDests = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  return pickRandom(allDests).label;
}

// =============================================================================
// Main Screen
// =============================================================================
function ChaosModeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addTrip = useAppStore((s) => s.addTrip);
  const trips = useAppStore((s) => s.trips);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);

  const [phase, setPhase] = useState<
    'idle' | 'generating' | 'reveal' | 'result'
  >('idle');
  const [chaosMessage, setChaosMessage] = useState(CHAOS_MESSAGES[0]);
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(0);
  const [budget, setBudget] = useState('');
  const [vibes, setVibes] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [chaosCardLoaded, setChaosCardLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<React.ElementRef<typeof ViewShot> | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const revealFade = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(0.5)).current;
  const resultSlide = useRef(new Animated.Value(60)).current;
  const resultFade = useRef(new Animated.Value(0)).current;

  // Pulse animation for idle button
  useEffect(() => {
    if (phase !== 'idle') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase, pulseAnim]);

  // Spin animation for generating
  useEffect(() => {
    if (phase !== 'generating') return;
    spinAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [phase, spinAnim]);

  // Cycle chaos messages
  useEffect(() => {
    if (phase !== 'generating') return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % CHAOS_MESSAGES.length;
      setChaosMessage(CHAOS_MESSAGES[idx]);
    }, 2500);
    return () => clearInterval(interval);
  }, [phase]);

  const handleChaos = useCallback(async () => {
    if (isGuestUser() && trips.length >= 1) {
      router.push({ pathname: '/paywall', params: { reason: 'chaos' } });
      return;
    }
    if (!isPro && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      router.push({ pathname: '/paywall', params: { reason: 'chaos' } });
      return;
    }
    setPhase('generating');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Pick random everything
    const dest = pickRandomDestination();
    const d = pickRandomDays();
    const b = pickRandomBudget();
    const v = pickRandomVibes();

    setDestination(dest);
    setDays(d);
    setBudget(b);
    setVibes(v);

    try {
      const result = await generateItinerary({
        destination: dest,
        days: d,
        budget: b,
        vibes: v,
      });

      setItinerary(result.itinerary);

      // Save trip
      const trip = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        destination: dest,
        days: d,
        budget: b,
        vibes: v,
        itinerary: JSON.stringify(result.itinerary),
        createdAt: new Date().toISOString(),
      };
      addTrip(trip);

      // Reveal animation
      setPhase('reveal');
      revealFade.setValue(0);
      revealScale.setValue(0.5);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Animated.parallel([
        Animated.timing(revealFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(revealScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After reveal, show full result
        setTimeout(() => {
          setChaosCardLoaded(false);
          setPhase('result');
          resultSlide.setValue(60);
          resultFade.setValue(0);
          Animated.parallel([
            Animated.timing(resultFade, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.spring(resultSlide, {
              toValue: 0,
              tension: 50,
              friction: 9,
              useNativeDriver: true,
            }),
          ]).start();
        }, 2000);
      });
    } catch (err) {
      if (err instanceof TripLimitReachedError) {
        router.push({ pathname: '/paywall', params: { reason: 'chaos' } });
        return;
      }
      setError(
        t('chaosMode.errorMessage')
      );
      setPhase('idle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [addTrip, revealFade, revealScale, resultFade, resultSlide, isPro, tripsThisMonth, trips.length, router, t]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await ExpoSharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('chaosMode.sendToGroupChat'),
      });
    } catch {
      // cancelled
    }
  }, [t]);

  const handleDareShare = useCallback(async () => {
    if (!destination || !itinerary) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const dareId = await saveChaosDare({
        destination,
        days,
        budget,
        vibes,
        itinerarySnapshot: JSON.stringify(itinerary).slice(0, 2000),
      });
      if (!dareId) return;
      const url = getDareShareUrl(dareId);
      const message = getDareShareMessage({
        id: dareId,
        destination,
        days,
        budget,
        vibes,
        itinerary_snapshot: null,
        created_at: new Date().toISOString(),
      });
      await RNShare.share({
        message: `${message}\n\n${url}`,
        title: t('chaosDare.dareYouToDoThisTrip'),
        url,
      });
    } catch {
      // cancelled
    }
  }, [destination, days, budget, vibes, itinerary, t]);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setItinerary(null);
    setDestination('');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const revealLine = pickRandom(REVEAL_LINES);
  const budgetLabel = BUDGETS.find((b) => b.id === budget)?.label ?? budget;
  const vibeLabels = vibes.map(
    (v) => VIBES.find((vb) => vb.id === v)?.label ?? v
  );

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtn}>{'\u2190'}</Text>
        </Pressable>
        <View>
          <Text style={styles.headerEyebrow}>{t('chaosMode.zeroDecisions')}</Text>
          <Text style={styles.headerTitle}>{t('chaosMode.title')}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============= IDLE PHASE ============= */}
        {phase === 'idle' && (
          <View style={styles.idleContainer}>
            <Text style={styles.idleTitle}>
              {t('chaosMode.idleTitle')}
            </Text>
            <Text style={styles.idleSubtitle}>
              {t('chaosMode.idleSubtitle')}
            </Text>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Pressable
                onPress={handleChaos}
                style={({ pressed }) => [
                  styles.chaosButton,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.chaosGradientStart, COLORS.chaosGradientEnd, COLORS.chaosGradientStart]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chaosButtonGradient}
                >
                  <View style={styles.chaosButtonIcon}><DiceIcon size={28} color={COLORS.white} /></View>
                  <Text style={styles.chaosButtonLabel}>{t('chaosMode.surpriseMe')}</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Text style={styles.disclaimer}>
              {t('chaosMode.disclaimer')}
            </Text>

            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        )}

        {/* ============= GENERATING PHASE ============= */}
        {phase === 'generating' && (
          <View style={styles.generatingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View style={styles.spinnerIcon}><DiceIcon size={48} color={COLORS.cream} /></View>
            </Animated.View>
            <Text style={styles.generatingText}>{chaosMessage}</Text>
            <View style={styles.chosenRow}>
              <Text style={styles.chosenLabel}>{t('chaosMode.destination')}</Text>
              <Text style={styles.chosenValue}>{destination}</Text>
            </View>
            <View style={styles.chosenRow}>
              <Text style={styles.chosenLabel}>{t('chaosMode.duration')}</Text>
              <Text style={styles.chosenValue}>{days} days</Text>
            </View>
            <View style={styles.chosenRow}>
              <Text style={styles.chosenLabel}>{t('chaosMode.budget')}</Text>
              <Text style={styles.chosenValue}>{budgetLabel}</Text>
            </View>
          </View>
        )}

        {/* ============= REVEAL PHASE ============= */}
        {phase === 'reveal' && (
          <Animated.View
            style={[
              styles.revealContainer,
              {
                opacity: revealFade,
                transform: [{ scale: revealScale }],
              },
            ]}
          >
            <Text style={styles.revealLine}>{revealLine}</Text>
            <Text style={styles.revealDest}>{destination}</Text>
            <Text style={styles.revealMeta}>
              {days} days {'·'} {budgetLabel} {'·'} {vibeLabels.join(', ')}
            </Text>
          </Animated.View>
        )}

        {/* ============= RESULT PHASE ============= */}
        {phase === 'result' && itinerary && (
          <Animated.View
            style={{
              opacity: resultFade,
              transform: [{ translateY: resultSlide }],
            }}
          >
            {/* Shareable Chaos Card */}
            <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.chaosCardWrap}>
                <ShimmerOverlay visible={!chaosCardLoaded} />
                <ImageBackground
                  source={{ uri: getDestinationPhoto(destination) }}
                  style={styles.chaosCard}
                  imageStyle={styles.chaosCardImageInner}
                  resizeMode="cover"
                  onLoad={() => setChaosCardLoaded(true)}
                >
                <LinearGradient
                  colors={[COLORS.dangerSoft, COLORS.purpleOverlay, COLORS.bgDarkGreen]}
                  locations={[0, 0.5, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.chaosCardBrand}>ROAM</Text>
                <Text style={styles.chaosCardMode}>SURPRISE ME</Text>
                <Text style={styles.chaosCardDest}>
                  {itinerary.destination}
                </Text>
                <Text style={styles.chaosCardTagline}>
                  {itinerary.tagline}
                </Text>

                <View style={styles.chaosCardMeta}>
                  <ChaosMetaStat value={`${days}`} label="Days" />
                  <ChaosMetaStat value={itinerary.totalBudget} label={t('chaosMode.total')} />
                  <ChaosMetaStat value={budgetLabel} label={t('chaosMode.style')} />
                </View>

                {/* Day Highlights */}
                <View style={styles.chaosCardDays}>
                  {itinerary.days.slice(0, 3).map((day) => (
                    <View key={day.day} style={styles.chaosCardDay}>
                      <Text style={styles.chaosCardDayNum}>
                        DAY {day.day}
                      </Text>
                      <Text style={styles.chaosCardDayTheme}>
                        {day.theme}
                      </Text>
                    </View>
                  ))}
                  {itinerary.days.length > 3 && (
                    <Text style={styles.chaosCardMore}>
                      +{itinerary.days.length - 3} more days
                    </Text>
                  )}
                </View>

                <View style={styles.chaosCardVibes}>
                  {vibeLabels.map((v) => (
                    <View key={v} style={styles.chaosVibeChip}>
                      <Text style={styles.chaosVibeText}>{v}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.chaosCardDare}>
                  {t('chaosMode.iDareYou')}
                </Text>
                <Text style={styles.chaosCardFooter}>
                  {t('chaosMode.goSomewhereThatChangesYou')}
                </Text>
              </ImageBackground>
              </View>
            </ViewShot>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.shareBtn,
                  { opacity: pressed ? 0.85 : 1, flex: 1 },
                ]}
                onPress={handleShare}
              >
                <LinearGradient
                  colors={[COLORS.chaosGradientStart, COLORS.chaosGradientEnd]}
                  style={styles.shareBtnGradient}
                >
                  <Text style={styles.shareBtnText}>{t('chaosMode.sendToGroupChat')}</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <View style={[styles.actionRow, { marginTop: SPACING.sm }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.shareBtn,
                  { opacity: pressed ? 0.85 : 1, flex: 1 },
                ]}
                onPress={handleDareShare}
              >
                <LinearGradient
                  colors={[COLORS.gold + 'cc', COLORS.gold]}
                  style={styles.shareBtnGradient}
                >
                  <Text style={styles.shareBtnText}>{t('chaosMode.dareYouToDoThis')}</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* View Full Itinerary */}
            <Pressable
              style={({ pressed }) => [
                styles.viewBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                const trips = useAppStore.getState().trips;
                const latest = trips[0];
                if (latest) {
                  router.push({
                    pathname: '/itinerary',
                    params: { tripId: latest.id },
                  });
                }
              }}
            >
              <Text style={styles.viewBtnText}>
                {t('chaosMode.seeFullTrip')}
              </Text>
            </Pressable>

            {/* Receipt */}
            <Pressable
              style={({ pressed }) => [
                styles.viewBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                const trips = useAppStore.getState().trips;
                const latest = trips[0];
                if (latest) {
                  router.push({
                    pathname: '/trip-receipt',
                    params: { tripId: latest.id },
                  });
                }
              }}
            >
              <Text style={styles.viewBtnText}>
                {t('chaosMode.seeTheReceipt')}
              </Text>
            </Pressable>

            {/* Roll Again */}
            <Pressable
              style={({ pressed }) => [
                styles.rerollBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleReset}
            >
              <View style={styles.rerollRow}>
                <DiceIcon size={18} color={COLORS.danger} />
                <Text style={styles.rerollText}>{t('chaosMode.tryAnotherSurprise')}</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================
function ChaosMetaStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.chaosMeta}>
      <Text style={styles.chaosMetaValue}>{value}</Text>
      <Text style={styles.chaosMetaLabel}>{label}</Text>
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
    color: COLORS.danger,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,

  // Idle
  idleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
  } as ViewStyle,
  idleTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: SPACING.md,
  } as TextStyle,
  idleSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  } as TextStyle,
  chaosButton: {
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  } as ViewStyle,
  chaosButtonGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  chaosButtonIcon: {
    marginBottom: 4,
  } as ViewStyle,
  chaosButtonText: {
    fontSize: 48,
    marginBottom: 4,
  } as TextStyle,
  chaosButtonLabel: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 4,
    fontWeight: '700',
  } as TextStyle,
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  } as TextStyle,

  // Error
  errorCard: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    width: '100%',
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
  } as TextStyle,

  // Generating
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.lg,
  } as ViewStyle,
  spinnerIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  generatingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
    minHeight: 44,
  } as TextStyle,
  chosenRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  chosenLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  chosenValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  // Reveal
  revealContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxxl,
  } as ViewStyle,
  revealLine: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  revealDest: {
    fontFamily: FONTS.header,
    fontSize: 52,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  revealMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    textAlign: 'center',
    letterSpacing: 1,
  } as TextStyle,

  // Chaos Card (shareable)
  chaosCardWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  chaosCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  } as any,
  chaosCardImageInner: {
    borderRadius: RADIUS.lg,
  } as any,
  chaosCardBrand: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 3,
    marginBottom: 4,
  } as TextStyle,
  chaosCardMode: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.danger,
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: SPACING.md,
  } as TextStyle,
  chaosCardDest: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,
  chaosCardTagline: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamHighlight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,

  // Meta Stats
  chaosCardMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  chaosMeta: {
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  chaosMetaValue: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  chaosMetaLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  // Day Highlights
  chaosCardDays: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  chaosCardDay: {
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  chaosCardDayNum: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.danger,
    letterSpacing: 1,
    width: 48,
  } as TextStyle,
  chaosCardDayTheme: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  chaosCardMore: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Vibes
  chaosCardVibes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  chaosVibeChip: {
    backgroundColor: COLORS.dangerHighlight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  } as ViewStyle,
  chaosVibeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.dangerLight,
    letterSpacing: 1,
  } as TextStyle,

  // Dare + Footer
  chaosCardDare: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
  } as TextStyle,
  chaosCardFooter: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamFaint,
    letterSpacing: 1,
  } as TextStyle,

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
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
  viewBtn: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  viewBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  rerollBtn: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  } as ViewStyle,
  rerollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  rerollText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.danger,
  } as TextStyle,
});

export default withComingSoon(ChaosModeScreen, { routeName: 'chaos-mode', title: 'Chaos Mode' });
