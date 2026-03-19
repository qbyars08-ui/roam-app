// =============================================================================
// ROAM — Food Tab
// Hero + curated restaurant sections + Google Maps deep links. Same pattern as Flights.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { impactAsync as hapticImpact } from '../../lib/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, ChevronRight, ExternalLink, MapPin, UtensilsCrossed } from 'lucide-react-native';
import * as Linking from 'expo-linking';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore, getActiveTrip } from '../../lib/store';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import { searchPlaces, type FSQPlace } from '../../lib/apis/foursquare';
import { geocode } from '../../lib/apis/mapbox';
import { searchNearby, type PlaceResult } from '../../lib/apis/google-places';
import { searchLocations, type TALocation } from '../../lib/apis/tripadvisor';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';
import { useSonarQuery } from '../../lib/sonar';
import SonarCard, { SonarFallback, APIDataCard } from '../../components/ui/SonarCard';
import { styles } from '../../components/food/food-styles';

import type { FoodCategory, Restaurant, AIPickRestaurant } from '../../components/food/food-types';
import { CITY_FOOD, POPULAR_FOOD_CITIES, FOOD_CATEGORIES, getRestaurantsForCity, type CityFoodData } from '../../components/food/food-data';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getPriceRangeDisplay(n: 1 | 2 | 3 | 4): string {
  return '$'.repeat(n);
}

function isOpenNow(opensAt: number, closesAt: number): boolean {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  if (closesAt < opensAt) return hour >= opensAt || hour < closesAt;
  return hour >= opensAt && hour < closesAt;
}

