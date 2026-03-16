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
const GRID_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
const CARD_HEIGHT_TALL = 280;
const CARD_HEIGHT_SHORT = 240;

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

  // Gradient — subtle bottom 40% only
  const gradientLocations: [number, number, number] = [0.6, 0.8, 1];

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

        {/* Price badge — text only, no background */}
        <Text style={styles.priceBadgeText}>{costLabel}</Text>

        {/* Trending + timing badges (top-right) — no pill backgrounds */}
        <View style={styles.badgeStack}>
          {isTrending && (
            <Flame size={14} color={COLORS.coral} strokeWidth={2} />
          )}
          {isPerfectTiming && (
            <Text style={styles.timingText}>{i18n.t('discover.perfectTiming')}</Text>
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
        pressed && { opacity: 0.7 },
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
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.brandMark}>ROAM</Text>
          <Animated.Text style={[styles.editorialSubtitle, { opacity: headerFade }]}>
            {(t('discover.editorialHeaders', { returnObjects: true }) as string[])[headerIndex] ?? DISCOVER_HEADERS[headerIndex]}
          </Animated.Text>
        </View>

        {/* Search bar — bottom border only, no filled background */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.creamMuted} strokeWidth={2} />
            <View style={styles.searchInputWrap}>
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

        {/* Quick links — text only with icons, no pill backgrounds */}
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
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Heart size={14} color={COLORS.coral} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Compatibility</Text>
            </Pressable>
            <Text style={styles.quickLinkDivider}>·</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/passport');
              }}
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.7 : 1 }]}
            >
              <BookOpen size={14} color={COLORS.gold} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Passport</Text>
            </Pressable>
            <Text style={styles.quickLinkDivider}>·</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/trip-wrapped');
              }}
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Sparkles size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.quickLinkText}>Wrapped</Text>
            </Pressable>
            <Text style={styles.quickLinkDivider}>·</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/what-if' as never);
              }}
              style={({ pressed }) => [styles.quickLink, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Compass size={14} color={COLORS.cream} strokeWidth={2} />
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

        {/* What if — text only, no card background */}
        {trips.length === 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/what-if' as never);
            }}
            style={({ pressed }) => [
              styles.whatIfCard,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.whatIfTitle}>What if I just went? →</Text>
            <Text style={styles.whatIfSub}>Pick a place. See what it actually costs.</Text>
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
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  } as ViewStyle,
  nextTripLeft: {
    width: 40,
    height: 40,
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

  // Quick links — no backgrounds, just icon + text
  quickLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  } as ViewStyle,
  quickLinkText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  quickLinkDivider: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sageBorder,
    paddingHorizontal: 4,
  } as TextStyle,

  // For You section
  forYouSection: {
    marginBottom: 40,
  } as ViewStyle,
  forYouHeader: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.md,
  } as ViewStyle,
  forYouTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    fontStyle: 'italic',
    color: COLORS.cream,
  } as TextStyle,
  forYouScroll: {
    paddingHorizontal: GRID_PADDING,
    gap: 12,
  } as ViewStyle,
  forYouCard: {
    width: 180,
    height: 120,
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
    fontFamily: FONTS.header,
    fontSize: 18,
    fontStyle: 'italic',
    color: '#fff',
  } as TextStyle,
  forYouHook: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(245,237,216,0.75)',
    marginTop: 2,
  } as TextStyle,

  // Header
  header: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: 24,
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
    fontSize: 36,
    fontStyle: 'italic',
    color: COLORS.cream,
    lineHeight: 44,
  } as TextStyle,

  // Search — bottom border only
  searchContainer: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sageBorder,
    paddingHorizontal: 0,
    paddingVertical: 14,
    gap: SPACING.sm,
  } as ViewStyle,
  searchInputWrap: {
    flex: 1,
  } as ViewStyle,
  searchTapArea: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  searchPlaceholder: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
  } as TextStyle,

  // Chips — text only, active = underline
  chipsContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: SPACING.md,
    gap: 16,
  } as ViewStyle,
  chip: {
    paddingHorizontal: 0,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  } as ViewStyle,
  chipActive: {
    borderBottomColor: COLORS.sage,
  } as ViewStyle,
  chipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  chipTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  // What if — text only, no card
  whatIfCard: {
    marginHorizontal: GRID_PADDING,
    marginBottom: 40,
  } as ViewStyle,
  whatIfTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    fontStyle: 'italic',
    color: COLORS.sage,
  } as TextStyle,
  whatIfSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginTop: 4,
  } as TextStyle,

  // Truth section
  truthSection: {
    marginHorizontal: GRID_PADDING,
    marginVertical: 32,
  } as ViewStyle,

  // Section heading — Cormorant italic, count below
  sectionHeader: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.lg,
    marginTop: SPACING.xs,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    fontStyle: 'italic',
    color: COLORS.cream,
    lineHeight: 30,
  } as TextStyle,
  sectionCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    marginTop: 4,
  } as TextStyle,

  // Cards — no border, more photo impact
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: GRID_GAP,
  } as ViewStyle,
  card: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#0D1710',
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
  timingText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  priceBadgeText: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
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
    fontSize: 18,
    fontStyle: 'italic',
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
    color: COLORS.creamSoft,
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
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
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
