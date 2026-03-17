// =============================================================================
// ROAM — Mapbox Route Map: Dark-styled day route with connected paths
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  buildDayRouteMaps,
  isMapboxConfigured,
  type DayRouteMap,
  type GeocodedLocation,
} from '../../lib/mapbox';
import type { ItineraryDay } from '../../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MapboxRouteMapProps {
  day: ItineraryDay;
  city: string;
  onLocationPress?: (location: GeocodedLocation) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MapboxRouteMap({
  day,
  city,
  onLocationPress,
}: MapboxRouteMapProps) {
  const { t } = useTranslation();
  const [routeMap, setRouteMap] = useState<DayRouteMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isMapboxConfigured()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
      setLoading(false);
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    setLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    setError(false);

    buildDayRouteMaps({
      days: [{
        day: day.day,
        morning: { location: day.morning.location },
        afternoon: { location: day.afternoon.location },
        evening: { location: day.evening.location },
      }],
      city,
    })
      .then((maps) => {
        if (cancelled) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
        setRouteMap(maps[0] ?? null);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async error handling
        setError(true);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async error handling
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [day.day, day.morning.location, day.afternoon.location, day.evening.location, city]);

  // Not configured
  if (!isMapboxConfigured()) return null;

  // Loading
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.loadingText}>{t('map.loading', { defaultValue: 'Loading route map...' })}</Text>
        </View>
      </View>
    );
  }

  // Error or no data
  if (error || !routeMap) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{`${t('map.dayLabel', { defaultValue: 'DAY' })} ${day.day} ${t('map.routeLabel', { defaultValue: 'ROUTE' })}`}</Text>
        <Text style={styles.locationCount}>
          {`${routeMap.locations.length} ${t('map.stops', { defaultValue: 'stops' })}`}
        </Text>
      </View>

      {/* Map Image */}
      <View style={styles.mapContainer}>
        <Image
          source={{ uri: routeMap.imageUrl }}
          style={styles.mapImage}
          resizeMode="cover"
        />
      </View>

      {/* Location Legend */}
      <View style={styles.legend}>
        {routeMap.locations.map((loc, i) => {
          const slotLabel = i === 0 ? t('map.morning', { defaultValue: 'Morning' }) : i === 1 ? t('map.afternoon', { defaultValue: 'Afternoon' }) : t('map.evening', { defaultValue: 'Evening' });
          const dotColor =
            i === 0 ? COLORS.sage : i === 1 ? COLORS.gold : COLORS.coral;

          return (
            <Pressable
              key={`${loc.name}-${i}`}
              style={({ pressed }) => [
                styles.legendRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => onLocationPress?.(loc)}
            >
              <View style={[styles.legendDot, { backgroundColor: dotColor }]}>
                <Text style={styles.legendDotText}>{i + 1}</Text>
              </View>
              <View style={styles.legendInfo}>
                <Text style={styles.legendSlot}>{slotLabel}</Text>
                <Text style={styles.legendName} numberOfLines={1}>
                  {loc.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Overview Map Component (for itinerary header)
// ---------------------------------------------------------------------------
export function MapboxOverview({
  lat,
  lng,
  city,
}: {
  lat: number;
  lng: number;
  city: string;
}) {
  const { buildDestinationMapUrl } = require('../../lib/mapbox');

  const mapUrl = useMemo(
    () =>
      buildDestinationMapUrl({ lat, lng, zoom: 11, width: 600, height: 200 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildDestinationMapUrl from require
    [lat, lng]
  );

  if (!mapUrl) return null;

  return (
    <View style={styles.overviewContainer}>
      <Image
        source={{ uri: mapUrl }}
        style={styles.overviewImage}
        resizeMode="cover"
      />
      <View style={styles.overviewOverlay}>
        <Text style={styles.overviewCity}>{city}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  locationCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Map
  mapContainer: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  mapImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  mapPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Legend
  legend: {
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  legendDot: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  legendDotText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  } as TextStyle,
  legendInfo: {
    flex: 1,
    gap: 1,
  } as ViewStyle,
  legendSlot: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  legendName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Overview Map
  overviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  overviewImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  overviewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgDarkGreenSoft,
  } as ViewStyle,
  overviewCity: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
});
