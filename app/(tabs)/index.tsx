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
import { Search, MapPin, Flame, Clock } from 'lucide-react-native';
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
import { useAppStore } from '../../lib/store';
import i18n from '../../lib/i18n';
import { tCategory } from '../../lib/i18n/helpers';
import { track } from '../../lib/analytics';

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
  const [imageLoaded, setImageLoaded] = useState(false);

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
        {/* Placeholder gradient while image loads */}
        {!imageLoaded && (
          <LinearGradient
            colors={[COLORS.bgElevated, COLORS.bgCard, COLORS.bg]}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Photo */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImage}
          onLoad={() => setImageLoaded(true)}
          resizeMode="cover"
        />

        {/* Dark gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
          locations={gradientLocations}
          style={styles.cardGradient}
        />

        {/* Price badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{costLabel}</Text>
        </View>

        {/* Trending + timing badges (top-left) */}
        <View style={styles.badgeStack}>
          {isTrending && (
            <View style={styles.trendingBadge}>
              <Flame size={10} color={COLORS.coral} />
              <Text style={styles.trendingText}>{i18n.t('discover.trending')}</Text>
            </View>
          )}
          {isPerfectTiming && (
            <View style={styles.timingBadge}>
              <Clock size={10} color={COLORS.sage} />
              <Text style={styles.timingText}>Perfect timing</Text>
            </View>
          )}
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
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);
  const setGenerateMode = useAppStore((s) => s.setGenerateMode);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [headerIndex, setHeaderIndex] = useState(0);
  const headerFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    track({ type: 'screen_view', screen: 'discover' });
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
      setPlanWizard({ destination: dest.label });
      setGenerateMode('quick');
      router.push('/(tabs)/generate');
    },
    [setPlanWizard, setGenerateMode, router]
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
                onPress={() => router.push('/(tabs)/generate')}
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
              ? 'Popular Destinations'
              : DESTINATION_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Destinations'}
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

  // Header
  header: {
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.md,
  } as ViewStyle,
  brandMark: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  } as TextStyle,
  editorialSubtitle: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
    lineHeight: 46,
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
    shadowColor: '#000',
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

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: GRID_PADDING,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
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
    left: SPACING.sm,
    gap: 4,
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
    right: SPACING.sm,
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
});
