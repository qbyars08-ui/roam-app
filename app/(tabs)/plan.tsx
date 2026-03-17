// =============================================================================
// ROAM — Plan Tab (unified trip planning experience)
// Generate + manage + edit all trips from one place
// =============================================================================
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
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
  ShieldCheck,
  Heart,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, FREE_TRIPS_PER_MONTH, type Destination } from '../../lib/constants';
import { useAppStore, type Trip } from '../../lib/store';
import { useDreamStore } from '../../lib/dream-store';
import { Flame, Sparkle } from 'lucide-react-native';
import { generateItineraryStreaming, TripLimitReachedError } from '../../lib/claude';
import { isGuestUser } from '../../lib/guest';
import { scheduleDailyBrief, scheduleTripWrappedReminder } from '../../lib/notifications';
import type { QuickModeState } from '../../components/generate/GenerateQuickMode';
import { BUDGET_TO_BACKEND } from '../../components/generate/GenerateQuickMode';
import GenerateModeSelect from '../../components/generate/GenerateModeSelect';
import GenerateQuickMode from '../../components/generate/GenerateQuickMode';
import GenerateConversationMode from '../../components/generate/GenerateConversationMode';
import GoNowFeed from '../../components/features/GoNowFeed';
import { TripGeneratingLoader } from '../../components/premium/LoadingStates';
import { recordGrowthEvent } from '../../lib/growth-hooks';
import { evaluateTrigger } from '../../lib/smart-triggers';
import TripLimitBanner from '../../components/monetization/TripLimitBanner';
import { track, trackEvent } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { parseItinerary } from '../../lib/types/itinerary';
import { Users } from 'lucide-react-native';
import { useSonarQuery } from '../../lib/sonar';
import { supabase } from '../../lib/supabase';
import LiveBadge from '../../components/ui/LiveBadge';
import SourceCitation from '../../components/ui/SourceCitation';
import { getCurrentWeather, type CurrentWeather } from '../../lib/apis/openweather';
import { searchEvents, type EventResult } from '../../lib/apis/eventbrite';
import TripMapCard from '../../components/features/TripMapCard';
import CountdownHero from '../../components/features/CountdownHero';
import { useTravelStage, type TravelStage } from '../../lib/travel-state';
import { useDailyBrief, getChecklistItems } from '../../lib/daily-brief';
import { useSavingsStore } from '../../lib/savings-store';

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
// Destination lookup for trending/timing badges
// ---------------------------------------------------------------------------
const DEST_LOOKUP = new Map(DESTINATIONS.map((d) => [d.label.toLowerCase(), d]));

function getDestinationMeta(name: string): Destination | undefined {
  return DEST_LOOKUP.get(name.toLowerCase());
}

function isPerfectTiming(bestMonths: number[]): boolean {
  const currentMonth = new Date().getMonth() + 1;
  return bestMonths.includes(currentMonth);
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
  const destMeta = useMemo(() => getDestinationMeta(trip.destination), [trip.destination]);
  const isTrending = (destMeta?.trendScore ?? 0) >= 85;
  const perfectTiming = destMeta ? isPerfectTiming(destMeta.bestMonths) : false;
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
      accessibilityLabel={`Open ${trip.destination} itinerary — ${dayCount} days, ${trip.budget} budget`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tripCard,
        isLatest && styles.tripCardLatest,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.tripCardImage}
        accessibilityLabel={`${trip.destination} destination photo`}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        style={styles.tripCardGradient}
      />
      {isLatest && (
        <View style={styles.latestBadge}>
          <Text style={styles.latestBadgeText}>{t('plan.latest')}</Text>
        </View>
      )}
      {/* Trending + Perfect Timing badges */}
      <View style={styles.trendBadgeRow}>
        {isTrending && (
          <View style={styles.trendBadge}>
            <Flame size={10} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={styles.trendBadgeText}>Trending</Text>
          </View>
        )}
        {perfectTiming && (
          <View style={styles.timingBadge}>
            <Sparkle size={10} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.timingBadgeText}>Perfect timing</Text>
          </View>
        )}
      </View>
      <View style={styles.tripCardContent}>
        <Text style={styles.tripCardDest}>{trip.destination}</Text>
        <View style={styles.tripCardMeta}>
          <View style={styles.tripCardChip}>
            <Calendar size={12} color={COLORS.creamSoft} strokeWidth={1.5} />
            <Text style={styles.tripCardChipText}>{t('common.days', { count: dayCount })}</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Wallet size={12} color={COLORS.creamSoft} strokeWidth={1.5} />
            <Text style={styles.tripCardChipText}>{trip.budget}</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Clock size={12} color={COLORS.creamSoft} strokeWidth={1.5} />
            <Text style={styles.tripCardChipText}>{dateLabel}</Text>
          </View>
        </View>
      </View>
      <View style={styles.tripCardArrow}>
        <ChevronRight size={20} color={COLORS.cream} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Next Trip Hero — full-bleed hero card for the most recent trip
