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
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
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
import MoodDiscovery from '../../components/features/MoodDiscovery';
import ContextBanner from '../../components/features/ContextBanner';
import ResilientImage from '../../components/ui/ResilientImage';
import { getContext, buildStrategy, type ContentStrategy } from '../../lib/context-engine';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
// Dramatic height variation — magazine layout, not a uniform grid
const CARD_HEIGHTS = [320, 200, 260, 240, 190, 300] as const;

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

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Share.share({
      message: `Check out ${destination.label}, ${destination.country} on ROAM — ${destination.hook}`,
    }).catch(() => {});
  }, [destination]);

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

  const cardHeight = CARD_HEIGHTS[index % CARD_HEIGHTS.length];

  return (
    <Animated.View style={[styles.cardWrapper, { opacity: fadeAnim, height: cardHeight }]}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={({ pressed }) => [
          styles.card,
          { height: cardHeight },
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${destination.label}, ${destination.country}`}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1.05] }) }] }]}>
          <ResilientImage
            uri={imageUrl}
            style={styles.cardImage}
            containerStyle={StyleSheet.absoluteFill}
            fallbackColors={[COLORS.bgElevated, COLORS.bgCard, COLORS.bg]}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Color grade — makes every photo feel like it belongs to ROAM's world */}
        <View style={styles.cardColorGrade} />

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
            <Flame size={14} color={COLORS.coral} strokeWidth={1.5} />
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
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const lastViewedDestination = useAppStore((s) => s.lastViewedDestination);
  const setLastViewedDestination = useAppStore((s) => s.setLastViewedDestination);

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

  // Shake-to-random-destination easter egg
  const lastShakeRef = useRef<number>(0);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Accelerometer.setUpdateInterval(400);
    const subscription = Accelerometer.addListener(({ x, y, z }: { x: number; y: number; z: number }) => {
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
      if (totalAcceleration > 1.8) {
        const now = Date.now();
        if (now - lastShakeRef.current < 3000) return;
        lastShakeRef.current = now;
        const dest = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        router.push(('/destination/' + encodeURIComponent(dest.label)) as never);
      }
    });
    return () => subscription.remove();
  }, [router]);

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
      setLastViewedDestination(dest.label);
      router.push(`/destination/${encodeURIComponent(dest.label)}` as never);
    },
    [router, setLastViewedDestination]
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
          {tripsThisMonth > 0 && (
            <Text style={styles.streakCounter}>
              {tripsThisMonth} trip{tripsThisMonth === 1 ? '' : 's'} this month
            </Text>
          )}
          <Animated.Text style={[styles.editorialSubtitle, { opacity: headerFade }]}>
            {(t('discover.editorialHeaders', { returnObjects: true }) as string[])[headerIndex] ?? DISCOVER_HEADERS[headerIndex]}
          </Animated.Text>
        </View>

        {/* Search bar — bottom border only, no filled background */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
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
              <Heart size={14} color={COLORS.coral} strokeWidth={1.5} />
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
              <BookOpen size={14} color={COLORS.gold} strokeWidth={1.5} />
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
              <Sparkles size={14} color={COLORS.sage} strokeWidth={1.5} />
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
              <Compass size={14} color={COLORS.cream} strokeWidth={1.5} />
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
                  <Clock size={20} color={COLORS.sage} strokeWidth={1.5} />
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
              {forYouPicks.map((dest, i) => {
                // Dramatic size variation — hero card dominates, others recede
                const isHero = i === 0;
                const cardW = isHero ? 260 : i % 3 === 1 ? 140 : 160;
                const cardH = isHero ? 180 : i % 3 === 1 ? 100 : 120;
                const currentMo = new Date().getMonth() + 1;
                const isGoodNow = dest.bestMonths.includes(currentMo);
                return (
                  <Pressable
                    key={dest.label}
                    onPress={() => handleDestinationPress(dest)}
                    style={({ pressed }) => [
                      styles.forYouCard,
                      { width: cardW, height: cardH, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <Image
                      source={{ uri: dest.unsplashUrl ?? getDestinationPhoto(dest.photoQuery) }}
                      style={styles.forYouImage}
                      resizeMode="cover"
                    />
                    <View style={styles.cardColorGrade} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.forYouGradient}
                    />
                    {isGoodNow && (
                      <View style={styles.forYouTimingBadge}>
                        <Text style={styles.forYouTimingText}>GO NOW</Text>
                      </View>
                    )}
                    <View style={styles.forYouContent}>
                      <Text style={[styles.forYouName, isHero && { fontSize: 22 }]}>{dest.label}</Text>
                      <Text style={styles.forYouHook} numberOfLines={1}>{dest.hook}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Resume intent — continue exploring last destination */}
        {trips.length === 0 && lastViewedDestination && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/destination/${encodeURIComponent(lastViewedDestination)}` as never);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, paddingHorizontal: GRID_PADDING, marginBottom: SPACING.sm }]}
          >
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.sage }}>
              Continue exploring {lastViewedDestination} →
            </Text>
          </Pressable>
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

        {/* Mood Discovery — "How are you feeling?" → destination recs */}
        <View style={{ paddingHorizontal: GRID_PADDING, marginBottom: SPACING.lg }}>
          <MoodDiscovery />
        </View>

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
      tripsThisMonth,
      lastViewedDestination,
    ]
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyWatermark}>ROAM</Text>
        <HelpCircle size={28} color={COLORS.creamMuted} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Nothing here yet.</Text>
        <Text style={styles.emptySubtitle}>Either your filter is too picky{'\n'}or the world got smaller.</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveCategory('all');
            setSearchQuery('');
          }}
          style={styles.emptyButton}
        >
          <Text style={styles.emptyButtonText}>Reset filters</Text>
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
    marginBottom: 36,
  } as ViewStyle,
  forYouHeader: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: 10,
  } as ViewStyle,
  forYouTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 3,
    textTransform: 'uppercase',
  } as TextStyle,
  forYouScroll: {
    paddingHorizontal: GRID_PADDING,
    gap: SPACING.md,
  } as ViewStyle,
  forYouCard: {
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
    color: COLORS.white,
  } as TextStyle,
  forYouHook: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamBrightSoft,
    marginTop: 2,
  } as TextStyle,
  forYouTimingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  } as ViewStyle,
  forYouTimingText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,

  // Header — editorial rhythm with tighter brand/headline gap
  header: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: 28,
  } as ViewStyle,
  brandMark: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 12,
    opacity: 0.7,
  } as TextStyle,
  streakCounter: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  editorialSubtitle: {
    fontFamily: FONTS.header,
    fontSize: 44,
    color: COLORS.cream,
    lineHeight: 48,
    letterSpacing: -1.5,
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
    gap: SPACING.md,
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

  // What if — editorial provocation, not a quiet link
  whatIfCard: {
    marginHorizontal: GRID_PADDING,
    marginBottom: SPACING.xxl,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.sageBorder,
  } as ViewStyle,
  whatIfTitle: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.sage,
    letterSpacing: -1,
    lineHeight: 40,
  } as TextStyle,
  whatIfSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  // Truth section — intentionally asymmetric vertical spacing
  truthSection: {
    marginHorizontal: GRID_PADDING,
    marginTop: 28,
    marginBottom: 36,
  } as ViewStyle,

  // Section heading — editorial scale with dramatic hierarchy
  sectionHeader: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 32,
    letterSpacing: -0.8,
  } as TextStyle,
  sectionCount: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  cardColorGrade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.12)',
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
    fontSize: 22,
    color: COLORS.white,
    marginBottom: 4,
    letterSpacing: -0.5,
  } as TextStyle,
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  } as ViewStyle,
  cardCountry: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamSoft,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
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
    overflow: 'hidden',
  } as ViewStyle,
  emptyWatermark: {
    position: 'absolute',
    fontFamily: FONTS.header,
    fontSize: 120,
    color: COLORS.whiteFaint,
    letterSpacing: 20,
    transform: [{ rotate: '-12deg' }],
  } as TextStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: -0.5,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
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
