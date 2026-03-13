// =============================================================================
// ROAM — Itinerary Screen (production)
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  Linking,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// react-native-maps crashes on web — only import on native
const isWeb = Platform.OS === 'web';
const MapView = isWeb ? View : require('react-native-maps').default;
const Marker = isWeb ? View : require('react-native-maps').Marker;
const Polyline = isWeb ? View : require('react-native-maps').Polyline;
const Circle = isWeb ? View : require('react-native-maps').Circle;
const PROVIDER_GOOGLE = isWeb ? undefined : require('react-native-maps').PROVIDER_GOOGLE;
import DraggableFlatList, {
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import * as Haptics from '../lib/haptics';

import { COLORS, FONTS, SPACING, RADIUS, AFFILIATES } from '../lib/constants';
import { useDestinationTheme } from '../lib/useDestinationTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useAppStore, type Trip } from '../lib/store';
import {
  parseItinerary,
  type Itinerary,
  type ItineraryDay,
  type TimeSlotActivity,
} from '../lib/types/itinerary';
import { getWeatherForecast, type WeatherForecast } from '../lib/weather';
import { generatePackingList } from '../lib/packing-ai';
import { enrichVenues, getTodayHours, type EnrichedVenue } from '../lib/venues';
import { saveItineraryOffline } from '../lib/offline';
import { exportCalendar } from '../lib/calendar';
import { shareTrip, copyShareableLink } from '../lib/sharing';
import { buildDayNarration } from '../lib/elevenlabs';
import WeatherCard from '../components/features/WeatherCard';
import WeatherDayStrip from '../components/features/WeatherDayStrip';
import RainAlternativesCard from '../components/features/RainAlternativesCard';
import VenueCard from '../components/features/VenueCard';
import VoiceGuide from '../components/features/VoiceGuide';
import PackingList from '../components/features/PackingList';
import ShareCard from '../components/features/ShareCard';
import BreathingLine from '../components/ui/BreathingLine';
import { SkeletonCard } from '../components/premium/LoadingStates';
import BudgetChart from '../components/features/BudgetChart';
import SafetyScoreCard from '../components/features/SafetyScoreCard';
import SafetyScoreBadge from '../components/features/SafetyScoreBadge';
import VisaChecker from '../components/features/VisaChecker';
import TripEventsCard from '../components/features/TripEventsCard';
import BookingCards from '../components/features/BookingCards';
import EmergencySOS from '../components/features/EmergencySOS';
import FlightCard from '../components/features/FlightCard';
import FlightDealCard from '../components/features/FlightDealCard';
import LocalEventsSection from '../components/features/LocalEventsSection';
import TripSoundtrackCard from '../components/features/TripSoundtrackCard';
import CarbonFootprintCard from '../components/features/CarbonFootprintCard';
import PriceOracleCard from '../components/features/PriceOracleCard';
import LanguageSurvivalSection from '../components/features/LanguageSurvivalSection';
import TripInsuranceCards from '../components/features/TripInsuranceCards';
import ReturnTripSection from '../components/features/ReturnTripSection';
import CurrencyToggle, { useCurrency } from '../components/features/CurrencyToggle';
import MapboxRouteMap from '../components/features/MapboxRouteMap';
import {
  buildSafetyZones,
  SAFETY_COLORS,
  type TimeOfDay,
} from '../lib/neighborhood-safety';
import { formatDualPrice, formatLocalPrice, type ExchangeRates } from '../lib/currency';
import { AlertTriangle, X, Pencil, Calendar, Link2, Share2, MapPin, Receipt, Film, Wallet } from 'lucide-react-native';
import { getHeroPhotoUrl } from '../lib/heroPhotos';
import { trackItineraryView, maybePromptForReview } from '../lib/rating';
import { maybePromptNPS } from '../lib/nps';
import MockDataBadge from '../components/ui/MockDataBadge';

// =============================================================================
// Component
// =============================================================================
export default function ItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ data?: string; tripId?: string; map?: string }>();
  const trips = useAppStore((s) => s.trips);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [parsed, setParsed] = useState<Itinerary | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [venueData, setVenueData] = useState<Map<string, EnrichedVenue>>(new Map());
  const [activeDay, setActiveDay] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>(params.map === '1' ? 'map' : 'list');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [safetyOverlay, setSafetyOverlay] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<typeof MapView>(null);
  const dayPagerRef = useRef<ScrollView>(null);
  const updateTrip = useAppStore((s) => s.updateTrip);
  const addTrip = useAppStore((s) => s.addTrip);

  const isSharedTrip = trip?.id?.startsWith('shared-') ?? false;

  // Currency conversion hook — live exchange rates
  const { currency, rates } = useCurrency();

  // Destination color theme — shifts accent colors per destination
  const destTheme = useDestinationTheme(trip?.destination);

  // ---------------------------------------------------------------------------
  // Resolve trip from params
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let npsTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      let resolved: Trip | null = null;

      if (params.data) {
        resolved = JSON.parse(params.data) as Trip;
      } else if (params.tripId) {
        resolved = trips.find((t) => t.id === params.tripId) ?? null;
      }

      if (!resolved) {
        setError('Couldn\u2019t find that trip. It may have been removed \u2014 head back and try again.');
        return;
      }

      setTrip(resolved);

      // Parse itinerary
      const itinerary = parseItinerary(resolved.itinerary);
      setParsed(itinerary);

      // Save offline
      saveItineraryOffline(resolved.id, itinerary).catch(() => {});

      // Track for rating prompt — ask after first itinerary
      trackItineraryView().then(() => {
        maybePromptForReview().catch(() => {});
      });

      // NPS survey — after 3rd trip, delayed so user sees itinerary first
      const tripCount = trips.length;
      if (tripCount >= 3) {
        npsTimer = setTimeout(() => {
          maybePromptNPS(tripCount, () => router.push('/referral')).catch(() => {});
        }, 8000);
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went sideways loading your trip. Give it another shot.'
      );
    }
    return () => { if (npsTimer) clearTimeout(npsTimer); };
  }, [params.data, params.tripId, trips.length, router]);

  // ---------------------------------------------------------------------------
  // Fetch weather (aligned to trip dates when available)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!trip) return;
    const startDate = trip.createdAt ? trip.createdAt.split('T')[0] : undefined;
    getWeatherForecast(trip.destination, {
      startDate,
      days: trip.days,
    })
      .then(setWeather)
      .catch(() => setWeather(null));
  }, [trip?.destination, trip?.createdAt, trip?.days]);

  // ---------------------------------------------------------------------------
  // Fetch venue enrichment data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!parsed || !trip) return;

    // Collect all unique activity + accommodation names
    const queries: Array<{ name: string; city: string; key: string }> = [];

    for (const day of parsed.days) {
      for (const slot of ['morning', 'afternoon', 'evening'] as const) {
        const activity = day[slot];
        queries.push({
          name: activity.activity,
          city: trip.destination,
          key: activity.activity,
        });
      }
      // Also enrich accommodation
      queries.push({
        name: day.accommodation.name,
        city: trip.destination,
        key: `accom::${day.accommodation.name}`,
      });
    }

    // Deduplicate by key
    const seen = new Set<string>();
    const unique = queries.filter((q) => {
      if (seen.has(q.key)) return false;
      seen.add(q.key);
      return true;
    });

    enrichVenues(unique.map((q) => ({ name: q.name, city: q.city })))
      .then((results) => {
        const map = new Map<string, EnrichedVenue>();
        unique.forEach((q, i) => {
          const result = results[i];
          if (result) {
            map.set(q.key, result);
          }
        });
        setVenueData(map);
      })
      .catch(() => setVenueData(new Map()));
  }, [parsed, trip?.destination]);

  // ---------------------------------------------------------------------------
  // Derived data for the active day
  // ---------------------------------------------------------------------------
  const currentDay: ItineraryDay | undefined = parsed?.days[activeDay];

  // Packing AI — personalized list from weather + activities + trip length
  const packingResult = useMemo(() => {
    if (!parsed || !trip || !weather) return null;
    try {
      return generatePackingList({
        destination: trip.destination,
        days: trip.days,
        vibes: trip.vibes,
        budget: trip.budget,
        itinerary: parsed,
        weatherForecast: weather,
      });
    } catch {
      return null;
    }
  }, [parsed, trip?.destination, trip?.days, trip?.vibes, trip?.budget, weather]);

  const narrationText = useMemo(() => {
    if (!currentDay || !trip) return '';
    return buildDayNarration({
      destination: trip.destination,
      dayNumber: currentDay.day,
      theme: currentDay.theme,
      morning: currentDay.morning,
      afternoon: currentDay.afternoon,
      evening: currentDay.evening,
    });
  }, [currentDay, trip]);

  // ---------------------------------------------------------------------------
  // Map pins for the active day
  // ---------------------------------------------------------------------------
  const mapPins = useMemo(() => {
    if (!currentDay) return [];
    const slots = ['morning', 'afternoon', 'evening'] as const;
    const pins: Array<{
      key: string;
      label: string;
      index: number;
      slot: 'morning' | 'afternoon' | 'evening';
      lat: number;
      lng: number;
      venue: EnrichedVenue;
    }> = [];

    slots.forEach((slot, i) => {
      const activity = currentDay[slot];
      const venue = venueData.get(activity.activity);
      if (venue?.lat != null && venue?.lng != null) {
        pins.push({
          key: `${slot}-${activity.activity}`,
          label: slot.charAt(0).toUpperCase() + slot.slice(1),
          index: i + 1,
          slot,
          lat: venue.lat,
          lng: venue.lng,
          venue,
        });
      }
    });

    return pins;
  }, [currentDay, venueData]);

  const safetyZones = useMemo(() => {
    if (!safetyOverlay || mapPins.length === 0) return [];
    return buildSafetyZones(
      mapPins.map((p) => ({ lat: p.lat, lng: p.lng, slot: p.slot }))
    );
  }, [mapPins, safetyOverlay]);

  // Fit map to show all pins when pins change
  useEffect(() => {
    if (viewMode === 'map' && mapPins.length > 0 && mapRef.current) {
      const coords = mapPins.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 300, left: 60 },
        animated: true,
      });
    }
  }, [mapPins, viewMode]);

  const totalBudgetNumeric = useMemo(() => {
    if (!parsed) return undefined;
    const num = parseFloat(parsed.totalBudget.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? undefined : num;
  }, [parsed]);

  // ---------------------------------------------------------------------------
  // Draggable activities for current day
  // ---------------------------------------------------------------------------
  type DraggableActivity = {
    key: string;
    slot: 'morning' | 'afternoon' | 'evening';
    data: TimeSlotActivity;
  };

  const draggableActivities = useMemo<DraggableActivity[]>(() => {
    if (!currentDay) return [];
    return (['morning', 'afternoon', 'evening'] as const).map((slot) => ({
      key: `${activeDay}-${slot}`,
      slot,
      data: currentDay[slot],
    }));
  }, [currentDay, activeDay]);

  const handleReorder = useCallback(
    ({ data: reordered }: { data: DraggableActivity[] }) => {
      if (!parsed || !trip) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Build the updated day by assigning reordered activities to the 3 fixed slots
      const slots = ['morning', 'afternoon', 'evening'] as const;
      const updatedDay: ItineraryDay = { ...parsed.days[activeDay] };
      slots.forEach((slot, i) => {
        updatedDay[slot] = reordered[i].data;
      });

      const updatedDays = [...parsed.days];
      updatedDays[activeDay] = updatedDay;
      const updatedItinerary: Itinerary = { ...parsed, days: updatedDays };

      setParsed(updatedItinerary);

      // Persist to store + offline
      const updatedItineraryStr = JSON.stringify(updatedItinerary);
      updateTrip(trip.id, { itinerary: updatedItineraryStr });
      saveItineraryOffline(trip.id, updatedItinerary).catch(() => {});
    },
    [parsed, trip, activeDay, updateTrip]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const openAffiliate = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Hmm', 'Couldn\u2019t open that link. Try copying it manually or check your connection.')
    );
  }, []);

  const handleGetDirections = useCallback((placeId: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination_place_id=${placeId}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Hmm', 'Couldn\u2019t open Maps. Make sure you have a maps app installed.')
    );
  }, []);

  const handleCalendarExport = useCallback(() => {
    if (!parsed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const startDate = trip?.createdAt ? new Date(trip.createdAt) : new Date();
    exportCalendar(parsed, startDate).catch(() =>
      Alert.alert('Export Failed', 'Couldn\u2019t add this to your calendar. Check that ROAM has calendar access in Settings.')
    );
  }, [parsed, trip]);

  const handleShareLink = useCallback(async () => {
    if (!trip) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const shared = await shareTrip(trip);
    if (!shared) {
      const copied = await copyShareableLink(trip);
      if (copied) Alert.alert('Copied!', 'Share link copied to clipboard.');
    }
  }, [trip]);

  // ---------------------------------------------------------------------------
  // Venue card renderer
  // ---------------------------------------------------------------------------
  const renderVenueCard = (activityKey: string) => {
    const venue = venueData.get(activityKey);
    if (!venue) return null;
    return (
      <View style={styles.section}>
        <VenueCard
          name={venue.name}
          photo_url={venue.photo_url}
          rating={venue.rating}
          reviews_count={venue.user_ratings_total}
          address={venue.formatted_address}
          open_now={venue.opening_hours?.open_now ?? null}
          hours_today={getTodayHours(venue.opening_hours?.weekday_text)}
          maps_url={venue.maps_url}
          city={trip?.destination}
        />
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}><AlertTriangle size={48} color={COLORS.coral} strokeWidth={1.5} /></View>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Head back and try building your trip again.</Text>
          <Pressable onPress={handleClose} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading state — skeleton matching itinerary layout
  // ---------------------------------------------------------------------------
  if (!parsed || !trip) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingHorizontal: SPACING.lg }]}>
          <View style={[styles.headerLeft, { width: 44 }]}>
            <SkeletonCard width={44} height={44} borderRadius={RADIUS.md} />
          </View>
          <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
            <SkeletonCard width="100%" height={20} borderRadius={RADIUS.md} />
          </View>
          <View style={[styles.headerRight, { width: 44 }]}>
            <SkeletonCard width={44} height={44} borderRadius={RADIUS.md} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingVertical: SPACING.md }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} width={72} height={40} borderRadius={RADIUS.full} />
          ))}
        </ScrollView>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}>
          <SkeletonCard width="100%" height={180} borderRadius={RADIUS.lg} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
        </ScrollView>
        <View style={{ paddingBottom: insets.bottom + SPACING.md, alignItems: 'center' }}>
          <BreathingLine width={80} height={4} color={destTheme.primary} />
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <X size={22} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {parsed.destination}
        </Text>

        <View style={styles.headerRight}>
          {/* Currency toggle — subtle pill */}
          <CurrencyToggle subtle />
          {/* Edit mode toggle */}
          {viewMode === 'list' && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditMode((prev) => !prev);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.headerBtn,
                editMode && styles.editBtnActive,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Pencil size={20} color={COLORS.cream} strokeWidth={2} />
            </Pressable>
          )}

          {/* Calendar export */}
          <Pressable
            onPress={handleCalendarExport}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Calendar size={20} color={COLORS.cream} strokeWidth={2} />
          </Pressable>

          {/* List / Map toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'list' && styles.viewToggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === 'list' && styles.viewToggleTextActive,
                ]}
              >
                List
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setViewMode('map');
                setSelectedPin(null);
              }}
              style={[
                styles.viewToggleBtn,
                viewMode === 'map' && styles.viewToggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === 'map' && styles.viewToggleTextActive,
                ]}
              >
                Map
              </Text>
            </Pressable>
          </View>

          {/* Invite friends / group trip */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/create-group', params: { tripId: trip?.id } });
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.headerBtnText}>Invite</Text>
          </Pressable>

          {/* Share deep link */}
          <Pressable
            onPress={handleShareLink}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Link2 size={20} color={COLORS.cream} strokeWidth={2} />
          </Pressable>

          {/* Share card */}
          <Pressable
            onPress={() => setShareVisible(true)}
            hitSlop={12}
            accessibilityLabel="Share trip poster"
            accessibilityHint="Opens a 9:16 card you can save or share to Stories"
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Share2 size={20} color={COLORS.cream} strokeWidth={2} />
          </Pressable>

          {/* Viral cards */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/viral-cards', params: { tripId: trip?.id } });
            }}
            hitSlop={12}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.headerBtnText}>Viral</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Day tabs — themes as large editorial headlines ───────────────── */}
      <ScrollView
        ref={dayPagerRef}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabsContainer}
        style={styles.dayTabsScroll}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const offset = e.nativeEvent.contentOffset.x;
          const page = Math.round(offset / SCREEN_WIDTH);
          if (page >= 0 && page < parsed.days.length && page !== activeDay) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveDay(page);
            setSelectedPin(null);
          }
        }}
        scrollEventThrottle={16}
      >
        {parsed.days.map((d, i) => {
          const isActive = i === activeDay;
          return (
            <Pressable
              key={d.day}
              onPress={() => {
                dayPagerRef.current?.scrollTo({
                  x: i * SCREEN_WIDTH,
                  animated: true,
                });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveDay(i);
                setSelectedPin(null);
              }}
              style={[styles.dayTab, isActive && [styles.dayTabActive, { backgroundColor: `${destTheme.primary}1A`, borderColor: destTheme.primary }]]}
            >
              <Text
                style={[
                  styles.dayTabTheme,
                  isActive && styles.dayTabThemeActive,
                ]}
                numberOfLines={2}
              >
                {d.theme}
              </Text>
              <Text
                style={[
                  styles.dayTabNumber,
                  isActive && [styles.dayTabNumberActive, { color: destTheme.primary }],
                ]}
              >
                Day {d.day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Map view ───────────────────────────────────────────────────── */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.mapView}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            customMapStyle={darkMapStyle}
            initialRegion={{
              latitude: mapPins[0]?.lat ?? 0,
              longitude: mapPins[0]?.lng ?? 0,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Numbered pins */}
            {mapPins.map((pin) => (
              <Marker
                key={pin.key}
                coordinate={{
                  latitude: pin.lat,
                  longitude: pin.lng,
                }}
                onPress={() => setSelectedPin(pin.key)}
              >
                <View style={styles.pinContainer}>
                  <View style={styles.pinCircle}>
                    <Text style={styles.pinNumber}>{pin.index}</Text>
                  </View>
                  <View style={styles.pinTail} />
                </View>
              </Marker>
            ))}

            {/* Safety overlay — color-coded circles by time of day */}
            {!isWeb &&
              safetyZones.map((zone, i) => (
                <Circle
                  key={`safety-${i}`}
                  center={{ latitude: zone.lat, longitude: zone.lng }}
                  radius={zone.radiusMeters}
                  fillColor={SAFETY_COLORS[zone.level]}
                  strokeColor={SAFETY_COLORS[zone.level].replace('0.25', '0.6').replace('0.2', '0.5')}
                  strokeWidth={1}
                />
              ))}

            {/* Route polyline */}
            {mapPins.length >= 2 && (
              <Polyline
                coordinates={mapPins.map((p) => ({
                  latitude: p.lat,
                  longitude: p.lng,
                }))}
                strokeColor={destTheme.primary}
                strokeWidth={3}
                lineDashPattern={[6, 4]}
              />
            )}
          </MapView>

          {/* Safety overlay toggle */}
          {mapPins.length > 0 && !isWeb && (
            <Pressable
              style={[styles.safetyToggle, safetyOverlay && styles.safetyToggleActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSafetyOverlay((v) => !v);
              }}
            >
              <Text style={styles.safetyToggleText}>
                {safetyOverlay ? 'Safety on' : 'Safety'}
              </Text>
              {safetyOverlay && (
                <View style={styles.safetyLegend}>
                  <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS.safe }]} />
                  <Text style={styles.safetyLegendText}>AM</Text>
                  <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS.moderate }]} />
                  <Text style={styles.safetyLegendText}>PM</Text>
                  <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS.caution }]} />
                  <Text style={styles.safetyLegendText}>Eve</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* No pins fallback */}
          {mapPins.length === 0 && (
            <View style={styles.mapEmptyOverlay}>
              <Text style={styles.mapEmptyText}>
                No location data for this day yet
              </Text>
            </View>
          )}

          {/* Bottom sheet on pin tap */}
          {selectedPin && (() => {
            const pin = mapPins.find((p) => p.key === selectedPin);
            if (!pin) return null;
            return (
              <View style={[styles.mapSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
                <View style={styles.mapSheetHandle} />
                <VenueCard
                  name={pin.venue.name}
                  photo_url={pin.venue.photo_url}
                  rating={pin.venue.rating}
                  reviews_count={pin.venue.user_ratings_total}
                  address={pin.venue.formatted_address}
                  open_now={pin.venue.opening_hours?.open_now ?? null}
                  hours_today={getTodayHours(pin.venue.opening_hours?.weekday_text)}
                  maps_url={pin.venue.maps_url}
                />
                <Pressable
                  onPress={() => handleGetDirections(pin.venue.place_id)}
                  style={({ pressed }) => [
                    styles.directionsBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={styles.directionsBtnInner}>
                    <MapPin size={16} color={COLORS.bg} strokeWidth={2} />
                    <Text style={styles.directionsBtnText}>Get Directions</Text>
                  </View>
                </Pressable>
              </View>
            );
          })()}
        </View>
      ) : (
        /* ── List view ──────────────────────────────────────────────────── */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews={!isWeb}
        >
          {/* Hero — cinematic destination photo with tagline */}
          <View style={styles.heroWrapper}>
            <ImageBackground
              source={{ uri: getHeroPhotoUrl(parsed.destination) }}
              style={styles.heroImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(8,15,15,0.4)', 'rgba(8,15,15,0.9)']}
                locations={[0.2, 0.6, 1]}
                style={styles.heroGradient}
              >
                <Text style={styles.heroDestination}>{parsed.destination}</Text>
                <Text style={styles.heroTagline}>{parsed.tagline}</Text>
                <View style={[styles.heroMeta, { gap: SPACING.sm }]}>
                  <SafetyScoreBadge destination={trip?.destination ?? parsed.destination} variant="pill" />
                  <Text style={styles.heroMetaText}>
                    {parsed.days.length} days · {currency !== 'USD' && rates ? formatLocalPrice(parsed.totalBudget, currency, rates) : parsed.totalBudget}
                  </Text>
                </View>
                {trip?.isMockData && (
                  <View style={styles.mockBadgeWrap}>
                    <MockDataBadge label="Using sample data" />
                  </View>
                )}
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Steal this trip — when viewing a shared link */}
          {isSharedTrip && trip && (
            <View style={[styles.section, { marginTop: -SPACING.lg }]}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const stolen: Trip = {
                    id: `stolen-${Date.now()}`,
                    destination: trip.destination,
                    days: trip.days,
                    budget: trip.budget,
                    vibes: trip.vibes,
                    itinerary: trip.itinerary,
                    createdAt: new Date().toISOString(),
                  };
                  addTrip(stolen);
                  router.replace('/(tabs)/saved');
                }}
                style={({ pressed }) => [
                  styles.stealCtaCard,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.sage, '#5a9a6a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stealCtaGradient}
                >
                  <Text style={styles.stealCtaTitle}>Steal this trip</Text>
                  <Text style={styles.stealCtaSub}>Add to your trips and make it yours</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Share poster CTA — screenshot-worthy */}
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShareVisible(true);
              }}
              style={({ pressed }) => [
                styles.shareCtaCard,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareCtaGradient}
              >
                <View style={styles.shareCtaIconWrap}><Share2 size={28} color={COLORS.accentGold} strokeWidth={2} /></View>
                <View style={styles.shareCtaContent}>
                <Text style={styles.shareCtaTitle}>Share this trip</Text>
                <Text style={styles.shareCtaSub}>Create 9:16 poster for Stories</Text>
                </View>
                <Text style={styles.shareCtaArrow}>{'\u2192'}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* The Receipt + Main Character + Budget Guardian — trip extras */}
          <View style={styles.itineraryExtrasRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/trip-receipt', params: { tripId: trip.id } });
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Receipt size={24} color={COLORS.accentGold} strokeWidth={2} /></View>
                <Text style={styles.itineraryExtraTitle}>The Receipt</Text>
                <Text style={styles.itineraryExtraSub}>Cost breakdown</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/main-character', params: { tripId: trip.id } });
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Film size={24} color={COLORS.accentGold} strokeWidth={2} /></View>
                <Text style={styles.itineraryExtraTitle}>Main Character</Text>
                <Text style={styles.itineraryExtraSub}>Your trip as a story</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/budget-guardian', params: { tripId: trip.id } });
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Wallet size={24} color={COLORS.accentGold} strokeWidth={2} /></View>
                <Text style={styles.itineraryExtraTitle}>Budget Guardian</Text>
                <Text style={styles.itineraryExtraSub}>Track spending</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Weather card */}
          {weather && (
            <View style={styles.section}>
              <WeatherCard forecast={weather} />
            </View>
          )}

          {/* City safety score (US State Dept) */}
          <View style={styles.section}>
            <SafetyScoreCard destination={trip.destination} />
          </View>

          {/* Return Trip — what's new since last visit (only if prior trip to same dest) */}
          {trips.some((t) => t.id !== trip.id && t.destination.toLowerCase().includes(trip.destination.toLowerCase())) && (
            <View style={styles.section}>
              <ReturnTripSection
                destination={trip.destination}
                trips={trips}
                currentTripId={trip.id}
              />
            </View>
          )}

          {/* Visa & entry requirements (multi-passport) */}
          <View style={styles.section}>
            <VisaChecker destination={trip.destination} variant="full" />
          </View>

          {/* Trip Insurance — Safetywing + World Nomads */}
          <View style={styles.section}>
            <TripInsuranceCards destination={trip.destination} />
          </View>

          {/* Price Oracle — what your budget buys */}
          {totalBudgetNumeric && trip.days && (
            <View style={styles.section}>
              <PriceOracleCard
                destination={trip.destination}
                dailyBudget={Math.round(totalBudgetNumeric / trip.days)}
              />
            </View>
          )}

          {/* Local events during trip dates */}
          <View style={styles.section}>
            <TripEventsCard
              destination={trip.destination}
              startDate={new Date(trip.createdAt)}
              endDate={new Date(new Date(trip.createdAt).getTime() + trip.days * 24 * 60 * 60 * 1000)}
            />
          </View>

          {/* Budget chart — visual breakdown */}
          <View style={[styles.glassCard, styles.section]}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>BUDGET BREAKDOWN</Text>
            </View>
            <BudgetChart
              breakdown={parsed.budgetBreakdown}
              totalBudget={parsed.totalBudget}
              currency={currency}
              rates={rates}
            />
            <View style={styles.budgetDivider} />
            <BudgetRow
              label="Total"
              value={
                currency !== 'USD' && rates
                  ? formatDualPrice(parsed.totalBudget, currency, rates)
                  : parsed.totalBudget
              }
              bold
            />
          </View>

          {/* Local events during trip dates */}
          <LocalEventsSection
            city={trip.destination}
            startDate={trip.createdAt ? trip.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}
            endDate={(() => {
              const d = new Date(trip.createdAt || Date.now());
              d.setDate(d.getDate() + trip.days);
              return d.toISOString().split('T')[0];
            })()}
          />

          {/* Real flight prices from Amadeus */}
          <View style={styles.section}>
            <FlightCard destination={trip.destination} tripDays={trip.days} />
          </View>

          {/* Flight deal hunter — watch prices, get 20% drop alerts */}
          <View style={styles.section}>
            <FlightDealCard destination={trip.destination} />
          </View>

          {/* Current day theme — editorial headline */}
          {currentDay && (
            <View style={styles.dayThemeHero}>
              <Text style={styles.dayThemeNumber}>DAY {currentDay.day}</Text>
              <Text style={styles.dayThemeTitle}>{currentDay.theme}</Text>
            </View>
          )}

          {/* Weather strip for this day */}
          {currentDay && weather?.days[activeDay] && (
            <View style={styles.section}>
              <WeatherDayStrip
                day={weather.days[activeDay]}
                label={`Day ${currentDay.day}`}
                accentColor={destTheme.primary}
              />
              <View style={{ marginTop: SPACING.sm }}>
                <RainAlternativesCard
                  day={weather.days[activeDay]}
                  itineraryDay={currentDay}
                  destination={trip.destination}
                  accentColor={destTheme.primary}
                />
              </View>
            </View>
          )}

          {/* Mapbox dark-styled route map for the day */}
          {currentDay && (
            <View style={styles.section}>
              <MapboxRouteMap
                day={currentDay}
                city={trip.destination}
              />
            </View>
          )}

          {/* Current day content */}
          {currentDay && (
            <>
              {/* Time blocks with venue cards — draggable in edit mode */}
              {editMode ? (
                <View style={styles.draggableWrapper}>
                  <DraggableFlatList
                    data={draggableActivities}
                    keyExtractor={(item) => item.key}
                    onDragEnd={handleReorder}
                    scrollEnabled={false}
                    renderItem={({
                      item,
                      drag,
                      isActive: isDragging,
                    }: RenderItemParams<DraggableActivity>) => (
                      <Pressable
                        onLongPress={drag}
                        disabled={isDragging}
                        style={[
                          styles.draggableItem,
                          isDragging && styles.draggableItemActive,
                        ]}
                      >
                        <View style={styles.dragHandle}>
                          <Text style={styles.dragHandleText}>{'\u2801\u2801\u2801'}</Text>
                        </View>
                        <View style={styles.draggableContent}>
                          <TimeBlock slot={item.slot} data={item.data} currency={currency} rates={rates} />
                          {renderVenueCard(item.data.activity)}
                        </View>
                      </Pressable>
                    )}
                  />
                </View>
              ) : (
                <>
                  <TimeBlock slot="morning" data={currentDay.morning} currency={currency} rates={rates} />
                  {renderVenueCard(currentDay.morning.activity)}
                  <TimeBlock slot="afternoon" data={currentDay.afternoon} currency={currency} rates={rates} />
                  {renderVenueCard(currentDay.afternoon.activity)}
                  <TimeBlock slot="evening" data={currentDay.evening} currency={currency} rates={rates} />
                  {renderVenueCard(currentDay.evening.activity)}
                </>
              )}

              {/* Accommodation card */}
              <View style={[styles.glassCard, styles.section]}>
                <Text style={styles.sectionLabel}>ACCOMMODATION</Text>
                <Text style={styles.accommodationName}>
                  {currentDay.accommodation.name}
                </Text>
                <View style={styles.accommodationMeta}>
                  <Text style={styles.accommodationType}>
                    {currentDay.accommodation.type}
                  </Text>
                  <Text style={styles.accommodationPrice}>
                    {currency !== 'USD' && rates ? formatLocalPrice(currentDay.accommodation.pricePerNight, currency, rates) : currentDay.accommodation.pricePerNight}/night
                  </Text>
                </View>
              </View>
              {renderVenueCard(`accom::${currentDay.accommodation.name}`)}

              {/* Daily total */}
              <View style={[styles.glassCard, styles.section]}>
                <View style={styles.dailyTotalRow}>
                  <Text style={styles.dailyTotalLabel}>
                    Day {currentDay.day} Total
                  </Text>
                  <Text style={styles.dailyTotalValue}>
                    {currency !== 'USD' && rates ? formatLocalPrice(currentDay.dailyCost, currency, rates) : currentDay.dailyCost}
                  </Text>
                </View>
              </View>

              {/* Voice guide */}
              {narrationText.length > 0 && (
                <View style={styles.section}>
                  <VoiceGuide
                    text={narrationText}
                    label={`Listen to Day ${currentDay.day}`}
                  />
                </View>
              )}
            </>
          )}

          {/* Pro Tip card */}
          {parsed.proTip ? (
            <View style={[styles.glassCard, styles.section]}>
              <Text style={styles.proTipLabel}>LOCAL PRO TIP</Text>
              <Text style={styles.proTipText}>{parsed.proTip}</Text>
            </View>
          ) : null}

          {/* Visa Info card */}
          {parsed.visaInfo ? (
            <View style={[styles.glassCard, styles.section]}>
              <Text style={styles.visaLabel}>VISA INFO</Text>
              <Text style={styles.visaText}>{parsed.visaInfo}</Text>
            </View>
          ) : null}

          {/* Affiliate cards */}
          <View style={styles.section}>
            <AffiliateCard
              title="Book your stay"
              subtitle="Find the best hotels on Booking.com"
              gradientColors={['#003580', '#0057B8']}
              onPress={() => openAffiliate(AFFILIATES.booking)}
            />
          </View>

          <View style={styles.section}>
            <AffiliateCard
              title="Book activities"
              subtitle="Tours & experiences on GetYourGuide"
              gradientColors={['#C5162E', '#E8301C']}
              onPress={() => openAffiliate(AFFILIATES.getyourguide)}
            />
          </View>

          <View style={styles.section}>
            <AffiliateCard
              title="Find flights"
              subtitle="Compare cheap flights on Skyscanner"
              gradientColors={['#0770E3', '#00A4E8']}
              onPress={() => openAffiliate(AFFILIATES.skyscanner)}
            />
          </View>

          {/* Trip Soundtrack — one tap to Spotify */}
          <View style={styles.section}>
            <TripSoundtrackCard destination={trip.destination} />
          </View>

          {/* Carbon footprint — flight emissions + offset */}
          <View style={styles.section}>
            <CarbonFootprintCard
              origin="JFK"
              destination={trip.destination}
              roundTrip
            />
          </View>

          {/* Language Survival — 50 essential phrases, tap for TTS */}
          <View style={styles.section}>
            <LanguageSurvivalSection destination={trip.destination} />
          </View>

          {/* Packing list — AI-personalized from weather + activities + trip length */}
          <View style={styles.section}>
            <PackingList
              essentials={parsed.packingEssentials}
              destination={trip.destination}
              weatherHint={weather?.packingHint}
              packingResult={packingResult ?? undefined}
              tripId={trip.id}
              skipList={packingResult?.skipList}
            />
          </View>

          {/* Affiliate booking cards */}
          <View style={styles.section}>
            <BookingCards
              destination={trip.destination}
              countryCode={trip.destination}
              days={trip.days}
              budget={trip.budget}
              tripId={trip.id}
            />
          </View>

          {/* Love this trip? Save it — one tap to Trips */}
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/(tabs)/saved');
              }}
              style={({ pressed }) => [
                styles.saveTripCard,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}33`, `${destTheme.primary}14`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveTripGradient}
              >
                <View style={styles.saveTripContent}>
                  <Text style={styles.saveTripTitle}>Love this trip? Save it</Text>
                  <Text style={styles.saveTripSub}>One tap — saved to My Trips</Text>
                </View>
                <Text style={styles.saveTripCta}>View Trips</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── Emergency SOS ─────────────────────────────────────────────── */}
      <EmergencySOS />

      {/* ── Share modal ────────────────────────────────────────────────── */}
      <Modal
        visible={shareVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ShareCard
              trip={trip}
              totalBudget={totalBudgetNumeric}
              dailyBudget={
                totalBudgetNumeric && trip.days
                  ? Math.round(totalBudgetNumeric / trip.days)
                  : undefined
              }
              tagline={parsed.tagline}
              dayThemes={parsed.days.map((d) => d.theme)}
              onDismiss={() => setShareVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

// ── Activity card (venue, neighborhood, cost, tip) ──────────────────────────
const SLOT_LABELS: Record<string, { label: string }> = {
  morning: { label: 'MORNING' },
  afternoon: { label: 'AFTERNOON' },
  evening: { label: 'EVENING' },
};

const TimeBlock = React.memo(function TimeBlock({
  slot,
  data,
  currency,
  rates,
}: {
  slot: 'morning' | 'afternoon' | 'evening';
  data: TimeSlotActivity;
  currency?: string;
  rates?: ExchangeRates | null;
}) {
  const meta = SLOT_LABELS[slot];
  const costDisplay = currency && currency !== 'USD' && rates
    ? formatLocalPrice(data.cost, currency, rates)
    : data.cost;

  return (
    <View style={[styles.glassCard, styles.section]}>
      <Text style={styles.timeSlotLabel}>
        {meta.label}
      </Text>

      <Text style={styles.activityTitle}>{data.activity}</Text>

      <View style={styles.activityMeta}>
        <View style={styles.neighborhoodRow}>
          <Text style={styles.neighborhoodLabel}>Neighborhood</Text>
          <Text style={styles.neighborhoodValue}>{data.location}</Text>
        </View>
        <View style={styles.costBadge}>
          <Text style={styles.costText}>{costDisplay}</Text>
        </View>
      </View>

      {data.tip ? (
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>Local tip</Text>
          <Text style={styles.tipText}>{data.tip}</Text>
        </View>
      ) : null}
    </View>
  );
});

// ── Budget row ──────────────────────────────────────────────────────────────
function BudgetRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.budgetRow}>
      <Text
        style={[
          styles.budgetRowLabel,
          bold && styles.budgetRowBold,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.budgetRowValue,
          bold && styles.budgetRowBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Affiliate card ──────────────────────────────────────────────────────────
function AffiliateCard({
  title,
  subtitle,
  gradientColors,
  onPress,
}: {
  title: string;
  subtitle: string;
  gradientColors: [string, string];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.affiliateGradient}
      >
        <View style={styles.affiliateContent}>
          <Text style={styles.affiliateTitle}>{title}</Text>
          <Text style={styles.affiliateSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.affiliateArrow}>→</Text>
      </LinearGradient>
    </Pressable>
  );
}

// =============================================================================
// Dark map style (matches ROAM dark UI)
// =============================================================================
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a2e27' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7caf8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1f1a' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#243b33' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5a8a66' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a1812' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1e3329' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5a8a66' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e3329' }],
  },
];

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  // ── Screen ──────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerBtnText: {
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginHorizontal: SPACING.sm,
  } as TextStyle,

  // ── View toggle (List / Map) ───────────────────────────────────────────
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  viewToggleBtn: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  viewToggleBtnActive: {
    backgroundColor: COLORS.sageLight,
  } as ViewStyle,
  viewToggleText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.creamMutedLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  viewToggleTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  // ── Scroll ──────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  } as ViewStyle,

  // ── Hero (cinematic) ────────────────────────────────────────────────────
  heroWrapper: {
    width: SCREEN_WIDTH,
    height: 280,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  } as ViewStyle,
  heroGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xl + 8,
    justifyContent: 'flex-end',
    flex: 1,
  } as ViewStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  heroTagline: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: 'rgba(248,250,252,0.85)',
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  } as TextStyle,
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  heroMetaText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  mockBadgeWrap: {
    marginTop: SPACING.sm,
  } as ViewStyle,

  // ── Share CTA ────────────────────────────────────────────────────────────
  stealCtaCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  stealCtaGradient: {
    padding: SPACING.lg,
  } as ViewStyle,
  stealCtaTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.bg,
  } as TextStyle,
  stealCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(8,15,10,0.8)',
    marginTop: 4,
  } as TextStyle,
  shareCtaCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    overflow: 'hidden',
  } as ViewStyle,
  shareCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  shareCtaIconWrap: {
    marginRight: SPACING.sm,
  } as ViewStyle,
  shareCtaContent: {
    flex: 1,
  } as ViewStyle,
  shareCtaTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  shareCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  shareCtaArrow: {
    fontSize: 20,
    color: COLORS.sage,
  } as TextStyle,

  itineraryExtrasRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  itineraryExtraCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.2)',
    overflow: 'hidden',
  } as ViewStyle,
  itineraryExtraGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  itineraryExtraIconWrap: {
    marginBottom: SPACING.xs,
  } as ViewStyle,
  itineraryExtraTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  itineraryExtraSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // ── Save trip CTA ───────────────────────────────────────────────────────
  saveTripCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.35)',
    overflow: 'hidden',
  } as ViewStyle,
  saveTripGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  saveTripContent: {
    flex: 1,
  } as ViewStyle,
  saveTripTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.cream,
  } as TextStyle,
  saveTripSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  saveTripCta: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // ── Day theme editorial headline ────────────────────────────────────────
  dayThemeHero: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  dayThemeNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,
  dayThemeTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 34,
    letterSpacing: -0.3,
  } as TextStyle,

  // ── Sections ────────────────────────────────────────────────────────────
  section: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  // ── Glass card ──────────────────────────────────────────────────────────
  glassCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,

  // ── Tagline + budget summary ────────────────────────────────────────────
  tagline: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    lineHeight: 30,
    marginBottom: SPACING.md,
  } as TextStyle,
  totalBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  totalBudgetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  totalBudgetValue: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
  } as TextStyle,

  // ── Budget breakdown ────────────────────────────────────────────────────
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  budgetRowLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  budgetRowValue: {
    fontFamily: FONTS.monoMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  budgetRowBold: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
    fontSize: 16,
  } as TextStyle,
  budgetDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  } as ViewStyle,

  // ── Day tabs ────────────────────────────────────────────────────────────
  dayTabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  dayTabsContainer: {
    paddingVertical: SPACING.md,
  } as ViewStyle,
  dayTab: {
    width: SCREEN_WIDTH,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dayTabActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  dayTabTheme: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: 'rgba(248,250,252,0.7)',
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: SPACING.xs,
  } as TextStyle,
  dayTabThemeActive: {
    color: COLORS.cream,
    fontFamily: FONTS.headerMedium,
    fontSize: 24,
  } as TextStyle,
  dayTabNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  dayTabNumberActive: {
    color: COLORS.sage,
  } as TextStyle,

  // ── Time slots ──────────────────────────────────────────────────────────
  timeSlotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  activityTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 20,
    color: COLORS.cream,
    lineHeight: 26,
    marginBottom: SPACING.sm,
  } as TextStyle,
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  locationPin: {
    fontSize: 14,
  } as TextStyle,
  locationText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamHighlight,
    flex: 1,
  } as TextStyle,
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  } as ViewStyle,
  neighborhoodRow: {
    flex: 1,
  } as ViewStyle,
  neighborhoodLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 2,
  } as TextStyle,
  neighborhoodValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  tipCard: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  tipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamBright,
    fontStyle: 'italic',
    lineHeight: 19,
  } as TextStyle,
  costBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  costText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  // ── Accommodation ───────────────────────────────────────────────────────
  accommodationName: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.xs + 2,
  } as TextStyle,
  accommodationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  accommodationType: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
  } as TextStyle,
  accommodationPrice: {
    fontFamily: FONTS.monoMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // ── Daily total ─────────────────────────────────────────────────────────
  dailyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  dailyTotalLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  dailyTotalValue: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.sage,
  } as TextStyle,

  // ── Pro Tip ─────────────────────────────────────────────────────────────
  proTipLabel: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  proTipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  // ── Visa Info ───────────────────────────────────────────────────────────
  visaLabel: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  visaText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  // ── Affiliate cards ─────────────────────────────────────────────────────
  affiliateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm + 2,
  } as ViewStyle,
  affiliateContent: {
    flex: 1,
  } as ViewStyle,
  affiliateTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 2,
  } as TextStyle,
  affiliateSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  } as TextStyle,
  affiliateArrow: {
    fontSize: 20,
    color: COLORS.white,
  } as TextStyle,

  // ── Share modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalContent: {
    width: '100%',
    maxWidth: 400,
  } as ViewStyle,

  // ── Error / Loading ─────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  } as ViewStyle,
  errorIconWrap: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  errorHint: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.coral,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  } as TextStyle,
  errorButton: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
  } as ViewStyle,
  errorButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  loadingText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  loadingSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    opacity: 0.7,
  } as TextStyle,
  loadingPulse: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.sageLight,
    opacity: 0.4,
  } as ViewStyle,

  // ── Edit mode ─────────────────────────────────────────────────────────
  editBtnActive: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  draggableWrapper: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  draggableItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  draggableItemActive: {
    opacity: 0.85,
    transform: [{ scale: 1.02 }],
  } as ViewStyle,
  dragHandle: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.lg,
  } as ViewStyle,
  dragHandleText: {
    fontSize: 18,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  draggableContent: {
    flex: 1,
  } as ViewStyle,

  // ── Map view ──────────────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
  } as ViewStyle,
  mapView: {
    flex: 1,
  } as ViewStyle,
  mapEmptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13,31,26,0.85)',
  } as ViewStyle,
  mapEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
  safetyToggle: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  safetyToggleActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageHighlight,
  } as ViewStyle,
  safetyToggleText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  safetyLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  } as ViewStyle,
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  safetyLegendText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    marginRight: 4,
  } as TextStyle,

  // ── Map pins ──────────────────────────────────────────────────────────
  pinContainer: {
    alignItems: 'center',
  } as ViewStyle,
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.cream,
  } as ViewStyle,
  pinNumber: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.sage,
    marginTop: -1,
  } as ViewStyle,

  // ── Map bottom sheet ──────────────────────────────────────────────────
  mapSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    maxHeight: 320,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  mapSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  directionsBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  } as ViewStyle,
  directionsBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  directionsBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});
