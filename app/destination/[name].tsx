// =============================================================================
// ROAM — Living Destination Page (Information Hub)
// Full-bleed hero + weather + Sonar intel + routes + costs + safety + visa
// + attractions + restaurants + plan CTA
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import * as Haptics from '../../lib/haptics';
import { COLORS, DESTINATION_HERO_PHOTOS, DESTINATIONS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { useSonarQuery } from '../../lib/sonar';
import { getCurrentWeather, type CurrentWeather } from '../../lib/apis/openweather';
import { searchPlaces, type FSQPlace } from '../../lib/apis/foursquare';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { getRoutes, type RouteResult } from '../../lib/apis/rome2rio';
import { getCostOfLiving, type CostOfLiving } from '../../lib/cost-of-living';
import { getTravelAdvisory, type TravelAdvisory } from '../../lib/travel-safety';
import { getVisaRequirements, type VisaResult } from '../../lib/apis/sherpa';
import { getTimezoneByDestination } from '../../lib/timezone';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import LiveBadge from '../../components/ui/LiveBadge';
import SourceCitation from '../../components/ui/SourceCitation';

import {
  AttractionsSection,
  CostSection,
  PlanTripSection,
  RestaurantsSection,
  RightNowSection,
  RoutesSection,
  SafetySection,
  SectionHeader,
  Skeleton,
  VisaSection,
} from './_components';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getHeroUrl(destination: string): string {
  const exact = DESTINATION_HERO_PHOTOS[destination];
  if (exact) return exact;
  const slug = encodeURIComponent(destination.replace(/\s+/g, '+'));
  return `https://source.unsplash.com/800x600/?${slug},travel,city`;
}

// ---------------------------------------------------------------------------
// Event card (Sonar intel)
// ---------------------------------------------------------------------------
function EventCard({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean);
  return (
    <View style={s.card}>
      <Text style={s.cardHeadline} numberOfLines={2}>{lines[0] ?? text}</Text>
      {lines.length > 1 && (
        <Text style={s.cardDetail} numberOfLines={2}>{lines.slice(1).join(' ')}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function LivingDestinationPage(): React.JSX.Element {
  const { name } = useLocalSearchParams<{ name: string }>();
  const destination = name ?? '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const setPlanWizard = useAppStore((st) => st.setPlanWizard);
  const setGenerateMode = useAppStore((st) => st.setGenerateMode);

  const destInfo = useMemo(
    () => DESTINATIONS.find((d) => d.label.toLowerCase() === destination.toLowerCase()),
    [destination],
  );
  const heroUrl = useMemo(() => getHeroUrl(destination), [destination]);

  // -----------------------------------------------------------------------
  // 2. Right now — Weather & time
  // -----------------------------------------------------------------------
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [localTime, setLocalTime] = useState<string | null>(null);
  useEffect(() => {
    getCurrentWeather(destination)
      .then((w) => { if (w) setWeather(w); })
      .catch(() => {});
    const tz = getTimezoneByDestination(destination);
    if (tz) {
      setLocalTime(
        new Date().toLocaleTimeString('en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      );
    }
  }, [destination]);

  // -----------------------------------------------------------------------
  // 3. This week — Sonar pulse intel
  // -----------------------------------------------------------------------
  const {
    data: pulseData,
    isLoading: pulseLoading,
    citations: pulseCitations,
  } = useSonarQuery(destination || undefined, 'pulse');

  // -----------------------------------------------------------------------
  // 4. How to get there — Rome2Rio routes
  // -----------------------------------------------------------------------
  const [routes, setRoutes] = useState<RouteResult[] | null>(null);
  const [routesLoading, setRoutesLoading] = useState(true);
  useEffect(() => {
    setRoutesLoading(true);
    // Use "My Location" as fallback origin; Rome2Rio resolves it
    getRoutes('New York', destination)
      .then((r) => setRoutes(r))
      .catch(() => setRoutes(null))
      .finally(() => setRoutesLoading(false));
  }, [destination]);

  // -----------------------------------------------------------------------
  // 5. What it costs — Cost of living (synchronous, offline data)
  // -----------------------------------------------------------------------
  const costData = useMemo<CostOfLiving | null>(
    () => getCostOfLiving(destination),
    [destination],
  );

  // -----------------------------------------------------------------------
  // 6. Safety — Travel advisory
  // -----------------------------------------------------------------------
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(true);
  useEffect(() => {
    if (!destInfo) { setAdvisoryLoading(false); return; }
    setAdvisoryLoading(true);
    getTravelAdvisory(destInfo.country)
      .then((a) => setAdvisory(a))
      .catch(() => setAdvisory(null))
      .finally(() => setAdvisoryLoading(false));
  }, [destInfo]);

  // -----------------------------------------------------------------------
  // 7. Visa — Sherpa visa requirements
  // -----------------------------------------------------------------------
  const [visa, setVisa] = useState<VisaResult | null>(null);
  const [visaLoading, setVisaLoading] = useState(true);
  useEffect(() => {
    if (!destInfo) { setVisaLoading(false); return; }
    setVisaLoading(true);
    getVisaRequirements('US', destInfo.country)
      .then((v) => setVisa(v))
      .catch(() => setVisa(null))
      .finally(() => setVisaLoading(false));
  }, [destInfo]);

  // -----------------------------------------------------------------------
  // 8. Things to do — TripAdvisor attractions
  // -----------------------------------------------------------------------
  const [attractions, setAttractions] = useState<TALocation[] | null>(null);
  const [attractionsLoading, setAttractionsLoading] = useState(true);
  useEffect(() => {
    setAttractionsLoading(true);
    searchLocations(destination, 'attractions')
      .then((l) => setAttractions(l ? l.slice(0, 5) : null))
      .catch(() => setAttractions(null))
      .finally(() => setAttractionsLoading(false));
  }, [destination]);

  // -----------------------------------------------------------------------
  // 9. Where to eat — Foursquare restaurants
  // -----------------------------------------------------------------------
  const [venues, setVenues] = useState<FSQPlace[] | null>(null);
  const [venuesLoading, setVenuesLoading] = useState(true);
  useEffect(() => {
    if (!destInfo) { setVenuesLoading(false); return; }
    setVenuesLoading(true);
    searchPlaces(destination, destInfo.lat, destInfo.lng)
      .then((p) => setVenues(p ? p.slice(0, 6) : null))
      .catch(() => setVenues(null))
      .finally(() => setVenuesLoading(false));
  }, [destination, destInfo]);

  // -----------------------------------------------------------------------
  // ROAMers count
  // -----------------------------------------------------------------------
  const [planningCount, setPlanningCount] = useState<number | null>(null);
  useEffect(() => {
    const from = new Date();
    from.setDate(1);
    void (async () => {
      try {
        const { count } = await supabase
          .from('trips')
          .select('id', { count: 'exact', head: true })
          .ilike('destination', destination)
          .gte('created_at', from.toISOString());
        if (count !== null) setPlanningCount(count);
      } catch {
        /* non-fatal */
      }
    })();
  }, [destination]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleQuickTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPlanWizard({ destination });
    setGenerateMode('quick');
    router.push('/(tabs)/plan');
  }, [destination, setPlanWizard, setGenerateMode, router]);

  const handlePlanTogether = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPlanWizard({ destination });
    setGenerateMode('conversation');
    router.push('/craft-session');
  }, [destination, setPlanWizard, setGenerateMode, router]);

  // Hero "right now" summary
  const rightNowSummary = useMemo(() => {
    const parts: string[] = [];
    if (localTime) parts.push(localTime);
    if (weather) parts.push(`${weather.temp}°`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [localTime, weather]);

  // Sonar pulse items
  const pulseItems = useMemo(() => {
    if (!pulseData?.answer) return [];
    return pulseData.answer
      .split(/\n\n+/)
      .filter((seg) => seg.trim().length > 10)
      .slice(0, 3);
  }, [pulseData]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <View style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO */}
        <View style={s.heroWrap}>
          <Image source={{ uri: heroUrl }} style={s.heroImg} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
            style={s.heroGrad}
          />
          <Pressable
            style={[s.backBtn, { top: insets.top + SPACING.sm }]}
            onPress={handleBack}
            hitSlop={8}
          >
            <ChevronLeft size={22} color={COLORS.white} strokeWidth={1.5} />
          </Pressable>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>{destination}</Text>
            {destInfo && (
              <View style={s.row}>
                <MapPin size={12} color={COLORS.creamDim} strokeWidth={1.5} />
                <Text style={[s.monoSmall, { marginLeft: 4, color: COLORS.creamDim, letterSpacing: 1 }]}>
                  {destInfo.country}
                </Text>
              </View>
            )}
            {rightNowSummary && (
              <Text style={s.heroRightNow}>
                {t('destination.rightNow', { defaultValue: 'Right now:' })} {rightNowSummary}
              </Text>
            )}
          </View>
        </View>

        {/* 2. RIGHT NOW */}
        <RightNowSection localTime={localTime} weather={weather} />

        {/* 3. THIS WEEK — Sonar pulse */}
        <View style={s.section}>
          <SectionHeader
            title={t('destination.thisWeek', {
              defaultValue: `This week in ${destination}`,
            })}
            badge={pulseData?.isLive ? <LiveBadge /> : undefined}
          />
          {pulseLoading ? (
            <>
              <Skeleton />
              <Skeleton />
            </>
          ) : pulseItems.length > 0 ? (
            pulseItems.map((item, i) => <EventCard key={i} text={item} />)
          ) : (
            <Text style={s.empty}>
              {t('destination.noPulse', { defaultValue: 'No intel available.' })}
            </Text>
          )}
          {pulseCitations.length > 0 && (
            <View style={{ marginTop: SPACING.sm }}>
              <SourceCitation citations={pulseCitations} max={3} />
            </View>
          )}
        </View>

        {/* 4. HOW TO GET THERE */}
        <RoutesSection routes={routes} loading={routesLoading} />

        {/* 5. WHAT IT COSTS */}
        <CostSection data={costData} />

        {/* 6. SAFETY */}
        <SafetySection advisory={advisory} loading={advisoryLoading} />

        {/* 7. VISA */}
        <VisaSection visa={visa} loading={visaLoading} />

        {/* 8. THINGS TO DO */}
        <AttractionsSection attractions={attractions} loading={attractionsLoading} />

        {/* 9. WHERE TO EAT */}
        <RestaurantsSection venues={venues} loading={venuesLoading} />

        {/* 10. PLAN A TRIP HERE */}
        <PlanTripSection
          planningCount={planningCount}
          destination={destination}
          onQuickTrip={handleQuickTrip}
          onPlanTogether={handlePlanTogether}
        />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const HERO_H = 420;
const CARD_BASE = {
  backgroundColor: COLORS.surface1,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: RADIUS.md,
  padding: SPACING.md,
} as const;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  // Hero
  heroWrap: { width: '100%', height: HERO_H, position: 'relative' },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: HERO_H },
  heroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_H * 0.7 },
  backBtn: {
    position: 'absolute',
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { position: 'absolute', bottom: SPACING.xl, left: SPACING.lg, right: SPACING.lg },
  heroTitle: { fontFamily: FONTS.header, fontSize: 48, color: COLORS.white, lineHeight: 52, marginBottom: SPACING.xs },
  heroRightNow: { fontFamily: FONTS.mono, fontSize: 13, color: COLORS.creamBrightMuted, marginTop: SPACING.xs },
  // Sections
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl + SPACING.md },
  empty: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
  // Card
  card: { ...CARD_BASE, marginBottom: SPACING.sm },
  cardHeadline: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream, lineHeight: 20 },
  cardDetail: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 17 },
  // Mono labels
  monoSmall: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 0.3 },
});
