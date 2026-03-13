// =============================================================================
// ROAM — The Receipt: Shareable Trip Cost Breakdown
// Receipt-style card showing exactly what your trip costs. Screenshot-ready.
// =============================================================================
import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary, type ItineraryDay } from '../lib/types/itinerary';

// =============================================================================
// Helpers
// =============================================================================

/** Strip dollar signs and commas, return number */
function parseCost(str: string): number {
  const cleaned = str.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/** Format number as $X,XXX */
function formatCost(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/** Get a budget tier label */
function getBudgetLabel(budgetId: string): string {
  return BUDGETS.find((b) => b.id === budgetId)?.label ?? budgetId;
}

/** Calculate per-category costs from itinerary days */
function calculateBreakdown(itinerary: Itinerary) {
  const days = itinerary.days;
  let totalMorning = 0;
  let totalAfternoon = 0;
  let totalEvening = 0;
  let totalAccommodation = 0;

  for (const day of days) {
    totalMorning += parseCost(day.morning.cost);
    totalAfternoon += parseCost(day.afternoon.cost);
    totalEvening += parseCost(day.evening.cost);
    totalAccommodation += parseCost(day.accommodation.pricePerNight);
  }

  const budget = itinerary.budgetBreakdown;
  const accommodation = parseCost(budget.accommodation);
  const food = parseCost(budget.food);
  const activities = parseCost(budget.activities);
  const transportation = parseCost(budget.transportation);
  const misc = parseCost(budget.miscellaneous);
  const total = parseCost(itinerary.totalBudget);

  // Daily average
  const perDay = days.length > 0 ? total / days.length : 0;

  // Find most expensive day
  let maxDayCost = 0;
  let maxDayNum = 1;
  for (const day of days) {
    const cost = parseCost(day.dailyCost);
    if (cost > maxDayCost) {
      maxDayCost = cost;
      maxDayNum = day.day;
    }
  }

  // Find cheapest day
  let minDayCost = Infinity;
  let minDayNum = 1;
  for (const day of days) {
    const cost = parseCost(day.dailyCost);
    if (cost < minDayCost) {
      minDayCost = cost;
      minDayNum = day.day;
    }
  }
  if (minDayCost === Infinity) minDayCost = 0;

  return {
    accommodation,
    food,
    activities,
    transportation,
    misc,
    total,
    perDay,
    maxDayCost,
    maxDayNum,
    minDayCost,
    minDayNum,
    days: days.map((d: ItineraryDay) => ({
      day: d.day,
      theme: d.theme,
      cost: parseCost(d.dailyCost),
    })),
  };
}

// =============================================================================
// Main Screen
// =============================================================================
export default function TripReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const trips = useAppStore((s) => s.trips);
  const cardRef = useRef<ViewShot>(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  // Find trip
  const trip = useMemo(() => {
    if (tripId) return trips.find((t) => t.id === tripId) ?? null;
    return trips[0] ?? null;
  }, [tripId, trips]);

  // Parse itinerary
  const itinerary = useMemo(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip]);

  // Calculate breakdown
  const breakdown = useMemo(() => {
    if (!itinerary) return null;
    return calculateBreakdown(itinerary);
  }, [itinerary]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Trip Receipt',
      });
    } catch {
      // Sharing cancelled or failed silently
    }
  }, []);

  // No trip state
  if (!trip || !itinerary || !breakdown) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backBtn}>{'\u2190'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>The Receipt</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>No trip to receipt-ify</Text>
          <Text style={styles.emptyBody}>
            Open one of your trips first, then come back to see what it costs.
          </Text>
        </View>
      </View>
    );
  }

  const dateStr = new Date(trip.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeStr = new Date(trip.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>{'\u2190'}</Text>
        </Pressable>
        <View>
          <Text style={styles.headerEyebrow}>TRIP COST BREAKDOWN</Text>
          <Text style={styles.headerTitle}>The Receipt</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Card */}
        <Animated.View
          style={[
            styles.receiptWrapper,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.receipt}>
              {/* Receipt Header */}
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptBrand}>ROAM</Text>
                <Text style={styles.receiptTagline}>
                  {itinerary.tagline}
                </Text>
              </View>

              {/* Divider */}
              <Text style={styles.divider}>
                {'- - - - - - - - - - - - - - - - - - - - - -'}
              </Text>

              {/* Trip Info */}
              <View style={styles.receiptMeta}>
                <ReceiptRow label="DESTINATION" value={itinerary.destination} />
                <ReceiptRow label="DURATION" value={`${trip.days} days`} />
                <ReceiptRow label="STYLE" value={getBudgetLabel(trip.budget)} />
                <ReceiptRow label="DATE" value={dateStr} />
                <ReceiptRow label="TIME" value={timeStr} />
              </View>

              {/* Divider */}
              <Text style={styles.divider}>
                {'- - - - - - - - - - - - - - - - - - - - - -'}
              </Text>

              {/* Daily Breakdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DAY-BY-DAY</Text>
                {breakdown.days.map((d: { day: number; theme: string; cost: number }) => (
                  <ReceiptRow
                    key={d.day}
                    label={`Day ${d.day} — ${d.theme}`}
                    value={formatCost(d.cost)}
                    isDay
                  />
                ))}
              </View>

              {/* Divider */}
              <Text style={styles.divider}>
                {'- - - - - - - - - - - - - - - - - - - - - -'}
              </Text>

              {/* Category Breakdown */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>BREAKDOWN</Text>
                <ReceiptRow
                  label="Accommodation"
                  value={formatCost(breakdown.accommodation)}
                />
                <ReceiptRow label="Food" value={formatCost(breakdown.food)} />
                <ReceiptRow
                  label="Activities"
                  value={formatCost(breakdown.activities)}
                />
                <ReceiptRow
                  label="Transportation"
                  value={formatCost(breakdown.transportation)}
                />
                <ReceiptRow label="Misc" value={formatCost(breakdown.misc)} />
              </View>

              {/* Double Divider */}
              <Text style={styles.divider}>
                {'= = = = = = = = = = = = = = = = = = = = = ='}
              </Text>

              {/* Total */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>
                  {formatCost(breakdown.total)}
                </Text>
              </View>
              <View style={styles.perDayRow}>
                <Text style={styles.perDayText}>
                  {formatCost(breakdown.perDay)}/day avg
                </Text>
              </View>

              {/* Divider */}
              <Text style={styles.divider}>
                {'- - - - - - - - - - - - - - - - - - - - - -'}
              </Text>

              {/* Fun Stats */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>THE FINE PRINT</Text>
                <Text style={styles.finePrintLine}>
                  Most expensive day: Day {breakdown.maxDayNum} ({formatCost(breakdown.maxDayCost)})
                </Text>
                <Text style={styles.finePrintLine}>
                  Cheapest day: Day {breakdown.minDayNum} ({formatCost(breakdown.minDayCost)})
                </Text>
                {trip.vibes.length > 0 && (
                  <Text style={styles.finePrintLine}>
                    Vibes: {trip.vibes.join(', ')}
                  </Text>
                )}
              </View>

              {/* Footer */}
              <View style={styles.receiptFooter}>
                <Text style={styles.receiptFooterText}>
                  Go somewhere worth it
                </Text>
                <Text style={styles.receiptFooterText}>
                  Go somewhere that changes you.
                </Text>
                <Text style={styles.barcode}>
                  {'||||| |||| ||||| ||| |||| ||||| |||| |||'}
                </Text>
              </View>
            </View>
          </ViewShot>
        </Animated.View>

        {/* Share Button */}
        <Pressable
          style={({ pressed }) => [
            styles.shareBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleShare}
        >
          <LinearGradient
            colors={[COLORS.sage, `${COLORS.sage}CC`]}
            style={styles.shareBtnGradient}
          >
            <Text style={styles.shareBtnText}>Share the Receipt</Text>
          </LinearGradient>
        </Pressable>

        {/* Budget Tier Toggle */}
        <View style={styles.tierCard}>
          <Text style={styles.tierTitle}>How this stacks up</Text>
          <Text style={styles.tierBody}>
            {breakdown.perDay <= 75
              ? "Backpacker territory. You're spending less per day than most people spend on dinner."
              : breakdown.perDay <= 200
              ? 'Comfortable range. Good hotels, real restaurants, zero guilt.'
              : breakdown.perDay <= 500
              ? "Treat yourself tier. You're living well and the trip will prove it."
              : "All out. This is the trip people save screenshots of."}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function ReceiptRow({
  label,
  value,
  isDay,
}: {
  label: string;
  value: string;
  isDay?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text
        style={[styles.rowLabel, isDay && styles.rowLabelDay]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text style={[styles.rowValue, isDay && styles.rowValueDay]}>
        {value}
      </Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backBtn: {
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  headerEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,

  // Empty state
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // Receipt Card
  receiptWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  receipt: {
    backgroundColor: '#FAF8F2',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  receiptHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  receiptBrand: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: '#1A1A1A',
    letterSpacing: 4,
    marginBottom: 4,
  } as TextStyle,
  receiptTagline: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  } as TextStyle,

  // Dividers
  divider: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#CCC',
    textAlign: 'center',
    marginVertical: SPACING.sm,
    letterSpacing: -0.5,
  } as TextStyle,

  // Meta
  receiptMeta: {
    gap: 6,
  } as ViewStyle,

  // Sections
  section: {
    gap: 6,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#999',
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,

  // Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as ViewStyle,
  rowLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: '#333',
    flex: 1,
    marginRight: SPACING.sm,
  } as TextStyle,
  rowLabelDay: {
    fontSize: 11,
    color: '#555',
  } as TextStyle,
  rowValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: '#1A1A1A',
  } as TextStyle,
  rowValueDay: {
    color: '#444',
  } as TextStyle,

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  } as ViewStyle,
  totalLabel: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '700',
    letterSpacing: 2,
  } as TextStyle,
  totalValue: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: '#1A1A1A',
  } as TextStyle,
  perDayRow: {
    alignItems: 'flex-end',
  } as ViewStyle,
  perDayText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#888',
  } as TextStyle,

  // Fine print
  finePrintLine: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#777',
    lineHeight: 16,
  } as TextStyle,

  // Footer
  receiptFooter: {
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: 4,
  } as ViewStyle,
  receiptFooterText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: '#AAA',
    textAlign: 'center',
  } as TextStyle,
  barcode: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: '#DDD',
    letterSpacing: -2,
    marginTop: SPACING.sm,
  } as TextStyle,

  // Share Button
  shareBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  shareBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  shareBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.5,
  } as TextStyle,

  // Tier Card
  tierCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  tierTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  tierBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 22,
  } as TextStyle,
});
