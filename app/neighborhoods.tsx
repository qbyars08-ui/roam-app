// =============================================================================
// ROAM — Neighborhood Discovery
// Know the vibe of every area before you arrive
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Navigation } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useDestinationTheme } from '../lib/useDestinationTheme';
import { validateDestination } from '../lib/params-validator';
import {
  useNeighborhoods,
  getNeighborhoodVenues,
  type Neighborhood,
} from '../lib/neighborhood-intel';
import type { FSQPlace } from '../lib/apis/foursquare';
import * as Haptics from '../lib/haptics';

// =============================================================================
// Metric bar component
// =============================================================================

interface MetricBarProps {
  readonly label: string;
  readonly value: number;
  readonly max: number;
  readonly color: string;
}

function MetricBar({ label, value, max, color }: MetricBarProps) {
  const fillPct = useMemo(() => Math.round((value / max) * 100), [value, max]);
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${fillPct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// =============================================================================
// Venue card component
// =============================================================================

interface VenueItemProps {
  readonly venue: FSQPlace;
  readonly destination: string;
}

function VenueItem({ venue, destination }: VenueItemProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = venue.location
      ? `${venue.location.lat},${venue.location.lng}`
      : encodeURIComponent(`${venue.name} ${destination}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  }, [venue, destination]);

  return (
    <Pressable style={styles.venueCard} onPress={handlePress} accessibilityRole="button">
      <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
      <Text style={styles.venueCategory} numberOfLines={1}>{venue.category}</Text>
      {venue.rating != null && (
        <Text style={styles.venueRating}>{venue.rating.toFixed(1)}</Text>
      )}
    </Pressable>
  );
}

// =============================================================================
// Main screen
// =============================================================================

export default function NeighborhoodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ destination?: string }>();
  const destination = validateDestination(params.destination);
  const theme = useDestinationTheme(destination);

  const { neighborhoods, loading, error, selected, setSelected } =
    useNeighborhoods(destination ?? undefined);

  const [venues, setVenues] = useState<readonly FSQPlace[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);

  // Fetch venues when selected neighborhood changes
  useEffect(() => {
    if (!selected || !destination) {
      setVenues([]);
      return;
    }
    let cancelled = false;
    setVenuesLoading(true);
    getNeighborhoodVenues(selected.name, destination)
      .then((result) => {
        if (!cancelled) {
          setVenues(result);
          setVenuesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVenues([]);
          setVenuesLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [selected, destination]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleSelectNeighborhood = useCallback(
    (n: Neighborhood) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelected(n);
    },
    [setSelected],
  );

  const handleWalkHere = useCallback(() => {
    if (!selected || !destination) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const query = encodeURIComponent(`${selected.name}, ${destination}`);
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=walking`,
    ).catch(() => {});
  }, [selected, destination]);

  const renderVenueItem = useCallback(
    ({ item }: ListRenderItemInfo<FSQPlace>) => (
      <VenueItem venue={item} destination={destination ?? ''} />
    ),
    [destination],
  );

  const venueKeyExtractor = useCallback((item: FSQPlace) => item.fsqId, []);

  // ---------------------------------------------------------------------------
  // Error / empty state
  // ---------------------------------------------------------------------------

  if (!destination) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No destination provided</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Know the neighborhoods</Text>
          <Text style={styles.headerSub}>{destination}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Loading state */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={styles.loadingText}>Discovering neighborhoods...</Text>
          </View>
        )}

        {/* Error state */}
        {error && !loading && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Neighborhood selector pills */}
        {neighborhoods.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {neighborhoods.map((n) => {
              const isActive = selected?.name === n.name;
              return (
                <Pressable
                  key={n.name}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => handleSelectNeighborhood(n)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {n.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Selected neighborhood detail */}
        {selected && (
          <View style={styles.detailCard}>
            {/* Name + vibe badge */}
            <View style={styles.nameRow}>
              <Text style={styles.neighborhoodName}>{selected.name}</Text>
              <View style={[styles.vibeBadge, { backgroundColor: theme.glowColor }]}>
                <Text style={styles.vibeBadgeText}>{selected.vibe}</Text>
              </View>
            </View>

            {/* Metric bars */}
            <View style={styles.metricsWrap}>
              <MetricBar label="Walkability" value={selected.walkability} max={5} color={COLORS.sage} />
              <MetricBar label="Safety" value={selected.safety} max={5} color={COLORS.sage} />
              <MetricBar label="Price" value={selected.priceLevel} max={3} color={COLORS.gold} />
            </View>

            {/* Best for tags */}
            {selected.bestFor.length > 0 && (
              <View style={styles.tagsRow}>
                {selected.bestFor.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Best time */}
            <Text style={styles.bestTime}>{selected.bestTimeToVisit}</Text>

            {/* Sonar insight */}
            {selected.sonarInsight && (
              <View style={styles.insightCard}>
                <Text style={styles.insightText}>{selected.sonarInsight}</Text>
              </View>
            )}

            {/* Walk here button */}
            <Pressable style={styles.walkButton} onPress={handleWalkHere} accessibilityRole="button">
              <Navigation size={16} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.walkButtonText}>Walk here from hotel</Text>
            </Pressable>
          </View>
        )}

        {/* Venues in this neighborhood */}
        {selected && (
          <View style={styles.venuesSection}>
            <Text style={styles.venuesSectionTitle}>
              Places in {selected.name}
            </Text>
            {venuesLoading && (
              <ActivityIndicator size="small" color={COLORS.sage} style={{ marginTop: SPACING.md }} />
            )}
            {!venuesLoading && venues.length === 0 && (
              <Text style={styles.emptyVenues}>No venues found nearby</Text>
            )}
            {!venuesLoading && venues.length > 0 && (
              <FlatList
                data={venues.slice(0, 10)}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderVenueItem}
                keyExtractor={venueKeyExtractor}
                contentContainerStyle={styles.venuesList}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } satisfies ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } satisfies ViewStyle,
  headerTextWrap: {
    flex: 1,
  } satisfies ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } satisfies TextStyle,
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
  } satisfies TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  } satisfies ViewStyle,
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  } satisfies ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  } satisfies TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  } satisfies TextStyle,

  // Pills
  pillRow: {
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  } satisfies ViewStyle,
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } satisfies ViewStyle,
  pillActive: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } satisfies ViewStyle,
  pillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.muted,
  } satisfies TextStyle,
  pillTextActive: {
    color: COLORS.cream,
  } satisfies TextStyle,

  // Detail card
  detailCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } satisfies ViewStyle,
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } satisfies ViewStyle,
  neighborhoodName: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    flex: 1,
  } satisfies TextStyle,
  vibeBadge: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  } satisfies ViewStyle,
  vibeBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } satisfies TextStyle,

  // Metrics
  metricsWrap: {
    gap: SPACING.sm + 2,
    marginBottom: SPACING.md,
  } satisfies ViewStyle,
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } satisfies ViewStyle,
  metricLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    width: 76,
  } satisfies TextStyle,
  metricTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
  } satisfies ViewStyle,
  metricFill: {
    height: '100%',
    borderRadius: 3,
  } satisfies ViewStyle,

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  } satisfies ViewStyle,
  tag: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageVeryFaint,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } satisfies ViewStyle,
  tagText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } satisfies TextStyle,

  // Best time
  bestTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  } satisfies TextStyle,

  // Insight card
  insightCard: {
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } satisfies ViewStyle,
  insightText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 20,
  } satisfies TextStyle,

  // Walk button
  walkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
  } satisfies ViewStyle,
  walkButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } satisfies TextStyle,

  // Venues
  venuesSection: {
    marginTop: SPACING.lg,
  } satisfies ViewStyle,
  venuesSectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  } satisfies TextStyle,
  venuesList: {
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  } satisfies ViewStyle,
  venueCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
  } satisfies ViewStyle,
  venueName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: 2,
  } satisfies TextStyle,
  venueCategory: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  } satisfies TextStyle,
  venueRating: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } satisfies TextStyle,
  emptyVenues: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: SPACING.md,
  } satisfies TextStyle,
});