function getClosesAtDisplay(closesAt: number): string {
  const h = Math.floor(closesAt);
  const m = Math.round((closesAt - h) * 60);
  const pm = h >= 12;
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour12}${m > 0 ? ':' + m.toString().padStart(2, '0') : ''}${pm ? 'pm' : 'am'}`;
}

/** Parse distance string like "0.3 mi" or "1.2 mi" to miles, then estimate walk time (~3 mph) */
function getWalkTime(distance: string): string {
  const match = distance.match(/^([\d.]+)\s*(?:mi|miles?)?/i);
  const mi = match ? parseFloat(match[1]) : 0.25;
  const min = Math.round((mi / 3) * 60);
  if (min < 1) return '1 min walk';
  if (min < 60) return `${min} min walk`;
  const hrs = Math.floor(min / 60);
  const remain = min % 60;
  return remain > 0 ? `${hrs}h ${remain}m walk` : `${hrs} hr walk`;
}

function getAccentColor(category: FoodCategory): string {
  switch (category) {
    case 'Local Gems':
      return COLORS.sage;
    case 'Late Night':
      return COLORS.coral;
    case 'Fine Dining':
      return COLORS.gold;
    case 'Rooftop':
      return COLORS.sage;
    case 'Street Food':
      return COLORS.coral;
    case 'Cafe':
      return COLORS.gold;
    case 'Markets':
      return COLORS.sage;
    default:
      return COLORS.sage;
  }
}


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function FoodScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const activeTrip = getActiveTrip();
  const planWizard = useAppStore((s) => s.planWizard);
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);
  const bookmarkedIds = useAppStore((s) => s.bookmarkedRestaurantIds);
  const toggleBookmark = useAppStore((s) => s.toggleBookmarkedRestaurant);

  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('all');
  const [savedToast, setSavedToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Foursquare nearby restaurants
  const [fsqPlaces, setFsqPlaces] = useState<FSQPlace[]>([]);
  const [fsqLoading, setFsqLoading] = useState(false);

  // Google Places + TripAdvisor restaurants
  const [googleRestaurants, setGoogleRestaurants] = useState<PlaceResult[] | null>(null);
  const [taRestaurants, setTaRestaurants] = useState<TALocation[] | null>(null);
  const [googleTaLoaded, setGoogleTaLoaded] = useState(false);

  const destination =
    activeTrip?.destination ?? planWizard.destination ?? null;

  // Sonar food intelligence
  const sonarFood = useSonarQuery(destination ?? undefined, 'food');

  useEffect(() => {
    track({ type: 'screen_view', screen: 'food' });
  }, []);

  // Brief loading state for perceived quality
  useEffect(() => {
    if (!destination) return;
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [destination]);

  // Foursquare: geocode destination then fetch nearby restaurants
  useEffect(() => {
    if (!destination) {
      setFsqPlaces([]);
      return;
    }
    let cancelled = false;
    async function fetchNearbyRestaurants() {
      setFsqLoading(true);
      try {
        const geo = await geocode(destination as string);
        if (cancelled || !geo) return;
        const places = await searchPlaces('restaurants', geo.lat, geo.lng, undefined, 2000);
        if (!cancelled) {
          setFsqPlaces(places ?? []);
        }
      } catch {
        // non-fatal — section simply won't render
      } finally {
        if (!cancelled) setFsqLoading(false);
      }
    }
    fetchNearbyRestaurants();
    return () => { cancelled = true; };
  }, [destination]);

  // Google Places + TripAdvisor: fetch when destination changes
  useEffect(() => {
    let cancelled = false;
    const dest = destination;
    if (!dest) {
      setGoogleRestaurants(null);
      setTaRestaurants(null);
      setGoogleTaLoaded(false);
      return;
    }
    setGoogleTaLoaded(false);
    geocode(dest).then(async (geo) => {
      if (cancelled || !geo) { if (!cancelled) setGoogleTaLoaded(true); return; }
      const results = await searchNearby(geo.lat, geo.lng, 'restaurant', 2000);
      if (!cancelled) { setGoogleRestaurants(results?.slice(0, 6) ?? null); setGoogleTaLoaded(true); }
    }).catch(() => { if (!cancelled) setGoogleTaLoaded(true); });
    searchLocations(dest, 'restaurants').then((results) => {
      if (!cancelled) setTaRestaurants(results?.slice(0, 5) ?? null);
    });
    return () => { cancelled = true; };
  }, [destination]);

  const cityRestaurants = useMemo(
    () => destination ? getRestaurantsForCity(destination) : [],
    [destination]
  );

  const filteredRestaurants = useMemo(() => {
    if (selectedCategory === 'all') return cityRestaurants;
    return cityRestaurants.filter((r) => r.category === selectedCategory);
  }, [selectedCategory, cityRestaurants]);

  const aiPick = useMemo(
    () => cityRestaurants.find((r) => 'isAIPick' in r && r.isAIPick) as AIPickRestaurant | undefined,
    [cityRestaurants]
  );

  const morePicks = useMemo(
    () =>
      filteredRestaurants.filter(
        (r) => !('isAIPick' in r && r.isAIPick)
      ) as Restaurant[],
    [filteredRestaurants]
  );

  const showCategoryFilter = (selectedCategory === 'all' && filteredRestaurants.length > 0) ||
    filteredRestaurants.length > 0;

  const handleCategoryChange = useCallback((cat: FoodCategory) => {
    setSelectedCategory(cat);
    fadeAnim.setValue(0.3);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCardPress = useCallback(
    (restaurant: Restaurant | AIPickRestaurant) => {
      hapticImpact();
      captureEvent('food_restaurant_maps_opened', {
        restaurant: restaurant.name,
        destination,
        category: restaurant.category,
      });
      const query = encodeURIComponent(`${restaurant.name} ${destination}`);
      Linking.openURL(`https://www.google.com/maps/search/${query}`);
    },
    [destination]
  );

  const handleAIPickPress = useCallback(() => {
    if (!aiPick) return;
    hapticImpact();
    captureEvent('food_ai_pick_maps_opened', {
      restaurant: aiPick.name,
      destination,
    });
    const query = encodeURIComponent(`${aiPick.name} ${destination}`);
    Linking.openURL(`https://www.google.com/maps/search/${query}`);
  }, [aiPick, destination]);

  const handleBookmark = useCallback(
    (id: string, e: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      hapticImpact();
      toggleBookmark(id);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1800);
    },
    [toggleBookmark]
  );

  const handlePopularCityPress = useCallback((city: string) => {
    hapticImpact();
    captureEvent('food_popular_city_tapped', { city });
    setPlanWizard({ destination: city });
    router.push('/(tabs)/plan' as never);
  }, [router, setPlanWizard]);

  const handleFsqPlacePress = useCallback((place: FSQPlace) => {
    hapticImpact();
    captureEvent('food_fsq_place_opened', {
      name: place.name,
      category: place.category,
      destination,
    });
    const query = encodeURIComponent(`${place.name} ${destination}`);
    Linking.openURL(`https://www.google.com/maps/search/${query}`);
  }, [destination]);

  const priceLabel = useCallback((price: number | null): string => {
    if (!price) return '';
    return '$'.repeat(Math.min(price, 4));
  }, []);

  const distanceLabel = useCallback((meters: number): string => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  if (!destination) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Eat like a local.</Text>
            <Text style={styles.heroSub}>
              Pick a destination and we will find the spots only locals know about.
            </Text>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular food cities</Text>
            <Text style={styles.sectionSub}>
              Plan a trip to see curated picks
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularCitiesScroll}
          >
            {POPULAR_FOOD_CITIES.map((item) => (
              <Pressable
                key={item.city}
                onPress={() => handlePopularCityPress(item.city)}
                style={({ pressed }) => [
                  styles.popularCityCard,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.popularCityImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', COLORS.overlayDark]}
                  locations={[0.3, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.popularCityContent}>
                  <Text style={styles.popularCityName}>{item.city}</Text>
                  <Text style={styles.popularCityVibe}>{item.vibe}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Eat like a local.</Text>
          <Text style={styles.heroSub}>
            AI-curated picks in {destination}. Tap any spot to open in Google Maps.
          </Text>
        </View>

        {/* ── Sonar Live Food Intel ── */}
        {sonarFood.data ? (
          <View style={styles.sonarSection}>
            <View style={styles.sonarHeader}>
              <Text style={styles.sonarLabel}>{t('food.livePicks', { defaultValue: 'LIVE PICKS' })}</Text>
            </View>
            <SonarCard
              answer={sonarFood.data.answer}
              isLive={sonarFood.isLive}
              citations={sonarFood.citations}
              timestamp={sonarFood.data.timestamp}
              onPress={() => { hapticImpact(); if (destination) Linking.openURL(`https://www.google.com/maps/search/restaurants+${encodeURIComponent(destination)}`).catch(() => {}); }}
            />
          </View>
        ) : !sonarFood.isLoading && !sonarFood.error ? (
          <View style={styles.sonarSection}>
            <Text style={styles.sonarLabel}>{t('food.livePicks', { defaultValue: 'LIVE PICKS' })}</Text>
            <SonarFallback label="Live food intel unavailable" />
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonCard height={200} borderRadius={16} style={{ marginBottom: SPACING.md }} />
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} height={90} borderRadius={14} style={{ marginBottom: 10 }} />
            ))}
          </View>
        ) : null}

        {/* Category filter */}
        {!isLoading && showCategoryFilter && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {FOOD_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleCategoryChange(cat)}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextSelected,
                    ]}
                  >
                    {cat === 'all' ? t('categories.all') : cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* ── Foursquare: Nearby Restaurants ── */}
        {(fsqLoading || fsqPlaces.length > 0) && (
          <View style={styles.fsqSection}>
            <View style={styles.fsqSectionHeader}>
              <Text style={styles.fsqSectionLabel}>
                {t('food.nearbyRestaurants', { defaultValue: 'NEARBY RESTAURANTS' })}
              </Text>
              {fsqLoading && (
                <Text style={styles.fsqLoadingText}>
                  {t('food.loading', { defaultValue: 'Loading...' })}
                </Text>
              )}
            </View>

            {fsqLoading && fsqPlaces.length === 0 ? (
              <View style={styles.fsqSkeletonWrap}>
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} height={72} borderRadius={RADIUS.md} style={{ marginBottom: 8 }} />
                ))}
              </View>
            ) : (
              fsqPlaces.map((place) => (
                <Pressable
                  key={place.fsqId}
                  onPress={() => handleFsqPlacePress(place)}
                  style={({ pressed }) => [
                    styles.fsqCard,
                    { opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <View style={styles.fsqCardAccent} />
                  <View style={styles.fsqCardContent}>
                    <View style={styles.fsqCardTopRow}>
                      <Text style={styles.fsqCardName} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <View style={styles.fsqCardMeta}>
                        {place.price !== null && (
                          <Text style={styles.fsqCardPrice}>{priceLabel(place.price)}</Text>
                        )}
                        {place.rating !== null && (
                          <View style={styles.fsqRatingBadge}>
                            <Text style={styles.fsqRatingText}>
                              {place.rating.toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.fsqCardCategory} numberOfLines={1}>
                      {place.category}
                    </Text>
                    <Text style={styles.fsqCardDistance}>
                      {distanceLabel(place.distance)} away
                    </Text>
                  </View>
                  <ExternalLink
                    size={14}
                    color={COLORS.creamVeryFaint}
                    strokeWidth={1.5}
                    style={styles.fsqExternalIcon}
                  />
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* ── Google Places: Nearby Restaurants ── */}
        {googleRestaurants && googleRestaurants.length > 0 ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>GOOGLE PLACES</Text>
            <Text style={styles.apiSectionHeading}>Highly rated nearby</Text>
            <View style={styles.apiCardStack}>
              {googleRestaurants.map((place, i) => (
                <APIDataCard
                  key={place.placeId ?? i}
                  name={place.name}
                  rating={place.rating ?? null}
                  reviewCount={place.userRatingsTotal ?? null}
                  address={place.vicinity ?? null}
                  category={place.priceLevel != null ? '$'.repeat(place.priceLevel) : null}
                  onPress={() => { hapticImpact(); Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + (place.vicinity ? ' ' + place.vicinity : ''))}`).catch(() => {}); }}
                />
              ))}
            </View>
          </View>
        ) : googleTaLoaded && !googleRestaurants ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>GOOGLE PLACES</Text>
            <SonarFallback label="Couldn't load nearby restaurants" />
          </View>
        ) : null}

        {/* ── TripAdvisor: Top Restaurants ── */}
        {taRestaurants && taRestaurants.length > 0 ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>TRIPADVISOR</Text>
            <Text style={styles.apiSectionHeading}>Top reviewed restaurants</Text>
            <View style={styles.apiCardStack}>
              {taRestaurants.map((loc, i) => (
                <APIDataCard
                  key={loc.locationId ?? i}
                  name={loc.name}
                  rating={loc.rating ?? null}
                  reviewCount={loc.numReviews ?? null}
                  address={loc.address ?? null}
                  category={loc.priceLevel ?? null}
                  onPress={() => { hapticImpact(); Linking.openURL(`https://www.tripadvisor.com/Search?q=${encodeURIComponent(loc.name + ' ' + (destination ?? ''))}`); }}
                />
              ))}
            </View>
          </View>
        ) : googleTaLoaded && !taRestaurants ? (
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionLabel}>TRIPADVISOR</Text>
            <SonarFallback label="Couldn't load top restaurants" />
          </View>
        ) : null}

        {!isLoading && <Animated.View style={{ opacity: fadeAnim }}>
          {/* AI Pick hero card */}
          {aiPick && (selectedCategory === 'all' || selectedCategory === aiPick.category) && (
            <Pressable
              onPress={handleAIPickPress}
              style={({ pressed }) => [
                styles.heroCard,
                { transform: [{ scale: pressed ? 0.99 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.bgCard, COLORS.sageVeryFaint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroBorder} />
              <View style={styles.heroTopRow}>
                <View style={styles.aiPickBadge}>
                  <Text style={styles.aiPickBadgeText}>AI Pick</Text>
                </View>
                {aiPick.updatedToday && (
                  <Text style={styles.updatedToday}>Updated today</Text>
                )}
              </View>
              <Text style={styles.heroName}>{aiPick.name}</Text>
              <Text style={styles.heroCuisine}>
                {aiPick.cuisine} · {aiPick.neighborhood}
              </Text>
              {aiPick.mustTry && (
                <View style={styles.mustTryRow}>
                  <Text style={styles.mustTryLabel}>Must Try</Text>
                  <Text style={styles.mustTryDish}>{aiPick.mustTry}</Text>
                </View>
              )}
              {aiPick.insiderTip && (
                <Text style={styles.insiderTip} numberOfLines={2}>
                  — {aiPick.insiderTip}
                </Text>
              )}
              <View style={styles.heroBottomRow}>
                <Text style={styles.heroPrice}>
                  {getPriceRangeDisplay(aiPick.priceRange)}
                </Text>
                <View style={styles.heroStatusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isOpenNow(aiPick.opensAt, aiPick.closesAt)
                          ? COLORS.sage
                          : COLORS.coral,
                      },
                    ]}
                  />
                  <Text style={styles.heroStatusText}>
                    {isOpenNow(aiPick.opensAt, aiPick.closesAt)
                      ? 'Open now'
                      : `Closes at ${getClosesAtDisplay(aiPick.closesAt)}`}
                  </Text>
                </View>
                <Text style={styles.heroDistance}>
                  {getWalkTime(aiPick.distance)} · {aiPick.distance}
                </Text>
              </View>
            </Pressable>
          )}

          {/* See all AI picks — stub link when more than one */}
          {aiPick && morePicks.length > 0 && (
            <Pressable
              onPress={() => handleCategoryChange('all')}
              style={styles.seeAllRow}
            >
              <Text style={styles.seeAllText}>See all picks</Text>
            </Pressable>
          )}

          {/* More picks section */}
          {filteredRestaurants.length === 0 ? (
            <View style={styles.emptyList}>
              <UtensilsCrossed size={40} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
              <Text style={styles.emptyListTitle}>{t('food.noResults')}</Text>
              <Text style={styles.emptyListSub}>Try another filter</Text>
            </View>
          ) : morePicks.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>More picks</Text>
              {morePicks.map((r) => {
                const isBookmarked = bookmarkedIds.includes(r.id);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => handleCardPress(r)}
                    style={({ pressed }) => [
                      styles.restaurantCard,
                      { opacity: pressed ? 0.95 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardAccent,
                        { backgroundColor: getAccentColor(r.category) },
                      ]}
                    />
                    <Text style={styles.cardName}>{r.name}</Text>
                    <Text style={styles.cardCategory}>{r.category}</Text>
                    {(r.tryDish || r.mustTry) && (
                      <View style={styles.tryRow}>
                        <Text style={styles.tryLabel}>Try:</Text>
                        <Text style={styles.tryDish}>{r.tryDish ?? r.mustTry}</Text>
                      </View>
                    )}
                    {r.description && (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {r.description}
                      </Text>
                    )}
                    <View style={styles.cardBottomRow}>
                      <Text style={styles.cardPrice}>
                        {getPriceRangeDisplay(r.priceRange)}
                      </Text>
                      <View style={styles.cardStatusRow}>
                        <View
                          style={[
                            styles.statusDotSmall,
                            {
                              backgroundColor: isOpenNow(r.opensAt, r.closesAt)
                                ? COLORS.sage
                                : COLORS.coral,
                            },
                          ]}
                        />
                        <Text style={styles.cardDistance}>
                          {isOpenNow(r.opensAt, r.closesAt)
                            ? 'Open now'
                            : `Closed · Closes ${getClosesAtDisplay(r.closesAt)}`}{' '}
                          · {getWalkTime(r.distance)}
                        </Text>
                      </View>
                      <View style={styles.cardActionsRow}>
                        <ExternalLink size={14} color={COLORS.creamVeryFaint} strokeWidth={1.5} />
                        <Pressable
                          onPress={(e) => handleBookmark(r.id, e as { stopPropagation?: () => void })}
                          hitSlop={12}
                          style={styles.bookmarkBtn}
                        >
                          <Bookmark
                            size={18}
                            color={COLORS.creamDim}
                            fill={isBookmarked ? COLORS.sage : 'transparent'}
                            strokeWidth={1.5}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </>
          ) : null}
        </Animated.View>}

        {/* Local Eats Radar nav card */}
        <Pressable
          onPress={() => {
            hapticImpact();
            router.push({ pathname: '/local-eats', params: { destination } } as never);
          }}
          style={({ pressed }) => [
            styles.localEatsNavCard,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityLabel="Local Eats Radar"
          accessibilityRole="button"
        >
          <View style={styles.localEatsNavLeft}>
            <MapPin size={20} color={COLORS.sage} strokeWidth={1.5} />
            <View>
              <Text style={styles.localEatsNavTitle}>Local Eats Radar</Text>
              <Text style={styles.localEatsNavSub}>Authentic spots locals actually eat at</Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      </ScrollView>

      {/* Saved toast */}
      {savedToast && (
          <View style={styles.toastWrap}>
          <Text style={styles.toastText}>Saved</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles

