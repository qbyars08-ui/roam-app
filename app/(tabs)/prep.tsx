// =============================================================================
// ROAM — PREP Tab: Orchestrator
// Offline-first. Always fast. Always readable. Lifeline screen.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { WifiOff, Flame, Stethoscope, Download, ChevronRight } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../../lib/constants';
import { useAppStore, type Trip } from '../../lib/store';
import { getEmergencyForDestination } from '../../lib/prep/emergency-data';
import { getLanguagePackForDestination } from '../../lib/prep/language-data';
import { getSafetyForDestination } from '../../lib/prep/safety-data';
import { getCulturalGuideForDestination } from '../../lib/prep/cultural-data';
import { type PassportNationality } from '../../lib/visa-intel';
import { parseItinerary } from '../../lib/types/itinerary';
import { getMedicalGuideByDestination } from '../../lib/medical-abroad';
import { getTimezoneByDestination } from '../../lib/timezone';
import { geocodeCity } from '../../lib/geocoding';
import { getWeatherForecast } from '../../lib/weather-forecast';
import { useSonarQuery } from '../../lib/sonar';
import LiveBadge from '../../components/ui/LiveBadge';
import SonarCard, { SonarFallback } from '../../components/ui/SonarCard';
import { getEntryRequirements } from '../../lib/apis/sherpa';
import { getCurrentWeather, getWeatherIntel, type CurrentWeather, type WeatherIntel } from '../../lib/apis/openweather';
import { geocode, type GeoResult } from '../../lib/apis/mapbox';
import { getVisaRequirements, type VisaResult } from '../../lib/apis/sherpa';
import AirQualitySunCard from '../../components/prep/AirQualitySunCard';
import EmergencyQuickCard from '../../components/prep/EmergencyQuickCard';
import CurrencyQuickCard from '../../components/prep/CurrencyQuickCard';
import CostOfLivingCard from '../../components/prep/CostOfLivingCard';
import IAmHereNow from '../../components/prep/IAmHereNow';
import { type SectionId, SECTIONS, sharedStyles } from '../../components/prep/prep-shared';
import { EntryRequirementsCard, CurrentWeatherCard, WeatherLoadingSkeleton, WeatherForecastDays, WeatherPackingAdvice } from '../../components/prep/WeatherSection';
import ScheduleSection from '../../components/prep/ScheduleSection';
import SafetySection from '../../components/prep/SafetySection';
import EmergencySection from '../../components/prep/EmergencySection';
import VisaSection from '../../components/prep/VisaSection';
import CurrencySection from '../../components/prep/CurrencySection';
import LanguageSection from '../../components/prep/LanguageSection';
import HealthSection from '../../components/prep/HealthSection';
import ConnectivitySection from '../../components/prep/ConnectivitySection';
import CultureSection from '../../components/prep/CultureSection';
import PackingSection from '../../components/prep/PackingSection';
import JetLagSection from '../../components/prep/JetLagSection';
import CrowdsSection from '../../components/prep/CrowdsSection';
import PrepNavCards from '../../components/prep/PrepNavCards';
import IntelligenceGrid from '../../components/prep/IntelligenceGrid';
import FadeIn from '../../components/ui/FadeIn';

