// =============================================================================
// ROAM — Living Destination Page
// Full-bleed hero + live Sonar intel + Foursquare trending + TripAdvisor picks
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Star, Users, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, DESTINATION_HERO_PHOTOS, DESTINATIONS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { useSonarQuery } from '../../lib/sonar';
import { getCurrentWeather } from '../../lib/apis/openweather';
import { searchPlaces, type FSQPlace } from '../../lib/apis/foursquare';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { getTimezoneByDestination } from '../../lib/timezone';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import LiveBadge from '../../components/ui/LiveBadge';
import SourceCitation from '../../components/ui/SourceCitation';

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
// Sub-components
// ---------------------------------------------------------------------------
function SectionHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {badge}
    </View>
  );
}

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

function VenueCard({ place }: { place: FSQPlace }) {
  return (
    <View style={s.venueCard}>
      <Text style={s.cardHeadline} numberOfLines={1}>{place.name}</Text>
      <Text style={s.monoSmall}>{place.category}</Text>
      {place.rating !== null && (
        <View style={s.ratingRow}>
          <Star size={11} color={COLORS.gold} strokeWidth={1.5} fill={COLORS.gold} />
          <Text style={s.goldMono}>{place.rating.toFixed(1)}</Text>
        </View>
      )}
    </View>
  );
}

