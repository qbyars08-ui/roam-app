// =============================================================================
// ROAM — TripMapCard: Tappable Mapbox static map preview of a trip's route
// Route line between pins, day number badges, animated press.
// Used in Plan tab and itinerary to navigate to the full explore-map screen.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { parseItinerary } from '../../lib/types/itinerary';
import {
  buildStaticMapUrl,
  geocodePlaces,
  isMapboxConfigured,
  type GeocodedLocation,
} from '../../lib/mapbox';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';
import { SkeletonCard } from '../premium/LoadingStates';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TripMapCardProps {
  tripId: string;
  destination: string;
  itineraryRaw: string; // raw itinerary JSON string
  days?: number;
  compact?: boolean; // smaller version for lists
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract all unique venue location names from all days. */
function extractVenueNames(itineraryRaw: string): string[] {
  try {
    const itinerary = parseItinerary(itineraryRaw);
    const names: string[] = [];
    for (const day of itinerary.days) {
      for (const slot of ['morning', 'afternoon', 'evening'] as const) {
        const loc = day[slot].location;
        if (loc && !names.includes(loc)) {
          names.push(loc);
        }
      }
    }
    return names;
  } catch {
    return [];
  }
}

/** Build the slot label array (morning/afternoon/evening) for pin colors. */
function buildSlotLabels(locationNames: string[], itineraryRaw: string): string[] {
  try {
    const itinerary = parseItinerary(itineraryRaw);
    const slotMap = new Map<string, string>();
    for (const day of itinerary.days) {
      for (const slot of ['morning', 'afternoon', 'evening'] as const) {
        const loc = day[slot].location;
        if (loc && !slotMap.has(loc)) {
          slotMap.set(loc, slot);
        }
      }
    }
    return locationNames.map((name) => slotMap.get(name) ?? 'morning');
  } catch {
    return locationNames.map(() => 'morning');
  }
}

/** Build day number for each venue (first occurrence). */
function buildDayNumbers(locationNames: string[], itineraryRaw: string): number[] {
  try {
    const itinerary = parseItinerary(itineraryRaw);
    const dayMap = new Map<string, number>();
    for (const day of itinerary.days) {
      for (const slot of ['morning', 'afternoon', 'evening'] as const) {
        const loc = day[slot].location;
        if (loc && !dayMap.has(loc)) {
          dayMap.set(loc, day.day);
        }
      }
    }
    return locationNames.map((name) => dayMap.get(name) ?? 1);
  } catch {
    return locationNames.map(() => 1);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TripMapCard({
  tripId,
  destination,
  itineraryRaw,
  days,
  compact = false,
}: TripMapCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [pinCount, setPinCount] = useState(0);

  // Animated press scale
  const pressScale = useRef(new Animated.Value(1)).current;

  // Pin drop animations — staggered appearance
  const pinOpacity = useRef(new Animated.Value(0)).current;

  const mapHeight = compact ? 160 : 220;

  // Extract venue names once — stable reference avoids re-geocoding
  const venueNames = useMemo(() => extractVenueNames(itineraryRaw), [itineraryRaw]);
  const slots = useMemo(() => buildSlotLabels(venueNames, itineraryRaw), [venueNames, itineraryRaw]);
  const dayNumbers = useMemo(() => buildDayNumbers(venueNames, itineraryRaw), [venueNames, itineraryRaw]);

  // ---------------------------------------------------------------------------
  // Geocode + build map URL on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isMapboxConfigured() || venueNames.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    geocodePlaces(venueNames, destination)
      .then((results) => {
        if (cancelled) return;
        const valid = results.filter((r): r is GeocodedLocation => r !== null);
        const validSlots = slots.filter((_, i) => results[i] !== null);

        if (valid.length === 0) {
          setMapUrl(null);
          setLoading(false);
          return;
        }

        // Build static map with route line (buildStaticMapUrl includes GeoJSON line)
        const url = buildStaticMapUrl({ locations: valid, slots: validSlots });
        setMapUrl(url);
        setPinCount(valid.length);
        setLoading(false);

        // Animate pins appearing with staggered fade
        Animated.timing(pinOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        if (cancelled) return;
        setMapUrl(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [venueNames, slots, destination, pinOpacity]);

  // ---------------------------------------------------------------------------
  // Press handlers
  // ---------------------------------------------------------------------------
  const handlePressIn = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [pressScale]);

  const handlePress = useCallback(() => {
    void impactAsync(ImpactFeedbackStyle.Light);
    router.push(`/explore-map?tripId=${tripId}` as never);
  }, [router, tripId]);

  // ---------------------------------------------------------------------------
  // Skeleton while geocoding
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <SkeletonCard
        height={mapHeight + 56}
        borderRadius={RADIUS.lg}
        style={styles.skeletonCard}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // No map (Mapbox not configured or all geocoding failed)
  // ---------------------------------------------------------------------------
  if (!mapUrl) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          styles.fallbackCard,
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('map.exploreMap', { defaultValue: 'Explore Map' })}
      >
        <LinearGradient
          colors={[COLORS.surface2, COLORS.surface1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fallbackInner, { height: mapHeight }]}
        >
          <MapPin color={COLORS.sage} size={28} strokeWidth={1.5} />
          <Text style={styles.fallbackText}>{destination}</Text>
          {Platform.OS === 'web' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                const query = encodeURIComponent(destination);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
              }}
              style={styles.fallbackMapsBtn}
            >
              <Navigation size={12} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.fallbackMapsBtnText}>
                {t('map.openInMaps', { defaultValue: 'Open in Maps' })}
              </Text>
            </Pressable>
          )}
        </LinearGradient>
        <CTARow />
      </Pressable>
    );
  }

  // ---------------------------------------------------------------------------
  // Full map card with route line and day badges
  // ---------------------------------------------------------------------------
  return (
    <Animated.View style={{ transform: [{ scale: pressScale }], opacity: pinOpacity }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={t('map.exploreMap', { defaultValue: 'Explore Map' })}
      >
        {/* Map image */}
        <View style={[styles.mapContainer, { height: mapHeight }]}>
          <Image
            source={{ uri: mapUrl }}
            style={styles.mapImage}
            resizeMode="cover"
          />

          {/* Gradient scrim for text legibility */}
          <View style={styles.scrim} />

          {/* Destination name — top left */}
          <View style={styles.destOverlay} pointerEvents="none">
            <MapPin color={COLORS.cream} size={13} strokeWidth={1.5} />
            <Text style={styles.destText} numberOfLines={1}>
              {destination}
            </Text>
          </View>

          {/* Day count badge — top right */}
          {days !== undefined && days > 0 && (
            <View style={styles.dayBadge} pointerEvents="none">
              <Text style={styles.dayBadgeText}>
                {t('map.daysBadge', { defaultValue: `${days}d` })}
              </Text>
            </View>
          )}

          {/* Pin count badge — bottom left */}
          {pinCount > 0 && (
            <View style={styles.pinCountBadge} pointerEvents="none">
              <Text style={styles.pinCountText}>
                {pinCount} {pinCount === 1 ? 'venue' : 'venues'}
              </Text>
            </View>
          )}
        </View>

        {/* CTA row */}
        <CTARow />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// CTA sub-component
// ---------------------------------------------------------------------------
function CTARow() {
  const { t } = useTranslation();
  return (
    <View style={styles.ctaRow}>
      <Navigation color={COLORS.sage} size={14} strokeWidth={1.5} />
      <Text style={styles.ctaText}>
        {t('map.exploreCta', { defaultValue: 'Explore Map' })}
        {' \u2192'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  skeletonCard: {
    marginVertical: 0,
  } as ViewStyle,

  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,

  fallbackCard: {
    minHeight: 100,
  } as ViewStyle,

  fallbackInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  fallbackText: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,

  fallbackMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginTop: SPACING.xs,
  } as ViewStyle,

  fallbackMapsBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,

  // Map image area
  mapContainer: {
    width: '100%',
    position: 'relative',
  } as ViewStyle,

  mapImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,

  // Bottom gradient scrim
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlayVeryFaint,
  } as ViewStyle,

  // Destination overlay — top left
  destOverlay: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.overlayDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  } as ViewStyle,

  destText: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.cream,
    maxWidth: 180,
  } as TextStyle,

  // Day count badge — top right
  dayBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  } as ViewStyle,

  dayBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,

  // Pin count badge — bottom left
  pinCountBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.overlayDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,

  pinCountText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.3,
  } as TextStyle,

  // CTA row
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,

  ctaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});
