// =============================================================================
// ROAM — Budget Tracker Screen
// In-trip budget tracker comparing actual spending against itinerary budget
// =============================================================================

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  AlertTriangle,
  Hotel,
  Music,
  Plus,
  ShoppingBag,
  Sparkles,
  Train,
  TrendingUp,
  Utensils,
  HelpCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import { useAppStore, type Trip } from '../lib/store';
import {
  useBudgetTracker,
  type BudgetCategory,
  type CategoryBudget,
  type DailySpend,
} from '../lib/budget-tracker';
import { parseItinerary } from '../lib/types/itinerary';
import type { Itinerary } from '../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Category meta
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  BudgetCategory,
  { label: string; Icon: any; color: string; bg: string }
> = {
  food: {
    label: 'Food & Drinks',
    Icon: Utensils,
    color: COLORS.coral,
    bg: COLORS.coralSubtle,
  },
  transport: {
    label: 'Transport',
    Icon: Train,
    color: COLORS.blueAccent,
    bg: 'rgba(91,155,213,0.15)',
  },
  accommodation: {
    label: 'Accommodation',
    Icon: Hotel,
    color: COLORS.gold,
    bg: COLORS.goldSubtle,
  },
  activities: {
    label: 'Activities',
    Icon: Music,
    color: COLORS.sage,
    bg: COLORS.sageSoft,
  },
  shopping: {
    label: 'Shopping',
    Icon: ShoppingBag,
    color: COLORS.amber,
    bg: 'rgba(240,160,94,0.15)',
  },
  other: {
    label: 'Other',
    Icon: HelpCircle,
    color: COLORS.muted,
    bg: COLORS.surface2,
  },
};

