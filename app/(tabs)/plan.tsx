// ROAM — Plan Tab (orchestrator)
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Plane, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { useAppStore, type Trip } from '../../lib/store';
import { generateItineraryStreaming, TripLimitReachedError } from '../../lib/claude';
import { isGuestUser } from '../../lib/guest';
import { scheduleDailyBrief, scheduleTripWrappedReminder } from '../../lib/notifications';
import { scheduleSmartNotifications } from '../../lib/smart-notifications';
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
import { useSonarQuery } from '../../lib/sonar';
import { supabase } from '../../lib/supabase';
import TripMapCard from '../../components/features/TripMapCard';
import { useTravelStage } from '../../lib/travel-state';
import { useDailyBrief, getChecklistItems } from '../../lib/daily-brief';
import { getWeatherForecast, type DailyForecast } from '../../lib/weather-forecast';
import { getCostOfLiving } from '../../lib/cost-of-living';
import { getAirQuality, resolveDestinationCoords, type AirQuality } from '../../lib/air-quality';
import { geocodeCity } from '../../lib/geocoding';
import { getCurrentWeather, type CurrentWeather } from '../../lib/apis/openweather'; import { searchEvents, type EventResult } from '../../lib/apis/eventbrite';
import DreamingHero from '../../components/plan/DreamingHero';
import { useTravelerDNA, getPersonalizedGreeting, getQuickActions } from '../../lib/personalization-engine';
import { usePersonalization } from '../../lib/auto-personalize';
import { getGreeting } from '../../lib/personalized-copy';
import CountdownSection from '../../components/plan/CountdownSection';
import TravelingSection from '../../components/plan/TravelingSection';
import ReturnedSection from '../../components/plan/ReturnedSection';
import { TripCard, NextTripHero } from '../../components/plan/TripCard';
import QuickActions from '../../components/plan/QuickActions';
import DestinationIntel from '../../components/plan/DestinationIntel';
import DreamBoardBanner from '../../components/plan/DreamBoardBanner'; import TripFundCard from '../../components/plan/TripFundCard';
import PeopleNudgeBanner from '../../components/plan/PeopleNudgeBanner'; import RateLimitModal from '../../components/plan/RateLimitModal';
import { getCollaboratorCount } from '../../lib/group-trip';
import { useBudgetTracker } from '../../lib/budget-tracker';
import { parseItinerary } from '../../lib/types/itinerary';

