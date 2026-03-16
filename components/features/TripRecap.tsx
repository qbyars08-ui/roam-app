// =============================================================================
// ROAM — Trip Recap Card
// Beautiful shareable trip summary for social media.
// Shows: destination, duration, highlight count, vibe, total cost estimate.
// =============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {
  MapPin,
  Calendar,
  Sparkles,
  DollarSign,
  Share2,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS, DESTINATIONS, HIDDEN_DESTINATIONS } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import type { Trip } from '../../lib/store';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface TripRecapProps {
  trip: Trip;
  onShare?: () => void;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function TripRecap({ trip, onShare, onPress }: TripRecapProps) {
  const budgetLabel = useMemo(
    () => BUDGETS.find((b) => b.id === trip.budget)?.label ?? trip.budget,
    [trip.budget],
  );

  const allDests = useMemo(() => [...DESTINATIONS, ...HIDDEN_DESTINATIONS], []);
  const destData = useMemo(
    () => allDests.find((d) => d.label === trip.destination),
    [allDests, trip.destination],
  );

  const estimatedCost = useMemo(() => {
    if (!destData) return null;
    const multiplier = trip.budget === 'budget' ? 0.8 : trip.budget === 'luxury' ? 1.5 : 1;
    return Math.round(destData.dailyCost * (trip.days ?? 3) * multiplier);
  }, [destData, trip.budget, trip.days]);

  const vibeEmoji = useMemo(() => {
    const vibes = trip.vibes ?? [];
    if (vibes.includes('adventure')) return 'Adventure';
    if (vibes.includes('relax')) return 'Relaxation';
    if (vibes.includes('culture')) return 'Culture';
    if (vibes.includes('food')) return 'Foodie';
    if (vibes.includes('party')) return 'Nightlife';
    return 'Explorer';
  }, [trip.vibes]);

  const handleShare = useMemo(
    () => () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onShare?.();
    },
    [onShare],
  );

  const handlePress = useMemo(
    () => () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    },
    [onPress],
  );

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Destination header */}
      <View style={styles.header}>
        <View style={styles.destBadge}>
          <MapPin size={14} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.destText}>{trip.destination}</Text>
          {destData && (
            <Text style={styles.countryText}>{destData.country}</Text>
          )}
        </View>
        {onShare && (
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            style={({ pressed }) => [
              styles.shareBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Share2 size={16} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Calendar size={14} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.statValue}>{trip.days ?? 3}</Text>
          <Text style={styles.statLabel}>days</Text>
        </View>
        <View style={styles.statItem}>
          <Sparkles size={14} color={COLORS.coral} strokeWidth={2} />
          <Text style={styles.statValue}>{vibeEmoji}</Text>
          <Text style={styles.statLabel}>vibe</Text>
        </View>
        <View style={styles.statItem}>
          <DollarSign size={14} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.statValue}>{budgetLabel}</Text>
          <Text style={styles.statLabel}>budget</Text>
        </View>
      </View>

      {/* Estimated cost */}
      {estimatedCost !== null && (
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Estimated trip cost</Text>
          <Text style={styles.costValue}>${estimatedCost.toLocaleString()}</Text>
        </View>
      )}

      {/* CTA */}
      {onPress && (
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>View full itinerary</Text>
          <ChevronRight size={16} color={COLORS.sage} strokeWidth={2} />
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  destBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  destText: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  countryText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: 4,
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.sage + '10',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  costLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  costValue: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});

export default React.memo(TripRecap);
