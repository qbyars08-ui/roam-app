// =============================================================================
// ROAM — Hostel Hub
// Best hostels for solo travelers — Sonar intel + Foursquare search
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
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
import { BedDouble, ChevronLeft, ExternalLink, MapPin, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { useSonarQuery } from '../lib/sonar';
import { searchPlaces, type FSQPlace } from '../lib/apis/foursquare';
import { geocodeCity } from '../lib/geocoding';
import { SkeletonCard } from '../components/premium/LoadingStates';
import LiveBadge from '../components/ui/LiveBadge';
import SourceCitation from '../components/ui/SourceCitation';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Hostelworld link builder
// ---------------------------------------------------------------------------
function buildHostelworldUrl(destination: string): string {
  const slug = destination.toLowerCase().replace(/\s+/g, '-');
  return `https://www.hostelworld.com/st/hostels/${encodeURIComponent(slug)}`;
}

// ---------------------------------------------------------------------------
// Price level display
// ---------------------------------------------------------------------------
function priceDots(price: number | null): string {
  if (price == null) return '';
  return '$'.repeat(Math.min(price, 4));
}

// ---------------------------------------------------------------------------
// Distance label
// ---------------------------------------------------------------------------
function distanceLabel(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// ---------------------------------------------------------------------------
// FSQ Hostel Card
// ---------------------------------------------------------------------------
interface HostelCardProps {
  place: FSQPlace;
  destination: string;
}

function FsqHostelCard({ place, destination }: HostelCardProps) {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(`${place.name} ${destination}`);
    void Linking.openURL(`https://www.google.com/maps/search/${query}`);
  }, [place.name, destination]);

  const handleBook = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void Linking.openURL(buildHostelworldUrl(destination));
  }, [destination]);

  return (
    <View style={styles.hostelCard}>
      <View style={styles.hostelCardAccent} />
      <View style={styles.hostelCardContent}>
        <View style={styles.hostelCardTopRow}>
          <Text style={styles.hostelCardName} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.hostelCardMeta}>
            {place.price != null ? (
              <Text style={styles.hostelCardPrice}>{priceDots(place.price)}</Text>
            ) : null}
            {place.rating != null ? (
              <View style={styles.ratingBadge}>
                <Star size={10} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.hostelCardCategory} numberOfLines={1}>
          {place.category}
        </Text>
        {place.address ? (
          <View style={styles.hostelAddressRow}>
            <MapPin size={11} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={styles.hostelCardAddress} numberOfLines={1}>
              {place.address}
            </Text>
          </View>
        ) : null}
        <Text style={styles.hostelCardDistance}>
          {distanceLabel(place.distance)} away
        </Text>
      </View>
      <View style={styles.hostelCardActions}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.mapsBtn,
            { opacity: pressed ? 0.75 : 1 },
          ]}
          accessibilityLabel="View on Google Maps"
        >
          <ExternalLink size={14} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
        <Pressable
          onPress={handleBook}
          style={({ pressed }) => [
            styles.bookBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          accessibilityLabel="Book on Hostelworld"
        >
          <Text style={styles.bookBtnText}>Book</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function HostelHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { destination: paramDest } = useLocalSearchParams<{ destination: string }>();
  const trips = useAppStore((s) => s.trips);

  const destination = useMemo((): string => {
    if (paramDest) return paramDest;
    if (trips.length > 0) return trips[0].destination;
    return DESTINATIONS[0]?.label ?? 'Bangkok';
  }, [paramDest, trips]);

  // Sonar intel
  const sonar = useSonarQuery(destination, 'hostels');

  // Foursquare state
  const [fsqPlaces, setFsqPlaces] = useState<FSQPlace[]>([]);
  const [fsqLoading, setFsqLoading] = useState(false);

  // Fetch Foursquare hostels
  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setFsqLoading(true);
    setFsqPlaces([]);

    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (cancelled || !geo) return;
        const results = await searchPlaces('hostel', geo.latitude, geo.longitude, undefined, 10000);
        if (!cancelled && results) setFsqPlaces(results.slice(0, 8));
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setFsqLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [destination]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleHostelworld = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void Linking.openURL(buildHostelworldUrl(destination));
  }, [destination]);

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
        {/* Hero */}
        <View style={styles.heroBlock}>
          <BedDouble size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>
            {t('hostelHub.heroTitle', { defaultValue: 'Where to stay in' })}
          </Text>
          <Text style={styles.heroDestination}>{destination}</Text>
          <Text style={styles.heroSub}>
            {t('hostelHub.heroSub', { defaultValue: 'Best social hostels for solo travelers' })}
          </Text>
        </View>

        {/* Sonar results card */}
        {sonar.isLoading && !sonar.error ? (
          <SkeletonCard height={120} style={{ marginBottom: SPACING.md }} />
        ) : sonar.data ? (
          <View style={styles.sonarCard}>
            <View style={styles.sonarCardHeader}>
              <Text style={styles.sonarCardLabel}>
                {t('hostelHub.sonarLabel', { defaultValue: 'HOSTEL INTEL' })}
              </Text>
              {sonar.isLive ? <LiveBadge size="sm" /> : null}
            </View>
            <Text style={styles.sonarAnswer}>{sonar.data.answer}</Text>
            {sonar.citations.length > 0 ? (
              <View style={{ marginTop: SPACING.sm }}>
                <SourceCitation citations={sonar.citations} />
              </View>
            ) : null}
          </View>
        ) : sonar.error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {t('hostelHub.sonarError', { defaultValue: 'Intel unavailable. Check connection.' })}
            </Text>
          </View>
        ) : null}

        {/* Foursquare results */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            {t('hostelHub.nearbyLabel', { defaultValue: 'NEARBY HOSTELS' })}
          </Text>
          {fsqLoading ? (
            <ActivityIndicator size="small" color={COLORS.sage} />
          ) : null}
        </View>

        {fsqLoading && fsqPlaces.length === 0 ? (
          <View style={styles.skeletonStack}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} height={88} style={{ marginBottom: SPACING.sm }} />
            ))}
          </View>
        ) : fsqPlaces.length > 0 ? (
          fsqPlaces.map((place) => (
            <FsqHostelCard key={place.fsqId} place={place} destination={destination} />
          ))
        ) : !fsqLoading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('hostelHub.noNearby', { defaultValue: 'No nearby hostels found via Foursquare.' })}
            </Text>
          </View>
        ) : null}

        {/* Hostelworld CTA */}
        <Pressable
          onPress={handleHostelworld}
          style={({ pressed }) => [
            styles.hostelworldBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityLabel="Browse all hostels on Hostelworld"
        >
          <BedDouble size={18} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.hostelworldBtnText}>
            {t('hostelHub.browseAll', { defaultValue: 'Browse all hostels on Hostelworld' })}
          </Text>
          <ExternalLink size={14} color={COLORS.bg} strokeWidth={1.5} />
        </Pressable>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,

  // Hero
  heroBlock: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  } as TextStyle,

  // Sonar card
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sonarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sonarCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 22,
  } as TextStyle,

  // Error / empty
  errorCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dangerBorderLight,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,
  emptyCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
  } as TextStyle,

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1.5,
  } as TextStyle,

  // Skeleton
  skeletonStack: {
    marginBottom: SPACING.sm,
  } as ViewStyle,

  // Hostel card
  hostelCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  hostelCardAccent: {
    width: 3,
    backgroundColor: COLORS.sageLight,
  } as ViewStyle,
  hostelCardContent: {
    flex: 1,
    padding: SPACING.sm,
  } as ViewStyle,
  hostelCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  } as ViewStyle,
  hostelCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  hostelCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  hostelCardPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
  } as TextStyle,
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.goldSoft,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
  } as ViewStyle,
  ratingText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
  } as TextStyle,
  hostelCardCategory: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 3,
  } as TextStyle,
  hostelAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  } as ViewStyle,
  hostelCardAddress: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
  } as TextStyle,
  hostelCardDistance: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
  } as TextStyle,
  hostelCardActions: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  } as ViewStyle,
  mapsBtn: {
    padding: 6,
  } as ViewStyle,
  bookBtn: {
    backgroundColor: COLORS.action,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
  } as ViewStyle,
  bookBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,

  // Hostelworld CTA
  hostelworldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.action,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  hostelworldBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});

export default HostelHubScreen;
