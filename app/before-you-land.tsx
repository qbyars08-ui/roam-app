// =============================================================================
// ROAM — Before You Land
// Pre-departure brief: everything a traveler needs to know in the last 24 hours
// before their flight. Pulls from all existing API modules.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import {
  ChevronDown,
  ChevronLeft,
  Clock,
  CloudRain,
  DollarSign,
  Heart,
  Plane,
  Shield,
  Users,
  CheckSquare,
  Square,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  AlertTriangle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { SkeletonCard } from '../components/premium/LoadingStates';
import { getTimezoneByDestination, getTimezoneInfo, getTimeDifference } from '../lib/timezone';
import { getExchangeRates } from '../lib/exchange-rates';
import type { ExchangeRateData } from '../lib/exchange-rates';
import { getWeatherForecast, getPackingSuggestions } from '../lib/weather-forecast';
import type { DailyForecast } from '../lib/weather-forecast';
import { geocodeCity } from '../lib/geocoding';
import { getMedicalGuideByDestination } from '../lib/medical-abroad';
import { getEmergencyForDestination } from '../lib/prep/emergency-data';
import { getCulturalGuideForDestination } from '../lib/prep/cultural-data';
import { getSafetyForDestination } from '../lib/prep/safety-data';
import { getEntryRequirements, type EntryRequirements } from '../lib/apis/sherpa';
import { getWeatherIntel, type WeatherIntel } from '../lib/apis/openweather';
import { useSonarQuery } from '../lib/sonar';
import LiveBadge from '../components/ui/LiveBadge';
import SourceCitation from '../components/ui/SourceCitation';
import type { TimezoneInfo } from '../lib/timezone';
import type { WeatherForecast } from '../lib/weather-forecast';

// =============================================================================
// Types
// =============================================================================
interface ChecklistEntry {
  id: string;
  label: string;
}

// =============================================================================
// Static data
// =============================================================================
const CHECKLIST_ITEMS: ChecklistEntry[] = [
  { id: 'passport', label: 'Passport (valid 6+ months)' },
  { id: 'insurance', label: 'Travel insurance docs' },
  { id: 'currency', label: 'Local currency / card ready' },
  { id: 'charger', label: 'Phone charger + adapter' },
  { id: 'meds', label: 'Medications + prescriptions' },
  { id: 'copies', label: 'Copies of documents (digital + paper)' },
];

// Checklist label keys for i18n lookup
const CHECKLIST_I18N_KEYS: Record<string, string> = {
  passport: 'beforeYouLand.checklist.passport',
  insurance: 'beforeYouLand.checklist.insurance',
  currency: 'beforeYouLand.checklist.currency',
  charger: 'beforeYouLand.checklist.charger',
  meds: 'beforeYouLand.checklist.meds',
  copies: 'beforeYouLand.checklist.copies',
};

