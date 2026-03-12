// =============================================================================
// ROAM — Visited Map
// Beautiful world grid showing visited places, stats, and bucket list
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Ionicons } from '@expo/vector-icons';
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
  COUNTRIES_PER_CONTINENT,
  ALL_CONTINENTS,
  WORLD_GRID,
} from '../lib/visited-store';

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
export default function VisitedMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
  }, []);

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
    return max || 'None yet';
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
    return max || 'None yet';
  }, [visitedCountries]);

  const worldExploredPct = useMemo(
    () => ((stats.totalCountries / 195) * 100).toFixed(1),
    [stats.totalCountries]
  );

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const nextMilestone = getNextMilestone(stats.totalPlaces);
  const milestoneProgress = stats.totalPlaces / nextMilestone;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bg, '#0a1a12', COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>Visited Map</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ============================================================= */}
          {/* WORLD STATS */}
          {/* ============================================================= */}
          <View style={styles.statsRow}>
            <StatBig label="Places" value={stats.totalPlaces} />
            <View style={styles.statDivider} />
            <StatBig label="Countries" value={stats.totalCountries} />
            <View style={styles.statDivider} />
            <StatBig label="Continents" value={stats.totalContinents} />
          </View>

          {/* Total miles traveled */}
          {stats.totalMilesTraveled > 0 && (
            <View style={styles.milesCard}>
              <Text style={styles.milesValue}>
                {stats.totalMilesTraveled.toLocaleString()} mi
              </Text>
              <Text style={styles.milesLabel}>Total miles traveled</Text>
              <Text style={styles.milesSub}>
                Estimated from your trip sequence
              </Text>
            </View>
          )}

          {/* Continent progress bars */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>· Continent progress</Text>
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
            <Text style={styles.sectionLabel}>· World grid</Text>
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
            <Text style={styles.sectionLabel}>· Add a place</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Search destination..."
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
              <Text style={styles.syncBtnText}>Sync from trips</Text>
            </Pressable>
          </View>

          {/* ============================================================= */}
          {/* TRAVEL STATS CARDS */}
          {/* ============================================================= */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>· Travel stats</Text>

            <View style={styles.statCardGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{mostVisitedContinent}</Text>
                <Text style={styles.statCardLabel}>Top continent</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statCardValue}>{mostVisitedCountry}</Text>
                <Text style={styles.statCardLabel}>Top country</Text>
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
              <Text style={styles.worldExploredLabel}>of the world explored</Text>
              <Text style={styles.worldExploredSub}>
                {stats.totalCountries} of 195 countries
              </Text>
            </View>
          </View>

          {/* ============================================================= */}
          {/* BUCKET LIST */}
          {/* ============================================================= */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>· Bucket list</Text>
            <Text style={styles.sectionSubtext}>
              Dream destinations you haven't visited yet
            </Text>

            {/* Add bucket list item */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Add a dream destination..."
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
                No dream destinations yet. Add one above.
              </Text>
            )}
            {bucketList.map((item) => (
              <View key={item.id} style={styles.bucketItem}>
                <View style={styles.bucketItemLeft}>
                  <Text style={styles.starIcon}>*</Text>
                  <View>
                    <Text style={styles.bucketDestination}>{item.destination}</Text>
                    <Text style={styles.bucketMeta}>
                      {item.country} / {item.continent}
                    </Text>
                  </View>
                </View>
                <View style={styles.bucketActions}>
                  <Pressable
                    style={styles.bucketActionBtn}
                    onPress={() => handleMoveBucketToVisited(item)}
                  >
                    <Text style={styles.bucketActionVisited}>Visited</Text>
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
              <Text style={styles.sectionLabel}>· All visited places</Text>
              {places.map((place) => (
                <View key={place.id} style={styles.placeRow}>
                  <View style={{ flex: 1 }}>
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
                  </View>
                  <Pressable onPress={() => handleRemovePlace(place.id)}>
                    <Text style={styles.removeBtn}>X</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
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
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,

  // Scroll
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  } as ViewStyle,

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
  } as ViewStyle,
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: COLORS.border,
  } as ViewStyle,
  statBigContainer: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  statBigValue: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.gold,
    lineHeight: 48,
  } as TextStyle,
  statBigLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
  } as TextStyle,
  milesCard: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(124,175,138,0.1)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sage + '40',
    padding: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  milesValue: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.sage,
    lineHeight: 42,
  } as TextStyle,
  milesLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  } as TextStyle,
  milesSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Card
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,

  // Section labels
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(245,237,216,0.6)',
    marginBottom: SPACING.md,
  } as TextStyle,
  sectionSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  } as TextStyle,

  // Progress bars
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  progressLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
    width: 110,
  } as TextStyle,
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  } as ViewStyle,
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  progressPct: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    width: 36,
    textAlign: 'right',
  } as TextStyle,

  // World grid
  gridSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  continentHeader: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  } as ViewStyle,
  countryPillVisited: {
    backgroundColor: 'rgba(124,175,138,0.15)',
    borderColor: COLORS.sage,
  } as ViewStyle,
  countryPillDimmed: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)',
  } as ViewStyle,
  checkmark: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.sage,
    marginRight: SPACING.xs,
  } as TextStyle,
  countryPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
  } as TextStyle,
  countryPillTextVisited: {
    color: COLORS.sage,
  } as TextStyle,
  countryPillTextDimmed: {
    color: 'rgba(245,237,216,0.3)',
  } as TextStyle,

  // Expanded cities
  expandedCities: {
    marginLeft: SPACING.md,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    paddingLeft: SPACING.md,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  cityName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  cityDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Input
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  // Suggestions
  suggestionsBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  suggestionText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  suggestionMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Sync button
  syncBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,175,138,0.12)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.xs,
  } as ViewStyle,
  syncBtnText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  // Stat cards
  statCardGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  statCardValue: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.gold,
    textAlign: 'center',
  } as TextStyle,
  statCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.xs,
  } as TextStyle,

  // Milestone
  milestoneCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  milestoneLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  milestonePct: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
  } as TextStyle,
  milestoneBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  } as ViewStyle,
  milestoneSubtext: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
  } as TextStyle,

  // World explored
  worldExploredCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    padding: SPACING.lg,
  } as ViewStyle,
  worldExploredValue: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.gold,
    lineHeight: 52,
  } as TextStyle,
  worldExploredLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: SPACING.xs,
  } as TextStyle,
  worldExploredSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,

  // Bucket list
  bucketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  bucketItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  } as ViewStyle,
  starIcon: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.gold,
  } as TextStyle,
  bucketDestination: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: 'rgba(245,237,216,0.4)',
  } as TextStyle,
  bucketMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(245,237,216,0.2)',
  } as TextStyle,
  bucketActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  bucketActionBtn: {
    backgroundColor: 'rgba(124,175,138,0.12)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  bucketActionVisited: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  bucketActionBtnRemove: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  bucketActionRemove: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.coral,
  } as TextStyle,

  // Empty
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  } as TextStyle,

  // Visited places list
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  } as ViewStyle,
  placeDestination: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  placeMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  placeNotes: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
    fontStyle: 'italic',
  } as TextStyle,
  removeBtn: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.coral,
    padding: SPACING.xs,
  } as TextStyle,
});