// ---------------------------------------------------------------------------
const NextTripHero = React.memo(function NextTripHero({
  trip,
  onPress,
}: {
  trip: Trip;
  onPress: () => void;
}) {
  const router = useRouter();
  const imageUrl = DEST_IMAGES[trip.destination] ?? FALLBACK_IMAGE;
  const destMeta = useMemo(() => getDestinationMeta(trip.destination), [trip.destination]);
  const isTrending = (destMeta?.trendScore ?? 0) >= 85;
  const perfectTiming = destMeta ? isPerfectTiming(destMeta.bestMonths) : false;

  const tagline = useMemo(() => {
    try {
      const parsed = parseItinerary(JSON.parse(trip.itinerary));
      return parsed?.tagline ?? null;
    } catch {
      return null;
    }
  }, [trip.itinerary]);

  const handleBeforeYouLand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/before-you-land', params: { destination: trip.destination } } as never);
  }, [router, trip.destination]);

  const handleHealthBrief = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/body-intel' as never);
  }, [router]);

  const handleEmergencyCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/emergency-card', params: { destination: trip.destination } } as never);
  }, [router, trip.destination]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityLabel={`Open ${trip.destination} itinerary`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.heroCard,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.heroImage}
        accessibilityLabel={`${trip.destination} hero photo`}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayStrong]}
        style={styles.heroGradient}
      />

      {/* Trending + Perfect Timing badges */}
      <View style={styles.heroTrendRow}>
        {isTrending && (
          <View style={styles.trendBadge}>
            <Flame size={10} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={styles.trendBadgeText}>Trending</Text>
          </View>
        )}
        {perfectTiming && (
          <View style={styles.timingBadge}>
            <Sparkle size={10} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.timingBadgeText}>Perfect timing</Text>
          </View>
        )}
      </View>

      {/* Destination name + tagline */}
      <View style={styles.heroContent}>
        <Text style={styles.heroDest}>{trip.destination}</Text>
        {tagline ? (
          <Text style={styles.heroTagline} numberOfLines={2}>{tagline}</Text>
        ) : null}

        {/* Quick-link pills */}
        <View style={styles.heroPills}>
          <Pressable
            onPress={handleBeforeYouLand}
            accessibilityLabel={`Before you land briefing for ${trip.destination}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.heroPill,
              styles.heroPillGold,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <Plane size={12} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, styles.heroPillTextGold]}>Before You Land</Text>
          </Pressable>

          <Pressable
            onPress={handleHealthBrief}
            accessibilityLabel="View health brief for this destination"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.heroPill,
              styles.heroPillSage,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <ShieldCheck size={12} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, styles.heroPillTextSage]}>Health Brief</Text>
          </Pressable>

          <Pressable
            onPress={handleEmergencyCard}
            accessibilityLabel={`View emergency card for ${trip.destination}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.heroPill,
              styles.heroPillCoral,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <Heart size={12} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, styles.heroPillTextCoral]}>Emergency Card</Text>
          </Pressable>
        </View>
      </View>

      {/* Tap-to-open arrow */}
      <View style={styles.heroArrow}>
        <ChevronRight size={20} color={COLORS.cream} strokeWidth={1.5} />
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
  iconBg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'hotels',
    icon: Bed,
    labelKey: 'plan.findStays',
    subKey: 'plan.staysSub',
    color: COLORS.sage,
    iconBg: COLORS.sageLight,
  },
  {
    id: 'food',
    icon: Utensils,
    labelKey: 'plan.findFood',
    subKey: 'plan.foodSub',
    color: COLORS.coral,
    iconBg: COLORS.coralLight,
  },
  {
    id: 'flights',
    icon: Plane,
    labelKey: 'plan.bookFlights',
    subKey: 'plan.flightsSub',
    color: COLORS.gold,
    iconBg: COLORS.goldSubtle,
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
  const [streamingProgress, setStreamingProgress] = useState<string | null>(null);
  const [peopleBannerDismissed, setPeopleBannerDismissed] = useState(false);
  const [craftSessions, setCraftSessions] = useState<Array<{ id: string; destination: string | null; updated_at: string }>>([]);
  const generatingDestRef = useRef<string>('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'plan' });
    return () => { isMountedRef.current = false; };
  }, []);

  const session = useAppStore((s) => s.session);

  useEffect(() => {
    if (!session?.user?.id) {
      setCraftSessions([]);
      return;
    }
    void (async () => {
      const { data, error } = await supabase
        .from('craft_sessions')
        .select('id, destination, updated_at')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(2);
      if (error) {
        setCraftSessions([]);
        return;
      }
      setCraftSessions(data ?? []);
    })();
  }, [session?.user?.id]);
  const generateMode = useAppStore((s) => s.generateMode);
  const setGenerateMode = useAppStore((s) => s.setGenerateMode);
  const addTrip = useAppStore((s) => s.addTrip);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const isPro = useAppStore((s) => s.isPro);
  const trips = useAppStore((s) => s.trips);

  // ── Travel state ──
  const { stage, activeTrip, daysUntil } = useTravelStage();
  const { brief, isLive } = useDailyBrief(activeTrip?.destination, daysUntil ?? 0);
  const checklist = useMemo(() => getChecklistItems(daysUntil ?? 999), [daysUntil]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // ── Typewriter effect for DREAMING state ──
  const dreamingCities = useMemo(() => ['Tokyo.', 'Bali.', 'Vienna.', 'Lisbon.', 'Seoul.', 'Cartagena.'], []);
  const [dreamingCityIndex, setDreamingCityIndex] = useState(0);
  useEffect(() => {
    if (stage !== 'DREAMING') return;
    const timer = setInterval(() => {
      setDreamingCityIndex((i) => (i + 1) % dreamingCities.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [stage, dreamingCities.length]);

  // ── Pulse animation for IMMINENT state ──
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (stage !== 'IMMINENT') { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.spring(pulseAnim, { toValue: 1.06, useNativeDriver: true, speed: 2, bounciness: 4 }),
        Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 2, bounciness: 4 }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stage, pulseAnim]);

  const handleChecklistToggle = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  // ── Destination intel (weather, sonar, events) ──
  const planDestination = useAppStore((s) => s.planWizard.destination);
  const sonarDest = useSonarQuery(planDestination || undefined, 'pulse');
  const [destWeather, setDestWeather] = useState<CurrentWeather | null>(null);
  const [destEvents, setDestEvents] = useState<EventResult[] | null>(null);

  useEffect(() => {
    if (!planDestination) { setDestWeather(null); setDestEvents(null); return; }
    let cancelled = false;
    getCurrentWeather(planDestination).then((w) => { if (!cancelled) setDestWeather(w); }).catch(() => { /* silent */ });
    searchEvents(planDestination).then((e) => { if (!cancelled) setDestEvents(e?.slice(0, 3) ?? null); }).catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [planDestination]);

  const sortedTrips = useMemo(
    () => [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [trips],
  );

  const hasTrips = sortedTrips.length > 0;

  const handleModeSelect = useCallback((mode: 'quick' | 'conversation') => {
    trackEvent('generate_mode_selected', { mode }).catch(() => {});
    if (mode === 'conversation') {
      router.push('/craft-session' as never);
      return;
    }
    setGenerateMode(mode);
  }, [setGenerateMode, router]);

  const handleNewTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/craft-session' as never);
  }, [router]);

  const handleQuickAction = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'flights') {
      router.push('/(tabs)/flights' as never);
    } else if (id === 'hotels') {
      router.push('/(tabs)/stays' as never);
    } else if (id === 'food') {
      router.push('/(tabs)/food' as never);
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
        startDate: state.startDate?.toISOString().split('T')[0],
      };

      addTrip(trip);
      setTripsThisMonth(tripsUsed);
      setStreamingProgress('Trip ready!');
      captureEvent('trip_generation_completed', { destination: state.destination, days: state.duration, budget: BUDGET_TO_BACKEND[state.budget], mode: 'quick' });
      recordGrowthEvent('trip_generated').catch(() => {});
      evaluateTrigger('post_generation').catch(() => {});

      // Schedule daily brief + trip wrapped notifications
      const daysUntil = state.startDate
        ? Math.max(0, Math.ceil((state.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : state.duration;
      scheduleDailyBrief(state.destination, daysUntil).catch(() => {});
      const returnDate = state.startDate
        ? new Date(state.startDate.getTime() + state.duration * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + (daysUntil + state.duration) * 24 * 60 * 60 * 1000).toISOString();
      scheduleTripWrappedReminder(trip.id, state.destination, returnDate).catch(() => {});

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
        setNetworkError(err instanceof Error ? err.message : 'Couldn\u2019t reach our servers — probably a WiFi thing. Give it a sec and try again.');
      }
    } finally {
      setIsGenerating(false);
      setStreamingProgress(null);
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
        startDate: undefined,
      };

      addTrip(trip);
      setTripsThisMonth(tripsUsed);
      setStreamingProgress('Trip ready!');
      captureEvent('trip_generation_completed', { destination: dest, days, budget, mode: 'conversation' });
      recordGrowthEvent('trip_generated').catch(() => {});
      evaluateTrigger('post_generation').catch(() => {});

      // Schedule daily brief + trip wrapped notifications
      scheduleDailyBrief(dest, days).catch(() => {});
      const returnDate = new Date(Date.now() + days * 2 * 24 * 60 * 60 * 1000).toISOString();
      scheduleTripWrappedReminder(trip.id, dest, returnDate).catch(() => {});

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
        setNetworkError(err instanceof Error ? err.message : 'Couldn\u2019t reach our servers — probably a WiFi thing. Give it a sec and try again.');
      }
    } finally {
      setIsGenerating(false);
      setStreamingProgress(null);
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
  if (showGenerator) {
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
                accessibilityLabel="Back to your trips"
                accessibilityRole="button"
              >
                <Text style={styles.backToTripsText}>{t('plan.backToTrips')}</Text>
              </Pressable>
            )}
            <GenerateModeSelect onSelect={handleModeSelect} firstTime={!hasTrips} />
            {craftSessions.length > 0 ? (
              <View style={styles.continueSection}>
                <Text style={styles.continueSectionLabel}>Continue a trip you were planning</Text>
                {craftSessions.map((s) => {
                  const dateLabel = new Date(s.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <Pressable
                      key={s.id}
                      style={({ pressed }) => [styles.continueCard, { opacity: pressed ? 0.9 : 1 }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push({ pathname: '/craft-session', params: { sessionId: s.id } } as never);
                      }}
                      accessibilityLabel={`Continue planning ${s.destination ?? 'trip'} from ${dateLabel}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.continueCardDest}>{s.destination ?? 'Your trip'}</Text>
                      <Text style={styles.continueCardDate}>{dateLabel}</Text>
                      <View style={styles.continueCardArrow}>
                        <ChevronRight size={18} color={COLORS.gold} strokeWidth={1.5} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
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
                <Pressable
                  onPress={clearError}
                  hitSlop={8}
                  accessibilityLabel="Dismiss error"
                  accessibilityRole="button"
                  style={styles.errorBannerDismissBtn}
                >
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
            <TripGeneratingLoader destination={generatingDestRef.current} statusOverride={streamingProgress} />
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
        {/* Header — only when the user has trips */}
        {hasTrips && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('plan.yourTrips')}</Text>
            <Text style={styles.headerSub}>
              {t('plan.tripsPlanned', { count: sortedTrips.length })}
            </Text>
          </View>
        )}

        {/* ── Travel-state adaptive hero section ── */}
        {stage === 'DREAMING' && !showGenerator && (
          <DreamingSection
            cityLabel={dreamingCities[dreamingCityIndex]}
            onQuickTrip={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleNewTrip(); setGenerateMode('quick'); }}
            onPlanTogether={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/craft-session' as never); }}
          />
        )}

        {(stage === 'PLANNING' || stage === 'IMMINENT') && activeTrip && (
          <PlanningSection
            stage={stage}
            daysUntil={daysUntil ?? 0}
            activeTrip={activeTrip}
            brief={brief}
            isLive={isLive}
            checklist={checklist}
            checkedItems={checkedItems}
            onToggle={handleChecklistToggle}
            pulseAnim={pulseAnim}
          />
        )}

        {stage === 'TRAVELING' && activeTrip && (
          <TravelingSection
            activeTrip={activeTrip}
            onHelpPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/i-am-here-now' as never); }}
            onCapturePress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/trip-journal' as never); }}
          />
        )}

        {stage === 'RETURNED' && activeTrip && (
          <ReturnedSection
            activeTrip={activeTrip}
            onWrappedPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/trip-wrapped' as never); }}
            onJournalPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/trip-journal' as never); }}
          />
        )}

        {/* Countdown — when latest trip has departure date */}
        {hasTrips && sortedTrips[0].startDate && (() => {
          const start = new Date(sortedTrips[0].startDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          start.setHours(0, 0, 0, 0);
          const daysUntil = Math.max(0, Math.round((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
          const city = sortedTrips[0].destination;
          const isUrgent = daysUntil > 0 && daysUntil < 7;
          return (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/itinerary' as never);
              }}
              accessibilityLabel={`${daysUntil} days until ${city}. Tap to view itinerary.`}
              accessibilityRole="button"
              style={({ pressed }) => [styles.countdownBanner, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.countdownText, isUrgent && styles.countdownTextGold]}>
                {daysUntil === 0
                  ? t('plan.countdownToday', { defaultValue: 'Today: {{city}}', city })
                  : daysUntil === 1
                    ? t('plan.countdownTomorrow', { defaultValue: '1 day until {{city}}', city })
                    : t('plan.countdownDays', { defaultValue: '{{count}} days until {{city}}', count: daysUntil, city })}
              </Text>
            </Pressable>
          );
        })()}

        {/* New Trip Button */}
        <Pressable
          onPress={handleNewTrip}
          accessibilityLabel="Plan a new trip"
          accessibilityRole="button"
          style={({ pressed }) => [styles.newTripBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <LinearGradient
            colors={[COLORS.sage, COLORS.sageStrong]}
            style={styles.newTripGradient}
          >
            <Plus size={22} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.newTripText}>{t('plan.planNewTrip')}</Text>
          </LinearGradient>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowGenerator(true);
            setGenerateMode('quick');
          }}
          accessibilityLabel={t('plan.orQuickTrip', { defaultValue: 'or try Quick Trip' })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.quickTripLink, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={styles.quickTripLinkText}>{t('plan.orQuickTrip', { defaultValue: 'or try Quick Trip' })}</Text>
        </Pressable>

        {/* Dream Board link */}
        <DreamBoardBanner />

        {/* Trip Fund card — only shows when user has savings goals */}
        <TripFundCard />

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
              accessibilityLabel={t(action.labelKey)}
              accessibilityRole="button"
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.iconBg }]}>
                <action.icon size={18} color={action.color} strokeWidth={1.5} />
              </View>
              <Text style={styles.quickActionLabel}>{t(action.labelKey)}</Text>
              <Text style={styles.quickActionSub}>{t(action.subKey)}</Text>
            </Pressable>
          ))}
        </View>

        {/* Destination Intel (shows when planning) */}
        {planDestination && !showGenerator && (sonarDest.data || destWeather || destEvents) && (
          <View style={styles.destIntel}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/destination/[name]', params: { name: planDestination } } as never);
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.destIntelLabel}>DESTINATION INTEL</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                <Text style={styles.destIntelHeading}>{planDestination}</Text>
                <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} />
              </View>
            </Pressable>

            {destWeather && (
              <View style={styles.destIntelCard}>
                <Text style={styles.destIntelCardTitle}>Weather Now</Text>
                <Text style={styles.destIntelWeather}>{destWeather.temp}°C · {destWeather.condition}</Text>
                <Text style={styles.destIntelMeta}>Humidity {destWeather.humidity}% · Wind {destWeather.windSpeed} km/h</Text>
              </View>
            )}

            {sonarDest.data && (
              <View style={styles.destIntelCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.destIntelCardTitle}>Live Intel</Text>
                  {sonarDest.isLive && <LiveBadge />}
                </View>
                <Text style={styles.destIntelBody}>{sonarDest.data.answer}</Text>
                {sonarDest.citations.length > 0 && <SourceCitation citations={sonarDest.citations} />}
              </View>
            )}

            {destEvents && destEvents.length > 0 && (
              <View style={styles.destIntelCard}>
                <Text style={styles.destIntelCardTitle}>Upcoming Events</Text>
                {destEvents.map((evt) => (
                  <Text key={evt.id} style={styles.destIntelEvent}>· {evt.name}{evt.date ? ` — ${new Date(evt.date).toLocaleDateString()}` : ''}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Map Preview for active trip */}
        {sortedTrips.length > 0 && sortedTrips[0].itinerary && (
          <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}>
            <TripMapCard
              tripId={sortedTrips[0].id}
              destination={sortedTrips[0].destination}
              itineraryRaw={sortedTrips[0].itinerary}
              days={sortedTrips[0].days}
            />
          </View>
        )}

        {/* Countdown hero — when latest trip has startDate */}
        {sortedTrips.length > 0 && sortedTrips[0].startDate ? (
          <CountdownHero trip={sortedTrips[0]} onPress={() => handleTripPress(sortedTrips[0])} />
        ) : null}

        {/* Trip Cards */}
        <Text style={styles.sectionLabel}>{t('plan.sectionYourTrips')}</Text>
        {sortedTrips.map((trip, index) => (
          index === 0
            ? <NextTripHero key={trip.id} trip={trip} onPress={() => handleTripPress(trip)} />
            : <TripCard key={trip.id} trip={trip} onPress={() => handleTripPress(trip)} isLatest={false} />
        ))}

        {/* Flights Section */}
        <View style={styles.flightsSectionHeader}>
          <Text style={styles.sectionLabel}>Flights</Text>
          <Text style={styles.flightsSectionSub}>Deals and search</Text>
        </View>
        <GoNowFeed />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(tabs)/flights' as never);
          }}
          accessibilityLabel="Search all flights"
          accessibilityRole="button"
          style={({ pressed }) => [styles.searchFlightsBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Plane size={16} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.searchFlightsBtnText}>Search all flights</Text>
          <ChevronRight size={16} color={COLORS.bg} strokeWidth={1.5} />
        </Pressable>
      </ScrollView>

      {isGenerating && (
        <View style={styles.loaderOverlay}>
          <TripGeneratingLoader destination={generatingDestRef.current} statusOverride={streamingProgress} />
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
// DreamBoardBanner — appears below trip cards for users who have trips
// ---------------------------------------------------------------------------
function DreamBoardBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const dreamCount = useDreamStore((s) => s.dreams.filter((d) => !d.isArchived).length);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push('/dream-board' as never);
      }}
      accessibilityLabel={t('plan.dreamBoard', { defaultValue: 'Dream Board' })}
      accessibilityRole="button"
      style={({ pressed }) => [stageStyles.dreamBoardBanner, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Heart size={16} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={stageStyles.dreamBoardBannerText}>
        {dreamCount > 0
          ? t('plan.dreamBoardCount', {
              defaultValue: `Dream Board \u00B7 ${dreamCount} destinations saved`,
              count: dreamCount,
            })
          : t('plan.dreamBoardCta', { defaultValue: 'Your dream destinations' })}
      </Text>
      <ChevronRight size={16} color={COLORS.sage} strokeWidth={1.5} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// TripFundCard — shows total savings progress, navigates to /money
// ---------------------------------------------------------------------------
function TripFundCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const goals = useSavingsStore((s) => s.goals);

  if (goals.length === 0) return null;

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const pct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push('/money' as never);
      }}
      accessibilityLabel={t('plan.tripFund', { defaultValue: 'Trip Fund' })}
      accessibilityRole="button"
      style={({ pressed }) => [stageStyles.dreamBoardBanner, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Wallet size={16} color={COLORS.sage} strokeWidth={1.5} />
      <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>
        <Text style={stageStyles.dreamBoardBannerText}>
          {t('plan.tripFundLabel', {
            defaultValue: `Trip Fund \u00B7 $${totalSaved.toLocaleString()} of $${totalTarget.toLocaleString()}`,
          })}
        </Text>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: COLORS.surface2, marginTop: 4, overflow: 'hidden' }}>
          <View style={{ height: 3, borderRadius: 2, backgroundColor: COLORS.sage, width: `${pct}%` }} />
        </View>
      </View>
      <ChevronRight size={16} color={COLORS.sage} strokeWidth={1.5} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// DreamingSection — shown when no active trips (DREAMING stage)
// ---------------------------------------------------------------------------
function DreamingSection({
  cityLabel,
  onQuickTrip,
  onPlanTogether,
}: {
  cityLabel: string;
  onQuickTrip: () => void;
  onPlanTogether: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View style={stageStyles.dreamingContainer}>
      <Text style={stageStyles.dreamingHeadline}>
        {t('plan.dreaming.headline', { defaultValue: 'Where are you going?' })}
      </Text>
      <Text style={stageStyles.dreamingTypewriter}>{cityLabel}</Text>
      <View style={stageStyles.dreamingButtons}>
        <Pressable
          onPress={onPlanTogether}
          accessibilityLabel={t('plan.dreaming.planTogether', { defaultValue: 'Plan Together' })}
          accessibilityRole="button"
          style={({ pressed }) => [stageStyles.dreamingBtn, stageStyles.dreamingBtnSage, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[stageStyles.dreamingBtnText, stageStyles.dreamingBtnTextSage]}>
            {t('plan.dreaming.planTogether', { defaultValue: 'Plan Together' })}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onQuickTrip}
        accessibilityLabel={t('plan.dreaming.quickTrip', { defaultValue: 'Quick Trip' })}
        accessibilityRole="button"
        style={({ pressed }) => [stageStyles.dreamingQuickLink, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={stageStyles.dreamingQuickLinkText}>
          {t('plan.dreaming.orQuickTrip', { defaultValue: 'or try Quick Trip' })}
        </Text>
      </Pressable>
      {/* Dream Board link */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push('/dream-board' as never);
        }}
        accessibilityLabel={t('plan.dreamBoard', { defaultValue: 'Dream Board' })}
        accessibilityRole="button"
        style={({ pressed }) => [stageStyles.dreamBoardLink, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Heart size={14} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={stageStyles.dreamBoardLinkText}>
          {t('plan.dreamBoardCta', { defaultValue: 'Your dream destinations' })}
        </Text>
        <ChevronRight size={14} color={COLORS.sage} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PlanningSection — countdown, daily brief, checklist (PLANNING + IMMINENT)
// ---------------------------------------------------------------------------
function PlanningSection({
  stage,
  daysUntil,
  activeTrip,
  brief,
  isLive,
  checklist,
  checkedItems,
  onToggle,
  pulseAnim,
}: {
  stage: TravelStage;
  daysUntil: number;
  activeTrip: import('../../lib/store').Trip;
  brief: import('../../lib/daily-brief').DailyBrief | null;
  isLive: boolean;
  checklist: import('../../lib/daily-brief').ChecklistItem[];
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
  pulseAnim: Animated.Value;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const isImminent = stage === 'IMMINENT';
  const countdownColor = isImminent ? COLORS.gold : COLORS.cream;

  return (
    <View style={stageStyles.planningContainer}>
      {/* Countdown number */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/itinerary' as never);
        }}
        accessibilityLabel={`${daysUntil} days until ${activeTrip.destination}. Tap to view itinerary.`}
        accessibilityRole="button"
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center', marginBottom: SPACING.xs }}>
          <Text style={[stageStyles.countdownNumber, { color: countdownColor }]}>
            {daysUntil}
          </Text>
          <Text style={stageStyles.countdownSub}>
            {isImminent
              ? t('plan.planning.almostTime', { defaultValue: 'Almost time.' })
              : t('plan.planning.daysUntil', { defaultValue: 'days until {{destination}}', destination: activeTrip.destination })}
          </Text>
        </Animated.View>
      </Pressable>

      {/* Daily brief card */}
      {brief && (
        <View style={stageStyles.briefCard}>
          <View style={stageStyles.briefHeader}>
            <Text style={stageStyles.briefHeadline}>{brief.headline}</Text>
            {isLive && <LiveBadge />}
          </View>
          <Text style={stageStyles.briefSubtext}>{brief.subtext}</Text>
        </View>
      )}

      {/* Pre-trip checklist */}
      {checklist.length > 0 && (
        <View style={stageStyles.checklistContainer}>
          <Text style={stageStyles.checklistTitle}>
            {t('plan.planning.checklist', { defaultValue: 'Pre-trip checklist' })}
          </Text>
          {checklist.map((item) => {
            const checked = checkedItems.has(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggle(item.id)}
                accessibilityLabel={`${checked ? 'Uncheck' : 'Check'}: ${item.label}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={({ pressed }) => [stageStyles.checklistRow, checked && stageStyles.checklistRowChecked, { opacity: pressed ? 0.8 : 1 }]}
              >
                <View style={[stageStyles.checkbox, checked && stageStyles.checkboxChecked]}>
                  {checked && <Text style={stageStyles.checkboxMark}>✓</Text>}
                </View>
                <Text style={[stageStyles.checklistLabel, checked && stageStyles.checklistLabelChecked]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// TravelingSection — shown when the user is currently on their trip
// ---------------------------------------------------------------------------
function TravelingSection({
  activeTrip,
  onHelpPress,
  onCapturePress,
}: {
  activeTrip: import('../../lib/store').Trip;
  onHelpPress: () => void;
  onCapturePress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={stageStyles.travelingContainer}>
      <Text style={stageStyles.travelingHeader}>
        {t('plan.traveling.youreIn', { defaultValue: "You're in {{destination}}", destination: activeTrip.destination })}
      </Text>
      <View style={stageStyles.travelingActions}>
        <Pressable
          onPress={onHelpPress}
          accessibilityLabel={t('plan.traveling.needHelp', { defaultValue: 'Need help?' })}
          accessibilityRole="button"
          style={({ pressed }) => [stageStyles.travelingBtn, stageStyles.travelingBtnSage, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={stageStyles.travelingBtnText}>
            {t('plan.traveling.needHelp', { defaultValue: 'Need help?' })}
            {' \u2192'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCapturePress}
          accessibilityLabel={t('plan.traveling.captureBtn', { defaultValue: 'Capture moment' })}
          accessibilityRole="button"
          style={({ pressed }) => [stageStyles.travelingBtn, stageStyles.travelingBtnGold, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={stageStyles.travelingBtnText}>
            {t('plan.traveling.captureBtn', { defaultValue: 'Capture moment' })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ReturnedSection — shown after returning from a trip
// ---------------------------------------------------------------------------
function ReturnedSection({
  activeTrip,
  onWrappedPress,
  onJournalPress,
}: {
  activeTrip: import('../../lib/store').Trip;
  onWrappedPress: () => void;
  onJournalPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={stageStyles.returnedContainer}>
      <Text style={stageStyles.returnedHeader}>
        {t('plan.returned.welcome', { defaultValue: 'Welcome back from {{destination}}', destination: activeTrip.destination })}
      </Text>
      <Pressable
        onPress={onWrappedPress}
        accessibilityLabel={t('plan.returned.wrapped', { defaultValue: 'See your trip wrapped' })}
        accessibilityRole="button"
        style={({ pressed }) => [stageStyles.returnedLink, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={stageStyles.returnedLinkText}>
          {t('plan.returned.wrapped', { defaultValue: 'See your trip wrapped' })}
          {' \u2192'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onJournalPress}
        accessibilityLabel={t('plan.returned.journal', { defaultValue: 'Read your story' })}
        accessibilityRole="button"
        style={({ pressed }) => [stageStyles.returnedLink, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={stageStyles.returnedLinkText}>
          {t('plan.returned.journal', { defaultValue: 'Read your story' })}
          {' \u2192'}
        </Text>
      </Pressable>
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
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTap();
      }}
      accessibilityLabel={`See who else is heading to ${destination}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.peopleBanner, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.peopleBannerLeft}>
        <Users size={16} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.peopleBannerText}>
          See who else is heading to{' '}
          <Text style={styles.peopleBannerBold}>{destination}</Text>
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDismiss();
        }}
        hitSlop={12}
        accessibilityLabel="Dismiss people nudge"
        accessibilityRole="button"
        style={styles.peopleBannerDismiss}
      >
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
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onUpgrade();
            }}
            accessibilityLabel="See ROAM Pro plans"
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldDark]}
              style={styles.rateLimitUpgradeBtn}
            >
              <Text style={styles.rateLimitUpgradeText}>{t('plan.seeProPlans')}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onDismiss();
            }}
            accessibilityLabel="Maybe later — dismiss upgrade prompt"
            accessibilityRole="button"
            style={styles.rateLimitDismiss}
            hitSlop={12}
          >
            <Text style={styles.rateLimitDismissText}>{t('plan.maybeLater')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Travel-state stage styles
// ---------------------------------------------------------------------------
const stageStyles = StyleSheet.create({
  // ── DREAMING ──
  dreamingContainer: {
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  dreamingHeadline: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  dreamingTypewriter: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  } as TextStyle,
  dreamingButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'center',
  } as ViewStyle,
  dreamingBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    minWidth: 130,
    alignItems: 'center',
  } as ViewStyle,
  dreamingBtnSage: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  dreamingBtnGold: {
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  dreamingBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
  } as TextStyle,
  dreamingBtnTextSage: {
    color: COLORS.bg,
  } as TextStyle,
  dreamingBtnTextGold: {
    color: COLORS.bg,
  } as TextStyle,
  dreamingQuickLink: {
    alignSelf: 'center',
    paddingTop: SPACING.sm,
  } as ViewStyle,
  dreamingQuickLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'underline',
  } as TextStyle,
  dreamBoardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  dreamBoardLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  dreamBoardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  dreamBoardBannerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
    flex: 1,
  } as TextStyle,

  // ── PLANNING / IMMINENT ──
  planningContainer: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  countdownNumber: {
    fontFamily: FONTS.mono,
    fontSize: 72,
    letterSpacing: -2,
    lineHeight: 80,
  } as TextStyle,
  countdownSub: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  } as TextStyle,
  briefCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  briefHeadline: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  briefSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 19,
  } as TextStyle,
  checklistContainer: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  checklistTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  checklistRowChecked: {
    opacity: 0.55,
  } as ViewStyle,
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.creamDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  checkboxMark: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  checklistLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 19,
  } as TextStyle,
  checklistLabelChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.creamDim,
  } as TextStyle,

  // ── TRAVELING ──
  travelingContainer: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  travelingHeader: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  travelingActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  travelingBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  travelingBtnSage: {
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  travelingBtnGold: {
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  travelingBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // ── RETURNED ──
  returnedContainer: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  } as ViewStyle,
  returnedHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  returnedLink: {
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  returnedLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.gold,
  } as TextStyle,
});

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
    paddingHorizontal: 20,
    paddingBottom: 120,
  } as ViewStyle,

  // ── Header ──
  header: {
    paddingTop: 24,
    paddingBottom: 20,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: 6,
    letterSpacing: 0.5,
  } as TextStyle,
  countdownBanner: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  countdownText: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  countdownTextGold: {
    color: COLORS.gold,
  } as TextStyle,

  // ── New Trip Button ──
  newTripBtn: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  } as ViewStyle,
  newTripGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  newTripText: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,
  quickTripLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  quickTripLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'underline',
  } as TextStyle,

  // ── People Nudge Banner ──
  peopleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: SPACING.lg,
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
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
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
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,

  // ── Flights Section ──
  flightsSectionHeader: {
    marginTop: SPACING.xxl,
    marginBottom: 0,
  } as ViewStyle,
  flightsSectionSub: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: SPACING.md,
  } as TextStyle,
  searchFlightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.action,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  searchFlightsBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
    flex: 1,
    textAlign: 'center',
  } as TextStyle,

  // ── Trip Cards ──
  tripCard: {
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  } as ViewStyle,
  tripCardLatest: {
    height: 220,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
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
    padding: SPACING.lg,
  } as ViewStyle,
  tripCardDest: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
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
  } as ViewStyle,
  tripCardChipText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
  } as TextStyle,
  tripCardArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10,
  } as ViewStyle,
  latestBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
  } as ViewStyle,
  latestBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  trendBadgeRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  } as ViewStyle,
  heroTrendRow: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
  } as ViewStyle,
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.coralSubtle,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 7,
    paddingVertical: 3,
  } as ViewStyle,
  trendBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.coral,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorderStrong,
    borderRadius: RADIUS.md,
    paddingHorizontal: 7,
    paddingVertical: 3,
  } as ViewStyle,
  timingBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // ── Next Trip Hero ──
  heroCard: {
    height: 280,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  heroDest: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.white,
    marginBottom: 4,
  } as TextStyle,
  heroTagline: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
    lineHeight: 18,
  } as TextStyle,
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: COLORS.overlayMedium,
  } as ViewStyle,
  heroPillGold: {
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  heroPillSage: {
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  heroPillCoral: {
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  heroPillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  } as TextStyle,
  heroPillTextGold: {
    color: COLORS.gold,
  } as TextStyle,
  heroPillTextSage: {
    color: COLORS.sage,
  } as TextStyle,
  heroPillTextCoral: {
    color: COLORS.coral,
  } as TextStyle,
  heroArrow: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    backgroundColor: COLORS.whiteMuted,
    borderRadius: RADIUS.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // ── Back to trips ──
  backToTrips: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    justifyContent: 'center',
  } as ViewStyle,
  backToTripsText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // ── Continue CRAFT sessions ──
  continueSection: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  continueSectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginBottom: SPACING.sm,
  } as TextStyle,
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  continueCardDest: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  continueCardDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    marginRight: SPACING.sm,
  } as TextStyle,
  continueCardArrow: {},
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

  // ── Error dismiss button ──
  errorBannerDismissBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

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
    borderRadius: RADIUS.sm,
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
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  rateLimitDismissText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,

  // ── Destination Intel ──
  destIntel: {
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  destIntelLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  destIntelHeading: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  destIntelCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 6,
    marginTop: SPACING.sm,
  } as ViewStyle,
  destIntelCardTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  destIntelWeather: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  destIntelMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  destIntelBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  destIntelEvent: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 18,
  } as TextStyle,
});
