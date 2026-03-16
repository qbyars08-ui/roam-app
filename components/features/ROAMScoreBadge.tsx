// =============================================================================
// ROAM — ROAMScoreBadge
// Reusable score badge component in three sizes:
//   sm  — 40px pill: number + color dot
//   md  — 80px card: number + "ROAM" label + color bar
//   lg  — full card: score, verdict label, six sub-score bars
// =============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { computeROAMScore } from '../../lib/roam-score';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ROAMScoreBadgeProps {
  destination: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Sub-score bar used in the `lg` variant
// ---------------------------------------------------------------------------

interface SubScoreBarProps {
  label: string;
  value: number; // 0–100
  color: string;
}

function SubScoreBar({ label, value, color }: SubScoreBarProps) {
  return (
    <View style={subBarStyles.row}>
      <Text style={subBarStyles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={subBarStyles.track}>
        <View
          style={[
            subBarStyles.fill,
            {
              width: `${value}%` as unknown as number,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={[subBarStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const subBarStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 5,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    width: 56,
    letterSpacing: 0.3,
  } as TextStyle,
  track: {
    flex: 1,
    height: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  } as ViewStyle,
  value: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    width: 22,
    textAlign: 'right',
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ROAMScoreBadge({
  destination,
  size = 'md',
  style,
}: ROAMScoreBadgeProps) {
  const score = useMemo(
    () => computeROAMScore(destination),
    [destination]
  );

  if (size === 'sm') {
    return (
      <View style={[styles.sm, style]}>
        <View style={[styles.smDot, { backgroundColor: score.color }]} />
        <Text style={[styles.smNumber, { color: score.color }]}>
          {score.overall}
        </Text>
      </View>
    );
  }

  if (size === 'md') {
    return (
      <View style={[styles.md, style]}>
        <Text style={[styles.mdNumber, { color: score.color }]}>
          {score.overall}
        </Text>
        <View
          style={[
            styles.mdBar,
            { backgroundColor: score.color + '33' },
          ]}
        >
          <View
            style={[
              styles.mdBarFill,
              {
                width: `${score.overall}%` as unknown as number,
                backgroundColor: score.color,
              },
            ]}
          />
        </View>
        <Text style={styles.mdLabel}>ROAM</Text>
      </View>
    );
  }

  // lg — full card
  const subScores: Array<{ key: string; value: number }> = [
    { key: 'Safety',     value: score.safety },
    { key: 'Value',      value: score.value },
    { key: 'Weather',    value: score.weather },
    { key: 'Crowd',      value: score.crowdLevel },
    { key: 'Unique',     value: score.uniqueness },
    { key: 'Timing',     value: score.timing },
  ];

  return (
    <View style={[styles.lg, style]}>
      {/* Header row */}
      <View style={styles.lgHeader}>
        <View>
          <Text style={styles.lgTitle}>ROAM Score</Text>
          <Text style={[styles.lgLabel, { color: score.color }]}>
            {score.label}
          </Text>
        </View>
        <View style={[styles.lgScoreCircle, { borderColor: score.color + '55' }]}>
          <Text style={[styles.lgScoreNumber, { color: score.color }]}>
            {score.overall}
          </Text>
          <Text style={styles.lgScoreDenom}>/100</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.lgDivider} />

      {/* Sub-score bars */}
      <View style={styles.lgBars}>
        {subScores.map(({ key, value }) => (
          <SubScoreBar
            key={key}
            label={key.toUpperCase()}
            value={value}
            color={score.color}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // sm — 40px pill
  sm: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  } as ViewStyle,
  smDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  smNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    lineHeight: 13,
  } as TextStyle,

  // md — 80px card
  md: {
    width: 80,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  mdNumber: {
    fontFamily: FONTS.header,
    fontSize: 22,
    lineHeight: 26,
  } as TextStyle,
  mdBar: {
    width: '100%',
    height: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  } as ViewStyle,
  mdBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  } as ViewStyle,
  mdLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 1.2,
  } as TextStyle,

  // lg — full card
  lg: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  } as ViewStyle,
  lgHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  } as ViewStyle,
  lgTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  } as TextStyle,
  lgLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
  } as TextStyle,
  lgScoreCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  lgScoreNumber: {
    fontFamily: FONTS.header,
    fontSize: 22,
    lineHeight: 26,
  } as TextStyle,
  lgScoreDenom: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  lgDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  } as ViewStyle,
  lgBars: {
    gap: 0,
  } as ViewStyle,
});
