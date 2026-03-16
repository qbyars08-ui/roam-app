// =============================================================================
// ROAM — Discover Tab
// Photo destination grid with search bar, category chips, and editorial layout
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Flame, Clock, Sparkles, BookOpen, Heart, Compass, HelpCircle } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  DESTINATIONS,
  DESTINATION_CATEGORIES,
  DISCOVER_HEADERS,
  type Destination,
  type DestinationCategory,
} from '../../lib/constants';
import i18n from '../../lib/i18n';
import { tCategory } from '../../lib/i18n/helpers';
import { track } from '../../lib/analytics';
import { trackBehavior } from '../../lib/travel-dna';
import { useAppStore } from '../../lib/store';
import { getForYouFeed } from '../../lib/recommendations';
import { getDestinationPhoto } from '../../lib/photos';
import ROAMScoreBadge from '../../components/features/ROAMScoreBadge';
import TravelTruthCard from '../../components/features/TravelTruthCard';
import ContextBanner from '../../components/features/ContextBanner';
import ResilientImage from '../../components/ui/ResilientImage';
import { getContext, buildStrategy, type ContentStrategy } from '../../lib/context-engine';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT_TALL = 240;
const CARD_HEIGHT_SHORT = 200;

// ---------------------------------------------------------------------------
// Unsplash fallback — zero API key needed
// ---------------------------------------------------------------------------
function getUnsplashUrl(query: string, w = 800, h = 600): string {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query)},travel`;
}

// ---------------------------------------------------------------------------
// DestinationPhotoCard
// ---------------------------------------------------------------------------
interface DestinationPhotoCardProps {
  destination: Destination;
  onPress: (dest: Destination) => void;
  index: number;
}

const DestinationPhotoCard = React.memo(function DestinationPhotoCard({
  destination,
  onPress,
  index,
}: DestinationPhotoCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const imageUrl = destination.unsplashUrl
    ?? getUnsplashUrl(destination.photoQuery);

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, index]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(destination);
  }, [destination, onPress]);

  // Vary gradient angle per card for visual variety
  const gradientLocations: [number, number, number] = index % 3 === 0
    ? [0, 0.4, 1]
    : index % 3 === 1
      ? [0, 0.5, 1]
      : [0, 0.35, 1];

  // Daily cost display
  const costLabel = destination.dailyCost <= 50
    ? '$'
    : destination.dailyCost <= 100
      ? '$$'
      : destination.dailyCost <= 175
        ? '$$$'
        : '$$$$';

  const isTrending = destination.trendScore >= 85;
  const currentMonth = new Date().getMonth() + 1;
  const isPerfectTiming = destination.bestMonths.includes(currentMonth);

  const cardHeight = index % 3 === 0 ? CARD_HEIGHT_TALL : CARD_HEIGHT_SHORT;

  return (
    <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim, height: cardHeight }]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          { height: cardHeight },
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${destination.label}, ${destination.country}`}
      >
        <ResilientImage
          uri={imageUrl}
          style={styles.cardImage}
          containerStyle={StyleSheet.absoluteFill}
          fallbackColors={[COLORS.bgElevated, COLORS.bgCard, COLORS.bg]}
          resizeMode="cover"
        />

        {/* Dark gradient overlay */}
        <LinearGradient
          colors={['transparent', COLORS.overlaySoft, COLORS.overlayDark]}
          locations={gradientLocations}
          style={styles.cardGradient}
        />

        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{costLabel}</Text>
        </View>

        {/* Trending + timing badges (top-right) */}
        <View style={styles.badgeStack}>
          {isTrending && (
            <View style={styles.trendingBadge}>
              <Flame size={14} color={COLORS.coral} strokeWidth={2} />
              <Text style={styles.trendingText}>{destination.trendScore}</Text>
            </View>
          )}
          {isPerfectTiming && (
            <View style={styles.timingBadge}>
              <Clock size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.timingText}>{i18n.t('discover.perfectTiming')}</Text>
            </View>
          )}
        </View>

        {/* ROAM Score — bottom right */}
        <View style={styles.roamScoreWrap}>
          <ROAMScoreBadge destination={destination.label} size="sm" />
        </View>

        {/* Content overlay */}
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel} numberOfLines={1}>
            {destination.label}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardCountry}>{destination.country}</Text>
            <View style={styles.cardDot} />
            <Text style={styles.cardHook} numberOfLines={1}>
              {destination.hook}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ---------------------------------------------------------------------------
