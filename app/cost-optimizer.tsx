// =============================================================================
// ROAM — Cost Optimizer Screen
// Finds savings, free alternatives, and deals for a trip
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ChevronDown,
  DollarSign,
  Hotel,
  MapPin,
  Scale,
  Sparkles,
  Tag,
  Utensils,
  Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import { useCostOptimizer } from '../lib/cost-optimizer';
import type { CostOptimization } from '../lib/cost-optimizer';
import type { FSQPlace } from '../lib/apis/foursquare';
import SonarCard from '../components/ui/SonarCard';

// ---------------------------------------------------------------------------
// Category icon mapping
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<CostOptimization['category'], typeof Utensils> = {
  food: Utensils,
  activities: Sparkles,
  accommodation: Hotel,
  rebalance: Scale,
};

const CATEGORY_COLORS: Record<CostOptimization['category'], string> = {
  food: COLORS.coral,
  activities: COLORS.sage,
  accommodation: COLORS.gold,
  rebalance: COLORS.blueAccent,
};

const CATEGORY_LABELS: Record<CostOptimization['category'], string> = {
  food: 'Food & Dining',
  activities: 'Activities',
  accommodation: 'Accommodation',
  rebalance: 'Day Rebalance',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function priceTierLabel(price: number | null): string {
  if (price === null) return 'Unknown';
  if (price <= 1) return 'Budget';
  if (price <= 2) return 'Affordable';
  if (price <= 3) return 'Mid-range';
  return 'Premium';
}

// ---------------------------------------------------------------------------
// OptimizationCard
// ---------------------------------------------------------------------------

function OptimizationCard({ item }: { item: CostOptimization }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[item.category];
  const color = CATEGORY_COLORS[item.category];

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Pressable onPress={handlePress} style={styles.optCard}>
      <View style={styles.optCardHeader}>
        <View style={[styles.optIconBg, { backgroundColor: `${color}20` }]}>
          <Icon size={18} color={color} strokeWidth={1.5} />
        </View>
        <View style={styles.optCardMeta}>
          <Text style={styles.optCategory}>
            {CATEGORY_LABELS[item.category]}
          </Text>
          <View style={styles.optCostRow}>
            <Text style={styles.optCurrentCost}>
              {formatCurrency(item.currentCost)}
            </Text>
            <Text style={styles.optArrow}>{'  >  '}</Text>
            <Text style={styles.optSuggestedCost}>
              {formatCurrency(item.suggestedCost)}
            </Text>
          </View>
        </View>
        <View style={styles.optSavingsBadge}>
          <Text style={styles.optSavingsText}>
            -{formatCurrency(item.savings)}
          </Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.optExpandedBody}>
          <Text style={styles.optSuggestion}>{item.suggestion}</Text>
          <Text style={styles.optSource}>
            Source: {item.source === 'foursquare' ? 'Foursquare' : item.source === 'sonar' ? 'Live intel' : 'Budget analysis'}
          </Text>
        </View>
      )}

      <View style={styles.optChevronRow}>
        <ChevronDown
          size={16}
          color={COLORS.muted}
          strokeWidth={1.5}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// VenueCard (Foursquare cheaper alternative)
// ---------------------------------------------------------------------------

