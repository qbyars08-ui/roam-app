// =============================================================================
// ROAM — Destination Intelligence Dashboard
// Everything you need to know about a destination in one glanceable view.
// Live data from 8+ free APIs. No loading states that never resolve.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Globe,
  Shield,
  Sparkles,
  Thermometer,
  Wind,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getDestinationCoords } from '../../lib/air-quality';
import { getAirQuality, type AirQuality } from '../../lib/air-quality';
import { getWeatherForecast, type DailyForecast } from '../../lib/weather-forecast';
import { getTimezoneByDestination } from '../../lib/timezone';
import { getCostOfLiving, type CostOfLiving } from '../../lib/cost-of-living';
import { getSafetyForDestination, type SafetyData } from '../../lib/prep/safety-data';
import { getPublicHolidays, getCountryCode, type PublicHoliday } from '../../lib/public-holidays';
import { track } from '../../lib/analytics';
import HolidayCrowdCalendar from '../../components/features/HolidayCrowdCalendar';
import CostComparisonWidget from '../../components/features/CostComparisonWidget';
import DualClockWidget from '../../components/features/DualClockWidget';
import { GoldenHourCard } from '../../components/features/GoldenHourCard';
import { CurrencySparkline } from '../../components/features/CurrencySparkline';
import { getDestinationCurrency } from '../../lib/currency-history';

// ---------------------------------------------------------------------------
// Data fetching hook
// ---------------------------------------------------------------------------
interface DashboardData {
  weather: DailyForecast[] | null;
  airQuality: AirQuality | null;
  timezone: string | null;
  localTime: string | null;
  cost: CostOfLiving | null;
  safety: SafetyData | null;
  holidays: PublicHoliday[];
}

