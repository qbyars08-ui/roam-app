// =============================================================================
// ROAM — Pulse Tab (Premium Redesign)
// Visual, alive, scrollable — Instagram for travel.
// Pill chip selector, hero stat row, venue horizontal scroll, compact events.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  type ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Clock, Headphones, MapPin, ChevronRight, Users, GitCompare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';
import { getTimezoneByDestination } from '../../lib/timezone';
import GoNowFeed from '../../components/features/GoNowFeed';
import WanderlustFeed from '../../components/features/WanderlustFeed';
import { useSonarQuery } from '../../lib/sonar';
import LiveBadge from '../../components/ui/LiveBadge';
import SonarCard, { APIDataCard } from '../../components/ui/SonarCard';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import { searchEvents, type EventResult } from '../../lib/apis/eventbrite';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { searchActivities, type GYGActivity } from '../../lib/apis/getyourguide';
import { searchPlaces, getPlaceTips, type FSQPlace, type FSQTip } from '../../lib/apis/foursquare';
import { getDestinationCoords, getAirQuality, type AirQuality } from '../../lib/air-quality';
import { getSunTimes, type SunTimes } from '../../lib/sun-times';
import { getGoldenHour, type GoldenHourData } from '../../lib/golden-hour';
import { useTravelerDNA, getRecommendationLabel } from '../../lib/personalization-engine';

import {
  PULSE_DESTINATIONS,
  getCurrentTimeSlot,
  TIME_RECS,
  LOCAL_TIPS,
  DEFAULT_TIPS,
  SEASONAL_EVENTS,
  SEASONAL_SMALL_EVENTS,
  getLocalTimeString,
} from '../../components/pulse/pulse-data';
import {
  PulseDot,
  EditorialCard,
  LocalTipRow,
  SeasonalHeroCard,
  SeasonalSmallCard,
  LiveEventCard,
} from '../../components/pulse/PulseCards';
import { styles } from '../../components/pulse/pulse-styles';
import FadeIn from '../../components/ui/FadeIn';

