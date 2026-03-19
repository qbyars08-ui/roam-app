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
import SourceCitation from '../../components/ui/SourceCitation';
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
  const { t } = useTranslation();
  const score = safety?.safetyScore ?? null;
  const safetyLabel = score == null ? null : score > 70 ? t('prep.safeForTravelers', { defaultValue: 'Safe for travelers' }) : score >= 40 ? t('prep.useCaution', { defaultValue: 'Use caution' }) : t('prep.highRisk', { defaultValue: 'High risk' });
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.destination}>{countryName}</Text>
      {(localDateTime || tempC != null) && <Text style={headerStyles.meta}>{[localDateTime, tempC != null ? `${tempC}\u00B0C` : null].filter(Boolean).join(' \u00B7 ')}</Text>}
      {score != null && <Text style={headerStyles.safetyLine}>{t('prep.safetyScore', { defaultValue: 'Safety' })} {score} — {safetyLabel}</Text>}
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
        {!isConnected && <View style={styles.offlineBanner}><WifiOff size={14} color={COLORS.bg} /><Text style={styles.offlineText}>{t('prep.offlineBanner', { defaultValue: 'Everything you need, no signal required' })}</Text></View>}

        {selectedDest && sonarUrgent.data?.answer?.trim() && (
          <View style={styles.urgentBanner}>
            <Flame size={18} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.urgentBannerText} numberOfLines={2}>{(() => { const raw = sonarUrgent.data.answer.trim().replace(/^["']|["']$/g, ''); const first = raw.split(/[.!?]/)[0]?.trim(); return first ? `${first}.` : raw.slice(0, 120); })()}</Text>
            {sonarUrgent.data.isLive && <LiveBadge />}
          </View>
        )}

        {hasNoData ? (
          <View style={sharedStyles.noDataWrap}><Text style={sharedStyles.noDataTitle}>{t('prep.dataNotAvailable', { defaultValue: 'Data not available for this destination' })}</Text><Text style={sharedStyles.noDataText}>{`No intel for ${selectedDest} yet. Try a nearby major city.`}</Text></View>
        ) : (
          <>
            <EditorialHeader safety={safety} destination={selectedDest} countryName={countryName} />
            {entryRequirements && <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}><EntryRequirementsCard data={entryRequirements} /></View>}
            {weatherLoading ? <WeatherLoadingSkeleton /> : null}
            {currentWeather && !weatherLoading && <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}><CurrentWeatherCard data={currentWeather} updatedAt={weatherFetchedAt} /></View>}
            {weatherIntel && weatherIntel.days?.length > 0 && !weatherLoading ? <WeatherForecastDays weatherIntel={weatherIntel} /> : null}
            {weatherIntel && (weatherIntel.summary || (weatherIntel.packingAdvice?.length > 0)) && !weatherLoading ? <WeatherPackingAdvice weatherIntel={weatherIntel} /> : null}

            {(sonarPrep.data || sonarSafety.data) ? (
              <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg, gap: SPACING.md }}>
                {sonarPrep.data && (
                  <SonarCard
                    answer={sonarPrep.data.answer}
                    isLive={sonarPrep.isLive}
                    citations={sonarPrep.citations}
                    title={t('prep.currentConditions', { defaultValue: 'Current Conditions' })}
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
            ) : !sonarPrep.isLoading && !sonarSafety.isLoading ? (
              <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}>
                <SonarFallback label="Live conditions unavailable" />
              </View>
            ) : null}

            <PrepNavCards destination={selectedDest} activeTrip={activeTrip} />
            <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}><IAmHereNow destination={selectedDest} hotelName={parsedItinerary?.days?.[0]?.accommodation?.name ?? undefined} hotelAddress={undefined} /></View>
            <IntelligenceGrid destination={selectedDest} safety={safety} visaReqs={visaReqs} passportCode={passport} />
            <View style={{ paddingHorizontal: 20, marginBottom: 40 }}><AirQualitySunCard destination={selectedDest} /></View>
            <View style={{ paddingHorizontal: 20, marginTop: SPACING.lg, marginBottom: 40 }}><CostOfLivingCard destination={selectedDest} /></View>
            <View style={{ paddingHorizontal: 20, marginBottom: 40 }}><EmergencyQuickCard destination={selectedDest} /></View>
            <View style={{ paddingHorizontal: 20, marginBottom: 40 }}><CurrencyQuickCard destination={selectedDest} /></View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pillsContent}>
              {SECTIONS.map((s) => { const isActive = activeSection === s.id; return (<Pressable key={s.id} onPress={() => handleSectionChange(s.id)} style={[styles.pill, isActive && styles.pillActive]} accessibilityLabel={`${s.label} section${isActive ? ', selected' : ''}`} accessibilityRole="tab" accessibilityState={{ selected: isActive }}><Text style={[styles.pillText, isActive && styles.pillTextActive]}>{s.label}</Text></Pressable>); })}
            </ScrollView>

            {activeSection === 'schedule' && <ScheduleSection itinerary={parsedItinerary} />}
            {activeSection === 'overview' && safety && <SafetySection safety={safety} />}
            {activeSection === 'overview' && !safety && <View style={sharedStyles.tabContent}><Text style={sharedStyles.noDataText}>No overview data available for this destination.</Text></View>}
            {activeSection === 'packing' && <PackingSection destination={selectedDest} trip={activeTrip} itinerary={parsedItinerary} />}
            {activeSection === 'jetlag' && <JetLagSection destination={selectedDest} />}
            {activeSection === 'crowds' && <CrowdsSection destination={selectedDest} trip={activeTrip} />}
            {activeSection === 'emergency' && <EmergencySection emergency={emergency} destination={selectedDest} />}
            {activeSection === 'health' && safety && <HealthSection safety={safety} tapWaterFromCultural={tapWaterFromCultural} medicalGuide={medicalGuide} destination={selectedDest} />}
            {activeSection === 'health' && !safety && <View style={sharedStyles.tabContent}><View style={sharedStyles.noDataWrap}><Text style={sharedStyles.noDataTitle}>{t('prep.dataNotAvailable', { defaultValue: 'Data not available for this destination' })}</Text><Text style={sharedStyles.noDataText}>{`No intel for ${selectedDest} yet. Try a nearby major city.`}</Text></View></View>}
            {activeSection === 'language' && <LanguageSection langPack={langPack} destination={selectedDest} />}
            {activeSection === 'visa' && <VisaSection destination={selectedDest} passport={passport} visaReqs={visaReqs} geoCoords={geoCoords} />}
            {activeSection === 'currency' && <CurrencySection cultural={cultural} destination={selectedDest} />}
            {activeSection === 'connectivity' && <ConnectivitySection cultural={cultural} destination={selectedDest} />}
            {activeSection === 'culture' && <CultureSection cultural={cultural} destination={selectedDest} />}
          </>
        )}

        {!hasNoData && (
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/body-intel' as never); }} style={({ pressed }) => [sharedStyles.bodyIntelCta, { borderLeftColor: COLORS.sage, marginTop: SPACING.lg }, pressed && { opacity: 0.7 }]} accessibilityLabel="Open Health Intel" accessibilityRole="button">
            <Stethoscope size={20} color={COLORS.sage} />
            <View style={{ flex: 1 }}><Text style={[sharedStyles.bodyIntelCtaTitle, { color: COLORS.sage }]}>{t('prep.healthIntel', { defaultValue: 'Health Intel' })}</Text><Text style={sharedStyles.bodyIntelCtaSubtitle}>{t('prep.healthIntelDesc', { defaultValue: 'Destination health & body intel' })}</Text></View>
            <ChevronRight size={18} color={COLORS.creamMuted} />
          </Pressable>
        )}
        {!hasNoData && (
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({ pathname: '/offline-pack', params: { tripId: activeTrip?.id ?? activeTripId ?? '' } } as never); }} style={({ pressed }) => [sharedStyles.bodyIntelCta, { borderLeftColor: COLORS.sage, marginTop: SPACING.md }, pressed && { opacity: 0.7 }]} accessibilityLabel={`Download ${selectedDest} prep data for offline use`} accessibilityRole="button">
            <Download size={20} color={COLORS.sage} />
            <View style={{ flex: 1 }}><Text style={[sharedStyles.bodyIntelCtaTitle, { color: COLORS.sage }]}>{t('prep.downloadForOffline', { defaultValue: 'Download for Offline' })}</Text><Text style={sharedStyles.bodyIntelCtaSubtitle}>{`Save ${selectedDest} intel to your device — no WiFi needed later`}</Text></View>
            <ChevronRight size={18} color={COLORS.creamMuted} />
          </Pressable>
        )}
        {!hasNoData && (
          <View style={styles.destPickerWrap}>
            <Text style={styles.destPickerLabel}>{t('prep.destination', { defaultValue: 'DESTINATION' })}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destPickerScroll}>
              {popularDests.map((d) => { const isActive = selectedDest === d.label; return (<Pressable key={d.label} onPress={() => { Haptics.selectionAsync(); setSelectedDest(d.label); }} style={[styles.destChip, isActive && styles.destChipActive]} accessibilityLabel={`Select ${d.label}${isActive ? ', currently selected' : ''}`} accessibilityRole="button" accessibilityState={{ selected: isActive }}><Text style={[styles.destChipText, isActive && styles.destChipTextActive]}>{d.label}</Text></Pressable>); })}
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
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: SPACING.lg, gap: SPACING.sm } as ViewStyle,
  destination: { fontFamily: FONTS.header, fontSize: 38, letterSpacing: -1.2, color: COLORS.cream, lineHeight: 42 } as TextStyle,
  meta: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, letterSpacing: 1 } as TextStyle,
  safetyLine: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage, letterSpacing: 0.5 } as TextStyle,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: 0 } as ViewStyle,
  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.coral, padding: SPACING.sm, marginBottom: SPACING.md, borderRadius: RADIUS.sm } as ViewStyle,
  offlineText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.bg } as TextStyle,
  urgentBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm, backgroundColor: COLORS.sageSubtle, borderLeftWidth: 4, borderLeftColor: COLORS.sage, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, marginHorizontal: 20, marginBottom: SPACING.lg, borderRadius: RADIUS.md } as ViewStyle,
  urgentBannerText: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream, lineHeight: 22 } as TextStyle,
  pillsScroll: { marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.sageBorder } as ViewStyle,
  pillsContent: { flexDirection: 'row', paddingHorizontal: 20, gap: 0 } as ViewStyle,
  pill: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' } as ViewStyle,
  pillActive: { borderBottomColor: COLORS.sage } as ViewStyle,
  pillText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream } as TextStyle,
  pillTextActive: { color: COLORS.sage } as TextStyle,
  sonarCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md } as ViewStyle,
  sonarCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm } as ViewStyle,
  sonarCardTitle: { fontFamily: FONTS.headerMedium, fontSize: 16, color: COLORS.cream } as TextStyle,
  sonarCardBody: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream, lineHeight: 21 } as TextStyle,
  destPickerWrap: { marginTop: SPACING.lg, paddingHorizontal: 20 } as ViewStyle,
  destPickerLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage, letterSpacing: 1.5, marginBottom: SPACING.sm } as TextStyle,
  destPickerScroll: { flexDirection: 'row' } as ViewStyle,
  destChip: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: SPACING.xs } as ViewStyle,
  destChipActive: { borderBottomColor: COLORS.sage } as ViewStyle,
  destChipText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamSoft } as TextStyle,
  destChipTextActive: { color: COLORS.sage } as TextStyle,
  fallbackContainer: { paddingVertical: SPACING.md, alignItems: 'center' } as ViewStyle,
  fallbackText: { color: COLORS.muted, fontSize: 14, fontFamily: FONTS.body } as TextStyle,
});

export default PrepScreen;