function VenueCard({ venue }: { venue: FSQPlace }) {
  return (
    <View style={styles.venueCard}>
      <View style={styles.venueRow}>
        <MapPin size={16} color={COLORS.sage} strokeWidth={1.5} />
        <View style={styles.venueInfo}>
          <Text style={styles.venueName} numberOfLines={1}>
            {venue.name}
          </Text>
          <Text style={styles.venueCategory} numberOfLines={1}>
            {venue.category}
          </Text>
        </View>
        <View style={styles.venueRight}>
          {venue.rating !== null && (
            <Text style={styles.venueRating}>{venue.rating.toFixed(1)}</Text>
          )}
          <Text style={styles.venuePrice}>
            {priceTierLabel(venue.price)}
          </Text>
        </View>
      </View>
      {venue.address ? (
        <Text style={styles.venueAddress} numberOfLines={1}>
          {venue.address}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CostOptimizerScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId?: string; destination?: string }>();

  const tripId = params.tripId;
  const destination = params.destination ?? '';

  const {
    optimizations,
    deals,
    freePlan,
    totalSavings,
    cheaperVenues,
    isLoading,
    error,
  } = useCostOptimizer(tripId, destination || undefined);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // ------ Loading state ------
  if (isLoading && optimizations.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header destination={destination} onBack={handleBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.sage} />
          <Text style={styles.loadingText}>
            Finding savings for {destination}...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header destination={destination} onBack={handleBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Total savings banner ---- */}
        {totalSavings > 0 && (
          <View style={styles.savingsBanner}>
            <DollarSign size={20} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.savingsBannerLabel}>You could save</Text>
            <Text style={styles.savingsBannerAmount}>
              {formatCurrency(totalSavings)}
            </Text>
          </View>
        )}

        {/* ---- Error state ---- */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ---- Optimization cards ---- */}
        {optimizations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Savings found</Text>
            {optimizations.map((opt, idx) => (
              <OptimizationCard key={`${opt.category}-${idx}`} item={opt} />
            ))}
          </View>
        )}

        {/* ---- Free day plan (Sonar) ---- */}
        {freePlan?.answer ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>Free day plan</Text>
            </View>
            <SonarCard
              answer={freePlan.answer}
              isLive={freePlan.isLive}
              citations={freePlan.citations ?? []}
              title={`Spend nothing in ${destination}`}
              maxBullets={5}
            />
          </View>
        ) : null}

        {/* ---- Deals this week (Sonar) ---- */}
        {deals?.answer ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={18} color={COLORS.gold} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>Deals this week</Text>
            </View>
            <SonarCard
              answer={deals.answer}
              isLive={deals.isLive}
              citations={deals.citations ?? []}
              title={`Current deals in ${destination}`}
              maxBullets={4}
            />
          </View>
        ) : null}

        {/* ---- Budget alternatives (Foursquare) ---- */}
        {cheaperVenues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Utensils size={18} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>Budget alternatives</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Cheaper venues rated by locals
            </Text>
            {cheaperVenues.map((venue) => (
              <VenueCard key={venue.fsqId} venue={venue} />
            ))}
          </View>
        )}

        {/* ---- Empty state ---- */}
        {!isLoading && optimizations.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <DollarSign size={40} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No optimizations yet</Text>
            <Text style={styles.emptySubtitle}>
              Generate a trip to {destination || 'a destination'} first, then
              we will find ways to save.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  destination,
  onBack,
}: {
  destination: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
        <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        Save on {destination}
      </Text>
      <View style={styles.headerSpacer} />
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
  } satisfies ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  } satisfies ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } satisfies TextStyle,
  headerSpacer: {
    width: 40,
  } satisfies ViewStyle,
  scroll: {
    flex: 1,
  } satisfies ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  } satisfies ViewStyle,

  // Savings banner
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  } satisfies ViewStyle,
  savingsBannerLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.creamDim,
    flex: 1,
  } satisfies TextStyle,
  savingsBannerAmount: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    color: COLORS.sage,
  } satisfies TextStyle,

  // Sections
  section: {
    gap: SPACING.sm,
  } satisfies ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } satisfies ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 17,
    color: COLORS.cream,
  } satisfies TextStyle,
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: -4,
  } satisfies TextStyle,

  // Optimization cards
  optCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  } satisfies ViewStyle,
  optCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } satisfies ViewStyle,
  optIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  optCardMeta: {
    flex: 1,
    gap: 2,
  } satisfies ViewStyle,
  optCategory: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } satisfies TextStyle,
  optCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } satisfies ViewStyle,
  optCurrentCost: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
  } satisfies TextStyle,
  optArrow: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } satisfies TextStyle,
  optSuggestedCost: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
  } satisfies TextStyle,
  optSavingsBadge: {
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  } satisfies ViewStyle,
  optSavingsText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
  } satisfies TextStyle,
  optExpandedBody: {
    paddingTop: SPACING.sm,
    paddingLeft: 48,
    gap: SPACING.xs,
  } satisfies ViewStyle,
  optSuggestion: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    lineHeight: 20,
  } satisfies TextStyle,
  optSource: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } satisfies TextStyle,
  optChevronRow: {
    alignItems: 'center',
    marginTop: 2,
  } satisfies ViewStyle,

  // Venue cards
  venueCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    gap: SPACING.xs,
  } satisfies ViewStyle,
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } satisfies ViewStyle,
  venueInfo: {
    flex: 1,
    gap: 1,
  } satisfies ViewStyle,
  venueName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } satisfies TextStyle,
  venueCategory: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  } satisfies TextStyle,
  venueRight: {
    alignItems: 'flex-end',
    gap: 2,
  } satisfies ViewStyle,
  venueRating: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
  } satisfies TextStyle,
  venuePrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } satisfies TextStyle,
  venueAddress: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    paddingLeft: 28,
  } satisfies TextStyle,

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } satisfies ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.muted,
  } satisfies TextStyle,

  // Error
  errorCard: {
    backgroundColor: COLORS.coralSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  } satisfies ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
  } satisfies TextStyle,

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.sm,
  } satisfies ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
  } satisfies TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  } satisfies TextStyle,
});
