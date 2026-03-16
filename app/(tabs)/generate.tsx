// =============================================================================
// ROAM — Generate Tab (core trip creation experience)
// Mode selection (first visit) | Quick form | Conversation
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { generateItinerary, generateItineraryStreaming, TripLimitReachedError } from '../../lib/claude';
import { FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { isGuestUser } from '../../lib/guest';
import type { QuickModeState } from '../../components/generate/GenerateQuickMode';
import { BUDGET_TO_BACKEND } from '../../components/generate/GenerateQuickMode';
import GenerateModeSelect from '../../components/generate/GenerateModeSelect';
import GenerateQuickMode from '../../components/generate/GenerateQuickMode';
import GenerateConversationMode from '../../components/generate/GenerateConversationMode';
import { TripGeneratingLoader } from '../../components/premium/LoadingStates';
import { recordGrowthEvent } from '../../lib/growth-hooks';
import { evaluateTrigger } from '../../lib/smart-triggers';
import TripLimitBanner from '../../components/monetization/TripLimitBanner';
import { track, trackEvent } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { trackBehavior } from '../../lib/travel-dna';

const RANDOM_CITIES = [
  'Tokyo', 'Bali', 'Lisbon', 'Mexico City', 'Bangkok', 'Barcelona', 'Cape Town',
  'Medellín', 'Kyoto', 'Marrakech', 'Budapest', 'Buenos Aires',
];

interface ConversationBrief {
  destination?: string;
  days?: number;
  budget?: string;
  groupSize?: number;
  vibes: string[];
}

export default function GenerateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [networkError, setNetworkError] = useState<string | null>(null);
  const [rateLimitVisible, setRateLimitVisible] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState<string | null>(null);
  const generatingDestRef = useRef<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'generate' });
    return () => { isMountedRef.current = false; };
  }, []);
  const generateMode = useAppStore((s) => s.generateMode);
  const setGenerateMode = useAppStore((s) => s.setGenerateMode);
  const addTrip = useAppStore((s) => s.addTrip);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const isPro = useAppStore((s) => s.isPro);
  const trips = useAppStore((s) => s.trips);

  const handleModeSelect = useCallback((mode: 'quick' | 'conversation') => {
    setGenerateMode(mode);
    trackEvent('generate_mode_selected', { mode }).catch(() => {});
  }, [setGenerateMode]);

  const handleQuickSubmit = useCallback(async (state: QuickModeState) => {
    if (!isPro && !isGuestUser() && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      router.push({ pathname: '/paywall', params: { reason: 'limit', destination: state.destination } });
      return;
    }
    if (isGuestUser() && trips.length >= 1) {
      router.push({ pathname: '/paywall', params: { reason: 'limit', destination: state.destination } });
      return;
    }

    generatingDestRef.current = state.destination;
    setIsGenerating(true);
    setStreamingProgress(null);
    try {
      const { itinerary, tripsUsed } = await generateItineraryStreaming({
        destination: state.destination,
        days: state.duration,
        budget: BUDGET_TO_BACKEND[state.budget],
        vibes: state.vibes,
        groupSize: state.groupSize > 1 ? state.groupSize : undefined,
        startDate: state.startDate?.toISOString().split('T')[0],
        pace: state.pace,
        accommodationStyle: state.accommodationStyle,
        morningType: state.morningType,
        tripComposition: state.tripComposition,
        dietary: state.dietary,
        transport: state.transport,
        mustVisit: state.mustVisit,
        avoidList: state.avoidList,
        specialRequests: state.specialRequests,
        onProgress: (info) => {
          setStreamingProgress(info.text);
        },
      });

      // Validate itinerary has required structure before storing
      if (!itinerary?.destination || !itinerary?.days?.length) {
        throw new Error('Almost had it — the trip came back a little incomplete. One more try should do it.');
      }

      const trip = {
        id: `gen-${Date.now()}`,
        destination: state.destination,
        days: state.duration,
        budget: BUDGET_TO_BACKEND[state.budget],
        vibes: state.vibes,
        itinerary: JSON.stringify(itinerary),
        createdAt: new Date().toISOString(),
      };

      addTrip(trip);
      setTripsThisMonth(tripsUsed);
      setStreamingProgress('Trip ready!');
      captureEvent('trip_generation_completed', { destination: state.destination, days: state.duration, budget: BUDGET_TO_BACKEND[state.budget], mode: 'quick' });
      trackBehavior({ type: 'trip_generated', timestamp: new Date().toISOString(), data: { destination: state.destination, days: state.duration, budget: BUDGET_TO_BACKEND[state.budget] } }).catch(() => {});
      recordGrowthEvent('trip_generated').catch(() => {});
      evaluateTrigger('post_generation').catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMountedRef.current) return;
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof TripLimitReachedError) {
        captureEvent('rate_limit_hit', { destination: generatingDestRef.current, source: 'quick' });
        setRateLimitVisible(true);
      } else {
        setNetworkError(err instanceof Error ? err.message : 'Couldn\u2019t reach our servers — probably a WiFi thing. Give it a sec and try again.');
      }
    } finally {
      setIsGenerating(false);
      setStreamingProgress(null);
    }
  }, [
    isPro,
    tripsThisMonth,
    trips.length,
    setIsGenerating,
    addTrip,
    setTripsThisMonth,
    router,
  ]);

  const handleConversationGenerate = useCallback(async (brief: ConversationBrief) => {
    if (!isPro && !isGuestUser() && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      router.push({ pathname: '/paywall', params: { reason: 'limit', destination: brief.destination } });
      return;
    }
    if (isGuestUser() && trips.length >= 1) {
      router.push({ pathname: '/paywall', params: { reason: 'limit', destination: brief.destination } });
      return;
    }

    const dest = brief.destination ?? RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)];
    const days = brief.days ?? 5;
    const budget = brief.budget ?? 'comfort';
    const vibes = brief.vibes?.length ? brief.vibes : ['culture'];
    const groupSize = brief.groupSize && brief.groupSize > 1 ? brief.groupSize : undefined;

    generatingDestRef.current = dest;
    setIsGenerating(true);
    setStreamingProgress(null);
    try {
      const { itinerary, tripsUsed } = await generateItineraryStreaming({
        destination: dest,
        days,
        budget,
        vibes,
        groupSize,
        onProgress: (info) => {
          setStreamingProgress(info.text);
        },
      });

      // Validate itinerary has required structure before storing
      if (!itinerary?.destination || !itinerary?.days?.length) {
        throw new Error('Almost had it — the trip came back a little incomplete. One more try should do it.');
      }

      const trip = {
        id: `gen-${Date.now()}`,
        destination: dest,
        days,
        budget,
        vibes,
        itinerary: JSON.stringify(itinerary),
        createdAt: new Date().toISOString(),
      };

      addTrip(trip);
      setTripsThisMonth(tripsUsed);
      setStreamingProgress('Trip ready!');
      captureEvent('trip_generation_completed', { destination: dest, days, budget, mode: 'conversation' });
      trackBehavior({ type: 'trip_generated', timestamp: new Date().toISOString(), data: { destination: dest, days, budget } }).catch(() => {});
      recordGrowthEvent('trip_generated').catch(() => {});
      evaluateTrigger('post_generation').catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMountedRef.current) return;
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof TripLimitReachedError) {
        captureEvent('rate_limit_hit', { destination: generatingDestRef.current, source: 'conversation' });
        setRateLimitVisible(true);
      } else {
        setNetworkError(err instanceof Error ? err.message : 'Couldn\u2019t reach our servers — probably a WiFi thing. Give it a sec and try again.');
      }
    } finally {
      setIsGenerating(false);
      setStreamingProgress(null);
    }
  }, [
    isPro,
    tripsThisMonth,
    trips.length,
    setIsGenerating,
    addTrip,
    setTripsThisMonth,
    router,
  ]);

  const clearError = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNetworkError(null);
  }, []);

  const renderContent = () => {
    if (generateMode === null) {
      return (
        <View style={[styles.fill, { paddingTop: insets.top }]}>
          <GenerateModeSelect onSelect={handleModeSelect} />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              router.push('/chaos-mode' as never);
            }}
            style={({ pressed }) => [styles.chaosBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.chaosBtnText}>Surprise me</Text>
          </Pressable>
        </View>
      );
    }

    if (generateMode === 'quick') {
      return (
        <View style={[styles.fill, { paddingTop: insets.top }]}>
          <TripLimitBanner />
          {networkError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{networkError}</Text>
              <Pressable onPress={clearError} hitSlop={8}>
                <Text style={styles.errorBannerRetry}>Dismiss</Text>
              </Pressable>
            </View>
          ) : null}
          <GenerateQuickMode onSubmit={handleQuickSubmit} isGenerating={isGenerating} />
        </View>
      );
    }

    return (
      <View style={[styles.fill, { paddingTop: insets.top }]}>
        <TripLimitBanner />
        {networkError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{networkError}</Text>
            <Pressable onPress={clearError} hitSlop={8}>
              <Text style={styles.errorBannerRetry}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}
        <GenerateConversationMode onGenerate={handleConversationGenerate} isGenerating={isGenerating} />
      </View>
    );
  };

  const handleUpgrade = useCallback(() => {
    setRateLimitVisible(false);
    router.push({ pathname: '/paywall', params: { reason: 'limit', destination: generatingDestRef.current } });
  }, [router]);

  return (
    <View style={styles.container}>
      {renderContent()}
      {isGenerating && (
        <View style={styles.loaderOverlay}>
          <TripGeneratingLoader destination={generatingDestRef.current} statusOverride={streamingProgress} />
        </View>
      )}

      {/* Rate-limit upgrade modal */}
      <Modal
        visible={rateLimitVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRateLimitVisible(false)}
      >
        <View style={styles.rateLimitOverlay}>
          <View style={styles.rateLimitCard}>
            <View style={styles.rateLimitDot} />
            <Text style={styles.rateLimitTitle}>You hit your free limit</Text>
            <Text style={styles.rateLimitBody}>
              Free accounts get {FREE_TRIPS_PER_MONTH} trip per month. Upgrade to Pro for
              unlimited trips and the full ROAM experience.
            </Text>
            <Pressable onPress={handleUpgrade} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                style={styles.rateLimitUpgradeBtn}
              >
                <Text style={styles.rateLimitUpgradeText}>See Pro Plans</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => setRateLimitVisible(false)}
              style={styles.rateLimitDismiss}
              hitSlop={12}
            >
              <Text style={styles.rateLimitDismissText}>Maybe later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  fill: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.coralSubtle,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.coral,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  },
  errorBannerRetry: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.coral,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: COLORS.bg,
  },
  rateLimitOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  rateLimitCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  rateLimitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
    marginBottom: SPACING.md,
  },
  rateLimitTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  rateLimitBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  rateLimitUpgradeBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  },
  rateLimitUpgradeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  },
  rateLimitDismiss: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  rateLimitDismissText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  chaosBtn: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  chaosBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamDim,
    textDecorationLine: 'underline',
  },
});
