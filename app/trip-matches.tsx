// =============================================================================
// ROAM — Trip DNA Matching: "Trips like yours" discovery screen
// Find real trips from real people with similar travel DNA.
// =============================================================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Clock,
  Globe,
  Sparkles,
  Users,
  Eye,
  MapPin,
} from 'lucide-react-native';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  DESTINATION_HERO_PHOTOS,
} from '../lib/constants';
import { useAppStore } from '../lib/store';
import type { Trip } from '../lib/store';
import { parseItinerary } from '../lib/types/itinerary';
import type { Itinerary } from '../lib/types/itinerary';
import {
  useSimilarTrips,
  calculateTripDNA,
} from '../lib/trip-dna-matching';
import type { TripMatch, TripStyle } from '../lib/trip-dna-matching';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import * as Haptics from '../lib/haptics';

const { width: SW } = Dimensions.get('window');
const S = SPACING;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPhotoUrl(destination: string): string {
  return (
    DESTINATION_HERO_PHOTOS[destination] ??
    `https://images.unsplash.com/photos/${encodeURIComponent(destination)}?w=800&q=80`
  );
}

function weeksAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  if (weeks <= 0) return 'this week';
  if (weeks === 1) return '1 week ago';
  return `${weeks} weeks ago`;
}

const STYLE_LABELS: Record<TripStyle, string> = {
  culture: 'Culture',
  food: 'Food',
  adventure: 'Adventure',
  nightlife: 'Nightlife',
  nature: 'Nature',
  shopping: 'Shopping',
};

function budgetLabel(tier: string): string {
  switch (tier) {
    case 'backpacker': return 'Budget';
    case 'comfort': return 'Comfort';
    case 'treat-yourself': return 'Treat Yourself';
    case 'no-budget': return 'No Limits';
    default: return tier;
  }
}

// ---------------------------------------------------------------------------
// Match Card
// ---------------------------------------------------------------------------

interface MatchCardProps {
  match: TripMatch;
  onView: () => void;
}

