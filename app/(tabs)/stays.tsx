// =============================================================================
// ROAM — Accommodation Discovery
// Editorial travel magazine, not booking engine
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  DESTINATION_THEME_PALETTES,
} from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import {
  SlidersHorizontal,
  MapPin,
  Star,
  Heart,
  Building2,
  ExternalLink,
} from 'lucide-react-native';
import { getCoordsForDestination } from '../../lib/destination-coords';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import * as Linking from 'expo-linking';
import { getHotelLink, openBookingLink } from '../../lib/booking-links';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StayType =
  | 'all'
  | 'hostel'
  | 'hotel'
  | 'airbnb'
  | 'boutique'
  | 'villa'
  | 'capsule';

export interface StayListing {
  id: string;
  name: string;
  type: StayType;
  neighborhood: string;
  vibe: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  pricePerNight: number;
  lat: number;
  lng: number;
}

const STAY_TYPES: { id: StayType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hostel', label: 'Hostel' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'airbnb', label: 'Airbnb' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'villa', label: 'Villa' },
  { id: 'capsule', label: 'Capsule' },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

// Destination-specific neighborhoods for realistic listings
const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  Tokyo: ['Shinjuku', 'Shibuya', 'Roppongi', 'Asakusa', 'Ginza'],
  Paris: ['Le Marais', 'Montmartre', 'Saint-Germain', 'Bastille', 'Belleville'],
  Bali: ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Jimbaran'],
  'New York': ['Williamsburg', 'Lower East Side', 'SoHo', 'Chelsea', 'Bushwick'],
  Barcelona: ['El Born', 'Gràcia', 'Eixample', 'Gothic Quarter', 'Barceloneta'],
  Bangkok: ['Silom', 'Sukhumvit', 'Khao San', 'Thonglor', 'Chinatown'],
  Lisbon: ['Alfama', 'Bairro Alto', 'Mouraria', 'Santos', 'Príncipe Real'],
  'Mexico City': ['Roma Norte', 'Condesa', 'Coyoacán', 'Juárez', 'Polanco'],
  Budapest: ['District VII', 'District V', 'Buda Castle', 'Erzsébetváros', 'Óbuda'],
  Marrakech: ['Medina', 'Gueliz', 'Kasbah', 'Mellah', 'Hivernage'],
  'Cape Town': ['Bo-Kaap', 'Woodstock', 'Sea Point', 'Gardens', 'Green Point'],
  Medellín: ['El Poblado', 'Laureles', 'Envigado', 'La Candelaria', 'Belén'],
  Kyoto: ['Higashiyama', 'Gion', 'Arashiyama', 'Downtown', 'Fushimi'],
  'Buenos Aires': ['Palermo', 'San Telmo', 'Recoleta', 'La Boca', 'Belgrano'],
};

// Destination-aware stay templates
const STAY_TEMPLATES: { type: StayType; namePattern: string; vibe: string; ratingBase: number; reviewBase: number; priceMultiplier: number }[] = [
  { type: 'hostel', namePattern: '{dest} Social House', vibe: 'Social', ratingBase: 4.5, reviewBase: 1200, priceMultiplier: 0.15 },
  { type: 'boutique', namePattern: '{neighborhood} Boutique', vibe: 'Quiet', ratingBase: 4.8, reviewBase: 400, priceMultiplier: 1.2 },
  { type: 'airbnb', namePattern: 'Charming {neighborhood} Flat', vibe: 'Local', ratingBase: 4.7, reviewBase: 180, priceMultiplier: 0.6 },
  { type: 'hotel', namePattern: '{dest} Grand Hotel', vibe: 'Classic', ratingBase: 4.6, reviewBase: 2100, priceMultiplier: 0.9 },
  { type: 'capsule', namePattern: 'Pod {dest}', vibe: 'Digital Nomad', ratingBase: 4.4, reviewBase: 3000, priceMultiplier: 0.2 },
  { type: 'villa', namePattern: 'Villa {neighborhood}', vibe: 'Retreat', ratingBase: 4.9, reviewBase: 90, priceMultiplier: 2.0 },
];