function AttractionCard({ location, rank }: { location: TALocation; rank: number }) {
  return (
    <View style={[s.card, s.row, { gap: SPACING.md, marginBottom: SPACING.sm }]}>
      <Text style={s.rankText}>{String(rank).padStart(2, '0')}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.cardHeadline} numberOfLines={1}>{location.name}</Text>
        <Text style={s.monoSmall}>{location.category}</Text>
        {location.rating !== null && (
          <View style={[s.ratingRow, { marginTop: 4 }]}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={10} strokeWidth={1.5}
                color={star <= Math.round(location.rating ?? 0) ? COLORS.gold : COLORS.muted}
                fill={star <= Math.round(location.rating ?? 0) ? COLORS.gold : 'transparent'} />
            ))}
            <Text style={[s.monoSmall, { marginLeft: 4 }]}>{location.numReviews.toLocaleString()}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Skeleton({ height = 80 }: { height?: number }) {
  return <View style={[s.skeleton, { height }]} />;
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
  const monthName = useMemo(() => new Date().toLocaleString('en-US', { month: 'long' }), []);

  // -- Weather & time
  const [weather, setWeather] = useState<{ temp: number } | null>(null);
  const [localTime, setLocalTime] = useState<string | null>(null);
  useEffect(() => {
    getCurrentWeather(destination)
      .then((w) => { if (w) setWeather({ temp: w.temp }); })
      .catch(() => {});
    const tz = getTimezoneByDestination(destination);
    if (tz) {
      setLocalTime(new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true }));
    }
  }, [destination]);

  // -- Sonar events
  const { data: eventsData, isLoading: eventsLoading, citations: eventsCitations } = useSonarQuery(destination || undefined, 'events');
  const eventItems = useMemo(() => {
    if (!eventsData?.answer) return [];
    return eventsData.answer.split(/\n\n+/).filter((s) => s.trim().length > 10).slice(0, 3);
  }, [eventsData]);

  // -- Sonar pulse
  const { data: pulseData, isLoading: pulseLoading, citations: pulseCitations } = useSonarQuery(destination || undefined, 'pulse');

  // -- Foursquare venues
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

  // -- TripAdvisor attractions
  const [attractions, setAttractions] = useState<TALocation[] | null>(null);
  const [attractionsLoading, setAttractionsLoading] = useState(true);
  useEffect(() => {
    setAttractionsLoading(true);
    searchLocations(destination, 'attractions')
      .then((l) => setAttractions(l ? l.slice(0, 5) : null))
      .catch(() => setAttractions(null))
      .finally(() => setAttractionsLoading(false));
  }, [destination]);

  // -- ROAMers count
  const [planningCount, setPlanningCount] = useState<number | null>(null);
  useEffect(() => {
    const from = new Date();
    from.setDate(1);
    void (async () => {
      try {
        const { count } = await supabase
          .from('trips').select('id', { count: 'exact', head: true })
          .ilike('destination', destination).gte('created_at', from.toISOString());
        if (count !== null) setPlanningCount(count);
      } catch { /* non-fatal */ }
    })();
  }, [destination]);

  // -- Handlers
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleQuickTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPlanWizard({ destination }); setGenerateMode('quick'); router.push('/(tabs)/plan');
  }, [destination, setPlanWizard, setGenerateMode, router]);

  const handlePlanTogether = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPlanWizard({ destination }); setGenerateMode('conversation'); router.push('/(tabs)/plan');
  }, [destination, setPlanWizard, setGenerateMode, router]);

  const rightNow = useMemo(() => {
    const parts: string[] = [];
    if (localTime) parts.push(localTime);
    if (weather) parts.push(`${weather.temp}°`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }, [localTime, weather]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={s.root}>
      <ScrollView style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xxxl }}
        showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <View style={s.heroWrap}>
          <Image source={{ uri: heroUrl }} style={s.heroImg} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
            style={s.heroGrad} />
          <Pressable style={[s.backBtn, { top: insets.top + SPACING.sm }]} onPress={handleBack} hitSlop={8}>
            <ChevronLeft size={22} color={COLORS.white} strokeWidth={1.5} />
          </Pressable>
          <View style={s.heroText}>
            <Text style={s.heroTitle}>{destination}</Text>
            {destInfo && (
              <View style={s.row}>
                <MapPin size={12} color={COLORS.creamDim} strokeWidth={1.5} />
                <Text style={[s.monoSmall, { marginLeft: 4, color: COLORS.creamDim, letterSpacing: 1 }]}>{destInfo.country}</Text>
              </View>
            )}
            {rightNow && (
              <Text style={s.heroRightNow}>
                {t('destination.rightNow', { defaultValue: 'Right now:' })} {rightNow}
              </Text>
            )}
          </View>
        </View>

        {/* THIS WEEK */}
        <View style={s.section}>
          <SectionHeader
            title={t('destination.thisWeek', { defaultValue: `This week in ${destination}`, destination })}
            badge={<LiveBadge />} />
          {eventsLoading ? <><Skeleton /><Skeleton /></> : eventItems.length > 0
            ? eventItems.map((item, i) => <EventCard key={i} text={item} />)
            : <Text style={s.empty}>{t('destination.noEvents', { defaultValue: 'No event data available.' })}</Text>}
          {eventsCitations.length > 0 && <View style={{ marginTop: SPACING.sm }}><SourceCitation citations={eventsCitations} max={3} /></View>}
        </View>

        {/* LOCALS RECOMMEND */}
        <View style={s.section}>
          <SectionHeader title={t('destination.localsRecommend', { defaultValue: 'Locals recommend right now' })} />
          {venuesLoading ? <><Skeleton /><Skeleton /></> : venues && venues.length > 0
            ? <View style={s.venueGrid}>{venues.map((v) => <VenueCard key={v.fsqId} place={v} />)}</View>
            : <Text style={s.empty}>{t('destination.noVenues', { defaultValue: 'No venue data available.' })}</Text>}
        </View>

        {/* HONEST TRUTH */}
        <View style={s.section}>
          <SectionHeader
            title={t('destination.honestTruth', { defaultValue: `The honest truth about ${destination} in ${monthName}`, destination, month: monthName })}
            badge={pulseData?.isLive ? <LiveBadge /> : undefined} />
          {pulseLoading ? <Skeleton height={120} /> : pulseData?.answer
            ? <View style={s.card}><Text style={s.pulseText}>{pulseData.answer}</Text></View>
            : <Text style={s.empty}>{t('destination.noPulse', { defaultValue: 'No pulse data available.' })}</Text>}
          {pulseCitations.length > 0 && <View style={{ marginTop: SPACING.sm }}><SourceCitation citations={pulseCitations} max={3} /></View>}
        </View>

        {/* TRAVELERS SAY */}
        <View style={s.section}>
          <SectionHeader title={t('destination.travelersSay', { defaultValue: 'What travelers say' })} />
          {attractionsLoading ? <><Skeleton /><Skeleton /><Skeleton /></> : attractions && attractions.length > 0
            ? attractions.map((a, i) => <AttractionCard key={a.locationId} location={a} rank={i + 1} />)
            : <Text style={s.empty}>{t('destination.noAttractions', { defaultValue: 'No attraction data available.' })}</Text>}
        </View>

        {/* PLAN A TRIP */}
        <View style={s.section}>
          <SectionHeader title={t('destination.planHere', { defaultValue: 'Plan a trip here' })} />
          {planningCount !== null && planningCount > 0 && (
            <View style={[s.row, { marginBottom: SPACING.md, gap: 6 }]}>
              <Users size={13} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={[s.monoSmall, { color: COLORS.sage }]}>
                {t('destination.roamersPlanning', { defaultValue: `${planningCount} ROAMers planning ${destination} this month`, count: planningCount, destination })}
              </Text>
            </View>
          )}
          <View style={s.ctaRow}>
            <Pressable style={({ pressed }) => [s.ctaSage, { transform: [{ scale: pressed ? 0.97 : 1 }] }]} onPress={handleQuickTrip}>
              <Zap size={16} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={s.ctaSageText}>{t('destination.quickTrip', { defaultValue: 'Quick Trip' })}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [s.ctaGold, { transform: [{ scale: pressed ? 0.97 : 1 }] }]} onPress={handlePlanTogether}>
              <Text style={s.ctaGoldText}>{t('destination.planTogether', { defaultValue: 'Plan Together' })}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const HERO_H = 420;