function MatchCard({ match, onView }: MatchCardProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onView();
      }}
      style={styles.matchCard}
    >
      {/* Destination photo */}
      <Image
        source={{ uri: getPhotoUrl(match.destination) }}
        style={styles.matchPhoto}
      />
      <LinearGradient
        colors={[COLORS.transparent, COLORS.overlayDarkest]}
        style={styles.matchPhotoOverlay}
      />

      {/* Similarity badge */}
      <View style={styles.similarityBadge}>
        <Sparkles size={12} color={COLORS.bg} strokeWidth={1.5} />
        <Text style={styles.similarityText}>{match.similarity}% match</Text>
      </View>

      {/* Card content */}
      <View style={styles.matchContent}>
        <Text style={styles.matchCreator} numberOfLines={1}>
          {match.creatorName} traveled to {match.destination}
        </Text>
        <Text style={styles.matchTimeAgo}>{weeksAgo(match.createdAt)}</Text>

        {/* Stats row */}
        <View style={styles.matchStats}>
          <View style={styles.statChip}>
            <Clock size={12} color={COLORS.creamDim} strokeWidth={1.5} />
            <Text style={styles.statText}>{match.duration} days</Text>
          </View>
          <View style={styles.statChip}>
            <MapPin size={12} color={COLORS.creamDim} strokeWidth={1.5} />
            <Text style={styles.statText}>{budgetLabel(match.budgetTier)}</Text>
          </View>
        </View>

        {/* Style tags */}
        <View style={styles.tagRow}>
          {match.styleTags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.styleTag}>
              <Text style={styles.styleTagText}>
                {STYLE_LABELS[tag] ?? tag}
              </Text>
            </View>
          ))}
        </View>

        {/* View button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onView();
          }}
          style={styles.viewButton}
        >
          <Eye size={14} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.viewButtonText}>View their trip</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Globe size={48} color={COLORS.sageMuted} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>Be the first!</Text>
      <Text style={styles.emptySubtitle}>
        Share your trip to help other travelers find trips like theirs.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TripMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();

  const trips = useAppStore((s) => s.trips);

  // Find the target trip
  const trip: Trip | null = useMemo(() => {
    if (params.tripId) {
      return trips.find((t) => t.id === params.tripId) ?? null;
    }
    return trips[0] ?? null;
  }, [params.tripId, trips]);

  // Parse itinerary
  const itinerary: Itinerary | null = useMemo(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip]);

  // DNA matching hook
  const { matches, isLoading, error } = useSimilarTrips(trip, itinerary);

  // Public toggle state
  const [isPublic, setIsPublic] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleTogglePublic = useCallback(async (value: boolean) => {
    if (!trip) return;
    setToggling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const dna = itinerary ? calculateTripDNA(trip, itinerary) : null;

      await supabase
        .from('trips')
        .update({
          is_public: value,
          ...(value && dna ? { trip_dna: dna } : {}),
        })
        .eq('id', trip.id);

      setIsPublic(value);
      trackEvent('trip_sharing_toggled', {
        tripId: trip.id,
        isPublic: value,
        destination: trip.destination,
      });
    } catch {
      // Revert on failure
      setIsPublic(!value);
    } finally {
      setToggling(false);
    }
  }, [trip, itinerary]);

  const handleViewTrip = useCallback((match: TripMatch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('trip_match_viewed', {
      matchTripId: match.tripId,
      similarity: match.similarity,
      destination: match.destination,
    });
    // Navigate to a read-only shared trip view
    router.push({
      pathname: '/shared-trip',
      params: { tripId: match.tripId },
    } as never);
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={12}
        >
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Trips like yours</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + S.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip DNA summary */}
        {trip && (
          <View style={styles.dnaSummary}>
            <Text style={styles.dnaLabel}>Your trip DNA</Text>
            <Text style={styles.dnaDestination}>{trip.destination}</Text>
            <Text style={styles.dnaMeta}>
              {trip.days} days / {trip.vibes.slice(0, 3).join(', ')}
            </Text>
          </View>
        )}

        {/* Public toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Users size={18} color={COLORS.sage} strokeWidth={1.5} />
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Make my trip public</Text>
              <Text style={styles.toggleSubtitle}>
                Help others find trips like theirs
              </Text>
            </View>
          </View>
          <Switch
            value={isPublic}
            onValueChange={handleTogglePublic}
            disabled={toggling}
            trackColor={{ false: COLORS.surface2, true: COLORS.sageLight }}
            thumbColor={isPublic ? COLORS.sage : COLORS.muted}
          />
        </View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.sage} />
            <Text style={styles.loadingText}>Finding similar trips...</Text>
          </View>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Could not load matches. Pull to retry.
            </Text>
          </View>
        )}

        {/* Match cards */}
        {!isLoading && !error && matches.length === 0 && <EmptyState />}

        {!isLoading && matches.length > 0 && (
          <View style={styles.matchList}>
            {matches.map((match) => (
              <MatchCard
                key={match.tripId}
                match={match}
                onView={() => handleViewTrip(match)}
              />
            ))}
          </View>
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  },
  scrollContent: {
    paddingHorizontal: S.lg,
  },

  // DNA summary
  dnaSummary: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dnaLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.15 * 11,
    textTransform: 'uppercase',
    marginBottom: S.xs,
  },
  dnaDestination: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: S.xs,
  },
  dnaMeta: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: S.md,
    marginBottom: S.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: S.sm,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  toggleSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: S.xxl,
    gap: S.md,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: S.xxl,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: S.xxl,
    gap: S.md,
  },
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 14 * 1.6,
    maxWidth: 260,
  },

  // Match list
  matchList: {
    gap: S.md,
  },

  // Match card
  matchCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchPhoto: {
    width: '100%',
    height: 160,
  },
  matchPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 80,
    height: 80,
  },
  similarityBadge: {
    position: 'absolute',
    top: S.sm,
    right: S.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sage,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  similarityText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  },
  matchContent: {
    padding: S.md,
  },
  matchCreator: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: 2,
  },
  matchTimeAgo: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: S.sm,
  },
  matchStats: {
    flexDirection: 'row',
    gap: S.sm,
    marginBottom: S.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface2,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
  },
  tagRow: {
    flexDirection: 'row',
    gap: S.xs,
    marginBottom: S.md,
  },
  styleTag: {
    backgroundColor: COLORS.sageVeryFaint,
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  },
  styleTagText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.sage,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xs,
    backgroundColor: COLORS.sage,
    paddingVertical: S.sm,
    borderRadius: RADIUS.pill,
  },
  viewButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.bg,
  },
});