interface ConversationBrief { destination?: string; days?: number; budget?: string; groupSize?: number; vibes: string[] }
const RANDOM_CITIES = ['Tokyo', 'Bali', 'Lisbon', 'Mexico City', 'Bangkok', 'Barcelona', 'Cape Town', 'Medellín', 'Kyoto', 'Marrakech', 'Budapest', 'Buenos Aires'];
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

  useEffect(() => { track({ type: 'screen_view', screen: 'plan' }); return () => { isMountedRef.current = false; }; }, []);

  const session = useAppStore((s) => s.session);
  useEffect(() => {
    if (!session?.user?.id) { setCraftSessions([]); return; }
    void (async () => {
      const { data, error } = await supabase.from('craft_sessions').select('id, destination, updated_at').eq('user_id', session.user.id).order('updated_at', { ascending: false }).limit(2);
      if (error) { setCraftSessions([]); return; }
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

  // ── Personalization (hooks — order matters) ──
  const { dna } = useTravelerDNA();
  const { profile: autoProfile, contentOrder, isPersonalized } = usePersonalization();
  const personalizedActions = useMemo(() => getQuickActions(dna), [dna]);

  // ── Travel state ──
  const { stage, activeTrip, daysUntil } = useTravelStage();

  // ── Personalized greeting (depends on travel state) ──
  const personalizedGreeting = useMemo(() => {
    if (isPersonalized) return getGreeting(autoProfile, stage, activeTrip?.destination);
    if (dna.confidence > 0.2) return getPersonalizedGreeting(dna);
    return undefined;
  }, [dna, autoProfile, stage, activeTrip?.destination, isPersonalized]);
  const { brief, isLive } = useDailyBrief(activeTrip?.destination, daysUntil ?? 0);
  const checklist = useMemo(() => getChecklistItems(daysUntil ?? 999), [daysUntil]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // ── Budget tracker for TRAVELING state ──
  const activeTripItinerary = useMemo(() => {
    if (!activeTrip) return null;
    try { return parseItinerary(activeTrip.itinerary); } catch { return null; }
  }, [activeTrip]);
  const { comparison: budgetComparison } = useBudgetTracker(activeTrip?.id ?? '', activeTripItinerary, activeTrip?.startDate);

  // ── Typewriter effect for DREAMING state ──
  const dreamingCities = useMemo(() => ['Tokyo.', 'Bali.', 'Vienna.', 'Lisbon.', 'Seoul.', 'Cartagena.'], []);
  const [dreamingCityIndex, setDreamingCityIndex] = useState(0);
  useEffect(() => {
    if (stage !== 'DREAMING') return;
    const timer = setInterval(() => { setDreamingCityIndex((i) => (i + 1) % dreamingCities.length); }, 3000);
    return () => clearInterval(timer);
  }, [stage, dreamingCities.length]);

  // ── Pulse animation for IMMINENT state ──
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (stage !== 'IMMINENT') { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.spring(pulseAnim, { toValue: 1.06, useNativeDriver: true, speed: 2, bounciness: 4 }),
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 2, bounciness: 4 }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [stage, pulseAnim]);

  const handleChecklistToggle = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedItems((prev) => { const next = new Set(prev); if (next.has(id)) { next.delete(id); } else { next.add(id); } return next; });
  }, []);

  // ── Destination intel (weather, sonar, events) ──
  const planDestination = useAppStore((s) => s.planWizard.destination);
  const sonarDest = useSonarQuery(planDestination || undefined, 'pulse');
  const [destWeather, setDestWeather] = useState<CurrentWeather | null>(null);
  const [destEvents, setDestEvents] = useState<EventResult[] | null>(null);
  useEffect(() => {
    if (!planDestination) { setDestWeather(null); setDestEvents(null); return; }
    let cancelled = false;
    getCurrentWeather(planDestination).then((w) => { if (!cancelled) setDestWeather(w); }).catch(() => {});
    searchEvents(planDestination).then((e) => { if (!cancelled) setDestEvents(e?.slice(0, 3) ?? null); }).catch(() => {});
    return () => { cancelled = true; };
  }, [planDestination]);

  // ── PLANNING section extras — trip forecast, cost, air quality ──
  const [planWeatherDays, setPlanWeatherDays] = useState<DailyForecast[]>([]);
  const [planAirQuality, setPlanAirQuality] = useState<AirQuality | null>(null);
  const planCostData = useMemo(() => (activeTrip ? getCostOfLiving(activeTrip.destination) : null), [activeTrip]);
  useEffect(() => {
    if (!activeTrip || (stage !== 'PLANNING' && stage !== 'IMMINENT')) { setPlanWeatherDays([]); setPlanAirQuality(null); return; }
    let cancelled = false;
    const destination = activeTrip.destination;
    (async () => {
      try { const geo = await geocodeCity(destination); if (!geo || cancelled) return; const forecast = await getWeatherForecast(geo.latitude, geo.longitude, activeTrip.days || 7); if (!cancelled && forecast?.days) { setPlanWeatherDays(forecast.days.slice(0, Math.min(activeTrip.days || 7, forecast.days.length))); } } catch { /* silent */ }
    })();
    resolveDestinationCoords(destination).then((coords) => { if (!coords || cancelled) return; getAirQuality(coords.lat, coords.lng).then((aq) => { if (!cancelled) setPlanAirQuality(aq); }).catch(() => {}); }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeTrip, stage]);

  const sortedTrips = useMemo(() => [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [trips]);
  const hasTrips = sortedTrips.length > 0;

  // ── Collaborator counts for trip cards ──
  const [collabCounts, setCollabCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (sortedTrips.length === 0) return;
    let cancelled = false;
    (async () => {
      const counts: Record<string, number> = {};
      // Only load for first 10 trips to avoid excessive queries
      const batch = sortedTrips.slice(0, 10);
      await Promise.all(
        batch.map(async (t) => {
          const count = await getCollaboratorCount(t.id);
          if (!cancelled) counts[t.id] = count;
        }),
      );
      if (!cancelled) setCollabCounts(counts);
    })();
    return () => { cancelled = true; };
  }, [sortedTrips.length]);

  // ── Handlers ──
  const handleModeSelect = useCallback((mode: 'quick' | 'conversation') => {
    trackEvent('generate_mode_selected', { mode }).catch(() => {});
    if (mode === 'conversation') { router.push('/craft-session' as never); return; }
    setGenerateMode(mode);
  }, [setGenerateMode, router]);

  const handleNewTrip = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/craft-session' as never); }, [router]);

  const handleQuickAction = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (id === 'flights') router.push('/(tabs)/flights' as never);
    else if (id === 'hotels') router.push('/(tabs)/stays' as never);
    else if (id === 'food') router.push('/(tabs)/food' as never);
  }, [router]);

  const handleTripGenerated = useCallback(async (dest: string, days: number, budget: string, vibes: string[], groupSize: number | undefined, startDate: Date | undefined, extraParams?: Partial<Parameters<typeof generateItineraryStreaming>[0]>) => {
    generatingDestRef.current = dest;
    setIsGenerating(true);
    setStreamingProgress(null);
    try {
      const { itinerary, tripsUsed } = await generateItineraryStreaming({ destination: dest, days, budget, vibes, groupSize, startDate: startDate?.toISOString().split('T')[0], onProgress: (info) => { setStreamingProgress(info.text); }, ...extraParams });
      if (!itinerary?.destination || !itinerary?.days?.length) throw new Error('Almost had it — the trip came back a little incomplete. One more try should do it.');
      const trip = { id: `gen-${Date.now()}`, destination: dest, days, budget, vibes, itinerary: JSON.stringify(itinerary), createdAt: new Date().toISOString(), startDate: startDate?.toISOString().split('T')[0] };
      addTrip(trip);
      setTripsThisMonth(tripsUsed);
      setStreamingProgress('Trip ready!');
      captureEvent('trip_generation_completed', { destination: dest, days, budget, mode: extraParams ? 'quick' : 'conversation' });
      recordGrowthEvent('trip_generated').catch(() => {});
      evaluateTrigger('post_generation').catch(() => {});
      const du = startDate ? Math.max(0, Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : days;
      scheduleDailyBrief(dest, du).catch(() => {});
      const returnDate = startDate ? new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + (du + days) * 24 * 60 * 60 * 1000).toISOString();
      scheduleTripWrappedReminder(trip.id, dest, returnDate).catch(() => {});
      const parsed = parseItinerary(trip.itinerary);
      if (parsed) scheduleSmartNotifications(trip, parsed).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 800));
      if (!isMountedRef.current) return;
      setShowGenerator(false);
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err instanceof TripLimitReachedError) { captureEvent('rate_limit_hit', { destination: generatingDestRef.current, source: 'quick' }); setRateLimitVisible(true); }
      else { setNetworkError(err instanceof Error ? err.message : 'Couldn\u2019t reach our servers — probably a WiFi thing. Give it a sec and try again.'); }
    } finally { setIsGenerating(false); setStreamingProgress(null); }
  }, [setIsGenerating, addTrip, setTripsThisMonth, router]);

  const checkTripLimit = useCallback((dest?: string): boolean => {
    if (!isPro && !isGuestUser() && tripsThisMonth >= FREE_TRIPS_PER_MONTH) { router.push({ pathname: '/paywall', params: { reason: 'limit', destination: dest } }); return false; }
    if (isGuestUser() && trips.length >= 1) { router.push({ pathname: '/paywall', params: { reason: 'limit', destination: dest } }); return false; }
    return true;
  }, [isPro, tripsThisMonth, trips.length, router]);

  const handleQuickSubmit = useCallback(async (state: QuickModeState) => {
    if (!checkTripLimit(state.destination)) return;
    await handleTripGenerated(state.destination, state.duration, BUDGET_TO_BACKEND[state.budget], state.vibes, state.groupSize > 1 ? state.groupSize : undefined, state.startDate, { pace: state.pace, accommodationStyle: state.accommodationStyle, morningType: state.morningType, tripComposition: state.tripComposition, dietary: state.dietary, transport: state.transport, mustVisit: state.mustVisit, avoidList: state.avoidList, specialRequests: state.specialRequests });
  }, [checkTripLimit, handleTripGenerated]);

  const handleConversationGenerate = useCallback(async (b: ConversationBrief) => {
    if (!checkTripLimit(b.destination)) return;
    const dest = b.destination ?? RANDOM_CITIES[Math.floor(Math.random() * RANDOM_CITIES.length)];
    await handleTripGenerated(dest, b.days ?? 5, b.budget ?? 'comfort', b.vibes?.length ? b.vibes : ['culture'], b.groupSize && b.groupSize > 1 ? b.groupSize : undefined, undefined);
  }, [checkTripLimit, handleTripGenerated]);

  const clearError = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNetworkError(null); }, []);
  const handleUpgrade = useCallback(() => { setRateLimitVisible(false); router.push({ pathname: '/paywall', params: { reason: 'limit', destination: generatingDestRef.current } }); }, [router]);
  const handleTripPress = useCallback((trip: Trip) => { router.push({ pathname: '/itinerary', params: { tripId: trip.id } }); }, [router]);

  // ── Render: Generator mode ──
  if (showGenerator) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {generateMode === null ? (
          <View style={styles.fill}>
            {hasTrips && (<Pressable style={styles.backToTrips} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowGenerator(false); }} accessibilityLabel="Back to your trips" accessibilityRole="button"><Text style={styles.backToTripsText}>{t('plan.backToTrips')}</Text></Pressable>)}
            <GenerateModeSelect onSelect={handleModeSelect} firstTime={!hasTrips} />
            {craftSessions.length > 0 ? (<View style={styles.continueSection}><Text style={styles.continueSectionLabel}>{t('plan.continueTrip', { defaultValue: 'Pick up where you left off' })}</Text>{craftSessions.map((s) => { const dateLabel = new Date(s.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); return (<Pressable key={s.id} style={({ pressed }) => [styles.continueCard, { opacity: pressed ? 0.9 : 1 }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/craft-session', params: { sessionId: s.id } } as never); }} accessibilityLabel={`Continue planning ${s.destination ?? 'trip'} from ${dateLabel}`} accessibilityRole="button"><Text style={styles.continueCardDest}>{s.destination ?? 'Your trip'}</Text><Text style={styles.continueCardDate}>{dateLabel}</Text><View style={styles.continueCardArrow}><ChevronRight size={18} color={COLORS.gold} strokeWidth={1.5} /></View></Pressable>); })}</View>) : null}
          </View>
        ) : generateMode === 'quick' ? (
          <View style={styles.fill}><TripLimitBanner />{networkError ? (<View style={styles.errorBanner}><Text style={styles.errorBannerText}>{networkError}</Text><Pressable onPress={clearError} hitSlop={8} accessibilityLabel="Dismiss error" accessibilityRole="button" style={styles.errorBannerDismissBtn}><Text style={styles.errorBannerRetry}>{t('plan.dismiss')}</Text></Pressable></View>) : null}<GenerateQuickMode onSubmit={handleQuickSubmit} isGenerating={isGenerating} /></View>
        ) : (
          <View style={styles.fill}><TripLimitBanner />{networkError ? (<View style={styles.errorBanner}><Text style={styles.errorBannerText}>{networkError}</Text><Pressable onPress={clearError} hitSlop={8}><Text style={styles.errorBannerRetry}>{t('plan.dismiss')}</Text></Pressable></View>) : null}<GenerateConversationMode onGenerate={handleConversationGenerate} isGenerating={isGenerating} /></View>
        )}
        {isGenerating && (<View style={styles.loaderOverlay}><TripGeneratingLoader destination={generatingDestRef.current} statusOverride={streamingProgress} /></View>)}
        <RateLimitModal visible={rateLimitVisible} onUpgrade={handleUpgrade} onDismiss={() => setRateLimitVisible(false)} />
      </View>
    );
  }

  // ── Render: Trip management mode ──
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.fill} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {hasTrips && (<View style={styles.header}><Text style={styles.headerTitle}>{t('plan.yourTrips')}</Text><Text style={styles.headerSub}>{t('plan.tripsPlanned', { count: sortedTrips.length })}</Text></View>)}

        {stage === 'DREAMING' && !showGenerator && (<DreamingHero cityLabel={dreamingCities[dreamingCityIndex]} onQuickTrip={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleNewTrip(); setGenerateMode('quick'); }} onPlanTogether={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/craft-session' as never); }} personalizedGreeting={personalizedGreeting} />)}

        {(stage === 'PLANNING' || stage === 'IMMINENT') && activeTrip && (<CountdownSection stage={stage} daysUntil={daysUntil ?? 0} activeTrip={activeTrip} brief={brief} isLive={isLive} checklist={checklist} checkedItems={checkedItems} onToggle={handleChecklistToggle} pulseAnim={pulseAnim} weatherDays={planWeatherDays} airQuality={planAirQuality} costData={planCostData} />)}

        {stage === 'TRAVELING' && activeTrip && (<TravelingSection activeTrip={activeTrip} onHelpPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/i-am-here-now' as never); }} onCapturePress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push(('/trip-journal?tripId=' + activeTrip.id) as never); }} onSplitPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/split-expenses' as never); }} onBudgetPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/budget-tracker' as never); }} budgetComparison={budgetComparison} />)}

        {stage === 'RETURNED' && activeTrip && (<ReturnedSection activeTrip={activeTrip} onWrappedPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/trip-wrapped' as never); }} onJournalPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(('/trip-journal?tripId=' + activeTrip.id) as never); }} />)}

        {(stage === 'DREAMING' || hasTrips) && (<Pressable onPress={handleNewTrip} accessibilityLabel="Plan a new trip" accessibilityRole="button" style={({ pressed }) => [styles.newTripBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}><LinearGradient colors={[COLORS.sage, COLORS.sageStrong]} style={styles.newTripGradient}><Plus size={22} color={COLORS.bg} strokeWidth={1.5} /><Text style={styles.newTripText}>{t('plan.planNewTrip')}</Text></LinearGradient></Pressable>)}

        <DreamBoardBanner />
        <TripFundCard />

        {!peopleBannerDismissed && sortedTrips.length > 0 && (<PeopleNudgeBanner destination={sortedTrips[0].destination} onTap={() => router.push('/(tabs)/people' as never)} onDismiss={() => setPeopleBannerDismissed(true)} />)}

        <QuickActions onAction={handleQuickAction} />

        {planDestination && !showGenerator && stage === 'DREAMING' && (sonarDest.data || destWeather || destEvents) && (<DestinationIntel destination={planDestination} weather={destWeather} sonarData={sonarDest.data} sonarIsLive={sonarDest.isLive} sonarCitations={sonarDest.citations} events={destEvents} />)}

        {sortedTrips.length > 0 && sortedTrips[0].itinerary && (<View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.md }}><TripMapCard tripId={sortedTrips[0].id} destination={sortedTrips[0].destination} itineraryRaw={sortedTrips[0].itinerary} days={sortedTrips[0].days} /></View>)}

        <Text style={styles.sectionLabel}>{t('plan.sectionYourTrips')}</Text>
        {sortedTrips.map((trip, index) => (index === 0 ? <NextTripHero key={trip.id} trip={trip} onPress={() => handleTripPress(trip)} collaboratorCount={collabCounts[trip.id]} /> : <TripCard key={trip.id} trip={trip} onPress={() => handleTripPress(trip)} isLatest={false} collaboratorCount={collabCounts[trip.id]} />))}

        <View style={styles.flightsSectionHeader}><Text style={styles.sectionLabel}>{t('plan.flights', { defaultValue: 'Flights' })}</Text><Text style={styles.flightsSectionSub}>{t('plan.flightsSub', { defaultValue: 'Deals and search' })}</Text></View>
        <GoNowFeed />
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/flights' as never); }} accessibilityLabel={t('plan.searchAllFlights', { defaultValue: 'Search all flights' })} accessibilityRole="button" style={({ pressed }) => [styles.searchFlightsBtn, { opacity: pressed ? 0.85 : 1 }]}><Plane size={16} color={COLORS.bg} strokeWidth={1.5} /><Text style={styles.searchFlightsBtnText}>{t('plan.searchAllFlights', { defaultValue: 'Search all flights' })}</Text><ChevronRight size={16} color={COLORS.bg} strokeWidth={1.5} /></Pressable>
      </ScrollView>

      {isGenerating && (<View style={styles.loaderOverlay}><TripGeneratingLoader destination={generatingDestRef.current} statusOverride={streamingProgress} /></View>)}
      <RateLimitModal visible={rateLimitVisible} onUpgrade={handleUpgrade} onDismiss={() => setRateLimitVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle, fill: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 } as ViewStyle, header: { paddingTop: 24, paddingBottom: 20 } as ViewStyle,
  headerTitle: { fontFamily: FONTS.header, fontSize: 36, color: COLORS.cream, letterSpacing: -0.5 } as TextStyle,
  headerSub: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamDim, marginTop: 6, letterSpacing: 0.5 } as TextStyle,
  newTripBtn: { marginBottom: SPACING.lg, borderRadius: RADIUS.pill, overflow: 'hidden' } as ViewStyle,
  newTripGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.pill } as ViewStyle,
  newTripText: { fontFamily: FONTS.header, fontSize: 18, color: COLORS.bg } as TextStyle,
  sectionLabel: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream, letterSpacing: -0.3, marginBottom: SPACING.md } as TextStyle,
  flightsSectionHeader: { marginTop: SPACING.xxl, marginBottom: 0 } as ViewStyle,
  flightsSectionSub: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamDim, letterSpacing: 0.5, marginTop: 2, marginBottom: SPACING.md } as TextStyle,
  searchFlightsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.action, borderRadius: RADIUS.pill, paddingVertical: 14, paddingHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.lg } as ViewStyle,
  searchFlightsBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.bg, flex: 1, textAlign: 'center' } as TextStyle,
  backToTrips: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, minHeight: 44, justifyContent: 'center' } as ViewStyle,
  backToTripsText: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.sage } as TextStyle,
  continueSection: { marginTop: SPACING.xl, paddingHorizontal: SPACING.lg } as ViewStyle,
  continueSectionLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamDim, marginBottom: SPACING.sm } as TextStyle,
  continueCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.goldBorder, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, marginBottom: SPACING.sm } as ViewStyle,
  continueCardDest: { flex: 1, fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.cream } as TextStyle,
  continueCardDate: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamDim, marginRight: SPACING.sm } as TextStyle, continueCardArrow: {} as ViewStyle,
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.coralSubtle, borderLeftWidth: 4, borderLeftColor: COLORS.coral, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginHorizontal: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.sm, borderRadius: RADIUS.md } as ViewStyle,
  errorBannerText: { flex: 1, fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream } as TextStyle, errorBannerRetry: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.coral } as TextStyle,
  errorBannerDismissBtn: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' } as ViewStyle, loaderOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: COLORS.bg } as ViewStyle,
});
