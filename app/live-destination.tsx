// =============================================================================
// ROAM — Living Destination Feed
// Real-time city pulse: events, weather, trending venues, upcoming happenings.
// Auto-refreshes Sonar every 5 minutes. Pull-to-refresh. Alert subscriptions.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Clock,
  CalendarDays,
  TrendingUp,
  Zap,
  RefreshCw,
  ExternalLink,
  MapPin,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../lib/constants';
import { useSonarQuery, fetchSonarResult } from '../lib/sonar';
import { searchPlaces, type FSQPlace } from '../lib/apis/foursquare';
import SonarCard, { SonarFallback } from '../components/ui/SonarCard';
import { trackEvent } from '../lib/analytics';
import type { SonarResult, SonarQueryType } from '../lib/types/sonar';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const ALERTS_KEY = 'roam_city_alerts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FeedSection {
  readonly id: string;
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly queryType: SonarQueryType;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LiveDestinationScreen(): React.JSX.Element {
  const { destination: rawDest } = useLocalSearchParams<{ destination: string }>();
  const destination = rawDest ?? 'Tokyo';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [refreshing, setRefreshing] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [trendingVenues, setTrendingVenues] = useState<readonly FSQPlace[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [extraSections, setExtraSections] = useState<Record<string, SonarResult | null>>({});
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const destData = useMemo(
    () => DESTINATIONS.find((d) => d.label === destination),
    [destination],
  );

  // Primary Sonar: "What's happening right now"
  const rightNow = useSonarQuery(destination, 'pulse');
  const events = useSonarQuery(destination, 'events');

  // Load alert state
  useEffect(() => {
    AsyncStorage.getItem(ALERTS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const cities = JSON.parse(raw) as string[];
        setAlertEnabled(cities.includes(destination));
      } catch { /* ignore */ }
    }).catch(() => {});
  }, [destination]);

  // Fetch trending venues from Foursquare
  useEffect(() => {
    if (!destData) return;
    setTrendingLoading(true);
    searchPlaces('trending', destData.lat, destData.lng, undefined, 3000)
      .then((places) => setTrendingVenues(places ?? []))
      .catch(() => setTrendingVenues([]))
      .finally(() => setTrendingLoading(false));
  }, [destData]);

  // Fetch "This Week" section
  useEffect(() => {
    fetchSonarResult(destination, 'events')
      .then((r) => setExtraSections((prev) => ({ ...prev, thisWeek: r })))
      .catch(() => {});
  }, [destination]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      rightNow.refetch();
      events.refetch();
    }, AUTO_REFRESH_MS);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [rightNow, events]);

  // Track screen view
  useEffect(() => {
    trackEvent('live_destination_view', { destination });
  }, [destination]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    rightNow.refetch();
    events.refetch();
    if (destData) {
      const places = await searchPlaces('trending', destData.lat, destData.lng, undefined, 3000);
      setTrendingVenues(places ?? []);
    }
    setTimeout(() => setRefreshing(false), 1200);
  }, [rightNow, events, destData]);

  const toggleAlert = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const raw = await AsyncStorage.getItem(ALERTS_KEY);
    const cities: string[] = raw ? JSON.parse(raw) : [];
    const next = alertEnabled
      ? cities.filter((c) => c !== destination)
      : [...cities, destination];
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(next));
    setAlertEnabled(!alertEnabled);
    trackEvent('live_destination_alert_toggle', { destination, enabled: !alertEnabled });
  }, [alertEnabled, destination]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button">
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{destination}</Text>
          <Text style={styles.headerSub}>
            {t('liveFeed.liveNow', { defaultValue: 'Live now' })}
          </Text>
        </View>
        <Pressable onPress={toggleAlert} hitSlop={12} accessibilityRole="button">
          {alertEnabled ? (
            <Bell size={20} color={COLORS.sage} strokeWidth={1.5} fill={COLORS.sage} />
          ) : (
            <BellOff size={20} color={COLORS.muted} strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.sage}
          />
        }
      >
        {/* Right Now */}
        <SectionHeader
          icon={<Zap size={16} color={COLORS.sage} strokeWidth={1.5} />}
          title={t('liveFeed.rightNow', { defaultValue: 'Right Now' })}
        />
        {rightNow.isLoading ? (
          <LoadingPlaceholder />
        ) : rightNow.data ? (
          <SonarCard
            answer={rightNow.data.answer}
            isLive={rightNow.isLive}
            citations={rightNow.citations}
            timestamp={rightNow.data.timestamp}
          />
        ) : (
          <SonarFallback />
        )}

        {/* Today */}
        <SectionHeader
          icon={<Clock size={16} color={COLORS.sage} strokeWidth={1.5} />}
          title={t('liveFeed.today', { defaultValue: 'Today' })}
        />
        {events.isLoading ? (
          <LoadingPlaceholder />
        ) : events.data ? (
          <SonarCard
            answer={events.data.answer}
            isLive={events.isLive}
            citations={events.citations}
            title={t('liveFeed.whatToDo', { defaultValue: 'What to do today' })}
            timestamp={events.data.timestamp}
          />
        ) : (
          <SonarFallback />
        )}

        {/* This Week */}
        <SectionHeader
          icon={<CalendarDays size={16} color={COLORS.sage} strokeWidth={1.5} />}
          title={t('liveFeed.thisWeek', { defaultValue: 'This Week' })}
        />
        {extraSections.thisWeek ? (
          <SonarCard
            answer={extraSections.thisWeek.answer}
            isLive={extraSections.thisWeek.isLive}
            citations={extraSections.thisWeek.citations}
            title={t('liveFeed.upcoming', { defaultValue: 'Upcoming' })}
            timestamp={extraSections.thisWeek.timestamp}
          />
        ) : (
          <LoadingPlaceholder />
        )}

        {/* Trending Venues (Foursquare) */}
        <SectionHeader
          icon={<TrendingUp size={16} color={COLORS.sage} strokeWidth={1.5} />}
          title={t('liveFeed.trending', { defaultValue: 'Trending' })}
        />
        {trendingLoading ? (
          <LoadingPlaceholder />
        ) : trendingVenues.length > 0 ? (
          <View style={styles.venueList}>
            {trendingVenues.slice(0, 6).map((venue) => (
              <VenueCard key={venue.fsqId} venue={venue} />
            ))}
          </View>
        ) : (
          <SonarFallback label={t('liveFeed.noTrending', { defaultValue: 'No trending venues found' })} />
        )}

        {/* Alert CTA */}
        <Pressable
          onPress={toggleAlert}
          style={[styles.alertBtn, alertEnabled && styles.alertBtnActive]}
          accessibilityRole="button"
        >
          {alertEnabled ? (
            <Bell size={16} color={COLORS.sage} strokeWidth={1.5} />
          ) : (
            <Bell size={16} color={COLORS.cream} strokeWidth={1.5} />
          )}
          <Text style={[styles.alertBtnText, alertEnabled && styles.alertBtnTextActive]}>
            {alertEnabled
              ? t('liveFeed.alertsOn', { defaultValue: 'Alerts on for this city' })
              : t('liveFeed.setAlerts', { defaultValue: 'Set alerts for this city' })}
          </Text>
        </Pressable>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function LoadingPlaceholder() {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator size="small" color={COLORS.sage} />
    </View>
  );
}