// CategoryChip
// ---------------------------------------------------------------------------
interface CategoryChipProps {
  category: DestinationCategory;
  isActive: boolean;
  onPress: (id: string) => void;
}

const CategoryChip = React.memo(function CategoryChip({
  category,
  isActive,
  onPress,
}: CategoryChipProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(category.id);
  }, [category.id, onPress]);

  const label = tCategory(category.id);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        isActive && styles.chipActive,
        pressed && { transform: [{ scale: 0.95 }], opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// DiscoverScreen
// ---------------------------------------------------------------------------
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [headerIndex, setHeaderIndex] = useState(0);
  const headerFade = useRef(new Animated.Value(1)).current;
  const [forYouPicks, setForYouPicks] = useState<Destination[]>([]);
  const [contextStrategy, setContextStrategy] = useState<ContentStrategy | null>(null);
  const [showBanner, setShowBanner] = useState(true);
  const trips = useAppStore((s) => s.trips);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'discover' });
    // Load personalized recommendations
    getForYouFeed({ limit: 6 }).then((scored) => {
      setForYouPicks(scored.map((s) => s.destination));
    }).catch(() => {});
    // Load context-aware strategy
    getContext().then((signals) => {
      setContextStrategy(buildStrategy(signals));
    }).catch(() => {});
  }, []);

  // Rotate editorial header every 5s with crossfade
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(headerFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setHeaderIndex((prev) => (prev + 1) % DISCOVER_HEADERS.length);
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [headerFade]);

  // Filter destinations by category + search
  const filteredDestinations = useMemo(() => {
    let filtered = DESTINATIONS;
    if (activeCategory !== 'all') {
      filtered = filtered.filter((d) => d.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.label.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.hook.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [activeCategory, searchQuery]);

  // Handlers
  const handleDestinationPress = useCallback(
    (dest: Destination) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      trackBehavior({ type: 'destination_opened', timestamp: new Date().toISOString(), data: { destination: dest.label, category: dest.category } }).catch(() => {});
      router.push(`/destination/${encodeURIComponent(dest.label)}` as never);
    },
    [router]
  );

  const handleCategoryPress = useCallback((id: string) => {
    setActiveCategory(id);
  }, []);


  // FlatList render
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Destination>) => (
      <DestinationPhotoCard
        destination={item}
        onPress={handleDestinationPress}
        index={index}
      />
    ),
    [handleDestinationPress]
  );

  const keyExtractor = useCallback((item: Destination) => item.label, []);

  // Grid layout: 2 columns
  const columnWrapperStyle = useMemo(
    () => ({ gap: GRID_GAP, paddingHorizontal: GRID_PADDING }),
    []
  );

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Brand header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.brandMark}>ROAM</Text>
          <Animated.Text style={[styles.editorialSubtitle, { opacity: headerFade }]}>
            {(t('discover.editorialHeaders', { returnObjects: true }) as string[])[headerIndex] ?? DISCOVER_HEADERS[headerIndex]}
          </Animated.Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.creamMuted} strokeWidth={2} />
            <View style={styles.searchInputWrap}>
              {/* Using a simple text input to avoid PlacesInput complexity */}
              <Pressable
                onPress={() => router.push('/(tabs)/generate' as never)}
                style={styles.searchTapArea}
                accessibilityRole="button"
                accessibilityLabel={t('discover.searchPlaceholder')}
              >
                <Text style={styles.searchPlaceholder}>
                  {t('discover.searchPlaceholder')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Context-aware banner */}
        {showBanner && contextStrategy?.contextBanner && (
          <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
            <ContextBanner
              text={contextStrategy.contextBanner.text}
              action={contextStrategy.contextBanner.action}
              onAction={contextStrategy.contextBanner.destination ? () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/destination/${encodeURIComponent(contextStrategy.contextBanner?.destination ?? '')}` as never);
              } : undefined}
              onDismiss={() => setShowBanner(false)}
            />
          </View>
        )}

        {/* Quick links */}
        {trips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickLinksRow}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/compatibility' as never);
              }}
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Heart size={16} color={COLORS.coral} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Compatibility</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/passport');
              }}
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.8 : 1 }]}
            >
              <BookOpen size={16} color={COLORS.gold} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Passport</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/trip-wrapped');
              }}
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Sparkles size={16} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Wrapped</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/what-if' as never);
              }}
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Compass size={16} color={COLORS.cream} strokeWidth={2} />
              <Text style={styles.quickLinkText}>What if?</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Next Trip Countdown — brings users back daily */}
        {trips.length > 0 && (() => {
          const latestTrip = trips[0];
          // Estimate departure: 14 days from creation
          const departure = new Date(latestTrip.createdAt);
          departure.setDate(departure.getDate() + 14);
          const now = new Date();
          const diffMs = departure.getTime() - now.getTime();
          const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

          if (daysLeft > 0 && daysLeft <= 60) {
            return (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: '/trip-countdown', params: { tripId: latestTrip.id } } as never);
                }}
                style={({ pressed }) => [
                  styles.nextTripCard,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <View style={styles.nextTripLeft}>
                  <Clock size={20} color={COLORS.sage} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextTripTitle}>
                    {latestTrip.destination} in {daysLeft} days
                  </Text>
                  <Text style={styles.nextTripSub}>
                    Tap for your live countdown
                  </Text>
                </View>
                <Text style={styles.nextTripDays}>{daysLeft}d</Text>
              </Pressable>
            );
          }
          return null;
        })()}

        {/* For You — personalized picks */}
        {forYouPicks.length > 0 && (
          <View style={styles.forYouSection}>
            <View style={styles.forYouHeader}>
              <Sparkles size={16} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.forYouTitle}>For you</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forYouScroll}
            >
              {forYouPicks.map((dest) => (
                <Pressable
                  key={dest.label}
                  onPress={() => handleDestinationPress(dest)}
                  style={({ pressed }) => [
                    styles.forYouCard,
                    { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                >
                  <Image
                    source={{ uri: dest.unsplashUrl ?? getDestinationPhoto(dest.photoQuery) }}
                    style={styles.forYouImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.forYouGradient}
                  />
                  <View style={styles.forYouContent}>
                    <Text style={styles.forYouName}>{dest.label}</Text>
                    <Text style={styles.forYouHook} numberOfLines={1}>{dest.hook}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* What if — always visible, even for first-time users */}
        {trips.length === 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/what-if' as never);
            }}
            style={({ pressed }) => [
              styles.whatIfCard,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <View style={styles.whatIfLeft}>
              <Compass size={22} color={COLORS.sage} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.whatIfTitle}>What if I just went?</Text>
              <Text style={styles.whatIfSub}>Pick a place. See what it actually costs.</Text>
            </View>
          </Pressable>
        )}

        {/* Something true — the feature that makes people stop scrolling */}
        <View style={styles.truthSection}>
          <TravelTruthCard />
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {DESTINATION_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              isActive={activeCategory === cat.id}
              onPress={handleCategoryPress}
            />
          ))}
        </ScrollView>

        {/* Section heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'all'
              ? 'Where everyone is going right now'
              : activeCategory === 'beaches'
                ? 'Sand, salt, and zero agenda'
                : activeCategory === 'mountains'
                  ? 'High altitude, higher expectations'
                  : activeCategory === 'cities'
                    ? 'Concrete jungles worth the chaos'
                    : activeCategory === 'food'
                      ? 'Book the flight for the food alone'
                      : activeCategory === 'adventure'
                        ? 'Skip the tourist loop entirely'
                        : activeCategory === 'budget'
                          ? 'Big trips, small spend'
                          : activeCategory === 'couples'
                            ? 'Trips worth fighting over the window seat'
                            : 'Destinations'}
          </Text>
          <Text style={styles.sectionCount}>
            {filteredDestinations.length} {filteredDestinations.length === 1 ? 'place' : 'places'}
          </Text>
        </View>
      </View>
    ),
    [
      insets.top,
      headerIndex,
      activeCategory,
      handleCategoryPress,
      filteredDestinations.length,
      router,
      headerFade,
      t,
      showBanner,
      contextStrategy,
    ]
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <MapPin size={40} color={COLORS.creamMuted} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>No destinations match</Text>
        <Text style={styles.emptySubtitle}>Try a different category or search term</Text>
        <Pressable
          onPress={() => {
            setActiveCategory('all');
            setSearchQuery('');
          }}
          style={styles.emptyButton}
        >
          <Text style={styles.emptyButtonText}>Show all</Text>
        </Pressable>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDestinations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={columnWrapperStyle}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
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
  listContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // Next trip countdown
  nextTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: GRID_PADDING,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  } as ViewStyle,
  nextTripLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  nextTripTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  nextTripSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  nextTripDays: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.sage,
  } as TextStyle,

  // Quick links
  quickLinksRow: {
    flexDirection: 'row',
    paddingHorizontal: GRID_PADDING,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  } as ViewStyle,
  quickLinkText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // For You section
  forYouSection: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  forYouHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  forYouTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  forYouScroll: {
    paddingHorizontal: GRID_PADDING,
    gap: SPACING.sm,
  } as ViewStyle,
  forYouCard: {
    width: 160,
    height: 100,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  forYouImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  forYouGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  forYouContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  forYouName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#fff',
  } as TextStyle,
  forYouHook: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  } as TextStyle,

  // Header — breathe
  header: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  brandMark: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 4,
    marginBottom: SPACING.sm,
  } as TextStyle,
  editorialSubtitle: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
    lineHeight: 50,
  } as TextStyle,

  // Search
  searchContainer: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.md,
  } as ViewStyle,
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  searchInputWrap: {
    flex: 1,
  } as ViewStyle,
  searchTapArea: {
    flex: 1,
    justifyContent: 'center',
    height: 48,
  } as ViewStyle,
  searchPlaceholder: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Chips
  chipsContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  chipActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  chipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  chipTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  // What if card
  whatIfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: GRID_PADDING,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  } as ViewStyle,
  whatIfLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  whatIfTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    fontStyle: 'italic',
  } as TextStyle,
  whatIfSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Something true
  truthSection: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.lg,
  } as ViewStyle,

  // Section — more breathing room
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,
  sectionCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Cards
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: GRID_GAP,
  } as ViewStyle,
  card: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  badgeStack: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    gap: 4,
    alignItems: 'flex-end',
  } as ViewStyle,
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.overlayDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  trendingText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.coral,
    letterSpacing: 0.5,
  } as TextStyle,
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.overlayDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  timingText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  priceBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.overlayDim,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  } as ViewStyle,
  priceBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  cardLabel: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.white,
    marginBottom: 2,
  } as TextStyle,
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  cardCountry: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  cardDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.creamMuted,
  } as ViewStyle,
  cardHook: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    lineHeight: 16,
  } as TextStyle,

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: GRID_PADDING,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,
  emptyButton: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  emptyButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  roamScoreWrap: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
  } as ViewStyle,
});