// Base nightly price per destination (mid-range hotel in USD)
const BASE_PRICES: Record<string, number> = {
  Tokyo: 120, Paris: 160, Bali: 45, 'New York': 220, Barcelona: 110,
  Bangkok: 40, Lisbon: 90, 'Mexico City': 65, Budapest: 60, Marrakech: 50,
  'Cape Town': 70, Medellín: 45, Kyoto: 130, 'Buenos Aires': 55,
  Rome: 140, London: 180, Seoul: 100, Dubai: 200, Amsterdam: 150,
  Istanbul: 60, Sydney: 170, Porto: 80, Dubrovnik: 100, Santorini: 140,
};

function generateMockStays(destination: string): StayListing[] {
  const coords = getCoordsForDestination(destination) ?? { lat: 35.6762, lng: 139.6503 };
  const baseLat = coords.lat;
  const baseLng = coords.lng;
  const neighborhoods = CITY_NEIGHBORHOODS[destination] ?? ['Old Town', 'City Center', 'Arts District', 'Waterfront', 'University Quarter'];
  const basePrice = BASE_PRICES[destination] ?? 100;

  // Deterministic seed from destination name for consistent results
  const seed = destination.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return STAY_TEMPLATES.map((template, i) => {
    const neighborhood = neighborhoods[i % neighborhoods.length];
    const name = template.namePattern
      .replace('{dest}', destination.split(' ')[0])
      .replace('{neighborhood}', neighborhood);
    const offsetLat = ((seed + i * 17) % 10 - 5) * 0.001;
    const offsetLng = ((seed + i * 23) % 10 - 5) * 0.001;

    return {
      id: `${i + 1}`,
      name,
      type: template.type,
      neighborhood,
      vibe: template.vibe,
      rating: Math.round((template.ratingBase + ((seed + i) % 5) * 0.1) * 10) / 10,
      reviewCount: template.reviewBase + ((seed * (i + 1)) % 500),
      distanceKm: Math.round((0.3 + ((seed + i * 7) % 30) * 0.1) * 10) / 10,
      pricePerNight: Math.round(basePrice * template.priceMultiplier),
      lat: baseLat + offsetLat,
      lng: baseLng + offsetLng,
    };
  });
}

// ---------------------------------------------------------------------------
// Gradient seed from destination name
// ---------------------------------------------------------------------------

function getGradientForStay(destination: string, index: number): [string, string] {
  const palette = DESTINATION_THEME_PALETTES[destination];
  if (palette?.gradient) {
    const g = palette.gradient;
    return [g[index % g.length], g[(index + 1) % g.length]];
  }
  const fallbacks: [string, string][] = [
    [COLORS.sage, COLORS.gradientCard],
    [COLORS.goldMuted, COLORS.gradientCard],
    [COLORS.creamMuted, COLORS.gradientCard],
    [COLORS.sageDark, COLORS.gradientCard],
    [COLORS.goldBorder, COLORS.gradientCard],
    [COLORS.creamDim, COLORS.gradientCard],
  ];
  return fallbacks[index % fallbacks.length];
}

// ---------------------------------------------------------------------------
// Map placeholder (web / fallback)
// ---------------------------------------------------------------------------

function MapPlaceholder() {
  const h = 220;
  const w = SCREEN_WIDTH - SPACING.lg * 2;
  const positions = [0.2, 0.4, 0.6, 0.8];
  return (
    <View style={styles.mapPlaceholder}>
      <View style={styles.mapGrid}>
        {positions.map((pct, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              { top: h * pct, left: 0, width: w, height: 1 },
            ]}
          />
        ))}
        {positions.map((pct, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              { left: w * pct, top: 0, width: 1, height: h },
            ]}
          />
        ))}
      </View>
      <MapPin size={32} color={COLORS.sage} strokeWidth={2} />
      <Text style={styles.mapPlaceholderLabel}>Map view</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Map with pins (native)
// ---------------------------------------------------------------------------

