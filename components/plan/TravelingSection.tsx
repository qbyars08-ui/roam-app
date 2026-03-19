// =============================================================================
// ROAM — TravelingSection (TRAVELING state — companion mode)
// During a trip, the app should feel like a companion, not a dashboard.
// Hero text, two big buttons, budget mini card if available. Nothing else.
// =============================================================================
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { ChevronRight, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';
import type { BudgetComparison } from '../../lib/budget-tracker';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TravelingSectionProps {
  activeTrip: Trip;
  onHelpPress: () => void;
  onCapturePress: () => void;
  onSplitPress: () => void;
  onBudgetPress: () => void;
  budgetComparison: BudgetComparison | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TravelingSection({
  activeTrip,
  onHelpPress,
  onCapturePress,
  onBudgetPress,
  budgetComparison,
}: TravelingSectionProps) {
  const { t } = useTranslation();

  // Compute current day number
  const dayNumber = useMemo(() => {
    if (!activeTrip.startDate) return 1;
    const start = new Date(activeTrip.startDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [activeTrip.startDate]);

  const budgetStatus = useMemo(() => {
    if (!budgetComparison) return null;
    const { percentUsed, remaining, daysLeft, totalDays } = budgetComparison;
    const expectedPercent = totalDays > 0
      ? ((totalDays - daysLeft) / totalDays) * 100
      : 0;

    let label: string;
    let color: string;
    if (percentUsed > 100) {
      label = 'Over budget';
      color = COLORS.coral;
    } else if (percentUsed < expectedPercent * 0.85) {
      label = 'Under budget';
      color = COLORS.sage;
    } else if (percentUsed > expectedPercent * 1.15) {
      label = 'Spending fast';
      color = COLORS.coral;
    } else {
      label = 'On track';
      color = COLORS.sage;
    }

    return { remaining, percentUsed, label, color };
  }, [budgetComparison]);

  const formatBudget = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  return (
    <View style={styles.container}>
      {/* ── Hero text ── */}
      <Text style={styles.hero}>
        {activeTrip.destination}. {t('plan.traveling.dayX', { defaultValue: 'Day {{day}}.', day: dayNumber })}
      </Text>

      {/* ── Two big buttons ── */}
      <Pressable
        onPress={onHelpPress}
        accessibilityLabel={t('plan.traveling.iAmHereNow', { defaultValue: 'I Am Here Now' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.primaryBtnText}>
          {t('plan.traveling.iAmHereNow', { defaultValue: 'I Am Here Now' })}
        </Text>
      </Pressable>

      <Pressable
        onPress={onCapturePress}
        accessibilityLabel={t('plan.traveling.captureBtn', { defaultValue: 'Capture Moment' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.outlineBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.outlineBtnText}>
          {t('plan.traveling.captureBtn', { defaultValue: 'Capture Moment' })}
        </Text>
      </Pressable>

      {/* ── Budget tracker mini card ── */}
      {budgetStatus && (
        <Pressable
          onPress={onBudgetPress}
          accessibilityLabel={`Budget: ${formatBudget(budgetStatus.remaining)} remaining`}
          accessibilityRole="button"
          style={({ pressed }) => [styles.budgetCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <TrendingUp size={16} color={budgetStatus.color} strokeWidth={1.5} />
          <View style={styles.budgetContent}>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetAmount, { color: budgetStatus.color }]}>
                {formatBudget(budgetStatus.remaining)}
                {budgetStatus.remaining < 0 ? ' over' : ' left'}
              </Text>
              <View style={[styles.budgetBadge, { backgroundColor: budgetStatus.color === COLORS.sage ? COLORS.sageSoft : COLORS.coralSubtle }]}>
                <Text style={[styles.budgetBadgeText, { color: budgetStatus.color }]}>
                  {budgetStatus.label}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, budgetStatus.percentUsed)}%` as unknown as number,
                    backgroundColor: budgetStatus.color,
                  },
                ]}
              />
            </View>
          </View>
          <ChevronRight size={14} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  } as ViewStyle,

  hero: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  } as TextStyle,

  primaryBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: 'center',
  } as ViewStyle,
  primaryBtnText: {
    fontFamily: FONTS.header,
    fontSize: 17,
    color: COLORS.bg,
  } as TextStyle,

  outlineBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.cream,
  } as ViewStyle,
  outlineBtnText: {
    fontFamily: FONTS.header,
    fontSize: 17,
    color: COLORS.cream,
  } as TextStyle,

  budgetCard: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  } as ViewStyle,
  budgetContent: {
    flex: 1,
    gap: SPACING.xs,
  } as ViewStyle,
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  budgetAmount: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    letterSpacing: -0.3,
  } as TextStyle,
  budgetBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  budgetBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  } as ViewStyle,
});
