// =============================================================================
// ROAM — Plan Tab (unified trip planning experience)
// Generate + manage + edit all trips from one place
// =============================================================================
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
  Wallet,
  Utensils,
  Bed,
  Calendar,
  Plane,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, FREE_TRIPS_PER_MONTH, RADIUS, SPACING } from '../../lib/constants';
import { useAppStore, type Trip } from '../../lib/store';
import { generateItinerary, TripLimitReachedError } from '../../lib/claude';
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
import { parseItinerary } from '../../lib/types/itinerary';
import { getDestinationCount } from '../../lib/social-proof';
import { Users } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Destination images for trip cards
// ---------------------------------------------------------------------------
const DEST_IMAGES: Record<string, string> = {
  Tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  Bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  Lisbon: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=80',
  Barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  Paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  London: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  Bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
  'Mexico City': 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&q=80',
  Kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  Marrakech: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&q=80',
  Budapest: 'https://images.unsplash.com/photo-1549285509-8fe27c27302b?w=600&q=80',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80';

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
// Trip Card Component
// ---------------------------------------------------------------------------
const TripCard = React.memo(function TripCard({
  trip,
  onPress,
  isLatest,
}: {
  trip: Trip;
  onPress: () => void;
  isLatest: boolean;
}) {
  const { t } = useTranslation();
  const imageUrl = DEST_IMAGES[trip.destination] ?? FALLBACK_IMAGE;
  const parsed = useMemo(() => {
    try {
      return parseItinerary(JSON.parse(trip.itinerary));
    } catch {
      return null;
    }
  }, [trip.itinerary]);

  const dayCount = parsed?.days?.length ?? trip.days;
  const dateLabel = useMemo(() => {
    const d = new Date(trip.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('plan.today');
    if (diffDays === 1) return t('plan.yesterday');
    if (diffDays < 7) return t('plan.daysAgo', { count: diffDays });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [trip.createdAt, t]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.tripCard,
        isLatest && styles.tripCardLatest,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <Image source={{ uri: imageUrl }} style={styles.tripCardImage} />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        style={styles.tripCardGradient}
      />
      {isLatest && (
        <View style={styles.latestBadge}>
          <Sparkles size={10} color={COLORS.bg} />
          <Text style={styles.latestBadgeText}>{t('plan.latest')}</Text>
        </View>
      )}
      <View style={styles.tripCardContent}>
        <Text style={styles.tripCardDest}>{trip.destination}</Text>
        <View style={styles.tripCardMeta}>
          <View style={styles.tripCardChip}>
            <Calendar size={12} color={COLORS.creamSoft} strokeWidth={2} />
            <Text style={styles.tripCardChipText}>{t('common.days', { count: dayCount })}</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Wallet size={12} color={COLORS.creamSoft} strokeWidth={2} />
            <Text style={styles.tripCardChipText}>{trip.budget}</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Clock size={12} color={COLORS.creamSoft} strokeWidth={2} />
            <Text style={styles.tripCardChipText}>{dateLabel}</Text>
          </View>
        </View>
      </View>
      <View style={styles.tripCardArrow}>
        <ChevronRight size={20} color={COLORS.cream} strokeWidth={2} />
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Quick Action Cards — labels resolved at render time via t()
// ---------------------------------------------------------------------------
interface QuickAction {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  subKey: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'hotels',
    icon: Bed,
    labelKey: 'plan.findStays',
    subKey: 'plan.staysSub',
    color: COLORS.sage,
  },
  {
    id: 'food',
    icon: Utensils,
    labelKey: 'plan.findFood',
    subKey: 'plan.foodSub',
    color: COLORS.coral,
  },
  {
    id: 'flights',
    icon: Plane,
    labelKey: 'plan.bookFlights',
    subKey: 'plan.flightsSub',
    color: COLORS.gold,
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [networkError, setNetworkError] = useState<string | null>(null);
  const [rateLimitVisible, setRateLimitVisible] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [peopleBannerDismissed, setPeopleBannerDismissed] = useState(false);
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
        setNetworkError(err instanceof Error ? err.message : 'We couldn\u2019t build your trip. Check your connection and try again.');
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
        setNetworkError(err instanceof Error ? err.message : 'We couldn\u2019t build your trip. Check your connection and try again.');
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
                <Text style={styles.backToTripsText}>{t('plan.backToTrips')}</Text>
              </Pressable>
            )}
            <GenerateModeSelect onSelect={handleModeSelect} firstTime={!hasTrips} />
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
                  <Text style={styles.errorBannerRetry}>{t('plan.dismiss')}</Text>
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
                  <Text style={styles.errorBannerRetry}>{t('plan.dismiss')}</Text>
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
        <RateLimitModal
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
          <Text style={styles.headerTitle}>{t('plan.yourTrips')}</Text>
          <Text style={styles.headerSub}>
            {t('plan.tripsPlanned', { count: sortedTrips.length })}
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
            <Text style={styles.newTripText}>{t('plan.planNewTrip')}</Text>
          </LinearGradient>
        </Pressable>

        {/* People nudge — social proof for latest destination */}
        {!peopleBannerDismissed && sortedTrips.length > 0 && (
          <PeopleNudgeBanner
            destination={sortedTrips[0].destination}
            onTap={() => router.push('/(tabs)/people' as never)}
            onDismiss={() => setPeopleBannerDismissed(true)}
          />
        )}

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
              <Text style={styles.quickActionLabel}>{t(action.labelKey)}</Text>
              <Text style={styles.quickActionSub}>{t(action.subKey)}</Text>
            </Pressable>
          ))}
        </View>

        {/* Trip Cards */}
        <Text style={styles.sectionLabel}>{t('plan.sectionYourTrips')}</Text>
        {sortedTrips.map((trip, index) => (
          <TripCard
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
      <RateLimitModal
        visible={rateLimitVisible}
        onUpgrade={handleUpgrade}
        onDismiss={() => setRateLimitVisible(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// People Nudge Banner — social proof for the latest destination
// ---------------------------------------------------------------------------
function PeopleNudgeBanner({
  destination,
  onTap,
  onDismiss,
}: {
  destination: string;
  onTap: () => void;
  onDismiss: () => void;
}) {
  const count = getDestinationCount(destination, new Date().getMonth() + 1);
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTap();
      }}
      style={({ pressed }) => [styles.peopleBanner, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.peopleBannerLeft}>
        <Users size={16} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.peopleBannerText}>
          <Text style={styles.peopleBannerBold}>{count} people</Text>
          {' '}are planning {destination} this month
        </Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={12} style={styles.peopleBannerDismiss}>
        <Text style={styles.peopleBannerDismissText}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Rate Limit Modal (extracted)
// ---------------------------------------------------------------------------
function RateLimitModal({
  visible,
  onUpgrade,
  onDismiss,
}: {
  visible: boolean;
  onUpgrade: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.rateLimitOverlay}>
        <View style={styles.rateLimitCard}>
          <View style={styles.rateLimitDot} />
          <Text style={styles.rateLimitTitle}>{t('plan.rateLimitTitle')}</Text>
          <Text style={styles.rateLimitBody}>
            {t('plan.rateLimitBody', { count: FREE_TRIPS_PER_MONTH })}
          </Text>
          <Pressable onPress={onUpgrade} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldDark]}
              style={styles.rateLimitUpgradeBtn}
            >
              <Text style={styles.rateLimitUpgradeText}>{t('plan.seeProPlans')}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={onDismiss} style={styles.rateLimitDismiss} hitSlop={12}>
            <Text style={styles.rateLimitDismissText}>{t('plan.maybeLater')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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

  // ── People Nudge Banner ──
  peopleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.md,
  } as ViewStyle,
  peopleBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  } as ViewStyle,
  peopleBannerText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  peopleBannerBold: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
  } as TextStyle,
  peopleBannerDismiss: {
    paddingLeft: SPACING.sm,
  } as ViewStyle,
  peopleBannerDismissText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
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

  // ── Trip Cards ──
  tripCard: {
    height: 160,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tripCardLatest: {
    height: 200,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  tripCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  tripCardGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  tripCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  tripCardDest: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.white,
    marginBottom: 6,
  } as TextStyle,
  tripCardMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  tripCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.whiteMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  tripCardChipText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
  } as TextStyle,
  tripCardArrow: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    marginTop: -10,
    backgroundColor: COLORS.whiteMuted,
    borderRadius: RADIUS.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  latestBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.sage,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  latestBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 0.5,
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

  // ── Rate Limit Modal ──
  rateLimitOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  rateLimitCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  } as ViewStyle,
  rateLimitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gold,
    marginBottom: SPACING.md,
  } as ViewStyle,
  rateLimitTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  rateLimitBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  } as TextStyle,
  rateLimitUpgradeBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
  } as ViewStyle,
  rateLimitUpgradeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  rateLimitDismiss: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  rateLimitDismissText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
});
