// =============================================================================
// ROAM — Plan Tab (unified trip planning experience)
// Generate + manage + edit all trips from one place
// =============================================================================
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Utensils, Bed, Plane } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore, type Trip } from '../../lib/store';
import { generateItinerary, TripLimitReachedError } from '../../lib/claude';
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
import { EVENTS } from '../../lib/posthog-events';
import PlanTripCard from '../../components/features/PlanTripCard';
import PlanRateLimitModal from '../../components/features/PlanRateLimitModal';
import PlanProTeaser from '../../components/features/PlanProTeaser';

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


// ---------------------------------------------------------------------------
// Quick Action Cards
// ---------------------------------------------------------------------------
const QUICK_ACTIONS = [
  {
    id: 'hotels',
    icon: Bed,
    label: 'Find stays',
    sub: 'Hotels, hostels, villas',
    color: COLORS.sage,
  },
  {
    id: 'food',
    icon: Utensils,
    label: 'Find food',
    sub: 'Restaurants, street food',
    color: COLORS.coral,
  },
  {
    id: 'flights',
    icon: Plane,
    label: 'Book flights',
    sub: 'Compare prices',
    color: COLORS.gold,
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [networkError, setNetworkError] = useState<string | null>(null);
  const [rateLimitVisible, setRateLimitVisible] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const generatingDestRef = useRef<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'plan' });
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

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [trips],
  );

  const hasTrips = sortedTrips.length > 0;

  const handleModeSelect = useCallback((mode: 'quick' | 'conversation') => {
    setGenerateMode(mode);
    trackEvent('generate_mode_selected', { mode }).catch(() => {});
  }, [setGenerateMode]);

  const handleNewTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowGenerator(true);
    setGenerateMode(null);
  }, [setGenerateMode]);

  const handleQuickAction = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'flights') {
      router.push('/(tabs)/flights' as never);
    } else if (id === 'hotels' || id === 'food') {
      // Navigate to plan with context
      setShowGenerator(true);
      setGenerateMode('quick');
    }
  }, [router, setGenerateMode]);

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
    try {
      const { itinerary, tripsUsed } = await generateItinerary({
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
      });

      if (!itinerary?.destination || !itinerary?.days?.length) {
        throw new Error('Generated itinerary is incomplete. Please try again.');
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
      captureEvent('trip_generation_completed', { destination: state.destination, days: state.duration, budget: BUDGET_TO_BACKEND[state.budget], mode: 'quick' });
      recordGrowthEvent('trip_generated').catch(() => {});
      evaluateTrigger('post_generation').catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMountedRef.current) return;
      setShowGenerator(false);
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof TripLimitReachedError) {
        captureEvent('rate_limit_hit', { destination: generatingDestRef.current, source: 'quick' });
        setRateLimitVisible(true);
      } else {
        setNetworkError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isPro, tripsThisMonth, trips.length, setIsGenerating, addTrip, setTripsThisMonth, router]);

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
    try {
      const { itinerary, tripsUsed } = await generateItinerary({
        destination: dest,
        days,
        budget,
        vibes,
        groupSize,
      });

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
      captureEvent('trip_generation_completed', { destination: dest, days, budget, mode: 'conversation' });
      recordGrowthEvent('trip_generated').catch(() => {});
      evaluateTrigger('post_generation').catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMountedRef.current) return;
      setShowGenerator(false);
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof TripLimitReachedError) {
        captureEvent('rate_limit_hit', { destination: generatingDestRef.current, source: 'conversation' });
        setRateLimitVisible(true);
      } else {
        setNetworkError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [isPro, tripsThisMonth, trips.length, setIsGenerating, addTrip, setTripsThisMonth, router]);

  const clearError = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNetworkError(null);
  }, []);

  const handleUpgrade = useCallback(() => {
    setRateLimitVisible(false);
    router.push({ pathname: '/paywall', params: { reason: 'limit', destination: generatingDestRef.current } });
  }, [router]);

  const handleTripPress = useCallback((trip: Trip) => {
    router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
  }, [router]);

  const handlePlanProUpgrade = useCallback((feature: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent(EVENTS.PRO_GATE_SHOWN.name, { feature });
    router.push({ pathname: '/paywall', params: { reason: 'feature', feature } } as never);
  }, [router]);

  // ── Render: Generator mode ──
  if (showGenerator || !hasTrips) {
    const renderGeneratorContent = () => {
      if (generateMode === null) {
        return (
          <View style={styles.fill}>
            {hasTrips && (
              <Pressable
                style={styles.backToTrips}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowGenerator(false);
                }}
              >
                <Text style={styles.backToTripsText}>Back to my trips</Text>
              </Pressable>
            )}
            <GenerateModeSelect onSelect={handleModeSelect} />
          </View>
        );
      }

      if (generateMode === 'quick') {
        return (
          <View style={styles.fill}>
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
        <View style={styles.fill}>
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

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderGeneratorContent()}
        {isGenerating && (
          <View style={styles.loaderOverlay}>
            <TripGeneratingLoader destination={generatingDestRef.current} />
          </View>
        )}
        <PlanRateLimitModal
          visible={rateLimitVisible}
          onUpgrade={handleUpgrade}
          onDismiss={() => setRateLimitVisible(false)}
        />
      </View>
    );
  }

  // ── Render: Trip management mode ──
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your trips</Text>
          <Text style={styles.headerSub}>
            {sortedTrips.length} {sortedTrips.length === 1 ? 'trip' : 'trips'} planned
          </Text>
        </View>

        {/* New Trip Button */}
        <Pressable
          onPress={handleNewTrip}
          style={({ pressed }) => [styles.newTripBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <LinearGradient
            colors={[COLORS.sage, COLORS.sageStrong]}
            style={styles.newTripGradient}
          >
            <Plus size={22} color={COLORS.bg} strokeWidth={2.5} />
            <Text style={styles.newTripText}>Plan a new trip</Text>
          </LinearGradient>
        </Pressable>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={({ pressed }) => [styles.quickAction, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
              onPress={() => handleQuickAction(action.id)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <action.icon size={18} color={action.color} strokeWidth={2} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <Text style={styles.quickActionSub}>{action.sub}</Text>
            </Pressable>
          ))}
        </View>

        {/* Pro features teaser (free users only) */}
        {!isPro && <PlanProTeaser onUpgrade={handlePlanProUpgrade} />}

        {/* Trip Cards */}
        <Text style={styles.sectionLabel}>YOUR TRIPS</Text>
        {sortedTrips.map((trip, index) => (
          <PlanTripCard
            key={trip.id}
            trip={trip}
            onPress={() => handleTripPress(trip)}
            isLatest={index === 0}
          />
        ))}
      </ScrollView>

      {isGenerating && (
        <View style={styles.loaderOverlay}>
          <TripGeneratingLoader destination={generatingDestRef.current} />
        </View>
      )}
      <PlanRateLimitModal
        visible={rateLimitVisible}
        onUpgrade={handleUpgrade}
        onDismiss={() => setRateLimitVisible(false)}
      />
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
  fill: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  } as ViewStyle,

  // ── Header ──
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,

  // ── New Trip Button ──
  newTripBtn: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  } as ViewStyle,
  newTripGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.xl,
  } as ViewStyle,
  newTripText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.bg,
  } as TextStyle,

  // ── Quick Actions ──
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  } as ViewStyle,
  quickActionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  quickActionSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // ── Section Label ──
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  } as TextStyle,


  // ── Back to trips ──
  backToTrips: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  backToTripsText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // ── Error banner ──
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
  } as ViewStyle,
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  errorBannerRetry: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.coral,
  } as TextStyle,

  // ── Loader ──
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

});