// ---------------------------------------------------------------------------
// Editorial Intelligence Header
// ---------------------------------------------------------------------------
function EditorialHeader({ safety, destination, countryName }: { safety: ReturnType<typeof getSafetyForDestination>; destination: string; countryName: string }) {
  const [localDateTime, setLocalDateTime] = useState<string | null>(null);
  const [tempC, setTempC] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const tz = getTimezoneByDestination(destination);
    if (tz) {
      try {
        const now = new Date();
        const dayName = now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long' });
        const timeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
        if (!cancelled) setLocalDateTime(`${dayName} ${timeStr}`);
      } catch { /* silent */ }
    }
    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (geo && !cancelled) {
          const forecast = await getWeatherForecast(geo.latitude, geo.longitude);
          if (forecast?.days?.[0] && !cancelled) setTempC(Math.round(forecast.days[0].tempMax));
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [destination]);

  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.destination}>{countryName}</Text>
      {(localDateTime || tempC != null) && (
        <Text style={headerStyles.meta}>
          {[localDateTime, tempC != null ? `${tempC}\u00B0C` : null].filter(Boolean).join(' \u00B7 ')}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function PrepScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected ?? true;
  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);
  const travelProfile = useAppStore((s) => s.travelProfile);
  const activeTrip: Trip | null = trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;
  const [selectedDest, setSelectedDest] = useState(activeTrip?.destination ?? DESTINATIONS[0]?.label ?? 'Tokyo');
  const [activeSection, setActiveSection] = useState<SectionId>('schedule');

  useEffect(() => { if (activeTrip) setSelectedDest(activeTrip.destination); }, [activeTrip?.destination]); // eslint-disable-line react-hooks/exhaustive-deps

  const emergency = getEmergencyForDestination(selectedDest);
  const safety = getSafetyForDestination(selectedDest);
  const langPack = getLanguagePackForDestination(selectedDest);
  const cultural = getCulturalGuideForDestination(selectedDest);
  const passport = (travelProfile.passportNationality ?? 'US') as PassportNationality;
  const tapWaterFromCultural = cultural?.waterSafety === 'tap_safe' ? true : cultural?.waterSafety === 'bottled_only' ? false : null;
  const medicalGuide = useMemo(() => getMedicalGuideByDestination(selectedDest), [selectedDest]);
  const parsedItinerary = useMemo(() => {
    const trip = trips.find((t) => t.destination === selectedDest) ?? activeTrip;
    if (!trip?.itinerary) return null;
    try { return parseItinerary(trip.itinerary); } catch { return null; }
  }, [trips, activeTrip, selectedDest]);

  const sonarUrgent = useSonarQuery(selectedDest, 'urgent');
  const sonarPrep = useSonarQuery(selectedDest, 'prep');
  const sonarSafety = useSonarQuery(selectedDest, 'safety');

  const [geoCoords, setGeoCoords] = useState<GeoResult | null>(null);
  const [visaReqs, setVisaReqs] = useState<VisaResult | null>(null);
  const [entryRequirements, setEntryRequirements] = useState<ReturnType<typeof getEntryRequirements> extends Promise<infer T> ? T | null : never>(null);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [weatherIntel, setWeatherIntel] = useState<WeatherIntel | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherFetchedAt, setWeatherFetchedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEntryRequirements(null); setCurrentWeather(null); setWeatherIntel(null); setWeatherLoading(true); setWeatherFetchedAt(null);
    const timeout = setTimeout(() => { if (!cancelled) setWeatherLoading(false); }, 5_000);
    Promise.all([getEntryRequirements(selectedDest), getCurrentWeather(selectedDest), getWeatherIntel(selectedDest)]).then(([entry, weather, intel]) => {
      clearTimeout(timeout); if (cancelled) return;
      if (entry) setEntryRequirements(entry); if (weather) setCurrentWeather(weather);
      if (intel) { setWeatherIntel(intel); setWeatherFetchedAt(Date.now()); }
      setWeatherLoading(false);
    }).catch(() => { clearTimeout(timeout); if (!cancelled) setWeatherLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDest]);

  useEffect(() => { if (!selectedDest) return; let c = false; geocode(selectedDest).then((r) => { if (!c) setGeoCoords(r); }); return () => { c = true; }; }, [selectedDest]);
  useEffect(() => { if (!selectedDest) return; let c = false; const p = (travelProfile.passportNationality ?? 'US') as string; getVisaRequirements(p, selectedDest).then((r) => { if (!c) setVisaReqs(r); }); return () => { c = true; }; }, [selectedDest, travelProfile.passportNationality]);

  const hasNoData = !emergency && !safety;
  const countryName = emergency?.country ?? safety?.country ?? selectedDest;
  const handleSectionChange = useCallback((id: SectionId) => { Haptics.selectionAsync(); setActiveSection(id); }, []);
  const popularDests = useMemo(() => [...DESTINATIONS].sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0)).slice(0, 12), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]} showsVerticalScrollIndicator={false}>
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <WifiOff size={14} color={COLORS.bg} />
            <Text style={styles.offlineText}>{t('prep.offlineBanner', { defaultValue: 'Everything you need, no signal required' })}</Text>
          </View>
        )}

        {selectedDest && sonarUrgent.data?.answer?.trim() && (
          <View style={styles.urgentBanner}>
            <Flame size={18} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.urgentBannerText} numberOfLines={2}>
              {(() => { const raw = sonarUrgent.data.answer.trim().replace(/^["']|["']$/g, ''); const first = raw.split(/[.!?]/)[0]?.trim(); return first ? `${first}.` : raw.slice(0, 120); })()}
            </Text>
            {sonarUrgent.data.isLive && <LiveBadge />}
          </View>
        )}

        {/* Nudge: plan a trip to get personalized prep */}
        {!activeTrip && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/(tabs)/plan' as never); }}
            accessibilityLabel={t('prep.planTripCta', { defaultValue: 'Plan a trip for personalized prep' })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.planNudge, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.planNudgeIcon}>
              <Flame size={20} color={COLORS.sage} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planNudgeTitle}>{t('prep.planTripTitle', { defaultValue: 'Build a trip for personalized prep' })}</Text>
              <Text style={styles.planNudgeSub}>{t('prep.planTripSub', { defaultValue: 'Browsing general intel below. Plan a trip for tailored checklists.' })}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} />
          </Pressable>
        )}

        {hasNoData ? (
          <View style={sharedStyles.noDataWrap}>
            <Text style={sharedStyles.noDataTitle}>{t('prep.dataNotAvailable', { defaultValue: 'We don\u2019t have intel for this destination yet' })}</Text>
            <Text style={sharedStyles.noDataText}>{t('prep.tryNearbyCity', { defaultValue: 'Try a nearby major city instead' })}</Text>
          </View>
        ) : (
          <>
            <EditorialHeader safety={safety} destination={selectedDest} countryName={countryName} />

            {/* Entry requirements */}
            {entryRequirements && (
              <View style={styles.sectionWrap}>
                <EntryRequirementsCard data={entryRequirements} />
              </View>
            )}

            {/* Weather */}
            {weatherLoading ? <WeatherLoadingSkeleton /> : null}
            {currentWeather && !weatherLoading && (
              <FadeIn duration={300}>
                <View style={styles.sectionWrap}>
                  <CurrentWeatherCard data={currentWeather} updatedAt={weatherFetchedAt} />
                </View>
              </FadeIn>
            )}
            {weatherIntel && weatherIntel.days?.length > 0 && !weatherLoading ? <FadeIn duration={300} delay={100}><WeatherForecastDays weatherIntel={weatherIntel} /></FadeIn> : null}
            {weatherIntel && (weatherIntel.summary || (weatherIntel.packingAdvice?.length > 0)) && !weatherLoading ? <FadeIn duration={300} delay={150}><WeatherPackingAdvice weatherIntel={weatherIntel} /></FadeIn> : null}

            {/* Sonar live intel — no "CURRENT CONDITIONS" header clutter */}
            {(sonarPrep.data || sonarSafety.data) ? (
              <FadeIn duration={300}>
              <View style={styles.sonarWrap}>
                {sonarPrep.data && (
                  <SonarCard
                    answer={sonarPrep.data.answer}
                    isLive={sonarPrep.isLive}
                    citations={sonarPrep.citations}
                    title={t('prep.latestIntel', { defaultValue: 'Latest Intel' })}
                    timestamp={sonarPrep.data.timestamp}
                  />
                )}
                {sonarSafety.data && (
                  <SonarCard
                    answer={sonarSafety.data.answer}
                    isLive={sonarSafety.isLive}
                    citations={sonarSafety.citations}
                    title={t('prep.safetyUpdate', { defaultValue: 'Safety Update' })}
                    timestamp={sonarSafety.data.timestamp}
                  />
                )}
              </View>
              </FadeIn>
            ) : !sonarPrep.isLoading && !sonarSafety.isLoading ? (
              <View style={styles.sectionWrap}>
                <SonarFallback label={t('prep.conditionsLater', { defaultValue: 'Conditions update when your trip gets closer' })} />
              </View>
            ) : null}

            {/* Intelligence grid (2x2) */}
            <IntelligenceGrid destination={selectedDest} safety={safety} visaReqs={visaReqs} passportCode={passport} />

            {/* Nav cards */}
            <PrepNavCards destination={selectedDest} activeTrip={activeTrip} />

            {/* I Am Here Now */}
            <View style={styles.sectionWrap}>
              <IAmHereNow destination={selectedDest} hotelName={parsedItinerary?.days?.[0]?.accommodation?.name ?? undefined} hotelAddress={undefined} />
            </View>

            {/* Quick cards */}
            <View style={styles.sectionWrap}><AirQualitySunCard destination={selectedDest} /></View>
            <View style={styles.sectionWrap}><CostOfLivingCard destination={selectedDest} /></View>
            <View style={styles.sectionWrap}><EmergencyQuickCard destination={selectedDest} /></View>
            <View style={styles.sectionWrap}><CurrencyQuickCard destination={selectedDest} /></View>

            {/* Pill tab bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pillsContent}>
              {SECTIONS.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => handleSectionChange(s.id)}
                    style={[styles.pill, isActive && styles.pillActive]}
                    accessibilityLabel={`${s.label} section${isActive ? ', selected' : ''}`}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Section content */}
            {activeSection === 'schedule' && <ScheduleSection itinerary={parsedItinerary} />}
            {activeSection === 'overview' && safety && <SafetySection safety={safety} />}
            {activeSection === 'overview' && !safety && <View style={sharedStyles.tabContent}><Text style={sharedStyles.noDataText}>{t('prep.noOverviewYet', { defaultValue: 'We don\u2019t have overview intel for this destination yet. Try a nearby major city.' })}</Text></View>}
            {activeSection === 'packing' && <PackingSection destination={selectedDest} trip={activeTrip} itinerary={parsedItinerary} />}
            {activeSection === 'jetlag' && <JetLagSection destination={selectedDest} />}
            {activeSection === 'crowds' && <CrowdsSection destination={selectedDest} trip={activeTrip} />}
            {activeSection === 'emergency' && <EmergencySection emergency={emergency} destination={selectedDest} />}
            {activeSection === 'health' && safety && <HealthSection safety={safety} tapWaterFromCultural={tapWaterFromCultural} medicalGuide={medicalGuide} destination={selectedDest} />}
            {activeSection === 'health' && !safety && <View style={sharedStyles.tabContent}><View style={sharedStyles.noDataWrap}><Text style={sharedStyles.noDataTitle}>{t('prep.dataNotAvailable', { defaultValue: 'We don\u2019t have intel for this destination yet' })}</Text><Text style={sharedStyles.noDataText}>{t('prep.tryNearbyCity', { defaultValue: 'Try a nearby major city instead' })}</Text></View></View>}
            {activeSection === 'language' && <LanguageSection langPack={langPack} destination={selectedDest} />}
            {activeSection === 'visa' && <VisaSection destination={selectedDest} passport={passport} visaReqs={visaReqs} geoCoords={geoCoords} />}
            {activeSection === 'currency' && <CurrencySection cultural={cultural} destination={selectedDest} />}
            {activeSection === 'connectivity' && <ConnectivitySection cultural={cultural} destination={selectedDest} />}
            {activeSection === 'culture' && <CultureSection cultural={cultural} destination={selectedDest} />}
          </>
        )}

        {/* Bottom CTAs */}
        {!hasNoData && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/body-intel' as never); }}
            style={({ pressed }) => [styles.bottomCta, pressed && { opacity: 0.7 }]}
            accessibilityLabel="Open Health Intel"
            accessibilityRole="button"
          >
            <Stethoscope size={20} color={COLORS.sage} strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bottomCtaTitle}>{t('prep.healthIntel', { defaultValue: 'Health Intel' })}</Text>
              <Text style={styles.bottomCtaSub}>{t('prep.healthIntelDesc', { defaultValue: 'Destination health & body intel' })}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>
        )}
        {!hasNoData && (
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: '/offline-pack', params: { tripId: activeTrip?.id ?? activeTripId ?? '' } } as never); }}
            style={({ pressed }) => [styles.bottomCta, { marginTop: SPACING.sm }, pressed && { opacity: 0.7 }]}
            accessibilityLabel={`Download ${selectedDest} prep data for offline use`}
            accessibilityRole="button"
          >
            <Download size={20} color={COLORS.sage} strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bottomCtaTitle}>{t('prep.downloadForOffline', { defaultValue: 'Download for Offline' })}</Text>
              <Text style={styles.bottomCtaSub}>{t('prep.saveOfflineSub', { defaultValue: `Save ${selectedDest} intel to your device \u2014 no WiFi needed later`, destination: selectedDest })}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>
        )}

        {/* Destination picker */}
        {!hasNoData && (
          <View style={styles.destPickerWrap}>
            <Text style={styles.destPickerLabel}>{t('prep.destination', { defaultValue: 'DESTINATION' })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destPickerScroll}>
              {popularDests.map((d) => {
                const isActive = selectedDest === d.label;
                return (
                  <Pressable
                    key={d.label}
                    onPress={() => { Haptics.selectionAsync(); setSelectedDest(d.label); }}
                    style={[styles.destChip, isActive && styles.destChipActive]}
                    accessibilityLabel={`Select ${d.label}${isActive ? ', currently selected' : ''}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[styles.destChipText, isActive && styles.destChipTextActive]}>{d.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const headerStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  } as ViewStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 38,
    letterSpacing: -1.2,
    color: COLORS.cream,
    lineHeight: 42,
  } as TextStyle,
  meta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginTop: SPACING.xs,
  } as TextStyle,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: 0 } as ViewStyle,

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.coral,
    padding: SPACING.sm,
    marginHorizontal: 20,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  offlineText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.bg,
  } as TextStyle,

  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageSubtle,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.sage,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  urgentBannerText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  planNudge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    gap: SPACING.md,
  } as ViewStyle,
  planNudgeIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  planNudgeTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  planNudgeSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: 2,
  } as TextStyle,

  // Consistent section wrapper: 20px horizontal, 24px bottom gap
  sectionWrap: {
    paddingHorizontal: 20,
    marginBottom: SPACING.lg,
  } as ViewStyle,

  sonarWrap: {
    paddingHorizontal: 20,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Pill tab bar — compact, sage fill on active
  pillsScroll: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  pillsContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: SPACING.sm,
  } as ViewStyle,
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  pillActive: {
    backgroundColor: COLORS.sageSoft,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  pillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,
  pillTextActive: {
    color: COLORS.sage,
    fontFamily: FONTS.bodyMedium,
  } as TextStyle,

  // Bottom CTAs
  bottomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: 20,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  bottomCtaTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  bottomCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Destination picker
  destPickerWrap: {
    marginTop: SPACING.xl,
    paddingHorizontal: 20,
  } as ViewStyle,
  destPickerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  destPickerScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  destChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  destChipActive: {
    backgroundColor: COLORS.sageSoft,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  destChipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,
  destChipTextActive: {
    color: COLORS.sage,
    fontFamily: FONTS.bodyMedium,
  } as TextStyle,
});

export default PrepScreen;
