// =============================================================================
// ROAM — ChemistryBadge
// Displays a 0-100 compatibility score with optional breakdown bars.
// =============================================================================
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { ChemistryBreakdown } from '../../lib/social-chemistry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChemistryBadgeProps {
  score: number;
  breakdown?: ChemistryBreakdown;
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function scoreColor(score: number): string {
  if (score >= 80) return COLORS.sage;
  if (score >= 60) return COLORS.gold;
  return COLORS.coral;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Great match';
  if (score >= 60) return 'Good match';
  return 'Low match';
}

interface BreakdownBarProps {
  label: string;
  value: number;
  color: string;
}

const BreakdownBar = React.memo<BreakdownBarProps>(({ label, value, color }) => (
  <View style={styles.barRow}>
    <Text style={styles.barLabel}>{label}</Text>
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${value}%` as `${number}%`, backgroundColor: color }]} />
    </View>
    <Text style={[styles.barValue, { color }]}>{value}</Text>
  </View>
));

BreakdownBar.displayName = 'BreakdownBar';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ChemistryBadge = React.memo<ChemistryBadgeProps>(({ score, breakdown, compact = false }) => {
  const clampedScore = useMemo(() => Math.max(0, Math.min(100, Math.round(score))), [score]);
  const color = useMemo(() => scoreColor(clampedScore), [clampedScore]);

  if (compact) {
    return (
      <View style={[styles.pill, { borderColor: color }]}>
        <Text style={[styles.pillScore, { color }]}>{clampedScore}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.circleScore, { color }]}>{clampedScore}%</Text>
        <Text style={[styles.circleLabel, { color }]}>match</Text>
      </View>

      {breakdown !== undefined && (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>{scoreLabel(clampedScore)}</Text>
          <BreakdownBar label="Vibes"  value={breakdown.vibeOverlap}   color={color} />
          <BreakdownBar label="Style"  value={breakdown.styleMatch}    color={color} />
          <BreakdownBar label="Dates"  value={breakdown.dateOverlap}   color={color} />
          <BreakdownBar label="Age"    value={breakdown.ageProximity}  color={color} />
        </View>
      )}
    </View>
  );
});

ChemistryBadge.displayName = 'ChemistryBadge';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleScore: {
    fontFamily: FONTS.header,
    fontSize: 18,
    lineHeight: 20,
  },
  circleLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  pill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillScore: {
    fontFamily: FONTS.mono,
    fontSize: 12,
  },
  breakdown: {
    flex: 1,
    gap: 6,
  },
  breakdownTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  barLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    width: 34,
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  barValue: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    width: 24,
    textAlign: 'right',
  },
});

export default ChemistryBadge;
