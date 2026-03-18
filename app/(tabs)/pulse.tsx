// =============================================================================
// ROAM — Pulse Tab (Clean Spatial Layout)
// Time-aware recommendations, hyper-local tips, and seasonal intelligence.
// Full visual reset — editorial, photo-driven, no filled card backgrounds.
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
import { Clock, MapPin, ChevronRight, Users, GitCompare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';
import { getTimezoneByDestination } from '../../lib/timezone';
import LiveFeedTicker from '../../components/features/LiveFeedTicker';
import SocialProofBanner from '../../components/features/SocialProofBanner';
import GoNowFeed from '../../components/features/GoNowFeed';
import WanderlustFeed from '../../components/features/WanderlustFeed';
import { useSonarQuery } from '../../lib/sonar';
import LiveBadge from '../../components/ui/LiveBadge';
import SourceCitation from '../../components/ui/SourceCitation';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import { searchEvents, type EventResult } from '../../lib/apis/eventbrite';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { searchActivities, type GYGActivity } from '../../lib/apis/getyourguide';
import { searchPlaces, getPlaceTips, type FSQPlace, type FSQTip } from '../../lib/apis/foursquare';
import { getDestinationCoords, getAirQuality, type AirQuality } from '../../lib/air-quality';
import { getSunTimes, type SunTimes } from '../../lib/sun-times';
import { getGoldenHour, type GoldenHourData } from '../../lib/golden-hour';

// Extracted sub-modules
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
  DestinationCard,
  EditorialCard,
  LocalTipRow,
  SeasonalHeroCard,
  SeasonalSmallCard,
  LiveEventCard,
} from '../../components/pulse/PulseCards';
import { styles } from '../../components/pulse/pulse-styles';

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PulseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const [selectedKey, setSelectedKey] = useState<string>(PULSE_DESTINATIONS[0].key);

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
        {/* Destination Photo Card Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destCardRow} style={styles.destCardScroll}>
          {PULSE_DESTINATIONS.map((dest, index) => (
            <DestinationCard key={dest.key} dest={dest} active={dest.key === selectedKey} onPress={() => handleSelectDest(dest.key)} index={index} />
          ))}
        </ScrollView>

        {/* Compare pill */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg, alignItems: 'flex-start' }}>
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

        {/* Live Feed Ticker */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}><LiveFeedTicker /></View>

        {/* Social Proof Banner */}
        {trips.length > 0 && <SocialProofBanner destination={trips[0].destination} />}

        {/* I Am Here Now */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/i-am-here-now' as never); }} style={({ pressed }) => [styles.hereNowBtn, { opacity: pressed ? 0.85 : 1 }]} accessibilityLabel={t('pulse.iAmHereNow', { defaultValue: 'I Am Here Now' })} accessibilityRole="button">
              <MapPin size={20} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.hereNowBtnText}>{t('pulse.iAmHereNow', { defaultValue: 'I Am Here Now' })}</Text>
            </Pressable>
          </View>
        )}

        {/* Check In */}
        {trips.length > 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/nearby-travelers' as never); }} style={({ pressed }) => [styles.checkInFloatBtn, { opacity: pressed ? 0.85 : 1 }]} accessibilityLabel={t('pulse.checkIn', { defaultValue: 'Check in' })} accessibilityRole="button">
              <Users size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.checkInFloatBtnText}>{t('pulse.checkIn', { defaultValue: 'Check in' })}</Text>
              <Text style={styles.checkInFloatBtnSub}>{t('pulse.checkInSub', { defaultValue: 'Meet travelers nearby' })}</Text>
            </Pressable>
          </View>
        )}

        {/* No-trip CTA */}
        {trips.length === 0 && (
          <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/plan' as never); }} style={({ pressed }) => [styles.noTripCtaCard, { opacity: pressed ? 0.85 : 1 }]} accessibilityLabel={t('pulse.noTripCta', { defaultValue: 'Plan a trip to unlock live features' })} accessibilityRole="button">
              <MapPin size={20} color={COLORS.sage} strokeWidth={1.5} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.noTripCtaText}>{t('pulse.noTripCta', { defaultValue: 'Plan a trip to unlock live features' })}</Text>
                <Text style={styles.noTripCtaSub}>{t('pulse.noTripCtaSub', { defaultValue: 'Check in, meet travelers, and go live when you arrive' })}</Text>
              </View>
              <ChevronRight size={18} color={COLORS.muted} strokeWidth={1.5} />
            </Pressable>
          </View>
        )}

        {/* Right Now Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never); }} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.xs }]}>
              <Text style={styles.sectionHeading}>{t('pulse.rightNowIn', { defaultValue: 'Right now in' })}{'\n'}{selectedDest.label}</Text>
              <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} style={{ marginBottom: 4 }} />
            </Pressable>
            {(sonarPulse.data?.isLive ?? sonarPulse.isLive) && <LiveBadge />}
          </View>
          {localTimeString ? <Text style={styles.sectionSubMono}>{localTimeString}</Text> : null}

          {/* Right now data pills */}
          {(rightNowAQ || rightNowSun || rightNowGolden) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }} contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.xs }}>
              {rightNowAQ && (
                <View style={[styles.rightNowPill, rightNowAQ.aqi > 100 && styles.rightNowPillAlert]}>
                  <Text style={[styles.rightNowPillText, rightNowAQ.aqi > 100 && { color: COLORS.coral }]}>{t('pulse.airQuality', { defaultValue: 'Air' })} {rightNowAQ.label}</Text>
                </View>
              )}
              {rightNowSun && (
                <>
                  <View style={styles.rightNowPill}><Text style={styles.rightNowPillText}>{t('pulse.sunrise', { defaultValue: '☀ Rise' })} {rightNowSun.sunrise}</Text></View>
                  <View style={styles.rightNowPill}><Text style={styles.rightNowPillText}>{t('pulse.sunset', { defaultValue: '🌇 Set' })} {rightNowSun.sunset}</Text></View>
                </>
              )}
              {rightNowGolden && (
                <View style={styles.rightNowPill}><Text style={styles.rightNowPillText}>{t('pulse.goldenHour', { defaultValue: '📸' })} {rightNowGolden.eveningGoldenStart}</Text></View>
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
            <View style={styles.sonarCard}>
              <View style={styles.sonarCardTitleRow}>
                <Text style={styles.sonarCardTitle}>{t('pulse.rightNow', { defaultValue: 'Right now' })}</Text>
                {(sonarPulse.data.isLive ?? sonarPulse.isLive) && <LiveBadge />}
              </View>
              <Text style={styles.sonarAnswer}>{sonarPulse.data.answer}</Text>
              {sonarPulse.citations.length > 0 ? (<View style={{ marginTop: SPACING.sm }}><SourceCitation citations={sonarPulse.citations} /></View>) : null}
              {sonarPulse.data.timestamp ? (<Text style={styles.sonarTimestamp}>{t('sonar.updated', { defaultValue: 'Updated' })}{' '}{new Date(sonarPulse.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>) : null}
            </View>
          ) : null}

          {/* Time recs */}
          {timeRecs.length > 0 ? (
            <View style={styles.editorialStack}>
              {timeRecs.map((rec, i) => (<EditorialCard key={i} rec={rec} index={i} destinationLabel={selectedDest.label} />))}
            </View>
          ) : !sonarPulse.data && !sonarPulse.isLoading ? (
            <View style={styles.emptyState}>
              <Clock size={24} color={COLORS.creamDim} strokeWidth={1.5} />
              <Text style={styles.emptyText}>{t('pulse.emptyState', { defaultValue: `Nothing live for ${selectedDest.label} right now. Pick a destination above.`, destination: selectedDest.label })}</Text>
            </View>
          ) : null}
        </View>

        {/* What Locals Know */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.tipsLabel}>{t('pulse.localsOnly', { defaultValue: 'LOCALS ONLY' })}</Text>
              <Text style={styles.sectionHeading}>{t('pulse.whatTheyWontTellYou', { defaultValue: "What they won't tell you" })}</Text>
            </View>
            {sonarLocal.isLive && <LiveBadge />}
          </View>
          {sonarLocal.data ? (
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: selectedDest.label } } as never); }} style={({ pressed }) => [styles.sonarCard, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={styles.sonarAnswer}>{sonarLocal.data.answer}</Text>
              {sonarLocal.citations.length > 0 && (<View style={{ marginTop: SPACING.sm }}><SourceCitation citations={sonarLocal.citations} /></View>)}
            </Pressable>
          ) : null}
          <View style={styles.tipsStack}>
            {localTips.map((tip, i) => (<LocalTipRow key={i} tip={tip} destinationLabel={selectedDest.label} />))}
          </View>
        </View>

        {/* Go Now Flight Deals */}
        <GoNowFeed />

        {/* Wanderlust */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}><WanderlustFeed /></View>

        {/* This Month */}
        <View style={styles.section}>
          <Text style={styles.seasonLabel}>{t('pulse.thisMonth', { defaultValue: 'THIS MONTH' })}</Text>
          <Text style={styles.sectionHeading}>{t('pulse.worthGoingNow', { defaultValue: 'Worth going now' })}</Text>
          {heroEvent ? <SeasonalHeroCard event={heroEvent} /> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonalSmallRow} style={styles.seasonalSmallScroll}>
            {SEASONAL_SMALL_EVENTS.map((item, i) => (<SeasonalSmallCard key={i} item={item} index={i} />))}
          </ScrollView>
        </View>

        {/* Live Events (Eventbrite) */}
        {liveEvents && liveEvents.length > 0 ? (
          <View style={[styles.section, styles.sectionLast]}>
            <Text style={styles.liveEventsLabel}>{t('pulse.liveEvents.label', { defaultValue: 'LIVE EVENTS' })}</Text>
            <Text style={styles.sectionHeading}>{t('pulse.liveEvents.heading', { defaultValue: `Happening in ${selectedDest.label}`, destination: selectedDest.label })}</Text>
            <View style={styles.liveEventsStack}>{liveEvents.map((evt) => (<LiveEventCard key={evt.id} event={evt} />))}</View>
          </View>
        ) : null}

        {/* Foursquare trending venues */}
        {fsqPlaces && fsqPlaces.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.trendingVenues.label', { defaultValue: 'TRENDING VENUES' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.trendingVenues.heading', { defaultValue: `Popular in ${selectedDest.label}` })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fsqPlacesRow}>
              {fsqPlaces.map((place) => {
                const mapsUrl = place.location ? `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + selectedDest.label)}`;
                return (
                  <Pressable key={place.fsqId} style={styles.fsqPlaceCard} onPress={() => { Haptics.selectionAsync(); Linking.openURL(mapsUrl).catch(() => {}); }}>
                    {place.photoUrl ? (<Image source={{ uri: place.photoUrl }} style={styles.fsqPlacePhoto as ImageStyle} contentFit="cover" />) : (<View style={[styles.fsqPlacePhoto, styles.fsqPlacePhotoFallback]}><MapPin size={24} color={COLORS.creamMuted} strokeWidth={1.5} /></View>)}
                    <LinearGradient colors={['transparent', COLORS.overlayDark]} style={styles.fsqPlaceGradient} />
                    <View style={styles.fsqPlaceBottom}>
                      <Text style={styles.fsqPlaceName} numberOfLines={2}>{place.name}</Text>
                      {place.category ? <Text style={styles.fsqPlaceCategory} numberOfLines={1}>{place.category}</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* TripAdvisor Trending */}
        {taAttractions && taAttractions.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.trending.label', { defaultValue: 'TRENDING' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.trending.heading', { defaultValue: `Worth your time in ${selectedDest.label}` })}</Text>
            <View style={styles.apiCardStack}>
              {taAttractions.map((loc) => (
                <Pressable key={loc.locationId} style={styles.apiCard} onPress={() => { Haptics.selectionAsync(); Linking.openURL(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(loc.name + ' ' + selectedDest.label)}`).catch(() => {}); }}>
                  <Text style={styles.apiCardName}>{loc.name}</Text>
                  {loc.rating != null && <Text style={styles.apiCardMeta}>{loc.rating} ★ · {loc.numReviews ?? 0} reviews</Text>}
                  {loc.address ? <Text style={styles.apiCardSub}>{loc.address}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* GetYourGuide Experiences */}
        {gygActivities && gygActivities.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.experiences.label', { defaultValue: 'EXPERIENCES' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.experiences.heading', { defaultValue: `Bookable in ${selectedDest.label}` })}</Text>
            <View style={styles.apiCardStack}>
              {gygActivities.map((act) => (
                <Pressable key={act.id} style={styles.apiCard} onPress={() => { Haptics.selectionAsync(); if (act.bookingUrl) Linking.openURL(act.bookingUrl); }}>
                  <Text style={styles.apiCardName}>{act.name}</Text>
                  {act.price != null && <Text style={styles.apiCardMeta}>From {act.currency ?? '$'} {act.price}</Text>}
                  {act.rating != null && <Text style={styles.apiCardSub}>{act.rating} ★ · {act.duration ?? ''}</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Foursquare Insider Tips */}
        {fsqTips && fsqTips.length > 0 && (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>{t('pulse.insider.label', { defaultValue: 'INSIDER' })}</Text>
            <Text style={styles.apiSectionHeading}>{t('pulse.insider.heading', { defaultValue: 'Local tips' })}</Text>
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

        {/* Local Eats Radar nav */}
        <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
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
