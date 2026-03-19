// =============================================================================
// ROAM — TravelingSection (TRAVELING state — I Am Here Now, daily brief, expenses)
// =============================================================================
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { ChevronRight, Receipt, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, CARD_SHADOW } from '../../lib/constants';
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
  onSplitPress,
  onBudgetPress,
  budgetComparison,
}: TravelingSectionProps) {
  const { t } = useTranslation();

  const budgetStatus = useMemo(() => {
    if (!budgetComparison) return null;
    const { percentUsed, remaining, daysLeft, totalDays, budget } = budgetComparison;
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

    return { remaining, percentUsed, label, color, budget };
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
    <View style={styles.travelingContainer}>
      <Text style={styles.travelingHeader}>
        {t('plan.traveling.youreIn', { defaultValue: "You're in {{destination}}", destination: activeTrip.destination })}
      </Text>
      <View style={styles.travelingActions}>
        <Pressable
          onPress={onHelpPress}
          accessibilityLabel={t('plan.traveling.needHelp', { defaultValue: 'Need help?' })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.travelingBtn, styles.travelingBtnSage, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.travelingBtnText}>
            {t('plan.traveling.needHelp', { defaultValue: 'Need help?' })}
            {' \u2192'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCapturePress}
          accessibilityLabel={t('plan.traveling.captureBtn', { defaultValue: 'Capture moment' })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.travelingBtn, styles.travelingBtnGold, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.travelingBtnText}>
            {t('plan.traveling.captureBtn', { defaultValue: 'Capture moment' })}
          </Text>
        </Pressable>
      </View>

      {/* Budget Tracker Card */}
      {budgetStatus && (
        <Pressable
          onPress={onBudgetPress}
          accessibilityLabel={`Budget: ${formatBudget(budgetStatus.remaining)} remaining`}
          accessibilityRole="button"
          style={({ pressed }) => [styles.budgetCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={styles.budgetCardIcon}>
            <TrendingUp size={18} color={budgetStatus.color} strokeWidth={1.5} />
          </View>
          <View style={styles.budgetCardContent}>
            <View style={styles.budgetCardRow}>
              <Text style={[styles.budgetCardAmount, { color: budgetStatus.color }]}>
                {formatBudget(budgetStatus.remaining)}
                {budgetStatus.remaining < 0 ? ' over' : ' left'}
              </Text>
              <View style={[styles.budgetStatusBadge, { backgroundColor: budgetStatus.color === COLORS.sage ? COLORS.sageSoft : COLORS.coralSubtle }]}>
                <Text style={[styles.budgetStatusText, { color: budgetStatus.color }]}>
                  {budgetStatus.label}
                </Text>
              </View>
            </View>
            <View style={styles.budgetProgressTrack}>
              <View
                style={[
                  styles.budgetProgressFill,
                  {
                    width: `${Math.min(100, budgetStatus.percentUsed)}%` as unknown as number,
                    backgroundColor: budgetStatus.color,
                  },
                ]}
              />
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      )}

      <Pressable
        onPress={onSplitPress}
        accessibilityLabel={t('plan.traveling.splitCosts', { defaultValue: 'Split costs' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.splitCostsCard, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={styles.splitCostsIcon}>
          <Receipt size={18} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <View style={styles.splitCostsText}>
          <Text style={styles.splitCostsTitle}>
            {t('plan.traveling.splitCosts', { defaultValue: 'Split costs' })}
          </Text>
          <Text style={styles.splitCostsSub}>
            {t('plan.traveling.splitCostsSub', { defaultValue: 'Track expenses & settle up' })}
          </Text>
        </View>
        <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  travelingContainer: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
    ...CARD_SHADOW,
  } as ViewStyle,
  travelingHeader: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  travelingActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  travelingBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  travelingBtnSage: {
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  travelingBtnGold: {
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  travelingBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  // ── Budget card ──
  budgetCard: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...CARD_SHADOW,
  } as ViewStyle,
  budgetCardIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  budgetCardContent: {
    flex: 1,
    gap: SPACING.xs,
  } as ViewStyle,
  budgetCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  budgetCardAmount: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    letterSpacing: -0.3,
  } as TextStyle,
  budgetStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  budgetStatusText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  budgetProgressTrack: {
    height: 4,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  } as ViewStyle,
  budgetProgressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  } as ViewStyle,

  splitCostsCard: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    gap: SPACING.sm,
    ...CARD_SHADOW,
  } as ViewStyle,
  splitCostsIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  splitCostsText: {
    flex: 1,
  } as ViewStyle,
  splitCostsTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  splitCostsSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  } as TextStyle,
});