const CARD_BASE = { backgroundColor: COLORS.surface1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md } as const;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  // Hero
  heroWrap: { width: '100%', height: HERO_H, position: 'relative' },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: HERO_H },
  heroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_H * 0.7 },
  backBtn: { position: 'absolute', left: SPACING.md, width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: COLORS.overlayDark, alignItems: 'center', justifyContent: 'center' },
  heroText: { position: 'absolute', bottom: SPACING.xl, left: SPACING.lg, right: SPACING.lg },
  heroTitle: { fontFamily: FONTS.header, fontSize: 48, color: COLORS.white, lineHeight: 52, marginBottom: SPACING.xs },
  heroRightNow: { fontFamily: FONTS.mono, fontSize: 13, color: COLORS.creamBrightMuted, marginTop: SPACING.xs },
  // Sections
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl + SPACING.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  sectionTitle: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream, flex: 1, marginRight: SPACING.sm },
  empty: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, fontStyle: 'italic' },
  // Cards
  card: { ...CARD_BASE, marginBottom: SPACING.sm },
  cardHeadline: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream, lineHeight: 20 },
  cardDetail: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 17 },
  // Venue grid
  venueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  venueCard: { ...CARD_BASE, width: '47%' },
  // Shared type label
  monoSmall: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: SPACING.xs },
  goldMono: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold },
  // Pulse
  pulseText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamDim, lineHeight: 22 },
  // Attraction rank
  rankText: { fontFamily: FONTS.mono, fontSize: 22, color: COLORS.sageMuted, lineHeight: 26, minWidth: 28 },
  // Skeleton
  skeleton: { backgroundColor: COLORS.surface2, borderRadius: RADIUS.md, marginBottom: SPACING.sm, opacity: 0.5 },
  // CTA
  ctaRow: { flexDirection: 'row', gap: SPACING.sm },
  ctaSage: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, backgroundColor: COLORS.sage, borderRadius: RADIUS.pill, paddingVertical: SPACING.md },
  ctaSageText: { fontFamily: FONTS.header, fontSize: 16, color: COLORS.bg },
  ctaGold: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gold, borderRadius: RADIUS.pill, paddingVertical: SPACING.md },
  ctaGoldText: { fontFamily: FONTS.header, fontSize: 16, color: COLORS.bg },
});
