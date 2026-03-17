// =============================================================================
// ROAM — Explore Map Screen
// Palantir/Bloomberg terminal aesthetic — dark, data-rich, cinematic
// =============================================================================
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Route,
  X,
  ChevronRight,
} from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  parseItinerary,
  type Itinerary,
  type ItineraryDay,
  type TimeSlotActivity,
} from '../lib/types/itinerary';
import {
  geocodePlace,
  buildStaticMapUrl,
  type GeocodedLocation,
} from '../lib/mapbox';
import * as Haptics from '../lib/haptics';
import { ImpactFeedbackStyle } from '../lib/haptics';

// ---------------------------------------------------------------------------
// Platform-conditional map imports — react-native-maps crashes on web
// ---------------------------------------------------------------------------
const isWeb = Platform.OS === 'web';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = React.ComponentType<any>;

const MapView: AnyComponent = isWeb
  ? View
  : require('react-native-maps').default;
const Marker: AnyComponent = isWeb
  ? View
  : require('react-native-maps').Marker;
const Polyline: AnyComponent = isWeb
  ? View
  : require('react-native-maps').Polyline;
const PROVIDER_GOOGLE = isWeb
  ? undefined
  : require('react-native-maps').PROVIDER_GOOGLE;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_PEEK = 200;
const BOTTOM_SHEET_EXPANDED = SCREEN_HEIGHT * 0.45;
const DAY_SELECTOR_HEIGHT = 64;

const SLOT_COLORS = {
  morning: COLORS.sage,
  afternoon: COLORS.gold,
  evening: COLORS.coral,
} as const;

const SLOT_LABEL_COLORS = {
  morning: COLORS.sage,
  afternoon: COLORS.gold,
  evening: COLORS.coral,
} as const;

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Slot = 'morning' | 'afternoon' | 'evening';

interface VenuePin {
  id: string;
  dayIndex: number;
  dayNumber: number;
  slot: Slot;
  activity: TimeSlotActivity;
  location: GeocodedLocation;
}

interface SelectedVenue {
  pin: VenuePin;
}

