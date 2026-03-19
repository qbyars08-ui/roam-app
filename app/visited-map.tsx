// =============================================================================
// ROAM — Visited Map
// Beautiful world grid showing visited places, stats, and bucket list
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';

import { ChevronLeft, MapPin, X, Navigation, Layers } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  type VisitedPlace,
  type BucketListPlace,
  type VisitedStats,
  getVisitedPlaces,
  addVisitedPlace,
  removeVisitedPlace,
  getVisitedStats,
  syncFromTrips,
  getBucketList,
  addBucketListPlace,
  removeBucketListPlace,
  lookupDestination,
  getDestinationSuggestions,
  getDestinationCoords,
  COUNTRIES_PER_CONTINENT,
  ALL_CONTINENTS,
  WORLD_GRID,
} from '../lib/visited-store';
import { buildVisitedMapUrl, buildHeatmapUrl, isMapboxConfigured } from '../lib/mapbox';

// ---------------------------------------------------------------------------
// Milestone thresholds
// ---------------------------------------------------------------------------
const MILESTONES = [10, 25, 50, 100, 150, 200];

function getNextMilestone(count: number): number {
  for (const m of MILESTONES) {
    if (count < m) return m;
  }
  return count + 50;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function VisitedMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // State
  const [places, setPlaces] = useState<VisitedPlace[]>([]);
  const [bucketList, setBucketList] = useState<BucketListPlace[]>([]);
  const [stats, setStats] = useState<VisitedStats>({
    totalPlaces: 0,
    totalCountries: 0,
    totalContinents: 0,
    totalMilesTraveled: 0,
    continentBreakdown: {},
  });
  const [addInput, setAddInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [bucketInput, setBucketInput] = useState('');
  const [bucketSuggestions, setBucketSuggestions] = useState<string[]>([]);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [_isBucketMode, _setIsBucketMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedCard, setSelectedCard] = useState<VisitedPlace | BucketListPlace | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Load data
  const loadData = useCallback(async () => {
    const [p, bl] = await Promise.all([getVisitedPlaces(), getBucketList()]);
    setPlaces(p);
    setBucketList(bl);
    const s = await getVisitedStats();
    setStats(s);
  }, []);

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData intentionally excluded
  }, [fadeAnim, slideAnim]);

  // Derived data
  const visitedCountries = useMemo(() => {
    const map = new Map<string, VisitedPlace[]>();
    for (const p of places) {
      const existing = map.get(p.country) ?? [];
      existing.push(p);
      map.set(p.country, existing);
    }
    return map;
  }, [places]);

  const visitedCountrySet = useMemo(
    () => new Set(places.map((p) => p.country)),
    [places]
  );

  const mostVisitedContinent = useMemo(() => {
    let max = '';
    let maxCount = 0;
    for (const [cont, count] of Object.entries(stats.continentBreakdown)) {
      if (count > maxCount) {
        max = cont;
        maxCount = count;
      }
    }
    return max || '';
  }, [stats]);

  const mostVisitedCountry = useMemo(() => {
    let max = '';
    let maxCount = 0;
    for (const [country, arr] of visitedCountries) {
      if (arr.length > maxCount) {
        max = country;
        maxCount = arr.length;
      }
    }
    return max || '';
  }, [visitedCountries]);

  const worldExploredPct = useMemo(
    () => ((stats.totalCountries / 195) * 100).toFixed(1),
    [stats.totalCountries]
  );

  // Mapbox static map: visited (sage) + planned (gold) pins, dark-v11
  const visitedMapUrl = useMemo(() => {
    if (!isMapboxConfigured()) return null;
    const visitedCoords = places
      .map((p) => getDestinationCoords(p.destination))
      .filter((c): c is { lat: number; lng: number } => c !== null);
    const plannedCoords = bucketList
      .map((p) => getDestinationCoords(p.destination))
      .filter((c): c is { lat: number; lng: number } => c !== null);
    return buildVisitedMapUrl({ visited: visitedCoords, planned: plannedCoords });
  }, [places, bucketList]);

  // Heatmap URL: density visualization of visited places
  const heatmapUrl = useMemo(() => {
    if (!isMapboxConfigured() || places.length === 0) return null;
    const coords = places
      .map((p) => {
        const c = getDestinationCoords(p.destination);
        return c ? { lat: c.lat, lng: c.lng, weight: 1 } : null;
      })
      .filter((c): c is { lat: number; lng: number; weight: number } => c !== null);
    return buildHeatmapUrl({ coords });
  }, [places]);

  // Determine which map URL to show
  const activeMapUrl = showHeatmap ? heatmapUrl : visitedMapUrl;

  // Visit count per destination
  const visitCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) {
      counts.set(p.destination, (counts.get(p.destination) ?? 0) + 1);
    }
    return counts;
  }, [places]);

  const handleToggleHeatmap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowHeatmap((prev) => !prev);
  }, []);

  const handlePlanAgain = useCallback((destination: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCard(null);
    router.push('/(tabs)/plan' as never);
  }, [router]);

  // Handlers
  const handleAddPlace = useCallback(async (destination: string) => {
    const meta = lookupDestination(destination);
    if (!meta) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addVisitedPlace({
      destination,
      country: meta.country,
      continent: meta.continent,
      visitedAt: new Date().toISOString(),
    });
    setAddInput('');
    setSuggestions([]);
    await loadData();
  }, [loadData]);

  const handleRemovePlace = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeVisitedPlace(id);
    await loadData();
  }, [loadData]);

  const handleSyncTrips = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await syncFromTrips();
    await loadData();
  }, [loadData]);

  const handleAddBucketPlace = useCallback(async (destination: string) => {
    const meta = lookupDestination(destination);
    if (!meta) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addBucketListPlace({
      destination,
      country: meta.country,
      continent: meta.continent,
    });
    setBucketInput('');
    setBucketSuggestions([]);
    await loadData();
  }, [loadData]);

  const handleRemoveBucket = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeBucketListPlace(id);
    await loadData();
  }, [loadData]);

  const handleMoveBucketToVisited = useCallback(async (item: BucketListPlace) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await removeBucketListPlace(item.id);
    await addVisitedPlace({
      destination: item.destination,
      country: item.country,
      continent: item.continent,
      visitedAt: new Date().toISOString(),
    });
    await loadData();
  }, [loadData]);

  const handleInputChange = useCallback((text: string) => {
    setAddInput(text);
    setSuggestions(text.length > 0 ? getDestinationSuggestions(text) : []);
  }, []);

  const handleBucketInputChange = useCallback((text: string) => {
    setBucketInput(text);
    setBucketSuggestions(text.length > 0 ? getDestinationSuggestions(text) : []);
  }, []);

  const toggleCountry = useCallback((country: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCountry((prev) => (prev === country ? null : country));
  }, []);

  const handleTapDestination = useCallback((item: VisitedPlace | BucketListPlace) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCard(item);
  }, []);

  const handleCloseCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCard(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const nextMilestone = getNextMilestone(stats.totalPlaces);
  const milestoneProgress = stats.totalPlaces / nextMilestone;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestDark, COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('visitedMap.title', { defaultValue: 'Visited Map' })}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ============================================================= */}
          {/* MAPBOX VISITED MAP — dark-v11, sage (visited) + gold (planned) */}
          {/* ============================================================= */}
          {activeMapUrl ? (
            <View style={styles.mapSection}>
              <View style={styles.mapLabelRow}>
                <MapPin size={18} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.mapLabel}>
                  {showHeatmap
                    ? t('visitedMap.heatmapLabel', { defaultValue: 'Visit density' })
                    : t('visitedMap.mapPins', { defaultValue: 'Sage = visited · Gold = planned' })}
                </Text>
                {/* Heatmap toggle */}
                {heatmapUrl && (
                  <Pressable onPress={handleToggleHeatmap} style={styles.heatmapToggle}>
                    <Layers size={14} color={showHeatmap ? COLORS.sage : COLORS.muted} strokeWidth={1.5} />
                    <Text style={[styles.heatmapToggleText, showHeatmap && styles.heatmapToggleActive]}>
                      {showHeatmap
                        ? t('visitedMap.pins', { defaultValue: 'Pins' })
                        : t('visitedMap.heatmap', { defaultValue: 'Heatmap' })}
                    </Text>
                  </Pressable>
                )}
              </View>
              <Image source={{ uri: activeMapUrl }} style={styles.mapImage} resizeMode="cover" />
            </View>
          ) : places.length === 0 ? (
            <View style={styles.emptyMapCard}>
              <MapPin size={36} color={COLORS.muted} strokeWidth={1.5} />
              <Text style={styles.emptyMapTitle}>
                {t('visitedMap.emptyTitle', { defaultValue: 'Your world map starts with your first trip' })}
              </Text>
              <Text style={styles.emptyMapSub}>
                {t('visitedMap.emptySub', { defaultValue: 'Add visited places or sync from your trips to see them on the map.' })}
              </Text>
            </View>
          ) : null}

          {/* ============================================================= */}
          {/* WORLD STATS */}
          {/* ============================================================= */}
          <View style={styles.statsRow}>
            <StatBig label={t('visitedMap.places', { defaultValue: 'Places' })} value={stats.totalPlaces} />
            <View style={styles.statDivider} />
            <StatBig label={t('visitedMap.countries', { defaultValue: 'Countries' })} value={stats.totalCountries} />
            <View style={styles.statDivider} />
            <StatBig label={t('visitedMap.continents', { defaultValue: 'Continents' })} value={stats.totalContinents} />
          </View>

          {/* Total miles traveled */}
          {stats.totalMilesTraveled > 0 && (
            <View style={styles.milesCard}>
              <Text style={styles.milesValue}>
                {stats.totalMilesTraveled.toLocaleString()} mi
              </Text>
              <Text style={styles.milesLabel}>{t('visitedMap.totalMiles', { defaultValue: 'Total miles traveled' })}</Text>
              <Text style={styles.milesSub}>
                {t('visitedMap.estimatedMiles', { defaultValue: 'Estimated from your trip sequence' })}
              </Text>
            </View>
          )}

          {/* Continent progress bars */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('visitedMap.continentProgress', { defaultValue: '· Continent progress' })}</Text>
            {ALL_CONTINENTS.filter((c) => c !== 'Antarctica').map((continent) => {
              const total = COUNTRIES_PER_CONTINENT[continent] ?? 1;
              const visitedInContinent = new Set(
                places.filter((p) => p.continent === continent).map((p) => p.country)
              ).size;
              const pct = total > 0 ? (visitedInContinent / total) * 100 : 0;

              return (
                <View key={continent} style={styles.progressRow}>
                  <Text style={styles.progressLabel}>{continent}</Text>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(pct, 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPct}>
                    {visitedInContinent}/{total}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ============================================================= */}
          {/* VISUAL WORLD GRID */}
          {/* ============================================================= */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('visitedMap.worldGrid', { defaultValue: '· World grid' })}</Text>
            {Object.entries(WORLD_GRID).map(([continent, countries]) => (
              <View key={continent} style={styles.gridSection}>
                <Text style={styles.continentHeader}>{continent}</Text>
                <View style={styles.pillGrid}>
                  {countries.map((country) => {
                    const isVisited = visitedCountrySet.has(country);
                    const citiesHere = visitedCountries.get(country);
                    const isExpanded = expandedCountry === country && isVisited;

                    return (
                      <View key={country}>
                        <Pressable
                          onPress={() => isVisited && toggleCountry(country)}
                          style={[
                            styles.countryPill,
                            isVisited ? styles.countryPillVisited : styles.countryPillDimmed,
                          ]}
                        >
                          {isVisited && <Text style={styles.checkmark}>{'  '}</Text>}
                          <Text
                            style={[
                              styles.countryPillText,
                              isVisited
                                ? styles.countryPillTextVisited
                                : styles.countryPillTextDimmed,
                            ]}
                          >
                            {country}
                          </Text>
                        </Pressable>

                        {isExpanded && citiesHere && (
                          <View style={styles.expandedCities}>
                            {citiesHere.map((place) => (
                              <View key={place.id} style={styles.cityRow}>
                                <Text style={styles.cityName}>{place.destination}</Text>
                                <Text style={styles.cityDate}>
                                  {new Date(place.visitedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* ============================================================= */}
          {/* ADD PLACE */}
          {/* ============================================================= */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('visitedMap.addPlace', { defaultValue: '· Add a place' })}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={t('visitedMap.searchPlaceholder', { defaultValue: 'Search destination...' })}
                placeholderTextColor={COLORS.creamMuted}
                value={addInput}
                onChangeText={handleInputChange}
              />
            </View>
            {suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.slice(0, 6).map((s) => {
                  const meta = lookupDestination(s);
                  return (
                    <Pressable
                      key={s}
                      style={styles.suggestionItem}
                      onPress={() => handleAddPlace(s)}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                      {meta && (
                        <Text style={styles.suggestionMeta}>
                          {meta.country} / {meta.continent}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.syncBtn} onPress={handleSyncTrips}>
              <Text style={styles.syncBtnText}>{t('visitedMap.syncFromTrips', { defaultValue: 'Sync from trips' })}</Text>
            </Pressable>
          </View>

          {/* ============================================================= */}
          {/* TRAVEL STATS CARDS */}
          {/* ============================================================= */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('visitedMap.travelStats', { defaultValue: '· Travel stats' })}</Text>

            <View style={styles.statCardGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{mostVisitedContinent || t('visitedMap.noneYet', { defaultValue: 'None yet' })}</Text>
                <Text style={styles.statCardLabel}>{t('visitedMap.topContinent', { defaultValue: 'Top continent' })}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{mostVisitedCountry || t('visitedMap.noneYet', { defaultValue: 'None yet' })}</Text>
                <Text style={styles.statCardLabel}>{t('visitedMap.topCountry', { defaultValue: 'Top country' })}</Text>
              </View>
            </View>

            {/* Milestone progress */}
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneLabel}>
                  {stats.totalPlaces} / {nextMilestone} places
                </Text>
                <Text style={styles.milestonePct}>
                  {Math.round(milestoneProgress * 100)}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={[COLORS.sage, COLORS.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.milestoneBarFill,
                    { width: `${Math.min(milestoneProgress * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.milestoneSubtext}>
                {nextMilestone - stats.totalPlaces} more to reach {nextMilestone}
              </Text>
            </View>

            {/* World explored */}
            <View style={styles.worldExploredCard}>
              <Text style={styles.worldExploredValue}>{worldExploredPct}%</Text>
              <Text style={styles.worldExploredLabel}>{t('visitedMap.worldExplored', { defaultValue: 'of the world explored' })}</Text>
              <Text style={styles.worldExploredSub}>
                {stats.totalCountries} of 195 countries
              </Text>
            </View>
          </View>

          {/* ============================================================= */}
          {/* BUCKET LIST */}
          {/* ============================================================= */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('visitedMap.bucketList', { defaultValue: '· Bucket list' })}</Text>
            <Text style={styles.sectionSubtext}>
              {t('visitedMap.bucketListSub', { defaultValue: "Dream destinations you haven't visited yet" })}
            </Text>

            {/* Add bucket list item */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={t('visitedMap.addDreamPlaceholder', { defaultValue: 'Add a dream destination...' })}
                placeholderTextColor={COLORS.creamMuted}
                value={bucketInput}
                onChangeText={handleBucketInputChange}
              />
            </View>
            {bucketSuggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {bucketSuggestions.slice(0, 6).map((s) => {
                  const meta = lookupDestination(s);
                  return (
                    <Pressable
                      key={s}
                      style={styles.suggestionItem}
                      onPress={() => handleAddBucketPlace(s)}
                    >
                      <Text style={styles.suggestionText}>{s}</Text>
                      {meta && (
                        <Text style={styles.suggestionMeta}>
                          {meta.country} / {meta.continent}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Bucket list items */}
            {bucketList.length === 0 && (
              <Text style={styles.emptyText}>
                {t('visitedMap.noDreamDestinations', { defaultValue: 'No dream destinations yet. Add one above.' })}
              </Text>
            )}
            {bucketList.map((item) => (
              <View key={item.id} style={styles.bucketItem}>
                <Pressable style={styles.bucketItemLeft} onPress={() => handleTapDestination(item)}>
                  <Text style={styles.starIcon}>*</Text>
                  <View>
                    <Text style={styles.bucketDestination}>{item.destination}</Text>
                    <Text style={styles.bucketMeta}>
                      {item.country} / {item.continent}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.bucketActions}>
                  <Pressable
                    style={styles.bucketActionBtn}
                    onPress={() => handleMoveBucketToVisited(item)}
                  >
                    <Text style={styles.bucketActionVisited}>{t('visitedMap.visited', { defaultValue: 'Visited' })}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.bucketActionBtnRemove}
                    onPress={() => handleRemoveBucket(item.id)}
                  >
                    <Text style={styles.bucketActionRemove}>X</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* ============================================================= */}
          {/* VISITED PLACES LIST */}
          {/* ============================================================= */}
          {places.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>{t('visitedMap.allVisitedPlaces', { defaultValue: '· All visited places' })}</Text>
              {places.map((place) => (
                <View key={place.id} style={styles.placeRow}>
                  <Pressable style={{ flex: 1 }} onPress={() => handleTapDestination(place)}>
                    <Text style={styles.placeDestination}>{place.destination}</Text>
                    <Text style={styles.placeMeta}>
                      {place.country} / {place.continent}
                      {'  '}
                      {new Date(place.visitedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    {place.notes ? (
                      <Text style={styles.placeNotes}>{place.notes}</Text>
                    ) : null}
                  </Pressable>
                  <Pressable onPress={() => handleRemovePlace(place.id)}>
                    <Text style={styles.removeBtn}>X</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Destination card slide-up — tap pin/list item */}
      <Modal
        visible={selectedCard !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseCard}
      >
        <Pressable style={styles.cardOverlay} onPress={handleCloseCard}>
          <Pressable style={[styles.cardSheet, { paddingBottom: insets.bottom + SPACING.lg }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.cardSheetHandle} />
            <View style={styles.cardSheetHeader}>
              <Text style={styles.cardSheetTitle}>
                {selectedCard?.destination ?? ''}
              </Text>
              <Pressable onPress={handleCloseCard} style={styles.cardSheetClose} hitSlop={12}>
                <X size={24} color={COLORS.creamMuted} strokeWidth={1.5} />
              </Pressable>
            </View>
            {selectedCard && (
              <>
                <Text style={styles.cardSheetMeta}>
                  {selectedCard.country} / {selectedCard.continent}
                </Text>
                {'visitedAt' in selectedCard && (
                  <Text style={styles.cardSheetDate}>
                    {new Date(selectedCard.visitedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                )}
                {'addedAt' in selectedCard && (
                  <Text style={styles.cardSheetDate}>
                    {t('visitedMap.bucketList', { defaultValue: '· Bucket list' })}
                  </Text>
                )}
                {'notes' in selectedCard && selectedCard.notes ? (
                  <Text style={styles.cardSheetNotes}>{selectedCard.notes}</Text>
                ) : null}

                {/* Visit count badge */}
                {visitCounts.get(selectedCard.destination) != null && (visitCounts.get(selectedCard.destination) ?? 0) > 0 && (
                  <View style={styles.visitCountBadge}>
                    <Text style={styles.visitCountText}>
                      {`Visited ${visitCounts.get(selectedCard.destination) ?? 0} time${(visitCounts.get(selectedCard.destination) ?? 0) > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                )}

                {/* Plan again button */}
                <Pressable
                  style={styles.planAgainBtn}
                  onPress={() => handlePlanAgain(selectedCard.destination)}
                >
                  <Navigation size={14} color={COLORS.bg} strokeWidth={1.5} />
                  <Text style={styles.planAgainText}>
                    {t('visitedMap.planAgain', { defaultValue: 'Plan again' })}
                  </Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// StatBig component
// ---------------------------------------------------------------------------
function StatBig({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBigContainer}>
      <Text style={styles.statBigValue}>{value}</Text>
      <Text style={styles.statBigLabel}>{label}</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },

  // Mapbox visited map
  mapSection: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  mapLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mapLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mapImage: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.bgCard,
  },

  // Destination card modal
  cardOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  cardSheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  cardSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.creamMuted,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  cardSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  cardSheetTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    flex: 1,
  },
  cardSheetClose: {
    padding: SPACING.xs,
  },
  cardSheetMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: SPACING.xs,
  },
  cardSheetDate: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginBottom: SPACING.sm,
  },
  cardSheetNotes: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    marginTop: SPACING.sm,
  },

  // World stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  statDivider: {
    width: 1,
    height: SPACING.xxl,
    backgroundColor: COLORS.border,
  },
  statBigContainer: {
    alignItems: 'center',
    flex: 1,
  },
  statBigValue: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.gold,
    lineHeight: 48,
  },

  statBigLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
  },
  milesCard: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.sageSoft,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  milesValue: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.sage,
    lineHeight: 42,
  },
  milesLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
  },
  milesSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },

  // Section labels
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
  },
  sectionSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  },

  // Progress bars
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  progressLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
    width: 110,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
  },
  progressPct: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    width: 36,
    textAlign: 'right',
  },

  // World grid
  gridSection: {
    marginBottom: SPACING.lg,
  },
  continentHeader: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  countryPillVisited: {
    backgroundColor: COLORS.sageHighlight,
    borderColor: COLORS.sage,
  },
  countryPillDimmed: {
    backgroundColor: COLORS.whiteFaint,
    borderColor: COLORS.border,
  },
  checkmark: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.sage,
    marginRight: SPACING.xs,
  },
  countryPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
  },
  countryPillTextVisited: {
    color: COLORS.sage,
  },
  countryPillTextDimmed: {
    color: COLORS.creamDimLight,
  },

  // Expanded cities
  expandedCities: {
    marginLeft: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.md,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.sage,
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  cityName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  cityDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  },

  // Suggestions
  suggestionsBox: {
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  suggestionMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  },

  // Sync button
  syncBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageMuted,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.xs,
  },
  syncBtnText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
  },

  // Stat cards
  statCardGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.whiteVeryFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statCardValue: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.gold,
    textAlign: 'center',
  },
  statCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },

  // Milestone
  milestoneCard: {
    backgroundColor: COLORS.whiteVeryFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  milestoneLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  milestonePct: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
  },
  milestoneBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  milestoneSubtext: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
  },

  // World explored
  worldExploredCard: {
    alignItems: 'center',
    backgroundColor: COLORS.goldVeryFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
  },
  worldExploredValue: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.gold,
    lineHeight: 52,
  },
  worldExploredLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: SPACING.xs,
  },
  worldExploredSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  },

  // Bucket list
  bucketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  bucketItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  starIcon: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.gold,
  },
  bucketDestination: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamDim,
  },
  bucketMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamVeryFaint,
  },
  bucketActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  bucketActionBtn: {
    backgroundColor: COLORS.sageMuted,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  bucketActionVisited: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },
  bucketActionBtnRemove: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketActionRemove: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.coral,
  },

  // Empty
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },

  // Visited places list
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  placeDestination: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  placeMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  placeNotes: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  removeBtn: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.coral,
    padding: SPACING.xs,
  },

  // Heatmap toggle
  heatmapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heatmapToggleText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heatmapToggleActive: {
    color: COLORS.sage,
  },

  // Empty map state
  emptyMapCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyMapTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    textAlign: 'center',
  },
  emptyMapSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Visit count badge in bottom sheet
  visitCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    marginTop: SPACING.sm,
  },
  visitCountText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },

  // Plan again button
  planAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.md,
    alignSelf: 'stretch',
  },
  planAgainText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  },
});

export default VisitedMapScreen;