function StayMapView({
  stays,
  destination,
}: {
  stays: StayListing[];
  destination: string;
}) {
  if (isWeb) return <MapPlaceholder />;

  const MapView = require('react-native-maps').default;
  const Marker = require('react-native-maps').Marker;
  const coords = getCoordsForDestination(destination) ?? { lat: 35.6762, lng: 139.6503 };
  const region = {
    latitude: coords.lat,
    longitude: coords.lng,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <View style={styles.mapWrap}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        customMapStyle={[
          { elementType: 'geometry', stylers: [{ color: COLORS.bg }] },
          { elementType: 'labels.text.fill', stylers: [{ color: COLORS.creamMuted }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: COLORS.mapRoad }] },
        ]}
        showsUserLocation={false}
      >
        {stays.map((stay) => (
          <Marker
            key={stay.id}
            coordinate={{ latitude: stay.lat, longitude: stay.lng }}
            tracksViewChanges={false}
          >
            <View style={styles.priceBubble}>
              <Text style={styles.priceBubbleText}>${stay.pricePerNight}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stay Card
// ---------------------------------------------------------------------------

function StayCard({
  stay,
  destination,
  index,
  onPress,
  onBook,
}: {
  stay: StayListing;
  destination: string;
  index: number;
  onPress: () => void;
  onBook: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved((prev) => !prev);
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heartScale]);

  const handleCardPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.99,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  const gradient = getGradientForStay(destination, index);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }, { translateY }],
        },
      ]}
    >
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.95 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${stay.name}, ${stay.neighborhood}`}
      >
        <View style={styles.cardPhotoWrap}>
          <LinearGradient
            colors={[gradient[0], gradient[1], COLORS.bg]}
            locations={[0, 0.6, 1]}
            style={styles.cardPhoto}
          />
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{stay.type}</Text>
          </View>
          <Pressable
            onPress={handleSave}
            hitSlop={12}
            style={styles.saveBtn}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Unsave' : 'Save'}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                size={22}
                color={COLORS.cream}
                strokeWidth={2}
                fill={saved ? COLORS.coral : 'transparent'}
              />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardName}>{stay.name}</Text>
          <Text style={styles.cardNeighborhood}>
            {stay.neighborhood} · {stay.vibe}
          </Text>

          <View style={styles.ratingRow}>
            <Star size={14} color={COLORS.gold} fill={COLORS.gold} strokeWidth={0} />
            <Text style={styles.ratingText}>{stay.rating}</Text>
            <Text style={styles.reviewCount}>({stay.reviewCount} reviews)</Text>
          </View>

          <View style={styles.distanceRow}>
            <MapPin size={12} color={COLORS.creamMuted} strokeWidth={2} />
            <Text style={styles.distanceText}>{stay.distanceKm} km from center</Text>
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.priceRow}>
              <Text style={styles.priceLabel}>from </Text>
              <Text style={styles.priceValue}>${stay.pricePerNight}</Text>
              <Text style={styles.priceSuffix}>/night</Text>
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onBook();
              }}
              style={({ pressed }) => [
                styles.bookBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Book ${stay.name}`}
            >
              <Text style={styles.bookBtnText}>Book</Text>
              <ExternalLink size={12} color={COLORS.bg} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function StaysScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const planWizard = useAppStore((s) => s.planWizard);
  const trips = useAppStore((s) => s.trips);

  const destination = useMemo(() => {
    const fromPlan = planWizard.destination?.trim();
    if (fromPlan) return fromPlan;
    const fromTrip = trips[0]?.destination;
    return fromTrip ?? '';
  }, [planWizard.destination, trips]);

  const [selectedType, setSelectedType] = useState<StayType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const resultsOpacityRef = useRef(new Animated.Value(1)).current;

  const allStays = useMemo(
    () => (destination ? generateMockStays(destination) : []),
    [destination]
  );

  // Brief loading state for perceived quality
  useEffect(() => {
    if (!destination) return;
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [destination]);

  const filteredStays = useMemo(() => {
    if (selectedType === 'all') return allStays;
    return allStays.filter((s) => s.type === selectedType);
  }, [allStays, selectedType]);

  const handleFilterChange = useCallback((type: StayType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(type);
    Animated.sequence([
      Animated.timing(resultsOpacityRef, {
        toValue: 0.4,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(resultsOpacityRef, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [resultsOpacityRef]);

  const handleCardPress = useCallback((stay: StayListing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Search for the specific property by name + destination
    const query = `${stay.name} ${destination}`;
    const url = getHotelLink({ destination: query, adults: 2 });
    openBookingLink(url, 'booking', destination, 'stays-card').catch(() => {});
  }, [destination]);

  const handleBook = useCallback((stay: StayListing) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Open booking search based on stay type with affiliate tracking
    if (stay.type === 'hostel') {
      const url = `https://www.hostelworld.com/find/hostels?search=${encodeURIComponent(destination)}`;
      Linking.openURL(url).catch(() => {});
    } else if (stay.type === 'airbnb') {
      const url = `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes`;
      Linking.openURL(url).catch(() => {});
    } else {
      const url = getHotelLink({ destination, adults: 2 });
      openBookingLink(url, 'booking', destination, 'stays-book').catch(() => {});
    }
  }, [destination]);

  if (!destination) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.contextBar}>
          <Text style={styles.noDestination}>Set a destination first</Text>
        </View>
        <View style={styles.emptyCenter}>
          <Building2 size={48} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No destination set</Text>
          <Text style={styles.emptySub}>
            Plan a trip or pick a destination to browse stays
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/generate')}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.ctaBtnText}>Go to Plan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Section 1: Destination context bar */}
      <View style={styles.contextBar}>
        <Text style={styles.contextTitle}>Stays in {destination}</Text>
        <Pressable
          hitSlop={12}
          style={({ pressed }) => [styles.filterIcon, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Filters"
        >
          <SlidersHorizontal size={20} color={COLORS.sage} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 2: Type filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsWrap}
          style={styles.pillsScroll}
        >
          {STAY_TYPES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => handleFilterChange(t.id)}
              style={[
                styles.pill,
                selectedType === t.id ? styles.pillSelected : styles.pillUnselected,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedType === t.id ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Section 3: Map */}
        <View style={styles.mapContainer}>
          <StayMapView stays={filteredStays} destination={destination} />
        </View>

        {/* Section 4: Stay cards */}
        <Animated.View style={{ opacity: resultsOpacityRef }}>
          {isLoading ? (
            <View style={styles.skeletonWrap}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} height={240} borderRadius={16} style={{ marginHorizontal: SPACING.lg, marginBottom: 12 }} />
              ))}
            </View>
          ) : (
          <>
          <Text style={styles.sectionHeader}>
            {filteredStays.length} places found
          </Text>

          {filteredStays.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 size={48} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No stays found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters</Text>
            </View>
          ) : (
            filteredStays.map((stay, i) => (
              <StayCard
                key={stay.id}
                stay={stay}
                destination={destination}
                index={i}
                onPress={() => handleCardPress(stay)}
                onBook={() => handleBook(stay)}
              />
            ))
          )}
          </>
          )}
        </Animated.View>
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
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  contextTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  noDestination: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  filterIcon: {
    padding: SPACING.xs,
  } as ViewStyle,
  pillsScroll: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  pillsWrap: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
  } as ViewStyle,
  pillSelected: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  pillUnselected: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.creamDimLight,
  } as ViewStyle,
  pillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
  } as TextStyle,
  pillTextSelected: {
    color: COLORS.bg,
  } as TextStyle,
  pillTextUnselected: {
    color: COLORS.cream,
  } as TextStyle,
  mapContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  mapPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  gridLine: {
    position: 'absolute',
    backgroundColor: COLORS.cream,
    opacity: 0.05,
  } as ViewStyle,
  mapPlaceholderLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDimLight,
    marginTop: SPACING.sm,
  } as TextStyle,
  mapWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  } as ViewStyle,
  priceBubble: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  } as ViewStyle,
  priceBubbleText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  sectionHeader: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  } as TextStyle,
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
  } as ViewStyle,
  cardPhotoWrap: {
    height: 180,
    position: 'relative',
  } as ViewStyle,
  cardPhoto: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  cardBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.bgDarkGreen80,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  cardBadgeText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.cream,
    textTransform: 'capitalize',
  } as TextStyle,
  saveBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
  } as ViewStyle,
  cardContent: {
    padding: 14,
  } as ViewStyle,
  cardName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  cardNeighborhood: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: 8,
  } as TextStyle,
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  } as ViewStyle,
  ratingText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
  } as TextStyle,
  reviewCount: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  } as ViewStyle,
  distanceText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  priceRow: {
    fontFamily: FONTS.body,
    fontSize: 13,
  } as TextStyle,
  priceLabel: {
    color: COLORS.creamMuted,
  } as TextStyle,
  priceValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.gold,
  } as TextStyle,
  priceSuffix: {
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.sage,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  bookBtnText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  } as ViewStyle,
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
  } as TextStyle,
  emptySub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDimLight,
    marginTop: SPACING.xs,
  } as TextStyle,
  ctaBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  ctaBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,

  // ── Skeleton loaders ──
  skeletonWrap: {
    gap: 16,
    paddingTop: 8,
  } as ViewStyle,
});