function VenueCard({ venue }: { venue: FSQPlace }) {
  return (
    <View style={styles.venueCard}>
      <View style={styles.venueTop}>
        <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
        {venue.rating != null && (
          <Text style={styles.venueRating}>
            {venue.rating.toFixed(1)}
          </Text>
        )}
      </View>
      <View style={styles.venueBottom}>
        <MapPin size={12} color={COLORS.muted} strokeWidth={1.5} />
        <Text style={styles.venueCategory} numberOfLines={1}>{venue.category}</Text>
        {venue.distance > 0 && (
          <Text style={styles.venueDistance}>
            {venue.distance < 1000
              ? `${venue.distance}m`
              : `${(venue.distance / 1000).toFixed(1)}km`}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  headerCenter: { flex: 1, alignItems: 'center' } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  loadingWrap: {
    padding: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  venueList: { gap: SPACING.sm } as ViewStyle,
  venueCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  venueTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  } as ViewStyle,
  venueName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    marginRight: SPACING.sm,
  } as TextStyle,
  venueRating: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
  } as TextStyle,
  venueBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  venueCategory: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    flex: 1,
  } as TextStyle,
  venueDistance: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface1,
  } as ViewStyle,
  alertBtnActive: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,
  alertBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  alertBtnTextActive: {
    color: COLORS.sage,
  } as TextStyle,
});