// =============================================================================
// Collapsible Section Component
// =============================================================================
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rotation = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isOpen;
    setIsOpen(next);
    Animated.timing(rotation, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotation]);

  const rotateStyle = useMemo(
    () => ({
      transform: [
        {
          rotate: rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        },
      ],
    }),
    [rotation],
  );

  return (
    <View style={styles.sectionCard}>
      <Pressable onPress={toggle} style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Animated.View style={rotateStyle}>
          <ChevronDown size={20} color={COLORS.creamDim} strokeWidth={1.5} />
        </Animated.View>
      </Pressable>
      {isOpen ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================
function BeforeYouLandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { destination } = useLocalSearchParams<{ destination: string }>();
  const trips = useAppStore((s) => s.trips);

  // Async data state
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo | null>(null);
  const [exchangeData, setExchangeData] = useState<ExchangeRateData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [entryReqs, setEntryReqs] = useState<EntryRequirements | null>(null);
  const [liveWeather, setLiveWeather] = useState<WeatherIntel | null>(null);

  const destName = destination ?? 'your destination';

  // Sonar pre-departure intel
  const sonarPrep = useSonarQuery(destination || undefined, 'prep');

  // Synchronous data
  const medicalGuide = useMemo(() => getMedicalGuideByDestination(destName), [destName]);
  const emergencyData = useMemo(() => getEmergencyForDestination(destName), [destName]);
  const culturalGuide = useMemo(() => getCulturalGuideForDestination(destName), [destName]);
  const safetyData = useMemo(() => getSafetyForDestination(destName), [destName]);
  const timezoneId = useMemo(() => getTimezoneByDestination(destName), [destName]);

  // Fetch async data
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      const promises: Promise<void>[] = [];

      // Timezone info
      if (timezoneId) {
        promises.push(
          getTimezoneInfo(timezoneId).then((info) => {
            if (!cancelled && info) setTimezoneInfo(info);
          }),
        );
      }

      // Exchange rates
      promises.push(
        getExchangeRates('USD').then((data) => {
          if (!cancelled && data) setExchangeData(data);
        }),
      );

      // Geocode then weather
      promises.push(
        geocodeCity(destName).then(async (geo) => {
          if (!cancelled && geo) {
            const weather = await getWeatherForecast(geo.latitude, geo.longitude, 3);
            if (!cancelled && weather) setWeatherData(weather);
          }
        }),
      );

      // Sherpa entry requirements
      promises.push(
        getEntryRequirements(destName).then((reqs) => {
          if (!cancelled) setEntryReqs(reqs);
        }),
      );

      // OpenWeather live forecast
      promises.push(
        getWeatherIntel(destName).then((intel) => {
          if (!cancelled) setLiveWeather(intel);
        }),
      );

      try {
        await Promise.allSettled(promises);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [destName, timezoneId]);

  // Derived weather data
  const forecastDays = useMemo<DailyForecast[]>(
    () => weatherData?.days.slice(0, 3) ?? [],
    [weatherData],
  );

  const packSuggestions = useMemo(
    () => (weatherData ? getPackingSuggestions(weatherData) : []),
    [weatherData],
  );

  // Time difference string
  const timeDiffLabel = useMemo(() => {
    if (!timezoneInfo) return null;
    return getTimeDifference(timezoneInfo.utcOffset);
  }, [timezoneInfo]);

  // Currency info from cultural guide
  const currencyCode = useMemo(
    () => culturalGuide?.currency.code ?? null,
    [culturalGuide],
  );

  const exchangeRateLabel = useMemo(() => {
    if (!currencyCode || !exchangeData) return null;
    const rate = exchangeData.rates[currencyCode];
    if (rate == null) return null;
    return `1 USD = ${rate % 1 === 0 ? rate.toFixed(0) : rate.toFixed(2)} ${currencyCode}`;
  }, [currencyCode, exchangeData]);

  // Trip countdown
  const trip = useMemo(
    () => trips.find((t) => t.destination.toLowerCase() === destName.toLowerCase()),
    [trips, destName],
  );

  // Handlers
  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const toggleCheck = useCallback((id: string) => {
    void Haptics.selectionAsync();
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Color helpers
  const getSafetyColor = useCallback((score: number) => {
    if (score >= 80) return COLORS.sage;
    if (score >= 60) return COLORS.gold;
    return COLORS.coral;
  }, []);

  const getInsuranceColor = useCallback((level: string) => {
    if (level === 'critical') return COLORS.coral;
    if (level === 'recommended') return COLORS.gold;
    return COLORS.sage;
  }, []);

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Plane size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.title}>{t('beforeYouLand.title', { defaultValue: 'Before You Land' })}</Text>
          <Text style={styles.subtitle}>{destName}</Text>
          {trip ? (
            <Text style={styles.tripMeta}>
              {t('beforeYouLand.daysPlanned', { defaultValue: '{{count}} day planned', count: trip.days })}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <SkeletonCard height={48} style={{ marginBottom: SPACING.md }} />
        ) : null}

        {/* Sonar Pre-Departure Intel */}
        {sonarPrep.data ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Plane size={20} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.sectionTitle}>
                  {t('beforeYouLand.sections.sonarPrep', { defaultValue: 'Pre-Departure Intel' })}
                </Text>
                {sonarPrep.isLive ? <LiveBadge size="sm" /> : null}
              </View>
            </View>
            <View style={styles.sectionBody}>
              <Text style={styles.dataValue}>{sonarPrep.data.answer}</Text>
              {sonarPrep.citations.length > 0 ? (
                <View style={{ marginTop: SPACING.sm }}>
                  <SourceCitation citations={sonarPrep.citations} />
                </View>
              ) : null}
            </View>
          </View>
        ) : sonarPrep.isLoading && !sonarPrep.error ? (
          <SkeletonCard height={80} style={{ marginBottom: SPACING.md }} />
        ) : null}

        {/* 1. Time Zone Intel */}
        <CollapsibleSection
          title={t('beforeYouLand.sections.timezone', { defaultValue: 'Time Zone Intel' })}
          icon={<Clock size={20} color={COLORS.sage} strokeWidth={1.5} />}
          defaultOpen
        >
          {timezoneInfo ? (
            <>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.localTime', { defaultValue: 'Local time at destination' })}</Text>
                <Text style={styles.dataValueMono}>{timezoneInfo.currentTime}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.timezone', { defaultValue: 'Timezone' })}</Text>
                <Text style={styles.dataValueMono}>
                  {timezoneInfo.abbreviation} ({timezoneInfo.utcOffset})
                </Text>
              </View>
              {timeDiffLabel ? (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>{t('beforeYouLand.timeDiff', { defaultValue: 'Difference from home' })}</Text>
                  <Text style={styles.dataValueMono}>{timeDiffLabel}</Text>
                </View>
              ) : null}
              <View style={styles.nudgeBanner}>
                <Text style={styles.nudgeText}>
                  {t('beforeYouLand.nudge', { defaultValue: 'Set your watch now — start adjusting before you land' })}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noData}>{t('beforeYouLand.noTimezone', { defaultValue: 'Timezone info not available for this destination' })}</Text>
          )}
        </CollapsibleSection>

        {/* 2. Weather on Arrival */}
        <CollapsibleSection
          title={t('beforeYouLand.sections.weather', { defaultValue: 'Weather on Arrival' })}
          icon={<Sun size={20} color={COLORS.gold} strokeWidth={1.5} />}
          defaultOpen
        >
          {forecastDays.length > 0 ? (
            <>
              {forecastDays.map((day) => (
                <View key={day.date} style={styles.weatherRow}>
                  <Text style={styles.weatherDate}>{formatShortDate(day.date)}</Text>
                  <View style={styles.weatherDetails}>
                    <View style={styles.weatherStat}>
                      <Thermometer size={14} color={COLORS.coral} strokeWidth={1.5} />
                      <Text style={styles.weatherStatText}>
                        {Math.round(day.tempMax)}/{Math.round(day.tempMin)}C
                      </Text>
                    </View>
                    <View style={styles.weatherStat}>
                      <Droplets size={14} color={COLORS.sage} strokeWidth={1.5} />
                      <Text style={styles.weatherStatText}>{day.precipitationChance}%</Text>
                    </View>
                    <View style={styles.weatherStat}>
                      <Wind size={14} color={COLORS.creamDim} strokeWidth={1.5} />
                      <Text style={styles.weatherStatText}>
                        {Math.round(day.windSpeedMax)} km/h
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.weatherLabel}>{day.weatherLabel}</Text>
                </View>
              ))}
              {packSuggestions.length > 0 ? (
                <View style={styles.packSection}>
                  <Text style={styles.packTitle}>{t('beforeYouLand.packRecommendation', { defaultValue: 'Pack recommendation' })}</Text>
                  {packSuggestions.map((s) => (
                    <Text key={s} style={styles.packItem}>
                      {s}
                    </Text>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.noData}>{t('beforeYouLand.noWeather', { defaultValue: 'Weather info not available right now' })}</Text>
          )}
        </CollapsibleSection>

        {/* 2b. Live Weather (OpenWeather) */}
        {liveWeather ? (
          <CollapsibleSection
            title={t('beforeYouLand.sections.liveWeather', { defaultValue: 'Live Weather Forecast' })}
            icon={<CloudRain size={20} color={COLORS.sage} strokeWidth={1.5} />}
          >
            <Text style={styles.dataValue}>{liveWeather.summary}</Text>
            {liveWeather.days.slice(0, 5).map((day) => (
              <View key={day.date} style={styles.weatherRow}>
                <Text style={styles.weatherDate}>{formatShortDate(day.date)}</Text>
                <View style={styles.weatherDetails}>
                  <View style={styles.weatherStat}>
                    <Thermometer size={14} color={COLORS.coral} strokeWidth={1.5} />
                    <Text style={styles.weatherStatText}>
                      {Math.round(day.tempHigh)}/{Math.round(day.tempLow)}C
                    </Text>
                  </View>
                  <View style={styles.weatherStat}>
                    <Droplets size={14} color={COLORS.sage} strokeWidth={1.5} />
                    <Text style={styles.weatherStatText}>{day.humidity}%</Text>
                  </View>
                  <View style={styles.weatherStat}>
                    <Wind size={14} color={COLORS.creamDim} strokeWidth={1.5} />
                    <Text style={styles.weatherStatText}>
                      {Math.round(day.windSpeed)} m/s
                    </Text>
                  </View>
                </View>
                <Text style={styles.weatherLabel}>{day.description}</Text>
              </View>
            ))}
            {liveWeather.packingAdvice.length > 0 ? (
              <View style={styles.packSection}>
                <Text style={styles.packTitle}>{t('beforeYouLand.livePackAdvice', { defaultValue: 'Packing advice' })}</Text>
                {liveWeather.packingAdvice.map((tip) => (
                  <Text key={tip} style={styles.packItem}>{tip}</Text>
                ))}
              </View>
            ) : null}
          </CollapsibleSection>
        ) : null}

        {/* 3. Money Brief */}
        <CollapsibleSection
          title={t('beforeYouLand.sections.money', { defaultValue: 'Money Brief' })}
          icon={<DollarSign size={20} color={COLORS.gold} strokeWidth={1.5} />}
        >
          {exchangeRateLabel ? (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>{t('beforeYouLand.exchangeRate', { defaultValue: 'Exchange rate' })}</Text>
              <Text style={styles.dataValueMono}>{exchangeRateLabel}</Text>
            </View>
          ) : null}
          {culturalGuide ? (
            <>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.tipping', { defaultValue: 'Tipping culture' })}</Text>
                <Text style={styles.dataValue}>{culturalGuide.tipping}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.atmInfo', { defaultValue: 'ATM / card info' })}</Text>
                <Text style={styles.dataValue}>{culturalGuide.currency.tip}</Text>
              </View>
            </>
          ) : null}
          {!exchangeRateLabel && !culturalGuide ? (
            <Text style={styles.noData}>{t('beforeYouLand.noMoney', { defaultValue: 'Currency info not available for this destination' })}</Text>
          ) : null}
        </CollapsibleSection>

        {/* 4. Emergency Essentials */}
        <CollapsibleSection
          title={t('beforeYouLand.sections.emergency', { defaultValue: 'Emergency Essentials' })}
          icon={<Shield size={20} color={COLORS.coral} strokeWidth={1.5} />}
        >
          {emergencyData ? (
            <>
              <View style={styles.emergencyGrid}>
                <View style={styles.emergencyItem}>
                  <Text style={styles.emergencyLabel}>{t('beforeYouLand.police', { defaultValue: 'Police' })}</Text>
                  <Text style={styles.emergencyNumber}>{emergencyData.police}</Text>
                </View>
                <View style={styles.emergencyItem}>
                  <Text style={styles.emergencyLabel}>{t('beforeYouLand.ambulance', { defaultValue: 'Ambulance' })}</Text>
                  <Text style={styles.emergencyNumber}>{emergencyData.ambulance}</Text>
                </View>
                <View style={styles.emergencyItem}>
                  <Text style={styles.emergencyLabel}>{t('beforeYouLand.fire', { defaultValue: 'Fire' })}</Text>
                  <Text style={styles.emergencyNumber}>{emergencyData.fire}</Text>
                </View>
              </View>
            </>
          ) : null}
          {medicalGuide ? (
            <>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.hospitalQuality', { defaultValue: 'Hospital quality' })}</Text>
                <Text
                  style={[
                    styles.dataValueMono,
                    {
                      color:
                        medicalGuide.hospitalQuality === 'excellent'
                          ? COLORS.sage
                          : medicalGuide.hospitalQuality === 'good'
                            ? COLORS.gold
                            : COLORS.coral,
                    },
                  ]}
                >
                  {medicalGuide.hospitalQuality.charAt(0).toUpperCase() +
                    medicalGuide.hospitalQuality.slice(1)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.insurancePriority', { defaultValue: 'Insurance priority' })}</Text>
                <Text
                  style={[
                    styles.dataValueMono,
                    { color: getInsuranceColor(medicalGuide.insurancePriority) },
                  ]}
                >
                  {medicalGuide.insurancePriority.charAt(0).toUpperCase() +
                    medicalGuide.insurancePriority.slice(1)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.tapWater', { defaultValue: 'Tap water' })}</Text>
                <Text
                  style={[
                    styles.dataValueMono,
                    { color: medicalGuide.tapWaterSafe ? COLORS.sage : COLORS.coral },
                  ]}
                >
                  {medicalGuide.tapWaterSafe ? t('beforeYouLand.safeToDrink', { defaultValue: 'Safe to drink' }) : t('beforeYouLand.bottledOnly', { defaultValue: 'Bottled only' })}
                </Text>
              </View>
            </>
          ) : null}
          {!emergencyData && !medicalGuide ? (
            <Text style={styles.noData}>{t('beforeYouLand.noEmergency', { defaultValue: 'Emergency info not available for this destination' })}</Text>
          ) : null}
        </CollapsibleSection>

        {/* 5. Cultural Quick Hits */}
        <CollapsibleSection
          title={t('beforeYouLand.sections.cultural', { defaultValue: 'Cultural Quick Hits' })}
          icon={<Users size={20} color={COLORS.sage} strokeWidth={1.5} />}
        >
          {culturalGuide ? (
            <>
              {culturalGuide.etiquette.length > 0 ? (
                <View style={styles.cultureBlock}>
                  <Text style={styles.cultureHeading}>{t('beforeYouLand.greetingEtiquette', { defaultValue: 'Greeting etiquette' })}</Text>
                  <Text style={styles.dataValue}>{culturalGuide.etiquette[0].do}</Text>
                </View>
              ) : null}
              {culturalGuide.dressCodes.length > 0 ? (
                <View style={styles.cultureBlock}>
                  <Text style={styles.cultureHeading}>{t('beforeYouLand.dressCode', { defaultValue: 'Dress code' })}</Text>
                  {culturalGuide.dressCodes.map((d) => (
                    <Text key={d} style={styles.dataValue}>
                      {d}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={styles.cultureBlock}>
                <Text style={styles.cultureHeading}>{t('beforeYouLand.tippingLabel', { defaultValue: 'Tipping' })}</Text>
                <Text style={styles.dataValue}>{culturalGuide.tipping}</Text>
              </View>
              {culturalGuide.commonScams.length > 0 ? (
                <View style={styles.cultureBlock}>
                  <Text style={styles.cultureHeading}>{t('beforeYouLand.scamWarnings', { defaultValue: 'Scam warnings' })}</Text>
                  {culturalGuide.commonScams.slice(0, 2).map((scam) => (
                    <View key={scam} style={styles.scamRow}>
                      <AlertTriangle size={14} color={COLORS.gold} strokeWidth={1.5} />
                      <Text style={styles.scamText}>{scam}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.noData}>{t('beforeYouLand.noCultural', { defaultValue: 'Cultural info not available for this destination' })}</Text>
          )}
        </CollapsibleSection>

        {/* 5b. Entry Requirements (Sherpa) */}
        {entryReqs ? (
          <CollapsibleSection
            title={t('beforeYouLand.sections.entryReqs', { defaultValue: 'Entry Requirements' })}
            icon={<Shield size={20} color={COLORS.gold} strokeWidth={1.5} />}
          >
            {entryReqs.covidRestrictions ? (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.covidRestrictions', { defaultValue: 'COVID restrictions' })}</Text>
                <Text style={styles.dataValue}>{entryReqs.covidRestrictions}</Text>
              </View>
            ) : null}
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>{t('beforeYouLand.healthDeclaration', { defaultValue: 'Health declaration required' })}</Text>
              <Text style={[styles.dataValueMono, { color: entryReqs.healthDeclaration ? COLORS.gold : COLORS.sage }]}>
                {entryReqs.healthDeclaration ? t('common.yes', { defaultValue: 'Yes' }) : t('common.no', { defaultValue: 'No' })}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>{t('beforeYouLand.insuranceRequired', { defaultValue: 'Insurance required' })}</Text>
              <Text style={[styles.dataValueMono, { color: entryReqs.insuranceRequired ? COLORS.coral : COLORS.sage }]}>
                {entryReqs.insuranceRequired ? t('common.yes', { defaultValue: 'Yes' }) : t('common.no', { defaultValue: 'No' })}
              </Text>
            </View>
            {entryReqs.customsForms ? (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.customsForms', { defaultValue: 'Customs forms' })}</Text>
                <Text style={styles.dataValue}>{entryReqs.customsForms}</Text>
              </View>
            ) : null}
            {entryReqs.currencyRestrictions ? (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.currencyRestrictions', { defaultValue: 'Currency restrictions' })}</Text>
                <Text style={styles.dataValue}>{entryReqs.currencyRestrictions}</Text>
              </View>
            ) : null}
            {entryReqs.notes.length > 0 ? (
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{t('beforeYouLand.notes', { defaultValue: 'Notes' })}</Text>
                {entryReqs.notes.map((note) => (
                  <Text key={note} style={styles.dataValue}>{note}</Text>
                ))}
              </View>
            ) : null}
          </CollapsibleSection>
        ) : null}

        {/* 6. Your Checklist */}
        <CollapsibleSection
          title={t('beforeYouLand.sections.checklist', { defaultValue: 'Your Checklist' })}
          icon={<CheckSquare size={20} color={COLORS.sage} strokeWidth={1.5} />}
          defaultOpen
        >
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checkedItems[item.id] ?? false;
            return (
              <Pressable
                key={item.id}
                style={styles.checkRow}
                onPress={() => toggleCheck(item.id)}
              >
                {isChecked ? (
                  <CheckSquare size={20} color={COLORS.sage} strokeWidth={1.5} />
                ) : (
                  <Square size={20} color={COLORS.creamDim} strokeWidth={1.5} />
                )}
                <Text
                  style={[
                    styles.checkLabel,
                    isChecked ? styles.checkLabelDone : undefined,
                  ]}
                >
                  {t(CHECKLIST_I18N_KEYS[item.id] ?? item.id, { defaultValue: item.label })}
                </Text>
              </Pressable>
            );
          })}
        </CollapsibleSection>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Helpers
// =============================================================================
function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  titleBlock: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    marginTop: SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 18,
    color: COLORS.creamDim,
  } as TextStyle,
  tripMeta: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: SPACING.xs,
  } as TextStyle,
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
  } as TextStyle,

  // Section card
  sectionCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  sectionBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  } as ViewStyle,

  // Data rows
  dataRow: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  dataLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  } as TextStyle,
  dataValue: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 20,
  } as TextStyle,
  dataValueMono: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  noData: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,

  // Timezone nudge
  nudgeBanner: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  } as ViewStyle,
  nudgeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  // Weather
  weatherRow: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  weatherDate: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  weatherDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  weatherStatText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
  } as TextStyle,
  weatherLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  packSection: {
    marginTop: SPACING.sm,
  } as ViewStyle,
  packTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  packItem: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginLeft: SPACING.sm,
    marginBottom: 2,
  } as TextStyle,

  // Emergency
  emergencyGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  emergencyItem: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  emergencyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,
  emergencyNumber: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.coral,
  } as TextStyle,

  // Cultural
  cultureBlock: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  cultureHeading: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  } as TextStyle,
  scamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  } as ViewStyle,
  scamText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,

  // Checklist
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  checkLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  checkLabelDone: {
    color: COLORS.creamDim,
    textDecorationLine: 'line-through',
  } as TextStyle,
});

export default BeforeYouLandScreen;
