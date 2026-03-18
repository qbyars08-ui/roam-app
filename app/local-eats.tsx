// =============================================================================
// ROAM — Local Eats Radar
// Authentic local food — Sonar intel + Foursquare street food search
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
import { ChevronLeft, ExternalLink, MapPin, Star, UtensilsCrossed } from 'lucide-react-native';
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
// Helpers
// ---------------------------------------------------------------------------
function priceDots(price: number | null): string {
  if (price == null) return '';
  return '$'.repeat(Math.min(price, 4));
}

function distanceLabel(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function buildMapsUrl(name: string, destination: string): string {
  const query = encodeURIComponent(`${name} ${destination}`);
  return `https://www.google.com/maps/search/${query}`;
}

// ---------------------------------------------------------------------------
// Eats card component
// ---------------------------------------------------------------------------
interface EatsCardProps {
  place: FSQPlace;
  destination: string;
}

function EatsCard({ place, destination }: EatsCardProps) {
  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(buildMapsUrl(place.name, destination));
  }, [place.name, destination]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.eatsCard,
        { opacity: pressed ? 0.88 : 1 },
      ]}
      accessibilityLabel={`Open ${place.name} in Google Maps`}
    >
      <View style={styles.eatsCardAccent} />
      <View style={styles.eatsCardContent}>
        <View style={styles.eatsTopRow}>
          <Text style={styles.eatsName} numberOfLines={1}>
            {place.name}
          </Text>
          <View style={styles.eatsMeta}>
            {place.price != null ? (
              <Text style={styles.eatsPrice}>{priceDots(place.price)}</Text>
            ) : null}
            {place.rating != null ? (
              <View style={styles.ratingBadge}>
                <Star size={10} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Text style={styles.eatsCategory} numberOfLines={1}>
          {place.category}
        </Text>
        {place.address ? (
          <View style={styles.eatsAddressRow}>
            <MapPin size={11} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={styles.eatsAddress} numberOfLines={1}>
              {place.address}
            </Text>
          </View>
        ) : null}
        <Text style={styles.eatsDistance}>
          {distanceLabel(place.distance)} away
        </Text>
      </View>
      <ExternalLink size={14} color={COLORS.creamVeryFaint} strokeWidth={1.5} style={styles.eatsExternalIcon} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function LocalEatsScreen() {
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
  const sonar = useSonarQuery(destination, 'local_eats');

  // Foursquare state — search street food + local restaurants
  const [streetFood, setStreetFood] = useState<FSQPlace[]>([]);
  const [localRestaurants, setLocalRestaurants] = useState<FSQPlace[]>([]);
  const [fsqLoading, setFsqLoading] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setFsqLoading(true);
    setStreetFood([]);
    setLocalRestaurants([]);

    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (cancelled || !geo) return;

        const [streetResults, localResults] = await Promise.allSettled([
          searchPlaces('street food', geo.latitude, geo.longitude, undefined, 10000),
          searchPlaces('local restaurant', geo.latitude, geo.longitude, undefined, 10000),
        ]);

        if (!cancelled) {
          if (streetResults.status === 'fulfilled' && streetResults.value) {
            setStreetFood(streetResults.value.slice(0, 5));
          }
          if (localResults.status === 'fulfilled' && localResults.value) {
            setLocalRestaurants(localResults.value.slice(0, 5));
          }
        }
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

  const allPlaces = useMemo((): FSQPlace[] => {
    const seen = new Set<string>();
    return [...streetFood, ...localRestaurants].filter((p) => {
      if (seen.has(p.fsqId)) return false;
      seen.add(p.fsqId);
      return true;
    });
  }, [streetFood, localRestaurants]);

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
          <UtensilsCrossed size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>
            {t('localEats.heroTitle', { defaultValue: 'Eat like you live here' })}
          </Text>
          <Text style={styles.heroDestination}>{destination}</Text>
          <Text style={styles.heroSub}>
            {t('localEats.heroSub', { defaultValue: 'Authentic spots locals actually eat at' })}
          </Text>
        </View>

        {/* Sonar intel card — the real recommendations */}
        {sonar.isLoading && !sonar.error ? (
          <SkeletonCard height={140} style={{ marginBottom: SPACING.md }} />
        ) : sonar.data ? (
          <View style={styles.sonarCard}>
            <View style={styles.sonarCardHeader}>
              <Text style={styles.sonarCardLabel}>
                {t('localEats.sonarLabel', { defaultValue: 'LOCAL FOOD INTEL' })}
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
              {t('localEats.sonarError', { defaultValue: 'Intel unavailable. Check connection.' })}
            </Text>
          </View>
        ) : null}

        {/* Foursquare: Street food */}
        {(fsqLoading || streetFood.length > 0) ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {t('localEats.streetFoodLabel', { defaultValue: 'STREET FOOD NEARBY' })}
              </Text>
              {fsqLoading && streetFood.length === 0 ? (
                <ActivityIndicator size="small" color={COLORS.sage} />
              ) : null}
            </View>
            {fsqLoading && streetFood.length === 0 ? (
              <View style={styles.skeletonStack}>
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} height={80} style={{ marginBottom: SPACING.xs }} />
                ))}
              </View>
            ) : (
              streetFood.map((place) => (
                <EatsCard key={place.fsqId} place={place} destination={destination} />
              ))
            )}
          </View>
        ) : null}

        {/* Foursquare: Local restaurants */}
        {(fsqLoading || localRestaurants.length > 0) ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {t('localEats.localRestLabel', { defaultValue: 'LOCAL RESTAURANTS' })}
              </Text>
              {fsqLoading && localRestaurants.length === 0 ? (
                <ActivityIndicator size="small" color={COLORS.sage} />
              ) : null}
            </View>
            {fsqLoading && localRestaurants.length === 0 ? (
              <View style={styles.skeletonStack}>
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} height={80} style={{ marginBottom: SPACING.xs }} />
                ))}
              </View>
            ) : (
              localRestaurants.map((place) => (
                <EatsCard key={place.fsqId} place={place} destination={destination} />
              ))
            )}
          </View>
        ) : null}

        {/* Empty state */}
        {!fsqLoading && allPlaces.length === 0 && !sonar.isLoading ? (
          <View style={styles.emptyCard}>
            <UtensilsCrossed size={28} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {t('localEats.empty', { defaultValue: 'No nearby spots found. The Sonar intel above has the best local tips.' })}
            </Text>
          </View>
        ) : null}
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
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
  heroDestination: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.creamDim,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
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
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  // Section
  sectionBlock: {
    marginBottom: SPACING.md,
  } as ViewStyle,
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
    marginBottom: SPACING.xs,
  } as ViewStyle,

  // Eats card
  eatsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  eatsCardAccent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  eatsCardContent: {
    flex: 1,
    padding: SPACING.sm,
  } as ViewStyle,
  eatsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  } as ViewStyle,
  eatsName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  eatsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  eatsPrice: {
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
  eatsCategory: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 3,
  } as TextStyle,
  eatsAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  } as ViewStyle,
  eatsAddress: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
  } as TextStyle,
  eatsDistance: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
  } as TextStyle,
  eatsExternalIcon: {
    marginRight: SPACING.sm,
  } as ViewStyle,
});

export default LocalEatsScreen;