function useDashboardData(destination: string) {
  const [data, setData] = useState<DashboardData>({
    weather: null,
    airQuality: null,
    timezone: null,
    localTime: null,
    cost: null,
    safety: null,
    holidays: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const coords = getDestinationCoords(destination);
    const cost = getCostOfLiving(destination);
    const safety = getSafetyForDestination(destination);

    const promises: Promise<void>[] = [];

    // Weather
    if (coords) {
      promises.push(
        getWeatherForecast(coords.lat, coords.lng)
          .then((forecast) => {
            if (!cancelled && forecast) {
              setData((prev) => ({ ...prev, weather: forecast.days }));
            }
          })
          .catch(() => {}),
      );

      promises.push(
        getAirQuality(coords.lat, coords.lng)
          .then((aqi) => {
            if (!cancelled) {
              setData((prev) => ({ ...prev, airQuality: aqi }));
            }
          })
          .catch(() => {}),
      );
    }

    // Timezone (synchronous lookup)
    const tz = getTimezoneByDestination(destination);
    if (tz) {
      const now = new Date();
      const localTime = now.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      if (!cancelled) {
        setData((prev) => ({ ...prev, timezone: tz, localTime }));
      }
    }

    // Holidays
    const cc = getCountryCode(destination);
    if (cc) {
      promises.push(
        getPublicHolidays(cc)
          .then((h) => {
            if (!cancelled) {
              // Filter to next 30 days
              const now = new Date();
              const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              const upcoming = h.filter((hol) => {
                const d = new Date(hol.date);
                return d >= now && d <= thirtyDays;
              });
              setData((prev) => ({ ...prev, holidays: upcoming }));
            }
          })
          .catch(() => {}),
      );
    }

    // Static data
    if (!cancelled) {
      setData((prev) => ({ ...prev, cost, safety }));
    }

    Promise.allSettled(promises).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [destination]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  accentColor,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  accentColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statCard,
        onPress && { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${accentColor}20` }]}>
        <Icon size={18} color={accentColor} strokeWidth={2} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subValue && <Text style={styles.statSub}>{subValue}</Text>}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function DestinationDashboard() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const destination = name ?? '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);
  const setGenerateMode = useAppStore((s) => s.setGenerateMode);

  const { data, loading } = useDashboardData(destination);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'destination_dashboard', payload: { destination } });
  }, [destination]);

  const destInfo = useMemo(() => {
    return DESTINATIONS.find((d) => d.label.toLowerCase() === destination.toLowerCase());
  }, [destination]);

  const destCoords = useMemo(() => getDestinationCoords(destination), [destination]);
  const destCurrency = useMemo(() => getDestinationCurrency(destination), [destination]);

  // Get a comparison destination (different region, similar cost tier)
  const comparisonDest = useMemo(() => {
    if (!destInfo) return null;
    const candidates = DESTINATIONS.filter(
      (d) => d.label !== destInfo.label && d.category !== destInfo.category,
    );
    return candidates.length > 0 ? candidates[0].label : null;
  }, [destInfo]);

  const handlePlanTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlanWizard({ destination });
    setGenerateMode('quick');
    router.push('/(tabs)/plan');
  }, [destination, setPlanWizard, setGenerateMode, router]);

  // Weather summary
  const weatherSummary = useMemo(() => {
    if (!data.weather || data.weather.length === 0) return null;
    const today = data.weather[0];
    return {
      temp: `${Math.round(today.tempMax)}°`,
      description: today.precipitationChance > 50 ? 'Rainy' : today.tempMax > 28 ? 'Hot' : today.tempMax > 18 ? 'Warm' : 'Cool',
      rainChance: `${today.precipitationChance}% rain`,
    };
  }, [data.weather]);

  // Safety badge
  const safetyBadge = useMemo(() => {
    if (!data.safety) return null;
    const score = data.safety.safetyScore;
    if (score >= 80) return { label: 'Very Safe', color: COLORS.sage };
    if (score >= 60) return { label: 'Safe', color: COLORS.sage };
    if (score >= 40) return { label: 'Moderate', color: COLORS.gold };
    return { label: 'Use Caution', color: COLORS.coral };
  }, [data.safety]);

  // Dates for crowd calendar (next 14 days)
  const crowdDates = useMemo(() => {
    const now = new Date();
    const start = now.toISOString().split('T')[0];
    const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { start, end };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{destination}</Text>
          {destInfo && (
            <Text style={styles.headerCountry}>{destInfo.country}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={data.localTime ? Globe : Globe}
            label="Local time"
            value={data.localTime ?? '--:--'}
            subValue={data.timezone?.split('/')[1]?.replace('_', ' ') ?? undefined}
            accentColor={COLORS.sage}
          />
          <StatCard
            icon={Thermometer}
            label="Right now"
            value={weatherSummary?.temp ?? '--'}
            subValue={weatherSummary?.description}
            accentColor={COLORS.gold}
          />
          <StatCard
            icon={Wind}
            label="Air quality"
            value={data.airQuality?.label ?? '--'}
            subValue={data.airQuality ? `AQI ${data.airQuality.aqi}` : undefined}
            accentColor={data.airQuality && data.airQuality.aqi > 100 ? COLORS.coral : COLORS.sage}
          />
          <StatCard
            icon={Shield}
            label="Safety"
            value={safetyBadge?.label ?? '--'}
            subValue={data.safety ? `${data.safety.safetyScore}/100` : undefined}
            accentColor={safetyBadge?.color ?? COLORS.sage}
          />
        </View>

        {/* Dual Clock + Jet Lag */}
        <View style={styles.section}>
          <DualClockWidget destination={destination} />
        </View>

        {/* Golden Hour */}
        {destCoords && (
          <View style={styles.section}>
            <GoldenHourCard lat={destCoords.lat} lng={destCoords.lng} />
          </View>
        )}

        {/* Upcoming holidays */}
        {data.holidays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming holidays</Text>
            {data.holidays.slice(0, 3).map((h) => (
              <View key={h.date} style={styles.holidayRow}>
                <View style={styles.holidayDateBadge}>
                  <Text style={styles.holidayDateText}>
                    {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View>
                  <Text style={styles.holidayName}>{h.name}</Text>
                  {h.localName !== h.name && (
                    <Text style={styles.holidayLocal}>{h.localName}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Crowd Calendar */}
        <View style={styles.section}>
          <HolidayCrowdCalendar
            destination={destination}
            startDate={crowdDates.start}
            endDate={crowdDates.end}
          />
        </View>

        {/* Cost Comparison */}
        {comparisonDest && (
          <View style={styles.section}>
            <CostComparisonWidget
              destinations={[destination, comparisonDest]}
            />
          </View>
        )}

        {/* Currency Sparkline */}
        {destCurrency && destCurrency !== 'USD' && (
          <View style={styles.section}>
            <CurrencySparkline
              baseCurrency="USD"
              targetCurrency={destCurrency}
              destinationName={destination}
            />
          </View>
        )}

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handlePlanTrip}
        >
          <Sparkles size={20} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.ctaText}>Plan a trip to {destination}</Text>
        </Pressable>

        {/* Loading indicator for remaining data */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={styles.loadingText}>Loading live data...</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerText: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  headerCountry: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
    marginTop: 2,
  } as TextStyle,

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  statCard: {
    width: '48%' as unknown as number,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 4,
  } as ViewStyle,
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  } as ViewStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  statSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Sections
  section: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,

  // Holidays
  holidayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  holidayDateBadge: {
    backgroundColor: COLORS.coralSubtle,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    width: 70,
    alignItems: 'center',
  } as ViewStyle,
  holidayDateText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.coral,
  } as TextStyle,
  holidayName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  holidayLocal: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 1,
  } as TextStyle,

  // CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md + 2,
    marginTop: SPACING.md,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.bg,
  } as TextStyle,

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
});