// ---------------------------------------------------------------------------
// Destination Pill Chip
// ---------------------------------------------------------------------------
function DestPillChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select ${label}`}
      style={({ pressed }) => [{
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.pill,
        backgroundColor: active ? COLORS.sageLight : COLORS.surface2,
        opacity: pressed ? 0.8 : 1,
      }]}
    >
      <Text style={{
        fontFamily: FONTS.bodyMedium,
        fontSize: 14,
        color: active ? COLORS.cream : COLORS.muted,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PulseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const [selectedKey, setSelectedKey] = useState<string>(PULSE_DESTINATIONS[0].key);

  // Delayed fallback visibility — only show after 5s
  const [showFallbacks, setShowFallbacks] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowFallbacks(true), 5000);
    return () => clearTimeout(timer);
  }, [selectedKey]);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'pulse' });
  }, []);

  useEffect(() => {
    if (trips.length > 0) {
      const tripKey = trips[0].destination.toLowerCase().trim();
      const match = PULSE_DESTINATIONS.find((d) => d.key === tripKey);
      if (match) setSelectedKey(match.key);
    }
  }, [trips]);

  const selectedDest = useMemo(
    () => PULSE_DESTINATIONS.find((d) => d.key === selectedKey) ?? PULSE_DESTINATIONS[0],
    [selectedKey],
  );

  const timeSlot = useMemo(() => getCurrentTimeSlot(), []);
  const timeRecs = useMemo(() => TIME_RECS[selectedKey]?.[timeSlot] ?? [], [selectedKey, timeSlot]);
  const localTips = useMemo(() => (LOCAL_TIPS[selectedKey] ?? DEFAULT_TIPS).slice(0, 5), [selectedKey]);

  const { dna } = useTravelerDNA();
  const recLabel = useMemo(() => getRecommendationLabel(dna), [dna]);

  const sonarPulse = useSonarQuery(selectedDest.label, 'pulse');
  const sonarLocal = useSonarQuery(selectedDest.label, 'local');

  const localTimeString = useMemo(
    () => getLocalTimeString(selectedKey, getTimezoneByDestination),
    [selectedKey],
  );

  const heroEvent = useMemo(
    () => SEASONAL_EVENTS.find((e) => e.destination.toLowerCase() === selectedKey),
    [selectedKey],
  );

  // Live Eventbrite events
  const [liveEvents, setLiveEvents] = useState<EventResult[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLiveEvents(null);
    setShowFallbacks(false);
    searchEvents(selectedDest.label).then((results) => { if (!cancelled) setLiveEvents(results); });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // TripAdvisor trending attractions
  const [taAttractions, setTaAttractions] = useState<TALocation[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setTaAttractions(null);
    searchLocations(selectedDest.label, 'attractions').then((results) => {
      if (!cancelled) setTaAttractions(results?.slice(0, 5) ?? null);
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // GetYourGuide experiences
  const [gygActivities, setGygActivities] = useState<GYGActivity[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setGygActivities(null);
    searchActivities(selectedDest.label).then((results) => {
      if (!cancelled) setGygActivities(results?.slice(0, 5) ?? null);
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // Foursquare data
  const [fsqTips, setFsqTips] = useState<FSQTip[] | null>(null);
  const [fsqPlaces, setFsqPlaces] = useState<FSQPlace[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFsqTips(null);
    const coords = getDestinationCoords(selectedDest.label);
    if (!coords) return;
    searchPlaces(selectedDest.label, coords.lat, coords.lng).then(async (places) => {
      if (cancelled || !places?.length) return;
      const tips = await getPlaceTips(places[0].fsqId);
      if (!cancelled) setFsqTips(tips?.slice(0, 4) ?? null);
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  useEffect(() => {
    let cancelled = false;
    setFsqPlaces(null);
    const coords = getDestinationCoords(selectedDest.label);
    if (!coords) return;
    searchPlaces(selectedDest.label, coords.lat, coords.lng, undefined, 5000).then((places) => {
      if (!cancelled && places?.length) setFsqPlaces(places.slice(0, 6));
    });
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  // Right-now data
  const [rightNowAQ, setRightNowAQ] = useState<AirQuality | null>(null);
  const [rightNowSun, setRightNowSun] = useState<SunTimes | null>(null);
  const [rightNowGolden, setRightNowGolden] = useState<GoldenHourData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRightNowAQ(null); setRightNowSun(null); setRightNowGolden(null);
    const coords = getDestinationCoords(selectedDest.label);
    if (!coords) return;
    const { lat, lng } = coords;
    getAirQuality(lat, lng).then((aq) => { if (!cancelled) setRightNowAQ(aq); }).catch(() => {});
    getSunTimes(lat, lng).then((st) => { if (!cancelled) setRightNowSun(st); }).catch(() => {});
    getGoldenHour(lat, lng).then((gh) => { if (!cancelled) setRightNowGolden(gh); }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedDest.label]);

  const handleSelectDest = useCallback((key: string) => {
    Haptics.selectionAsync();
    setSelectedKey(key);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <PulseDot />
        <Text style={styles.headerLabel}>{t('pulse.live', { defaultValue: 'LIVE' })}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Destination Pill Chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destChipRow} style={styles.destChipScroll}>
          {PULSE_DESTINATIONS.map((dest) => (
            <DestPillChip
              key={dest.key}
              label={dest.label}
              active={dest.key === selectedKey}
              onPress={() => handleSelectDest(dest.key)}
            />
          ))}
        </ScrollView>

        {/* ── Hero Stat Row ── */}
        <View style={styles.heroStatRow}>
          {localTimeString ? (
            <>
              <Text style={styles.heroStatText}>{localTimeString}</Text>
              {rightNowAQ ? (
                <>
                  <Text style={styles.heroStatDot}>{'\u00B7'}</Text>
                  <Text style={styles.heroStatText}>{rightNowAQ.label}</Text>
                </>
              ) : null}
            </>
          ) : null}
        </View>

        {/* ── Compare pill ── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl, alignItems: 'flex-start' }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const dest = PULSE_DESTINATIONS.find((d) => d.key === selectedKey);
              router.push(dest ? `/compare?left=${encodeURIComponent(dest.label)}` as never : '/compare' as never);
            }}
            style={({ pressed }) => [styles.comparePill, { opacity: pressed ? 0.8 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t('pulse.compare', { defaultValue: 'Compare destinations' })}
          >
            <GitCompare size={14} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.comparePillText}>{t('pulse.compare', { defaultValue: 'Compare' })}</Text>
          </Pressable>
        </View>

        {/* ── I Am Here Now ── */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/i-am-here-now' as never); }} style={({ pressed }) => [styles.hereNowBtn, { opacity: pressed ? 0.85 : 1 }]} accessibilityLabel={t('pulse.iAmHereNow', { defaultValue: 'I Am Here Now' })} accessibilityRole="button">
              <MapPin size={20} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.hereNowBtnText}>{t('pulse.iAmHereNow', { defaultValue: 'I Am Here Now' })}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Live Guide ── */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/live-narrator' as never); }}
              style={({ pressed }) => [{
                flexDirection: 'row' as const,
                alignItems: 'center' as const,
                justifyContent: 'center' as const,
                gap: SPACING.sm,
                paddingVertical: 14,
                borderRadius: RADIUS.pill,
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: COLORS.sageBorder,
                opacity: pressed ? 0.85 : 1,
              }]}
              accessibilityLabel={t('pulse.liveGuide', { defaultValue: 'Live Guide' })}
              accessibilityRole="button"
            >
              <Headphones size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={{ fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.sage }}>{t('pulse.liveGuide', { defaultValue: 'Live Guide' })}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Check In ── */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/nearby-travelers' as never); }} style={({ pressed }) => [styles.checkInFloatBtn, { opacity: pressed ? 0.85 : 1 }]} accessibilityLabel={t('pulse.checkIn', { defaultValue: 'Check in' })} accessibilityRole="button">
              <Users size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.checkInFloatBtnText}>{t('pulse.checkIn', { defaultValue: 'Check in' })}</Text>
              <Text style={styles.checkInFloatBtnSub}>{t('pulse.checkInSub', { defaultValue: 'Meet travelers nearby' })}</Text>
            </Pressable>
          </View>
        )}

        {/* ── Neighborhoods ── */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const dest = trips[0]?.destination ?? '';
                router.push({ pathname: '/neighborhoods', params: { destination: dest } } as never);
              }}
              style={({ pressed }) => [styles.checkInFloatBtn, { opacity: pressed ? 0.85 : 1 }]}
              accessibilityLabel="Know the neighborhoods"
              accessibilityRole="button"
            >
              <MapPin size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.checkInFloatBtnText}>Know the neighborhoods</Text>
              <Text style={styles.checkInFloatBtnSub}>Vibes, safety, walkability</Text>
            </Pressable>
          </View>
        )}

        {/* ── No-trip CTA ── */}
        {trips.length === 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/plan' as never); }} style={({ pressed }) => [styles.noTripCtaCard, { opacity: pressed ? 0.85 : 1 }]} accessibilityLabel={t('pulse.noTripCta', { defaultValue: 'Plan a trip to unlock live features' })} accessibilityRole="button">
              <View style={{ width: 48, height: 48, borderRadius: RADIUS.xl, backgroundColor: COLORS.sageSubtle, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md }}>
                <MapPin size={24} color={COLORS.sage} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noTripCtaText}>{t('pulse.noTripCtaHeadline', { defaultValue: 'Your trip, live' })}</Text>
                <Text style={styles.noTripCtaSub}>{t('pulse.noTripCtaSub', { defaultValue: 'Plan a trip to unlock check-ins, live guides, and real-time intel for your destination' })}</Text>
              </View>
              <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
          </View>
        )}

        {/* ── Right Now Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never); }} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }]}>
              <Text style={styles.sectionHeading}>{t('pulse.rightNowIn', { defaultValue: 'Right now in' })} {selectedDest.label}</Text>
              <ChevronRight size={16} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
            {(sonarPulse.data?.isLive ?? sonarPulse.isLive) && <LiveBadge />}
          </View>

          {/* Right now data pills */}
          {(rightNowSun || rightNowGolden) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.md, marginBottom: SPACING.md }} contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.xs }}>
              {rightNowSun && (
                <>
                  <View style={styles.rightNowPill}><Text style={styles.rightNowPillText}>Rise {rightNowSun.sunrise}</Text></View>
                  <View style={styles.rightNowPill}><Text style={styles.rightNowPillText}>Set {rightNowSun.sunset}</Text></View>
                </>
              )}
              {rightNowGolden && (
                <View style={styles.rightNowPill}><Text style={styles.rightNowPillText}>Golden {rightNowGolden.eveningGoldenStart}</Text></View>
              )}
            </ScrollView>
          ) : null}

          {/* Sonar loading skeleton */}
          {(sonarPulse.isLoading && !sonarPulse.error) ? (
            <View style={styles.sonarSkeletonStack}>
              <View style={styles.sonarCard}>
                <SkeletonCard width="100%" height={16} borderRadius={RADIUS.sm} style={{ marginBottom: SPACING.sm }} />
                <SkeletonCard width="100%" height={60} borderRadius={RADIUS.sm} style={{ marginBottom: SPACING.sm }} />
                <SkeletonCard width={80} height={12} borderRadius={RADIUS.sm} />
              </View>
            </View>
          ) : null}

          {/* Live Sonar intel card */}
          {sonarPulse.data && !sonarPulse.isLoading ? (
            <FadeIn duration={300}>
              <View style={{ marginTop: SPACING.md }}>
                <SonarCard
                  answer={sonarPulse.data.answer}
                  isLive={sonarPulse.data.isLive ?? sonarPulse.isLive}
                  citations={sonarPulse.citations}
                  title={t('pulse.rightNow', { defaultValue: 'Right now' })}
                  timestamp={sonarPulse.data.timestamp}
                />
              </View>
            </FadeIn>
          ) : null}

          {/* Time recs */}
          {recLabel ? (
            <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.md, textTransform: 'uppercase' }}>{recLabel.text}</Text>
          ) : null}
          {timeRecs.length > 0 ? (
            <View style={styles.editorialStack}>
              {timeRecs.map((rec, i) => (<EditorialCard key={i} rec={rec} index={i} destinationLabel={selectedDest.label} />))}
            </View>
          ) : !sonarPulse.data && !sonarPulse.isLoading && showFallbacks ? (
            <View style={styles.emptyState}>
              <Clock size={24} color={COLORS.creamDim} strokeWidth={1.5} />
              <Text style={styles.emptyText}>{t('pulse.emptyState', { defaultValue: `Waiting for live updates from ${selectedDest.label}. Try another destination above or check back later.`, destination: selectedDest.label })}</Text>
            </View>
          ) : null}
        </View>

        {/* ── What Locals Know ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>{t('pulse.whatTheyWontTellYou', { defaultValue: "What they won't tell you" })}</Text>
            </View>
            {sonarLocal.isLive && <LiveBadge />}
          </View>
          {sonarLocal.data ? (
            <SonarCard
              answer={sonarLocal.data.answer}
              isLive={sonarLocal.isLive}
              citations={sonarLocal.citations}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never); }}
            />
          ) : null}
          <View style={styles.tipsStack}>
            {localTips.map((tip, i) => (<LocalTipRow key={i} tip={tip} destinationLabel={selectedDest.label} />))}
          </View>
        </View>

        {/* ── Go Now Flight Deals ── */}
        <GoNowFeed />

        {/* ── Wanderlust ── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}><WanderlustFeed /></View>

        {/* ── This Month ── */}
        <View style={styles.section}>
          <Text style={styles.seasonLabel}>{t('pulse.thisMonth', { defaultValue: 'THIS MONTH' })}</Text>
          <Text style={styles.sectionHeading}>{t('pulse.worthGoingNow', { defaultValue: 'Worth going now' })}</Text>
          {heroEvent ? <SeasonalHeroCard event={heroEvent} /> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonalSmallRow} style={styles.seasonalSmallScroll}>
            {SEASONAL_SMALL_EVENTS.map((item, i) => (<SeasonalSmallCard key={i} item={item} index={i} />))}
          </ScrollView>
        </View>

        {/* ── Live Events — compact list ── */}
        {liveEvents && liveEvents.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>{t('pulse.liveEvents.heading', { defaultValue: `Happening in ${selectedDest.label}`, destination: selectedDest.label })}</Text>
            <View style={{ marginTop: SPACING.sm }}>
              {liveEvents.map((evt) => (
                <Pressable
                  key={evt.id}
                  onPress={() => { Haptics.selectionAsync(); if (evt.url) Linking.openURL(evt.url).catch(() => {}); }}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.eventRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={styles.eventDatePill}>
                    <Text style={styles.eventDateText}>{evt.date ?? 'TBD'}</Text>
                  </View>
                  <Text style={styles.eventName} numberOfLines={1}>{evt.name}</Text>
                  <Text style={styles.eventArrow}>{'\u2192'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Venue Cards — horizontal scroll ── */}
        {fsqPlaces && fsqPlaces.length > 0 ? (
          <FadeIn duration={300} delay={100}>
          <View style={{ marginTop: SPACING.xl }}>
            <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
              <Text style={styles.sectionHeading}>{t('pulse.trendingVenues.heading', { defaultValue: `Popular in ${selectedDest.label}` })}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.venueScrollRow}>
              {fsqPlaces.map((place) => {
                const mapsUrl = place.location ? `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + selectedDest.label)}`;
                return (
                  <Pressable key={place.fsqId} style={styles.venueCard} onPress={() => { Haptics.selectionAsync(); Linking.openURL(mapsUrl).catch(() => {}); }}>
                    {place.photoUrl ? (<Image source={{ uri: place.photoUrl }} style={styles.venuePhoto as ImageStyle} contentFit="cover" />) : (<View style={[styles.venuePhoto, styles.venuePhotoFallback]}><MapPin size={24} color={COLORS.creamMuted} strokeWidth={1.5} /></View>)}
                    <LinearGradient colors={['transparent', COLORS.overlayDark]} style={styles.venueGradient} />
                    <View style={styles.venueBottom}>
                      <Text style={styles.venueName} numberOfLines={2}>{place.name}</Text>
                      {place.category ? <Text style={styles.venueRating} numberOfLines={1}>{place.category}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          </FadeIn>
        ) : null}

        {/* ── Worth Your Time (TripAdvisor) ── */}
        {taAttractions && taAttractions.length > 0 ? (
          <FadeIn duration={300} delay={150}>
          <View style={styles.apiSection}>
            <Text style={[styles.sectionHeading, { marginBottom: SPACING.md }]}>{t('pulse.trending.heading', { defaultValue: `Worth your time in ${selectedDest.label}` })}</Text>
            <View style={styles.apiCardStack}>
              {taAttractions.map((loc) => (
                <APIDataCard
                  key={loc.locationId}
                  name={loc.name}
                  rating={loc.rating ?? null}
                  reviewCount={loc.numReviews ?? null}
                  address={loc.address ?? null}
                  category={null}
                  onPress={() => { Haptics.selectionAsync(); Linking.openURL(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(loc.name + ' ' + selectedDest.label)}`).catch(() => {}); }}
                />
              ))}
            </View>
          </View>
          </FadeIn>
        ) : null}

        {/* ── Experiences (GetYourGuide) ── */}
        {gygActivities && gygActivities.length > 0 ? (
          <View style={styles.apiSection}>
            <Text style={[styles.sectionHeading, { marginBottom: SPACING.md }]}>{t('pulse.experiences.heading', { defaultValue: `Bookable in ${selectedDest.label}` })}</Text>
            <View style={styles.apiCardStack}>
              {gygActivities.map((act) => (
                <APIDataCard
                  key={act.id}
                  name={act.name}
                  rating={act.rating ?? null}
                  reviewCount={null}
                  address={act.duration ? `Duration: ${act.duration}` : null}
                  category={act.price != null ? `From ${act.currency ?? '$'}${act.price}` : null}
                  onPress={() => { Haptics.selectionAsync(); if (act.bookingUrl) Linking.openURL(act.bookingUrl); }}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Insider Tips (Foursquare) ── */}
        {fsqTips && fsqTips.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={[styles.sectionHeading, { marginBottom: SPACING.md }]}>{t('pulse.insider.heading', { defaultValue: 'Local tips' })}</Text>
            <View style={styles.apiCardStack}>
              {fsqTips.map((tip, i) => (
                <Pressable key={i} style={({ pressed }) => [styles.apiCard, { opacity: pressed ? 0.85 : 1 }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never); }}>
                  <Text style={styles.apiCardName}>{'\u201C'}{tip.text}{'\u201D'}</Text>
                  {tip.createdAt ? <Text style={styles.apiCardSub}>{new Date(tip.createdAt).toLocaleDateString()}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Local Eats Radar ── */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl, marginBottom: SPACING.lg }}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/local-eats', params: { destination: selectedDest.label } } as never); }} style={({ pressed }) => [styles.pulseNavCard, { opacity: pressed ? 0.85 : 1 }]} accessibilityLabel="Local Eats Radar" accessibilityRole="button">
            <View style={styles.pulseNavCardLeft}>
              <MapPin size={20} color={COLORS.sage} strokeWidth={1.5} />
              <View>
                <Text style={styles.pulseNavCardTitle}>{t('pulse.localEatsRadar', { defaultValue: 'Local Eats Radar' })}</Text>
                <Text style={styles.pulseNavCardSub}>{t('pulse.localEatsSub', { defaultValue: `Authentic spots locals eat in ${selectedDest.label}`, destination: selectedDest.label })}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.muted} strokeWidth={1.5} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
