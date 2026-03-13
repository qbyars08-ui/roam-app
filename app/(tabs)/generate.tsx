// =============================================================================
// ROAM — Generate Tab (core trip creation experience)
// Mode selection (first visit) | Quick form | Conversation
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { generateItinerary, TripLimitReachedError } from '../../lib/claude';
import { FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { isGuestUser } from '../../lib/guest';
import type { QuickModeState } from '../../components/generate/GenerateQuickMode';
import { BUDGET_TO_BACKEND } from '../../components/generate/GenerateQuickMode';
import GenerateModeSelect from '../../components/generate/GenerateModeSelect';
import GenerateQuickMode from '../../components/generate/GenerateQuickMode';
import GenerateConversationMode from '../../components/generate/GenerateConversationMode';
import { TripGeneratingLoader } from '../../components/premium/LoadingStates';
import TripLimitBanner from '../../components/monetization/TripLimitBanner';

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
  const generatingDestRef = useRef<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
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
  }, [setGenerateMode]);

  const handleQuickSubmit = useCallback(async (state: QuickModeState) => {
    if (!isPro && !isGuestUser() && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      router.push('/paywall');
      return;
    }
    if (isGuestUser() && trips.length >= 1) {
      router.push('/paywall');
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Brief pause so the user sees the loader complete before navigating
      await new Promise((r) => setTimeout(r, 800));
      if (!isMountedRef.current) return;
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof TripLimitReachedError) {
        router.push('/paywall');
      } else {
        setNetworkError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      }
    } finally {
      setIsGenerating(false);
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
      router.push('/paywall');
      return;
    }
    if (isGuestUser() && trips.length >= 1) {
      router.push('/paywall');
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Brief pause so the user sees the loader complete before navigating
      await new Promise((r) => setTimeout(r, 800));
      if (!isMountedRef.current) return;
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof TripLimitReachedError) {
        router.push('/paywall');
      } else {
        setNetworkError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      }
    } finally {
      setIsGenerating(false);
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

  return (
    <View style={styles.container}>
      {renderContent()}
      {isGenerating && (
        <View style={styles.loaderOverlay}>
          <TripGeneratingLoader destination={generatingDestRef.current} />
        </View>
      )}
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
});