const BUDGET_CATEGORIES: readonly BudgetCategory[] = [
  'food',
  'transport',
  'activities',
  'accommodation',
  'shopping',
  'other',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyPrecise(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Returns a color based on percentage used:
 * 0-60% sage, 60-85% gold, 85%+ coral
 */
function getProgressColor(percent: number): string {
  if (percent >= 85) return COLORS.coral;
  if (percent >= 60) return COLORS.gold;
  return COLORS.sage;
}

function getBudgetStatusLabel(percentUsed: number, daysLeft: number, totalDays: number): {
  label: string;
  color: string;
} {
  if (percentUsed > 100) {
    return { label: 'Over budget', color: COLORS.coral };
  }
  const expectedPercent = totalDays > 0
    ? ((totalDays - daysLeft) / totalDays) * 100
    : 0;

  if (percentUsed < expectedPercent * 0.85) {
    return { label: 'Under budget', color: COLORS.sage };
  }
  if (percentUsed > expectedPercent * 1.15) {
    return { label: 'Spending fast', color: COLORS.coral };
  }
  return { label: 'On track', color: COLORS.sage };
}

function safeParseItinerary(trip: Trip): Itinerary | null {
  try {
    return parseItinerary(trip.itinerary);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Progress Bar component
// ---------------------------------------------------------------------------

function ProgressBar({
  percent,
  height = 8,
  color,
}: {
  percent: number;
  height?: number;
  color?: string;
}) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const barColor = color ?? getProgressColor(percent);

  return (
    <View style={[styles.progressTrack, { height }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${clampedPercent}%` as unknown as number,
            backgroundColor: barColor,
            height,
          },
        ]}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Category Card
// ---------------------------------------------------------------------------

function CategoryCard({
  category,
  data,
}: {
  category: BudgetCategory;
  data: CategoryBudget;
}) {
  const meta = CATEGORY_META[category];
  const { Icon } = meta;
  const color = getProgressColor(data.percentUsed);

  if (data.budgeted === 0 && data.spent === 0) return null;

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryCardHeader}>
        <View style={[styles.categoryIconBg, { backgroundColor: meta.bg }]}>
          <Icon size={16} color={meta.color} strokeWidth={1.5} />
        </View>
        <Text style={styles.categoryCardName}>{meta.label}</Text>
      </View>

      <View style={styles.categoryCardNumbers}>
        <View style={styles.categoryCardCol}>
          <Text style={styles.categoryCardLabel}>Budgeted</Text>
          <Text style={styles.categoryCardValue}>
            {formatCurrency(data.budgeted)}
          </Text>
        </View>
        <View style={styles.categoryCardCol}>
          <Text style={styles.categoryCardLabel}>Spent</Text>
          <Text style={[styles.categoryCardValue, { color }]}>
            {formatCurrency(data.spent)}
          </Text>
        </View>
        <View style={styles.categoryCardCol}>
          <Text style={styles.categoryCardLabel}>Left</Text>
          <Text
            style={[
              styles.categoryCardValue,
              { color: data.remaining < 0 ? COLORS.coral : COLORS.creamDim },
            ]}
          >
            {formatCurrency(Math.abs(data.remaining))}
            {data.remaining < 0 ? ' over' : ''}
          </Text>
        </View>
      </View>

      <ProgressBar percent={data.percentUsed} height={4} color={color} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Daily Breakdown Bar
// ---------------------------------------------------------------------------

function DailyBar({
  day,
  maxAmount,
  dailyBudget,
}: {
  day: DailySpend;
  maxAmount: number;
  dailyBudget: number;
}) {
  const widthPercent =
    maxAmount > 0 ? Math.min(100, (day.amount / maxAmount) * 100) : 0;
  const isOverDaily = day.amount > dailyBudget;
  const barColor = isOverDaily ? COLORS.coral : COLORS.sage;

  return (
    <View style={styles.dailyBarRow}>
      <Text style={styles.dailyBarLabel}>{day.label}</Text>
      <View style={styles.dailyBarTrack}>
        {day.amount > 0 && (
          <View
            style={[
              styles.dailyBarFill,
              {
                width: `${widthPercent}%` as unknown as number,
                backgroundColor: barColor,
              },
            ]}
          />
        )}
        {dailyBudget > 0 && (
          <View
            style={[
              styles.dailyBudgetLine,
              {
                left: `${Math.min(100, (dailyBudget / maxAmount) * 100)}%` as unknown as number,
              },
            ]}
          />
        )}
      </View>
      <Text style={[styles.dailyBarAmount, { color: barColor }]}>
        {day.amount > 0 ? formatCurrencyPrecise(day.amount) : '--'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function BudgetTrackerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const trips = useAppStore((s) => s.trips);

  // Use the most recent trip
  const activeTrip = useMemo(() => {
    return trips.length > 0 ? trips[trips.length - 1] : null;
  }, [trips]);

  const itinerary = useMemo(() => {
    if (!activeTrip) return null;
    return safeParseItinerary(activeTrip);
  }, [activeTrip]);

  const tripId = activeTrip?.id ?? '';
  const currency = 'USD';

  const { comparison, dailyBreakdown, loading } = useBudgetTracker(
    tripId,
    itinerary,
    activeTrip?.startDate,
    currency,
  );

  const dailyBudget = useMemo(() => {
    if (!comparison || comparison.totalDays === 0) return 0;
    return comparison.budget / comparison.totalDays;
  }, [comparison]);

  const maxDailyAmount = useMemo(() => {
    const amounts = dailyBreakdown.map((d) => d.amount);
    return Math.max(dailyBudget, ...amounts, 1);
  }, [dailyBreakdown, dailyBudget]);

  const status = useMemo(() => {
    if (!comparison) return { label: 'No data', color: COLORS.muted };
    return getBudgetStatusLabel(
      comparison.percentUsed,
      comparison.daysLeft,
      comparison.totalDays,
    );
  }, [comparison]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleLogExpense = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/split-expenses' as never);
  }, [router]);

  // Remaining color — sage if positive, coral if negative
  const remainingColor =
    comparison && comparison.remaining < 0 ? COLORS.coral : COLORS.sage;

  const showProjectionWarning =
    comparison &&
    comparison.projectedTotal > comparison.budget &&
    comparison.daysLeft > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Budget Tracker</Text>
          {activeTrip && (
            <Text style={styles.headerSubtitle}>{activeTrip.destination}</Text>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* No itinerary state */}
        {!comparison && (
          <View style={styles.emptyState}>
            <TrendingUp size={40} color={COLORS.muted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No budget data</Text>
            <Text style={styles.emptyBody}>
              Generate a trip itinerary first to start tracking your budget
              against the plan.
            </Text>
          </View>
        )}

        {comparison && (
          <>
            {/* Hero — Remaining Budget */}
            <View style={styles.heroBanner}>
              <Text style={styles.heroLabel}>Remaining</Text>
              <Text style={[styles.heroAmount, { color: remainingColor }]}>
                {formatCurrency(Math.abs(comparison.remaining))}
                {comparison.remaining < 0 ? ' over' : ''}
              </Text>
              <Text style={styles.heroSubtext}>
                of {formatCurrency(comparison.budget)} budget
              </Text>

              {/* Main progress bar */}
              <View style={styles.heroProgressContainer}>
                <ProgressBar percent={comparison.percentUsed} height={10} />
                <View style={styles.heroProgressLabels}>
                  <Text style={styles.heroProgressLabel}>
                    {formatCurrency(comparison.actual)} spent
                  </Text>
                  <Text style={styles.heroProgressLabel}>
                    {Math.round(comparison.percentUsed)}%
                  </Text>
                </View>
              </View>

              {/* Status badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      status.color === COLORS.sage
                        ? COLORS.sageSoft
                        : COLORS.coralSubtle,
                  },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>

              {/* Trip progress */}
              <Text style={styles.tripDaysText}>
                Day {comparison.daysElapsed} of {comparison.totalDays}
                {comparison.daysLeft > 0
                  ? ` \u00B7 ${comparison.daysLeft} days left`
                  : ' \u00B7 Last day'}
              </Text>
            </View>

            {/* Projection warning */}
            {showProjectionWarning && (
              <View style={styles.warningCard}>
                <AlertTriangle
                  size={18}
                  color={COLORS.coral}
                  strokeWidth={1.5}
                />
                <View style={styles.warningText}>
                  <Text style={styles.warningTitle}>Projected overspend</Text>
                  <Text style={styles.warningBody}>
                    At {formatCurrencyPrecise(comparison.dailyBurnRate)}/day, you
                    will spend ~
                    {formatCurrency(comparison.projectedTotal)} total
                    ({formatCurrency(
                      comparison.projectedTotal - comparison.budget,
                    )}{' '}
                    over budget).
                  </Text>
                </View>
              </View>
            )}

            {/* Daily Breakdown */}
            {dailyBreakdown.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Daily Spending</Text>
                <Text style={styles.sectionSubtitle}>
                  Budget: {formatCurrencyPrecise(dailyBudget)}/day
                </Text>
                {dailyBreakdown.map((day) => (
                  <DailyBar
                    key={day.date}
                    day={day}
                    maxAmount={maxDailyAmount}
                    dailyBudget={dailyBudget}
                  />
                ))}
              </View>
            )}

            {/* Category Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Category</Text>
              <View style={styles.categoryGrid}>
                {BUDGET_CATEGORIES.map((cat) => (
                  <CategoryCard
                    key={cat}
                    category={cat}
                    data={comparison.byCategory[cat]}
                  />
                ))}
              </View>
            </View>

            {/* Burn Rate Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Burn Rate</Text>
              <View style={styles.burnRateRow}>
                <View style={styles.burnRateStat}>
                  <Text style={styles.burnRateLabel}>Daily average</Text>
                  <Text style={styles.burnRateValue}>
                    {formatCurrencyPrecise(comparison.dailyBurnRate)}
                  </Text>
                </View>
                <View style={styles.burnRateStat}>
                  <Text style={styles.burnRateLabel}>Projected total</Text>
                  <Text
                    style={[
                      styles.burnRateValue,
                      {
                        color:
                          comparison.projectedTotal > comparison.budget
                            ? COLORS.coral
                            : COLORS.sage,
                      },
                    ]}
                  >
                    {formatCurrency(comparison.projectedTotal)}
                  </Text>
                </View>
                <View style={styles.burnRateStat}>
                  <Text style={styles.burnRateLabel}>Budget/day</Text>
                  <Text style={styles.burnRateValue}>
                    {formatCurrencyPrecise(dailyBudget)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Optimize CTA */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/cost-optimizer',
                  params: {
                    tripId: activeTrip?.id ?? '',
                    destination: activeTrip?.destination ?? '',
                  },
                } as never);
              }}
              style={({ pressed }) => [
                styles.optimizeBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Optimize trip costs"
            >
              <Sparkles size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.optimizeBtnText}>Optimize</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* FAB — Log expense */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + SPACING.lg }]}>
        <TouchableOpacity
          onPress={handleLogExpense}
          style={styles.fab}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Log expense"
        >
          <Plus size={24} color={COLORS.bg} strokeWidth={2} />
        </TouchableOpacity>
      </View>
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

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: -0.3,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  headerRight: {
    width: 40,
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,

  // ── Hero Banner ──
  heroBanner: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  heroLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  heroAmount: {
    fontFamily: FONTS.mono,
    fontSize: 44,
    letterSpacing: -1,
  } as TextStyle,
  heroSubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  } as TextStyle,
  heroProgressContainer: {
    width: '100%',
    marginTop: SPACING.lg,
  } as ViewStyle,
  heroProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  } as ViewStyle,
  heroProgressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,
  statusBadge: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  statusBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } as TextStyle,
  tripDaysText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: SPACING.sm,
  } as TextStyle,

  // ── Progress bar ──
  progressTrack: {
    width: '100%',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    borderRadius: RADIUS.pill,
  } as ViewStyle,

  // ── Warning card ──
  warningCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.coralSubtle,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  } as ViewStyle,
  warningText: {
    flex: 1,
  } as ViewStyle,
  warningTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.coral,
    marginBottom: 2,
  } as TextStyle,
  warningBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 18,
  } as TextStyle,

  // ── Section ──
  section: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginBottom: SPACING.sm,
    marginTop: -SPACING.xs,
  } as TextStyle,

  // ── Category cards ──
  categoryGrid: {
    gap: SPACING.sm,
  } as ViewStyle,
  categoryCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  categoryIconBg: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  categoryCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  categoryCardNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  categoryCardCol: {
    flex: 1,
  } as ViewStyle,
  categoryCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,
  categoryCardValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  // ── Daily breakdown ──
  dailyBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  dailyBarLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    width: 44,
  } as TextStyle,
  dailyBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  dailyBarFill: {
    height: '100%',
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  dailyBudgetLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.creamDim,
  } as ViewStyle,
  dailyBarAmount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    textAlign: 'right',
    minWidth: 56,
  } as TextStyle,

  // ── Burn rate ──
  burnRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  burnRateStat: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  burnRateLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  burnRateValue: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  } as TextStyle,

  // ── Optimize button ──
  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageVeryFaint,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    alignSelf: 'center',
    marginTop: SPACING.md,
  } as ViewStyle,
  optimizeBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.sage,
  } as TextStyle,

  // ── FAB ──
  fabContainer: {
    position: 'absolute',
    right: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  fab: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
});
