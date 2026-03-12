// =============================================================================
// ROAM — Seasonal badge: "Best in Oct" / "Avoid Jul–Aug"
// Shown on Discover cards and destination previews
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getSeasonalBadgeInfo } from '../../lib/seasonal-data';

interface SeasonalBadgeProps {
  destination: string;
  /** Month 1–12; defaults to current month */
  month?: number;
  /** Compact pill or full */
  variant?: 'pill' | 'full';
}

export default function SeasonalBadge({
  destination,
  month = new Date().getMonth() + 1,
  variant = 'pill',
}: SeasonalBadgeProps) {
  const { best, avoid, score } = getSeasonalBadgeInfo(destination, month);

  const inAvoidMonth = avoid && score <= 3;
  const label = inAvoidMonth ? avoid : best;
  if (!label) return null;

  const isPositive = !inAvoidMonth;

  return (
    <View
      style={[
        variant === 'pill' ? styles.pill : styles.full,
        isPositive ? styles.pillGood : styles.pillAvoid,
      ]}
    >
      <Text
        style={[
          variant === 'pill' ? styles.pillText : styles.fullText,
          isPositive ? styles.textGood : styles.textAvoid,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  } as ViewStyle,
  full: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  } as ViewStyle,
  pillGood: {
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  pillAvoid: {
    backgroundColor: COLORS.coralLight,
    borderWidth: 1,
    borderColor: 'rgba(232,97,74,0.4)',
  } as ViewStyle,
  pillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  } as TextStyle,
  fullText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
  } as TextStyle,
  textGood: {
    color: COLORS.sage,
  } as TextStyle,
  textAvoid: {
    color: COLORS.coral,
  } as TextStyle,
});
