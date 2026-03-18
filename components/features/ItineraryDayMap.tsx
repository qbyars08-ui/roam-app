// =============================================================================
// ROAM — ItineraryDayMap
// Interactive dark map for a single itinerary day with morning→afternoon→evening route.
// Native: react-native-maps MapView with custom markers and dashed polyline.
// Web: static Mapbox image fallback.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Maximize2 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  geocodePlaces,
  buildStaticMapUrl,
  type GeocodedLocation,
} from '../../lib/mapbox';
import * as Haptics from '../../lib/haptics';

// ---------------------------------------------------------------------------
// Platform-conditional imports — keep web bundle clean
// ---------------------------------------------------------------------------
const isWeb = Platform.OS === 'web';

// Type aliases so TS is happy on all platforms
type MapViewType = React.ComponentType<{
  ref?: React.RefObject<{ fitToCoordinates: (coords: Coordinate[], opts: object) => void }>;
  style: ViewStyle;
  customMapStyle?: object[];
  initialRegion?: Region;
  onMapReady?: () => void;
  showsCompass?: boolean;
  showsUserLocation?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  moveOnMarkerPress?: boolean;
  children?: React.ReactNode;
}>;

type MarkerType = React.ComponentType<{
  coordinate: Coordinate;
  onPress?: () => void;
  anchor?: { x: number; y: number };
  calloutAnchor?: { x: number; y: number };
  children?: React.ReactNode;
}>;

type CalloutType = React.ComponentType<{
  tooltip?: boolean;
  children?: React.ReactNode;
}>;

type PolylineType = React.ComponentType<{
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
}>;

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Region extends Coordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

// Lazy-load native-only modules
let NativeMapView: MapViewType | null = null;
let NativeMarker: MarkerType | null = null;
let NativeCallout: CalloutType | null = null;
let NativePolyline: PolylineType | null = null;

if (!isWeb) {
  const rnMaps = require('react-native-maps');
  NativeMapView = rnMaps.default as MapViewType;
  NativeMarker = rnMaps.Marker as MarkerType;
  NativeCallout = rnMaps.Callout as CalloutType;
  NativePolyline = rnMaps.Polyline as PolylineType;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DARK_MAP_STYLE: object[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const SLOT_COLORS = {
  morning: COLORS.sage,    // #5B9E6F
  afternoon: COLORS.gold,  // #C9A84C
  evening: COLORS.coralStrong, // rgba(232,97,74,0.9)
} as const;

type Slot = keyof typeof SLOT_COLORS;

const SLOTS: Slot[] = ['morning', 'afternoon', 'evening'];

const MAP_HEIGHT = 200;

// Fallback coordinates (world center) used when geocoding fails
const FALLBACK_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 100,
  longitudeDelta: 100,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ItineraryDayMapProps {
  day: {
    morning: { location: string; activity: string; time?: string };
    afternoon: { location: string; activity: string; time?: string };
    evening: { location: string; activity: string; time?: string };
  };
  destination: string;
  dayNumber: number;
  tripId?: string;
}

// ---------------------------------------------------------------------------
// Sub-component: custom numbered pin marker
// ---------------------------------------------------------------------------
interface PinProps {
  number: number;
  color: string;
}

const PinMarker = React.memo(function PinMarker({ number, color }: PinProps) {
  return (
    <View style={[styles.pin, { backgroundColor: color }]}>
      <Text style={styles.pinNumber}>{number}</Text>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Sub-component: pulsing skeleton placeholder
// ---------------------------------------------------------------------------
function MapSkeleton() {
  return <View style={styles.skeleton} />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ItineraryDayMap({
  day,
  destination,
  dayNumber,
  tripId,
}: ItineraryDayMapProps) {
  const router = useRouter();

  const [locations, setLocations] = useState<(GeocodedLocation | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Typed ref for react-native-maps fitToCoordinates
  const mapRef = useRef<{ fitToCoordinates: (coords: Coordinate[], opts: object) => void } | null>(null);

  // ---------------------------------------------------------------------------
  // Geocode on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const places = [
      day.morning.location,
      day.afternoon.location,
      day.evening.location,
    ];

    setLoading(true);
    geocodePlaces(places, destination)
      .then((results) => {
        if (!cancelled) {
          setLocations(results);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocations([null, null, null]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [day.morning.location, day.afternoon.location, day.evening.location, destination]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const validLocations = useMemo(
    () => locations.filter((l): l is GeocodedLocation => l !== null),
    [locations]
  );

  const polylineCoords: Coordinate[] = useMemo(
    () => validLocations.map((l) => ({ latitude: l.lat, longitude: l.lng })),
    [validLocations]
  );

  const initialRegion: Region = useMemo(() => {
    if (validLocations.length === 0) return FALLBACK_REGION;

    const lats = validLocations.map((l) => l.lat);
    const lngs = validLocations.map((l) => l.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = Math.max((maxLat - minLat) * 1.6, 0.01);
    const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.01);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [validLocations]);

  // ---------------------------------------------------------------------------
  // Fit map once ready + locations resolved
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isWeb || !mapReady || polylineCoords.length < 2) return;

    // Small delay to allow the map to settle
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(polylineCoords, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: false,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [mapReady, polylineCoords]);

  // ---------------------------------------------------------------------------
  // Static map URL for web
  // ---------------------------------------------------------------------------
  const staticMapUrl = useMemo(() => {
    if (!isWeb || validLocations.length === 0) return null;
    return buildStaticMapUrl({
      locations: validLocations,
      slots: SLOTS.slice(0, validLocations.length),
      width: 800,
      height: 400,
      retina: true,
    });
  }, [validLocations]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleOpenFullMap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to the visited-map screen; cast to any to bypass strict Expo Router path types
    // since the full map screen may be parameterized at runtime
    if (tripId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (router as any).push(`/explore-map?tripId=${tripId}`);
    } else {
      router.push('/explore-map' as never);
    }
  }, [router, tripId, dayNumber]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderMarkers = () => {
    if (!NativeMarker || !NativeCallout) return null;

    return locations.map((loc, index) => {
      if (!loc) return null;

      const slot = SLOTS[index];
      const color = SLOT_COLORS[slot];
      const slotData = day[slot];
      const coord: Coordinate = { latitude: loc.lat, longitude: loc.lng };

      return (
        <NativeMarker
          key={slot}
          coordinate={coord}
          anchor={{ x: 0.5, y: 0.5 }}
          calloutAnchor={{ x: 0.5, y: 0 }}
          onPress={() => Haptics.selectionAsync()}
        >
          <PinMarker number={index + 1} color={color} />
          <NativeCallout tooltip>
            <View style={styles.callout}>
              <Text style={[styles.calloutSlot, { color }]}>{slot}</Text>
              <Text style={styles.calloutActivity} numberOfLines={2}>
                {slotData.activity}
              </Text>
              {slotData.time != null && (
                <Text style={styles.calloutTime}>{slotData.time}</Text>
              )}
            </View>
          </NativeCallout>
        </NativeMarker>
      );
    });
  };

  const renderPolyline = () => {
    if (!NativePolyline || polylineCoords.length < 2) return null;

    return (
      <NativePolyline
        coordinates={polylineCoords}
        strokeColor={COLORS.sageMedium}
        strokeWidth={2}
        lineDashPattern={[6, 4]}
      />
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {loading ? (
        <MapSkeleton />
      ) : isWeb ? (
        // ---- Web: static Mapbox image ----
        staticMapUrl != null ? (
          <Image
            source={{ uri: staticMapUrl }}
            style={styles.staticImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noMap}>
            <Text style={styles.noMapText}>Map unavailable</Text>
          </View>
        )
      ) : NativeMapView != null ? (
        // ---- Native: interactive MapView ----
        <NativeMapView
          ref={mapRef}
          style={styles.map}
          customMapStyle={DARK_MAP_STYLE}
          initialRegion={initialRegion}
          onMapReady={handleMapReady}
          showsCompass={false}
          showsUserLocation={false}
          rotateEnabled={false}
          pitchEnabled={false}
          moveOnMarkerPress={false}
        >
          {renderPolyline()}
          {renderMarkers()}
        </NativeMapView>
      ) : (
        <View style={styles.noMap}>
          <Text style={styles.noMapText}>Map unavailable</Text>
        </View>
      )}

      {/* "Open Full Map" floating button */}
      <Pressable
        style={styles.fullMapBtn}
        onPress={handleOpenFullMap}
        accessibilityLabel="Open full map"
        accessibilityRole="button"
      >
        <Maximize2 size={12} color={COLORS.cream} strokeWidth={1.5} />
        <Text style={styles.fullMapText}>Full Map</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    height: MAP_HEIGHT,
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
  } as ViewStyle,

  map: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,

  staticImage: {
    width: '100%',
    height: MAP_HEIGHT,
  } as ImageStyle,

  skeleton: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    opacity: 0.6,
  } as ViewStyle,

  noMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
  } as ViewStyle,

  noMapText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,

  // Floating "Open Full Map" button
  fullMapBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,

  fullMapText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,

  // Custom pin marker
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,

  pinNumber: {
    fontFamily: FONTS.header,
    fontSize: 12,
    color: COLORS.bg,
    lineHeight: 14,
  } as TextStyle,

  // Callout bubble
  callout: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 140,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,

  calloutSlot: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    textTransform: 'capitalize',
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,

  calloutActivity: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,

  calloutTime: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 3,
  } as TextStyle,
});