// ---------------------------------------------------------------------------
// Helper — haversine distance in km
// ---------------------------------------------------------------------------
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalRouteKm(pins: VenuePin[]): number {
  if (pins.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < pins.length; i++) {
    total += haversineKm(
      pins[i - 1].location.lat,
      pins[i - 1].location.lng,
      pins[i].location.lat,
      pins[i].location.lng
    );
  }
  return total;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SlotDot({ slot }: { slot: Slot }) {
  return (
    <View
      style={[
        styles.slotDot,
        { backgroundColor: SLOT_COLORS[slot] },
      ]}
    />
  );
}

function VenueCallout({
  pin,
  onClose,
  onNavigate,
  t,
}: {
  pin: VenuePin;
  onClose: () => void;
  onNavigate: (pin: VenuePin) => void;
  t: (key: string, opts?: Record<string, string>) => string;
}) {
  return (
    <View style={styles.callout} pointerEvents="box-none">
      <View style={styles.calloutInner}>
        <View style={styles.calloutHeader}>
          <SlotDot slot={pin.slot} />
          <Text style={styles.calloutSlot}>
            {t(`exploreMap.slot_${pin.slot}`, { defaultValue: pin.slot.charAt(0).toUpperCase() + pin.slot.slice(1) })}
            {' · '}
            {t('exploreMap.day', { defaultValue: 'Day' })} {pin.dayNumber}
          </Text>
          <Pressable onPress={onClose} style={styles.calloutClose} hitSlop={8}>
            <X size={14} color={COLORS.muted} strokeWidth={1.5} />
          </Pressable>
        </View>

        <Text style={styles.calloutTitle} numberOfLines={2}>
          {pin.activity.location}
        </Text>

        <Text style={styles.calloutActivity} numberOfLines={1}>
          {pin.activity.activity}
        </Text>

        <View style={styles.calloutMeta}>
          {pin.activity.neighborhood ? (
            <Text style={styles.calloutNeighborhood}>
              {pin.activity.neighborhood}
            </Text>
          ) : null}
          {pin.activity.cost ? (
            <Text style={styles.calloutCost}>{pin.activity.cost}</Text>
          ) : null}
          {pin.activity.time ? (
            <Text style={styles.calloutTime}>{pin.activity.time}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => onNavigate(pin)}
          style={styles.calloutNav}
        >
          <Navigation size={12} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.calloutNavText}>
            {t('exploreMap.navigate', { defaultValue: 'Navigate' })}
          </Text>
        </Pressable>
      </View>
      <View style={styles.calloutArrow} />
    </View>
  );
}

function VenueListItem({
  pin,
  onPress,
  t,
}: {
  pin: VenuePin;
  onPress: (pin: VenuePin) => void;
  t: (key: string, opts?: Record<string, string>) => string;
}) {
  return (
    <Pressable
      onPress={() => onPress(pin)}
      style={({ pressed }) => [
        styles.venueItem,
        pressed && styles.venueItemPressed,
      ]}
    >
      <View style={[styles.venueSlotBar, { backgroundColor: SLOT_COLORS[pin.slot] }]} />
      <View style={styles.venueItemContent}>
        <View style={styles.venueItemRow}>
          <Text style={styles.venueItemSlotLabel}>
            {t(`exploreMap.slot_${pin.slot}`, { defaultValue: pin.slot })}
          </Text>
          {pin.activity.time ? (
            <Text style={styles.venueItemTime}>{pin.activity.time}</Text>
          ) : null}
        </View>
        <Text style={styles.venueItemName} numberOfLines={1}>
          {pin.activity.location}
        </Text>
        <Text style={styles.venueItemActivity} numberOfLines={1}>
          {pin.activity.activity}
        </Text>
        <View style={styles.venueItemFooter}>
          {pin.activity.neighborhood ? (
            <Text style={styles.venueItemNeighborhood}>
              {pin.activity.neighborhood}
            </Text>
          ) : null}
          {pin.activity.cost ? (
            <Text style={styles.venueItemCost}>{pin.activity.cost}</Text>
          ) : null}
        </View>
      </View>
      <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ExploreMapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tripId: paramTripId } = useLocalSearchParams<{ tripId?: string }>();

  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);

  const resolvedTripId = paramTripId ?? activeTripId ?? trips[0]?.id ?? null;
  const trip = useMemo(
    () => trips.find((t) => t.id === resolvedTripId) ?? null,
    [trips, resolvedTripId]
  );

  // Parsed itinerary
  const itinerary = useMemo<Itinerary | null>(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip]);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | 'all'>('all');
  const [pins, setPins] = useState<VenuePin[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<SelectedVenue | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);

  // Web-only static map URL
  const [staticMapUrl, setStaticMapUrl] = useState<string | null>(null);

  // Map ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  // Bottom sheet animation
  const bottomSheetAnim = useRef(new Animated.Value(BOTTOM_SHEET_PEEK)).current;

  // ---------------------------------------------------------------------------
  // Geocode all venues when itinerary changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!itinerary) return;

    let cancelled = false;
    setLoadingGeo(true);
    setPins([]);

    async function geocodeAll() {
      if (!itinerary) return;
      const dest = itinerary.destination;
      const allPins: VenuePin[] = [];

      for (let dayIdx = 0; dayIdx < itinerary.days.length; dayIdx++) {
        const day = itinerary.days[dayIdx];
        const slots: { slot: Slot; activity: TimeSlotActivity }[] = [
          { slot: 'morning', activity: day.morning },
          { slot: 'afternoon', activity: day.afternoon },
          { slot: 'evening', activity: day.evening },
        ];

        for (const { slot, activity } of slots) {
          if (cancelled) return;
          try {
            const geo = await geocodePlace(activity.location, dest);
            if (geo && !cancelled) {
              allPins.push({
                id: `day${day.day}-${slot}`,
                dayIndex: dayIdx,
                dayNumber: day.day,
                slot,
                activity,
                location: geo,
              });
              // Update progressively
              setPins((prev) => [...prev, {
                id: `day${day.day}-${slot}`,
                dayIndex: dayIdx,
                dayNumber: day.day,
                slot,
                activity,
                location: geo,
              }]);
            }
          } catch {
            // Skip un-geocodable venues
          }
        }
      }

      if (!cancelled) {
        setLoadingGeo(false);
        // Build web static map if needed
        if (isWeb && allPins.length > 0) {
          const slots = allPins.map((p) => p.slot);
          const url = buildStaticMapUrl({
            locations: allPins.map((p) => p.location),
            slots,
            width: Math.round(SCREEN_WIDTH),
            height: 300,
          });
          setStaticMapUrl(url);
        }
      }
    }

    geocodeAll();
    return () => { cancelled = true; };
  }, [itinerary]);

  // ---------------------------------------------------------------------------
  // Derived — visible pins for selected day
  // ---------------------------------------------------------------------------
  const visiblePins = useMemo(() => {
    if (selectedDayIndex === 'all') return pins;
    return pins.filter((p) => p.dayIndex === selectedDayIndex);
  }, [pins, selectedDayIndex]);

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const totalKm = totalRouteKm(visiblePins);
    return {
      distance: totalKm < 1
        ? `${Math.round(totalKm * 1000)} m`
        : `${totalKm.toFixed(1)} km`,
      venueCount: visiblePins.length,
    };
  }, [visiblePins]);

  // ---------------------------------------------------------------------------
  // Polylines — group by day
  // ---------------------------------------------------------------------------
  const polylines = useMemo(() => {
    const byDay: Record<number, VenuePin[]> = {};
    for (const pin of visiblePins) {
      if (!byDay[pin.dayIndex]) byDay[pin.dayIndex] = [];
      byDay[pin.dayIndex].push(pin);
    }
    return Object.values(byDay).map((dayPins) =>
      dayPins.map((p) => ({ latitude: p.location.lat, longitude: p.location.lng }))
    );
  }, [visiblePins]);

  // ---------------------------------------------------------------------------
  // Fit map to visible pins
  // ---------------------------------------------------------------------------
  const fitMapToVisible = useCallback(() => {
    if (isWeb || !mapRef.current || visiblePins.length === 0) return;

    const coords = visiblePins.map((p) => ({
      latitude: p.location.lat,
      longitude: p.location.lng,
    }));

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 40, bottom: BOTTOM_SHEET_PEEK + 80, left: 40 },
      animated: true,
    });
  }, [visiblePins]);

  useEffect(() => {
    if (visiblePins.length > 0) {
      // Small delay to let map settle
      const timer = setTimeout(fitMapToVisible, 400);
      return () => clearTimeout(timer);
    }
  }, [visiblePins, fitMapToVisible]);

  // ---------------------------------------------------------------------------
  // Day selector
  // ---------------------------------------------------------------------------
  const handleDaySelect = useCallback((dayIndex: number | 'all') => {
    Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    setSelectedDayIndex(dayIndex);
    setSelectedVenue(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Venue tap
  // ---------------------------------------------------------------------------
  const handleVenueTap = useCallback((pin: VenuePin) => {
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
    setSelectedVenue({ pin });

    // Scroll map to pin
    if (!isWeb && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: pin.location.lat - 0.003,
        longitude: pin.location.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 400);
    }
  }, []);

  const handleCloseCallout = useCallback(() => {
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
    setSelectedVenue(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Navigate to venue
  // ---------------------------------------------------------------------------
  const handleNavigate = useCallback((pin: VenuePin) => {
    Haptics.impactAsync(ImpactFeedbackStyle.Medium);
    const { lat, lng } = pin.location;
    const name = encodeURIComponent(pin.activity.location);

    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://?q=${name}&ll=${lat},${lng}`);
    } else {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`
      );
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Bottom sheet toggle
  // ---------------------------------------------------------------------------
  const toggleBottomSheet = useCallback(() => {
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
    const toValue = bottomSheetExpanded ? BOTTOM_SHEET_PEEK : BOTTOM_SHEET_EXPANDED;
    Animated.spring(bottomSheetAnim, {
      toValue,
      useNativeDriver: false,
      tension: 100,
      friction: 12,
    }).start();
    setBottomSheetExpanded((prev) => !prev);
  }, [bottomSheetAnim, bottomSheetExpanded]);

  // ---------------------------------------------------------------------------
  // Days list for selector
  // ---------------------------------------------------------------------------
  const dayOptions = useMemo(() => {
    if (!itinerary) return [];
    return itinerary.days.map((d, i) => ({ label: `Day ${d.day}`, dayIndex: i }));
  }, [itinerary]);

  // ---------------------------------------------------------------------------
  // Web fallback
  // ---------------------------------------------------------------------------
  if (isWeb) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.webHeader}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {trip?.destination ?? t('exploreMap.map', { defaultValue: 'Map' })}
          </Text>
        </View>

        <ScrollView style={styles.webScroll} contentContainerStyle={styles.webScrollContent}>
          {/* Static map image */}
          {staticMapUrl ? (
            <Image
              source={{ uri: staticMapUrl }}
              style={styles.webStaticMap}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.webMapPlaceholder}>
              {loadingGeo ? (
                <ActivityIndicator color={COLORS.sage} />
              ) : (
                <>
                  <MapPin size={32} color={COLORS.muted} strokeWidth={1.5} />
                  <Text style={styles.emptyText}>
                    {t('exploreMap.noMapboxToken', { defaultValue: 'Map unavailable' })}
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Venue list */}
          <View style={styles.webVenueList}>
            {visiblePins.map((pin) => (
              <VenueListItem
                key={pin.id}
                pin={pin}
                onPress={handleVenueTap}
                t={t}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // No trip guard
  // ---------------------------------------------------------------------------
  if (!itinerary) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { position: 'absolute', top: insets.top + SPACING.md, left: SPACING.md }]}
          hitSlop={8}
        >
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <MapPin size={40} color={COLORS.muted} strokeWidth={1.5} />
        <Text style={[styles.emptyText, { marginTop: SPACING.md }]}>
          {t('exploreMap.noTrip', { defaultValue: 'No active trip to map' })}
        </Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render — native
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Full-screen Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled
        pitchEnabled={false}
        mapPadding={{ top: 0, right: 0, bottom: BOTTOM_SHEET_PEEK + DAY_SELECTOR_HEIGHT, left: 0 }}
        initialRegion={{
          latitude: 35.6762,
          longitude: 139.6503,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Route polylines */}
        {polylines.map((coords, i) => (
          <Polyline
            key={`poly-${i}`}
            coordinates={coords}
            strokeColor={COLORS.sageLight}
            strokeWidth={2}
            lineDashPattern={[6, 4]}
          />
        ))}

        {/* Venue markers */}
        {visiblePins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.location.lat, longitude: pin.location.lng }}
            onPress={() => handleVenueTap(pin)}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={[styles.markerContainer, selectedVenue?.pin.id === pin.id && styles.markerSelected]}>
              <View style={[styles.markerDot, { backgroundColor: SLOT_COLORS[pin.slot] }]} />
              <View style={[styles.markerTail, { borderTopColor: SLOT_COLORS[pin.slot] }]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading indicator */}
      {loadingGeo && (
        <View style={[styles.loadingOverlay, { top: insets.top + 60 }]}>
          <ActivityIndicator size="small" color={COLORS.sage} />
          <Text style={styles.loadingText}>
            {t('exploreMap.mapping', { defaultValue: 'Mapping venues…' })}
          </Text>
        </View>
      )}

      {/* Callout (selected venue) */}
      {selectedVenue ? (
        <View
          style={[
            styles.calloutWrapper,
            { top: insets.top + 80 },
          ]}
          pointerEvents="box-none"
        >
          <VenueCallout
            pin={selectedVenue.pin}
            onClose={handleCloseCallout}
            onNavigate={handleNavigate}
            t={t}
          />
        </View>
      ) : null}

      {/* Floating stats overlay */}
      <View style={[styles.statsBar, { top: insets.top + SPACING.md }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButtonCompact}
          hitSlop={8}
        >
          <ArrowLeft size={18} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>

        <View style={styles.statsContent}>
          <Text style={styles.statsTrip} numberOfLines={1}>
            {trip?.destination ?? ''}
          </Text>
          <View style={styles.statsRow}>
            <Route size={12} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={styles.statValue}>{stats.distance}</Text>
            <MapPin size={12} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={styles.statValue}>
              {stats.venueCount} {t('exploreMap.venues', { defaultValue: 'venues' })}
            </Text>
          </View>
        </View>
      </View>

      {/* Day selector strip */}
      <View style={[styles.daySelectorWrapper, { bottom: BOTTOM_SHEET_PEEK + 8 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelectorContent}
          keyboardShouldPersistTaps="always"
        >
          {/* All days */}
          <Pressable
            onPress={() => handleDaySelect('all')}
            style={[
              styles.dayChip,
              selectedDayIndex === 'all' && styles.dayChipActive,
            ]}
          >
            <Text
              style={[
                styles.dayChipText,
                selectedDayIndex === 'all' && styles.dayChipTextActive,
              ]}
            >
              {t('exploreMap.allDays', { defaultValue: 'All Days' })}
            </Text>
          </Pressable>

          {dayOptions.map((opt) => (
            <Pressable
              key={opt.dayIndex}
              onPress={() => handleDaySelect(opt.dayIndex)}
              style={[
                styles.dayChip,
                selectedDayIndex === opt.dayIndex && styles.dayChipActive,
              ]}
            >
              <Text
                style={[
                  styles.dayChipText,
                  selectedDayIndex === opt.dayIndex && styles.dayChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Bottom sheet — venue list */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: bottomSheetAnim,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Handle / toggle */}
        <Pressable
          onPress={toggleBottomSheet}
          style={styles.bottomSheetHandle}
          hitSlop={12}
        >
          <View style={styles.handleBar} />
          <Text style={styles.bottomSheetTitle}>
            {selectedDayIndex === 'all'
              ? t('exploreMap.allVenues', { defaultValue: 'All Venues' })
              : `${t('exploreMap.day', { defaultValue: 'Day' })} ${itinerary.days[selectedDayIndex as number]?.day} ${t('exploreMap.venues', { defaultValue: 'Venues' })}`}
          </Text>
          <Text style={styles.bottomSheetCount}>{visiblePins.length}</Text>
        </Pressable>

        {/* Venue list */}
        <FlatList
          data={visiblePins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VenueListItem pin={item} onPress={handleVenueTap} t={t} />
          )}
          scrollEnabled={bottomSheetExpanded}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.venueListContent}
          ListEmptyComponent={
            loadingGeo ? (
              <View style={styles.listEmpty}>
                <ActivityIndicator size="small" color={COLORS.sage} />
                <Text style={styles.listEmptyText}>
                  {t('exploreMap.geocoding', { defaultValue: 'Finding venues on map…' })}
                </Text>
              </View>
            ) : (
              <View style={styles.listEmpty}>
                <Text style={styles.listEmptyText}>
                  {t('exploreMap.noVenues', { defaultValue: 'No venues found' })}
                </Text>
              </View>
            )
          }
        />
      </Animated.View>
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
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- Stats bar (top overlay) ----
  statsBar: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDarkGreen80,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  backButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface1,
  },
  statsContent: {
    flex: 1,
    gap: 2,
  },
  statsTrip: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.cream,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  },

  // ---- Loading overlay ----
  loadingOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgDarkGreen80,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  },

  // ---- Map marker ----
  markerContainer: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.25 }],
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: COLORS.transparent,
    borderRightColor: COLORS.transparent,
  },

  // ---- Callout wrapper ----
  calloutWrapper: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 100,
  },
  callout: {
    alignItems: 'center',
  },
  calloutInner: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    gap: SPACING.xs,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  calloutSlot: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  calloutClose: {
    padding: 4,
  },
  calloutTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 20,
  },
  calloutActivity: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  },
  calloutMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 2,
  },
  calloutNeighborhood: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  calloutCost: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    backgroundColor: COLORS.goldSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  calloutTime: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  },
  calloutNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  calloutNavText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.bg,
  },
  calloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: COLORS.transparent,
    borderRightColor: COLORS.transparent,
    borderTopColor: COLORS.surface1,
    marginTop: -1,
  },

  // ---- Day selector ----
  daySelectorWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DAY_SELECTOR_HEIGHT,
  },
  daySelectorContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayChip: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgDarkGreen80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  dayChipText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  },
  dayChipTextActive: {
    color: COLORS.bg,
  },

  // ---- Bottom sheet ----
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  bottomSheetHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  handleBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    position: 'absolute',
    top: SPACING.xs,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -18,
  },
  bottomSheetTitle: {
    flex: 1,
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: SPACING.sm,
  },
  bottomSheetCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: SPACING.sm,
  },
  venueListContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },

  // ---- Venue list item ----
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  venueItemPressed: {
    opacity: 0.7,
  },
  venueSlotBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  venueItemContent: {
    flex: 1,
    padding: SPACING.sm,
    gap: 2,
  },
  venueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  venueItemSlotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  venueItemTime: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  },
  venueItemName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  venueItemActivity: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  },
  venueItemFooter: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: 2,
  },
  venueItemNeighborhood: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  },
  venueItemCost: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
  },

  // ---- Slot dot ----
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ---- Empty states ----
  listEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  listEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

  // ---- Web styles ----
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface2,
  },
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
  },
  webScroll: {
    flex: 1,
  },
  webScrollContent: {
    paddingBottom: SPACING.xxl,
  },
  webStaticMap: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.surface2,
  },
  webMapPlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  webVenueList: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
});
