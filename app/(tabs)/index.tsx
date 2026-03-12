// =============================================================================
// ROAM — Discover / Home Screen
// Premium: cinematic hero, glassmorphism, animated bg, masonry cards
// =============================================================================
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Animated,
  Platform,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  DESTINATIONS,
  HIDDEN_DESTINATIONS,
  DESTINATION_CATEGORIES,
  BUDGETS,
} from '../../lib/constants';
import { ICONS } from '../../lib/icons';
import { useAppStore, getActiveTrip, getActiveTripDayIndex } from '../../lib/store';
import { parseItinerary, type Itinerary } from '../../lib/types/itinerary';
import PlacesInput from '../../components/features/PlacesInput';
import { getLocalPrefs, getPersonalizedMessage } from '../../lib/personalization';
import type { PlacePrediction } from '../../lib/places';
import MoodSection from '../../components/features/MoodSection';
import SurpriseMe from '../../components/features/SurpriseMe';
import PocketConcierge from '../../components/features/PocketConcierge';
import { getForYouFeed } from '../../lib/recommendations';
import type { Destination } from '../../lib/constants';
import { CURATED_DAILY_BACKGROUNDS } from '../../lib/curated-backgrounds';
import { getDestinationPhoto } from '../../lib/photos';
import SeasonalBadge from '../../components/features/SeasonalBadge';
import { useCurrency } from '../../components/features/CurrencyToggle';
import { formatUSD } from '../../lib/currency';
import { resolveUnsplashPhoto } from '../../lib/unsplash';
import Slider from '@react-native-community/slider';
import Svg, { Rect, Circle } from 'react-native-svg';
import ShimmerOverlay from '../../components/ui/ShimmerOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const DEST_CARD_WIDTH = SCREEN_WIDTH * 0.85;
const DEST_CARD_HEIGHT = 260;
const CARD_GAP = SPACING.md;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - CARD_GAP) / 2;
const HERO_MIN_HEIGHT = isWeb ? SCREEN_HEIGHT : Math.round(SCREEN_HEIGHT * 0.62);
const HERO_DESTINATIONS = [
  'Tokyo',
  'Bali',
  'Bangkok',
  'Lisbon',
  'Paris',
  'Barcelona',
  'Rome',
  'Amsterdam',
  'Kyoto',
  'Seoul',
  'Singapore',
  'Istanbul',
  'Cape Town',
  'Medellín',
  'Reykjavik',
] as const;

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff =
    d.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);

  // ── Live Trip Mode ───────────────────────────────────────────────────
  const activeTripId = useAppStore((s) => s.activeTripId);
  const activeTrip = useMemo(() => (activeTripId ? getActiveTrip() : null), [activeTripId]);
  const activeDayIndex = useMemo(() => (activeTrip ? getActiveTripDayIndex() : -1), [activeTrip]);

  // Parse itinerary for today's plan
  const todaysPlan = useMemo(() => {
    if (!activeTrip) return null;
    try {
      const itin: Itinerary = parseItinerary(activeTrip.itinerary);
      const day = itin.days[activeDayIndex];
      if (!day) return null;
      return { destination: itin.destination, dayNum: activeDayIndex + 1, totalDays: itin.days.length, theme: day.theme, morning: day.morning, afternoon: day.afternoon, evening: day.evening };
    } catch {
      return null;
    }
  }, [activeTrip, activeDayIndex]);

  // Pulsing green dot animation
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const chaosPulseAnim = useMemo(() => new Animated.Value(1), []);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chaosPulseAnim, { toValue: 0.85, duration: 1200, useNativeDriver: true }),
        Animated.timing(chaosPulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [chaosPulseAnim]);
  useEffect(() => {
    if (!activeTripId) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeTripId, pulseAnim]);

  // ── State ──────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBudget, setActiveBudget] = useState<string | null>(null);
  const [budgetSliderMax, setBudgetSliderMax] = useState<number | null>(null);
  const [_personalizedMsg, setPersonalizedMsg] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string>(() => {
    const idx = dayOfYear(new Date()) % CURATED_DAILY_BACKGROUNDS.length;
    const ref = CURATED_DAILY_BACKGROUNDS[idx];
    return ref?.fallbackUrl ?? getDestinationPhoto('travel');
  });
  const [searchValue, setSearchValue] = useState('');
  const [forYouFeed, setForYouFeed] = useState<{ destination: Destination; score: number; reasons: string[] }[]>([]);
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, boolean>>({});
  const scrollY = useRef(new Animated.Value(0)).current;
  const hasCompletedProfile = useAppStore((s) => s.hasCompletedProfile);
  const trips = useAppStore((s) => s.trips);

  const { currency, rates } = useCurrency();
  const tripsPlanned = trips.length;
  const countriesExplored = useMemo(() => {
    const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
    const destByLabel = new Map(all.map((d) => [d.label, d]));
    const codes = new Set<string>();
    for (const t of trips) {
      const match = destByLabel.get(t.destination);
      if (match?.country) codes.add(match.country);
    }
    return codes.size;
  }, [trips]);

  // ── Rotating cinematic background (daily) ───────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const idx = dayOfYear(new Date()) % CURATED_DAILY_BACKGROUNDS.length;
    const ref = CURATED_DAILY_BACKGROUNDS[idx];
    if (ref) {
      setBackgroundUrl(ref.fallbackUrl);
      resolveUnsplashPhoto(ref).then((url) => {
        if (!cancelled) setBackgroundUrl(url);
      });
    }
    return () => { cancelled = true; };
  }, []);

  // Subtle personalization (no streak gamification)
  useEffect(() => {
    let cancelled = false;
    getLocalPrefs()
      .then((prefs) => {
        const msg = getPersonalizedMessage(prefs);
        if (!cancelled && msg) setPersonalizedMsg(msg);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ── Load "For You" feed ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadFeed() {
      try {
        const feed = await getForYouFeed({ limit: 8, includeHidden: true });
        if (!cancelled) setForYouFeed(feed);
      } catch { /* silent */ }
    }
    loadFeed();
    return () => { cancelled = true; };
  }, [hasCompletedProfile]);

  // Budget ranges for filtering (dailyCost USD)
  const budgetRanges: Record<string, [number, number]> = {
    backpacker: [0, 75],
    comfort: [75, 200],
    'treat-yourself': [200, 500],
    'no-budget': [500, 99999],
  };

  // ── Filtering ──────────────────────────────────────────────────────────
  const filteredDestinations = useMemo(() => {
    const base = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
    let filtered = base;
    if (activeCategory !== 'all') {
      filtered = filtered.filter((d) => d.category === activeCategory);
    }
    if (budgetSliderMax !== null) {
      filtered = filtered.filter((d) => d.dailyCost >= 30 && d.dailyCost <= budgetSliderMax);
    } else if (activeBudget && budgetRanges[activeBudget]) {
      const [min, max] = budgetRanges[activeBudget];
      filtered = filtered.filter((d) => d.dailyCost >= min && d.dailyCost < max);
    }
    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      filtered = filtered.filter((d) =>
        d.label.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [activeCategory, activeBudget, budgetSliderMax, searchValue]);

  // Trending — top by trendScore; when budget filter active, sort by dailyCost ascending
  const trending = useMemo(() => {
    const sorted =
      budgetSliderMax !== null || activeBudget
        ? [...filteredDestinations].sort((a, b) => a.dailyCost - b.dailyCost)
        : [...filteredDestinations].sort((a, b) => b.trendScore - a.trendScore);
    return sorted.slice(0, 8);
  }, [filteredDestinations, budgetSliderMax, activeBudget]);

  // Current month for seasonal badges (1-12)
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  // Seasonal picks — destinations in season this month, sorted by trend
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const seasonalPicks = useMemo(() => {
    const base = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
    return base
      .filter((d) => d.bestMonths.includes(currentMonth))
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 6);
  }, [currentMonth]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleDestinationPress = useCallback(
    (label: string) => {
      setPlanWizard({ destination: label });
      router.push('/(tabs)/plan');
    },
    [setPlanWizard, router]
  );

  const handleSearchSelect = useCallback(
    (place: PlacePrediction) => {
      setPlanWizard({ destination: place.mainText });
      setSearchValue('');
      router.push('/(tabs)/plan');
    },
    [setPlanWizard, router]
  );
  const featuredDestinationLabel =
    HERO_DESTINATIONS[dayOfYear(new Date()) % HERO_DESTINATIONS.length] ?? 'Tokyo';
  const featuredDestination =
    [...DESTINATIONS, ...HIDDEN_DESTINATIONS].find((d) => d.label === featuredDestinationLabel) ??
    DESTINATIONS[0];
  const featuredPhotoUrl = getDestinationPhoto(featuredDestination.label);
  const parallaxY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 600],
        outputRange: [0, 12],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <ImageBackground
      source={{ uri: backgroundUrl }}
      style={[styles.container, { paddingTop: insets.top }]}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(8,12,10,0.12)', 'rgba(8,12,10,0.68)', 'rgba(8,12,10,0.96)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        removeClippedSubviews={!isWeb}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Full-bleed hero (luxury magazine cover) */}
        {!todaysPlan && (
          <>
          <Pressable
            style={({ pressed }) => [
              styles.hero,
              { opacity: pressed ? 0.98 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleDestinationPress(featuredDestination.label);
            }}
            accessibilityRole="button"
            accessibilityLabel={`View ${featuredDestination.label}`}
          >
            <View style={styles.heroImageWrap}>
              <ShimmerOverlay visible={!loadedPhotos.hero} />
              <ImageBackground
                source={{ uri: featuredPhotoUrl }}
                style={styles.heroImage}
                imageStyle={styles.heroImageInner}
                resizeMode="cover"
                onLoad={() => setLoadedPhotos((p) => ({ ...p, hero: true }))}
              >
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.24)', 'rgba(0,0,0,0.9)']}
                locations={[0, 0.46, 1]}
                style={styles.heroGradient}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.brandRow}>
                    <ICONS.discover size={26} color={COLORS.accentGold} strokeWidth={2.5} />
                    <Text style={styles.brand}>ROAM</Text>
                  </View>
                  <Text style={styles.heroKicker}>WHERE TO NEXT</Text>
                </View>

                <Text style={styles.heroDestination}>{featuredDestination.label}</Text>
                <Text style={styles.heroHook} numberOfLines={2}>
                  {featuredDestination.hook}
                </Text>
                <Text style={styles.heroMeta}>
                  {tripsPlanned > 0
                    ? `${tripsPlanned} trip${tripsPlanned === 1 ? '' : 's'} planned`
                    : "Tap anywhere or search below — we'll help you plan"}
                  {countriesExplored > 0 ? `  ·  ${countriesExplored} countr${countriesExplored === 1 ? 'y' : 'ies'} explored` : ''}
                </Text>

                <View style={styles.heroSearch}>
                  <PlacesInput
                    value={searchValue}
                    onSelect={handleSearchSelect}
                    placeholder="Where do you want to go? Tokyo, Bali, anywhere..."
                  />
                </View>
              </LinearGradient>
            </ImageBackground>
            </View>
          </Pressable>

          {/* Chaos Mode — hero feature, front and center */}
          <Pressable
            style={({ pressed }) => [
              styles.chaosModeButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/chaos-mode');
            }}
            accessibilityRole="button"
            accessibilityLabel="Surprise me — ROAM picks everything for you"
          >
            <Animated.View style={[styles.chaosModeInner, { transform: [{ scale: chaosPulseAnim }] }]}>
              <LinearGradient
                colors={['#C0392B', '#E74C3C', '#C0392B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chaosModeGradient}
              >
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Rect x={2} y={2} width={16} height={16} rx={2} ry={2} stroke={COLORS.cream} strokeWidth={1.5} fill="none" />
                  <Circle cx={10} cy={10} r={1.5} stroke={COLORS.cream} strokeWidth={1.5} fill="none" />
                </Svg>
                <View style={{ flex: 1 }}>
                <Text style={styles.chaosModeLabel}>SURPRISE ME</Text>
                <Text style={styles.chaosModeSub}>We pick the destination, budget, and vibes. You just pack.</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </Pressable>
          </>
        )}

        {/* Live Trip Mode header */}
        {todaysPlan && (
          <View style={styles.headerSection}>
            <View style={styles.liveHeader}>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
              <Text style={styles.liveBrand}>LIVE — {todaysPlan.destination}</Text>
            </View>
            <Text style={styles.liveSubtitle}>Day {todaysPlan.dayNum} of {todaysPlan.totalDays}</Text>
          </View>
        )}

        {/* Today's Plan card (Live Trip Mode) */}
        {todaysPlan && (
          <Pressable
            style={({ pressed }) => [styles.todayCard, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (activeTrip) router.push({ pathname: '/itinerary', params: { tripId: activeTrip.id } });
            }}
            accessibilityRole="button"
            accessibilityLabel={`See full itinerary for ${todaysPlan.destination}, Day ${todaysPlan.dayNum}`}
          >
            <Text style={styles.todayTheme}>{todaysPlan.theme}</Text>
            <View style={styles.todaySlots}>
              <View style={styles.todaySlot}>
                <Text style={styles.todayTime}>Morning</Text>
                <Text style={styles.todayActivity} numberOfLines={1}>{todaysPlan.morning.activity}</Text>
              </View>
              <View style={styles.todaySlot}>
                <Text style={styles.todayTime}>Afternoon</Text>
                <Text style={styles.todayActivity} numberOfLines={1}>{todaysPlan.afternoon.activity}</Text>
              </View>
              <View style={styles.todaySlot}>
                <Text style={styles.todayTime}>Evening</Text>
                <Text style={styles.todayActivity} numberOfLines={1}>{todaysPlan.evening.activity}</Text>
              </View>
            </View>
            <Text style={styles.todayCta}>View your full itinerary →</Text>
          </Pressable>
        )}

        {/* ── Mood section ── */}
        {!todaysPlan && activeCategory === 'all' && !searchValue.trim() && (
          <MoodSection />
        )}

        {/* ── Surprise Me ── */}
        {!todaysPlan && activeCategory === 'all' && !searchValue.trim() && (
          <SurpriseMe />
        )}

        {/* ── Dupe Finder CTA ── */}
        {!todaysPlan && activeCategory === 'all' && !searchValue.trim() && (
          <Pressable
            style={({ pressed }) => [styles.dupeFinderCta, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/dupe-finder');
            }}
          >
            <Text style={styles.dupeFinderCtaText}>Travel on a budget? </Text>
            <Text style={styles.dupeFinderCtaLink}>Find a similar spot for less →</Text>
          </Pressable>
        )}

        {/* ── Made for you ── */}
        {!todaysPlan && activeCategory === 'all' && !searchValue.trim() && forYouFeed.length > 0 && (
          <View style={styles.forYouSection}>
            <View style={styles.forYouHeader}>
              <Text style={styles.forYouTitle}>Made for you</Text>
              <Text style={styles.forYouSubtitle}>
                {hasCompletedProfile ? 'Pulled from your profile and past picks' : 'Trending and seasonal picks to inspire your next trip'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forYouRow}
            >
              {forYouFeed.slice(0, 8).map((item) => {
                const dest = item.destination;
                const photoUrl = getDestinationPhoto(dest.label);
                const topReason = item.reasons?.[0] ?? '';

                return (
                  <Pressable
                    key={dest.label}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleDestinationPress(dest.label);
                    }}
                    style={({ pressed }) => [styles.forYouCard, { opacity: pressed ? 0.95 : 1 }]}
                  >
                    <View style={styles.forYouImageWrap}>
                      <ShimmerOverlay visible={!loadedPhotos[`forYou-${dest.label}`]} />
                      <ImageBackground
                        source={{ uri: photoUrl }}
                        style={styles.forYouImage}
                        resizeMode="cover"
                        onLoad={() => setLoadedPhotos((p) => ({ ...p, [`forYou-${dest.label}`]: true }))}
                      >
                      <LinearGradient
                        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.88)']}
                        locations={[0, 0.5, 1]}
                        style={styles.forYouGradient}
                      >
                        <Text style={styles.forYouLabel}>{dest.label}</Text>
                        <Text style={styles.forYouHook} numberOfLines={2}>{dest.hook}</Text>
                        {topReason ? (
                          <Text style={styles.forYouReason} numberOfLines={2}>{topReason}</Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, alignItems: 'center', marginTop: SPACING.xs }}>
                          <Text style={styles.forYouPrice}>from {rates && currency !== 'USD' ? formatUSD(dest.dailyCost, currency, rates) : `$${dest.dailyCost}`}/day</Text>
                          <SeasonalBadge destination={dest.label} variant="pill" />
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Budget filter */}
        {!todaysPlan && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetRow}
            style={styles.budgetScroll}
          >
            <Pressable
              style={({ pressed }) => [
                styles.budgetPill,
                !activeBudget && budgetSliderMax === null && styles.budgetPillActive,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveBudget(null);
                setBudgetSliderMax(null);
              }}
            >
              <Text style={[styles.budgetPillLabel, !activeBudget && budgetSliderMax === null && styles.budgetPillLabelActive]}>All</Text>
            </Pressable>
            {BUDGETS.map((b) => {
              const isActive = activeBudget === b.id && budgetSliderMax === null;
              return (
                <Pressable
                  key={b.id}
                  style={({ pressed }) => [
                    styles.budgetPill,
                    isActive && styles.budgetPillActive,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveBudget(b.id);
                    setBudgetSliderMax(null);
                  }}
                >
                  <Text style={[styles.budgetPillLabel, isActive && styles.budgetPillLabelActive]}>{b.range}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Budget slider — $30–500/day */}
        {!todaysPlan && (
          <View style={styles.budgetSliderSection}>
            <View style={styles.budgetSliderHeader}>
              <Text style={styles.budgetSliderLabel}>Max daily budget</Text>
              <Text style={styles.budgetSliderValue}>
                {budgetSliderMax !== null ? `$${budgetSliderMax}` : 'Any'}
              </Text>
            </View>
            <Slider
              style={styles.budgetSlider}
              minimumValue={30}
              maximumValue={500}
              step={10}
              value={budgetSliderMax ?? 500}
              onValueChange={(v) => {
                setBudgetSliderMax(Math.round(v));
                setActiveBudget(null);
              }}
              onSlidingComplete={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              minimumTrackTintColor={COLORS.sage}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.sage}
            />
          </View>
        )}

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {DESTINATION_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategory(cat.id);
                }}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillLabel,
                    isActive && styles.categoryPillLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Destination cards (85vw, overlap) ── */}
        {filteredDestinations.length > 0 && (
          <View style={styles.destSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDot}>·</Text>
              <Text style={styles.sectionTitle}>
                {activeCategory === 'all' && seasonalPicks.length > 0
                  ? `Best in ${MONTH_NAMES[currentMonth - 1]}`
                  : 'Trending now'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destRow}
            >
              {(activeCategory === 'all' && seasonalPicks.length > 0 ? seasonalPicks.slice(0, 8) : trending).map((dest) => {
                const photoUrl = getDestinationPhoto(dest.label);
                const country = dest.country ? regionNames.of(dest.country) : '';

                return (
                  <Pressable
                    key={dest.label}
                    style={({ pressed }) => [
                      styles.destCard,
                      { opacity: pressed ? 0.95 : 1 },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleDestinationPress(dest.label);
                    }}
                  >
                    <ImageBackground
                      source={{ uri: photoUrl }}
                      style={styles.destImage}
                      imageStyle={styles.destImageInner}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                        locations={[0.3, 0.7, 1]}
                        style={styles.destGradient}
                      >
                        <View style={styles.destBadges}>
                          <View style={styles.pricePill}>
                            <Text style={styles.pricePillText}>from {rates && currency !== 'USD' ? formatUSD(dest.dailyCost, currency, rates) : `$${dest.dailyCost}`}/day</Text>
                          </View>
                          <SeasonalBadge destination={dest.label} month={currentMonth} variant="pill" />
                        </View>
                        <Text style={styles.destCity}>{dest.label}</Text>
                        {country && (
                          <Text style={styles.destCountry}>{country}</Text>
                        )}
                        <Text style={styles.destHook} numberOfLines={2}>{dest.hook}</Text>
                      </LinearGradient>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Additional destinations (rest of filtered) */}
        {filteredDestinations.length > 8 && (
          <View style={styles.destSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDot}>·</Text>
              <Text style={styles.sectionTitle}>More to explore</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destRow}
            >
              {filteredDestinations
                .filter((d) => {
                  const inSeasonal = activeCategory === 'all' && seasonalPicks.some((s) => s.label === d.label);
                  const inTrending = trending.some((t) => t.label === d.label);
                  return !inSeasonal && !inTrending;
                })
                .slice(0, 10)
                .map((dest) => {
                  const photoUrl = getDestinationPhoto(dest.label);
                  const country = dest.country ? regionNames.of(dest.country) : '';

                  return (
                    <Pressable
                      key={dest.label}
                    style={({ pressed }) => [styles.destCard, { opacity: pressed ? 0.95 : 1 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleDestinationPress(dest.label);
                    }}
                  >
                    <View style={styles.destImageWrap}>
                      <ShimmerOverlay visible={!loadedPhotos[`dest2-${dest.label}`]} />
                      <Animated.View style={[styles.destImageParallax, { transform: [{ translateY: parallaxY }] }]}>
                        <ImageBackground
                          source={{ uri: photoUrl }}
                          style={styles.destImage}
                          imageStyle={styles.destImageInner}
                          resizeMode="cover"
                          onLoad={() => setLoadedPhotos((p) => ({ ...p, [`dest2-${dest.label}`]: true }))}
                        >
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                            locations={[0.3, 0.7, 1]}
                            style={styles.destGradient}
                          >
                            <View style={styles.destBadges}>
                              <View style={styles.pricePill}>
                                <Text style={styles.pricePillText}>from {rates && currency !== 'USD' ? formatUSD(dest.dailyCost, currency, rates) : `$${dest.dailyCost}`}/day</Text>
                              </View>
                              <SeasonalBadge destination={dest.label} month={currentMonth} variant="pill" />
                            </View>
                            <Text style={styles.destCity}>{dest.label}</Text>
                            {country && <Text style={styles.destCountry}>{country}</Text>}
                            <Text style={styles.destHook} numberOfLines={2}>{dest.hook}</Text>
                          </LinearGradient>
                        </ImageBackground>
                      </Animated.View>
                    </View>
                  </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* Empty state */}
        {filteredDestinations.length === 0 && (
          <View style={styles.emptyState}>
            <ICONS.empty size={48} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              No matches for that vibe. Try switching filters — there's always somewhere worth going.
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* Pocket Concierge — floating AI button */}
      <PocketConcierge />
    </ImageBackground>
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
  bgImage: {
    // Slightly darken edges via overlay gradient; keep image crisp.
  } as ImageStyle,
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  hero: {
    width: '100%',
    minHeight: HERO_MIN_HEIGHT,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroImageWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
  } as ViewStyle,
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  heroKicker: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: 'rgba(245,237,216,0.75)',
    letterSpacing: 2.2,
  } as TextStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 72,
    color: COLORS.white,
    lineHeight: 60,
    letterSpacing: 0.6,
  } as TextStyle,
  heroSearch: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  headerSection: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  brand: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.gold,
    letterSpacing: 4,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,

  // Search
  searchWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    zIndex: 100,
  } as ViewStyle,

  // Category chips
  budgetScroll: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  budgetRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  budgetPill: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  } as ViewStyle,
  budgetPillActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  budgetPillLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  budgetPillLabelActive: {
    color: COLORS.sage,
  } as TextStyle,
  budgetSliderSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  budgetSliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  budgetSliderLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  budgetSliderValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  budgetSlider: {
    width: '100%',
    height: 28,
  } as ViewStyle,
  chipsScroll: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  chipsRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  budgetChipsRow: {
    marginTop: -SPACING.sm,
  } as ViewStyle,
  categoryPill: {
    height: 36,
    paddingHorizontal: SPACING.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cream,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  } as ViewStyle,
  categoryPillActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  } as ViewStyle,
  categoryPillLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  categoryPillLabelActive: {
    color: COLORS.bg,
  } as TextStyle,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  heroBlock: {
    position: 'relative',
  } as ViewStyle,
  searchHero: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
  } as ViewStyle,
  chipActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  chipLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  chipLabelActive: {
    color: COLORS.sage,
  } as TextStyle,

  destSection: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionDot: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gold,
  } as TextStyle,
  sectionTitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(245,237,216,0.6)',
  } as TextStyle,
  destRow: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
  } as ViewStyle,
  destCard: {
    width: DEST_CARD_WIDTH,
    height: DEST_CARD_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginRight: -32,
  } as ViewStyle,
  destImageWrap: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  destImageParallax: {
    flex: 1,
  } as ViewStyle,
  destImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  } as ImageStyle,
  destImageInner: {
    borderRadius: RADIUS.lg,
  } as ImageStyle,
  destPlaceholder: {
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  destGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  } as ViewStyle,
  destBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  pricePill: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  pricePillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
  seasonPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  seasonPillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,
  destCity: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
  destCountry: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.15,
    marginTop: 2,
  } as TextStyle,
  destHook: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(245,237,216,0.85)',
    marginTop: SPACING.xs,
    lineHeight: 20,
  } as TextStyle,

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  // Card
  card: {
    width: CARD_WIDTH,
    aspectRatio: 0.85,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  cardImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  } as ImageStyle,
  cardImageInner: {
    borderRadius: RADIUS.lg,
  } as ImageStyle,
  cardPlaceholder: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    overflow: 'hidden',
  } as ViewStyle,
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  cardLoadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  cardLoader: {
    marginTop: SPACING.sm,
  } as ViewStyle,
  cardContent: {
    padding: SPACING.sm + 2,
  } as ViewStyle,
  cardLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.white,
  } as TextStyle,
  cardCountry: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  cardHook: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 2,
    opacity: 0.9,
  } as TextStyle,
  priceBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    zIndex: 3,
  } as ViewStyle,
  priceBadgeText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 0.3,
  } as TextStyle,
  cardSeasonBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(124,175,138,0.25)',
    borderWidth: 1,
    borderColor: COLORS.sage,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    zIndex: 3,
  } as ViewStyle,
  cardSeasonText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.3,
  } as TextStyle,

  // Trending Now
  seasonalSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  seasonalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  seasonalEmoji: {
    fontSize: 18,
  } as TextStyle,
  seasonalTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  seasonalRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  seasonalCard: {
    width: 140,
    height: 120,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  } as ViewStyle,
  seasonalImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
  } as ViewStyle,
  seasonalImagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  seasonalLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  seasonalPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  trendingSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  trendingTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
  trendingRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  trendingCard: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6 * 1.3,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  trendingImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  } as ImageStyle,
  trendingGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  } as ViewStyle,
  trendingRankBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.coral,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  trendingRankText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.white,
    letterSpacing: 0.5,
  } as TextStyle,
  seasonBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(124,175,138,0.25)',
    borderWidth: 1,
    borderColor: COLORS.sage,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  seasonBadgeText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.sage,
  } as TextStyle,
  trendingBottom: {
  } as ViewStyle,
  trendingLabel: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.white,
    letterSpacing: 0.5,
  } as TextStyle,
  trendingHook: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: 2,
    opacity: 0.9,
  } as TextStyle,
  trendingPrice: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 4,
    letterSpacing: 0.3,
  } as TextStyle,
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.md,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
  errorBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.sm + 2,
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: `${COLORS.coral}44`,
  } as ViewStyle,
  heroScroll: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  heroCard: {
    width: SCREEN_WIDTH * 0.78,
    height: SCREEN_WIDTH * 0.78 * 1.2,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  } as ViewStyle,
  heroImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  } as ImageStyle,
  heroImageInner: {
    borderRadius: RADIUS.xl,
  } as ImageStyle,
  heroPlaceholder: {
    flex: 1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    overflow: 'hidden',
  } as ViewStyle,
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  } as ViewStyle,
  heroLabel: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.white,
    letterSpacing: 1,
  } as TextStyle,
  heroHook: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
    marginTop: SPACING.xs,
    opacity: 0.95,
  } as TextStyle,
  heroMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(245,237,216,0.72)',
    letterSpacing: 1,
    marginTop: SPACING.sm,
  } as TextStyle,
  errorBannerText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,

  personalizedBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  personalizedText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
    fontStyle: 'italic',
  } as TextStyle,

  // Live Trip Mode
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  liveBrand: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  liveSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
  todayCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: 'rgba(124,175,138,0.08)',
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  todayTheme: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.gold,
    marginBottom: SPACING.md,
  } as TextStyle,
  todaySlots: {
    gap: SPACING.sm,
  } as ViewStyle,
  todaySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  todayTime: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    width: 70,
  } as TextStyle,
  todayActivity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  todayCta: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: SPACING.md,
    textAlign: 'right',
  } as TextStyle,

  // ── For You Feed ──
  chaosModeButton: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  chaosModeInner: {
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  chaosModeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  chaosModeLabel: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.white,
    letterSpacing: 1.5,
  } as TextStyle,
  chaosModeSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  } as TextStyle,
  dupeFinderCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.lg,
  } as ViewStyle,
  dupeFinderCtaText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  dupeFinderCtaLink: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  forYouSection: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  forYouHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  forYouTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  forYouSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginTop: 2,
  } as TextStyle,
  forYouRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  forYouCard: {
    width: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  forYouImageWrap: {
    width: 200,
    height: 260,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  forYouImage: {
    width: 200,
    height: 260,
    justifyContent: 'flex-end',
  } as ViewStyle,
  forYouGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  } as ViewStyle,
  forYouLabel: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  forYouHook: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.8,
    marginTop: 2,
  } as TextStyle,
  forYouReason: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
  } as TextStyle,
  forYouPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.6,
    marginTop: 2,
  } as TextStyle,
});
